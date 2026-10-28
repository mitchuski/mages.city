// scroll-page.mjs — the scroll's one page: a quest or a mage written as nothing but its hashes, a long spell that turns
// between hex and seals, a star that glows with what is read. Used by bin/soul-scroll.mjs (soul.mages.city) and
// bin/guide-scroll.mjs (guide.mages.city). T = {title, desc, h1, epi, colophon ({total} {books} {built}), kinds:[item, thread, root],
// scrollsLine (bin/scrolls.mjs), colours, skynote}. DATA = {books:[{n, root, b3?, minted, meta?, objects, edges, seq}], epochs, links?, total, built, lazy?}.
// lazy: each book's objects are bundle roots whose records sit in b/<root>.json ({objects, edges, seq}), opened on click.
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
.spell .bm{display:block;font:11px ui-monospace,monospace;color:var(--dim);letter-spacing:.05em;margin-bottom:.3em}.spell .run,.spell .ch{display:block;content-visibility:auto;contain-intrinsic-size:auto 300px}.spell .ch:not(:last-child){text-align-last:justify}.spell .sub{display:block;margin:.5em 0 .9em .4em;padding-left:.9em;border-left:1px solid rgba(232,200,115,.28)}.k.shut{text-decoration:underline dotted rgba(232,200,115,.5);text-underline-offset:.25em;cursor:pointer}.k.opened{color:var(--gold);cursor:pointer}.spell .sub.folded{display:none}.k.opened.folded{text-decoration:underline dotted rgba(232,200,115,.5);text-underline-offset:.25em}
.k:hover,.k.hl{color:#fff;text-shadow:0 0 10px rgba(232,200,115,.55)}
.k.read{color:#cfc8b8}.k.t.read{color:#93a8b2}
.sep{color:var(--faint);padding:0 .25em}
body.seal .spell{font-family:"Noto Sans","Noto Sans Ethiopic","Noto Sans Canadian Aboriginal","Segoe UI Historic",system-ui,sans-serif;font-size:17px;letter-spacing:.06em;line-height:1.9;word-break:normal}
body.seal .sep{display:none}
body:not(.seal) .spell{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;letter-spacing:.02em}
.root-seal{font-family:"Noto Sans","Noto Sans Ethiopic","Noto Sans Canadian Aboriginal",system-ui,sans-serif;font-size:22px;letter-spacing:.08em;color:var(--gold);overflow-wrap:anywhere}
.colo{margin-top:80px;border-top:1px solid #23252e;padding-top:22px;font:12.5px/1.8 ui-monospace,monospace;color:var(--dim)}
.colo b{color:var(--ink);font-weight:400}
.lanes{font:12.5px/1.9 ui-monospace,monospace;color:var(--dim);margin-top:6px}.lanes a{color:var(--cyan)}
.scrolls{font:12px/1.9 ui-monospace,monospace;color:var(--dim);margin-top:10px;max-width:60em}.scrolls a{color:var(--dim)}.scrolls a:hover{color:var(--cyan)}.scrolls b{color:var(--gold);font-weight:400}
#tip{position:fixed;right:18px;bottom:18px;max-width:min(560px,52vw);background:rgba(10,12,18,.94);border:1px solid #2a2d38;border-radius:10px;padding:10px 14px;font:11.5px/1.5 ui-monospace,monospace;color:var(--dim);display:none;z-index:5}
#tip.pin{border-color:#4a4330;color:var(--ink)}#tip.pin .s{padding-right:30px}#tip .h{overflow-wrap:anywhere;color:var(--ink);margin:2px 0}#tip .hint{margin-top:4px;color:var(--faint)}#tip .x{position:absolute;right:8px;top:6px;background:none;border:0;color:var(--dim);font:18px/1 system-ui;cursor:pointer;padding:4px 6px}
#tip .acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}#tip .acts button,#tip .acts a{font:12px ui-monospace,monospace;padding:7px 12px;border-radius:16px;border:1px solid #2a2d38;background:#12141c;color:var(--ink);cursor:pointer;text-decoration:none}#tip .acts .prove{border-color:#5a4d2a;color:var(--gold)}#tip .acts button,#tip .acts a{font-size:18px;line-height:1;min-width:52px;text-align:center}
#tip .s{font:17px/1.4 "Noto Sans","Noto Sans Ethiopic","Noto Sans Canadian Aboriginal",system-ui,sans-serif;color:var(--gold);letter-spacing:.06em;overflow-wrap:anywhere}
@media(max-width:860px){#sky{position:sticky;width:100%;height:46vh;top:0;z-index:2;background:var(--bg)}main{margin-left:0;padding:24px 16px 120px}#skynote{max-width:60vw}#tip{left:10px;right:10px;bottom:10px;max-width:none;padding:12px 14px calc(12px + env(safe-area-inset-bottom))}#tip .acts button,#tip .acts a{flex:1;text-align:center;padding:10px 8px}.k{-webkit-tap-highlight-color:transparent}}
</style></head><body class="seal">
<div id="sky"><canvas id="cv"></canvas><button class="orbtog" id="orb" type="button" title="orbit on · click to hold the star still">⟳</button><div id="skynote"></div></div>
<main>
<div class="top"><span><a href="https://mages.city/">mages.city</a> · <a href="https://mages.city/arena.html">Evidence</a> · <a href="https://sigil.mages.city/">✍ Sigil</a></span>
<span class="mode" role="group" aria-label="write the scroll as"><button id="m-seal" class="on" type="button">seals</button><button id="m-hex" type="button">hashes</button></span></div>
${T.scrollsLine || ""}${T.topLine || ""}
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
const BOOKNAME=${JSON.stringify(T.bookNames || [])};
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
// tens of thousands of hashes each frame: projected into typed arrays, then drawn in a few batched paths (one per colour,
// glow and depth band) instead of one path per hash; a hash just unrolled fades in over its first second (p.born)
let QX=new Float32Array(0),QY=QX,QZ=QX;const NC=BOOKCOL.length,BK=Array.from({length:(NC+1)*6},()=>[]),FADE=900;
function draw(){ctx.clearRect(0,0,W,H);const now=performance.now();
  ctx.lineWidth=1;for(const [u,v] of STELLA){const a=proj(CV(u)),b=proj(CV(v));ctx.strokeStyle=par(u)?"rgba(229,164,156,.20)":"rgba(159,214,219,.20)";ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  const N=PTS.length;if(QX.length<N){const c=Math.max(N,QX.length*2);QX=new Float32Array(c);QY=new Float32Array(c);QZ=new Float32Array(c)}
  const cy=Math.cos(ORB.yaw),sy=Math.sin(ORB.yaw),cp=Math.cos(ORB.pitch),sp=Math.sin(ORB.pitch),s0=Math.min(W,H)*.2,w2=W/2,h2=H/2;
  for(let i=0;i<N;i++){const p=PTS[i].p,x=p[0]*cy+p[2]*sy,z0=-p[0]*sy+p[2]*cy,y=p[1]*cp-z0*sp,z=p[1]*sp+z0*cp,s=s0/(1+z*.12);QX[i]=w2+x*s;QY[i]=h2+y*s;QZ[i]=z}
  const up=i=>!(PTS[i].born>now);
  ctx.strokeStyle=LINKS.length>3000?"rgba(120,120,140,.035)":"rgba(120,120,140,.07)";ctx.lineWidth=.6;ctx.beginPath();for(const [s,t] of LINKS){if(PTS[s].lit||PTS[t].lit||!up(s)||!up(t))continue;ctx.moveTo(QX[s],QY[s]);ctx.lineTo(QX[t],QY[t])}ctx.stroke();
  for(let c=0;c<NC;c++)for(const hi of [0,1]){let any=false;
    for(const [s,t,bi] of LINKS){if(bi%NC!==c)continue;const l=Math.max(PTS[s].lit,PTS[t].lit);if(!l||(l>1)!==!!hi)continue;if(!any){ctx.strokeStyle=BOOKCOL[c]+(hi?"cc":"55");ctx.lineWidth=hi?1.2:.6;ctx.beginPath();any=true}ctx.moveTo(QX[s],QY[s]);ctx.lineTo(QX[t],QY[t])}
    if(any)ctx.stroke()}
  for(const b of BK)b.length=0;const one=[];
  for(let i=0;i<N;i++){const P=PTS[i];if(P.born>now)continue;if(P.lit>1||now-P.born<FADE){one.push(i);continue}
    const d=.6+.4*Math.max(0,Math.min(1,.62-QZ[i]*.3)),band=d<.73?0:d<.87?1:2;BK[((P.t===2?NC:P.b%NC)*2+(P.lit?1:0))*3+band].push(i)}
  const R=P=>P.t===2?3.4:P.t===1?1.1:1.7;
  BK.forEach((b,k)=>{if(!b.length)return;const band=k%3,lit=(k/3|0)%2,ci=(k/6|0);ctx.globalAlpha=(lit?.75:.28)*[.67,.8,.93][band];ctx.fillStyle=ci===NC?"#e8c873":BOOKCOL[ci];ctx.beginPath();
    for(const i of b){const P=PTS[i],r=R(P);if(P.t===2){ctx.moveTo(QX[i]+r,QY[i]);ctx.arc(QX[i],QY[i],r,0,6.283)}else ctx.rect(QX[i]-r,QY[i]-r,2*r,2*r)}ctx.fill()});
  for(const i of one){const P=PTS[i],r=R(P),f=Math.min(1,(now-P.born)/FADE),a=P.lit>1?1:P.lit?.75:.28;ctx.globalAlpha=a*f*(.6+.4*Math.max(0,Math.min(1,.62-QZ[i]*.3)));ctx.fillStyle=P.t===2?"#e8c873":BOOKCOL[P.b%NC];ctx.beginPath();ctx.arc(QX[i],QY[i],(P.lit>1?r+2.4:r)*(1.6-.6*f),0,6.283);ctx.fill()}
  ctx.globalAlpha=1;if(HOT>=0&&HOT<N){ctx.strokeStyle="#fff";ctx.lineWidth=1;ctx.beginPath();ctx.arc(QX[HOT],QY[HOT],7,0,6.283);ctx.stroke()}}
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
  sec.innerHTML='<div class="bh"><span class="n'+(String(B.n).length>4?' w':'')+'">'+B.n+'</span><span class="r"><div class="root-seal" title="sha256:'+B.root+'">'+seal(B.root)+'</div><div class="meta">'+(BOOKNAME[bi]?BOOKNAME[bi]+' · ':'')+(B.meta||(DATA.lazy?n+' sealed bundles · tap a bundle’s root to fold it':'sealed '+B.minted+' · '+n+' records · '+m+' threads'))+' · root sha256:'+B.root.slice(0,16)+'…'+(B.b3?' · BLAKE3 '+B.b3.slice(0,16)+'…':'')+'</div></span></div>';
  const sp0=document.createElement("div");sp0.className="spell";const sp=DATA.lazy?sp0.appendChild(Object.assign(document.createElement("div"),{className:"run"})):sp0;
  B.seq.forEach(([t,ix],j)=>{if(j)sp.appendChild(Object.assign(document.createElement("span"),{className:"sep",textContent:t?"·":"✦"}));
    sp.appendChild(t?span(B.edges[ix][0],B._eb+ix,"t"):span(B.objects[ix],B._base+ix,DATA.lazy?"shut":""))});
  sp.appendChild(Object.assign(document.createElement("span"),{className:"sep",textContent:"✦"}));sp.appendChild(span(B.root,B._root,"root"));
  sec.appendChild(sp0);books.appendChild(sec)});
if(DATA.epochs.length){const sec=document.createElement("section");sec.className="book";sec.innerHTML='<div class="bh"><span class="n">V</span><span class="r"><div class="meta">the sealed epochs: earlier roots kept, never rewritten</div></span></div>';const sp=document.createElement("div");sp.className="spell";
  DATA.epochs.forEach((E,j)=>{sp.appendChild(span(E.root,PTS.length-DATA.epochs.length+j,"root"))});sec.appendChild(sp);books.appendChild(sec)}
$("colo").innerHTML=${JSON.stringify(T.colophon)}.replace("{total}",DATA.total).replace("{books}",DATA.books.length).replace("{built}",DATA.built);
// ---- reading: what is on screen glows on the star
const io=new IntersectionObserver(es=>{for(const e of es){const i=+e.target.dataset.i;if(e.isIntersecting){PTS[i].lit=Math.max(PTS[i].lit,1);e.target.classList.add("read")}}},{rootMargin:matchMedia("(max-width:860px)").matches?"-50% 0px -8% 0px":"-10% 0px -10% 0px"});
SPANS.forEach(s=>io.observe(s));
const tip=$("tip");let PIN=null;
// what a hash is, in words, on this scroll
function kindOf(s){if(s.classList.contains("shut"))return "a sealed bundle’s root · tap it again to open its records";
  if(s.classList.contains("opened"))return s.classList.contains("folded")?"a sealed bundle’s root · tap it again to unfold its records":"a sealed bundle’s root · tap it again to fold its records away";
  return s.classList.contains("t")?${JSON.stringify(T.kinds[1])}:s.classList.contains("root")?${JSON.stringify(T.kinds[2])}:${JSON.stringify(T.kinds[0])}}
// light one hash and its threads on the star; the card says what it is. A mouse previews on hover; a tap or click
// selects it and pins the card with its three acts: copy the hash, copy the seal, prove it on Sigil.
function show(s,pin){const i=+s.dataset.i,h=s.dataset.h;
  document.querySelectorAll(".k.hl").forEach(x=>x.classList.remove("hl"));PTS.forEach(p=>{if(p.lit>1)p.lit=1});HOT=i;PTS[i].lit=2;
  for(const [a,b] of LINKS){if(a===i)PTS[b].lit=2;if(b===i)PTS[a].lit=2}
  document.querySelectorAll('.k[data-i="'+i+'"]').forEach(x=>x.classList.add("hl"));
  const v=(parseInt(h.slice(0,2),16)>>2);PIN=pin?s:null;tip.style.display="block";tip.classList.toggle("pin",!!pin);
  tip.innerHTML=(pin?'<button class="x" type="button" aria-label="close">×</button>':'')+'<div class="s">'+seal(h)+'</div><div class="h">sha256:'+h+'</div>sits at V'+v+' · '+kindOf(s)+
    (pin?'<div class="acts"><button type="button" data-act="hash" title="copy the hash" aria-label="copy the hash">🔢</button><button type="button" data-act="seal" title="copy the seal" aria-label="copy the seal">🔏</button><a class="prove" href="https://sigil.mages.city/?a=sha256:'+h+'" target="_blank" rel="noopener" title="prove it on Sigil" aria-label="prove it on Sigil">✍</a></div>':'<div class="hint">click to select · 🔢 hash · 🔏 seal · ✍ prove on Sigil</div>')}
function unpin(){PIN=null;tip.style.display="none";tip.classList.remove("pin");document.querySelectorAll(".k.hl").forEach(x=>x.classList.remove("hl"));PTS.forEach(p=>{if(p.lit>1)p.lit=1});HOT=-1}
document.addEventListener("pointerover",e=>{if(e.pointerType!=="mouse"||PIN)return;const s=e.target.closest&&e.target.closest(".k");if(s)show(s,false)});
tip.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b||!PIN)return;e.stopPropagation();
  if(b.classList.contains("x")){unpin();return}
  const h=PIN.dataset.h,t=b.dataset.act==="seal"?seal(h):"sha256:"+h,was=b.textContent;
  try{await navigator.clipboard.writeText(t);b.textContent="✓"}catch(_){const r=document.createRange(),q=tip.querySelector(b.dataset.act==="seal"?".s":".h");r.selectNodeContents(q);getSelection().removeAllRanges();getSelection().addRange(r);b.textContent="⧉"}
  setTimeout(()=>{b.textContent=was},1400)});
