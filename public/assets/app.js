var ENTRIES=[], tagF="Semua", q="";
function all(){return ENTRIES.slice().sort(function(a,b){return a.date<b.date?1:-1})}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var BLN=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
function fd(d){var p=d.split("-");return +p[2]+" "+BLN[+p[1]-1]+" "+p[0]}
function rt(b){return Math.max(1,Math.round(b.split(/\s+/).length/200))+" mnt baca"}
var PH=/^\[\[foto:([A-Za-z0-9_-]{6,40})\|([^\]\n]{0,200})\]\]$/,PHA=/\[\[foto:[A-Za-z0-9_-]{6,40}\|[^\]\n]{0,200}\]\]/g;
var LK=/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"']+)/g;
function linkify(raw){
  function a(u,t){return '<a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer nofollow">'+esc(t)+'</a>'}
  var out="",last=0,m;LK.lastIndex=0;
  while((m=LK.exec(raw))){
    out+=esc(raw.slice(last,m.index));
    if(m[1])out+=a(m[2],m[1]);
    else{var t=m[3].match(/^(.*?)([.,;:!?)\]]*)$/);out+=a(t[1],t[1])+esc(t[2])}
    last=m.index+m[0].length}
  return out+esc(raw.slice(last))}
function inlineFormat(raw){
  return linkify(raw).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g,"$1<em>$2</em>")
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g,"$1<em>$2</em>");
}
function bodyHtml(b){
  var blocks=String(b).split(/\n{2,}/),out=[];
  blocks.forEach(function(block){
    var p=block.trim(); if(!p)return;
    var m=p.match(PH);
    if(m){out.push('<figure class="foto"><img src="/foto/'+m[1]+'" alt="'+esc(m[2])+'" loading="lazy">'+(m[2]?'<figcaption>'+esc(m[2])+'</figcaption>':'')+'</figure>');return}
    if(/^###?\s+/.test(p)){var h=p.match(/^(#{2,3})\s+([\s\S]*)$/);if(h){var level=h[1].length+1;out.push("<h"+level+">"+inlineFormat(h[2])+"</h"+level+">");return}}
    if(/^>\s?/.test(p)){out.push('<blockquote>'+p.split("\n").map(function(l){return inlineFormat(l.replace(/^>\s?/,""))}).join("<br>")+'</blockquote>');return}
    var lines=p.split("\n");
    if(lines.every(function(l){return /^\s*[-*+]\s+/.test(l)})){
      out.push("<ul>"+lines.map(function(l){return "<li>"+inlineFormat(l.replace(/^\s*[-*+]\s+/,""))+"</li>"}).join("")+"</ul>");return;
    }
    if(lines.every(function(l){return /^\s*\d+[.)]\s+/.test(l)})){
      out.push("<ol>"+lines.map(function(l){return "<li>"+inlineFormat(l.replace(/^\s*\d+[.)]\s+/,""))+"</li>"}).join("")+"</ol>");return;
    }
    out.push("<p>"+inlineFormat(p).replace(/\n/g,"<br>")+"</p>");
  });
  return out.join("");
}
function exc(b){var t=b.replace(PHA," ").replace(/\[([^\]\n]+)\]\(https?:\/\/[^\s)]+\)/g,"$1").replace(/\s+/g," ").trim();return t.length>150?t.slice(0,150).replace(/\s+\S*$/,"")+"…":t}
var app=document.getElementById("app");

