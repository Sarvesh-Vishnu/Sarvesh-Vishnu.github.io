/* Portfolio — lab.js
   Figures that answer back (design.md §14.13).

   Three small models that run in the reader's browser, one per case study:
     committee — four forecasters and their ensemble, refit from any starting month
     list      — a ranked replacement list against a fixed budget
     reading   — one comment, marked up the way the pipeline reads it (mounted)
     plan      — a pipe network, listed by a model or by age (mounted)
     sample    — how many comments it takes to tell twelve facilities apart

   Everything a figure or sentence says is computed here from seeded synthetic data.
   None of it is client data; the methods are the ones the case studies describe.

   Shape: pure model functions -> pure SVG-string renderers -> a thin DOM layer.
   The same renderers produce the static fallbacks (scripts/figures.cjs) and are
   exercised by tests/lab.test.cjs under Node. No dependencies. */

(function (root, factory) {
  const Lab = factory();
  if (typeof module === 'object' && module.exports) module.exports = Lab;
  else root.Lab = Lab;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ utilities */
  function rng(seed) {                                   // mulberry32
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    let u = 0;
    while (u === 0) u = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  }
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const sigmoid = (z) => 1 / (1 + Math.exp(-z));
  const f1 = (v) => v.toFixed(1);
  const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

  /** Least squares via normal equations; X is rows of features. Small systems only. */
  function ols(X, y) {
    const p = X[0].length;
    const A = Array.from({ length: p }, () => new Array(p + 1).fill(0));
    for (let i = 0; i < X.length; i++) {
      for (let j = 0; j < p; j++) {
        A[j][p] += X[i][j] * y[i];
        for (let k = 0; k < p; k++) A[j][k] += X[i][j] * X[i][k];
      }
    }
    for (let c = 0; c < p; c++) {                        // Gauss-Jordan, partial pivoting
      let piv = c;
      for (let r2 = c + 1; r2 < p; r2++) if (Math.abs(A[r2][c]) > Math.abs(A[piv][c])) piv = r2;
      [A[c], A[piv]] = [A[piv], A[c]];
      const d = A[c][c];
      for (let k = c; k <= p; k++) A[c][k] /= d;
      for (let r2 = 0; r2 < p; r2++) {
        if (r2 === c) continue;
        const f = A[r2][c];
        for (let k = c; k <= p; k++) A[r2][k] -= f * A[c][k];
      }
    }
    return A.map((row) => row[p]);
  }

  /* ================================================================ 1. COMMITTEE
     A synthetic monthly product line (8 years): growth that slows, two seasonal
     harmonics, one supply shock, noise. Four forecasters see only the months
     before the origin and forecast the next twelve. */
  const C = { N: 96, H: 12, M: 12, FIRST: 36, YEAR0: 2018, DEFAULT: 62 };
  C.LAST = C.N - C.H;                                    // last origin with a full year of actuals
  let _series = null;
  function series() {
    if (_series) return _series;
    const r = rng(20251);
    const y = [];
    for (let t = 0; t < C.N; t++) {
      const trend = t < 54 ? 100 + 0.9 * t : 148.6 + 0.25 * (t - 54);
      const m = t % 12;
      const season = 11 * Math.sin((2 * Math.PI * m) / 12 - 0.9) + 5 * Math.sin((4 * Math.PI * m) / 12 + 0.4);
      const shock = t >= 27 && t <= 31 ? -16 * (1 - Math.abs(t - 29) / 3) : 0;
      y.push(trend + season + shock + 3.2 * gauss(r));
    }
    return (_series = y);
  }
  const monthLabel = (t) => MONTHS[t % 12] + ' ' + (C.YEAR0 + Math.floor(t / 12));

  /** Same month last year. */
  function snaive(y, n, H) {
    return Array.from({ length: H }, (_, h) => y[n - C.M + (h % C.M)]);
  }

  /** Additive Holt-Winters; smoothing weights chosen by one-step error on the history. */
  function holtWinters(y, n, H) {
    const m = C.M;
    let best = null;
    for (const a of [0.2, 0.4, 0.6]) for (const b of [0.02, 0.1]) for (const g of [0.1, 0.3]) {
      const first = mean(y.slice(0, m));
      let level = first;
      let trend = (mean(y.slice(m, 2 * m)) - first) / m;
      const s = y.slice(0, m).map((v) => v - first);
      let sse = 0;
      for (let t = m; t < n; t++) {
        const pred = level + trend + s[t % m];
        sse += (y[t] - pred) ** 2;
        const prev = level;
        level = a * (y[t] - s[t % m]) + (1 - a) * (level + trend);
        trend = b * (level - prev) + (1 - b) * trend;
        s[t % m] = g * (y[t] - level) + (1 - g) * s[t % m];
      }
      if (!best || sse < best.sse) best = { sse, level, trend, s: s.slice() };
    }
    return Array.from({ length: H }, (_, h) => best.level + (h + 1) * best.trend + best.s[(n + h) % m]);
  }

  /** Straight-line trend plus two yearly harmonics, fit to the last four years. */
  function harmonic(y, n, H) {
    const w = Math.min(n, 48);
    const row = (t) => {
      const a = (2 * Math.PI * t) / 12;
      return [1, t / 12, Math.sin(a), Math.cos(a), Math.sin(2 * a), Math.cos(2 * a)];
    };
    const X = [], yy = [];
    for (let t = n - w; t < n; t++) { X.push(row(t)); yy.push(y[t]); }
    const beta = ols(X, yy);
    return Array.from({ length: H }, (_, h) => row(n + h).reduce((s, v, j) => s + v * beta[j], 0));
  }

  /** Theta method (in its simple-exponential-smoothing-with-drift form, Hyndman & Billah
      2003): take out the seasonal shape, smooth the level, carry half the recent trend. */
  function theta(y, n, H) {
    const m = C.M;
    const w = Math.min(Math.floor(n / m) * m, 36);       // whole recent years
    // seasonal shape from detrended data, so the trend does not leak into it
    const Xw = [], yw = [];
    for (let t = n - w; t < n; t++) { Xw.push([1, t]); yw.push(y[t]); }
    const [a0, a1] = ols(Xw, yw);
    const idx = new Array(m).fill(0);
    for (let t = n - w; t < n; t++) idx[t % m] += (y[t] - (a0 + a1 * t)) / (w / m);
    const centre = mean(idx);
    for (let i = 0; i < m; i++) idx[i] -= centre;
    const d = y.slice(0, n).map((v, t) => v - idx[t % m]);
    let best = null;
    for (let a = 0.1; a < 0.95; a += 0.1) {
      let l = d[0], sse = 0;
      for (let t = 1; t < n; t++) { sse += (d[t] - l) ** 2; l = a * d[t] + (1 - a) * l; }
      if (!best || sse < best.sse) best = { sse, l, a };
    }
    const Xd = [], yd = [];
    for (let t = n - w; t < n; t++) { Xd.push([1, t]); yd.push(d[t]); }
    const slope = ols(Xd, yd)[1];
    const lag = (1 - Math.pow(1 - best.a, n)) / best.a;   // what smoothing leaves behind on a trend
    return Array.from({ length: H }, (_, h) => best.l + 0.5 * slope * (h + lag) + idx[(n + h) % m]);
  }

  const MODELS = [
    { id: 'snaive', name: 'Seasonal naive', fit: snaive },
    { id: 'hw', name: 'Holt-Winters', fit: holtWinters },
    { id: 'harmonic', name: 'Harmonic regression', fit: harmonic },
    { id: 'theta', name: 'Theta', fit: theta },
  ];

  /** Weighted absolute percentage error over the horizon. */
  function wape(actual, fc) {
    let num = 0, den = 0;
    for (let i = 0; i < actual.length; i++) { num += Math.abs(actual[i] - fc[i]); den += Math.abs(actual[i]); }
    return num / den;
  }

  const _fcCache = {};
  /** Forecasts and errors for one origin. `active` is an array of four booleans. */
  function committee(origin, active) {
    const y = series();
    const n = clamp(Math.round(origin), C.FIRST, C.LAST);
    const fc = _fcCache[n] || (_fcCache[n] = MODELS.map((mdl) => mdl.fit(y, n, C.H)));
    const actual = y.slice(n, n + C.H);
    const on = (active || [true, true, true, true]).map(Boolean);
    const members = MODELS.map((mdl, i) => ({ id: mdl.id, name: mdl.name, on: on[i], fc: fc[i], err: wape(actual, fc[i]) }));
    const live = members.filter((mm) => mm.on);
    const ens = live.length
      ? Array.from({ length: C.H }, (_, h) => mean(live.map((mm) => mm.fc[h])))
      : null;
    const errs = live.map((mm) => mm.err);
    return {
      origin: n, label: monthLabel(n), actual, members, ensemble: ens,
      err: ens ? wape(actual, ens) : null,
      best: live.length ? live.reduce((a, b) => (a.err <= b.err ? a : b)) : null,
      worst: live.length ? live.reduce((a, b) => (a.err >= b.err ? a : b)) : null,
      avgMemberErr: live.length ? mean(errs) : null,
    };
  }

  /** Rolling-origin backtest over every valid starting month. */
  function backtest(active) {
    let beatsBest = 0, isWorst = 0, beatsAvg = 0, total = 0;
    const ensErrs = [];
    const memberErrs = MODELS.map(() => []);
    for (let n = C.FIRST; n <= C.LAST; n++) {
      const c = committee(n, active);
      if (c.err === null) continue;
      total++;
      ensErrs.push(c.err);
      c.members.forEach((mm, i) => { if (mm.on) memberErrs[i].push(mm.err); });
      const liveCount = c.members.filter((mm) => mm.on).length;
      if (liveCount > 1 && c.err < c.best.err) beatsBest++;
      if (liveCount > 1 && c.err >= c.worst.err) isWorst++;
      if (c.err <= c.avgMemberErr + 1e-12) beatsAvg++;
    }
    return {
      origins: total, beatsBest, isWorst, beatsAvg,
      ensMean: ensErrs.length ? mean(ensErrs) : null,
      memberMean: memberErrs.map((e) => (e.length ? mean(e) : null)),
    };
  }

  /* ===================================================================== 2. LIST
     400 synthetic water mains. Each has a true failure probability driven by age,
     material, soil and break history; the model sees that risk through noise.
     With budget for k replacements, which list prevents the most failures? */
  const L = { M: 400, MAXK: 120, DEFAULT: 40 };
  let _mains = null;
  function mains() {
    if (_mains) return _mains;
    const r = rng(7341);
    const items = [];
    for (let i = 0; i < L.M; i++) {
      const age = 12 + 88 * Math.pow(r(), 1.25);
      const castIron = r() < 0.35 ? 1 : 0;
      const soil = gauss(r);
      const breaks = (r() < 0.22 ? 1 : 0) + (r() < 0.06 ? 1 : 0);
      const logit = -5.0 + 0.026 * age + 0.85 * castIron + 0.5 * soil + 1.15 * breaks;
      const p = sigmoid(logit);
      const fail = r() < p;
      const score = sigmoid(logit + 0.95 * gauss(r));     // an imperfect model
      items.push({ id: i, age, p, fail, score });
    }
    const byScore = items.slice().sort((a, b) => b.score - a.score);
    const byAge = items.slice().sort((a, b) => b.age - a.age);
    const cum = (arr) => { const c = [0]; arr.forEach((it) => c.push(c[c.length - 1] + (it.fail ? 1 : 0))); return c; };
    const failures = items.filter((it) => it.fail).length;
    return (_mains = { items, byScore, byAge, cumModel: cum(byScore), cumAge: cum(byAge), failures });
  }
  /** What a budget of k replacements buys under each way of choosing. */
  function list(k) {
    const d = mains();
    const kk = clamp(Math.round(k), 0, L.MAXK);
    return {
      k: kk, total: L.M, failures: d.failures,
      model: d.cumModel[kk], oldest: d.cumAge[kk],
      random: (kk * d.failures) / L.M,
      precision: kk ? d.cumModel[kk] / kk : 0,
    };
  }

  /* =================================================================== 3. SAMPLE
     Twelve facilities with fixed true shares of negative comments. Reading n
     comments at each gives an estimate with a Wilson 95% interval. One draw fixes
     the luck (z) per facility, so the intervals tighten smoothly as n grows. */
  const S = { F: 12, NMIN: 30, NMAX: 12000, DEFAULT: 120, PROJECT_N: 8300 };
  let _fac = null;
  function facilities() {
    if (_fac) return _fac;
    const r = rng(118);
    const p = [];
    for (let i = 0; i < S.F; i++) p.push(clamp(0.235 + 0.045 * gauss(r), 0.12, 0.38));
    const trueWorst = p.indexOf(Math.max(...p));
    return (_fac = { p, trueWorst });
  }
  const _draws = {};
  function luck(draw) {
    if (_draws[draw]) return _draws[draw];
    const r = rng(9000 + draw * 131);
    return (_draws[draw] = Array.from({ length: S.F }, () => gauss(r)));
  }
  function wilson(ph, n) {
    const z = 1.959964, z2 = z * z;
    const centre = (ph + z2 / (2 * n)) / (1 + z2 / n);
    const half = (z * Math.sqrt((ph * (1 - ph)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
    return [centre - half, centre + half];
  }
  function estimate(n, draw) {
    const { p } = facilities();
    const z = luck(draw);
    return p.map((pi, i) => clamp(pi + z[i] * Math.sqrt((pi * (1 - pi)) / n), 0.005, 0.995));
  }
  /** Estimates, intervals and what can honestly be concluded at n comments each. */
  function sample(n, draw) {
    const fac = facilities();
    const nn = clamp(Math.round(n), S.NMIN, S.NMAX);
    const d = draw || 0;
    const est = estimate(nn, d);
    const overall = mean(est);
    const rows = est.map((ph, i) => {
      const [lo, hi] = wilson(ph, nn);
      return { id: i, name: 'F' + String(i + 1).padStart(2, '0'), est: ph, lo, hi, truth: fac.p[i], apart: lo > overall || hi < overall };
    });
    rows.sort((a, b) => b.est - a.est);
    // how often the facility that tops the list is the one that is truly worst
    const TRIALS = 300;
    let hits = 0;
    for (let t = 1; t <= TRIALS; t++) {
      const e = estimate(nn, 1000 + t);
      if (e.indexOf(Math.max(...e)) === fac.trueWorst) hits++;
    }
    return {
      n: nn, draw: d, rows, overall,
      apart: rows.filter((rw) => rw.apart).length,
      looksWorst: rows[0].name, isTrulyWorst: rows[0].id === fac.trueWorst,
      stability: hits / TRIALS, trials: TRIALS,
    };
  }
  /** Slider position (0..1) <-> n, on a log scale. */
  const nFromUnit = (u) => Math.round(Math.exp(Math.log(S.NMIN) + clamp(u, 0, 1) * (Math.log(S.NMAX) - Math.log(S.NMIN))));
  const unitFromN = (n) => (Math.log(n) - Math.log(S.NMIN)) / (Math.log(S.NMAX) - Math.log(S.NMIN));

  /* ================================================================== renderers
     Pure: (state, {w, h, full}) -> SVG markup. Sizes are real pixels, so the mono
     labels stay one size on every screen. Classes come from styles.css (.fig-*). */
  const P = (pts) => 'M' + pts.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' L');
  const open = (w, h) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" focusable="false">`;

  /* The committee is drawn as a reading head: thirty months of history slide under a
     fixed forecast window, so the next twelve months always have room. In full mode a
     strip underneath shows the whole series and where the window sits. */
  const WIN = 30;
  const NARROW = 620;                                   // below this, labels leave the plot
  function committeeGeom(w, h, full, slim, tagRoom) {
    const wide = full && w >= NARROW;
    const padL = full ? 14 : slim ? 2 : 16, padR = wide ? 192 : slim ? 2 : 16, padT = (full ? 18 : slim ? 10 : 32) + (tagRoom || 0);
    const strip = full ? 52 : 0;                          // overview strip, with its gap
    const plotB = h - strip - (full ? 24 : slim ? 6 : 20);
    return { wide, padL, padR, padT, plotB, stripT: h - strip + 14, stripB: h - 6, pxPerMonth: (w - padL - padR) / (WIN + C.H - 1) };
  }
  function renderCommittee(st, o) {
    const { w, h, full } = o;
    const g = committeeGeom(w, h, full, !full && o.slim, o.tagRoom);
    const y = series();
    const c = committee(st.origin, st.active);
    const n = c.origin;
    const X = (t) => g.padL + (t - (n - WIN)) * g.pxPerMonth;
    const mid = mean(y.slice(n - 12, n)) + 3;             // follow the level, not the wiggles
    const tight = !full && o.slim;                        // the hero strip is short: give the line more of it
    const lo = mid - (tight ? 27 : 36), hi = mid + (tight ? 29 : 40);
    const Y = (v) => g.padT + ((hi - clamp(v, lo, hi)) / (hi - lo)) * (g.plotB - g.padT);
    const hist = [], fut = [];
    for (let t = n - WIN; t < n; t++) hist.push([X(t), Y(y[t])]);
    for (let t = n - 1; t < n + C.H; t++) fut.push([X(t), Y(y[t])]);
    const line = (fc) => P([[X(n - 1), Y(y[n - 1])]].concat(fc.map((v, i) => [X(n + i), Y(v)])));
    const xo = X(n - 0.5).toFixed(1);
    let s = open(w, h);
    s += `<line class="fig-grid" x1="${g.padL}" y1="${g.plotB}" x2="${w - g.padR}" y2="${g.plotB}"/>`;
    s += `<line class="fig-now" x1="${xo}" y1="${g.padT - 6}" x2="${xo}" y2="${g.plotB}"/>`;
    s += `<path class="fig-ink" d="${P(hist)}"/>`;
    s += `<path class="fig-ink fig-future" d="${P(fut)}"/>`;
    c.members.forEach((mm) => { if (mm.on) s += `<path class="fig-ink fig-model" d="${line(mm.fc)}"/>`; });
    if (c.ensemble) s += `<path class="fig-acc" d="${line(c.ensemble)}"/>`;
    if (full) {
      // direct labels at the right end, nudged apart
      const ends = c.members.filter((mm) => mm.on).map((mm) => ({ y: Y(mm.fc[C.H - 1]), text: `${mm.name} ${f1(mm.err * 100)}%` }));
      if (c.ensemble) ends.push({ y: Y(c.ensemble[C.H - 1]), text: `Committee ${f1(c.err * 100)}%`, acc: true });
      ends.push({ y: Y(y[n + C.H - 1]), text: 'What happened', quiet: true });
      ends.sort((a, b) => a.y - b.y);
      let last = -1e9;
      ends.forEach((e) => { e.y = Math.max(e.y, last + 14); last = e.y; });
      const lx = (X(n + C.H - 1) + 10).toFixed(1);
      if (g.wide) ends.forEach((e) => { s += `<text class="fig-lab${e.acc ? ' fig-lab-acc' : ''}${e.quiet ? ' fig-lab-quiet' : ''}" x="${lx}" y="${(e.y + 3.5).toFixed(1)}">${e.text}</text>`; });
      for (let t = n - WIN; t < n + C.H; t++) {
        if (t % 12 === 0) s += `<text class="fig-lab" x="${X(t).toFixed(1)}" y="${g.plotB + 15}" text-anchor="middle">${C.YEAR0 + t / 12}</text>`;
      }
      s += `<text class="fig-lab fig-lab-acc" x="${(+xo - 6).toFixed(1)}" y="${g.padT + 4}" text-anchor="end">forecast from ${c.label}</text>`;
      // overview strip: the whole series, the window, the origin
      const X2 = (t) => g.padL + (t / (C.N - 1)) * (w - g.padL - g.padR);
      const lo2 = Math.min(...y), hi2 = Math.max(...y);
      const Y2 = (v) => g.stripT + ((hi2 - v) / (hi2 - lo2)) * (g.stripB - g.stripT);
      s += `<rect class="fig-band" x="${X2(n - WIN).toFixed(1)}" y="${g.stripT - 4}" width="${(X2(n + C.H - 1) - X2(n - WIN)).toFixed(1)}" height="${g.stripB - g.stripT + 8}"/>`;
      s += `<path class="fig-ink" d="${P(y.map((v, t) => [X2(t), Y2(v)]))}"/>`;
      s += `<line class="fig-now" x1="${X2(n).toFixed(1)}" y1="${g.stripT - 4}" x2="${X2(n).toFixed(1)}" y2="${g.stripB + 4}"/>`;
      s += `<circle class="fig-handle" cx="${X2(n).toFixed(1)}" cy="${((g.stripT + g.stripB) / 2).toFixed(1)}" r="5.5"/>`;
    }
    return s + '</svg>';
  }
  renderCommittee.geom = committeeGeom;

  /* The record (design.md §14.16): the committee's miss and each member's, for every
     starting month. The hero shows one forecast; this shows all of them. */
  let _record = null;
  function record() {
    if (_record) return _record;
    const rows = [];
    for (let n = C.FIRST; n <= C.LAST; n++) {
      const c = committee(n);
      rows.push({ n, label: c.label, err: c.err, members: c.members.map((mm) => mm.err), best: c.best.err, worst: c.worst.err });
    }
    return (_record = rows);
  }
  function renderRecord(st, o) {
    const { w, h, full } = o;
    const rows = record();
    const wide = full && w >= NARROW;
    const padL = full ? 40 : 18, padR = wide ? 150 : 18, padT = (full ? 22 : 34) + (o.tagRoom || 0), padB = full ? 32 : 20;
    const X = (n) => padL + ((n - C.FIRST) / (C.LAST - C.FIRST)) * (w - padL - padR);
    const top = Math.ceil(Math.max(...rows.map((r) => r.worst)) * 50) / 50;      // next 2% line
    const Y = (v) => h - padB - (v / top) * (h - padT - padB);
    const at = clamp(Math.round(st.origin), C.FIRST, C.LAST);
    const cur = rows[at - C.FIRST];
    let s = open(w, h);
    s += `<line class="fig-grid" x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}"/>`;
    MODELS.forEach((mdl, i) => { s += `<path class="fig-ink fig-model" d="${P(rows.map((r) => [X(r.n), Y(r.members[i])]))}"/>`; });
    s += `<path class="fig-acc" d="${P(rows.map((r) => [X(r.n), Y(r.err)]))}"/>`;
    s += `<line class="fig-now" x1="${X(at).toFixed(1)}" y1="${padT - 6}" x2="${X(at).toFixed(1)}" y2="${h - padB}"/>`;
    s += `<circle class="fig-dot" cx="${X(at).toFixed(1)}" cy="${Y(cur.err).toFixed(1)}" r="4.5"/>`;
    if (full) {
      for (let v = 0; v <= top + 1e-9; v += top / 2) s += `<text class="fig-lab" x="${padL - 8}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end">${Math.round(v * 100)}%</text>`;
      for (let n = C.FIRST; n <= C.LAST; n++) if (n % 12 === 0) s += `<text class="fig-lab" x="${X(n).toFixed(1)}" y="${h - padB + 16}" text-anchor="middle">${C.YEAR0 + n / 12}</text>`;
      s += `<text class="fig-lab fig-lab-quiet" x="${(w - padR).toFixed(1)}" y="${padT - 8}" text-anchor="end">how far off, by the month the forecast started</text>`;
      if (wide) {
        const last = rows[rows.length - 1];
        const ends = MODELS.map((mdl, i) => ({ y: Y(last.members[i]), text: mdl.name })).concat([{ y: Y(last.err), text: 'Committee', acc: true }]).sort((a, b) => a.y - b.y);
        let prev = -1e9;
        ends.forEach((e) => { e.y = Math.max(e.y, prev + 14); prev = e.y; });
        ends.forEach((e) => { s += `<text class="fig-lab${e.acc ? ' fig-lab-acc' : ''}" x="${(w - padR + 8).toFixed(1)}" y="${(e.y + 3.5).toFixed(1)}">${e.text}</text>`; });
      }
    }
    return s + '</svg>';
  }
  function sayRecord(st) {
    const cur = record()[clamp(Math.round(st.origin), C.FIRST, C.LAST) - C.FIRST];
    return { now: '', always: '', tag: `${cur.label} · ${pct(cur.err)} off` };
  }

  const LIST_PAD = [34, 118];
  function renderList(st, o) {
    const { w, h, full } = o;
    const d = mains();
    const r = list(st.k);
    const wide = full && w >= NARROW;
    const slim = !full && o.slim;                        // hero strip: no tag to clear, edge to edge
    const padL = full ? LIST_PAD[0] : slim ? 2 : 18, padR = wide ? LIST_PAD[1] : slim ? 8 : 18, padT = full ? 30 : slim ? 12 : 32, padB = full ? 38 : slim ? 8 : 20;
    const X = (k) => padL + (k / L.MAXK) * (w - padL - padR);
    const top = Math.max(d.cumModel[L.MAXK], 1);
    const Y = (v) => h - padB - (v / top) * (h - padT - padB);
    const curve = (cum) => { const pts = []; for (let k = 0; k <= L.MAXK; k++) pts.push([X(k), Y(cum[k])]); return pts; };
    const model = curve(d.cumModel), age = curve(d.cumAge);
    // what ranking buys over chance, up to the budget line
    const area = model.slice(0, r.k + 1).concat([[X(r.k), Y(r.random)], [X(0), Y(0)]]);
    let s = open(w, h);
    s += `<line class="fig-grid" x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}"/>`;
    if (r.k > 0) s += `<path class="fig-band" d="${P(area)} Z"/>`;
    s += `<path class="fig-ink fig-model" d="${P([[X(0), Y(0)], [X(L.MAXK), Y((L.MAXK * d.failures) / L.M)]])}"/>`;
    s += `<path class="fig-ink" d="${P(age)}"/>`;
    s += `<path class="fig-acc" d="${P(model)}"/>`;
    s += `<line class="fig-now" x1="${X(r.k).toFixed(1)}" y1="${padT - 8}" x2="${X(r.k).toFixed(1)}" y2="${h - padB}"/>`;
    s += `<circle class="fig-dot fig-dot-ink" cx="${X(r.k).toFixed(1)}" cy="${Y(r.oldest).toFixed(1)}" r="3.5"/>`;
    s += `<circle class="fig-dot" cx="${X(r.k).toFixed(1)}" cy="${Y(r.model).toFixed(1)}" r="4.5"/>`;
    if (full) {
      const ends = [
        { y: Y(d.cumModel[L.MAXK]), text: 'Model’s list', acc: true },
        { y: Y(d.cumAge[L.MAXK]), text: 'Oldest first', acc: false },
        { y: Y((L.MAXK * d.failures) / L.M), text: 'At random', acc: false, quiet: true },
      ].sort((a, b) => a.y - b.y);
      let last = -1e9;
      ends.forEach((e) => { e.y = Math.max(e.y, last + 13); last = e.y; });
      ends.forEach((e) => {
        s += wide
          ? `<text class="fig-lab${e.acc ? ' fig-lab-acc' : ''}${e.quiet ? ' fig-lab-quiet' : ''}" x="${(w - padR + 8).toFixed(1)}" y="${(e.y + 3).toFixed(1)}">${e.text}</text>`
          : `<text class="fig-lab${e.acc ? ' fig-lab-acc' : ''}${e.quiet ? ' fig-lab-quiet' : ''}" x="${(w - padR).toFixed(1)}" y="${(e.y - 7).toFixed(1)}" text-anchor="end">${e.text}</text>`;
      });
      [0, 40, 80, 120].forEach((k) => { s += `<text class="fig-lab" x="${X(k).toFixed(1)}" y="${h - padB + 16}" text-anchor="middle">${k}</text>`; });
      s += `<text class="fig-lab fig-lab-quiet" x="${padL}" y="${h - 4}">mains replaced, of ${L.M}</text>`;
      [0, top].forEach((v) => { s += `<text class="fig-lab" x="${padL - 8}" y="${(Y(v) + 3).toFixed(1)}" text-anchor="end">${v}</text>`; });
      s += `<text class="fig-lab fig-lab-quiet" x="${padL - 22}" y="${padT - 14}">failures prevented</text>`;
      s += `<circle class="fig-handle" cx="${X(r.k).toFixed(1)}" cy="${h - padB}" r="6"/>`;
    }
    return s + '</svg>';
  }

  /** The 400 mains in the model's order: replaced ones filled, coming failures ringed. */
  function renderField(st, o) {
    const { w } = o;
    const d = mains();
    const k = clamp(Math.round(st.k), 0, L.MAXK);
    const cols = w < 520 ? 25 : 50, rowsN = Math.ceil(L.M / cols);
    const cell = Math.floor((w - 2) / cols), size = Math.max(3, cell - 3), h = rowsN * cell + 2;
    let s = open(w, h);
    d.byScore.forEach((it, i) => {
      const x = 1 + (i % cols) * cell, yy = 1 + Math.floor(i / cols) * cell;
      const cls = 'fld' + (i < k ? ' fld-on' : '') + (it.fail ? ' fld-fail' : '');
      s += `<rect class="${cls}" x="${x}" y="${yy}" width="${size}" height="${size}" rx="1"/>`;
    });
    return s + '</svg>';
  }

  function renderSample(st, o) {
    const { w, h, full } = o;
    const r = sample(st.n, st.draw);
    const padL = full ? 44 : 18, padR = full ? 20 : 18, padT = (full ? 24 : 34) + (o.tagRoom || 0), padB = full ? 34 : 18;
    const lo = 0.03, hi = 0.52;
    const X = (v) => padL + ((clamp(v, lo, hi) - lo) / (hi - lo)) * (w - padL - padR);
    const rh = (h - padT - padB) / S.F;
    let s = open(w, h);
    s += `<line class="fig-axis" x1="${X(r.overall).toFixed(1)}" y1="${padT - 6}" x2="${X(r.overall).toFixed(1)}" y2="${h - padB}"/>`;
    r.rows.forEach((rw, i) => {
      const cy = padT + (i + 0.5) * rh;
      const top = i === 0;
      s += `<line class="fig-ci${rw.apart ? ' fig-ci-on' : ''}" x1="${X(rw.lo).toFixed(1)}" y1="${cy.toFixed(1)}" x2="${X(rw.hi).toFixed(1)}" y2="${cy.toFixed(1)}"/>`;
      s += `<circle class="fig-pt${rw.apart ? ' fig-pt-on' : ''}${top ? ' fig-pt-top' : ''}" cx="${X(rw.est).toFixed(1)}" cy="${cy.toFixed(1)}" r="${top ? 4.5 : 3.5}"/>`;
      if (full) s += `<text class="fig-lab${rw.apart ? '' : ' fig-lab-quiet'}" x="${padL - 10}" y="${(cy + 3).toFixed(1)}" text-anchor="end">${rw.name}</text>`;
    });
    if (full) {
      [0.1, 0.2, 0.3, 0.4, 0.5].forEach((v) => { s += `<text class="fig-lab" x="${X(v).toFixed(1)}" y="${h - padB + 16}" text-anchor="middle">${Math.round(v * 100)}%</text>`; });
      s += `<text class="fig-lab fig-lab-quiet" x="${(w - padR).toFixed(1)}" y="${h - 4}" text-anchor="end">share of comments that are negative</text>`;
      s += `<text class="fig-lab fig-lab-quiet" x="${(X(r.overall) + 6).toFixed(1)}" y="${padT - 8}">average</text>`;
    }
    return s + '</svg>';
  }

  /* ================================================================== sentences
     The prose that rewrites itself. Returned as plain text; numbers are the model's. */
  const pct = (v) => f1(v * 100) + '%';
  const plural = (n, one, many) => (n === 1 ? one : many);

  function sayCommittee(st) {
    const c = committee(st.origin, st.active);
    const live = c.members.filter((mm) => mm.on);
    if (!live.length) return { now: 'Switch on at least one forecaster.', always: '', tag: 'no forecasters' };
    const bt = backtest(st.active);
    let now;
    if (live.length === 1) {
      now = `Forecasting from ${c.label} with ${live[0].name} alone, the next twelve months come in ${pct(c.err)} off.`;
    } else {
      now = `Forecasting from ${c.label}, the committee is ${pct(c.err)} off over the next twelve months. ` +
        `Its members range from ${pct(c.best.err)} (${c.best.name}) to ${pct(c.worst.err)} (${c.worst.name}).`;
    }
    let always = '';
    if (live.length > 1) {
      const means = bt.memberMean.filter((v) => v !== null);
      always = `Across all ${bt.origins} starting months, the committee beat every one of its members in ${bt.beatsBest} ` +
        `and was the worst forecaster in ${bt.isWorst}. On average it was ${pct(bt.ensMean)} off, against ` +
        `${pct(Math.min(...means))} to ${pct(Math.max(...means))} for its members: you cannot know in advance which one will be right.`;
    }
    return { now, always, tag: `${c.label} · ${pct(c.err)} off` };
  }

  function sayList(st) {
    const r = list(st.k);
    if (r.k === 0) {
      return { now: `No budget, no replacements: all ${r.failures} failures arrive as emergencies.`, always: '', tag: `0 replaced · ${r.failures} failures` };
    }
    const now = `With budget for ${r.k} of ${r.total} mains, the model’s list prevents ${r.model} of the ${r.failures} failures on the way. ` +
      `Replacing the oldest mains first prevents ${r.oldest}; choosing at random, about ${f1(r.random)}.`;
    const always = `${Math.round(r.precision * 100)}% of the mains on the model’s list were going to fail, against ${f1((r.failures / r.total) * 100)}% of mains overall.`;
    return { now, always, tag: `replace ${r.k} · prevents ${r.model} of ${r.failures}` };
  }

  function saySample(st) {
    const r = sample(st.n, st.draw);
    const nn = r.n.toLocaleString('en-US');
    const now = `Reading ${nn} comments at each facility, ${r.apart} of ${S.F} can be told apart from the average. ` +
      `${r.looksWorst} looks worst, and in this draw it ${r.isTrulyWorst ? 'really is' : 'is not the one that truly is'}.`;
    const always = `Redraw the same ${nn} comments ${r.trials} times and the truly worst facility tops the list in ${Math.round(r.stability * 100)}% of them.`;
    return { now, always, tag: `n = ${nn} · ${r.apart} of ${S.F} apart` };
  }

  /* ====================================================================== 4. SPINE
     Not a model: a drawing of the system built at Cooper Surgical (design.md §14.18).
     Five columns, from sources to decisions, and for each decision the path that
     feeds it. No data and no numbers appear; the names are the real components.
     The picture and the sentence are both read from PATHS, so they cannot disagree. */
  const SP_COLS = ['Sources', 'Spine', 'Analysis', 'Surfaces', 'Decisions'];
  const SP_NODES = {
    tx:     { col: 0, label: 'Sales transactions',       say: 'sales transactions' },
    crm:    { col: 0, label: 'CRM and territories',      say: 'CRM and territory data' },
    fin:    { col: 0, label: 'Finance and pricing',      say: 'finance and pricing data' },
    pub:    { col: 0, label: 'Public sources',           say: 'public sources' },
    spine:  { col: 1, label: 'Data spine',               say: 'the data spine' },
    fc:     { col: 2, label: 'Ensemble forecasting',     say: 'ensemble forecasting' },
    quota:  { col: 2, label: 'Quota allocation',         say: 'quota allocation' },
    scen:   { col: 2, label: 'Scenario and sensitivity', say: 'scenario and sensitivity analysis' },
    seg:    { col: 2, label: 'Customer targeting',       say: 'customer targeting' },
    exp:    { col: 2, label: 'Experiment design',        say: 'experiment design' },
    elas:   { col: 2, label: 'Price elasticity',         say: 'price elasticity analysis' },
    rc:     { col: 2, label: 'Research companion',       say: 'the research companion' },
    pbi:    { col: 3, label: 'Power BI views',           say: 'Power BI views' },
    exec:   { col: 3, label: 'Executive readouts',       say: 'executive readouts' },
    brief:  { col: 3, label: 'Weekly market brief',      say: 'the weekly market brief' },
    aop:    { col: 4, label: 'Annual operating plan',    say: 'The annual operating plan' },
    quotas: { col: 4, label: 'Territory quotas',         say: 'Territory quotas', plural: true },
    xsell:  { col: 4, label: 'Cross-sell programme',     say: 'The cross-sell programme' },
    supply: { col: 4, label: 'Supply and demand plan',   say: 'The supply and demand plan' },
    lrp:    { col: 4, label: 'Long-range plan',          say: 'The long-range plan' },
    view:   { col: 4, label: 'Leadership’s market view', say: 'Leadership’s market view' },
  };
  // decision -> what it is read from, level by level (sources, spine, analysis, surface)
  const SP_PATHS = {
    aop:    { sources: ['tx', 'fin'], spine: true,  analysis: ['fc', 'scen'],   surface: 'exec' },
    quotas: { sources: ['tx', 'crm'], spine: true,  analysis: ['fc', 'quota'],  surface: 'pbi' },
    xsell:  { sources: ['tx', 'crm'], spine: true,  analysis: ['seg', 'exp'],   surface: 'pbi' },
    supply: { sources: ['tx'],        spine: true,  analysis: ['fc'],           surface: 'exec' },
    lrp:    { sources: ['tx', 'fin'], spine: true,  analysis: ['scen', 'elas'], surface: 'exec' },
    view:   { sources: ['pub'],       spine: false, analysis: ['rc'],           surface: 'brief' },
  };
  const SP_DECISIONS = Object.keys(SP_PATHS);
  /** Every node and edge on one decision's path. */
  function spinePath(d) {
    const pth = SP_PATHS[d];
    const nodes = new Set([d, pth.surface, ...pth.analysis, ...pth.sources]);
    const edges = [];
    if (pth.spine) {
      nodes.add('spine');
      pth.sources.forEach((src) => edges.push([src, 'spine']));
      pth.analysis.forEach((an) => edges.push(['spine', an]));
    } else {
      pth.sources.forEach((src) => pth.analysis.forEach((an) => edges.push([src, an])));
    }
    pth.analysis.forEach((an) => edges.push([an, pth.surface]));
    edges.push([pth.surface, d]);
    return { nodes, edges };
  }
  /** What is lit for a focused node: every decision whose path passes through it. */
  function spineFocus(id) {
    const focus = SP_NODES[id] ? id : 'aop';
    const decisions = SP_DECISIONS.filter((d) => spinePath(d).nodes.has(focus));
    const nodes = new Set(), edges = new Set();
    decisions.forEach((d) => { const q = spinePath(d); q.nodes.forEach((n) => nodes.add(n)); q.edges.forEach((e) => edges.add(e.join('>'))); });
    return { focus, decisions, nodes, edges };
  }
  let _spEdges = null;
  function spineEdges() {
    if (_spEdges) return _spEdges;
    const seen = new Map();
    SP_DECISIONS.forEach((d) => spinePath(d).edges.forEach((e) => seen.set(e.join('>'), e)));
    return (_spEdges = [...seen.values()]);
  }

  const SP_CH = 6.65;                                    // width of one 11px mono character
  const SP_WIDE = 900;                                   // below this the map becomes a trace
  /** Where each label sits on the wide map. */
  function spineLayout(w, h, o) {
    const padX = 22, padT = 62 + ((o && o.tagRoom) || 0) * 0.6, padB = 22;
    const byCol = SP_COLS.map((_, c) => Object.keys(SP_NODES).filter((id) => SP_NODES[id].col === c));
    const widths = byCol.map((ids) => Math.max(...ids.map((id) => SP_NODES[id].label.length)) * SP_CH);
    const gap = (w - 2 * padX - widths.reduce((a, b) => a + b, 0)) / (SP_COLS.length - 1);
    const pos = {};
    let x = padX;
    byCol.forEach((ids, c) => {
      ids.forEach((id, i) => {
        const y = padT + ((i + 0.5) / ids.length) * (h - padT - padB);
        pos[id] = { x, y, w: SP_NODES[id].label.length * SP_CH, right: x + SP_NODES[id].label.length * SP_CH };
      });
      x += widths[c] + gap;
    });
    const colX = []; x = padX;
    widths.forEach((cw) => { colX.push(x); x += cw + gap; });
    return { pos, colX, padT };
  }
  function renderSpine(st, o) {
    const { w, h } = o;
    const f = spineFocus(st.focus);
    let s = open(w, h);
    if (w < SP_WIDE) {
      // the trace: one decision's path, read top to bottom
      const d = f.decisions.includes(f.focus) ? f.focus : f.decisions[0];
      const pth = SP_PATHS[d];
      const levels = [
        ['Sources', pth.sources.map((id) => SP_NODES[id].label)],
        ['Spine', pth.spine ? [SP_NODES.spine.label] : ['not used: public only']],
        ['Analysis', pth.analysis.map((id) => SP_NODES[id].label)],
        ['Surface', [SP_NODES[pth.surface].label]],
        ['Decision', [SP_NODES[d].label]],
      ];
      const lines = levels.reduce((n, lv) => n + lv[1].length, 0);
      const top = o.full ? 40 : 58, step = Math.min(24, (h - top - 16) / (lines + 2));
      const tight = w < 300;                             // the smallest phones: pull the trace to the edge
      const x0 = tight ? 10 : 22, x1 = x0 + (tight ? 12 : 16), x2 = x1 + (tight ? 66 : 76);
      let y = top;
      const ys = [];
      levels.forEach(([name, items], li) => {
        ys.push(y);
        s += `<circle class="sp-dot is-on" cx="${x0}" cy="${(y - 3.5).toFixed(1)}" r="3"/>`;
        s += `<text class="fig-lab fig-lab-quiet sp-level" x="${x1}" y="${y.toFixed(1)}">${name.toUpperCase()}</text>`;
        items.forEach((txt, i) => {
          const quiet = !pth.spine && li === 1;
          s += `<text class="fig-lab${li === 4 ? ' fig-lab-acc' : quiet ? ' fig-lab-quiet' : ' sp-on'}" x="${x2}" y="${(y + i * step).toFixed(1)}">${txt}</text>`;
        });
        y += items.length * step + step * 0.5;
      });
      s += `<path class="sp-edge is-on" d="M${x0},${(ys[0] - 3.5).toFixed(1)} L${x0},${(ys[4] - 3.5).toFixed(1)}"/>`;
      return s + '</svg>';
    }
    const L = spineLayout(w, h, o);
    SP_COLS.forEach((name, c) => { s += `<text class="fig-lab fig-lab-quiet sp-level" x="${L.colX[c].toFixed(1)}" y="${(L.padT - 20).toFixed(1)}">${name.toUpperCase()}</text>`; });
    const curve = (a, b) => {
      const p0 = L.pos[a], p1 = L.pos[b];
      const xa = p0.right + 8, xb = p1.x - 10, ya = p0.y - 3.5, yb = p1.y - 3.5, mx = (xa + xb) / 2;
      return `M${xa.toFixed(1)},${ya.toFixed(1)} C${mx.toFixed(1)},${ya.toFixed(1)} ${mx.toFixed(1)},${yb.toFixed(1)} ${xb.toFixed(1)},${yb.toFixed(1)}`;
    };
    const all = spineEdges();
    all.filter((e) => !f.edges.has(e.join('>'))).forEach((e) => { s += `<path class="sp-edge" d="${curve(e[0], e[1])}"/>`; });
    all.filter((e) => f.edges.has(e.join('>'))).forEach((e) => { s += `<path class="sp-edge is-on" d="${curve(e[0], e[1])}"/>`; });
    Object.keys(SP_NODES).forEach((id) => {
      const q = L.pos[id], on = f.nodes.has(id), isFocus = id === f.focus;
      const cls = isFocus || (on && SP_NODES[id].col === 4) ? ' fig-lab-acc' : on ? ' sp-on' : ' sp-off';
      s += `<text class="fig-lab sp-node${cls}" x="${q.x.toFixed(1)}" y="${q.y.toFixed(1)}">${SP_NODES[id].label}</text>`;
      if (SP_NODES[id].col > 0) s += `<circle class="sp-dot${on ? ' is-on' : ''}" cx="${(q.x - 10).toFixed(1)}" cy="${(q.y - 3.5).toFixed(1)}" r="2.5"/>`;
      if (SP_NODES[id].col < 4) s += `<circle class="sp-dot${on ? ' is-on' : ''}" cx="${(q.right + 8).toFixed(1)}" cy="${(q.y - 3.5).toFixed(1)}" r="2.5"/>`;
    });
    return s + '</svg>';
  }
  const listOf = (items) => (items.length < 2 ? items.join('') : items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1]);
  function saySpine(st, o) {
    const f = spineFocus(st.focus);
    let now;
    if (SP_PATHS[f.focus]) {
      const pth = SP_PATHS[f.focus];
      const an = listOf(pth.analysis.map((id) => SP_NODES[id].say));
      const src = listOf(pth.sources.map((id) => SP_NODES[id].say));
      const be = SP_NODES[f.focus].plural ? 'are' : 'is';
      now = pth.spine
        ? `${SP_NODES[f.focus].say} ${be} read from ${SP_NODES[pth.surface].say}, built on ${an}. All of it runs on the data spine, fed by ${src}.`
        : `${SP_NODES[f.focus].say} ${be} read from ${SP_NODES[pth.surface].say}, drafted by ${an} from ${src} only. It never touches the internal spine.`;
    } else {
      const label = SP_NODES[f.focus].label;
      const ds = listOf(f.decisions.map((d) => SP_NODES[d].label.toLowerCase()));
      now = `${label} feeds ${f.decisions.length} of the ${SP_DECISIONS.length} decisions: ${ds}.`;
    }
    const viaSpine = SP_DECISIONS.filter((d) => SP_PATHS[d].spine).length;
    return {
      now,
      always: `${viaSpine} of the ${SP_DECISIONS.length} decisions run on one spine. The sixth, the market brief, is kept apart on purpose: nothing internal goes into it.`,
      tag: o && o.w && o.w < SP_WIDE ? 'Schematic' : `Schematic · ${SP_NODES[f.focus].label}`,
    };
  }

  /* ------------------------------------------------------------------ the reading
     Not a model either: one comment, marked up the way the Pinnacle pipeline read each
     record (design.md §14.19). Five steps: as written, cleaned, tone, touchpoint,
     driver. The comments are written for the page and are never a patient's words; no
     data and no results appear. The picture and the sentence are both read from
     RD_COMMENTS, so they cannot disagree.

     Markup: [a:words] marks a remark; marks.a says what the pipeline attaches to it. */
  const RD_STEPS = ['As written', 'Cleaned', 'Tone', 'Touchpoint', 'Driver'];
  const RD_STOP = new Set('i a an and the me my once was in it of to so on even each had before that but for with were is at as'.split(' '));
  const RD_COMMENTS = [
    { id: 'wait', name: 'A long wait',
      text: ['I [a:waited almost an hour] and [b:nobody told me why].', 'Once I was in, [c:the nurse was wonderful].'],
      marks: {
        a: { touch: 'Waiting', tone: -1 },
        b: { touch: 'Communication', tone: -1, driver: 'unexplained waiting' },
        c: { touch: 'Nursing care', tone: 1 },
      } },
    { id: 'steps', name: 'Kept informed',
      text: ['[a:Everyone explained each step] before it happened.', '[b:I never felt lost], even on the hard days.'],
      marks: {
        a: { touch: 'Communication', tone: 1, driver: 'knowing what comes next' },
        b: { touch: 'Care team', tone: 1 },
      },
      toneNote: 'A word count would read “lost” as a complaint. Read in context, “never felt lost” is praise.' },
    { id: 'bill', name: 'A surprise bill',
      text: ['[a:The bill had charges nobody mentioned].', '[b:It took three calls to sort out].'],
      marks: {
        a: { touch: 'Billing', tone: -1, driver: 'unexpected charges' },
        b: { touch: 'Follow-up', tone: -1 },
      } },
  ];
  /** Words of a comment, each with its sentence, its remark and whether it is filler. */
  function rdParse(c) {
    if (c._p) return c._p;
    const toks = [], phrases = {};
    c.text.forEach((sent, si) => {
      let ph = null;
      sent.split(' ').forEach((raw) => {
        let wd = raw;
        const m = /^\[(\w):(.*)$/.exec(wd);
        if (m) { ph = m[1]; wd = m[2]; phrases[ph] = { id: ph, toks: [] }; }
        const closes = wd.includes(']');
        wd = wd.replace(']', '');
        const core = wd.replace(/[.,!?]+$/, '');
        const tok = { text: wd, core: core.length, bare: core.toLowerCase(), sent: si, phrase: ph, stop: RD_STOP.has(core.toLowerCase()) };
        if (ph) phrases[ph].toks.push(toks.length);
        toks.push(tok);
        if (closes) ph = null;
      });
    });
    Object.values(phrases).forEach((p) => {
      p.text = p.toks.map((i, k) => (k === p.toks.length - 1 ? toks[i].text.slice(0, toks[i].core) : toks[i].text)).join(' ');
      const key = p.toks.find((i) => !toks[i].stop);
      p.key = toks[key === undefined ? p.toks[0] : key].bare;
    });
    return (c._p = { toks, phrases });
  }
  const rdComment = (st) => RD_COMMENTS[st.c] || RD_COMMENTS[0];
  const rdTone = (t) => (t < 0 ? '− unhappy' : '+ pleased');

  const RD_WIDE = 620;                                   // below this the callouts become a short ledger
  const RD_ROW = 17;
  /** Where every word sits. Mono type, so a character is exactly 0.6 of the font size. */
  function rdLayout(c, w) {
    const { toks } = rdParse(c);
    const wide = w >= RD_WIDE;
    const pad = wide ? Math.max(32, Math.round(w * 0.06)) : w < 300 ? 12 : 18;
    const lineLen = (ln) => ln.reduce((n, i) => n + toks[i].text.length, 0) + ln.length - 1;
    const lines = [];
    let F;
    if (wide) {                                          // one sentence to a line
      c.text.forEach((_, si) => lines.push(toks.map((t, i) => (t.sent === si ? i : -1)).filter((i) => i >= 0)));
      F = clamp(Math.floor((w - 2 * pad) / Math.max(...lines.map(lineLen)) / 0.6), 14, 30);
    } else {                                             // wrapped to the width
      F = w < 340 ? 13 : 14;
      const max = Math.floor((w - 2 * pad) / (0.6 * F));
      let cur = [], len = 0;
      toks.forEach((t, i) => {
        if (cur.length && len + 1 + t.text.length > max) { lines.push(cur); cur = []; len = 0; }
        len += t.text.length + (cur.length ? 1 : 0);
        cur.push(i);
      });
      if (cur.length) lines.push(cur);
    }
    const cw = 0.6 * F;
    const widest = Math.max(...lines.map(lineLen)) * cw;
    const x0 = wide ? Math.round((w - widest) / 2) : pad;
    const pos = [];
    lines.forEach((ln, li) => {
      let col = 0;
      ln.forEach((i) => { pos[i] = { line: li, x: x0 + col * cw, end: x0 + (col + toks[i].core) * cw }; col += toks[i].text.length + 1; });
    });
    return { wide, pad, F, cw, lines, pos, x0, widest };
  }
  /** Layout plus the vertical rhythm for a given box. `study` is the case-study instrument. */
  function rdGeom(c, w, h, o) {
    const g = rdLayout(c, w);
    const study = !!(o && o.full && !o.tagRoom);
    const n = g.lines.length, marks = Object.keys(c.marks).length;
    g.study = study;
    if (g.wide) {
      g.lineH = g.F * 2;
      g.above = n > 1 ? 3 * RD_ROW + 14 : 0;
      const total = g.above + g.F * 1.1 + (n - 1) * g.lineH + 3 * RD_ROW + 14;
      const padT = study ? 14 : 44, padB = study ? 14 : 44;
      g.need = Math.round(total + padT + padB + 30);
      const top = padT + Math.max(0, ((h || g.need) - padT - padB - total) / 2);
      g.base = (li) => top + g.above + g.F * 0.8 + li * g.lineH;
      g.rail = study ? 0 : (h || g.need) - 18;
    } else {
      const top = study ? 22 : 48, rows = marks + 1;
      g.lineH = g.F * 1.6; g.rowH = RD_ROW;
      const need = () => top + g.F + (n - 1) * g.lineH + 14 + rows * g.rowH + 8;
      if (h && need() > h) { g.lineH = g.F * 1.4; g.rowH = 15; }      // the smallest tiles: tighten the rhythm
      g.need = Math.round(need());
      const slack = h ? Math.max(0, (h - g.need) / 2) : 0;            // a taller tile: sit in the middle of what is left
      g.base = (li) => top + slack + g.F * 0.8 + li * g.lineH;
      g.ledger = g.base(n - 1) + 14 + g.rowH;
    }
    return g;
  }
  function renderReading(st, o) {
    const c = rdComment(st), step = clamp(st.step, 0, RD_STEPS.length - 1);
    const { toks, phrases } = rdParse(c);
    const { w } = o, g = rdGeom(c, w, o.h, o), h = o.h || g.need;
    const fx = (v) => v.toFixed(1);
    const fresh = (at) => (step === at ? ' rd-new' : '');
    const labW = (txt, spaced) => txt.length * (SP_CH + (spaced ? 1.4 : 0));
    let s = open(w, h);
    // the comment
    toks.forEach((t, i) => {
      const q = g.pos[i], m = t.phrase && c.marks[t.phrase];
      const cls = step >= 4 && m && m.driver ? ' rd-acc' : step >= 1 && t.stop ? ' rd-stop' : '';
      s += `<text class="rd-word${cls}" font-size="${g.F}" x="${fx(q.x)}" y="${fx(g.base(q.line))}">${t.text}</text>`;
    });
    const last = g.pos[toks.length - 1], lastTok = toks[toks.length - 1];
    s += `<text class="rd-word rd-stop" font-size="${g.F}" x="${fx(g.x0 - g.cw)}" y="${fx(g.base(0))}">“</text>`;
    s += `<text class="rd-word rd-stop" font-size="${g.F}" x="${fx(last.x + lastTok.text.length * g.cw)}" y="${fx(g.base(last.line))}">”</text>`;
    if (step < 2) return s + rdRail(g, step) + '</svg>';

    Object.values(phrases).forEach((p, pi) => {
      const m = c.marks[p.id], acc = step >= 4 && !!m.driver;
      if (g.wide) {
        // a bracket on the remark, and a leader that grows as more is read into it
        const a = g.pos[p.toks[0]], b = g.pos[p.toks[p.toks.length - 1]];
        const up = g.lines.length > 1 && a.line === 0;
        const rows = [[rdTone(m.tone), 'fig-lab' + fresh(2), false]];
        if (step >= 3) rows.push([m.touch.toUpperCase(), 'fig-lab sp-on sp-level' + fresh(3), true]);
        if (acc) rows.push(['DRIVER · ' + m.driver.toUpperCase(), 'fig-lab fig-lab-acc sp-level' + fresh(4), true]);
        const y0 = up ? g.base(a.line) - g.F * 0.98 : g.base(a.line) + g.F * 0.36;
        const rowY = (k) => (up ? y0 - 10 - k * RD_ROW : y0 + 19 + k * RD_ROW);
        const tip = up ? rowY(rows.length - 1) - 9 : rowY(rows.length - 1) + 3;
        s += `<path class="rd-rule${acc ? ' is-acc' : ''}${fresh(2)}" d="M${fx(b.end)},${fx(y0)} L${fx(a.x)},${fx(y0)} L${fx(a.x)},${fx(tip)}"/>`;
        rows.forEach(([txt, cls, spaced], k) => {
          const x = Math.min(a.x + 9, w - 10 - labW(txt, spaced));
          s += `<text class="${cls}" x="${fx(x)}" y="${fx(rowY(k))}">${txt}</text>`;
        });
      } else {
        // underline each stretch of the remark, then one ledger row for it
        const byLine = new Map();
        p.toks.forEach((i) => { const q = g.pos[i]; const e = byLine.get(q.line) || [q.x, q.end]; e[1] = q.end; byLine.set(q.line, e); });
        byLine.forEach(([xa, xb], li) => {
          const y = g.base(li) + g.F * 0.34;
          s += `<path class="rd-rule${acc ? ' is-acc' : ''}${fresh(2)}" d="M${fx(xa)},${fx(y)} L${fx(xb)},${fx(y)}"/>`;
        });
        const y = g.ledger + pi * g.rowH;
        s += `<text class="fig-lab ${acc ? 'fig-lab-acc' : 'sp-on'}${fresh(2)}" x="${g.pad}" y="${fx(y)}">${p.key}…</text>`;
        s += `<text class="fig-lab${fresh(2)}" x="${fx(g.pad + 11 * SP_CH)}" y="${fx(y)}">${rdTone(m.tone)}</text>`;
        if (step >= 3) s += `<text class="fig-lab sp-on${fresh(3)}" x="${fx(g.pad + 22 * SP_CH)}" y="${fx(y)}">${m.touch.toUpperCase()}</text>`;
      }
    });
    if (!g.wide && step >= 4) {
      const drv = Object.values(c.marks).find((m) => m.driver);
      const y = g.ledger + Object.keys(c.marks).length * g.rowH + 3;
      s += `<text class="fig-lab fig-lab-acc rd-new" x="${g.pad}" y="${fx(y)}">DRIVER</text>`;
      s += `<text class="fig-lab fig-lab-acc rd-new" x="${fx(g.pad + 11 * SP_CH)}" y="${fx(y)}">${drv.driver}</text>`;
    }
    return s + rdRail(g, step) + '</svg>';
  }
  /** On the home slide, the five steps along the foot of the drawing. */
  function rdRail(g, step) {
    if (!g.wide || !g.rail) return '';
    let s = '', x = g.x0;
    RD_STEPS.forEach((name, i) => {
      const txt = name.toUpperCase();
      s += `<text class="fig-lab sp-level ${i === step ? 'sp-on' : i < step ? '' : 'fig-lab-quiet'}" x="${x.toFixed(1)}" y="${g.rail.toFixed(1)}">${txt}</text>`;
      if (i === step) s += `<path class="rd-rule" d="M${x.toFixed(1)},${(g.rail + 6).toFixed(1)} L${(x + txt.length * (SP_CH + 1.4) - 1.4).toFixed(1)},${(g.rail + 6).toFixed(1)}"/>`;
      x += txt.length * (SP_CH + 1.4) + 26;
    });
    return s;
  }
  const numWord = (n) => ['no', 'one', 'two', 'three', 'four'][n] || String(n);
  function sayReading(st, o) {
    const c = rdComment(st), step = clamp(st.step, 0, RD_STEPS.length - 1);
    const { toks, phrases } = rdParse(c);
    const marks = Object.values(phrases).map((p) => ({ ...c.marks[p.id], text: p.text }));
    const drv = marks.find((m) => m.driver);
    let now;
    if (step === 0) now = 'As written. One comment, the way a patient might type it. Nothing has been read yet.';
    else if (step === 1) {
      now = `Cleaned. Filler words fade and the words that carry meaning stay: ${listOf(toks.filter((t) => !t.stop).map((t) => t.bare))}.`;
    } else if (step === 2) {
      const down = marks.filter((m) => m.tone < 0).length, up = marks.length - down;
      now = down && up
        ? `Tone. Each remark is scored on its own: ${numWord(down)} unhappy, ${numWord(up)} pleased. Scored as one, this comment would average out to neutral and the complaint would disappear.`
        : `Tone. Each remark is scored on its own, and here ${marks.length === 2 ? 'both' : 'all'} are ${down ? 'unhappy' : 'pleased'}.`;
      if (c.toneNote) now += ' ' + c.toneNote;
    } else if (step === 3) {
      now = `Touchpoint. Each remark is filed under the part of the visit it is about: ${listOf(marks.map((m) => m.touch.toLowerCase()))}.`;
    } else {
      now = `Driver. “${drv.text}” is the remark that counts toward a driver of satisfaction: ${drv.driver}.` +
        (drv.tone > 0 ? ' Drivers run both ways. This one is something to keep.' : '');
    }
    return {
      now,
      always: 'One comment is easy to read. The pipeline read 100K+ records this way across 12 facilities, so the drivers could be ranked by facility and by touchpoint.',
      tag: o && o.w && o.w < RD_WIDE ? 'Written for this page' : `Written for this page · ${RD_STEPS[step]}`,
    };
  }

  /* ------------------------------------------------------------------ the plan
     A small pipe network drawn for the page (design.md §14.20). It is not the
     Authority's network and every attribute on it is invented. It shows one idea from
     the Western Virginia Water work: a list ranked by a model chooses different mains
     from a list ranked by age. No counts and no results appear, and the sentences use
     words only. The "model" here is a plain weighted sum, a stand-in for the real one. */
  const PL = { COLS: 9, ROWS: 6, KMAX: 22, DEFAULT: 11, OLD: [2.5, 2.5], WIDE: 620 };
  let _plan = null;
  function plan() {
    if (_plan) return _plan;
    const r = rng(1907);
    const nodes = [];
    for (let j = 0; j < PL.ROWS; j++) for (let i = 0; i < PL.COLS; i++) nodes.push({ i, j, x: i + (r() - 0.5) * 0.3, y: j + (r() - 0.5) * 0.3 });
    const at = (i, j) => nodes[j * PL.COLS + i];
    const mains = [];
    const add = (a, b, horiz) => {
      const busy = horiz ? a.j === 3 : a.i === 5;                    // the main street and the cross road
      if (!busy && r() < 0.24) return;                               // not every block has a main on every side
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const age = clamp(1 - Math.hypot(mx - PL.OLD[0], (my - PL.OLD[1]) * 1.2) / 5.2 + (r() - 0.5) * 0.3, 0, 1);
      const era = age > 0.66 ? 'oldest' : age > 0.36 ? 'middle' : 'newest';
      const m = r();
      const material = era === 'oldest' ? (m < 0.85 ? 'Cast iron' : 'Ductile iron')
        : era === 'middle' ? (m < 0.7 ? 'Ductile iron' : 'Cast iron') : (m < 0.8 ? 'PVC' : 'Ductile iron');
      const clayness = clamp((mx - 4.6) / 2.2, 0, 1) * 0.9 + (r() - 0.5) * 0.3;
      const soil = clayness > 0.5 ? 'clay' : clayness > 0.15 ? 'loam' : 'sandy';
      const clay = soil === 'clay' ? 1 : 0;
      const broken = r() < 0.06 + 0.3 * age + 0.34 * clay;
      const score = 0.36 * age + 0.24 * clay + 0.3 * (broken ? 1 : 0) + 0.08 * (busy ? 1 : 0) + 0.08 * (material === 'Cast iron' ? 1 : 0) + (r() - 0.5) * 0.04;
      mains.push({ id: mains.length, a, b, mx, my, age, era, material, soil, broken, busy, score });
    };
    for (let j = 0; j < PL.ROWS; j++) for (let i = 0; i < PL.COLS - 1; i++) add(at(i, j), at(i + 1, j), true);
    for (let j = 0; j < PL.ROWS - 1; j++) for (let i = 0; i < PL.COLS; i++) add(at(i, j), at(i, j + 1), false);
    const order = (key) => mains.slice().sort((p, q) => q[key] - p[key] || p.id - q.id).map((mn) => mn.id);
    const lists = { model: order('score'), oldest: order('age') };
    const rank = { model: [], oldest: [] };
    Object.keys(lists).forEach((by) => lists[by].forEach((id, k) => { rank[by][id] = k; }));
    return (_plan = { nodes, mains, lists, rank });
  }
  const plBy = (st) => (st.by === 'oldest' ? 'oldest' : 'model');
  const plK = (st) => clamp(Math.round(st.k), 0, PL.KMAX);
  /** A share in words: the drawing never states a count. */
  const share = (f) => (f <= 0 ? 'none' : f < 0.35 ? 'a few' : f < 0.65 ? 'about half' : f < 1 ? 'most' : 'all');
  const place = (rk, n) => { const q = rk / (n - 1); return q < 0.15 ? 'near the top' : q < 0.5 ? 'in the upper half' : q < 0.85 ? 'in the lower half' : 'near the bottom'; };

  function planGeom(w, h, o) {
    const study = !!(o && o.full && !o.tagRoom);
    const wide = w >= PL.WIDE;
    const padX = wide ? 36 : 16, padT = study ? 22 : 50, padB = 40;
    const sx = (w - 2 * padX) / (PL.COLS - 0.7), sy = (h - padT - padB) / (PL.ROWS - 0.7);
    return { study, wide, padX, padT, padB, X: (x) => padX + (x + 0.15) * sx, Y: (y) => padT + (y + 0.15) * sy };
  }
  function renderPlan(st, o) {
    const { w, h } = o, pl = plan(), g = planGeom(w, h, o);
    const on = new Set(pl.lists[plBy(st)].slice(0, plK(st)));
    const fx = (v) => v.toFixed(1);
    const seg = (m) => `M${fx(g.X(m.a.x))},${fx(g.Y(m.a.y))} L${fx(g.X(m.b.x))},${fx(g.Y(m.b.y))}`;
    const focus = st.focus != null ? pl.mains[st.focus] : null;
    let s = open(w, h);
    pl.mains.filter((m) => !on.has(m.id)).forEach((m) => { s += `<path class="pl-main" d="${seg(m)}"/>`; });
    pl.mains.filter((m) => on.has(m.id)).forEach((m) => { s += `<path class="pl-main is-on" d="${seg(m)}"/>`; });
    const used = new Set();
    pl.mains.forEach((m) => { used.add(m.a); used.add(m.b); });
    used.forEach((nd) => { s += `<circle class="pl-node" cx="${fx(g.X(nd.x))}" cy="${fx(g.Y(nd.y))}" r="${g.wide ? 2.5 : 1.8}"/>`; });
    if (g.wide) {                                        // two places on the plan that explain the lists
      s += `<text class="fig-lab fig-lab-quiet sp-level" text-anchor="middle" x="${fx(g.X(PL.OLD[0]))}" y="${fx(g.Y(PL.OLD[1]) + 4)}">OLD TOWN</text>`;
      s += `<text class="fig-lab fig-lab-quiet sp-level" text-anchor="middle" x="${fx(g.X(6.5))}" y="${fx(g.Y(1.5) + 4)}">HEAVY CLAY</text>`;
    }
    // the legend, as on any plan
    const ly = h - 14;
    s += `<path class="pl-main is-on" d="M${g.padX},${ly - 4} L${g.padX + 22},${ly - 4}"/><text class="fig-lab sp-level" x="${g.padX + 30}" y="${ly}">ON THE LIST</text>`;
    const lx = g.padX + 30 + 11 * (SP_CH + 1.4) + 18;
    s += `<path class="pl-main" d="M${fx(lx)},${ly - 4} L${fx(lx + 22)},${ly - 4}"/><text class="fig-lab fig-lab-quiet sp-level" x="${fx(lx + 30)}" y="${ly}">NOT YET</text>`;
    if (g.wide) s += `<text class="fig-lab fig-lab-quiet sp-level" text-anchor="end" x="${w - g.padX}" y="${ly}">NOT TO SCALE</text>`;
    if (focus) {
      const mx = g.X(focus.mx), my = g.Y(focus.my);
      s += `<path class="pl-main is-focus${on.has(focus.id) ? ' is-on' : ''}" d="${seg(focus)}"/>`;
      if (g.wide) {                                      // what the model reads at this main, in words
        const n = pl.mains.length;
        const lines = [
          [`${focus.material.toUpperCase()} · ${focus.era.toUpperCase()} ERA`, 'fig-lab sp-on'],
          [`${focus.soil} soil · ${focus.broken ? 'broken before' : 'no breaks on record'}${focus.busy ? ' · busy road' : ''}`, 'fig-lab'],
          [`model: ${place(pl.rank.model[focus.id], n)} · by age: ${place(pl.rank.oldest[focus.id], n)}`, 'fig-lab' + (on.has(focus.id) ? ' fig-lab-acc' : '')],
        ];
        const pw = Math.max(...lines.map((ln) => ln[0].length)) * SP_CH + 20, ph = lines.length * 16 + 12;
        let px = mx + 16, py = my - ph - 12;
        if (px + pw > w - 8) px = mx - 16 - pw;
        if (py < g.padT - 12) py = my + 12;
        px = clamp(px, 8, w - 8 - pw); py = clamp(py, 8, h - 8 - ph);       // never off the sheet
        s += `<path class="pl-lead" d="M${fx(mx)},${fx(my)} L${fx(px < mx ? px + pw : px)},${fx(py < my ? py + ph : py)}"/>`;
        s += `<rect class="pl-plate" x="${fx(px)}" y="${fx(py)}" width="${fx(pw)}" height="${ph}"/>`;
        lines.forEach(([txt, cls], i) => { s += `<text class="${cls}" x="${fx(px + 10)}" y="${fx(py + 19 + i * 16)}">${txt}</text>`; });
      }
      s += `<circle class="pl-node is-focus" cx="${fx(mx)}" cy="${fx(my)}" r="3.5"/>`;
    }
    return s + '</svg>';
  }
  function sayPlan(st, o) {
    const pl = plan(), n = pl.mains.length, by = plBy(st), k = plK(st);
    const picks = pl.lists[by].slice(0, k), set = new Set(picks);
    const m = st.focus != null ? pl.mains[st.focus] : null;
    let now;
    if (m) {
      now = `${m.material}, from the ${m.era} era, in ${m.soil} soil, ${m.broken ? 'broken before' : 'with no breaks on record'}${m.busy ? ', under a busy road' : ''}. ` +
        `The model puts it ${place(pl.rank.model[m.id], n)} of its list. Oldest-first puts it ${place(pl.rank.oldest[m.id], n)}.`;
    } else if (!k) {
      now = 'No budget, so nothing is replaced. Raise it to see which mains come first.';
    } else if (by === 'model') {
      const old = share(picks.filter((id) => pl.mains[id].era === 'oldest').length / k);
      now = old === 'all'
        ? 'Listed by the model, the picks so far are all from the oldest era, though not in order of age.'
        : `Listed by the model, ${old} of the picks are from the oldest era. The rest are younger mains where clay soil, past breaks or a busy road raise the risk.`;
    } else {
      const missed = share(pl.lists.model.slice(0, k).filter((id) => !set.has(id)).length / k);
      now = 'Listed oldest first, the picks bunch in the old town. ' +
        (missed === 'none' ? 'At this budget the two lists agree.' : `${missed[0].toUpperCase() + missed.slice(1)} of the mains the model would replace stay in the ground.`);
    }
    const narrow = o && o.w && o.w < PL.WIDE;
    return {
      now,
      always: 'The real model was gradient-boosted on 20+ years of maintenance history, with soil, freeze cycles and traffic load beside it. This drawing uses a simple stand-in to show one thing: age is a signal, and it is not the only one.',
      tag: narrow ? 'Drawn for this page' : `Drawn for this page · ${m ? `${m.material}, ${m.era} era` : by === 'model' ? 'The model’s list' : 'Oldest first'}`,
    };
  }
  /** The main nearest a point, or none if the pointer is well away from any. */
  function planNearest(x, y, w, h, o) {
    const pl = plan(), g = planGeom(w, h, o);
    let best = null, bd = 34;
    pl.mains.forEach((m) => {
      const ax = g.X(m.a.x), ay = g.Y(m.a.y), bx = g.X(m.b.x), by = g.Y(m.b.y);
      const t = clamp(((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2), 0, 1);
      const d = Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay));
      if (d < bd) { bd = d; best = m.id; }
    });
    return best;
  }

  /* ------------------------------------------------------------------ the route
     ObscureMusicRecSys (design.md §14.21), the one figure on the reel drawn from real
     data: a personal project on public, CC0 listening data, so the values are shown.
     A route is five steps from a song people know to one almost nobody plays; the
     vertical axis is listeners on a log scale, so the route can be seen leaving the
     head. "Pull" bends it back towards songs that share the seed's listeners. */
  /* Generated from ObscureMusicRecSys (github.com/Sarvesh-Vishnu/ObscureMusicRecSys) at e6e4d5b:
     web/public/data/routes.json + tracks.json (λ = 1; pull none / strong = γ 0 / 2) and
     results/phase4.json (bench). Real ListenBrainz data, CC0. Do not edit by hand. */
  const OB = {"head":43,"max":1491,"min":7,"transitions":20841386,"items":219876,"bench":{"routeTail":0.585,"routeReal":0.166,"popTail":0.602,"popReal":0.07},"seeds":[{"t":"Take On Me","a":"a‐ha","n":953,"routes":{"none":[{"t":"Africa","a":"Toto","n":791,"c":72,"o":4090,"held":true},{"t":"How You Remind Me","a":"Nickelback","n":645,"c":47,"o":3932,"held":true},{"t":"(I Just) Died in Your Arms","a":"Cutting Crew","n":462,"c":46,"o":2453,"held":true},{"t":"More Than This","a":"Roxy Music","n":145,"c":21,"o":1421,"held":false},{"t":"Shouldn’t Have to Be Like That","a":"Fra Lippo Lippi","n":11,"c":8,"o":332,"held":false}],"strong":[{"t":"Africa","a":"Toto","n":791,"c":72,"o":4090,"held":true},{"t":"Don’t Stop Believin’","a":"Journey","n":608,"c":23,"o":3932,"held":false},{"t":"Livin’ on a Prayer","a":"Bon Jovi","n":705,"c":20,"o":2764,"held":true},{"t":"Fortunate Son","a":"Creedence Clearwater Revival","n":706,"c":27,"o":2560,"held":false},{"t":"Paint It Black","a":"The Rolling Stones","n":734,"c":56,"o":3406,"held":true}]},"obvious":[{"t":"Africa","a":"Toto","n":791},{"t":"Everybody Wants to Rule the World","a":"Tears for Fears","n":1002},{"t":"Every Breath You Take","a":"The Police","n":811},{"t":"Don’t Stop Believin’","a":"Journey","n":608},{"t":"Another One Bites the Dust","a":"Queen","n":746}]},{"t":"Everybody Wants to Rule the World","a":"Tears for Fears","n":1002,"routes":{"none":[{"t":"Your Love","a":"The Outfield","n":425,"c":21,"o":3817,"held":true},{"t":"Run to You","a":"Bryan Adams","n":221,"c":14,"o":1359,"held":false},{"t":"Dance Hall Days","a":"Wang Chung","n":138,"c":33,"o":758,"held":true},{"t":"Call Me","a":"Go West","n":40,"c":56,"o":515,"held":false},{"t":"Kiss the Dirt (Falling Down the Mountain)","a":"INXS","n":40,"c":46,"o":203,"held":false}],"strong":[{"t":"Take On Me","a":"a‐ha","n":953,"c":46,"o":3817,"held":false},{"t":"Africa","a":"Toto","n":791,"c":72,"o":4090,"held":true},{"t":"Don’t Stop Believin’","a":"Journey","n":608,"c":23,"o":3932,"held":false},{"t":"Livin’ on a Prayer","a":"Bon Jovi","n":705,"c":20,"o":2764,"held":true},{"t":"Fortunate Son","a":"Creedence Clearwater Revival","n":706,"c":27,"o":2560,"held":false}]},"obvious":[{"t":"Take On Me","a":"a‐ha","n":953},{"t":"Africa","a":"Toto","n":791},{"t":"Shout","a":"Tears for Fears","n":418},{"t":"Every Breath You Take","a":"The Police","n":811},{"t":"I’m Still Standing","a":"Elton John","n":663}]},{"t":"Co2","a":"Prateek Kuhad","n":50,"routes":{"none":[{"t":"blue","a":"yung kai","n":152,"c":14,"o":127,"held":false},{"t":"bad","a":"wave to earth","n":69,"c":7,"o":451,"held":false},{"t":"Runaway","a":"Kanye West","n":175,"c":65,"o":455,"held":false},{"t":"Private Landing","a":"Don Toliver feat. Justin Bieber & Future","n":63,"c":37,"o":1122,"held":false},{"t":"Oldie 2","a":"Odd Future 2","n":40,"c":41,"o":212,"held":false}],"strong":[{"t":"Sahiba","a":"Aditya Rikhari","n":82,"c":1,"o":127,"held":false},{"t":"Finding Her","a":"Kushagra, Bharath & Saaheal","n":72,"c":26,"o":283,"held":true},{"t":"Jo Tum Mere Ho","a":"Anuv Jain","n":62,"c":33,"o":174,"held":true},{"t":"Ishq","a":"Faheem Abdullah, Rauhan Malik & Amir Ameer","n":43,"c":21,"o":148,"held":false},{"t":"Haseen","a":"Talwiinder, NDS & Rippy Grewal","n":24,"c":16,"o":106,"held":false}]},"obvious":[{"t":"Baarishein","a":"Anuv Jain","n":44},{"t":"Choo Lo","a":"The Local Train","n":75},{"t":"Mazaak","a":"Anuv Jain","n":22},{"t":"Alag Aasmaan","a":"Anuv Jain","n":55},{"t":"Those Eyes","a":"New West","n":242}]}]};
  const RT = { WIDE: 620, STEPS: 5, TICKS: [1000, 100, 10], LABEL: 18 };
  const rtSeed = (st) => OB.seeds[clamp(st.s | 0, 0, OB.seeds.length - 1)];
  const rtPull = (st) => (st.pull === 'strong' ? 'strong' : 'none');
  const rtK = (st) => clamp(Math.round(st.k), 0, RT.STEPS);
  const thousands = (n) => n.toLocaleString('en-GB');
  const cut = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  function rtGeom(w, h, o) {
    const wide = w >= RT.WIDE, study = !!(o && o.full && !o.tagRoom);
    const padL = wide ? 64 : 44, padR = wide ? 168 : 18, padT = study ? 28 : 54, padB = 44;
    const lo = Math.log(OB.min), hi = Math.log(OB.max);
    return {
      wide, padL, padR, padT, padB,
      X: (i) => padL + (i * (w - padL - padR)) / RT.STEPS,
      Y: (n) => padT + ((hi - Math.log(clamp(n, OB.min, OB.max))) / (hi - lo)) * (h - padT - padB),
    };
  }
  function renderRoute(st, o) {
    const { w, h } = o, g = rtGeom(w, h, o), seed = rtSeed(st), k = rtK(st), pull = rtPull(st);
    const fx = (v) => v.toFixed(1);
    const pts = (stops) => stops.map((s, i) => `${i ? 'L' : 'M'}${fx(g.X(i))},${fx(g.Y(s.n))}`).join(' ');
    const route = [seed, ...seed.routes[pull]];
    const other = [seed, ...seed.routes[pull === 'none' ? 'strong' : 'none']];
    let s = open(w, h);
    RT.TICKS.forEach((n) => {
      s += `<path class="rt-grid" d="M${g.padL},${fx(g.Y(n))} L${w - g.padR},${fx(g.Y(n))}"/>`;
      s += `<text class="fig-lab fig-lab-quiet" text-anchor="end" x="${g.padL - 10}" y="${fx(g.Y(n) + 4)}">${thousands(n)}</text>`;
    });
    const yT = g.Y(OB.head);
    s += `<path class="rt-tail" d="M${g.padL},${fx(yT)} L${w - g.padR},${fx(yT)}"/>`;
    s += `<text class="fig-lab fig-lab-quiet sp-level" x="${g.padL + 8}" y="${fx(yT - 7)}">HEAD</text>`;
    s += `<text class="fig-lab fig-lab-quiet sp-level" x="${g.padL + 8}" y="${fx(yT + 16)}">LONG TAIL${g.wide ? ` · UNDER ${OB.head} LISTENERS` : ''}</text>`;
    s += `<text class="fig-lab fig-lab-quiet sp-level" x="4" y="${fx(g.padT - 16)}">LISTENERS</text>`;
    for (let i = 0; i <= RT.STEPS; i++) {
      s += `<text class="fig-lab fig-lab-quiet sp-level" text-anchor="middle" x="${fx(g.X(i))}" y="${h - 14}">${i ? i : 'SEED'}</text>`;
    }
    s += `<path class="rt-ghost" d="${pts(other)}"/>`;
    if (k) s += `<path class="rt-line" d="${pts(route.slice(0, k + 1))}"/>`;
    route.slice(0, k + 1).forEach((stop, i) => {
      const x = g.X(i), y = g.Y(stop.n), last = i === k && k > 0;
      s += `<circle class="${i ? 'rt-stop' : 'rt-seed'}${last ? ' is-end' : ''}" cx="${fx(x)}" cy="${fx(y)}" r="${last ? 4.5 : 3.5}"/>`;
      if (g.wide && i && i < k) {                         // name the stops on the way, above or below the line
        const prev = route[i - 1].n, below = stop.n < prev && i % 2 === 1;
        s += `<text class="fig-lab rt-lab" text-anchor="middle" x="${fx(x)}" y="${fx(below ? y + 18 : y - 10)}">${cut(stop.a, RT.LABEL)}</text>`;
      }
    });
    const end = route[k];
    if (g.wide) {                                         // the stop reached so far, named in the margin
      const ex = g.X(k) + 12, ey = g.Y(end.n);
      s += `<text class="fig-lab ${k ? 'fig-lab-acc' : 'sp-on'}" x="${fx(ex)}" y="${fx(ey - 2)}">${cut(end.a, 22)}</text>`;
      s += `<text class="fig-lab" x="${fx(ex)}" y="${fx(ey + 13)}">${thousands(end.n)} ${end.n === 1 ? 'listener' : 'listeners'}</text>`;
    }
    return s + '</svg>';
  }
  function sayRoute(st, o) {
    const seed = rtSeed(st), k = rtK(st), pull = rtPull(st), stops = seed.routes[pull], b = OB.bench;
    const end = k ? stops[k - 1] : seed;
    let now;
    if (!k) {
      now = `${seed.t}, by ${seed.a}: ${thousands(seed.n)} listeners on ListenBrainz. The route starts here.`;
    } else if (k < RT.STEPS) {
      now = `Step ${k} of ${RT.STEPS}: ${end.t}, by ${end.a}, ${thousands(end.n)} listeners. ${end.c} of ${thousands(end.o)} plays that followed the last song went here next.`;
    } else {
      const fin = stops[RT.STEPS - 1], tail = fin.n < OB.head;
      const real = stops.filter((x) => x.c > 0).length, held = stops.filter((x) => x.held).length;
      now = pull === 'none'
        ? `From ${seed.t} (${thousands(seed.n)} listeners) to ${fin.t} by ${fin.a} (${thousands(fin.n)}), ${tail ? 'in the long tail' : 'still in the head'}. ` +
          `${real === RT.STEPS ? 'Every step is a move listeners made' : `${real} of ${RT.STEPS} steps are moves listeners made`}; ${held} of ${RT.STEPS} were made again after the cutoff.`
        : `With strong pull the route keeps to songs that share ${seed.t}’s listeners and ends on ${fin.t} by ${fin.a}, ${thousands(fin.n)} listeners, ${tail ? 'in the long tail' : 'still in the head'}.`;
    }
    const narrow = o && o.w && o.w < RT.WIDE;
    return {
      now,
      always: `In the benchmark, routes put ${Math.round(b.routeTail * 100)}% of their stops in the long tail, about as many as a popularity penalty (${Math.round(b.popTail * 100)}%), and ${f1(b.routeReal / b.popReal)}× as many of their steps were made again by real listeners (${f1(b.routeReal * 100)}% against ${f1(b.popReal * 100)}%).`,
      tag: narrow ? 'Real data · ListenBrainz' : `Real data · ListenBrainz · ${seed.t}`,
    };
  }

  const KINDS = {
    route: {
      state: () => ({ s: 0, pull: 'none', k: RT.STEPS }),
      render: renderRoute, say: sayRoute,
      // across the figure, or up the screen: the route walks out one step at a time
      scrub: (st, u) => { st.k = Math.round(clamp(u, 0, 1) * RT.STEPS); },
      travel: (st, u) => { st.k = Math.round(clamp(u * 2.2, 0, 1) * RT.STEPS); },
      unit: (st) => rtK(st) / RT.STEPS,
      height: (st, w) => Math.round(w >= RT.WIDE ? clamp(w * 0.46, 330, 460) : w * 0.86 + 40),
    },
    plan: {
      state: () => ({ by: 'model', k: PL.DEFAULT, focus: null }),
      render: renderPlan, say: sayPlan,
      // with no pointer, the budget grows as the slide travels up the screen
      scrub: (st, u) => { st.k = Math.round(clamp(u, 0, 1) * PL.KMAX); },
      unit: (st) => plK(st) / PL.KMAX,
      // with one, the nearest main says what the model reads there
      point: (st, x, y, w, h, o) => { st.focus = planNearest(x, y, w, h, o); },
      leave: (st) => { st.focus = null; },
      height: (st, w) => Math.round(w >= PL.WIDE ? clamp(w * 0.48, 340, 500) : w * 0.86 + 40),
    },
    reading: {
      state: () => ({ c: 0, step: RD_STEPS.length - 1 }),
      render: renderReading, say: sayReading,
      // across the figure, or up the screen: the reading advances a step at a time
      scrub: (st, u) => { st.step = Math.min(RD_STEPS.length - 1, Math.floor(clamp(u, 0, 1) * RD_STEPS.length)); },
      // on scroll the reading is complete by the time the slide is centred
      travel: (st, u) => { st.step = Math.min(RD_STEPS.length - 1, Math.floor(clamp(u * 2.4, 0, 1) * RD_STEPS.length)); },
      unit: (st) => st.step / (RD_STEPS.length - 1),
      height: (st, w) => rdGeom(rdComment(st), w, 0, { full: true }).need,
    },
    spine: {
      state: () => ({ focus: 'aop' }),
      render: renderSpine, say: saySpine,
      // with no pointer, the decisions light one after another as the slide travels
      scrub: (st, u) => { st.focus = SP_DECISIONS[Math.min(SP_DECISIONS.length - 1, Math.floor(clamp(u, 0, 1) * SP_DECISIONS.length))]; },
      unit: (st) => Math.max(0, SP_DECISIONS.indexOf(st.focus)) / (SP_DECISIONS.length - 1),
      // with one, the nearest label takes the focus
      point: (st, x, y, w, h, o) => {
        if (w < SP_WIDE) return;
        const L = spineLayout(w, h, o);
        let best = null, bd = 1e9;
        Object.keys(L.pos).forEach((id) => {
          const q = L.pos[id];
          const dx = x < q.x ? q.x - x : x > q.right ? x - q.right : 0, dy = Math.abs(y - (q.y - 3.5));
          const dd = dx * 0.6 + dy;
          if (dd < bd) { bd = dd; best = id; }
        });
        if (best) st.focus = best;
      },
    },
    committee: {
      state: () => ({ origin: C.DEFAULT, active: [true, true, true, true] }),
      render: renderCommittee, say: sayCommittee,
      // 0..1 across the figure -> the main parameter
      scrub: (st, u) => { st.origin = Math.round(C.FIRST + clamp(u, 0, 1) * (C.LAST - C.FIRST)); },
      unit: (st) => (st.origin - C.FIRST) / (C.LAST - C.FIRST),
    },
    record: {
      state: () => ({ origin: C.DEFAULT }),
      render: renderRecord, say: sayRecord,
      scrub: (st, u) => { st.origin = Math.round(C.FIRST + clamp(u, 0, 1) * (C.LAST - C.FIRST)); },
      unit: (st) => (st.origin - C.FIRST) / (C.LAST - C.FIRST),
    },
    list: {
      state: () => ({ k: L.DEFAULT }),
      render: renderList, say: sayList,
      scrub: (st, u) => { st.k = Math.round(clamp(u, 0, 1) * L.MAXK); },
      unit: (st) => st.k / L.MAXK,
    },
    sample: {
      state: () => ({ n: S.DEFAULT, draw: 0 }),
      render: renderSample, say: saySample,
      scrub: (st, u) => { st.n = nFromUnit(u); },
      unit: (st) => unitFromN(st.n),
    },
  };

  /* ================================================================== DOM layer */
  function mountTile(el) {
    const kind = KINDS[el.dataset.lab];
    if (!kind) return;
    const st = kind.state();
    const tag = el.querySelector('.tile-tag');
    let holder = el.querySelector('.lab-live');
    if (!holder) {
      holder = document.createElement('span');
      holder.className = 'lab-live';
      const old = el.querySelector('svg');
      if (old) old.replaceWith(holder); else el.prepend(holder);
    }
    let w = 0, h = 0, raf = 0, opts = {}, drawn = '';
    const draw = () => {
      raf = 0;
      if (!w) return;
      // a stage this large can carry the labelled figure; the tag keeps a clear corner
      const big = w >= 720;
      opts = { w, h, full: big, tagRoom: big ? 30 : 0 };
      const sig = JSON.stringify(st) + w + 'x' + h;      // moving within a step redraws nothing
      if (sig === drawn) return;
      drawn = sig;
      holder.innerHTML = kind.render(st, opts);
      if (tag) tag.textContent = kind.say(st, opts).tag;
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(draw); };
    new ResizeObserver(() => {
      const b = el.getBoundingClientRect();
      w = Math.round(b.width); h = Math.round(b.height);
      queue();
    }).observe(el);

    // Pointer: move across the figure to move its parameter.
    let hovering = false;
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      hovering = true;
      const b = el.getBoundingClientRect();
      if (kind.point) kind.point(st, e.clientX - b.left, e.clientY - b.top, w, h, opts);
      else kind.scrub(st, (e.clientX - b.left - 16) / (b.width - 32));
      queue();
    });
    el.addEventListener('pointerleave', () => { hovering = false; if (kind.leave) { kind.leave(st); queue(); } });

    // No pointer (touch, or before the first hover): the parameter follows the tile's
    // trip up the screen. Skipped when the reader asked for reduced motion.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let seen = false;
      const onScroll = () => {
        if (!seen || hovering) return;
        const b = el.getBoundingClientRect();
        const u = 1 - (b.top + b.height / 2) / window.innerHeight;   // 0 at the bottom edge, 1 at the top
        (kind.travel || kind.scrub)(st, clamp((u - 0.2) / 0.6, 0, 1));
        queue();
      };
      new IntersectionObserver((es) => { seen = es[0].isIntersecting; if (seen) onScroll(); }).observe(el);
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    el.classList.add('is-live');
  }

  function mountFull(rootEl) {
    const name = rootEl.dataset.lab;
    const kind = KINDS[name];
    if (!kind) return;
    const st = kind.state();
    const fig = rootEl.querySelector('.lab-fig');
    const field = rootEl.querySelector('.lab-field');
    const now = rootEl.querySelector('.lab-now');
    const always = rootEl.querySelector('.lab-always');
    const controls = rootEl.querySelector('.lab-controls');
    let w = 0, raf = 0, figH = 0, drawn = '';
    let legend = null;
    if (name === 'committee') {
      legend = document.createElement('ul');
      legend.className = 'lab-legend';
      legend.hidden = true;
      fig.after(legend);
    }

    const draw = () => {
      raf = 0;
      if (!w) return;
      const h = kind.height ? kind.height(st, w) : name === 'committee' ? Math.round(clamp(w * 0.5, 310, 430)) : name === 'spine' ? (w < SP_WIDE ? 250 : Math.round(clamp(w * 0.4, 360, 440))) : Math.round(clamp(w * 0.46, 260, 400));
      figH = h;
      const sig = JSON.stringify(st) + w;
      if (sig === drawn) return;
      drawn = sig;
      fig.innerHTML = kind.render(st, { w, h, full: true });
      if (field) field.innerHTML = renderField(st, { w });
      if (legend) {
        const c = committee(st.origin, st.active);
        legend.hidden = w >= NARROW;
        legend.innerHTML = (c.ensemble ? `<li class="is-acc">Committee ${f1(c.err * 100)}%</li>` : '') +
          c.members.filter((mm) => mm.on).map((mm) => `<li>${mm.name} ${f1(mm.err * 100)}%</li>`).join('') +
          '<li class="is-quiet">Dotted: what happened</li>';
      }
      const said = kind.say(st);
      now.textContent = said.now;
      always.textContent = said.always;
      sync();
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(draw); };

    // Controls are real form inputs: keyboard and screen readers get the same instrument.
    const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
    let sync = () => {};
    if (name === 'committee') {
      const range = el(`<label class="lab-range"><span>Forecast from</span><input type="range" min="${C.FIRST}" max="${C.LAST}" step="1"><output></output></label>`);
      const input = range.querySelector('input'), out = range.querySelector('output');
      input.addEventListener('input', () => { st.origin = +input.value; queue(); });
      controls.append(range);
      const group = el('<fieldset class="lab-checks"><legend>Committee members</legend></fieldset>');
      const boxes = MODELS.map((mdl, i) => {
        const lab = el(`<label><input type="checkbox" checked><span>${mdl.name}</span></label>`);
        const box = lab.querySelector('input');
        box.addEventListener('change', () => { st.active[i] = box.checked; queue(); });
        group.append(lab);
        return box;
      });
      controls.append(group);
      sync = () => { input.value = st.origin; out.textContent = monthLabel(st.origin); boxes.forEach((b, i) => { b.checked = st.active[i]; }); };
    } else if (name === 'list') {
      const range = el(`<label class="lab-range"><span>Replacement budget</span><input type="range" min="0" max="${L.MAXK}" step="1"><output></output></label>`);
      const input = range.querySelector('input'), out = range.querySelector('output');
      input.addEventListener('input', () => { st.k = +input.value; queue(); });
      controls.append(range);
      sync = () => { input.value = st.k; out.textContent = `${st.k} ${plural(st.k, 'main', 'mains')}`; };
    } else if (name === 'sample') {
      const range = el('<label class="lab-range"><span>Comments read per facility</span><input type="range" min="0" max="1000" step="1"><output></output></label>');
      const input = range.querySelector('input'), out = range.querySelector('output');
      input.addEventListener('input', () => { st.n = nFromUnit(+input.value / 1000); queue(); });
      const again = el('<button type="button" class="lab-btn">Draw again</button>');
      again.addEventListener('click', () => { st.draw += 1; queue(); });
      const real = el(`<button type="button" class="lab-btn lab-btn-quiet">The project’s scale</button>`);
      real.addEventListener('click', () => { st.n = S.PROJECT_N; queue(); });
      controls.append(range, again, real);
      sync = () => { input.value = Math.round(unitFromN(st.n) * 1000); out.textContent = st.n.toLocaleString('en-US'); };
    }
    if (name === 'spine') {
      const group = el('<div class="lab-picks" role="group" aria-label="Decision to trace"></div>');
      const btns = SP_DECISIONS.map((d) => {
        const b = el(`<button type="button" class="lab-btn">${SP_NODES[d].label}</button>`);
        b.addEventListener('click', () => { st.focus = d; queue(); });
        group.append(b);
        return b;
      });
      controls.append(group);
      sync = () => btns.forEach((b, i) => b.setAttribute('aria-pressed', SP_DECISIONS[i] === st.focus ? 'true' : 'false'));
      fig.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const b = fig.getBoundingClientRect();
        const before = st.focus;
        kind.point(st, e.clientX - b.left, e.clientY - b.top, w, figH, {});
        if (st.focus !== before) queue();
      });
    }
    const picks = (label, items, isOn, pick) => {
      const group = el(`<div class="lab-picks" role="group" aria-label="${label}"><span class="lab-picks-label" aria-hidden="true">${label}</span></div>`);
      const btns = items.map((txt, i) => {
        const b = el(`<button type="button" class="lab-btn">${txt}</button>`);
        b.addEventListener('click', () => { pick(i); queue(); });
        group.append(b);
        return b;
      });
      controls.append(group);
      return () => btns.forEach((b, i) => b.setAttribute('aria-pressed', isOn(i) ? 'true' : 'false'));
    };
    if (name === 'reading') {
      const syncStep = picks('Step', RD_STEPS, (i) => i === st.step, (i) => { st.step = i; });
      const syncComment = picks('Comment', RD_COMMENTS.map((c) => c.name), (i) => i === st.c, (i) => { st.c = i; });
      sync = () => { syncStep(); syncComment(); };
    }
    if (name === 'route') {
      const syncSeed = picks('Start from', OB.seeds.map((x) => x.t), (i) => i === (st.s | 0), (i) => { st.s = i; st.k = RT.STEPS; });
      const syncPull = picks('Pull', ['None', 'Strong'], (i) => (i === 1) === (st.pull === 'strong'), (i) => { st.pull = i ? 'strong' : 'none'; st.k = RT.STEPS; });
      sync = () => { syncSeed(); syncPull(); };
    }
    if (name === 'plan') {
      const syncBy = picks('List by', ['The model', 'Oldest first'], (i) => (i === 0) === (st.by !== 'oldest'), (i) => { st.by = i ? 'oldest' : 'model'; st.focus = null; });
      const range = el(`<label class="lab-range"><span>Budget</span><input type="range" min="0" max="${PL.KMAX}" step="1"><output></output></label>`);
      const input = range.querySelector('input'), out = range.querySelector('output');
      input.addEventListener('input', () => { st.k = +input.value; st.focus = null; queue(); });
      controls.append(range);
      sync = () => { syncBy(); input.value = st.k; out.textContent = !st.k ? 'none' : st.k < 8 ? 'a short list' : st.k < 16 ? 'a longer list' : 'a long list'; };
      const pointAt = (e) => {
        const b = fig.getBoundingClientRect();
        const before = st.focus;
        kind.point(st, e.clientX - b.left, e.clientY - b.top, w, figH, { full: true });
        if (st.focus !== before) queue();
      };
      fig.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') pointAt(e); });
      fig.addEventListener('click', pointAt);            // touch: tap a main
    }
    const reset = el('<button type="button" class="lab-btn lab-btn-quiet">Reset</button>');
    reset.addEventListener('click', () => { Object.assign(st, kind.state()); queue(); });
    controls.append(reset);

    // Direct manipulation: drag on the figure itself.
    let drag = null;
    const fromPointer = (e) => {
      const b = fig.getBoundingClientRect();
      const x = e.clientX - b.left;
      if (name === 'committee') {
        const g = committeeGeom(b.width, b.height, true);
        if (drag.onStrip) st.origin = Math.round(((x - g.padL) / (b.width - g.padL - g.padR)) * (C.N - 1));   // overview: go there
        else st.origin = drag.origin - Math.round((x - drag.x) / g.pxPerMonth);                             // history: pull it past
        st.origin = clamp(st.origin, C.FIRST, C.LAST);
      } else if (name === 'list') {
        const padR = b.width >= NARROW ? LIST_PAD[1] : 18;
        kind.scrub(st, (x - LIST_PAD[0]) / (b.width - LIST_PAD[0] - padR));
      } else return;                                     // the sample's x axis is the estimate, not n
      queue();
    };
    if (name === 'committee' || name === 'list') fig.addEventListener('pointerdown', (e) => {
      const b = fig.getBoundingClientRect();
      const g = committeeGeom(b.width, b.height, true);
      drag = { x: e.clientX - b.left, origin: st.origin, onStrip: e.clientY - b.top >= g.stripT - 10 };
      fig.setPointerCapture(e.pointerId);
      fromPointer(e);
    });
    fig.addEventListener('pointermove', (e) => { if (drag) fromPointer(e); });
    const stop = () => { drag = null; };
    fig.addEventListener('pointerup', stop);
    fig.addEventListener('pointercancel', stop);

    new ResizeObserver(() => { w = Math.round(fig.getBoundingClientRect().width); queue(); }).observe(fig);
    rootEl.classList.add('is-live');
  }

  function init() {
    document.querySelectorAll('.tile-fig[data-lab]').forEach(mountTile);
    document.querySelectorAll('.lab[data-lab]').forEach(mountFull);
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }

  return {
    rng, ols, wape, wilson, series, monthLabel, MODELS, C, L, S, record,
    committee, backtest, mains, list, facilities, sample, nFromUnit, unitFromN,
    renderCommittee, renderRecord, renderList, renderField, renderSample, renderSpine,
    SP_NODES, SP_PATHS, SP_DECISIONS, spinePath, spineFocus, saySpine,
    PL, plan, renderPlan, sayPlan, planNearest, share, place,
    OB, RT, renderRoute, sayRoute,
    RD_STEPS, RD_COMMENTS, RD_STOP, RD_WIDE, rdParse, rdLayout, rdGeom, renderReading, sayReading,
    sayCommittee, sayList, saySample, KINDS,
  };
});
