/* Shared behaviour for every page — 張存瑀 portfolio */
(function () {
  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ── THEME (light / dark) ── */
  const savedTheme = store.get('theme');
  if (savedTheme) root.dataset.theme = savedTheme;
  window.toggleTheme = function () {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next; store.set('theme', next); syncThemeBtn();
  };
  function syncThemeBtn() {
    const b = document.getElementById('themeBtn');
    if (b) b.textContent = root.dataset.theme === 'dark' ? '☀' : '☾';
  }

  /* ── LANGUAGE ── */
  window.toggleLang = function () {
    const en = !document.body.classList.contains('en');
    document.body.classList.toggle('en', en);
    store.set('lang', en ? 'en' : 'zh');
    const b = document.getElementById('langBtn'); if (b) b.textContent = en ? '中' : 'EN';
    startTyping();
  };

  /* ── LIQUID GLASS: SVG displacement filter (Chromium only) ── */
  function injectLiquidFilter() {
    const ua = navigator.userAgent;
    const chromium = /Chrome|Chromium|Edg\//.test(ua) && !/Firefox/.test(ua);
    if (!chromium) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML =
      '<filter id="liquid" x="0" y="0" width="100%" height="100%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="n"/>' +
      '<feGaussianBlur in="n" stdDeviation="2" result="nb"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="nb" scale="38" xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter>';
    document.body.appendChild(svg);
    root.classList.add('lg-svg');
  }

  /* ── POINTER SPECULAR + TILT ── */
  function bindGlass() {
    document.querySelectorAll('.glass').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    if (matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-3px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ── SCROLL PROGRESS ── */
  function bindProgress() {
    const bar = document.getElementById('progress'); if (!bar) return;
    const upd = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* ── TYPING ── */
  let typeTimer = null;
  function startTyping() {
    const el = document.getElementById('typing'); if (!el) return;
    const en = document.body.classList.contains('en');
    const lines = JSON.parse(el.dataset[en ? 'linesEn' : 'linesZh'] || '[]');
    clearTimeout(typeTimer);
    let li = 0, ci = 0, del = false;
    (function tick() {
      const s = lines[li] || '';
      el.textContent = s.slice(0, ci);
      if (!del && ci < s.length) { ci++; typeTimer = setTimeout(tick, 55); }
      else if (!del) { del = true; typeTimer = setTimeout(tick, 1800); }
      else if (ci > 0) { ci--; typeTimer = setTimeout(tick, 22); }
      else { del = false; li = (li + 1) % lines.length; typeTimer = setTimeout(tick, 300); }
    })();
  }

  /* ── COUNTERS ── */
  function bindCounters() {
    const els = document.querySelectorAll('[data-count]'); if (!els.length) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const end = +e.target.dataset.count, t0 = performance.now(), dur = 1100;
      (function step(t) {
        const p = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
        e.target.textContent = v; if (p < 1) requestAnimationFrame(step);
      })(t0);
    }), { threshold: .4 });
    els.forEach(el => io.observe(el));
  }

  /* ── REVEAL ── */
  function bindReveal() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  /* ── LIGHTBOX ── */
  window.openLightbox = function (el) {
    const img = el.querySelector('img'); if (!img) return;
    document.getElementById('lightbox-img').src = img.src;
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.closeLightbox = function () {
    const lb = document.getElementById('lightbox'); if (!lb) return;
    lb.classList.remove('open'); document.body.style.overflow = '';
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  /* ── FLUID BACKGROUND ── */
  function fluid() {
    const canvas = document.getElementById('fluid-canvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d'); let W, H, blobs = [];
    const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; };
    const colors = [[29,78,216,0.18],[100,160,255,0.13],[200,220,255,0.12],[245,158,11,0.08],[140,200,255,0.14]];
    resize();
    for (let i = 0; i < 5; i++) blobs.push({ x: Math.random()*W, y: Math.random()*H, r: 180+Math.random()*240,
      vx: (Math.random()-.5)*.35, vy: (Math.random()-.5)*.28, c: colors[i], ph: Math.random()*6.28, sp: .004+Math.random()*.003 });
    addEventListener('resize', resize);
    (function draw(t) {
      ctx.clearRect(0, 0, W, H);
      blobs.forEach(b => {
        b.x += b.vx + Math.sin(t*b.sp + b.ph)*.4; b.y += b.vy + Math.cos(t*b.sp + b.ph*1.3)*.3;
        if (b.x < -b.r) b.x = W + b.r; if (b.x > W + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = H + b.r; if (b.y > H + b.r) b.y = -b.r;
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r), [r,g2,bl,a] = b.c;
        g.addColorStop(0, `rgba(${r},${g2},${bl},${a})`); g.addColorStop(.5, `rgba(${r},${g2},${bl},${a*.5})`); g.addColorStop(1, `rgba(${r},${g2},${bl},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
      });
      requestAnimationFrame(draw);
    })(0);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (store.get('lang') === 'en') { document.body.classList.add('en'); const b = document.getElementById('langBtn'); if (b) b.textContent = '中'; }
    syncThemeBtn(); injectLiquidFilter(); bindGlass(); bindProgress(); bindCounters(); bindReveal(); fluid(); startTyping();
  });
})();
