// scroll-page.mjs — the scroll's one page: a quest or a mage written as nothing but its hashes, a long spell that turns
// between hex and seals, a star that glows with what is read. Used by bin/soul-scroll.mjs (soul.mages.city) and
// bin/guide-scroll.mjs (guide.mages.city). T = {title, desc, h1, epi, colophon ({total} {books} {built}), kinds:[item, thread, root],
// scrollsLine (bin/scrolls.mjs), colours, skynote}. DATA = {books:[{n, root, minted, meta?, objects, edges, seq}], epochs, links?, total, built}.
export function scrollPage(DATA, T) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${T.title}</title>
<meta name="description" content="${T.desc}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="sigil/fonts.css">
<style>
:root{color-scheme:dark;--bg:#07090f;--ink:#d9d2c3;--dim:#7d7a72;--faint:#3a3a40;--gold:#e8c873;--cyan:#9fd6db;--coral:#e5a49c;--violet:#c1c8ef}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--ink)}
body{font:15px/1.6 "Cormorant Garamond",Georgia,serif;background:radial-gradient(ellipse at 70% 0%,#11131d 0,var(--bg) 60%) fixed}
a{color:var(--cyan);text-decoration:none}a:hover{text-decoration:underline}
#sky{position:fixed;left:0;top:0;width:42vw;height:100vh}
#sky canvas{width:100%;height:100%;display:block}
.orbtog{position:absolute;left:18px;bottom:18px;width:32px;height:32px;border-radius:50%;border:1px solid #2a2d38;background:rgba(7,9,15,.7);color:var(--gold);cursor:pointer;font:15px/1 system-ui}
.orbtog.off{color:var(--dim)}
#skynote{position:absolute;left:62px;bottom:24px;font:11px/1.4 ui-monospace,monospace;color:var(--dim);letter-spacing:.04em;max-width:30vw}
main{margin-left:42vw;max-width:880px;padding:64px 48px 160px 32px}
.top{display:flex;justify-content:space-between;align-items:center;font:12px ui-monospace,monospace;color:var(--dim);letter-spacing:.06em}
.mode{display:inline-flex;border:1px solid #2a2d38;border-radius:20px;overflow:hidden;position:fixed;top:16px;right:18px;z-index:6;background:rgba(7,9,15,.88)}
.mode button{background:none;border:0;color:var(--dim);font:12px ui-monospace,monospace;padding:6px 12px;cursor:pointer}.mode button.on{background:#1a1c26;color:var(--gold)}
h1{font:400 clamp(40px,6vw,68px)/1.02 "Cormorant Garamond",Georgia,serif;margin:46px 0 6px;color:var(--ink)}h1 em{color:var(--gold);font-style:italic}
.epi{font-style:italic;font-size:19px;line-height:1.55;color:#bdb6a7;max-width:40em;margin:14px 0 40px}
.book{margin:56px 0 0}.bh{display:flex;align-items:baseline;gap:18px;border-top:1px solid #23252e;padding-top:18px}
.bh .n{font:400 44px/1 "Cormorant Garamond",Georgia,serif;color:var(--gold);min-width:1.6em}.bh .n.w{font-size:30px;min-width:0;white-space:nowrap}
.bh .r{flex:1;min-width:0}.bh .meta{font:11px ui-monospace,monospace;color:var(--dim);letter-spacing:.05em}
.spell{margin-top:16px;line-height:1.95;font-size:15px;text-align:justify;hyphens:none;word-break:break-all;overflow-wrap:anywhere}
.k{cursor:pointer;transition:color .35s,text-shadow .35s;color:#a9a294}
.k.t{color:#6f7d86}
.k.root{color:var(--gold);font-size:1.25em}
.k:hover,.k.hl{color:#fff;text-shadow:0 0 10px rgba(232,200,115,.55)}
.k.read{color:#cfc8b8}.k.t.read{color:#93a8b2}
.sep{color:var(--faint);padding:0 .25em}
body.seal .spell{font-family:"Noto Sans","Noto Sans Ethiopic","Noto Sans Canadian Aboriginal","Segoe UI Historic",system-ui,sans-serif;font-size:17px;letter-spacing:.06em;line-height:1.9;word-break:normal}
body.seal .sep{display:none}
body:not(.seal) .spell{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;letter-spacing:.02em}
.root-seal{font-family:"Noto Sans","Noto Sans Ethiopic","Noto Sans Canadian Aboriginal",system-ui,sans-serif;font-size:22px;letter-spacing:.08em;color:var(--gold);overflow-wrap:anywhere}
.colo{margin-top:80px;border-top:1px solid #23252e;padding-top:22px;font:12.5px/1.8 ui-monospace,monospace;color:var(--dim)}
.colo b{color:var(--ink);font-weight:400}
.scrolls{font:12px/1.9 ui-monospace,monospace;color:var(--dim);margin-top:10px;max-width:60em}.scrolls a{color:var(--dim)}.scrolls a:hover{color:var(--cyan)}.scrolls b{color:var(--gold);font-weight:400}
#tip{position:fixed;right:18px;bottom:18px;max-width:min(560px,52vw);background:rgba(10,12,18,.94);border:1px solid #2a2d38;border-radius:10px;padding:10px 14px;font:11.5px/1.5 ui-monospace,monospace;color:var(--dim);display:none;z-index:5}
#tip .s{font:17px/1.4 "Noto Sans","Noto Sans Ethiopic","Noto Sans Canadian Aboriginal",system-ui,sans-serif;color:var(--gold);letter-spacing:.06em;overflow-wrap:anywhere}
@media(max-width:860px){#sky{position:sticky;width:100%;height:46vh;top:0;z-index:2;background:var(--bg)}main{margin-left:0;padding:24px 16px 120px}#skynote{max-width:60vw}#tip{max-width:calc(100vw - 36px)}}
</style></head><body class="seal">
<div id="sky"><canvas id="cv"></canvas><button class="orbtog" id="orb" type="button" title="orbit on · click to hold the star still">⟳</button><div id="skynote"></div></div>
<main>
<div class="top"><span><a href="https://mages.city/">mages.city</a> · <a href="https://mages.city/arena.html">Evidence</a> · <a href="https://sigil.mages.city/">✍ Sigil</a></span>
<span class="mode" role="group" aria-label="write the scroll as"><button id="m-seal" class="on" type="button">seals</button><button id="m-hex" type="button">hashes</button></span></div>
${T.scrollsLine || ""}
<h1>${T.h1}</h1>
<p class="epi">${T.epi}</p>
<div id="books"></div>
<div class="colo" id="colo"></div>
</main>
<div id="tip"></div>
<script src="sigil/sigilcode.js"></script>
<script>
const DATA=${JSON.stringify(DATA)};
(function(){"use strict";
const S=globalThis.SigilCode,$=id=>document.getElementById(id);
const bytes=h=>Uint8Array.from(h.match(/../g).map(x=>parseInt(x,16)));
const SEAL=new Map(),seal=h=>{let s=SEAL.get(h);if(!s){try{s=S.encode(bytes(h))}catch(e){s=h}SEAL.set(h,s)}return s};
let MODE="seal";
// ---- the star: every hash placed by its bits, as on every star of the City
const bits=(hx,from,n)=>{let v=0;for(let i=0;i<n;i++){const c=parseInt(hx[(from+i)>>2],16),b=(c>>(3-((from+i)&3)))&1;v=v*2+b}return v};
const CV=b=>[(b&1)?1:-1,(b&2)?1:-1,(b&4)?1:-1],par=h=>(h^(h>>1)^(h>>2))&1;
const xyz=hx=>{const house=bits(hx,0,3),sub=bits(hx,3,3),j=[bits(hx,6,3),bits(hx,9,3),bits(hx,12,3)],H=CV(house),Sv=CV(sub);return[0,1,2].map(i=>H[i]+Sv[i]*.3+(j[i]-3.5)*.02)};
const STELLA=[[0,3],[0,5],[0,6],[3,5],[3,6],[5,6],[1,2],[1,4],[1,7],[2,4],[2,7],[4,7]];
const BOOKCOL=${JSON.stringify(T.colours || ["#e8c873","#9fd6db","#c1c8ef","#e5a49c"])};
const PTS=[],LINKS=[];
DATA.books.forEach((B,bi)=>{const base=PTS.length;B.objects.forEach(h=>PTS.push({h,p:xyz(h),b:bi,t:0,lit:0}));const eb=PTS.length;
  B.edges.forEach(([h,s,t])=>{PTS.push({h,p:xyz(h),b:bi,t:1,lit:0});LINKS.push([base+s,base+t,bi])});B._base=base;B._eb=eb;
  PTS.push({h:B.root,p:xyz(B.root),b:bi,t:2,lit:0});B._root=PTS.length-1});
DATA.epochs.forEach(E=>PTS.push({h:E.root,p:xyz(E.root),b:0,t:2,lit:0,ep:1}));
(DATA.links||[]).forEach(([b1,i1,b2,i2])=>{const A=DATA.books[b1],B=DATA.books[b2];if(A&&B)LINKS.push([A._base+i1,B._base+i2,b1])});
const ORB={yaw:.6,pitch:-.32,v:0,on:true,base:.0016,fy:0,fp:0,over:false};
try{const s=localStorage.getItem("mages.orbit");if(s)ORB.on=s==="on"}catch(e){}if(matchMedia("(prefers-reduced-motion: reduce)").matches&&!localStorage.getItem("mages.orbit"))ORB.on=false;
const orb=$("orb");const setOrb=()=>{orb.className="orbtog"+(ORB.on?"":" off");orb.textContent=ORB.on?"⟳":"❚❚"};setOrb();
orb.onclick=()=>{ORB.on=!ORB.on;try{localStorage.setItem("mages.orbit",ORB.on?"on":"off")}catch(e){}setOrb()};
const cv=$("cv"),ctx=cv.getContext("2d");let W=0,H=0,DPR=1;
function size(){DPR=Math.min(2,devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}
function proj(p){const cy=Math.cos(ORB.yaw),sy=Math.sin(ORB.yaw),cp=Math.cos(ORB.pitch),sp=Math.sin(ORB.pitch);const x=p[0]*cy+p[2]*sy,z0=-p[0]*sy+p[2]*cy,y=p[1]*cp-z0*sp,z=p[1]*sp+z0*cp;const s=Math.min(W,H)*.2*(1/(1+z*.12));return{x:W/2+x*s,y:H/2+y*s,z}}
let HOT=-1;
function draw(){ctx.clearRect(0,0,W,H);
  ctx.lineWidth=1;for(const [u,v] of STELLA){const a=proj(CV(u)),b=proj(CV(v));ctx.strokeStyle=par(u)?"rgba(229,164,156,.20)":"rgba(159,214,219,.20)";ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  const Q=PTS.map(p=>proj(p.p));
  ctx.strokeStyle=LINKS.length>3000?"rgba(120,120,140,.035)":"rgba(120,120,140,.07)";ctx.lineWidth=.6;ctx.beginPath();for(const [s,t] of LINKS){if(PTS[s].lit||PTS[t].lit)continue;const a=Q[s],b=Q[t];ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)}ctx.stroke();
  for(const [s,t,bi] of LINKS){const l=Math.max(PTS[s].lit,PTS[t].lit);if(!l)continue;const a=Q[s],b=Q[t];ctx.strokeStyle=BOOKCOL[bi%BOOKCOL.length]+(l>1?"cc":"55");ctx.lineWidth=l>1?1.2:.6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  PTS.forEach((p,i)=>{const q=Q[i],r=p.t===2?3.4:p.t===1?1.1:1.7,a=p.lit>1?1:p.lit?.75:.28;ctx.globalAlpha=a*(.6+.4*Math.max(0,Math.min(1,.62-q.z*.3)));ctx.fillStyle=p.t===2?"#e8c873":BOOKCOL[p.b%BOOKCOL.length];ctx.beginPath();ctx.arc(q.x,q.y,p.lit>1?r+2.4:r,0,6.283);ctx.fill()});
  ctx.globalAlpha=1;if(HOT>=0){const q=Q[HOT];ctx.strokeStyle="#fff";ctx.lineWidth=1;ctx.beginPath();ctx.arc(q.x,q.y,7,0,6.283);ctx.stroke()}}
function tick(){const target=ORB.on?(ORB.over?ORB.base*.25:ORB.base):0;ORB.v+=(target-ORB.v)*.05;if(!target&&Math.abs(ORB.v)<ORB.base*.03)ORB.v=0;
  ORB.yaw+=ORB.v+ORB.fy;ORB.pitch=Math.max(-1.3,Math.min(1.3,ORB.pitch+ORB.fp));ORB.fy*=.92;ORB.fp*=.92;draw();requestAnimationFrame(tick)}
let drag=null;cv.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY};ORB.fy=ORB.fp=0});
addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;ORB.yaw+=dx*.008;ORB.pitch=Math.max(-1.3,Math.min(1.3,ORB.pitch+dy*.008));ORB.fy=dx*.004;ORB.fp=dy*.004;drag={x:e.clientX,y:e.clientY}});
addEventListener("pointerup",()=>{drag=null});cv.addEventListener("pointerenter",()=>ORB.over=true);cv.addEventListener("pointerleave",()=>ORB.over=false);
addEventListener("resize",size);
// ---- the scroll: each record, then the threads drawn from it, book by book
const SPANS=[];
function span(h,i,cls){const el=document.createElement("span");el.className="k"+(cls?" "+cls:"");el.dataset.i=i;el.dataset.h=h;el.textContent=MODE==="seal"?seal(h):h;SPANS.push(el);return el}
const books=$("books");
DATA.books.forEach((B,bi)=>{const sec=document.createElement("section");sec.className="book";
  const n=B.objects.length,m=B.edges.length;
  sec.innerHTML='<div class="bh"><span class="n'+(String(B.n).length>4?' w':'')+'">'+B.n+'</span><span class="r"><div class="root-seal" title="sha256:'+B.root+'">'+seal(B.root)+'</div><div class="meta">'+(B.meta||('sealed '+B.minted+' · '+n+' records · '+m+' threads'))+' · root sha256:'+B.root.slice(0,16)+'…</div></span></div>';
  const sp=document.createElement("div");sp.className="spell";
  B.seq.forEach(([t,ix],j)=>{if(j)sp.appendChild(Object.assign(document.createElement("span"),{className:"sep",textContent:t?"·":"✦"}));
    sp.appendChild(t?span(B.edges[ix][0],B._eb+ix,"t"):span(B.objects[ix],B._base+ix,""))});
  sp.appendChild(Object.assign(document.createElement("span"),{className:"sep",textContent:"✦"}));sp.appendChild(span(B.root,B._root,"root"));
  sec.appendChild(sp);books.appendChild(sec)});
if(DATA.epochs.length){const sec=document.createElement("section");sec.className="book";sec.innerHTML='<div class="bh"><span class="n">V</span><span class="r"><div class="meta">the sealed epochs: earlier roots kept, never rewritten</div></span></div>';const sp=document.createElement("div");sp.className="spell";
  DATA.epochs.forEach((E,j)=>{sp.appendChild(span(E.root,PTS.length-DATA.epochs.length+j,"root"))});sec.appendChild(sp);books.appendChild(sec)}
$("colo").innerHTML=${JSON.stringify(T.colophon)}.replace("{total}",DATA.total).replace("{books}",DATA.books.length).replace("{built}",DATA.built);
// ---- reading: what is on screen glows on the star
const io=new IntersectionObserver(es=>{for(const e of es){const i=+e.target.dataset.i;if(e.isIntersecting){PTS[i].lit=Math.max(PTS[i].lit,1);e.target.classList.add("read")}}},{rootMargin:"-10% 0px -10% 0px"});
SPANS.forEach(s=>io.observe(s));
const tip=$("tip");
document.addEventListener("pointerover",e=>{const s=e.target.closest&&e.target.closest(".k");if(!s)return;const i=+s.dataset.i,h=s.dataset.h;
  document.querySelectorAll(".k.hl").forEach(x=>x.classList.remove("hl"));PTS.forEach(p=>{if(p.lit>1)p.lit=1});HOT=i;PTS[i].lit=2;
  for(const [a,b] of LINKS){if(a===i)PTS[b].lit=2;if(b===i)PTS[a].lit=2}
  document.querySelectorAll('.k[data-i="'+i+'"]').forEach(x=>x.classList.add("hl"));
  const v=(parseInt(h.slice(0,2),16)>>2);tip.style.display="block";tip.innerHTML='<div class="s">'+seal(h)+'</div>sha256:'+h+' · sits at V'+v+' · '+(s.classList.contains("t")?${JSON.stringify(T.kinds[1])}:s.classList.contains("root")?${JSON.stringify(T.kinds[2])}:${JSON.stringify(T.kinds[0])})});
document.addEventListener("click",e=>{const s=e.target.closest&&e.target.closest(".k");if(!s)return;open("https://sigil.mages.city/?a=sha256:"+s.dataset.h,"_blank","noopener")});
// ---- the switch: the whole scroll turns, line by line from where you are reading, into the other script
function setMode(m){if(m===MODE)return;MODE=m;$("m-seal").classList.toggle("on",m==="seal");$("m-hex").classList.toggle("on",m==="hex");
  const anchor=SPANS.find(s=>s.getBoundingClientRect().top>=0),at=anchor?anchor.getBoundingClientRect().top:0,vis=SPANS.map((s,i)=>[i,Math.abs(s.getBoundingClientRect().top)]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
  document.body.classList.toggle("seal",m==="seal");let k=0;const step=()=>{const n=Math.max(12,Math.ceil(vis.length/70));for(let j=0;j<n&&k<vis.length;j++,k++){const s=SPANS[vis[k]];s.textContent=m==="seal"?seal(s.dataset.h):s.dataset.h}if(anchor)scrollBy(0,anchor.getBoundingClientRect().top-at);if(k<vis.length)requestAnimationFrame(step)};step()}
$("m-seal").onclick=()=>setMode("seal");$("m-hex").onclick=()=>setMode("hex");
// a link to one hash (#k=<hex>, from the City's seal reader): open the scroll there, the hash lit with its threads
function goTo(){const m=location.hash.match(/^#k=(?:sha256:)?([0-9a-f]{64})$/);if(!m)return;const s=SPANS.find(x=>x.dataset.h===m[1]);if(!s)return;
  s.scrollIntoView({block:"center"});s.dispatchEvent(new MouseEvent("pointerover",{bubbles:true}));}
addEventListener("hashchange",goTo);setTimeout(goTo,60);
$("skynote").textContent=PTS.length+" hashes on the 64 states · what you read glows · "+${JSON.stringify(T.skynote || "point at a hash to see its threads")};
size();tick();})();
</script></body></html>`;
}
