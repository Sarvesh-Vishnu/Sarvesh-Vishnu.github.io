"""
Method figures for the work grid (design.md §14.12).

Each figure is a schematic of how the work was done; the shapes illustrate the method
and none of the values are client data. Fixed seeds, so reruns give identical art.

Run   : python3 scripts/figures.py
Writes: the <svg> between each <!-- fig:NAME --> ... <!-- /fig:NAME --> pair in index.html
"""
import math, pathlib, random, re

W, H = 400, 250
def path(xs, ys): return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in zip(xs, ys))

# ---- 1. Cooper: four model forecasts, one ensemble ---------------------------------
rnd = random.Random(7)
n_hist, n_fc = 48, 24
x0, x_now, x1 = 24, 222, 318
def X(t): return x0 + (x_now - x0) * t / (n_hist - 1) if t < n_hist else x_now + (x1 - x_now) * (t - n_hist + 1) / n_fc
AMP, TREND = 30, 0.85
def level(t, damp=1.0): return 168 - TREND * t - damp * AMP * math.sin(2 * math.pi * t / 12 + 0.6)
hist_y = [level(t) + rnd.gauss(0, 3.5) for t in range(n_hist)]
fc_t = list(range(n_hist - 1, n_hist + n_fc))
models = {  # drift (px / month) and seasonal damping: four honest-looking disagreements
    "ARIMA":    (0.95, 0.55),
    "Prophet":  (0.32, 0.85),
    "SARIMAX":  (-0.32, 1.00),
    "Boosting": (-0.95, 0.90),
}
model_ys = {}
for name, (drift, damp) in models.items():
    ys = []
    for t in fc_t:
        h = t - (n_hist - 1)
        ys.append(hist_y[-1] if h == 0 else level(t, damp) + drift * h)
    model_ys[name] = ys
ens = [sum(v) / 4 for v in zip(*model_ys.values())]
spread = [max(v) - min(v) for v in zip(*model_ys.values())]
band = ("M" + " L".join(f"{X(t):.1f},{y - d / 2:.1f}" for t, y, d in zip(fc_t, ens, spread)) + " L" +
        " L".join(f"{X(t):.1f},{y + d / 2:.1f}" for t, y, d in reversed(list(zip(fc_t, ens, spread)))) + " Z")
# direct labels at the right end (ensemble included), nudged apart so they never collide;
# the model names are secondary and hide on small screens, "ensemble" always shows
ends = sorted([(ys[-1], n) for n, ys in model_ys.items()] + [(ens[-1], "ensemble")])
placed, last = [], -1e9
for y, n in ends:
    y = max(y, last + 12); placed.append((y, n)); last = y
labels = "".join(
    f'<text class="fig-lab {"fig-lab-acc" if n == "ensemble" else "fig-minor"}" x="{x1 + 7}" y="{y + 3:.1f}">{n}</text>'
    for y, n in placed)
cooper = f'''<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" focusable="false">
  <line class="fig-grid" x1="{x0}" y1="222" x2="{x1}" y2="222" />
  <line class="fig-now" x1="{x_now}" y1="30" x2="{x_now}" y2="222" />
  <text class="fig-lab" x="{x_now}" y="238" text-anchor="middle">now</text>
  <path class="fig-ink" d="{path([X(t) for t in range(n_hist)], hist_y)}" />
  <path class="fig-band" d="{band}" />
  {"".join(f'<path class="fig-ink fig-model" d="{path([X(t) for t in fc_t], ys)}" />' for ys in model_ys.values())}
  <path class="fig-acc fig-draw" pathLength="1" d="{path([X(t) for t in fc_t], ens)}" />
  {labels}
</svg>'''

