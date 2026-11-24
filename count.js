/* Portfolio — count.js (design.md §14.36)
   Records one page view with the site's own counter (Munnetrum/portfolio-visits, a
   Cloudflare Worker). No cookie, no IP stored, no third party. Sent after the page has
   loaded so it never delays reading.
   ?via=<tag> on any link is kept for the rest of the visit, so a reader who arrives from
   the résumé and opens two case studies counts as one tagged visit.
   ?nocount (once, in your own browser) stops your own visits being counted. */
(function () {
  'use strict';
  var ENDPOINT = 'https://portfolio-visits.work-sarveshvishnu.workers.dev/v';
  try {
    if (location.hostname !== 'sarvesh-vishnu.github.io') {
      if (!/[?&]counttest\b/.test(location.search)) return;   // local test only: send to a local counter
      ENDPOINT = 'http://localhost:8799/v';
    }
    var q = new URLSearchParams(location.search);
    if (q.has('nocount')) localStorage.setItem('nocount', '1');
    if (q.has('count')) localStorage.removeItem('nocount');
    if (localStorage.getItem('nocount') || navigator.webdriver) return;
    var via = (q.get('via') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
    try {
      if (via) sessionStorage.setItem('via', via); else via = sessionStorage.getItem('via') || '';
    } catch (e) { /* private mode */ }
    var send = function () {
      var body = JSON.stringify({ p: location.pathname, r: document.referrer, v: via, w: window.innerWidth });
      if (navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, body);
      else fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, mode: 'no-cors' });
    };
    if (document.readyState === 'complete') setTimeout(send, 0);
    else window.addEventListener('load', function () { setTimeout(send, 0); });
  } catch (e) { /* storage blocked: count nothing rather than break the page */ }
})();
