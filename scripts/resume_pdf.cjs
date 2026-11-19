/* Prints resume.html to assets/resume.pdf, and redraws the share card (assets/og-image.png),
   so the PDF and the card can never drift from the page (design.md §14.24).

   Needs Chrome and puppeteer-core, which this site does not depend on. Pass the folder of
   a project that has it:
     node scripts/resume_pdf.cjs ../haq
   Options: --pdf only the résumé, --card only the share card. */
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const tools = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(ROOT, '..', 'haq'));
const want = (flag) => !args.some((a) => a.startsWith('--')) || args.includes(flag);
const puppeteer = require(path.join(tools, 'node_modules', 'puppeteer-core'));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const pages = (pdf) => Math.max(0, ...[...Buffer.from(pdf).toString('latin1').matchAll(/\/Count (\d+)/g)].map((m) => +m[1]));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();

  if (want('--pdf')) {
    await page.goto(pathToFileURL(path.join(ROOT, 'resume.html')).href, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    fs.writeFileSync(path.join(ROOT, 'assets', 'resume.pdf'), pdf);
    console.log(`resume.pdf: ${pages(pdf)} pages, ${Math.round(pdf.length / 1024)} KB`);
  }

  if (want('--card')) {
    // the card says what the home page says: the name, its line with the redline, and the role
    const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const thesis = /<p class="thesis">([\s\S]*?)<\/p>/.exec(index)[1];
    const name = /class="hero-name">([^<]*)</.exec(index)[1];
    const card = await browser.newPage();
    await card.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await card.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&family=IBM+Plex+Sans:wght@300;400;500&display=swap">
      <style>
        * { margin: 0; box-sizing: border-box; }
        body { width: 1200px; height: 630px; padding: 76px 80px 70px; background: #0A2240; color: #F3F6FA; font-family: 'IBM Plex Sans', sans-serif; display: flex; flex-direction: column; justify-content: space-between; }
        .name { font-weight: 300; font-size: 124px; line-height: 1; letter-spacing: -0.04em; }
        .thesis { margin-top: 30px; font-weight: 300; font-size: 44px; line-height: 1.2; letter-spacing: -0.02em; }
        .redline { text-decoration: underline; text-decoration-color: #FF7A59; text-decoration-thickness: 0.055em; text-underline-offset: 0.14em; text-decoration-skip-ink: none; }
        .foot { display: flex; justify-content: space-between; align-items: baseline; font-size: 24px; }
        .foot span { color: #CBD7E7; }
        .foot code { font-family: 'IBM Plex Mono', monospace; font-size: 17px; letter-spacing: 0.08em; color: #A9BED8; }
      </style></head><body>
        <div><p class="name">${name}</p><p class="thesis">${thesis}</p></div>
        <p class="foot"><span>Senior Data Scientist</span><code>sarvesh-vishnu.github.io</code></p>
      </body></html>`, { waitUntil: 'load' });
    await card.evaluate(() => document.fonts.ready);
    await card.screenshot({ path: path.join(ROOT, 'assets', 'og-image.png'), type: 'png' });
    console.log('og-image.png: 1200 × 630');
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
