/* Portfolio — main.js
   Reveal-on-scroll, header hairline-on-scroll, reduced-motion respect.
   No frameworks, no build step. */

(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme toggle — light default, persists via localStorage.
     Initial data-theme is set by the inline script in <head>. */
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    const syncAria = () => {
      const isDark = root.dataset.theme === 'dark';
      toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    };
    syncAria();
    toggle.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
      syncAria();
    });
  }

  /* Header — add hairline once the page has scrolled past 8px */
  const header = document.getElementById('header');
  if (header) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Signal readout — hover the hero chart to read any month (pointer: fine).
     Not motion, so it runs with or without GSAP and under reduced motion. */
  const plot = document.querySelector('.signal-plot');
  if (plot && window.matchMedia('(pointer: fine)').matches) {
    const svg = plot.querySelector('.signal-svg');
    const readout = plot.querySelector('.signal-readout');
    const guide = document.createElement('span'); guide.className = 'signal-guide';
    const dot = document.createElement('span'); dot.className = 'signal-dot';
    plot.append(guide, dot);
    const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
    const label = (ym) => { const [y, m] = ym.split('-'); return MONTHS[+m - 1] + ' ' + y; };
    let data = null, loading = null;
    const load = () => loading || (loading = fetch('assets/data/signal.json')
      .then((r) => r.json()).then((d) => { data = d; }).catch(() => {}));
    plot.addEventListener('pointerenter', load, { once: true });
    plot.addEventListener('pointermove', (e) => {
      if (!data) return;
      const box = svg.getBoundingClientRect(), pbox = plot.getBoundingClientRect();
      const n = data.months.length;
      const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - box.left) / box.width) * (n - 1))));
      const isFc = i >= data.n_obs;
      const v = isFc ? data.fc[i - data.n_obs][0] : data.obs[i];
      const x = box.left - pbox.left + (i / (n - 1)) * box.width;
      const y = box.top - pbox.top + (data.pad + ((data.y_hi - v) * (data.h - 2 * data.pad)) / (data.y_hi - data.y_lo)) * (box.height / data.h);
      guide.style.left = x + 'px';
      dot.style.left = x + 'px'; dot.style.top = y + 'px';
      readout.textContent = isFc
        ? `${label(data.months[i])} · forecast ${v.toFixed(1)} °C (${data.fc[i - data.n_obs][1].toFixed(1)}–${data.fc[i - data.n_obs][2].toFixed(1)})`
        : `${label(data.months[i])} · ${v.toFixed(1)} °C`;
      const w = readout.offsetWidth;
      readout.style.left = Math.max(0, Math.min(pbox.width - w, x + 10)) + 'px';
      plot.classList.add('is-reading');
    });
    plot.addEventListener('pointerleave', () => plot.classList.remove('is-reading'));
  }

  /* Motion handoff. When GSAP is present and motion is welcome, motion.js owns the
     reveals. If the libraries failed to load, or motion.js never signals ready,
     drop the `motion` flag so nothing it would have animated stays hidden. */
  const gsapMode = !!window.gsap && root.classList.contains('motion');
  if (!window.gsap) root.classList.remove('motion');
  const unhide = () => {
    if (root.classList.contains('motion-ready') || !gsapMode) return;
    root.classList.remove('motion');
    document.querySelectorAll('.reveal, .signal-svg, .signal-cap, .signal-svg > *').forEach((el) => {
      ['opacity', 'transform', 'clip-path'].forEach((p) => el.style.removeProperty(p));
      el.classList.add('is-visible');
    });
  };
  document.addEventListener('motion:fail', unhide);
  setTimeout(unhide, 3000);

  /* Reveal (fallback path, used when motion.js isn't running) */
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length || gsapMode) return;

  const showAll = () => reveals.forEach((el) => el.classList.add('is-visible'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  /* Hero — its staggered entrance is CSS-only (styles.css §7), so nothing to do here. */

  /* Sections — IntersectionObserver, 60ms stagger per group */
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      visible.forEach((entry, i) => {
        const el = entry.target;
        setTimeout(() => el.classList.add('is-visible'), i * 60);
        io.unobserve(el);
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
  );

  reveals.forEach((el) => {
    if (el.closest('.hero, .project-hero')) return;
    io.observe(el);
  });
})();
