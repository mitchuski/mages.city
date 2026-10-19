// status.js — confirms the header band's DID against community.json and reads the live node, without re-rendering
// the band. The band is written into each page at build time (bin/sync-header.mjs), so the first paint is final;
// this only recolours the dot and sets tooltips. It never changes the band's size or text length.
(function(){try{
  var dot=document.querySelector("#band .band-dot"), d=document.getElementById("city-did");
  fetch("community.json",{cache:"no-store"}).then(function(r){return r.json()}).then(function(c){
    if(d&&c&&c.communityDid) d.title=c.communityDid;
  }).catch(function(){});
  if(!dot||dot.classList.contains("band-dot-off")) return;
  dot.classList.add("is-checking");
  var done=function(up,msg){dot.classList.remove("is-checking");dot.classList.toggle("is-down",!up);
    var b=document.getElementById("band"); if(b) b.title=msg;};
  var t=setTimeout(function(){done(false,"the community node did not answer")},8000);
  fetch("https://vtc.mages.city/health",{cache:"no-store"}).then(function(r){return r.json()}).then(function(h){
    clearTimeout(t); var up=h&&h.status==="ok"; done(up, up?"the community node is up · vtc "+(h.version||""):"the community node is degraded");
  }).catch(function(){clearTimeout(t);done(false,"the community node is not answering right now")});
}catch(e){}})();
