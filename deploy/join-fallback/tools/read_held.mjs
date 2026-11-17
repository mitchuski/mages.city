// Open the DIDs left while the City's node rested.  Run on the keeper's machine:
//   node tools/read_held.mjs                 list them (DID, note, when)
//   node tools/read_held.mjs --file <dir>    read held:*.json files from a folder instead of KV (tests)
// The private key never leaves this machine: KEY=<path> (default ~/keeper_mage/keys/city-join.private.jwk).
import { webcrypto as C } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const keyPath = process.env.KEY || join(homedir(), 'keeper_mage', 'keys', 'city-join.private.jwk');
const priv = await C.subtle.importKey('jwk', JSON.parse(readFileSync(keyPath, 'utf8')), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
const unb64 = s => Buffer.from(s, 'base64');

let boxes = [];
const fi = process.argv.indexOf('--file');
if (fi > 0) boxes = readdirSync(process.argv[fi + 1]).filter(f => f.startsWith('held')).map(f => JSON.parse(readFileSync(join(process.argv[fi + 1], f), 'utf8')));
else {
  const cfg = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'), id = (cfg.match(/"HELD",\s*"id":\s*"([^"]+)"/) || [])[1];
  const w = (...a) => execFileSync('npx', ['wrangler', 'kv', ...a, '--namespace-id', id, '--remote'], { encoding: 'utf8', shell: true });
  const keys = JSON.parse(w('key', 'list', '--prefix', 'held:')).map(k => k.name);
  for (const k of keys) boxes.push(JSON.parse(w('key', 'get', JSON.stringify(k), '--text')));
}
console.log(boxes.length + ' held');
for (const b of boxes) {
  try {
    const raw = await C.subtle.decrypt({ name: 'RSA-OAEP' }, priv, unb64(b.wrapped));
    const k = await C.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
    const d = JSON.parse(new TextDecoder().decode(await C.subtle.decrypt({ name: 'AES-GCM', iv: unb64(b.iv) }, k, unb64(b.ct))));
    console.log('\n' + (b.at || d.at) + '\n  ' + d.did + (d.note ? '\n  note: ' + d.note.replace(/\s+/g, ' ') : ''));
  } catch (e) { console.log('\n' + b.at + '\n  (could not open: not sealed to this key)'); }
}
