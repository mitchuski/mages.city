// status.js — one line of truth on every page, read from community.json: the community DID and how the City is run.
// A null DID reads "not yet minted"; nothing here is a health check or an admission.
(function(){try{fetch("community.json",{cache:"no-store"}).then(function(r){return r.json()}).then(function(c){
  var d=document.getElementById("city-did");
  if(d){ if(c&&c.communityDid){ d.textContent=c.communityDid; d.title="community DID · copy it into your OpenVTC client"; } else { d.textContent="not yet minted"; } }
  var b=document.getElementById("band");
  if(b&&c&&c.communityDid){ var short=c.communityDid.replace(/^(did:webvh:[A-Za-z0-9]{8})[A-Za-z0-9]+(:.*)$/,"$1…$2");
    b.innerHTML='<span class="band-dot" aria-hidden="true">●</span> minted '+(c.minted||'')+' · <strong id="city-did" title="'+c.communityDid+'">'+short+'</strong> · '+(c.administration?'administered from a Star':'')+' · <a href="starkey.md">get in</a> · <a href="community.md">terms</a>'; }
}).catch(function(){});}catch(e){}})();
