/* Tests for lab.js — the models behind the figures. Run: node --test tests/ */
const test = require('node:test');
const assert = require('node:assert/strict');
const Lab = require('../lab.js');

const ALL = [true, true, true, true];

test('rng is deterministic and uniform on [0, 1)', () => {
  const a = Lab.rng(42), b = Lab.rng(42);
  const xs = Array.from({ length: 2000 }, () => a());
  assert.deepEqual(xs.slice(0, 5), Array.from({ length: 5 }, () => b()));
  assert.ok(xs.every((v) => v >= 0 && v < 1));
  const m = xs.reduce((s, v) => s + v, 0) / xs.length;
  assert.ok(Math.abs(m - 0.5) < 0.03, `mean ${m}`);
});

test('ols recovers known coefficients', () => {
  const X = [], y = [];
  for (let t = 0; t < 40; t++) { X.push([1, t, Math.sin(t)]); y.push(3 - 0.5 * t + 2 * Math.sin(t)); }
  const beta = Lab.ols(X, y);
  [3, -0.5, 2].forEach((v, i) => assert.ok(Math.abs(beta[i] - v) < 1e-8, `beta[${i}] = ${beta[i]}`));
});

test('wape: zero for a perfect forecast, 10% for a uniform 10% miss', () => {
  assert.equal(Lab.wape([10, 20, 30], [10, 20, 30]), 0);
  assert.ok(Math.abs(Lab.wape([10, 20, 30], [11, 22, 33]) - 0.1) < 1e-12);
});

test('wilson interval matches a known value and always contains the estimate', () => {
  const [lo, hi] = Lab.wilson(0.2, 100);                 // standard reference: 0.1334 .. 0.2888
  assert.ok(Math.abs(lo - 0.1334) < 5e-4 && Math.abs(hi - 0.2888) < 5e-4, `${lo} ${hi}`);
  for (const p of [0.05, 0.3, 0.9]) for (const n of [30, 500, 10000]) {
    const [a, b] = Lab.wilson(p, n);
    assert.ok(a < p && p < b && a >= 0 && b <= 1);
  }
});

test('the series is fixed: 96 months, same values every time', () => {
  const y = Lab.series();
  assert.equal(y.length, 96);
  assert.equal(y, Lab.series());
  assert.ok(y.every(Number.isFinite));
});

test('forecasters only see the past (no leakage from after the origin)', () => {
  const y = Lab.series();
  const n = 60;
  const tampered = y.slice();
  for (let t = n; t < tampered.length; t++) tampered[t] = 1e6;   // corrupt the future
  for (const mdl of Lab.MODELS) {
    assert.deepEqual(mdl.fit(tampered, n, 12), mdl.fit(y, n, 12), `${mdl.id} read the future`);
  }
});

test('seasonal naive repeats last year exactly', () => {
  const y = Lab.series();
  assert.deepEqual(Lab.MODELS[0].fit(y, 48, 12), y.slice(36, 48));
});

test('every forecaster nails a noiseless seasonal line it should be able to learn', () => {
  const y = Array.from({ length: 96 }, (_, t) => 50 + 0.5 * t + 8 * Math.sin((2 * Math.PI * t) / 12));
  const actual = y.slice(72, 84);
  const errs = Object.fromEntries(Lab.MODELS.map((mdl) => [mdl.id, Lab.wape(actual, mdl.fit(y, 72, 12))]));
  assert.ok(errs.harmonic < 1e-6, `harmonic ${errs.harmonic}`);   // exactly its own model
  assert.ok(errs.hw < 0.02, `hw ${errs.hw}`);
  assert.ok(errs.theta < 0.05, `theta ${errs.theta}`);
  assert.ok(errs.snaive < 0.08, `snaive ${errs.snaive}`);         // misses a year of trend, by design
});

test('the committee is the mean of its active members', () => {
  const c = Lab.committee(62, [true, false, true, false]);
  const live = c.members.filter((m) => m.on);
  assert.equal(live.length, 2);
  c.ensemble.forEach((v, h) => assert.ok(Math.abs(v - (live[0].fc[h] + live[1].fc[h]) / 2) < 1e-12));
});

