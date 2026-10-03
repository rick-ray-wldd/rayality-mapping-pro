import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const js = readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => readFileSync(`dist/assets/${f}`, 'utf8')).join('');
assert(!js.includes('RAYALITY_SECRET_SENTINEL_2026'), 'Build leaked environment key');
assert(!/AIza[\w-]{30,}/.test(js), 'Bundle contains a Google API key');
console.log('Bundle secret check passed');
