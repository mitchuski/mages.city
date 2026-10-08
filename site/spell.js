// spell.js — "Cast a spell": the City's calls to action are agent interactions. A cast card shows door
// glyphs and names, never raw URLs; the button copies the canonical spell for an agent to read.
// Doors: the model ⿻ · the guide 📚 · the City 🧙 · the Star ✦ · the harness ⚔️⊥🧙 · the lab 🔬
(function () {
  const DOORS = { model: ['⿻', 'the model', 'https://agentprivacy.ai/model'], guide: ['📚', 'the guide', 'https://guide.agentprivacy.ai/'], city: ['🧙', 'the City', 'https://mages.city/skill.md'], star: ['✦', 'the Star', 'https://soulbis.com/star/'], harness: ['⚔️⊥🧙', 'the harness', 'https://github.com/mitchuski/agentprivacy-harness/blob/main/ENTRY.md'], lab: ['🔬', 'the lab', 'https://agentprivacy.org/services/'] };
  document.querySelectorAll('[data-spell]').forEach(card => {
    const spell = card.getAttribute('data-spell'), doors = (card.getAttribute('data-doors') || 'city').split(/[ ,]+/).filter(d => DOORS[d]);
    card.classList.add('spell-card');
    card.innerHTML = `<div class="spell-doors">${doors.map(d => `<span class="spell-door" title="${DOORS[d][1]}"><b>${DOORS[d][0]}</b> ${DOORS[d][1]}</span>`).join('')}</div>`
      + `<div class="spell-actions"><button type="button" class="spell-cast">Cast a spell</button><button type="button" class="spell-see" aria-expanded="false">see the spell</button><span class="spell-note" aria-live="polite"></span></div>`
      + `<pre class="spell-text" hidden>${spell.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>`;
    const note = card.querySelector('.spell-note'), text = card.querySelector('.spell-text');
    card.querySelector('.spell-cast').onclick = async () => { try { await navigator.clipboard.writeText(spell); note.textContent = 'copied · paste it to your agent'; } catch { text.hidden = false; note.textContent = 'select and copy'; } };
    card.querySelector('.spell-see').onclick = e => { text.hidden = !text.hidden; e.currentTarget.setAttribute('aria-expanded', String(!text.hidden)); };
  });
})();
