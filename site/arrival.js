(()=>{
const scene=document.querySelector('.arrival'),button=scene?.querySelector('.arrival-motion'),view=scene?.querySelector('.arrival-visual'),svg=view?.querySelector('svg');if(!scene||!svg)return;
button?.addEventListener('click',()=>{const paused=scene.classList.toggle('paused');button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Resume motion':'Pause motion';});
// Rotate source coordinates, then apply the original editorial projection.
// This changes only the camera view: no MODEL bits, identity or evidence are changed.
let yaw=0,pitch=0,drag=null,suppressClick=false;const grid=[];
for(const x of [-1.5,-.5,.5,1.5])for(const y of [-1.5,-.5,.5,1.5])for(const z of [-1.5,-.5,.5,1.5])grid.push([x,y,z]);
const tetra=[[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]],[[-1,-1,-1],[-1,1,1],[1,-1,1],[1,1,-1]]];
function project([x,y,z]){const a=x*Math.cos(yaw)+z*Math.sin(yaw),b=-x*Math.sin(yaw)+z*Math.cos(yaw),c=y*Math.cos(pitch)-b*Math.sin(pitch),e=y*Math.sin(pitch)+b*Math.cos(pitch);return [280+49*a+26*e,210-49*c+17*e];}
function draw(){svg.querySelectorAll('.arrival-grid circle').forEach((c,i)=>{const [x,y]=project(grid[i]);c.setAttribute('cx',x);c.setAttribute('cy',y);});tetra.forEach((verts,k)=>{const points=verts.map(p=>project(p.map(v=>v*2)));let n=0;const paths=svg.querySelectorAll('.arrival-star-'+k+' path');for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)paths[n++].setAttribute('d',`M${points[i][0]} ${points[i][1]}L${points[j][0]} ${points[j][1]}`);});}
view.addEventListener('dragstart',e=>e.preventDefault());
view.addEventListener('pointerdown',e=>{if(e.button!==0)return;suppressClick=false;drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,pitch,moved:false};view.setPointerCapture(e.pointerId);});
view.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6)drag.moved=true;if(!drag.moved)return;yaw=drag.yaw+dx*.008;pitch=Math.max(-1.15,Math.min(1.15,drag.pitch+dy*.006));scene.classList.add('steering');draw();});
function finish(e){if(!drag||drag.id!==e.pointerId)return;suppressClick=drag.moved;drag=null;scene.classList.remove('steering');if(view.hasPointerCapture(e.pointerId))view.releasePointerCapture(e.pointerId);}
view.addEventListener('pointerup',finish);view.addEventListener('pointercancel',finish);
view.addEventListener('click',e=>{if(suppressClick){e.preventDefault();suppressClick=false;}});
view.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home'){yaw=0;pitch=0;}else if(e.key==='ArrowLeft')yaw-=.12;else if(e.key==='ArrowRight')yaw+=.12;else pitch=Math.max(-1.15,Math.min(1.15,pitch+(e.key==='ArrowUp'?-.12:.12)));draw();}});
})();