/* Impor isi tulisan dari berkas .txt, .md, atau .docx.
   Semuanya diproses di browser (berkas tidak dikirim ke server); hasilnya hanya
   mengisi kolom editor, lalu disimpan lewat tombol Simpan seperti biasa. */
(function () {
  var MAX_FILE = 5 * 1024 * 1024; // 5 MB

  function fail(msg) { return Promise.reject(new Error(msg)); }

  function readBuffer(file) {
    if (file.arrayBuffer) return file.arrayBuffer();
    return new Promise(function (ok, no) {
      var r = new FileReader();
      r.onload = function () { ok(r.result); };
      r.onerror = function () { no(new Error("Gagal membaca berkas.")); };
      r.readAsArrayBuffer(file);
    });
  }

  function decodeText(buf) {
    var u8 = new Uint8Array(buf);
    // Excel/Notepad lama sering menaruh BOM; TextDecoder utf-8 membuangnya.
    return new TextDecoder("utf-8").decode(u8).replace(/^\uFEFF/, "");
  }

  function tidy(s) {
    return s.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  /* ---------- .txt ---------- */
  function fromTxt(text) {
    return { title: "", body: tidy(text) };
  }

  /* ---------- .md ----------
     Isi tulisan ditampilkan sebagai teks biasa, jadi tanda Markdown dirapikan agar tidak muncul mentah. */
  function fromMd(text) {
    var title = "";
    var s = text.replace(/\r\n?/g, "\n");
    s = s.replace(/^---\n[\s\S]*?\n---\n/, ""); // front matter
    var m = s.match(/^\s*#\s+(.+?)\s*#*\s*$/m);
    if (m) {
      title = m[1].replace(/[*_`]/g, "").trim();
      s = s.replace(m[0], "");
    }
    s = s
      .replace(/```[^\n]*\n([\s\S]*?)```/g, "$1")      // blok kode: simpan isinya
      .replace(/^[ \t]{0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/gm, "$1") // judul bagian
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")          // gambar -> teks alternatif
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")           // tautan -> teks tautan
      .replace(/(\*\*|__)(.+?)\1/g, "$2")                // tebal
      .replace(/(^|[^\w*])\*(?!\s)(.+?)\*(?!\w)/g, "$1$2") // miring *
      .replace(/(^|[^\w_])_(?!\s)(.+?)_(?!\w)/g, "$1$2")   // miring _
      .replace(/`([^`]+)`/g, "$1")                       // kode satu baris
      .replace(/^[ \t]{0,3}>[ \t]?/gm, "")                     // kutipan
      .replace(/^[ \t]{0,3}([-*+])[ \t]+/gm, "• ")             // daftar
      .replace(/^[ \t]{0,3}([-*_])([ \t]*\1){2,}[ \t]*$/gm, "");   // garis pemisah
    return { title: title, body: tidy(s) };
  }

  /* ---------- .docx ---------- */
  function u16(v, o) { return v.getUint16(o, true); }
  function u32(v, o) { return v.getUint32(o, true); }

  function inflateRaw(bytes) {
    if (typeof DecompressionStream === "undefined") {
      return fail("Browser ini belum mendukung impor .docx. Perbarui browser, atau simpan berkas sebagai .txt.");
    }
    var ds = new DecompressionStream("deflate-raw");
    var stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Response(stream).arrayBuffer();
  }

  // Mengambil satu berkas dari arsip ZIP (docx adalah ZIP) lewat daftar pusat (central directory).
  function zipEntry(buf, wanted) {
    var v = new DataView(buf), u8 = new Uint8Array(buf);
    var eocd = -1;
    for (var i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
      if (u32(v, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return null;
    var count = u16(v, eocd + 10), p = u32(v, eocd + 16);
    for (var n = 0; n < count; n++) {
      if (p + 46 > buf.byteLength || u32(v, p) !== 0x02014b50) return null;
      var method = u16(v, p + 10), csize = u32(v, p + 20), usize = u32(v, p + 24);
      var nl = u16(v, p + 28), el = u16(v, p + 30), cl = u16(v, p + 32), lho = u32(v, p + 42);
      var name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl));
      if (name === wanted) {
        if (u32(v, lho) !== 0x04034b50) return null;
        var start = lho + 30 + u16(v, lho + 26) + u16(v, lho + 28);
        return { method: method, data: u8.subarray(start, start + csize), size: usize };
      }
      p += 46 + nl + el + cl;
    }
    return null;
  }

  function xmlText(s) {
    return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, function (_, e) {
      switch (e.toLowerCase()) {
        case "amp": return "&"; case "lt": return "<"; case "gt": return ">";
        case "quot": return '"'; case "apos": return "'";
      }
      var code = e.charAt(1).toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(code); } catch (x) { return ""; }
    });
  }

  function fromDocxXml(xml) {
    var paras = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
    var out = [], title = "";
    paras.forEach(function (p, idx) {
      var style = (p.match(/<w:pStyle w:val="([^"]*)"/) || [])[1] || "";
      var inList = /<w:numPr>/.test(p) || /^(List|Daftar)/i.test(style);
      var text = "";
      var re = /<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>|<w:cr\/>/g, m;
      while ((m = re.exec(p))) {
        if (m[1] != null) text += xmlText(m[1]);
        else if (m[0] === "<w:tab/>") text += "\t";
        else text += "\n";
      }
      text = text.replace(/[ \t]+$/g, "").replace(/^\n+|\n+$/g, "");
      if (!text.trim()) return;
      if (!title && out.length === 0 && /^(Title|Judul|Heading1|Heading 1)$/i.test(style) && text.length <= 120) {
        title = text.trim();
        return;
      }
      out.push((inList ? "• " : "") + text);
    });
    return { title: title, body: tidy(out.join("\n\n")) };
  }

  function fromDocx(buf) {
    var ent = zipEntry(buf, "word/document.xml");
    if (!ent) return fail("Berkas .docx tidak valid atau rusak.");
    var get = ent.method === 0 ? Promise.resolve(ent.data)
      : ent.method === 8 ? inflateRaw(ent.data)
      : fail("Format kompresi .docx ini tidak didukung.");
    return get.then(function (raw) {
      return fromDocxXml(new TextDecoder("utf-8").decode(raw));
    });
  }

  /* ---------- pintu masuk ---------- */
  function read(file) {
    if (!file) return fail("Pilih berkas dulu.");
    var name = (file.name || "").toLowerCase();
    var ext = (name.match(/\.([a-z0-9]+)$/) || [])[1] || "";
    if (["txt", "md", "markdown", "docx"].indexOf(ext) < 0) {
      return fail(ext === "doc" ? "Format .doc lama tidak didukung. Simpan ulang sebagai .docx." : "Format tidak didukung. Gunakan .txt, .md, atau .docx.");
    }
    if (file.size > MAX_FILE) return fail("Berkas terlalu besar (maks. 5 MB).");
    return readBuffer(file).then(function (buf) {
      if (ext === "docx") return fromDocx(buf);
      var text = decodeText(buf);
      return ext === "txt" ? fromTxt(text) : fromMd(text);
    }).then(function (r) {
      if (!r.body) throw new Error("Berkas tidak berisi teks.");
      return r;
    });
  }

  window.ImportFile = { read: read, _parts: { fromMd: fromMd, fromTxt: fromTxt, fromDocxXml: fromDocxXml, fromDocx: fromDocx } };
})();
