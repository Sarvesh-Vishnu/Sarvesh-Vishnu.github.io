/* Portfolio — main.js
   Reveal-on-scroll, header hairline-on-scroll, reduced-motion respect.
   No frameworks, no build step. */

(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js', 'ready');                     // `ready` tells the <head> timer the script arrived

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Sheet toggle: the blue sheet (default) or the white print. Persists in
     localStorage; the initial value is set by the inline script in <head>. */
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    const syncAria = () => {
      const white = root.dataset.theme === 'white';
      toggle.setAttribute('aria-pressed', white ? 'true' : 'false');
      toggle.setAttribute('aria-label', white ? 'Switch to the blue sheet' : 'Switch to the white print');
    };
    syncAria();
    toggle.addEventListener('click', () => {
      const next = root.dataset.theme === 'white' ? 'blue' : 'white';
      root.dataset.theme = next;
      try { localStorage.setItem('sheet', next); } catch (e) { /* private mode */ }
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

  /* The header marks the section being read (§14.27): whichever one crosses a line a
     little above the middle of the screen. Nothing is marked over the hero. */
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const spied = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if (spied.length && 'IntersectionObserver' in window) {
    const inView = new Set();
    const mark = () => {
      const now = spied.filter((s) => inView.has(s)).pop();
      navLinks.forEach((a) => {
        if (now && a.getAttribute('href') === '#' + now.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) inView.add(e.target); else inView.delete(e.target); });
      mark();
    }, { rootMargin: '-42% 0px -58% 0px' });
    spied.forEach((s) => spy.observe(s));
  }

  /* The sheet marker (§14.33): a quiet "05 / 06 · Obscure" in the header while the
     index is on screen, so a reader always knows which sheet the figure belongs to. */
  const marker = document.querySelector('.nav-sheet');
  let markerBase = '', inWork = false;
  const paint = (txt) => {
    if (!marker) return;
    marker.textContent = txt;
    marker.classList.toggle('is-on', !!txt);
  };
  const restore = () => paint(inWork ? markerBase : '');

  /* The sheet index (design.md §14.30). On a wide screen the figure beside the list
     follows the sheet you point at or focus; with no pointer, the sheet you are
     reading past. CSS already shows the first figure and lets hover switch it, so
     this only makes the choice stick and adds the keyboard and scroll paths. */
  document.querySelectorAll('[data-sheets]').forEach((box) => {
    const sheets = Array.from(box.querySelectorAll('.sheet'));
    let pointed = 0, current = box.querySelector('.sheet.is-active');
    const label = (sh) => {
      const i = sheets.indexOf(sh) + 1, name = sh.querySelector('.sheet-name');
      return `${String(i).padStart(2, '0')} / ${String(sheets.length).padStart(2, '0')} · ${name ? name.textContent.trim() : ''}`;
    };
    const show = (sh) => {
      if (!sh) return;
      markerBase = label(sh);
      if (sh !== current) {
        sheets.forEach((x) => x.classList.toggle('is-active', x === sh));
        current = sh;
      }
      restore();
    };
    markerBase = current ? label(current) : '';
    // on a wide screen the sheet itself has no box (display: contents), so its link stands for it
    const link = (sh) => sh.querySelector('.sheet-link') || sh;
    sheets.forEach((sh) => {
      link(sh).addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') { pointed = Date.now(); show(sh); } });
      sh.addEventListener('focusin', () => show(sh));
    });
    if ('IntersectionObserver' in window) {
      const read = new IntersectionObserver((entries) => {
        if (Date.now() - pointed < 1500) return;           // the pointer has the say while it is moving
        entries.forEach((e) => { if (e.isIntersecting) show(e.target.closest('.sheet')); });
      }, { rootMargin: '-45% 0px -55% 0px' });
      sheets.forEach((sh) => read.observe(link(sh)));
      const section = box.closest('section');
      if (section) new IntersectionObserver((entries) => {
        entries.forEach((e) => { inWork = e.isIntersecting; restore(); });
      }, { rootMargin: '-30% 0px -30% 0px' }).observe(section);
    }
    box.classList.add('is-live');
  });

  /* The range grid lights its row and column (§14.33). Point at a project and its
     subject and method light; point at a method and its whole column lights, empty
     cells included, so the reader sees where a method recurs and where it does not.
     A numbered project also names its sheet in the header marker. */
  const tableWide = window.matchMedia('(min-width: 769px)');
  document.querySelectorAll('.range-grid').forEach((t) => {
    if (!t.tHead || !t.tBodies[0]) return;
    const heads = t.tHead.rows[0].cells, rows = Array.from(t.tBodies[0].rows);
    const clear = () => t.querySelectorAll('.is-hot, .is-lit').forEach((el) => el.classList.remove('is-hot', 'is-lit'));
    const light = (cell) => {
      clear();
      if (!tableWide.matches || !cell) return;
      const row = cell.parentElement, col = cell.cellIndex;
      if (row.parentElement === t.tHead) {
        if (!col) return;
        heads[col].classList.add('is-hot');
        rows.forEach((r) => r.cells[col] && r.cells[col].classList.add('is-lit'));
      } else if (!col) {
        cell.classList.add('is-hot');
        Array.from(row.cells).slice(1).forEach((c) => c.classList.add('is-lit'));
      } else {
        row.cells[0].classList.add('is-hot');
        heads[col].classList.add('is-hot');
        cell.classList.add('is-lit');
      }
    };
    const cite = (item) => {
      const no = item && item.querySelector('.rg-no');
      if (no) paint(`Sheet ${no.textContent.trim()} · ${item.lastChild.textContent.trim()}`); else restore();
    };
    t.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'touch') return;
      light(e.target.closest('th, td'));
      cite(e.target.closest('.rg-item'));
    });
    t.addEventListener('pointerleave', () => { clear(); restore(); });
    t.addEventListener('focusin', (e) => { light(e.target.closest('td')); cite(e.target.closest('.rg-item')); });
    t.addEventListener('focusout', () => { clear(); restore(); });
  });

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