test('the committee is never worse than its average member, at any origin (convexity)', () => {
  for (let n = Lab.C.FIRST; n <= Lab.C.LAST; n++) {
    const c = Lab.committee(n, ALL);
    assert.ok(c.err <= c.avgMemberErr + 1e-12, `origin ${n}`);
    assert.ok(c.err <= c.worst.err + 1e-12);
  }
});

test('backtest counts agree with a direct recount, and origins are clamped', () => {
  const bt = Lab.backtest(ALL);
  assert.equal(bt.origins, Lab.C.LAST - Lab.C.FIRST + 1);
  let beats = 0;
  for (let n = Lab.C.FIRST; n <= Lab.C.LAST; n++) { const c = Lab.committee(n, ALL); if (c.err < c.best.err) beats++; }
  assert.equal(bt.beatsBest, beats);
  assert.equal(bt.isWorst, 0);
  assert.equal(bt.beatsAvg, bt.origins);
  assert.equal(Lab.committee(-5, ALL).origin, Lab.C.FIRST);
  assert.equal(Lab.committee(999, ALL).origin, Lab.C.LAST);
  assert.equal(Lab.committee(62, [false, false, false, false]).err, null);
});

test('the list: counts are consistent and the model beats both baselines at the default budget', () => {
  const d = Lab.mains();
  assert.equal(d.items.length, 400);
  assert.equal(d.cumModel[400], d.failures);
  assert.equal(d.cumAge[400], d.failures);
  for (let k = 1; k <= 400; k++) assert.ok(d.cumModel[k] >= d.cumModel[k - 1] && d.cumModel[k] - d.cumModel[k - 1] <= 1);
  const r = Lab.list(Lab.L.DEFAULT);
  assert.ok(r.model > r.oldest && r.oldest >= 0 && r.model > r.random);
  assert.ok(Math.abs(r.random - (r.k * r.failures) / 400) < 1e-12);
  assert.equal(Lab.list(0).model, 0);
  assert.equal(Lab.list(9999).k, Lab.L.MAXK);
});

test('the sample: intervals tighten with n and the ranking settles', () => {
  const small = Lab.sample(40, 0), big = Lab.sample(8000, 0);
  const width = (s) => s.rows.reduce((a, r) => a + (r.hi - r.lo), 0) / s.rows.length;
  assert.ok(width(big) < width(small) / 5);
  assert.ok(big.apart >= small.apart);
  assert.ok(big.stability > 0.95 && small.stability < big.stability);
  assert.equal(big.isTrulyWorst, true);
  for (const s of [small, big]) {
    assert.equal(s.rows.length, 12);
    for (let i = 1; i < 12; i++) assert.ok(s.rows[i - 1].est >= s.rows[i].est);   // sorted, worst first
    s.rows.forEach((r) => assert.ok(r.lo < r.est && r.est < r.hi));
    assert.equal(s.apart, s.rows.filter((r) => r.lo > s.overall || r.hi < s.overall).length);
  }
});

test('the record lists every starting month and agrees with the committee', () => {
  const rows = Lab.record();
  assert.equal(rows.length, Lab.C.LAST - Lab.C.FIRST + 1);
  for (const r of rows) {
    const c = Lab.committee(r.n, ALL);
    assert.equal(r.err, c.err);
    assert.equal(r.best, c.best.err);
    assert.equal(r.worst, c.worst.err);
    assert.ok(r.err <= r.worst + 1e-12 && r.members.length === 4);
  }
});

test('the spine: every path is well formed and every node is used', () => {
  const used = new Set();
  for (const d of Lab.SP_DECISIONS) {
    const pth = Lab.SP_PATHS[d], q = Lab.spinePath(d);
    assert.equal(Lab.SP_NODES[d].col, 4);
    assert.equal(Lab.SP_NODES[pth.surface].col, 3);
    pth.analysis.forEach((id) => assert.equal(Lab.SP_NODES[id].col, 2));
    pth.sources.forEach((id) => assert.equal(Lab.SP_NODES[id].col, 0));
    q.edges.forEach(([a, b]) => { assert.ok(q.nodes.has(a) && q.nodes.has(b)); assert.ok(Lab.SP_NODES[a].col < Lab.SP_NODES[b].col); });
    q.nodes.forEach((n) => used.add(n));
  }
  assert.deepEqual([...used].sort(), Object.keys(Lab.SP_NODES).sort());
});

