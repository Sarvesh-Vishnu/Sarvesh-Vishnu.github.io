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