# ---- 2. WV Water: failure probability over the next 18 months ----------------------
ax0, ax1, ay0, ay1 = 34, 372, 206, 48          # x: months 0..18 ; y: p 0..1
def MX(m): return ax0 + (ax1 - ax0) * m / 18
def PY(p): return ay0 - (ay0 - ay1) * p
def cdf(m, mid, k): return 1 / (1 + math.exp(-(m - mid) / k))
ms = [i * 0.25 for i in range(0, 73)]
assets = [(26, 4.2), (22, 3.6), (31, 5.0), (15.5, 3.0)]   # muted: cross late or never
hot = (8.6, 2.1)                                          # flagged: crosses inside 6-12 mo
thr = 0.5
cross_m = hot[0]                                          # p = .5 at m = mid
wv = f'''<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" focusable="false">
  <rect class="fig-window" x="{MX(6):.1f}" y="{ay1 - 4}" width="{MX(12) - MX(6):.1f}" height="{ay0 - ay1 + 4}" />
  <text class="fig-lab fig-lab-acc" x="{(MX(6) + MX(12)) / 2:.1f}" y="{ay1 - 10}" text-anchor="middle">6–12 mo</text>
  <line class="fig-grid" x1="{ax0}" y1="{ay0}" x2="{ax1}" y2="{ay0}" />
  <line class="fig-now" x1="{ax0}" y1="{PY(thr):.1f}" x2="{ax1}" y2="{PY(thr):.1f}" />
  <text class="fig-lab fig-minor" x="{ax0 + 4}" y="{PY(thr) - 6:.1f}">replace at</text>
  {"".join(f'<path class="fig-ink" d="{path([MX(m) for m in ms], [PY(cdf(m, mid, k)) for m in ms])}" />' for mid, k in assets)}
  <path class="fig-acc fig-draw" pathLength="1" d="{path([MX(m) for m in ms], [PY(cdf(m, *hot)) for m in ms])}" />
  <circle class="fig-dot" cx="{MX(cross_m):.1f}" cy="{PY(thr):.1f}" r="4" />
  {"".join(f'<text class="fig-lab" x="{MX(m):.1f}" y="{ay0 + 16}" text-anchor="middle">{m}</text>' for m in (0, 6, 12, 18))}
  <text class="fig-lab fig-minor" x="{ax1}" y="{ay0 + 30}" text-anchor="end">months ahead</text>
  <text class="fig-lab fig-minor" x="{ax0 - 6}" y="{ay1 + 4}" text-anchor="end">1</text>
  <text class="fig-lab fig-minor" x="{ax0 - 6}" y="{ay0 + 4}" text-anchor="end">0</text>
</svg>'''

# ---- 3. Pinnacle: sentiment across 12 facilities (diverging bars) -----------------
rnd = random.Random(11)
rows = []
for i in range(12):
    neg = rnd.uniform(0.12, 0.42); pos = rnd.uniform(0.38, 0.72)
    rows.append((pos - neg, neg, pos))
rows.sort(reverse=True)
cx, half, top, rh = 200, 150, 34, 15.5
bars = []
for i, (_, neg, pos) in enumerate(rows):
    y = top + i * rh
    cls = "fig-neg fig-hot" if i == 9 else "fig-neg"
    bars.append(f'<rect class="{cls}" x="{cx - neg * half:.1f}" y="{y:.1f}" width="{neg * half:.1f}" height="{rh - 6:.1f}" />')
    bars.append(f'<rect class="fig-pos" x="{cx}" y="{y:.1f}" width="{pos * half:.1f}" height="{rh - 6:.1f}" />')
pin = f'''<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" focusable="false">
  <text class="fig-lab fig-lab-acc" x="{cx - 8}" y="{top - 12}" text-anchor="end">negative</text>
  <text class="fig-lab" x="{cx + 8}" y="{top - 12}">positive</text>
  {"".join(bars)}
  <line class="fig-axis" x1="{cx}" y1="{top - 6}" x2="{cx}" y2="{top + 12 * rh}" />
  <text class="fig-lab fig-minor" x="{cx}" y="{top + 12 * rh + 14:.1f}" text-anchor="middle">12 facilities · 100K+ comments</text>
</svg>'''

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"
html = HTML.read_text()
for name, svg in (("cooper", cooper), ("wv", wv), ("pinnacle", pin)):
    svg = "\n".join("              " + line.strip() for line in svg.split("\n")).lstrip()
    pat = re.compile(rf"(<!-- fig:{name} -->\s*).*?(\s*<!-- /fig:{name} -->)", re.S)
    assert pat.search(html), f"markers for {name} not found in index.html"
    html = pat.sub(lambda m: m.group(1) + svg + m.group(2), html)
HTML.write_text(html)
print("figures written:", ", ".join(("cooper", "wv", "pinnacle")))