test('the spine: the market brief never touches internal data', () => {
  const q = Lab.spinePath('view');
  assert.ok(!q.nodes.has('spine'));
  ['tx', 'crm', 'fin'].forEach((id) => assert.ok(!q.nodes.has(id)));
  assert.match(Lab.saySpine({ focus: 'view' }).now, /public sources only/);
  for (const d of Lab.SP_DECISIONS) if (d !== 'view') assert.ok(!Lab.spinePath(d).nodes.has('pub'));
});

test('the spine: focus lights every decision through a node, and the sentence names the path', () => {
  assert.deepEqual(Lab.spineFocus('fc').decisions, ['aop', 'quotas', 'supply']);
  assert.equal(Lab.spineFocus('spine').decisions.length, 5);
  assert.equal(Lab.spineFocus('nonsense').focus, 'aop');
  const said = Lab.saySpine({ focus: 'xsell' }).now;
  ['Power BI views', 'customer targeting', 'experiment design', 'sales transactions'].forEach((w) => assert.ok(said.includes(w), w));
  assert.match(Lab.saySpine({ focus: 'quotas' }).now, /^Territory quotas are read/);
  for (const d of Lab.SP_DECISIONS) assert.ok(!/\d/.test(Lab.saySpine({ focus: d }).now), d + ' sentence carries a number');
});

test('the reading: every comment is well formed', () => {
  for (const c of Lab.RD_COMMENTS) {
    const { toks, phrases } = Lab.rdParse(c);
    assert.ok(c.text.length <= 2, c.id + ': the wide drawing has room for two sentences');
    assert.ok(!toks.some((t) => /[[\]:]/.test(t.text)), c.id + ': markup leaked into the words');
    assert.deepEqual(Object.keys(phrases).sort(), Object.keys(c.marks).sort(), c.id + ': marks and remarks differ');
    assert.equal(Object.values(c.marks).filter((m) => m.driver).length, 1, c.id + ': one redline');
    for (const p of Object.values(phrases)) {
      assert.ok(p.toks.length > 1 && p.key && !Lab.RD_STOP.has(p.key), `${c.id}/${p.id}`);
      assert.ok(new Set(p.toks.map((i) => toks[i].sent)).size === 1, `${c.id}/${p.id} crosses a sentence`);
      assert.ok(Math.abs(c.marks[p.id].tone) === 1 && c.marks[p.id].touch);
    }
  }
});

test('the reading: nothing runs off the drawing at any width', () => {
  const widths = [264, 288, 320, 343, 480, 619, 620, 720, 900, 1000, 1040, 1280];
  Lab.RD_COMMENTS.forEach((c, ci) => {
    for (const w of widths) for (const full of [true, false]) {
      const g = Lab.rdGeom(c, w, 0, { full });
      const { toks } = Lab.rdParse(c);
      toks.forEach((t, i) => {
        const q = g.pos[i];
        assert.ok(q.x >= 8 && q.x + t.text.length * g.cw <= w - 4, `${c.id} @${w}: “${t.text}” is clipped`);
      });
      // every label drawn at the last step stays inside too (11px mono, with tracking)
      const svg = Lab.renderReading({ c: ci, step: 4 }, { w, h: g.need, full });
      for (const m of svg.matchAll(/<text class="(fig-lab[^"]*)" x="([\d.]+)"[^>]*>([^<]+)</g)) {
        const ch = m[1].includes('sp-level') ? 8.1 : 6.7;                // tracked capitals are wider
        assert.ok(+m[2] >= 8 && +m[2] + m[3].length * ch <= w, `${c.id} @${w}: label “${m[3]}” is clipped`);
      }
    }
  });
});

