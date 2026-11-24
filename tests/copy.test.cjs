/* Copy gate: no unconfirmed placeholder (<mark class="tbc">) may ship. Run: node --test tests/ */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = [
  ...fs.readdirSync(root).filter((f) => f.endsWith('.html')),
  ...fs.readdirSync(path.join(root, 'work')).filter((f) => f.endsWith('.html')).map((f) => 'work/' + f),
];

test('no placeholder awaits confirmation', () => {
  const open = [];
  for (const p of pages) {
    const src = fs.readFileSync(path.join(root, p), 'utf8');
    for (const m of src.matchAll(/<mark class="tbc"[^>]*>(.*?)<\/mark>/gs)) open.push(`${p}: ${m[1]}`);
  }
  assert.deepEqual(open, [], `${open.length} placeholder(s) still to confirm:\n  ${open.join('\n  ')}`);
});
