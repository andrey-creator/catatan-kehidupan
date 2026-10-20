/* Pemilih tema untuk pembaca. Dimuat di <head> (tanpa defer) agar tema terpasang sebelum halaman tergambar.
   Pilihan disimpan di browser pembaca (localStorage). Warna tiap tema ada di styles.css. */
(function () {
  var KEY = "tema-catatan";
  var T = [["otomatis", "Otomatis"], ["kertas", "Kertas"], ["sepia", "Sepia"], ["hutan", "Hutan"], ["laut", "Laut"], ["senja", "Senja"], ["malam", "Malam"], ["tinta", "Tinta"]];
  var root = document.documentElement;

  function valid(v) { return T.some(function (t) { return t[0] === v; }); }
  function get() { try { var v = localStorage.getItem(KEY); return valid(v) ? v : "otomatis"; } catch (e) { return "otomatis"; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* mode privat: tema berlaku selama halaman terbuka */ } }
  function paintMeta() {
    var m = document.querySelector('meta[name="theme-color"]');
    var c = getComputedStyle(root).getPropertyValue("--bone").trim();
    if (m && c) m.setAttribute("content", c);
  }
  function apply(v) {
    if (v === "otomatis") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", v);
    paintMeta();
  }
  apply(get());
  if (window.matchMedia) {
    var mq = matchMedia("(prefers-color-scheme: dark)");
    var onSys = function () { if (get() === "otomatis") paintMeta(); };
    if (mq.addEventListener) mq.addEventListener("change", onSys);
  }

  function build() {
    paintMeta();
    var host = document.querySelector("nav .links");
    if (!host) return;
    var cur = get();

    var wrap = document.createElement("div"); wrap.className = "tema";
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "tema-btn"; btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-.9.7-1.7 1.7-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r=".8"/><circle cx="10" cy="7.5" r=".8"/><circle cx="14.5" cy="7.5" r=".8"/></svg>Tema';
    wrap.appendChild(btn);
    host.appendChild(wrap);

    var panel = document.createElement("div");
    panel.className = "tema-panel"; panel.hidden = true; panel.setAttribute("role", "group"); panel.setAttribute("aria-label", "Pilih tema");
    var items = T.map(function (t) {
      var b = document.createElement("button");
      b.type = "button"; b.dataset.t = t[0]; b.setAttribute("aria-pressed", String(t[0] === cur));
      var sw = document.createElement("span"); sw.className = "sw"; sw.dataset.t = t[0]; sw.setAttribute("aria-hidden", "true");
      sw.appendChild(document.createElement("i"));
      b.appendChild(sw); b.appendChild(document.createTextNode(t[1]));
      b.onclick = function () {
        cur = t[0]; save(cur); apply(cur);
        items.forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.t === cur)); });
      };
      panel.appendChild(b);
      return b;
    });
    document.body.appendChild(panel);

    function open() {
      panel.style.top = Math.round(btn.getBoundingClientRect().bottom + 8) + "px";
      panel.hidden = false; btn.setAttribute("aria-expanded", "true");
    }
    function close(focus) {
      if (panel.hidden) return;
      panel.hidden = true; btn.setAttribute("aria-expanded", "false");
      if (focus) btn.focus();
    }
    btn.onclick = function () { panel.hidden ? open() : close(); };
    document.addEventListener("click", function (e) { if (!panel.contains(e.target) && !btn.contains(e.target)) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(true); });
    window.addEventListener("resize", function () { close(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