test('the reading: each step adds to the last, and the sentence follows the drawing', () => {
  const marks = (step) => Lab.renderReading({ c: 0, step }, { w: 1000, h: 480, full: false });
  assert.equal((marks(0).match(/rd-rule/g) || []).length, 1);          // only the marker under the current step
  assert.ok(!/rd-stop[^>]*>I</.test(marks(0)));
  assert.match(marks(1), /rd-stop[^>]*>I</);
  assert.ok(marks(2).includes('unhappy') && !marks(2).includes('COMMUNICATION'));
  assert.ok(marks(3).includes('COMMUNICATION') && !marks(3).includes('DRIVER ·'));
  assert.ok(marks(4).includes('DRIVER · UNEXPLAINED WAITING') && marks(4).includes('rd-acc'));
  Lab.RD_COMMENTS.forEach((c, ci) => {
    const drv = Object.values(c.marks).find((m) => m.driver);
    assert.ok(Lab.sayReading({ c: ci, step: 4 }).now.includes(drv.driver));
    for (const m of Object.values(c.marks)) assert.ok(Lab.sayReading({ c: ci, step: 3 }).now.includes(m.touch.toLowerCase()));
    for (let step = 0; step < 5; step++) assert.ok(!/\d/.test(Lab.sayReading({ c: ci, step }).now), `${c.id} step ${step} carries a number`);
  });
  assert.match(Lab.sayReading({ c: 0, step: 2 }).now, /two unhappy, one pleased/);
  assert.match(Lab.sayReading({ c: 1, step: 2 }).now, /both are pleased.*never felt lost/);
  // on scroll the reading is complete by the time the slide is centred
  const st = Lab.KINDS.reading.state();
  Lab.KINDS.reading.travel(st, 0.5); assert.equal(st.step, 4);
  Lab.KINDS.reading.travel(st, 0); assert.equal(st.step, 0);
});

test('the plan: a deterministic network with two complete lists', () => {
  const pl = Lab.plan(), n = pl.mains.length;
  assert.equal(Lab.plan(), pl);
  assert.ok(n > 60 && n < 100);
  for (const by of ['model', 'oldest']) {
    assert.deepEqual(pl.lists[by].slice().sort((a, b) => a - b), pl.mains.map((m) => m.id));     // a permutation
    pl.lists[by].forEach((id, k) => assert.equal(pl.rank[by][id], k));
  }
  for (let k = 1; k < n; k++) assert.ok(pl.mains[pl.lists.oldest[k - 1]].age >= pl.mains[pl.lists.oldest[k]].age);
  for (const m of pl.mains) {
    assert.ok(['oldest', 'middle', 'newest'].includes(m.era) && ['clay', 'loam', 'sandy'].includes(m.soil));
    assert.ok(['Cast iron', 'Ductile iron', 'PVC'].includes(m.material) && typeof m.broken === 'boolean');
  }
  // the point of the drawing: the two lists differ, and the model's reaches beyond the oldest era
  const top = (by) => new Set(pl.lists[by].slice(0, Lab.PL.DEFAULT));
  assert.ok([...top('model')].some((id) => !top('oldest').has(id)));
  assert.ok([...top('model')].some((id) => pl.mains[id].era !== 'oldest'));
  assert.ok([...top('oldest')].every((id) => pl.mains[id].era === 'oldest'));
});

test('the plan: the drawing and the sentence never state a count', () => {
  const pl = Lab.plan();
  for (const by of ['model', 'oldest']) for (let k = 0; k <= Lab.PL.KMAX; k++) {
    const st = { by, k, focus: null };
    assert.ok(!/\d/.test(Lab.sayPlan(st).now), `${by} ${k}: ${Lab.sayPlan(st).now}`);
    const svg = Lab.renderPlan(st, { w: 1000, h: 480, full: true });
    assert.equal((svg.match(/pl-main is-on/g) || []).length, k + 1);                             // the picks, plus the legend's sample
    assert.ok(![...svg.matchAll(/<text[^>]*>([^<]*)</g)].some((t) => /\d/.test(t[1])));
  }
  for (const m of pl.mains) {
    const said = Lab.sayPlan({ by: 'model', k: 11, focus: m.id }).now;
    assert.ok(!/\d/.test(said) && said.startsWith(m.material) && said.includes(m.soil + ' soil'));
  }
  assert.match(Lab.sayPlan({ by: 'model', k: 0, focus: null }).now, /^No budget/);
  assert.equal(Lab.share(0), 'none'); assert.equal(Lab.share(1), 'all'); assert.equal(Lab.share(0.5), 'about half');
});

