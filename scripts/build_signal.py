"""
Build "the signal": the hero's data layer.

Input : data/india-monthly-temperature.csv
        India, monthly average surface temperature (deg C), Jan 1940 onward.
        Source: Copernicus ERA5 via Our World in Data, CC BY 4.0
        https://ourworldindata.org/grapher/average-monthly-surface-temperature
Output: the inline <svg> between the signal markers in index.html,
        and assets/data/signal.json (values for the hover readout).
        The chart shows the last SHOW_YEARS of the record so the seasonal cycle
        and the forecast are legible; the model, backtest and warming figure
        use the full record.

Model : linear trend + 3 annual harmonics, fit by OLS on the last 30 years,
        with AR(1) errors. Forecast mean = deterministic part + phi^h * last
        residual; 80% interval from the AR(1) forecast-error variance, so the
        fan widens with horizon and then saturates.

Honesty: before any number reaches the page, the same model is backtested by
rolling origin (12-month-ahead forecasts from 5 origins) against seasonal-naive
(same month last year). The caption prints whatever the backtest says.

Run   : python3 scripts/build_signal.py
"""
import csv
import datetime
import json
import math
import pathlib
import re

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "india-monthly-temperature.csv"
HTML = ROOT / "index.html"
JSON_OUT = ROOT / "assets" / "data" / "signal.json"

FIT_YEARS = 30          # window the model is fit on
HORIZON = 24            # months forecast into the future
K = 3                   # annual harmonics
SHOW_YEARS = 15         # years of history drawn before the forecast
Z80 = 1.2815515655      # two-sided 80% normal quantile

rows = list(csv.DictReader(open(SRC)))
months = [r["month"] for r in rows]
y_all = np.array([float(r["temp_c"]) for r in rows])
n_all = len(y_all)


def design(t):
    """[1, trend, sin/cos of k-th annual harmonic]; t is the absolute month index."""
    t = np.asarray(t, dtype=float)
    cols = [np.ones_like(t), t / 120.0]                     # trend per decade
    for k in range(1, K + 1):
        cols += [np.sin(2 * np.pi * k * t / 12), np.cos(2 * np.pi * k * t / 12)]
    return np.column_stack(cols)


def fit(t_fit, y_fit):
    X = design(t_fit)
    beta, *_ = np.linalg.lstsq(X, y_fit, rcond=None)
    u = y_fit - X @ beta
    phi = float(np.dot(u[1:], u[:-1]) / np.dot(u[:-1], u[:-1]))   # AR(1) on residuals
    e = u[1:] - phi * u[:-1]
    sigma = float(np.sqrt(np.sum(e ** 2) / (len(e) - X.shape[1] - 1)))
    return beta, phi, sigma, float(u[-1])


def forecast(beta, phi, sigma, u_last, t_start, h):
    t = np.arange(t_start, t_start + h)
    hh = np.arange(1, h + 1)
    mean = design(t) @ beta + (phi ** hh) * u_last
    var = sigma ** 2 * (1 - phi ** (2 * hh)) / (1 - phi ** 2)
    half = Z80 * np.sqrt(var)
    return mean, mean - half, mean + half


def window(end):
    """Fit window ending (exclusive) at absolute index `end`."""
    start = end - FIT_YEARS * 12
    return np.arange(start, end), y_all[start:end]


# ---- rolling-origin backtest: 5 origins, 12 months ahead each ----------------
errs_model, errs_snaive, covered, total = [], [], 0, 0
for back in (60, 48, 36, 24, 12):
    origin = n_all - back
    t_fit, y_fit = window(origin)
    beta, phi, sigma, u_last = fit(t_fit, y_fit)
    m, lo, hi = forecast(beta, phi, sigma, u_last, origin, 12)
    actual = y_all[origin:origin + 12]
    snaive = y_all[origin - 12:origin]                      # same month, a year earlier
    errs_model += list(np.abs(actual - m))
    errs_snaive += list(np.abs(actual - snaive))
    covered += int(np.sum((actual >= lo) & (actual <= hi))); total += len(actual)

mae_model = float(np.mean(errs_model))
mae_snaive = float(np.mean(errs_snaive))
rel_mae = mae_model / mae_snaive                            # <1 beats seasonal-naive
coverage = covered / total

# ---- final fit on the most recent 30 years, forecast the next 24 months -------
t_fit, y_fit = window(n_all)
beta, phi, sigma, u_last = fit(t_fit, y_fit)
f_mean, f_lo, f_hi = forecast(beta, phi, sigma, u_last, n_all, HORIZON)

# ---- warming: last 10 full calendar years vs the 1951-1980 baseline ----------
def year_of(m): return int(m[:4])
base = [v for m, v in zip(months, y_all) if 1951 <= year_of(m) <= 1980]
last_full = max(year_of(m) for m, mm in zip(months, months) if mm.endswith("-12"))
recent = [v for m, v in zip(months, y_all) if last_full - 9 <= year_of(m) <= last_full]
warming = float(np.mean(recent) - np.mean(base))

# future month labels
def add_months(ym, k):
    y, m = map(int, ym.split("-")); idx = y * 12 + (m - 1) + k
    return f"{idx // 12:04d}-{idx % 12 + 1:02d}"
f_months = [add_months(months[-1], i) for i in range(1, HORIZON + 1)]

