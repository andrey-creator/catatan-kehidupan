var KEY="catatan-kehidupan:own", mine=[], tagF="Semua", q="";
function load(){try{mine=JSON.parse(localStorage.getItem(KEY)||"[]")||[]}catch(e){mine=[]}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(mine))}catch(e){}}
function all(){return mine.concat(ENTRIES).sort(function(a,b){return a.date<b.date?1:-1})}
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
  document.title="Catatan Kehidupan — Kepingan hidup dalam kata.";
  var h='<header class="hero shell"><div class="meta up"><span>Tulisan pribadi</span><span>Jurnal tulisan · '+new Date().getFullYear()+'</span></div>'+
   '<h1>Catatan<br>Kehidupan</h1><p class="note">Kepingan hidup dalam kata.</p>'+
   '<p class="lede">Pasangan dari Potret Kehidupan: kalau di sana hari-hari saya hadir sebagai gambar, di sini ia hadir sebagai kalimat. Klik sebuah tulisan untuk membacanya.</p></header>'+
   '<section class="shell"><div class="tools"><div class="chips">'+
   tags.map(function(t){return '<button class="chip" aria-pressed="'+(t===tagF)+'" data-tag="'+esc(t)+'">'+esc(t)+'</button>'}).join("")+
   '</div><input class="search" id="q" type="search" placeholder="Cari tulisan…" aria-label="Cari tulisan" value="'+esc(q)+'"></div>';
  h+=f.length?f.map(function(e){
    return '<div class="entry" tabindex="0" role="link" data-id="'+esc(e.id)+'"><time class="up">'+fd(e.date)+'</time>'+
    '<div><h2>'+esc(e.title)+'</h2><p>'+esc(exc(e.body))+'</p></div><div class="up rt"><span class="tag">'+esc(e.tag)+'</span><br>'+rt(e.body)+'</div></div>'}).join(""):'<p class="empty">Belum ada tulisan yang cocok.</p>';
  app.innerHTML=h+'</section>';
  app.querySelectorAll(".chip").forEach(function(b){b.onclick=function(){tagF=b.dataset.tag;list()}});
  var qi=document.getElementById("q");
  qi.oninput=function(){q=qi.value.toLowerCase().trim();var p=qi.selectionStart;list();var n=document.getElementById("q");n.focus();n.setSelectionRange(p,p)};
  app.querySelectorAll(".entry").forEach(function(r){
    var go=function(){location.hash="#/tulisan/"+r.dataset.id};
    r.onclick=go;r.onkeydown=function(e){if(e.key==="Enter")go()}});
}
function read(id){
  var items=all(),i=items.findIndex(function(e){return e.id===id});
  if(i<0){location.hash="#/";return}
  var e=items[i],isMine=mine.some(function(m){return m.id===id});
  document.title=e.title+" — Catatan Kehidupan";
  var nx=items[i-1],pv=items[i+1];
  app.innerHTML='<article><button class="back up" id="bk">← Semua tulisan</button>'+
   '<div class="up mt">'+fd(e.date)+' · <span class="tag">'+esc(e.tag)+'</span> · '+rt(e.body)+'</div>'+
   '<h1>'+esc(e.title)+'</h1><div class="body">'+e.body.split(/\n{2,}/).map(function(p){return "<p>"+esc(p).replace(/\n/g,"<br>")+"</p>"}).join("")+'</div>'+
   (isMine?'<p><button class="back up" id="del">Hapus tulisan ini</button></p>':'')+
   '<div class="pn">'+(pv?'<button data-g="'+esc(pv.id)+'"><span class="up">← Sebelumnya</span><br>'+esc(pv.title)+'</button>':'<span></span>')+
   (nx?'<button class="tr" data-g="'+esc(nx.id)+'"><span class="up">Berikutnya →</span><br>'+esc(nx.title)+'</button>':'')+'</div></article>';
  window.scrollTo(0,0);
  document.getElementById("bk").onclick=function(){location.hash="#/"};
  app.querySelectorAll("[data-g]").forEach(function(b){b.onclick=function(){location.hash="#/tulisan/"+b.dataset.g}});
  var d=document.getElementById("del");
  if(d)d.onclick=function(){if(confirm("Hapus tulisan ini?")){mine=mine.filter(function(m){return m.id!==id});persist();location.hash="#/"}};
}
function route(){var m=location.hash.match(/^#\/tulisan\/(.+)$/);m?read(decodeURIComponent(m[1])):list()}
window.addEventListener("hashchange",route);

var dlg=document.getElementById("dlg"),frm=document.getElementById("frm");
document.getElementById("write").onclick=function(){frm.reset();dlg.showModal()};
document.getElementById("cancel").onclick=function(){dlg.close()};
frm.onsubmit=function(ev){
  ev.preventDefault();
  var t=document.getElementById("f-title").value.trim(),b=document.getElementById("f-body").value.trim();
  if(!t||!b)return;
  var id="u"+Date.now();
  mine.push({id:id,date:new Date().toISOString().slice(0,10),tag:document.getElementById("f-tag").value,title:t,body:b});
  persist();dlg.close();location.hash="#/tulisan/"+id;
};
document.getElementById("yr").textContent=new Date().getFullYear();
var pl=document.getElementById("potret");
if(SITE.potretUrl){pl.href=SITE.potretUrl}else{pl.hidden=true}
load();route();
