#!/usr/bin/env node
// City-side adapter for the shared journey implementation. No secrets or writes
// to the public farm; --out is an explicit PRIVATE bundle export.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siblings = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mcp = process.env.AGENTPRIVACY_MCP_DIR || path.join(siblings, 'agentprivacy-mcp');
const J = await import(pathToFileURL(path.join(mcp, 'lib/journey.mjs')));
const K = await import(pathToFileURL(path.join(mcp, 'lib/key.mjs')));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));

export function inspect(bundle, options = {}) { return J.inspectJourney(bundle, options); }

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const [command, ...args] = process.argv.slice(2);
    if (!['start', 'fold', 'inspect'].includes(command)) throw Error('usage: journey.mjs start --key KEY [--packets PACKETS] [--out PRIVATE.json] | fold --bundle PRIVATE.json (--packet PACKET | --task TASK) [--out PRIVATE.json] | inspect --bundle PRIVATE.json [--record RECORD] [--catalog CATALOG]');
    if (args.length % 2) throw Error('flags need values');
    const flags = {};
    const allowed = { start: ['--key', '--packets', '--out'], fold: ['--bundle', '--packet', '--task', '--out'], inspect: ['--bundle', '--record', '--catalog', '--out'] }[command];
    for (let i = 0; i < args.length; i += 2) {
      if (!allowed.includes(args[i]) || Object.hasOwn(flags, args[i])) throw Error('unknown or duplicate flag: ' + args[i]);
      flags[args[i]] = args[i + 1];
    }
    let result;
    if (command === 'start') {
      if (!flags['--key']) throw Error('--key required');
      const parsed = K.parseKeyInput(flags['--key']); if (parsed.error) throw Error(parsed.error);
      const supplied = flags['--packets'] ? read(flags['--packets']) : [];
      if (supplied.unavailable?.length) throw Error('original packets unavailable; re-import them at the source');
      result = J.createBundle(parsed.key, Array.isArray(supplied) ? supplied : supplied.packets);
    } else {
      if (!flags['--bundle']) throw Error('--bundle required');
      const bundle = read(flags['--bundle']);
      if (command === 'fold') result = J.foldJourney(bundle, { packet: flags['--packet'] ? read(flags['--packet']) : undefined, taskDocument: flags['--task'] ? read(flags['--task']) : undefined }).bundle;
      else {
        const catalogPath = flags['--catalog'] || process.env.AGENTPRIVACY_ARTEFACT_CATALOG || path.join(siblings, 'agentprivacy_master/src/data/artefacts/index.json');
        result = J.inspectJourney(bundle, { record: flags['--record'] ? read(flags['--record']) : null, catalog: fs.existsSync(catalogPath) ? read(catalogPath) : null });
      }
    }
    const output = JSON.stringify(result, null, 2) + '\n';
    if (flags['--out']) {
      // Refuse overwrite: the previous private bundle is the recoverable prior.
      fs.writeFileSync(flags['--out'], output, { flag: 'wx', mode: 0o600 });
      console.log(JSON.stringify({ wrote: path.resolve(flags['--out']), kind: result.kind }));
    } else process.stdout.write(output);
  } catch (e) { console.error(JSON.stringify({ error: e.message })); process.exitCode = 1; }
}
