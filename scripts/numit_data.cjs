/* Numit's data for the globe figure (design.md §14.22).

   Reads Numit's own curated event list and a public-domain coastline, and writes:
     - the compact constant NM in lab.js, between the NM markers: one mark per event
       (position, weight, country) and a simplified land outline
     - assets/data/numit-events.js: each event's title, place, source and date, loaded
       only by the Numit case study so a mark can be read

   Nothing here is typed by hand. Re-run it whenever Numit's curated list is refreshed.

   Run:  node scripts/numit_data.cjs <path to numit> <path to a project with esbuild,
         topojson-client and src/data/world-110m.json>
   e.g.  node scripts/numit_data.cjs ../numit ../builder-atlas

   The coastline is Natural Earth 1:110m (public domain), via world-atlas. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const NUMIT = path.resolve(process.argv[2] || path.join(ROOT, '..', 'numit'));
const TOOLS = path.resolve(process.argv[3] || path.join(ROOT, '..', 'builder-atlas'));

/* ------------------------------------------------------------------ events */
const esbuild = require(path.join(TOOLS, 'node_modules', 'esbuild'));
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'numit-')), 'events.cjs');
esbuild.buildSync({
  entryPoints: [path.join(NUMIT, 'lib', 'mock-events.ts')],
  bundle: true, format: 'cjs', outfile: tmp, alias: { '@': NUMIT }, logLevel: 'error',
});
const { MOCK_CONFLICTS: shadow, MOCK_LIGHT_EVENTS: light } = require(tmp);
const commit = execSync('git rev-parse --short HEAD', { cwd: NUMIT }).toString().trim();

const SEV = { local: 0, moderate: 1, high: 2, critical: 3 };
const STRENGTH = { local: 0, ongoing: 1, significant: 2, transformative: 3 };
const country = (e) => e.location.split(',').pop().trim();
const tidy = (s) => String(s).replace(/\s+/g, ' ').trim().replace(/'/g, '’').replace(/"([^"]*)"/g, '“$1”');
const table = (values) => { const list = [...new Set(values)].sort(); return { list, of: (v) => list.indexOf(v) }; };

const countries = table([...shadow, ...light].map(country));
const sources = table([...shadow, ...light].map((e) => tidy(e.source)));
const asOf = [...shadow, ...light].map((e) => e.date).filter(Boolean).sort().at(-1);

const mark = (e, weight) => {
  if (!(Math.abs(e.lat) <= 90 && Math.abs(e.lng) <= 180)) throw new Error(`${e.id}: bad position`);
  if (weight === undefined) throw new Error(`${e.id}: unknown weight`);
  return [Math.round(e.lat * 10), Math.round(e.lng * 10), weight, countries.of(country(e))];
};
const NM = {
  src: `numit@${commit}`,
  asOf,
  countries: countries.list,
  shadow: shadow.flatMap((e) => mark(e, SEV[e.severity])),
  light: light.flatMap((e) => mark(e, STRENGTH[e.strength])),
  grew: light.filter((e) => e.emergesFrom).length,
  floor: 0,
};
// the representation floor: how many countries and regions Numit's CI keeps on the globe
const floorSrc = fs.readFileSync(path.join(NUMIT, 'scripts', 'check-coverage.mjs'), 'utf8');
NM.floor = (floorSrc.slice(floorSrc.indexOf('const REQUIRED = ['), floorSrc.indexOf('];', floorSrc.indexOf('const REQUIRED = ['))).match(/\{ name:/g) || []).length;
if (!NM.floor) throw new Error('could not read the coverage floor');
const TEXT = {
  src: NM.src,
  sources: sources.list,
  shadow: shadow.map((e) => [tidy(e.title), tidy(e.location), sources.of(tidy(e.source)), e.date]),
  light: light.map((e) => [tidy(e.title), tidy(e.location), sources.of(tidy(e.source)), e.date, e.emergesFrom ? tidy(e.emergesFrom) : 0]),
};

/* -------------------------------------------------------------------- land */
const topojson = require(path.join(TOOLS, 'node_modules', 'topojson-client'));
const world = JSON.parse(fs.readFileSync(path.join(TOOLS, 'src', 'data', 'world-110m.json'), 'utf8'));
const merged = topojson.merge(world, world.objects.countries.geometries);

const TOL = 0.55, STEP = 0.25, MIN_SPAN = 2.2;            // degrees
function simplify(pts, tol) {                             // Douglas–Peucker
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let worst = 0, at = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len;
      if (d > worst) { worst = d; at = i; }
    }
    if (worst > tol) { keep[at] = 1; stack.push([a, at], [at, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const land = [];
for (const polygon of merged.coordinates) {
  const ring = polygon[0];                                // the outer ring; lakes are not drawn
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
  if (Math.max(...xs) - Math.min(...xs) < MIN_SPAN && Math.max(...ys) - Math.min(...ys) < MIN_SPAN) continue;
  const half = Math.floor(ring.length / 2);               // simplify a closed ring as two open halves
  const pts = [...simplify(ring.slice(0, half + 1), TOL), ...simplify(ring.slice(half), TOL).slice(1)];
  if (pts.length < 5) continue;
  const q = pts.map((p) => [Math.round(p[0] / STEP), Math.round(p[1] / STEP)]);
  const out = [q[0][0], q[0][1]];
  for (let i = 1; i < q.length; i++) {
    const dx = q[i][0] - q[i - 1][0], dy = q[i][1] - q[i - 1][1];
    if (dx || dy) out.push(dx, dy);
  }
  land.push(out);
}
land.sort((a, b) => b.length - a.length);
NM.step = STEP;
NM.land = land;

/* ------------------------------------------------------------------- write */
const labFile = path.join(ROOT, 'lab.js');
const lab = fs.readFileSync(labFile, 'utf8');
const re = /(\/\* NM:begin \*\/)[\s\S]*?(\/\* NM:end \*\/)/;
if (!re.test(lab)) throw new Error('NM markers not found in lab.js');
fs.writeFileSync(labFile, lab.replace(re, (_, a, b) => `${a}\n  const NM = ${JSON.stringify(NM)};\n  ${b}`));

const dataDir = path.join(ROOT, 'assets', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const textFile = path.join(dataDir, 'numit-events.js');
fs.writeFileSync(textFile,
  `/* Numit's curated events, in words: title, place, source, date. Generated from ${NM.src}\n` +
  `   by scripts/numit_data.cjs. Do not edit by hand. */\n` +
  `(function (data) {\n  if (typeof module === 'object' && module.exports) module.exports = data;\n  else globalThis.NUMIT_EVENTS = data;\n})(${JSON.stringify(TEXT)});\n`);

const points = land.reduce((s, r) => s + r.length / 2, 0);
console.log(`numit data: ${shadow.length} shadow, ${light.length} light, as of ${asOf} (${NM.src})`);
console.log(`  ${countries.list.length} countries, ${sources.list.length} sources, ${NM.grew} light events with a stated origin`);
console.log(`  land: ${land.length} rings, ${points} points; NM ${JSON.stringify(NM).length} bytes; text ${fs.statSync(textFile).size} bytes`);
