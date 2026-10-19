/* Portfolio — motion.js
   Progressive enhancement over main.js: GSAP 3.15 (ScrollTrigger, SplitText) + Lenis.
   Runs only when the libraries loaded AND the reader hasn't asked for reduced motion
   (the `motion` class on <html>, set in <head>). design.md §14.9.

   The rule: every animated visual either encodes real data or reveals real content.
   Nothing loops in the background except the skills ticker, which follows your scroll. */

(function () {
  'use strict';

  const root = document.documentElement;
  const g = window.gsap;
  if (!g || !root.classList.contains('motion')) return;

  try {

  const { ScrollTrigger, SplitText } = window;
  g.registerPlugin(...[ScrollTrigger, SplitText].filter(Boolean));   // SplitText: home page only
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---- Smooth scroll: Lenis drives GSAP's ticker so scroll-linked work stays in sync */
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    g.ticker.add((t) => lenis.raf(t * 1000));
    g.ticker.lagSmoothing(0);

    // Same-page links glide and land clear of the fixed header. The skip link is left
    // native so keyboard focus still moves to <main>.
    document.querySelectorAll('a[href^="#"]:not(.skip)').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const target = id === '#top' ? 0 : id.length > 1 && document.querySelector(id);
        if (target === false || target === null) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: target === 0 ? 0 : -72 });
        history.pushState(null, '', id);
      });
    });
  }

  /* ---- Hero: the signal draws left to right, then the forecast fades in -------- */
  // (The hero text itself enters on CSS alone — styles.css §7 — so it never waits on us.)
  const HERO = '.hero, .project-hero';

  const signal = document.querySelector('.signal');
  if (signal) {
    const svg = signal.querySelector('.signal-svg');
    // History draws first; the forecast (fan, mean, "now" rule) arrives once the line
    // reaches today. `from` animates back to whatever opacity styles.css gives each.
    // The hero name fills most screens, so the draw waits until the chart is in view
    // (on tall screens that is immediately).
    const future = signal.querySelectorAll('.signal-fan, .signal-fmean, .signal-now');
    g.timeline({ delay: 0.3, scrollTrigger: { trigger: signal, start: 'top 92%', once: true } })
      .set(svg, { opacity: 1 })
      .fromTo(svg, { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.2, ease: 'power2.inOut' })
      .from(future, { opacity: 0, duration: 0.7, ease: 'power1.out', stagger: 0.1 }, '-=0.35')
      .fromTo(signal.querySelector('.signal-cap'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');
  }

  /* ---- Decrypted labels (React Bits "DecryptedText", rebuilt): mono eyebrows and
     project kickers resolve left to right. Screen readers get the real text once. */
  const GLYPHS = '01#/_<>%·';
  const scramble = (el) => {
    const text = el.textContent;
    el.innerHTML = '';
    const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true'); vis.textContent = text;
    el.append(sr, vis);
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => {
        const p = { v: 0 };
        g.to(p, {
          v: 1, duration: 0.8, ease: 'none',
          onUpdate: () => {
            const n = Math.floor(p.v * text.length);
            vis.textContent = text.slice(0, n) +
              text.slice(n).replace(/[^\s·—§]/g, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]);
          },
          onComplete: () => { el.textContent = text; },   // back to plain text once resolved
        });
      },
    });
  };
  document.querySelectorAll('.section-head .eyebrow, .ind-kicker').forEach(scramble);

  /* ---- Section titles (React Bits "SplitText"): lines rise out of a mask ------- */
  document.querySelectorAll('.section-head.reveal').forEach((el) => el.classList.add('is-visible'));
  g.set('.section-head.reveal', { opacity: 1, y: 0 });
  if (SplitText) {
    document.querySelectorAll('.section-title').forEach((title) => {
      SplitText.create(title, {
        type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
        onSplit: (self) => g.from(self.lines, {
          yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.09,
          scrollTrigger: { trigger: title, start: 'top 88%', once: true },
        }),
      });
    });
  }

  /* ---- Everything else marked .reveal: batched fade-up as it enters ----------- */
  const rest = g.utils.toArray('.reveal').filter((el) => !el.closest(HERO) && !el.matches('.section-head'));
  g.set(rest, { opacity: 0, y: 18 });
  ScrollTrigger.batch(rest, {
    start: 'top 90%', once: true,
    onEnter: (batch) => g.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, overwrite: true }),
  });

  /* ---- Timeline: the rail fills as you read down it; each year lights up ------ */
  document.querySelectorAll('.timeline .tm').forEach((li) => {
    const rail = li.querySelector('.tm-rail');
    if (!rail) return;
    const fill = document.createElement('span'); fill.className = 'tm-fill';
    rail.appendChild(fill);
    g.to(fill, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: li, start: 'top 72%', end: 'bottom 72%', scrub: 0.4 } });
    ScrollTrigger.create({
      trigger: li, start: 'top 72%',
      onEnter: () => li.classList.add('is-lit'), onLeaveBack: () => li.classList.remove('is-lit'),
    });
  });

  /* ---- Independent work: screenshots wipe up and settle ----------------------- */
  document.querySelectorAll('.ind-shot').forEach((shot) => {
    const img = shot.querySelector('img');
    g.timeline({ scrollTrigger: { trigger: shot, start: 'top 85%', once: true } })
      .fromTo(shot, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.out' })
      .fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.4, ease: 'expo.out' }, 0);
  });

  /* ---- Result figures (React Bits "CountUp"): count from zero on project pages.
     Ranges like "6–12mo" and single digits like "4-way" are left as written. */
  document.querySelectorAll('.project-results dd').forEach((dd) => {
    const raw = dd.textContent.trim();
    const m = raw.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
    if (!m || /^[–-]\d/.test(m[3])) return;
    const [, pre, num, post] = m;
    const target = parseFloat(num);
    if (target < 10) return;
    const dec = (num.split('.')[1] || '').length;
    dd.setAttribute('aria-label', raw);
    const p = { v: 0 };
    dd.textContent = pre + (0).toFixed(dec) + post;
    g.to(p, {
      v: target, duration: 1.4, ease: 'power2.out',
      scrollTrigger: { trigger: dd, start: 'top 92%', once: true },
      onUpdate: () => { dd.textContent = pre + p.v.toFixed(dec) + post; },
      onComplete: () => { dd.textContent = raw; },
    });
  });

  /* ---- Skills ticker (React Bits "ScrollVelocity"): drifts, speeds up with your
     scroll, and reverses when you scroll back up. */
  const track = document.querySelector('.ticker-track');
  if (track) {
    let x = 0;
    let vel = 1;
    let onScreen = false;
    const wrap = g.utils.wrap(-50, 0);
    ScrollTrigger.create({
      onUpdate: (self) => { vel = self.direction * Math.min(7, 1 + Math.abs(self.getVelocity()) / 300); },
    });
    ScrollTrigger.create({ trigger: track, start: 'top bottom', end: 'bottom top', onToggle: (self) => { onScreen = self.isActive; } });
    g.ticker.add((time, dt) => {
      if (!onScreen) return;
      const base = Math.sign(vel) || 1;
      vel += (base - vel) * 0.05;               // ease back to a gentle drift
      x = wrap(x - vel * dt * 0.0015);
      g.set(track, { xPercent: x });
    });
  }

  /* ---- Magnetic buttons (React Bits "Magnet"): a small pull toward the cursor -- */
  if (finePointer) {
    document.querySelectorAll('.btn').forEach((btn) => {
      const xTo = g.quickTo(btn, 'x', { duration: 0.45, ease: 'power3' });
      const yTo = g.quickTo(btn, 'y', { duration: 0.45, ease: 'power3' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.2);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  // Fonts change line breaks; re-measure once they're in.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  root.classList.add('motion-ready');

  } catch (err) {
    // Anything goes wrong: hand the page back to main.js's static fallback at once.
    document.dispatchEvent(new CustomEvent('motion:fail', { detail: err }));
  }
})();
