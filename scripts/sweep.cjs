/* The layout sweep: every page, at five widths, on both sheets, in three modes
   (motion on, reduced motion, JavaScript off). It fails a page that scrolls sideways,
   leaves anything hidden after a full scroll, lets text run past the right edge, or
   logs an error or a failed request. Kept in the repo so the gate cannot go missing.

   Needs Chrome, puppeteer-core from a neighbouring project, and the site served locally:
     node scripts/sweep.cjs ../haq [http://localhost:4321] [--only=/,/resume.html] [--modes=default,reduced,nojs] */
const path = require('node:path');
const args = process.argv.slice(2);
const tools = path.resolve(args.find((a) => !a.startsWith('--') && !a.startsWith('http')) || path.join(__dirname, '..', '..', 'haq'));
const BASE = args.find((a) => a.startsWith('http')) || 'http://localhost:4321';
const only = (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const modes = (args.find((a) => a.startsWith('--modes=')) || '').slice(8).split(',').filter(Boolean);
const puppeteer = require(path.join(tools, 'node_modules', 'puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PAGES = ['/', '/work/commercial-analytics.html', '/work/nlp.html', '/work/wv-water.html', '/work/obscure.html', '/work/numit.html', '/resume.html'];

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const cases = [{ name: 'default', js: true, reduced: false }, { name: 'reduced', js: true, reduced: true }, { name: 'nojs', js: false, reduced: false }]
    .filter((c) => !modes.length || modes.includes(c.name));
  let fails = 0, n = 0;
  const check = async (c, p, w, sheet) => {
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    page.on('requestfailed', (r) => errs.push('reqfail: ' + r.url()));
    page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    await page.setJavaScriptEnabled(c.js);
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: c.reduced ? 'reduce' : 'no-preference' }]);
    await page.setViewport({ width: w, height: 900 });
    await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('sheet', t); } catch (e) {} }, sheet);
    await page.goto(BASE + p, { waitUntil: 'networkidle0' });
    if (c.js) {
      const H = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += 300) { await page.evaluate((y) => window.scrollTo(0, y), y); await sleep(50); }
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await sleep(1600);
    }
    const bad = await page.evaluate(() => {
      const out = [];
      const op = (el) => { let o = 1; for (let n = el; n && n !== document.documentElement; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
      const hidden = [...document.querySelectorAll('.reveal, .section-title, .split-line, main p, main li, main h1, main h2, main h3, main dd, main dt, .project-facts')]
        .filter((el) => el.getClientRects().length && op(el) < 0.99).map((el) => (el.className || el.tagName) + ':' + op(el).toFixed(2));
      if (hidden.length) out.push('hidden ' + hidden.slice(0, 4).join(', '));
      const side = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      if (side > 1) out.push('sideways scroll ' + side + 'px');
      // text that runs past the right edge of the page (inside a sideways scroller is fine)
      const vw = document.documentElement.clientWidth; const over = [];
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walk.nextNode()) { const node = walk.currentNode; if (!node.textContent.trim()) continue; const el = node.parentElement;
        if (!el || el.closest('svg, script, style, noscript, .skip, .sr-only, .reel-track, [hidden]') || getComputedStyle(el).visibility === 'hidden') continue;
        const rg = document.createRange(); rg.selectNodeContents(node);
        for (const b of rg.getClientRects()) if (b.width > 1 && (b.right > vw + 1 || b.left < -1)) { over.push((el.className || el.tagName) + ' "' + node.textContent.trim().slice(0, 24) + '"'); break; } }
      if (over.length) out.push('text off the page: ' + over.slice(0, 3).join('; '));
      return out;
    });
    await page.close();
    return bad.concat(errs.slice(0, 3));
  };
  for (const c of cases) for (const p of (only.length ? only : PAGES)) for (const w of [320, 375, 768, 1024, 1440]) for (const sheet of ['blue', 'white']) {
    n++;
    let all;
    try { all = await check(c, p, w, sheet); }
    catch (e) { await sleep(500); all = await check(c, p, w, sheet); }      // a dropped page is the browser's fault: try once more
    if (all.length) { fails++; console.log('FAIL', c.name, p, w, sheet, JSON.stringify(all)); }
    else if (w === 1440 && sheet === 'blue') console.log('ok  ', c.name, p);
  }
  console.log(`${n - fails}/${n} passed`);
  await browser.close();
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
