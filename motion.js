/* Portfolio — motion.js
   Progressive enhancement over main.js. Lenis smooth scroll on every page; on the
   home page, GSAP 3.15 (ScrollTrigger, SplitText) for section titles, row reveals,
   and the two-threads timeline. Runs only when the reader hasn't asked for reduced
   motion (the `motion` class on <html>, set in <head>). design.md §14.9.

   The motion budget is spent in one place: the path. Everything else is a quiet
   reveal, and the hero never moves. */

(function () {
  'use strict';

  const root = document.documentElement;
  if (!root.classList.contains('motion')) return;
  const g = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  try {

  /* ---- Smooth scroll. With GSAP, Lenis rides its ticker so scroll-linked work
     stays in sync; without it (project pages), Lenis runs its own frame loop. */
  if (window.Lenis) {
    const lenis = new window.Lenis({ autoRaf: !(g && ScrollTrigger), lerp: 0.14 });   // a shorter tail than the default 0.1 (§14.27)
    if (g && ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      g.ticker.add((t) => lenis.raf(t * 1000));
      g.ticker.lagSmoothing(0);
    }
    // Same-page links glide and land clear of the fixed header. The skip link is
    // left native so keyboard focus still moves to <main>.
    document.querySelectorAll('a[href^="#"]:not(.skip):not(.reel-jump)').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const target = id === '#top' ? 0 : id.length > 1 && document.querySelector(id);
        if (target === false || target === null) return;
        e.preventDefault();
        lenis.scrollTo(target, { duration: 0.8 });   // lands by the page's scroll-padding-top, so the section's rule tucks under the header
        history.pushState(null, '', id);
      });
    });
  }

  if (!g || !ScrollTrigger) return;          // project pages: smooth scroll only
  const SplitText = window.SplitText;
  g.registerPlugin(...[ScrollTrigger, SplitText].filter(Boolean));
  root.classList.add('motion-gsap');

  /* ---- Section titles: lines rise out of a mask, once ------------------------ */
  document.querySelectorAll('.section-head.reveal').forEach((el) => el.classList.add('is-visible'));
  g.set('.section-head.reveal', { opacity: 1, y: 0 });
  if (SplitText) {
    document.querySelectorAll('.section-title').forEach((title) => {
      SplitText.create(title, {
        type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
        onSplit: (self) => g.from(self.lines, {
          yPercent: 110, duration: 0.6, ease: 'expo.out', stagger: 0.06,
          scrollTrigger: { trigger: title, start: 'top 96%', once: true },
        }),
      });
    });
  }

  /* ---- Everything else marked .reveal: batched fade-up as it enters ----------- */
  const rows = g.utils.toArray('.reveal').filter((el) => !el.matches('.section-head'));
  g.set(rows, { opacity: 0, y: 10 });
  ScrollTrigger.batch(rows, {
    start: 'top 97%', once: true,
    // 'auto' only overrides opacity/y, so a timeline row's line-drawing tween survives
    onEnter: (batch) => g.to(batch, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.04, overwrite: 'auto' }),
  });

  /* ---- The path: both threads draw as you read down them, and the merge
     curves meet in one heavier line. Scrubbed, so it follows your scroll both
     ways; each dot lights as the line reaches it. -------------------------------- */
  const READ = 'top 70%';                    // the "reading line" in the viewport
  document.querySelectorAll('.threads > li').forEach((li) => {
    const lit = (on) => li.classList.toggle('is-lit', on);
    if (li.classList.contains('th-merge')) {
      const fills = li.querySelectorAll('.mg-fill');
      g.fromTo(fills, { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: li, start: READ, end: 'bottom 70%', scrub: 0.5 },
      });
      ScrollTrigger.create({ trigger: li, start: 'bottom 70%', onEnter: () => lit(true), onLeaveBack: () => lit(false) });
      return;
    }
    // the last row's line only runs down to today's dot, so it finishes just after it lights
    const end = li.classList.contains('th-end') ? 'top 66%' : 'bottom 70%';
    g.fromTo(li, { '--p': 0 }, {
      '--p': 1, ease: 'none',
      scrollTrigger: { trigger: li, start: READ, end, scrub: 0.5 },
    });
    ScrollTrigger.create({ trigger: li, start: READ, onEnter: () => lit(true), onLeaveBack: () => lit(false) });
  });

  // Fonts change line breaks; re-measure once they're in.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  root.classList.add('motion-ready');

  } catch (err) {
    // Anything goes wrong: hand the page back to main.js's static fallback at once.
    document.dispatchEvent(new CustomEvent('motion:fail', { detail: err }));
  }
})();
