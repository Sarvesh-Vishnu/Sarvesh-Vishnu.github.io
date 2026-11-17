/* Static fallbacks for the lab figures (design.md §14.13).

   Renders each figure and its sentences in their default state, with the same code
   the browser runs (lab.js), and writes them between markers in the pages. Readers
   without JavaScript get a complete, truthful figure; with it, lab.js takes over.

   Run: node scripts/figures.cjs */
const fs = require('node:fs');
const path = require('node:path');
const Lab = require('../lab.js');

const ROOT = path.resolve(__dirname, '..');
const between = (html, name, body, file) => {
  const re = new RegExp(`(<!-- ${name} -->)[\\s\\S]*?(<!-- /${name} -->)`);
  if (!re.test(html)) throw new Error(`marker "${name}" not found in ${file}`);
  return html.replace(re, (_, a, b) => a + body + b);
};
const fluid = (svg) => svg.replace(/ width="\d+" height="\d+"/, '');   // let CSS size the static copy

// home page: the work figures
const TILE = { w: 1000, h: 540, full: false };
const tiles = { commercial: 'spine', nlp: 'reading', water: 'plan', obscure: 'route' };
let index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const [marker, kind] of Object.entries(tiles)) {
  const k = Lab.KINDS[kind];
  index = between(index, `fig:${marker}`, fluid(k.render(k.state(), TILE)), 'index.html');
}
fs.writeFileSync(path.join(ROOT, 'index.html'), index);

// case studies: the full instrument, its field (list only) and both sentences
const FULL = { w: 1040, h: 420, full: true };
const pages = { 'commercial-analytics': 'spine', nlp: 'reading', 'wv-water': 'plan', obscure: 'route' };
for (const [page, kind] of Object.entries(pages)) {
  const file = path.join(ROOT, 'work', `${page}.html`);
  const k = Lab.KINDS[kind];
  const st = k.state();
  const said = k.say(st);
  let html = fs.readFileSync(file, 'utf8');
  const size = k.height ? { ...FULL, h: k.height(st, FULL.w) } : FULL;   // the same height the live figure takes
  html = between(html, 'lab:fig', fluid(k.render(st, size)), page);
  html = between(html, 'lab:now', said.now, page);
  html = between(html, 'lab:always', said.always, page);
  if (kind === 'list') html = between(html, 'lab:field', fluid(Lab.renderField(st, { w: 760 })), page);
  fs.writeFileSync(file, html);
}
console.log(`figures written: ${Object.keys(tiles).length} work figures, ${Object.keys(pages).length} case studies`);