test('the plan: pointing finds the main under the pointer, and nothing far from one', () => {
  const pl = Lab.plan(), w = 1000, h = 480, o = { full: true };
  const st = { by: 'model', k: 11, focus: pl.mains[7].id };
  const svg = Lab.renderPlan(st, { w, h, full: true });
  const plate = /<rect class="pl-plate" x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="(\d+)"/.exec(svg);
  assert.ok(plate && +plate[1] >= 0 && +plate[1] + +plate[3] <= w && +plate[2] >= 0 && +plate[2] + +plate[4] <= h);
  for (const m of pl.mains) {                            // every callout stays on the sheet
    const p = /<rect class="pl-plate" x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="(\d+)"/.exec(Lab.renderPlan({ by: 'model', k: 11, focus: m.id }, { w: 720, h: 400, full: false, tagRoom: 30 }));
    assert.ok(+p[1] >= 0 && +p[1] + +p[3] <= 720 && +p[2] >= 0 && +p[2] + +p[4] <= 400, 'callout for main ' + m.id);
  }
  assert.equal(Lab.planNearest(-200, -200, w, h, o), null);
  assert.ok(!/pl-plate/.test(Lab.renderPlan(st, { w: 343, h: 300, full: false })));              // phones: the sentence carries it
});

test('n slider mapping round-trips and stays in range', () => {
  assert.equal(Lab.nFromUnit(0), Lab.S.NMIN);
  assert.equal(Lab.nFromUnit(1), Lab.S.NMAX);
  for (const n of [30, 120, 1000, 8300, 12000]) assert.ok(Math.abs(Lab.nFromUnit(Lab.unitFromN(n)) - n) <= 1);
});

test('sentences state exactly what the models computed', () => {
  const c = Lab.committee(62, ALL), bt = Lab.backtest(ALL);
  const sc = Lab.sayCommittee({ origin: 62, active: ALL });
  assert.ok(sc.now.includes(c.label) && sc.now.includes((c.err * 100).toFixed(1) + '%'));
  assert.ok(sc.now.includes(c.best.name) && sc.now.includes(c.worst.name));
  assert.ok(sc.always.includes(`in ${bt.beatsBest} `) && sc.always.includes(`all ${bt.origins} `));
  const r = Lab.list(40), sl = Lab.sayList({ k: 40 });
  assert.ok(sl.now.includes(`prevents ${r.model} of the ${r.failures}`) && sl.now.includes(`first prevents ${r.oldest}`));
  const s = Lab.sample(120, 0), ss = Lab.saySample({ n: 120, draw: 0 });
  assert.ok(ss.now.includes(`${s.apart} of 12`) && ss.now.includes(s.looksWorst));
  assert.ok(ss.always.includes(`${Math.round(s.stability * 100)}%`));
  assert.match(Lab.sayCommittee({ origin: 62, active: [false, false, false, false] }).now, /at least one/);
  assert.match(Lab.sayList({ k: 0 }).now, /No budget/);
});

test('renderers return well-formed SVG at tile and full sizes', () => {
  for (const [name, kind] of Object.entries(Lab.KINDS)) {
    for (const o of [{ w: 343, h: 214, full: false }, { w: 900, h: 400, full: true }]) {
      const svg = kind.render(kind.state(), o);
      assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'), name);
      assert.ok(!/NaN|undefined|Infinity/.test(svg), `${name} has a bad number`);
      assert.equal((svg.match(/<svg/g) || []).length, 1);
    }
    const st = kind.state();
    kind.scrub(st, 0); const lo = kind.unit(st);
    kind.scrub(st, 1); const hi = kind.unit(st);
    assert.ok(lo <= 0.001 && hi >= 0.999, `${name} scrub range ${lo}..${hi}`);
  }
  const field = Lab.renderField({ k: 40 }, { w: 800 });
  assert.equal((field.match(/<rect/g) || []).length, 400);
  assert.equal((field.match(/fld-on/g) || []).length, 40);
  assert.equal((field.match(/fld-fail/g) || []).length, Lab.mains().failures);
});

