// status.js — confirms the header band's DID against community.json without re-rendering it. The band is
// written into each page at build time (bin/sync-header.mjs), so the first paint is already final; this only
// refreshes the title tooltip if the file has moved on. It never changes the band's size or text length.
(function(){try{fetch("community.json",{cache:"no-store"}).then(function(r){return r.json()}).then(function(c){
  var d=document.getElementById("city-did"); if(d&&c&&c.communityDid) d.title=c.communityDid;
}).catch(function(){});}catch(e){}})();
