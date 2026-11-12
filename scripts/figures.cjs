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
const TILE = { w: 640, h: 360, full: false };
const tiles = { commercial: 'record', nlp: 'sample' };
let index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const [marker, kind] of Object.entries(tiles)) {
  const k = Lab.KINDS[kind];
  index = between(index, `fig:${marker}`, fluid(k.render(k.state(), TILE)), 'index.html');
}
fs.writeFileSync(path.join(ROOT, 'index.html'), index);

// case studies: the full instrument, its field (list only) and both sentences
const FULL = { w: 760, h: 350, full: true };
const pages = { 'commercial-analytics': 'committee', nlp: 'sample' };
for (const [page, kind] of Object.entries(pages)) {
  const file = path.join(ROOT, 'work', `${page}.html`);
  const k = Lab.KINDS[kind];
  const st = k.state();
  const said = k.say(st);
  let html = fs.readFileSync(file, 'utf8');
  html = between(html, 'lab:fig', fluid(k.render(st, FULL)), page);
  html = between(html, 'lab:now', said.now, page);
  html = between(html, 'lab:always', said.always, page);
  if (kind === 'list') html = between(html, 'lab:field', fluid(Lab.renderField(st, { w: 760 })), page);
  fs.writeFileSync(file, html);
}
console.log('figures written: 2 work figures, 2 case studies');