test('the route: real data, well formed, and every seed descends or says it does not', () => {
  const { OB, RT } = Lab;
  assert.ok(OB.seeds.length >= 2);
  for (const s of OB.seeds) {
    for (const pull of ['none', 'strong']) {
      const r = s.routes[pull];
      assert.equal(r.length, RT.STEPS, `${s.t} ${pull}`);
      for (const x of r) { assert.ok(x.n >= OB.min && x.n <= OB.max); assert.ok(x.c <= x.o); }
      const artists = [s.a, ...r.map((x) => x.a)];
      assert.equal(new Set(artists).size, artists.length, `${s.t} ${pull}: an artist repeats`);
    }
  }
});

test('the route: the sentence states exactly what the data says', () => {
  const { OB, RT } = Lab;
  OB.seeds.forEach((s, i) => {
    const fin = s.routes.none[RT.STEPS - 1];
    const said = Lab.sayRoute({ s: i, pull: 'none', k: RT.STEPS }).now;
    assert.ok(said.includes(fin.t) && said.includes(fin.n < OB.head ? 'in the long tail' : 'still in the head'), said);
    const held = s.routes.none.filter((x) => x.held).length;
    assert.ok(said.includes(`${held} of ${RT.STEPS} were made again`), said);
    for (let k = 0; k <= RT.STEPS; k++) assert.ok(Lab.sayRoute({ s: i, pull: 'none', k }).now.length > 20);
  });
  const b = OB.bench;
  assert.ok(Lab.sayRoute(Lab.KINDS.route.state()).always.includes(`${Math.round(b.routeTail * 100)}%`));
});

test('the route: nothing runs off the drawing at any width', () => {
  const { OB } = Lab;
  for (const w of [320, 375, 620, 1000, 1040]) {
    const h = Lab.KINDS.route.height(Lab.KINDS.route.state(), w);
    for (let s = 0; s < OB.seeds.length; s++) for (const pull of ['none', 'strong']) {
      const svg = Lab.renderRoute({ s, pull, k: 5 }, { w, h, full: true });
      for (const m of svg.matchAll(/c[xy]="(-?[\d.]+)"/g)) assert.ok(+m[1] >= 0 && +m[1] <= Math.max(w, h), `${w}: ${m[0]}`);
      for (const m of svg.matchAll(/<text[^>]*x="([\d.]+)"[^>]*>([^<]*)</g)) {
        const anchorEnd = /text-anchor="end"/.test(m[0]), mid = /text-anchor="middle"/.test(m[0]);
        const len = m[2].length * 6.65, x = +m[1];
        const right = anchorEnd ? x : mid ? x + len / 2 : x + len;
        const left = anchorEnd ? x - len : mid ? x - len / 2 : x;
        assert.ok(right <= w + 1, `${w} ${s} ${pull}: "${m[2]}" runs off the right edge`);
        assert.ok(left >= -1, `${w} ${s} ${pull}: "${m[2]}" runs off the left edge`);
      }
    }
  }
});

/* ---------------------------------------------------------------- the globe (Numit) */
const NUMIT_TEXT = require('../assets/data/numit-events.js');