function list(){
  var items=all(),tags=["Semua"];
  items.forEach(function(e){if(tags.indexOf(e.tag)<0)tags.push(e.tag)});
  var f=items.filter(function(e){
    return (tagF==="Semua"||e.tag===tagF)&&(!q||(e.title+" "+e.body).toLowerCase().indexOf(q)>-1)});
  document.title="Catatan Kehidupan — "+SITE.tagline.replace(/\.$/,"")+" — "+SITE.author;
  var h='<header class="hero shell"><div class="meta up"><span>Tulisan pribadi</span><span>Jurnal tulisan · '+new Date().getFullYear()+'</span></div>'+
   '<h1>Catatan<br>Kehidupan</h1><p class="note">'+esc(SITE.tagline)+'</p>'+
   '<p class="lede">Jurnal tulisan pribadi '+esc(SITE.author)+', pasangan dari Potret Kehidupan: kalau di sana hari-hari saya hadir sebagai gambar, di sini ia hadir sebagai kalimat. Klik sebuah tulisan untuk membacanya.</p></header>'+
   '<section class="shell"><div class="tools"><div class="chips">'+
   tags.map(function(t){return '<button class="chip" aria-pressed="'+(t===tagF)+'" data-tag="'+esc(t)+'">'+esc(t)+'</button>'}).join("")+
   '</div><input class="search" id="q" type="search" placeholder="Cari tulisan…" aria-label="Cari tulisan" value="'+esc(q)+'"></div>';
  h+=f.length?f.map(function(e){
    return '<a class="entry" href="/tulisan/'+encodeURIComponent(e.id)+'"><time class="up">'+fd(e.date)+'</time>'+
    '<div><h2>'+esc(e.title)+'</h2><p>'+esc(exc(e.body))+'</p></div><div class="up rt"><span class="tag">'+esc(e.tag)+'</span><br>'+rt(e.body)+'</div></a>'}).join(""):'<p class="empty">Belum ada tulisan yang cocok.</p>';
  app.innerHTML=h+'</section>';
  app.querySelectorAll(".chip").forEach(function(b){b.onclick=function(){tagF=b.dataset.tag;list()}});
  var qi=document.getElementById("q");
  qi.oninput=function(){q=qi.value.toLowerCase().trim();var p=qi.selectionStart;list();var n=document.getElementById("q");n.focus();n.setSelectionRange(p,p)};
}
function read(id){
  var items=all(),i=items.findIndex(function(e){return e.id===id});
  if(i<0){go("/",true);return}
  var e=items[i];
  document.title=e.title+" — Catatan Kehidupan";
  var nx=items[i-1],pv=items[i+1];
  app.innerHTML='<article><a class="back up" href="/">← Semua tulisan</a>'+
   '<div class="up mt">'+fd(e.date)+' · <span class="tag">'+esc(e.tag)+'</span> · '+rt(e.body)+'</div>'+
   '<h1>'+esc(e.title)+'</h1><div class="body">'+bodyHtml(e.body)+'</div>'+shareHtml(e.title,location.origin+"/tulisan/"+encodeURIComponent(e.id))+
      '<div class="pn">'+(pv?'<a href="/tulisan/'+encodeURIComponent(pv.id)+'"><span class="up">← Sebelumnya</span><br>'+esc(pv.title)+'</a>':'<span></span>')+
   (nx?'<a class="tr" href="/tulisan/'+encodeURIComponent(nx.id)+'"><span class="up">Berikutnya →</span><br>'+esc(nx.title)+'</a>':'')+'</div></article>';
  initShare();window.scrollTo(0,0);
}
function shareHtml(title,url){var wa="https://wa.me/?text="+encodeURIComponent(title+"\n"+url);return '<div class="share"><span class="up">Bagikan</span>'+'<button type="button" class="chip" data-copy><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg> Salin tautan</button>'+'<a class="chip" href="'+esc(wa)+'" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/></svg> WhatsApp</a>'+'<button type="button" class="chip" data-share hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M5 12v8h14v-8"/></svg> Lainnya</button>'+'<span class="up share-note" role="status" aria-live="polite"></span></div>'}
function note(btn,msg){var n=btn.closest(".share").querySelector(".share-note");n.textContent=msg;clearTimeout(n._t);n._t=setTimeout(function(){n.textContent=""},2500)}
function copyText(txt){
  if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(txt);
  return new Promise(function(ok,no){var t=document.createElement("textarea");t.value=txt;t.setAttribute("readonly","");t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();
    try{document.execCommand("copy")?ok():no()}catch(e){no(e)}document.body.removeChild(t)})
}
function initShare(){if(navigator.share)app.querySelectorAll("[data-share]").forEach(function(b){b.hidden=false})}
document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest("[data-copy],[data-share]");if(!b)return;
  var h1=app.querySelector("article h1"),title=h1?h1.textContent:document.title,url=location.origin+location.pathname;
  if(b.hasAttribute("data-copy")){copyText(url).then(function(){note(b,"Tautan disalin ✓")},function(){note(b,"Gagal menyalin. Salin dari bilah alamat.")})}
  else{navigator.share({title:title,url:url}).catch(function(){})}
});
var navigated=false;
function focusTop(){var h=app.querySelector("h1");if(h){h.setAttribute("tabindex","-1");h.focus({preventScroll:true})}}
function go(path,replace){history[replace?"replaceState":"pushState"](null,"",path);navigated=true;route();if(!replace)window.scrollTo(0,0)}
function route(){
  if(/^\/tentang\/?$/.test(location.pathname)){if(!app.querySelector(".about"))location.reload();return}
  var h=location.hash.match(/^#\/tulisan\/(.+)$/);
  if(h){history.replaceState(null,"","/tulisan/"+h[1])}
  var m=location.pathname.match(/^\/tulisan\/([^\/]+)\/?$/);
  var id=null;if(m){try{id=decodeURIComponent(m[1])}catch(e){}}
  id?read(id):list();
  if(navigated){navigated=false;focusTop()}
  if(window.readerSync)readerSync();
}
window.addEventListener("popstate",function(){navigated=true;route()});
document.addEventListener("click",function(e){
  if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  var a=e.target.closest&&e.target.closest("a[href]");
  if(!a||a.target||a.origin!==location.origin)return;
  if(a.pathname==="/"||/^\/tulisan\/[^\/]+\/?$/.test(a.pathname)){e.preventDefault();go(a.pathname+a.search)}
});

document.getElementById("yr").textContent=new Date().getFullYear();
document.getElementById("au").textContent=SITE.author;
var pl=document.getElementById("potret");
if(SITE.potretUrl){pl.href=SITE.potretUrl}else{pl.hidden=true}
if(!app.firstElementChild)app.innerHTML='<p class="shell empty">Memuat tulisan…</p>';
fetch("/api/entries").then(function(r){if(!r.ok)throw new Error();return r.json()}).then(function(d){ENTRIES=d;route()}).catch(function(){app.innerHTML='<p class="shell empty">Tulisan belum bisa dimuat. Coba muat ulang halaman.</p>'});
