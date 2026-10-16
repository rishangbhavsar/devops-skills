/* html-plan-report assets v2026.10.13-27
   Shared by every plan in this folder and by index.html. Copied from the skill by update_index.py.
   Keep this a classic script: browsers refuse ES modules and fetch() on pages opened from disk.
   Optional enhancements only; every plan reads fully without JavaScript. */
(function () {
// Apply a saved light/dark choice before anything is drawn, so there is no flash of the wrong theme.
var THEME_KEY = 'plan-theme', root = document.documentElement;
try { var savedTheme = localStorage.getItem(THEME_KEY); if (savedTheme === 'light' || savedTheme === 'dark') root.setAttribute('data-theme', savedTheme); } catch (e) {}
var SRC = (document.currentScript && document.currentScript.src) || '';
var ASSETS = SRC ? SRC.replace(/plan\.js(\?.*)?$/, '') : '';

var ICON = {
  search: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.5 10.5 14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  menu: '<svg viewBox="0 0 16 16" width="17" height="17" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  sun: '<svg class="sun" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="currentColor"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M3 13l1.4-1.4M11.6 4.4 13 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  moon: '<svg class="moon" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7Z" fill="currentColor"/></svg>'
};
function make(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html) n.innerHTML = html; return n; }
function store(key, val) { try { if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch (e) {} }
function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

// Light/dark toggle. Choosing what the OS already uses clears the override, so the page follows the OS again.
function themeToggle() {
  var btn = make('button', 'theme-toggle', '<span class="knob">' + ICON.sun + ICON.moon + '</span>');
  btn.type = 'button'; btn.setAttribute('role', 'switch'); btn.setAttribute('aria-label', 'Dark mode');
  var os = matchMedia('(prefers-color-scheme: dark)');
  function dark() { var t = root.getAttribute('data-theme'); return t ? t === 'dark' : os.matches; }
  function sync() { btn.setAttribute('aria-checked', String(dark())); btn.title = dark() ? 'Switch to light' : 'Switch to dark'; }
  btn.addEventListener('click', function () {
    var want = !dark();
    if (want === os.matches) { root.removeAttribute('data-theme'); store(THEME_KEY, null); }
    else { root.setAttribute('data-theme', want ? 'dark' : 'light'); store(THEME_KEY, want ? 'dark' : 'light'); }
    sync();
  });
  if (os.addEventListener) os.addEventListener('change', sync);
  sync();
  return btn;
}

function init() {
  var main = document.querySelector('main'); if (!main) return;
  var layout = document.querySelector('.layout') || document.querySelector('.page');
  var isIndex = !!document.querySelector('meta[name="generator"][content*="update_index"]');
  var isBundle = !!document.querySelector('meta[name="plan-bundle"]');
  var hdr = main.querySelector('header');
  var shell = !!(layout && ASSETS && !isBundle);

  // ---- Shell: top bar, plans nav (left), contents (right)
  var nav = document.getElementById('toc'), resizer = document.querySelector('.toc-resizer'), plansNav = null, search = null;
  if (shell) {
    layout.classList.add('layout', 'has-shell');
    var bar = make('header', 'topbar'); bar.setAttribute('role', 'banner');
    var brand = make('a', 'brand'); brand.href = 'index.html'; brand.textContent = 'All plans';
    if (!isIndex) {
      var navBtn = make('button', 'nav-btn', ICON.menu); navBtn.type = 'button';
      navBtn.setAttribute('aria-label', 'Show or hide the plans list'); navBtn.setAttribute('aria-controls', 'plans-nav');
      bar.appendChild(navBtn);
    }
    bar.appendChild(brand);
    var mac = /Mac|iPhone|iPad/.test(navigator.platform || '');
    if (isIndex) {   // the search box sits at the top of the index's main column and filters its cards
      search = make('label', 'search', ICON.search + '<input type="search" placeholder="Search plans" aria-label="Search plans"><kbd>' + (mac ? '⌘ K' : 'Ctrl K') + '</kbd>');
      var main0 = document.getElementById('main'); if (main0) main0.insertBefore(search, main0.firstChild); else bar.appendChild(search);
    }
    bar.appendChild(make('span', 'spacer')); bar.appendChild(themeToggle());
    document.body.insertBefore(bar, document.body.firstChild);
    if (!isIndex) {
      plansNav = make('nav', 'plans-nav'); plansNav.id = 'plans-nav'; plansNav.setAttribute('aria-label', 'All plans');
      layout.insertBefore(plansNav, layout.firstChild);
      if (!resizer) { resizer = make('div', 'toc-resizer'); resizer.setAttribute('role', 'separator'); resizer.setAttribute('tabindex', '0'); }
      resizer.setAttribute('aria-orientation', 'vertical'); resizer.setAttribute('aria-controls', 'plans-nav');
      resizer.setAttribute('aria-label', 'Resize the plans list'); resizer.title = 'Drag to resize, double-click to reset';
      resizer.setAttribute('aria-valuemin', '200'); resizer.setAttribute('aria-valuemax', '420');
      plansNav.parentNode.insertBefore(resizer, plansNav.nextSibling);
      if (nav) layout.appendChild(nav);   // contents move to the right
      loadPlans();
    } else {
      layout.classList.add('no-nav');
    }
  } else if (hdr && !hdr.querySelector('.theme-toggle')) {
    var pbar = make('div', 'page-bar'), back = hdr.querySelector(':scope > a.back');
    if (back) pbar.appendChild(back);
    var t = themeToggle(); t.style.marginLeft = 'auto'; pbar.appendChild(t);
    hdr.insertBefore(pbar, hdr.firstChild);
  }

  // The list of plans comes from _assets/plans.js, written by update_index.py (a script, because fetch() is blocked from disk).
  function loadPlans() {
    var s = document.createElement('script'); s.src = ASSETS + 'plans.js';
    s.onload = function () { renderPlans(window.PLAN_INDEX || null); };
    s.onerror = function () { renderPlans(null); };
    document.head.appendChild(s);
  }
  function ago(sec) {   // "20 min ago", "2 h ago", "yesterday 08:27", "3 days ago", "Oct 3, 2026"
    var d = new Date(sec * 1000), now = new Date(), mins = Math.round((now - d) / 60000);
    var day = function (x) { return new Date(x.getFullYear(), x.getMonth(), x.getDate()); };
    var days = Math.round((day(now) - day(d)) / 864e5), two = function (n) { return (n < 10 ? '0' : '') + n; };
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' min ago';
    if (days === 0) return Math.floor(mins / 60) + ' h ago';
    if (days === 1) return 'yesterday ' + two(d.getHours()) + ':' + two(d.getMinutes());
    if (days < 7) return days + ' days ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function renderPlans(data) {
    if (data && data.title) { brand.textContent = data.title; }
    var here = decodeURIComponent(location.pathname.split('/').pop() || '');
    var plans = (data && data.plans) || [];
    plansNav.innerHTML = '';
    plansNav.appendChild(make('a', 'nav-head')).href = 'index.html'; plansNav.firstChild.textContent = 'All plans';
    if (!plans.length) { plansNav.appendChild(make('p', 'nav-empty', 'Run update_index.py to list plans here.')); return; }
    var list = make('div', 'nav-lists'); plansNav.appendChild(list);
    (function draw() {
      var order = function (a, b) { return (b.mtime || 0) - (a.mtime || 0); };   // last modified first
      list.innerHTML = '';
      [['Waiting for you', plans.filter(function (p) { return p.status === 'awaiting'; })],
       ['Plans', plans.filter(function (p) { return p.status !== 'awaiting'; })]].forEach(function (g) {
        if (!g[1].length) return;
        list.appendChild(make('p', 'nav-group')).textContent = g[0];
        var ul = make('ul'); list.appendChild(ul);
        g[1].slice().sort(order).forEach(function (p) {
          var li = make('li'), a = make('a', 'nav-item' + (p.status === 'superseded' ? ' superseded' : ''));
          a.href = p.file; if (p.file === here) a.setAttribute('aria-current', 'page');
          if (p.status === 'awaiting') { var dot = make('span', 'waiting'); dot.title = p.open ? p.open + ' decision' + (p.open > 1 ? 's' : '') + ' open' : 'waiting for your approval'; a.appendChild(dot); }
          var txt = make('span', 'nav-text'); txt.appendChild(make('span', 'nav-title')).textContent = p.title;
          if (p.mtime) txt.appendChild(make('small', 'nav-mod')).textContent = 'Modified ' + ago(p.mtime);
          a.appendChild(txt); li.appendChild(a); ul.appendChild(li);
        });
      });
      var cur = plansNav.querySelector('[aria-current="page"]'); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
    })();
  }

  // ---- Search: filters the plans list (or the cards on the index). Ctrl/Cmd+K focuses it; Enter opens the first match.
  if (search) {
    var input = search.querySelector('input');
    var filter = function () {
      var q = input.value.trim().toLowerCase();
      if (isIndex) {
        document.querySelectorAll('section.group').forEach(function (g) {
          var shown = 0;
          g.querySelectorAll('.plan-card').forEach(function (c) { var hit = !q || c.textContent.toLowerCase().indexOf(q) !== -1; c.hidden = !hit; if (hit) shown++; });
          g.hidden = shown === 0;
        });
      } else if (plansNav) {
        if (q && layout.classList.contains('nav-collapsed')) setCollapsed(false);
        if (q && !wideNav.matches) layout.classList.add('nav-open');
        plansNav.querySelectorAll('li[data-text]').forEach(function (li) { li.hidden = !!q && li.getAttribute('data-text').indexOf(q) === -1; });
      }
    };
    input.addEventListener('input', filter);
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var hit = isIndex ? document.querySelector('.plan-card:not([hidden]) a.plan-link') : plansNav && plansNav.querySelector('li:not([hidden]) a.nav-item');
      if (hit) location.href = hit.href;
    });
    addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); input.focus(); input.select(); }
      if (e.key === 'Escape' && document.activeElement === input) { input.value = ''; filter(); input.blur(); }
    });
  }

  // ---- Contents: built from the section headings (or a hand-written list in plans older than v1.8)
  var list = document.getElementById('toc-list') || (nav ? nav.querySelector('ul') : null), links = {};
  var tocWide = matchMedia(shell ? '(min-width: 1240px)' : '(min-width: 760px)');
  if (layout && nav && list) {
    function add(id, text, cls) {
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + id; a.textContent = text; a.title = text; if (cls) a.className = cls;
      li.appendChild(a); list.appendChild(li); links[id] = a;
    }
    if (list.children.length) {
      list.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    } else {
      var h1 = document.querySelector('main header h1'), top = h1 && h1.closest('header');
      if (top) { if (!top.id) top.id = 'top'; add(top.id, h1.textContent, 'toc-title'); }
      document.querySelectorAll('main section[id] > h2').forEach(function (h) { add(h.parentNode.id, h.textContent); });
    }
    nav.hidden = false; layout.classList.add('has-toc');
    var box = nav.querySelector('details');
    if (box) {
      box.open = tocWide.matches;
      box.querySelector('summary').addEventListener('click', function (e) { if (tocWide.matches) e.preventDefault(); });
      tocWide.addEventListener('change', function (m) { box.open = m.matches; });
      list.addEventListener('click', function () { if (!tocWide.matches) box.open = false; });
    }
  }

  // ---- Side panel: drag to resize, hide or show. With the shell it is the plans list; without it, the contents.
  var toggle = document.querySelector('.toc-toggle');
  var wideNav = matchMedia('(min-width: 900px)');
  var KEY = shell ? 'plan-nav' : 'plan-toc:' + location.pathname;
  var MIN = shell ? 200 : 140, MAX = shell ? 420 : 360, DEF = shell ? 270 : 190, VAR = shell ? '--nav-open-w' : '--toc-open-w';
  var st = { w: DEF, collapsed: false };
  try { var saved = JSON.parse(read(KEY)); if (saved && typeof saved.w === 'number') st = saved; } catch (e) {}
  function save() { store(KEY, JSON.stringify(st)); }
  function apply() {
    st.w = Math.max(MIN, Math.min(MAX, Math.round(st.w)));
    layout.style.setProperty(VAR, st.w + 'px');
    layout.classList.toggle(shell ? 'nav-collapsed' : 'toc-collapsed', !!st.collapsed);
    if (resizer) resizer.setAttribute('aria-valuenow', String(st.w));
    if (toggle && !shell) {
      var label = st.collapsed ? 'Show contents' : 'Hide contents';
      toggle.setAttribute('aria-expanded', String(!st.collapsed)); toggle.setAttribute('aria-label', label); toggle.title = label;
    }
  }
  function setCollapsed(v) { st.collapsed = v; apply(); save(); }
  var panelReady = shell ? !!plansNav : (layout && layout.classList.contains('has-toc') && toggle);
  if (panelReady && resizer) {
    resizer.hidden = false; if (toggle && !shell) toggle.hidden = false; apply();
    if (toggle && !shell) toggle.addEventListener('click', function () { setCollapsed(!st.collapsed); });
    resizer.addEventListener('pointerdown', function (e) {
      e.preventDefault(); resizer.setPointerCapture(e.pointerId);
      var x0 = e.clientX, w0 = st.w;
      function move(ev) { st.w = w0 + ev.clientX - x0; apply(); }
      function up() {
        resizer.removeEventListener('pointermove', move); resizer.removeEventListener('pointerup', up);
        resizer.removeEventListener('pointercancel', up); layout.classList.remove('dragging'); save();
      }
      layout.classList.add('dragging');
      resizer.addEventListener('pointermove', move); resizer.addEventListener('pointerup', up); resizer.addEventListener('pointercancel', up);
    });
    resizer.addEventListener('dblclick', function () { st.w = DEF; apply(); save(); });
    resizer.addEventListener('keydown', function (e) {
      var d = { ArrowLeft: -16, ArrowRight: 16 }[e.key];
      if (d) st.w += e.shiftKey ? d * 3 : d; else if (e.key === 'Enter') st.collapsed = !st.collapsed; else return;
      e.preventDefault(); apply(); save();
    });
  }
  if (shell && plansNav) {   // the menu button hides the list on wide screens and opens a drawer on narrow ones
    var navBtn2 = document.querySelector('.topbar .nav-btn');
    var syncBtn = function () { navBtn2.setAttribute('aria-expanded', String(wideNav.matches ? !st.collapsed : layout.classList.contains('nav-open'))); };
    navBtn2.addEventListener('click', function (e) {
      e.stopPropagation();
      if (wideNav.matches) setCollapsed(!st.collapsed); else layout.classList.toggle('nav-open');
      syncBtn();
    });
    document.addEventListener('click', function (e) {
      if (layout.classList.contains('nav-open') && !plansNav.contains(e.target)) { layout.classList.remove('nav-open'); syncBtn(); }
    });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && layout.classList.contains('nav-open')) { layout.classList.remove('nav-open'); syncBtn(); } });
    wideNav.addEventListener('change', function () { layout.classList.remove('nav-open'); syncBtn(); });
    syncBtn();
  }

  // ---- Current section in the contents; the last entry once the bottom is reached.
  var ids = Object.keys(links);
  function mark(id) {
    ids.forEach(function (k) { if (k === id) links[k].setAttribute('aria-current', 'true'); else links[k].removeAttribute('aria-current'); });
  }
  if (ids.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
    }, { rootMargin: '-60px 0px -70% 0px' });
    ids.forEach(function (k) {
      var target = document.getElementById(k); if (target) io.observe(target);
      links[k].addEventListener('click', function () { setTimeout(function () { mark(k); }, 50); });
    });
    addEventListener('scroll', function () {
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) mark(ids[ids.length - 1]);
    }, { passive: true });
  }

  // ---- Hover / focus highlight: point at a box and it, its arrows and its neighbours stay lit; the rest dims.
  // No markup needed: an arrow connects the boxes its two ends touch. Skipped when a transform makes coordinates unreliable.
  function enhanceDiagram(svg) {
    if (svg.querySelector('g[transform]')) return;
    var N = function (el, k) { return parseFloat(el.getAttribute(k)) || 0; };
    var nodes = [].map.call(svg.querySelectorAll('rect.box'), function (r) {
      return { x: N(r, 'x'), y: N(r, 'y'), w: N(r, 'width'), h: N(r, 'height'), els: [r], edges: [] };
    });
    if (nodes.length < 2) return;
    var owner = new Map();
    nodes.forEach(function (n) { owner.set(n.els[0], n); });
    svg.querySelectorAll('text').forEach(function (t) {
      var x = N(t, 'x'), y = N(t, 'y');
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) { n.els.push(t); owner.set(t, n); return; }
      }
    });
    var near = function (p) {   // the box whose edge is within 10px of point p
      var best = null, bd = 10;
      nodes.forEach(function (n) {
        var dx = Math.max(n.x - p[0], 0, p[0] - n.x - n.w), dy = Math.max(n.y - p[1], 0, p[1] - n.y - n.h), d = Math.hypot(dx, dy);
        if (d <= bd) { bd = d; best = n; }
      });
      return best;
    };
    var edges = [];
    svg.querySelectorAll('.arrow').forEach(function (a) {
      var pts = [];
      if (a.tagName === 'line') { pts = [[N(a, 'x1'), N(a, 'y1')], [N(a, 'x2'), N(a, 'y2')]]; }
      else {
        var cx = 0, cy = 0, sx = 0, sy = 0, m = (a.getAttribute('d') || '').match(/[a-zA-Z][^a-zA-Z]*/g) || [];
        m.forEach(function (seg) {
          var c = seg[0], v = (seg.slice(1).match(/-?\d*\.?\d+/g) || []).map(Number), rel = c === c.toLowerCase(), C = c.toUpperCase();
          if (C === 'H') { cx = rel ? cx + v[0] : v[0]; }
          else if (C === 'V') { cy = rel ? cy + v[0] : v[0]; }
          else if (C === 'Z') { cx = sx; cy = sy; }
          else if (v.length >= 2) { cx = rel ? cx + v[v.length - 2] : v[v.length - 2]; cy = rel ? cy + v[v.length - 1] : v[v.length - 1]; if (C === 'M') { sx = cx; sy = cy; } }
          pts.push([cx, cy]);
        });
      }
      if (pts.length < 2) return;
      var from = near(pts[0]), to = near(pts[pts.length - 1]);
      if (!from || !to || from === to) return;
      var e = { el: a, from: from, to: to }; edges.push(e); from.edges.push(e); to.edges.push(e); owner.set(a, e);
    });
    if (!edges.length) return;
    var lit = [], dots = [], calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function clear() {
      lit.forEach(function (el) { el.classList.remove('hl-on', 'hl-self'); }); lit = []; svg.classList.remove('hl');
      dots.forEach(function (d) { d.remove(); }); dots = [];
    }
    function flow(a) {   // dots travel along a lit arrow, in its direction; one per ~150px of length
      if (calm || !a.getTotalLength) return;
      var len = a.getTotalLength(), n = Math.max(1, Math.min(3, Math.round(len / 150))), dur = Math.max(0.9, len / 140);
      for (var i = 0; i < n; i++) {
        var d = document.createElementNS('http://www.w3.org/2000/svg', 'circle'), m = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        d.setAttribute('r', '3.5'); d.setAttribute('class', 'packet');
        m.setAttribute('dur', dur + 's'); m.setAttribute('begin', '-' + (i * dur / n) + 's'); m.setAttribute('repeatCount', 'indefinite'); m.setAttribute('path', a.getAttribute('d') || '');
        if (a.tagName === 'line') m.setAttribute('path', 'M' + a.getAttribute('x1') + ',' + a.getAttribute('y1') + ' L' + a.getAttribute('x2') + ',' + a.getAttribute('y2'));
        d.appendChild(m); a.parentNode.appendChild(d); dots.push(d);
      }
    }
    function on(el, self) { el.classList.add('hl-on'); if (self) el.classList.add('hl-self'); lit.push(el); }
    function show(o) {
      clear(); if (!o) return;
      svg.classList.add('hl');
      if (o.els) {   // a box: itself, its arrows, the boxes at the other ends
        o.els.forEach(function (el) { on(el, el === o.els[0]); });
        o.edges.forEach(function (e) { on(e.el); flow(e.el); var other = e.from === o ? e.to : e.from; other.els.forEach(function (el) { on(el); }); });
      } else {       // an arrow: itself and both ends
        on(o.el); flow(o.el); [o.from, o.to].forEach(function (n) { n.els.forEach(function (el) { on(el); }); });
      }
    }
    nodes.forEach(function (n) { if (n.edges.length) { n.els[0].setAttribute('tabindex', '0'); n.els[0].classList.add('hl-focus'); } });
    svg.addEventListener('mouseover', function (e) { show(owner.get(e.target)); });
    svg.addEventListener('mouseleave', clear);
    svg.addEventListener('focusin', function (e) { show(owner.get(e.target)); });
    svg.addEventListener('focusout', clear);
  }

  // ---- Click to expand: any diagram opens full size in a dialog. Esc, Close or the backdrop closes it.
  var lightbox = null;
  function openLightbox(svg, label) {
    if (!lightbox) {
      lightbox = make('dialog', 'lightbox', '<div class="lightbox-bar"><span class="lightbox-title"></span><button type="button">Close</button></div><div class="lightbox-body"></div>');
      lightbox.querySelector('button').addEventListener('click', function () { lightbox.close(); });
      lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.close(); });
      document.body.appendChild(lightbox);
    }
    var copy = svg.cloneNode(true);
    copy.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    copy.removeAttribute('aria-labelledby'); copy.setAttribute('aria-label', label);
    var body = lightbox.querySelector('.lightbox-body'); body.innerHTML = ''; body.appendChild(copy);
    enhanceDiagram(copy);
    lightbox.querySelector('.lightbox-title').textContent = label;
    lightbox.setAttribute('aria-label', label);
    if (lightbox.showModal) lightbox.showModal(); else lightbox.setAttribute('open', '');
  }
  document.querySelectorAll('figure').forEach(function (fig) {
    var svg = fig.querySelector(':scope > svg:not(.svg-defs)'); if (!svg) return;
    var t = svg.querySelector('title'), cap = fig.querySelector('figcaption');
    var label = (t && t.textContent) || (cap && cap.textContent) || 'Diagram';
    var btn = make('button', 'expand'); btn.type = 'button'; btn.textContent = 'Expand'; btn.setAttribute('aria-label', 'Expand diagram: ' + label);
    btn.addEventListener('click', function (e) { e.stopPropagation(); openLightbox(svg, label); });
    fig.insertBefore(btn, fig.firstChild);
    svg.addEventListener('click', function () { openLightbox(svg, label); });
    enhanceDiagram(svg);
  });

  // ---- Code highlighting: highlight.js from cdnjs, pinned and checked with SRI. Offline, code stays readable plain text.
  // Colours come from the --tok-* tokens in plan.css (no theme file is loaded), so they follow light and dark. Opt out
  // per block with class="nohighlight" (diffs and trees that carry their own .add/.del/.c spans). Set the language with
  // class="language-python" on the <code>; without it highlight.js guesses.
  (function () {
    var blocks = [].slice.call(document.querySelectorAll('pre > code')).filter(function (c) { return !/\bnohighlight\b|\blanguage-(plaintext|text)\b/.test(c.className); });
    if (!blocks.length) return;
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
    s.integrity = 'sha512-D9gUyxqja7hBtkWpPWGt9wfbfaMGVt9gnyCvYa+jojwwPHLCzUm5i8rpk7vD7wNee9bA35eYIjobYPaQuKS1MQ=='; s.crossOrigin = 'anonymous';
    s.onload = function () {
      if (!window.hljs) return;
      hljs.configure({ ignoreUnescapedHTML: true });
      blocks.forEach(function (c) { hljs.highlightElement(c); });
    };
    document.head.appendChild(s);
  })();

  // Fallback reply: rewrites itself when a non-recommended option is picked.
  var out = document.getElementById('reply-text');
  if (out) document.querySelectorAll('.decision input').forEach(function (i) {
    i.addEventListener('change', function () {
      var changed = [];
      document.querySelectorAll('.decision:not([data-decided])').forEach(function (d) {
        var c = d.querySelector('input:checked');
        if (c && c.dataset.recommended !== '1') changed.push(d.dataset.id + ': ' + c.closest('.opt').dataset.label);
      });
      out.textContent = changed.length
        ? 'Approved with changes. ' + changed.join('; ') + '. Keep the other recommended options, update the plan, then go ahead.'
        : 'Approved with the recommended options. Go ahead.';
    });
  });

  // Copy buttons appear only with JavaScript; selecting the text is the fallback.
  document.querySelectorAll('button.copy').forEach(function (btn) {
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.dataset.copy);
      function done(t) { btn.textContent = t; setTimeout(function () { btn.textContent = 'Copy'; }, 1800); }
      function select() {
        var r = document.createRange(), s = getSelection(); r.selectNodeContents(el); s.removeAllRanges(); s.addRange(r);
        try { done(document.execCommand('copy') ? 'Copied' : 'Press Ctrl+C'); } catch (e) { done('Press Ctrl+C'); }
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(el.textContent.trim()).then(function () { done('Copied'); }, select);
      else select();
    });
  });

  // Older engines lack ::details-content, so open collapsed sections for printing.
  addEventListener('beforeprint', function () {
    var lb = document.querySelector('dialog.lightbox'); if (lb && lb.open) lb.close();
    document.querySelectorAll('details:not([open])').forEach(function (d) { d.dataset.p = '1'; d.open = true; });
  });
  addEventListener('afterprint', function () {
    document.querySelectorAll('details[data-p]').forEach(function (d) { d.open = false; delete d.dataset.p; });
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
