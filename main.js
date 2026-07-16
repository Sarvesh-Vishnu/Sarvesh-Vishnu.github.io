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

  /* Reveal */
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const showAll = () => reveals.forEach((el) => el.classList.add('is-visible'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  /* Hero — staggered choreography on load (design.md §7) */
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.querySelectorAll('.reveal').forEach((el) => {
      const i = parseInt(el.dataset.stagger || '0', 10);
      setTimeout(() => el.classList.add('is-visible'), 80 * i);
    });
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

  reveals.forEach((el) => {
    if (el.closest('.hero')) return;
    io.observe(el);
  });
})();