addEventListener("keydown",e=>{if(e.key==="Escape"&&PIN)unpin()});
// a lazy scroll's books are written as bundle roots; a click opens one in place (records, then the threads drawn from each)
// The bundle's file is fetched well ahead of the reader; its lines are then written a few hundred per frame, and its
// hashes land on the star staggered over the same stretch, so a large bundle unrolls instead of stalling the page.
const OPENED=new Map(),FILES=new Map(),PER=240;
const fileOf=h=>{let p=FILES.get(h);if(!p){p=fetch("b/"+h+".json").then(r=>r.json());FILES.set(h,p)}return p};
function openBundle(el){const h=el.dataset.h;if(OPENED.has(h))return OPENED.get(h);
  const p=fileOf(h).then(X=>new Promise(done=>{const bi=PTS[+el.dataset.i].b,base=PTS.length,t0=performance.now(),frames=Math.ceil(X.seq.length/PER),span_ms=frames*16;
    const at=new Map();X.seq.forEach(([t,ix],j)=>{if(!t)at.set(ix,j)});
    const when=j=>t0+span_ms*j/Math.max(1,X.seq.length);
    X.objects.forEach((k,ix)=>PTS.push({h:k,p:xyz(k),b:bi,t:0,lit:0,born:when(at.get(ix)||0)}));const eb=PTS.length;
    X.edges.forEach(([k,s,t])=>{PTS.push({h:k,p:xyz(k),b:bi,t:1,lit:0,born:when(at.get(s)||0)});LINKS.push([base+s,base+t,bi])});
    const box=document.createElement("div");box.className="sub";el._box=box;
    box.appendChild(Object.assign(document.createElement("span"),{className:"bm",textContent:(X.minted?"sealed "+X.minted+" · ":"")+X.objects.length+" records · "+X.edges.length+" threads"+(X.b3?" · BLAKE3 "+X.b3.slice(0,16)+"…":"")}));
    const run=el.parentElement;if(run.classList.contains("run")){const rest=document.createElement("div");rest.className="run";while(el.nextSibling)rest.appendChild(el.nextSibling);run.after(box);if(rest.firstChild)box.after(rest)}else el.after(box);
    el.classList.remove("shut");el.classList.add("opened");
    let j=0;const step=()=>{const fr=document.createElement("div");fr.className="ch";const end=Math.min(X.seq.length,j+PER),add=[];
      for(;j<end;j++){const [t,ix]=X.seq[j];if(j)fr.appendChild(Object.assign(document.createElement("span"),{className:"sep",textContent:t?"·":"✦"}));
        const sp=t?span(X.edges[ix][0],eb+ix,"t"):span(X.objects[ix],base+ix,"");fr.appendChild(sp);add.push(sp)}
      box.appendChild(fr);add.forEach(s=>io.observe(s));
      if(j<X.seq.length)requestAnimationFrame(step);
      else{$("skynote").textContent=PTS.length+" hashes on the 64 states · "+OPENED.size+" bundle(s) open · what you read glows";done(box)}};
    step()}));
  OPENED.set(h,p);return p}
