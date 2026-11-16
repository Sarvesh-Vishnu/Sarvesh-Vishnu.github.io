/* Portfolio — lab.js
   Figures that answer back (design.md §14.13).

   Three small models that run in the reader's browser, one per case study:
     committee — four forecasters and their ensemble, refit from any starting month
     list      — a ranked replacement list against a fixed budget
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

  const KINDS = {
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
    let w = 0, h = 0, raf = 0, opts = {};
    const draw = () => {
      raf = 0;
      if (!w) return;
      // a stage this large can carry the labelled figure; the tag keeps a clear corner
      const big = w >= 720;
      opts = { w, h, full: big, tagRoom: big ? 30 : 0 };
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
    el.addEventListener('pointerleave', () => { hovering = false; });

    // No pointer (touch, or before the first hover): the parameter follows the tile's
    // trip up the screen. Skipped when the reader asked for reduced motion.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let seen = false;
      const onScroll = () => {
        if (!seen || hovering) return;
        const b = el.getBoundingClientRect();
        const u = 1 - (b.top + b.height / 2) / window.innerHeight;   // 0 at the bottom edge, 1 at the top
        kind.scrub(st, clamp((u - 0.2) / 0.6, 0, 1));
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
    let w = 0, raf = 0, figH = 0;
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
      const h = name === 'committee' ? Math.round(clamp(w * 0.5, 310, 430)) : name === 'spine' ? (w < SP_WIDE ? 250 : Math.round(clamp(w * 0.4, 360, 440))) : Math.round(clamp(w * 0.46, 260, 400));
      figH = h;
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
    if (name !== 'spine') fig.addEventListener('pointerdown', (e) => {
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
    sayCommittee, sayList, saySample, KINDS,
  };
});
