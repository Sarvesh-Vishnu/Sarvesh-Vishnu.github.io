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
