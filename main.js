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

  /* Motion handoff. When GSAP is present and motion is welcome, motion.js owns the
     reveals and marks the page `motion-gsap`. If it throws, or hasn't signalled
     `motion-ready` within 3s, hand everything back to the static path so nothing
     it would have animated stays hidden. */
  const gsapMode = !!window.gsap && root.classList.contains('motion');
  const unhide = () => {
    if (!gsapMode || root.classList.contains('motion-ready')) return;
    root.classList.remove('motion-gsap');
    document.querySelectorAll('.reveal, .th, .mg-fill').forEach((el) => {
      ['opacity', 'transform', '--p', 'stroke-dashoffset'].forEach((p) => el.style.removeProperty(p));
      el.classList.add('is-visible');
    });
  };
  document.addEventListener('motion:fail', unhide);
  if (gsapMode) setTimeout(unhide, 3000);

  /* Reveal (fallback path, used when motion.js isn't running) */
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length || gsapMode) return;

  const showAll = () => reveals.forEach((el) => el.classList.add('is-visible'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

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

  reveals.forEach((el) => io.observe(el));
})();
