// evidence.js — the Evidence page's two live tables, from arena.json (the same file the sky reads).
// Shows roots, counts and dates only: the veil holds (standings and findings stay behind membership).
(function(){
  var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
  fetch("arena.json",{cache:"no-store"}).then(function(r){return r.json()}).then(function(a){
    var arenas={}; (a.arenas||[]).forEach(function(x){arenas[x.id]=x.name});
    var inst=(a.instances||[]);
    document.querySelectorAll(".count[data-arena]").forEach(function(el){
      var id=el.getAttribute("data-arena"), n=inst.filter(function(i){return i.arena===id}).length,
          open=inst.filter(function(i){return i.arena===id&&["active","submitted","hold","watching"].indexOf(i.state)>=0}).length;
      el.textContent=n?(n+" lane"+(n>1?"s":"")+(open?" · "+open+" open":"")):"no lanes yet";
    });
    var rows=inst.map(function(i){
      var s=i.sealed||{}, k=s.kappa||"", short=k?k.replace(/^(sha256:[0-9a-f]{12})[0-9a-f]+$/,"$1…"):"";
      var name=String(i.id||"").replace(/_mage$/,"").replace(/_/g," ");
      var arena=i.arena?(arenas[i.arena]||i.arena):"the evidence axis";
      return "<tr><td>"+esc(name)+"</td><td>"+esc(arena)+"</td><td><span class=\"st st-"+esc(i.state)+"\">"+esc(i.state)+"</span></td><td>"+(k?"<code title=\""+esc(k)+"\">"+esc(short)+"</code>":"<span class=\"st\">not yet shown</span>")+"</td><td>"+(s.claims?esc(s.claims)+(s.read?" · "+esc(s.read):""):"–")+"</td></tr>";
    });
    document.getElementById("pw-chains").innerHTML=rows.join("")||"<tr><td colspan=5>no chains yet</td></tr>";
  }).catch(function(){var t=document.getElementById("pw-chains"); if(t) t.innerHTML="<tr><td colspan=5 class=\"quiet-note\">arena.json did not load</td></tr>";});
})();
