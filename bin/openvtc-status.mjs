#!/usr/bin/env node
// Read-only inventory. An HTTP response is never evidence of VTC readiness.
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.some(arg => !['--online', '--json'].includes(arg))) {
  console.error('Usage: node bin/openvtc-status.mjs [--online] [--json]');
  process.exit(2);
}
const edition = JSON.parse(await readFile(resolve(root, 'deploy/vti/edition.json'), 'utf8'));
function git(path, ...args) {
  return execFileSync('git', ['-C', path, ...args], {
    encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}
const components = edition.components.map(component => {
  try {
    const path = resolve(root, component.path);
    return {
      id: component.id,
      head: git(path, 'rev-parse', 'HEAD'),
      branch: git(path, 'branch', '--show-current') || '(detached)',
      dirty: git(path, 'status', '--porcelain').length > 0,
      observed: true
    };
  } catch {
    return { id: component.id, observed: false, reason: 'Checkout unavailable or Git inspection failed' };
  }
});
async function probe(endpoint) {
  try {
    const response = await fetch(endpoint.url, {
      redirect: 'error', signal: AbortSignal.timeout(8000)
    });
    let markerMatched = null;
    if (endpoint.marker && response.ok) {
      // Bound response consumption as well as request duration.
      const reader = response.body.getReader();
      const chunks = [];
      let size = 0;
      try {
        while (size < 262144) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = value.subarray(0, 262144 - size);
          chunks.push(Buffer.from(chunk));
          size += chunk.length;
        }
      } finally { await reader.cancel(); }
      markerMatched = Buffer.concat(chunks).toString('utf8').includes(endpoint.marker);
    } else { await response.body?.cancel(); }
    return { id: endpoint.id, status: response.status, markerMatched, assessment: endpoint.marker
      ? (response.ok && markerMatched ? 'front-content-observed' : 'front-not-confirmed')
      : 'http-response-only' };
  } catch {
    return { id: endpoint.id, assessment: 'unreachable-or-redirected' };
  }
}
const report = {
  checkedAt: new Date().toISOString(), edition: edition.edition,
  note: 'Checkout revisions are observations, not a tested release lock. HTTP is not service identity, admission, or credential verification.',
  components,
  endpoints: args.includes('--online') ? await Promise.all(edition.endpoints.map(probe)) : [],
  acceptance: edition.acceptance,
  readiness: 'not-established'
};
if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`${report.edition}: ${report.readiness}\n${report.note}`);
  console.table(components);
  if (report.endpoints.length) console.table(report.endpoints);
  console.table(report.acceptance);
}
// Diagnostic success means the inventory ran, not that deployment is ready.
