"""
Copy sheet: every line of text on the site, in page order, with file and line.

Run   : python3 scripts/copy_sheet.py
Writes: COPY.md (gitignored). Lines marked "draft" were written during the redesign
        and are waiting for the owner's edit; DRAFTS below is the list of those.
"""
import html, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DRAFTS = [
 'Building forecasts, AI systems and civic tools', 'always glad to meet people', 'Every figure here is computed',
 'The work figures are running models', 'Commercial operations and analytics', 'The planning analytics behind', 'Natural language processing',
 'Reading what people write, at scale', 'Personal project', 'A contemplative globe of where', 'Open the case study', 'Language at scale', 'Commercial analytics',
 'Targets shape a person', 'Patients had already said', 'Two threads, one practice', 'The short version', "Let's connect",
 'The research companion', 'Alongside the planning work', 'Three rules are enforced', 'Earlier, at Siemens', 'The first version of this work',
 'No single model owns the truth', 'Four forecasters read', 'A synthetic product line', 'Is the worst facility really the worst', 'Twelve facilities, each',
 'Synthetic facilities', 'Work · ', 'Strategy &amp; Market Insights · 2025 to present', 'Pinnacle Fertility, Duke Fuqua capstone, 2024', 'Senior Data Scientist',
 'On Paper</a>, an essay series', 'Models that end in a decision', 'Senior data scientist. Models', 'Python · SQL · Azure · PowerBI · LangGraph',
 'Three.js · Next.js · UNHCR', 'Operate it', 'LangGraph · hybrid retrieval', 'Drawn in Prussian blue',
]
CLASSES = ('thesis|hero-name|hero-role|eyebrow|section-title|section-note|reel-kind|reel-jump|slide-kind|project-name|slide-desc|slide-why|'
           'project-meta|slide-open|th-when|th-body|project-byline|project-tools|lab-title|lab-lede|lab-note|lab-key|label|contact-title|contact-line|foot-line')
A = re.compile(r'<(\w+)\b([^>]*class="(?:[^"]* )?(' + CLASSES + r')(?: [^"]*)?"[^>]*)>(.*?)</\1>', re.S)
B = re.compile(r'<(h1|h2|p|li|dt|dd)(\s[^>]*)?>(.*?)</\1>', re.S)

def clean(t):
    t = re.sub(r'<!--.*?-->|<svg.*?</svg>', '', t, flags=re.S)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', t))).strip()

out = ['# Site copy', '',
       'Every line of text on the site, in page order, with the file and line it lives on.',
       '**✎ draft** marks wording written for you in the redesign: edit or replace it freely.',
       'Unmarked lines are your own words, carried over unchanged.',
       'The hero sentence and the sentences under each instrument are built by `lab.js` from the models. '
       'In the hero only the words between the numbers are editable; the instrument sentences live in `lab.js` (`sayCommittee`, `saySample`).', '']
for f in ['index.html', 'work/commercial-analytics.html', 'work/nlp.html', 'work/numit.html']:
    src = (ROOT / f).read_text()
    out += [f'## {f}', '']
    for label, pat in (('Browser title', r'<title>(.*?)</title>'), ('Search description', r'<meta name="description" content="(.*?)"')):
        mm = re.search(pat, src); raw = mm.group(1)
        out.append(f'- **{label}** (line {src[:mm.start()].count(chr(10)) + 1}){" ✎ draft" if any(k in raw for k in DRAFTS) else ""}: {html.unescape(raw)}')
    a, z = src.index('<main'), src.index('</footer>')
    items = {}
    for mm in A.finditer(src, a, z):
        items[mm.start()] = (mm.group(3), mm.group(2) + mm.group(4), mm.group(4))
    pos = a
    while True:                                           # prose: try every opening tag so nested lines are not swallowed
        mm = B.search(src, pos, z)
        if not mm: break
        pos = mm.start() + 1
        attrs = mm.group(2) or ''
        if 'class=' in attrs or mm.start() in items: continue
        if re.search(r'<(p|li|h1|h2|dl|ol|ul|div)\b', mm.group(3)): continue
        items[mm.start()] = (mm.group(1), mm.group(3), mm.group(3))
    seen = set()
    for start in sorted(items):
        kind, raw, inner = items[start]
        text = clean(inner)
        if len(text) < 2 or (kind, text) in seen: continue
        seen.add((kind, text))
        out.append(f'- `{kind}` (line {src[:start].count(chr(10)) + 1}){" ✎ draft" if any(k in raw for k in DRAFTS) else ""}: {text}')
    out.append('')
(ROOT / 'COPY.md').write_text('\n'.join(out) + '\n')
print(f'COPY.md: {len(out)} lines, {sum("✎" in l for l in out)} drafts')
