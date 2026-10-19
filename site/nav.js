// nav.js — closes The City menu on Escape, on a click outside it, and after choosing an item. The menu works without
// this file (a plain <details>); nothing here changes layout.
(function(){
  var m=document.querySelector("details.city-menu"); if(!m) return;
  if(location.hash==="#menu") m.open=true; // a link can open the menu: href="index.html#menu"
  document.addEventListener("click",function(e){ if(m.open && !m.contains(e.target)) m.open=false; });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape" && m.open){ m.open=false; var s=m.querySelector("summary"); if(s) s.focus(); } });
  m.addEventListener("click",function(e){ if(e.target.closest && e.target.closest("a")) m.open=false; });
})();
