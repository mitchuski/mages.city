// status.js — one line of truth for the standing pages: the community DID from community.json.
// A null DID stays "not yet minted"; nothing here is a health check or an admission.
(function(){try{fetch("community.json",{cache:"no-store"}).then(function(r){return r.json()}).then(function(c){var d=document.getElementById("city-did");if(d&&c&&c.communityDid){d.textContent=c.communityDid;d.title="community DID · copy it into your OpenVTC client";}}).catch(function(){});}catch(e){}})();