// along the way, one bundle unrolls at a time, in reading order
let ROLL=Promise.resolve();const queueOpen=el=>{ROLL=ROLL.then(()=>openBundle(el))};
// a tap selects; on a bundle root a second tap opens it, then folds and unfolds its records. Proving is the card's button.
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("#tip"))return;const s=e.target.closest&&e.target.closest(".k");if(!s)return;e.preventDefault();
  if(e.shiftKey){open("https://sigil.mages.city/?a=sha256:"+s.dataset.h,"_blank","noopener");return}
  const again=PIN===s;
  if(s.classList.contains("shut")&&(again||!matchMedia("(hover: none)").matches)){openBundle(s).then(()=>show(s,true));return}
  if(s.classList.contains("opened")&&again){const box=s._box;if(box){const shut=box.classList.toggle("folded");s.classList.toggle("folded",shut)}}
  show(s,true)});
// ---- the switch: the whole scroll turns, line by line from where you are reading, into the other script
function setMode(m){if(m===MODE)return;MODE=m;$("m-seal").classList.toggle("on",m==="seal");$("m-hex").classList.toggle("on",m==="hex");
  const anchor=SPANS.find(s=>s.getBoundingClientRect().top>=0),at=anchor?anchor.getBoundingClientRect().top:0,vis=SPANS.map((s,i)=>[i,Math.abs(s.getBoundingClientRect().top)]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
  document.body.classList.toggle("seal",m==="seal");let k=0;const step=()=>{const n=Math.max(12,Math.ceil(vis.length/70));for(let j=0;j<n&&k<vis.length;j++,k++){const s=SPANS[vis[k]];s.textContent=m==="seal"?seal(s.dataset.h):s.dataset.h}if(anchor)scrollBy(0,anchor.getBoundingClientRect().top-at);if(k<vis.length)requestAnimationFrame(step)};step()}
$("m-seal").onclick=()=>setMode("seal");$("m-hex").onclick=()=>setMode("hex");
// a link to one hash (#k=<hex>, from the City's seal reader): open the scroll there, the hash lit with its threads
async function goTo(){const m=location.hash.match(/^#k=(?:sha256:)?([0-9a-f]{64})(?:&b=(?:sha256:)?([0-9a-f]{64}))?$/);if(!m)return;
  if(m[2]){const b=SPANS.find(x=>x.dataset.h===m[2]&&x.classList.contains("shut"));if(b)await openBundle(b)}
  const s=SPANS.find(x=>x.dataset.h===m[1]);if(!s)return;
  s.scrollIntoView({block:"center"});s.dispatchEvent(new MouseEvent("pointerover",{bubbles:true}));}
addEventListener("hashchange",goTo);setTimeout(goTo,60);
// open every bundle as the reader nears it, so the scroll unrolls and the star fills along the way, as on the guide's scroll
if(DATA.lazy&&${!!T.openAll}){const far=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){far.unobserve(e.target);fileOf(e.target.dataset.h)}},{rootMargin:"0px 0px 4000px 0px"});
  const near=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){near.unobserve(e.target);queueOpen(e.target)}},{rootMargin:"0px 0px 900px 0px"});
  document.querySelectorAll(".k.shut").forEach(s=>{far.observe(s);near.observe(s)})}
$("skynote").textContent=PTS.length+" hashes on the 64 states · what you read glows · "+${JSON.stringify(T.skynote || "point at a hash to see its threads")};
size();tick();})();
</script></body></html>`;
}
