import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Host-owned path in an existing private directory, never taken from a City Key.
// This is local storage, not encryption, a VTA memory adapter or an ACL manager.
export function openCheckpointStore(filename) {
  if (!path.isAbsolute(filename)) throw Error('Absolute private checkpoint path required');
  const lock = filename + '.lock';
  function load() {
    let raw;
    try { raw = fs.readFileSync(filename, 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    const state = JSON.parse(raw);
    if (state?.kind !== 'agentprivacy.city-mage-checkpoint/1' || !Number.isSafeInteger(state.revision) || state.revision < 1)
      throw Error('Invalid checkpoint storage record');
    return state;
  }
  async function persist(next, {expectedRevision}) {
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || next?.revision !== expectedRevision + 1 || next.kind !== 'agentprivacy.city-mage-checkpoint/1')
      throw Error('Invalid checkpoint revision transition');
    // Exclusive creation works across processes. Never guess that a lock is stale.
    const handle = fs.openSync(lock, 'wx', 0o600);
    let temporary;
    try {
      const current = load();
      if ((current?.revision ?? 0) !== expectedRevision) throw Error('Checkpoint revision conflict');
      if (current && current.binding !== next.binding) throw Error('Checkpoint context conflict');
      const bytes = JSON.stringify(next) + '\n';
      temporary = filename + '.' + crypto.randomUUID() + '.tmp';
      const fd = fs.openSync(temporary, 'wx', 0o600);
      try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      fs.renameSync(temporary, filename);
      temporary = null;
      return {revision: next.revision};
    } finally {
      if (temporary) fs.rmSync(temporary, {force:true});
      fs.closeSync(handle);
      fs.unlinkSync(lock);
    }
  }
  return {load, persist};
}