# ---- SVG ---------------------------------------------------------------------
# Drawn window: January, SHOW_YEARS before the last full year, through the forecast.
s0 = months.index(f"{int(months[-1][:4]) - SHOW_YEARS:04d}-01")
y_show, m_show = y_all[s0:], months[s0:]
n_show = len(y_show)
W, H, PAD = 1200.0, 260.0, 14.0
N = n_show + HORIZON
lo_all = min(float(y_show.min()), float(f_lo.min())) - 0.5
hi_all = max(float(y_show.max()), float(f_hi.max())) + 0.5
X = lambda i: round(i * (W - 1) / (N - 1), 1)
Y = lambda v: round(PAD + (hi_all - v) * (H - 2 * PAD) / (hi_all - lo_all), 1)

def polyline(xs, ys):
    pts = [f"{x},{y}" for x, y in zip(xs, ys)]
    return "M" + " L".join(pts)

hist = polyline([X(i) for i in range(n_show)], [Y(v) for v in y_show])
fi = list(range(n_show, N))
# the forecast starts from the last observation so the line is continuous
fmean = polyline([X(n_show - 1)] + [X(i) for i in fi], [Y(y_all[-1])] + [Y(v) for v in f_mean])
fan = ("M" + " L".join(f"{X(i)},{Y(v)}" for i, v in zip([n_show - 1] + fi, [y_all[-1]] + list(f_hi)))
       + " L" + " L".join(f"{X(i)},{Y(v)}" for i, v in reversed(list(zip([n_show - 1] + fi, [y_all[-1]] + list(f_lo)))))
       + " Z")
now_x = X(n_show - 1)
first_year, last_month = months[0][:4], months[-1]
pct = lambda i: f"{X(i) / W * 100:.2f}%"
ticks = "".join(f'<span style="left:{pct(i)}">{m[:4]}</span>'
                for i, m in enumerate(m_show) if m.endswith("-01") and int(m[:4]) % 5 == 0)
ticks += f'<span class="signal-axis-fc" style="left:{pct(n_show - 1)}">forecast</span>'

def fmt_month(ym):
    names = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
    y, m = ym.split("-"); return f"{names[int(m) - 1]} {y}"

aria = (f"India's monthly average temperature from {fmt_month(m_show[0])} to {fmt_month(last_month)}, "
        f"a yearly cycle between about {y_show.min():.0f} and {y_show.max():.0f} degrees Celsius, "
        f"followed by a {HORIZON}-month forecast with an 80 percent interval.")

svg = f'''<svg class="signal-svg" viewBox="0 0 {int(W)} {int(H)}" preserveAspectRatio="none" role="img" aria-label="{aria}">
            <path class="signal-hist" d="{hist}" />
            <path class="signal-fan" d="{fan}" />
            <path class="signal-fmean" d="{fmean}" />
            <line class="signal-now" x1="{now_x}" y1="0" x2="{now_x}" y2="{int(H)}" />
          </svg>'''

made = datetime.date.today().strftime("%b %Y")
caption = (f'<span class="signal-cap-k">India · monthly mean temperature · {m_show[0][:4]}–{last_month[:4]}</span>'
           f'<span class="signal-cap-v">Record since {first_year}: +{warming:.1f} °C vs 1951–80 · next {HORIZON} months forecast, 80% interval</span>'
           f'<span class="signal-cap-v">Backtest: {(1 - rel_mae) * 100:.0f}% lower error than seasonal-naive · '
           f'interval held {coverage * 100:.0f}% of the time</span>'
           f'<span class="signal-cap-src">ERA5 via Our World in Data, CC BY · forecast made {made} — check back</span>')

block = f'''<!-- signal:start (generated by scripts/build_signal.py; do not edit by hand) -->
        <figure class="signal" aria-labelledby="signal-cap">
          <div class="signal-plot">
            <div class="signal-canvas">
          {svg}
              <div class="signal-axis" aria-hidden="true">{ticks}</div>
            </div>
            <div class="signal-readout" aria-hidden="true"></div>
          </div>
          <figcaption id="signal-cap" class="signal-cap">{caption}</figcaption>
        </figure>
        <!-- signal:end -->'''

html = HTML.read_text()
pat = re.compile(r"<!-- signal:start.*?<!-- signal:end -->", re.S)
assert pat.search(html), "signal markers not found in index.html"
HTML.write_text(pat.sub(lambda _: block, html))

JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump({
    "months": m_show + f_months,
    "obs": [round(float(v), 2) for v in y_show],
    "fc": [[round(float(a), 2), round(float(b), 2), round(float(c), 2)] for a, b, c in zip(f_mean, f_lo, f_hi)],
    "n_obs": n_show, "y_lo": round(lo_all, 3), "y_hi": round(hi_all, 3),
    "w": W, "h": H, "pad": PAD,
}, open(JSON_OUT, "w"), separators=(",", ":"))

print(f"history      : {n_all} months, {months[0]} -> {last_month}; drawn from {m_show[0]} ({n_show} months)")
print(f"model        : trend + {K} harmonics on {FIT_YEARS}y, AR(1) phi={phi:.3f}, sigma_e={sigma:.3f} C")
print(f"trend        : {beta[1]:+.3f} C per decade (last {FIT_YEARS} years)")
print(f"backtest     : MAE {mae_model:.3f} vs seasonal-naive {mae_snaive:.3f}  -> relative {rel_mae:.3f}")
print(f"80% coverage : {coverage * 100:.1f}% ({covered}/{total})")
print(f"warming      : +{warming:.2f} C ({last_full - 9}-{last_full} vs 1951-1980)")
print(f"forecast     : {f_months[0]} {f_mean[0]:.1f} [{f_lo[0]:.1f}, {f_hi[0]:.1f}]  ...  "
      f"{f_months[-1]} {f_mean[-1]:.1f} [{f_lo[-1]:.1f}, {f_hi[-1]:.1f}]")
print(f"svg bytes    : {len(svg)}  json bytes: {JSON_OUT.stat().st_size}")
