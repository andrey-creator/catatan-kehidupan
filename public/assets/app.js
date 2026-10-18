var ENTRIES=[], tagF="Semua", q="";
function all(){return ENTRIES.slice().sort(function(a,b){return a.date<b.date?1:-1})}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var BLN=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
function fd(d){var p=d.split("-");return +p[2]+" "+BLN[+p[1]-1]+" "+p[0]}
function rt(b){return Math.max(1,Math.round(b.split(/\s+/).length/200))+" mnt baca"}
function exc(b){var t=b.replace(/\n+/g," ");return t.length>150?t.slice(0,150).replace(/\s+\S*$/,"")+"…":t}
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
   '<h1>'+esc(e.title)+'</h1><div class="body">'+e.body.split(/\n{2,}/).map(function(p){return "<p>"+esc(p).replace(/\n/g,"<br>")+"</p>"}).join("")+'</div>'+
      '<div class="pn">'+(pv?'<a href="/tulisan/'+encodeURIComponent(pv.id)+'"><span class="up">← Sebelumnya</span><br>'+esc(pv.title)+'</a>':'<span></span>')+
   (nx?'<a class="tr" href="/tulisan/'+encodeURIComponent(nx.id)+'"><span class="up">Berikutnya →</span><br>'+esc(nx.title)+'</a>':'')+'</div></article>';
  window.scrollTo(0,0);
}
function go(path,replace){history[replace?"replaceState":"pushState"](null,"",path);route()}
function route(){
  if(/^\/tentang\/?$/.test(location.pathname)){if(!app.querySelector(".about"))location.reload();return}
  var h=location.hash.match(/^#\/tulisan\/(.+)$/);
  if(h){history.replaceState(null,"","/tulisan/"+h[1])}
  var m=location.pathname.match(/^\/tulisan\/([^\/]+)\/?$/);
  var id=null;if(m){try{id=decodeURIComponent(m[1])}catch(e){}}
  id?read(id):list();
}
window.addEventListener("popstate",route);
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