test('the globe: real data, every mark placed, and every mark has its words', () => {
  const { NM, globe } = Lab, D = globe();
  assert.ok(D.shadow.length > 100 && D.light.length > 20);
  assert.equal(NM.shadow.length % 4, 0);
  assert.equal(NM.light.length % 4, 0);
  assert.match(NM.asOf, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(NUMIT_TEXT.src, NM.src, 'the words and the marks come from the same commit');
  for (const kind of ['shadow', 'light']) {
    assert.equal(NUMIT_TEXT[kind].length, D[kind].length);
    D[kind].forEach((m) => {
      assert.ok(Math.abs(m.lat) <= 90 && Math.abs(m.lon) <= 180, m.id);
      assert.ok(m.wt >= 0 && m.wt <= 3 && m.country, m.id);
      const [title, place, source, date] = NUMIT_TEXT[kind][m.i];
      assert.ok(title.length > 8 && place.length > 2 && NUMIT_TEXT.sources[source], `${m.id} has no source`);
      assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(date <= NM.asOf, `${m.id} is dated after the snapshot`);
      assert.ok(place.endsWith(m.country), m.id);
    });
  }
  assert.equal(NUMIT_TEXT.light.filter((r) => r[4]).length, NM.grew);
  assert.ok(NM.floor >= 10);
});

test('the globe: a face holds exactly the marks in front of it, drawn inside the globe', () => {
  const { globe, globeView, GL } = Lab, D = globe(), o = { full: true }, rad = Math.PI / 180;
  // worked out here on its own: how far a place sits in front of the limb
  const depth = (m, lon0) => Math.sin(GL.TILT * rad) * Math.sin(m.lat * rad) + Math.cos(GL.TILT * rad) * Math.cos(m.lat * rad) * Math.cos((m.lon - lon0) * rad);
  for (const lon of [-120, -30, 46, 140]) {
    const front = globeView({ lon, lit: 1, dim: false }, 1040, 520, o);
    for (const kind of ['shadow', 'light']) {
      const want = D[kind].filter((m) => depth(m, lon) > 0.03).map((m) => m.id);
      assert.deepEqual(front[kind].map((p) => p.m.id), want, `${kind} at ${lon}`);
    }
    for (const p of [...front.shadow, ...front.light]) {
      assert.ok(Math.hypot(p.x - front.g.cx, p.y - front.g.cy) <= front.g.R + 0.01, `${p.m.id} is drawn off the globe`);
    }
  }
  // a place faces the reader when the globe is turned to it
  const delhi = D.shadow.concat(D.light).find((m) => m.country === 'India');
  assert.ok(globeView({ lon: 78, lit: 1 }, 1040, 520, o).shadow.concat(globeView({ lon: 78, lit: 1 }, 1040, 520, o).light).some((p) => p.m.id === delhi.id));
  assert.ok(!globeView({ lon: -102, lit: 1 }, 1040, 520, o).shadow.some((p) => p.m.id === delhi.id));
});

test('the globe: shadow first, then the light, and the sentence says what is drawn', () => {
  const { globe, globeView, globeTravel, sayGlobe, GL, NM } = Lab, D = globe();
  const st = Lab.KINDS.globe.state();
  globeTravel(st, 0);
  assert.equal(st.lit, 0);
  assert.equal(globeView(st, 1000, 540, {}).light.length, 0);
  assert.ok(sayGlobe(st).now.includes('not shown yet'));
  let last = -1;
  for (let u = 0; u <= 1.0001; u += 0.05) { globeTravel(st, u); assert.ok(st.lit >= last); last = st.lit; }
  assert.equal(st.lit, 1);
  assert.equal(st.lon, GL.LON);
  for (const lon of [-150, -60, 0, 46, 100]) {
    const s = { lon, lit: 1, dim: false, focus: null }, v = globeView(s, 1040, 520, { full: true }), said = sayGlobe(s).now;
    assert.ok(said.includes(`${v.shadow.length} of Numit’s ${D.shadow.length} shadow events`), said);
    assert.ok(said.includes(`${v.light.length} of its ${D.light.length} light events`), said);
    const svg = Lab.renderGlobe(s, { w: 1040, h: 520, full: true });
    assert.ok(svg.includes(`${v.shadow.length} of ${D.shadow.length} in view`) && svg.includes(`${v.light.length} of ${D.light.length} in view`));
  }
  const always = sayGlobe(st).always;
  assert.ok(always.includes(String(D.shadow.length)) && always.includes(String(D.light.length)) && always.includes(String(NM.grew)));
  assert.ok(sayGlobe({ lon: 46, lit: 1, dim: true }).now.includes(`of Numit’s ${D.light.length} light events`));
});

test('the globe: a mark can be read by pointer and by keyboard, in the words of its source', () => {
  const { globeView, globeNearest, globeStep, sayGlobe } = Lab, o = { full: true };
  globalThis.NUMIT_EVENTS = NUMIT_TEXT;
  try {
    const st = { lon: 46, lit: 1, dim: false, focus: null }, v = globeView(st, 1040, 520, o);
    const p = v.shadow[10];
    const hit = globeNearest(st, p.x, p.y, 1040, 520, o);
    const found = [...v.shadow, ...v.light].find((q) => q.m.id === hit);
    assert.ok(Math.hypot(found.x - p.x, found.y - p.y) < 0.5, 'pointing at a mark finds the mark there');
    assert.equal(globeNearest(st, 4, 4, 1040, 520, o), null);
    // stepping visits every mark in view exactly once before coming round
    const seen = new Set();
    for (let i = 0; i < v.shadow.length + v.light.length; i++) { st.focus = globeStep(st, 1, 1040, 520, o); seen.add(st.focus); }
    assert.equal(seen.size, v.shadow.length + v.light.length);
    // and every one of them can be said, with its source
    for (const q of [...v.shadow, ...v.light]) {
      const said = sayGlobe({ ...st, focus: q.m.id }).now, row = NUMIT_TEXT[q.m.kind][q.m.i];
      assert.ok(said.includes(row[0]) && said.includes(`Source: ${NUMIT_TEXT.sources[row[2]]}.`), said);
      if (row[4]) assert.ok(said.includes(row[4]), said);
    }
    // a mark turned out of view is no longer the focus
    const gone = { lon: 46 + 180, lit: 1, dim: false, focus: p.m.id };
    assert.ok(!sayGlobe(gone).now.startsWith('Shadow.'));
  } finally { delete globalThis.NUMIT_EVENTS; }
});

test('the globe: nothing runs off the drawing at any width, plate included', () => {
  const { globeView, renderGlobe } = Lab, k = Lab.KINDS.globe;
  globalThis.NUMIT_EVENTS = NUMIT_TEXT;
  try {
    for (const [w, full] of [[320, true], [375, true], [343, false], [620, true], [760, true], [1000, false], [1040, true]]) {
      const h = full ? k.height(k.state(), w) : Math.round(w * (w < 700 ? 0.75 : 0.54));
      const o = { w, h, full, tagRoom: !full && w >= 720 ? 30 : 0 };
      for (const lon of [-100, 46]) {
        const st = { lon, lit: 1, dim: false, focus: null }, v = globeView(st, w, h, o);
        const marks = [...v.shadow, ...v.light];
        for (const focus of [null, ...marks.filter((_, i) => i % 9 === 0).map((p) => p.m.id)]) {
          const svg = renderGlobe({ ...st, focus }, o);
          assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>') && !/NaN|undefined/.test(svg), `${w}`);
          for (const m of svg.matchAll(/<text[^>]*x="(-?[\d.]+)"[^>]*>([^<]*)</g)) {
            const end = /text-anchor="end"/.test(m[0]), wide = /sp-level/.test(m[0]) ? 8.1 : 6.65;
            const len = m[2].replace(/&amp;/g, '&').length * wide, x = +m[1];
            assert.ok((end ? x : x + len) <= w + 1 && (end ? x - len : x) >= -1, `${w} ${lon}: "${m[2]}" runs off the drawing`);
          }
          for (const m of svg.matchAll(/<rect class="pl-plate" x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
            assert.ok(+m[1] >= 0 && +m[2] >= 0 && +m[1] + +m[3] <= w && +m[2] + +m[4] <= h, `${w}: the plate leaves the sheet`);
          }
        }
        // the two keys never meet in the middle on a narrow sheet
        if (w < 620) {
          const keys = [...renderGlobe(st, o).matchAll(/<text class="fig-lab sp-o[nf]+ sp-level"[^>]*x="([\d.]+)"[^>]*>([^<]*)</g)];
          assert.equal(keys.length, 2);
          assert.ok(+keys[0][1] + keys[0][2].length * 8.1 < +keys[1][1] - keys[1][2].length * 8.1, `${w}: the keys overlap`);
        }
      }
    }
  } finally { delete globalThis.NUMIT_EVENTS; }
});
