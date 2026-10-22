/* HackDental — interacciones del sitio (sin dependencias). Base: plantilla Nuvola Dental. */
(function () {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navegación: estado arriba / scrolleado ---------- */
  const nav = $('#nav');
  function syncNav() {
    const y = window.scrollY;
    nav.classList.toggle('is-top', y < 40);
    nav.classList.toggle('is-scrolled', y > 80);
  }
  syncNav();
  window.addEventListener('scroll', syncNav, { passive: true });

  /* ---------- Pestañas de producto ---------- */
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.tab;
      $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
      $$('.product-panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === id));
    });
  });

  /* ---------- Revelado al hacer scroll ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const vh = window.innerHeight;
    revealEls.forEach(el => { if (el.getBoundingClientRect().top > vh * 0.92) el.classList.add('is-hidden'); });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('is-hidden'); e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Palabras que se encienden con el scroll ---------- */
  const wordBlocks = $$('[data-wordreveal]');
  const words = [];
  wordBlocks.forEach(block => {
    const targets = block.tagName === 'H2' ? [block] : $$('p', block);
    targets.forEach(p => {
      const nodes = Array.from(p.childNodes);
      p.innerHTML = '';
      nodes.forEach(n => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { p.appendChild(document.createTextNode(t)); return; }
            const s = document.createElement('span'); s.className = 'w'; s.textContent = t; p.appendChild(s); words.push(s);
          });
        } else { p.appendChild(n); }
      });
    });
  });
  function paintWords() {
    if (!words.length) return;
    const line = window.innerHeight * 0.62;
    words.forEach(w => { const r = w.getBoundingClientRect(); w.classList.toggle('is-on', r.top + r.height * 0.5 < line); });
  }
  paintWords();
  window.addEventListener('scroll', paintWords, { passive: true });
  window.addEventListener('resize', paintWords);

  /* ---------- Contador ---------- */
  const counter = $('#counter');
  if (counter && !reduce && 'IntersectionObserver' in window) {
    const target = Number(counter.dataset.count || 0);
    const suffix = counter.dataset.suffix || '';
    const fmt = n => n.toLocaleString('es-ES') + suffix;
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1800;
      (function tick(now) {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        counter.textContent = fmt(Math.round(target * e));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.6 });
    counter.textContent = fmt(0);
    io.observe(counter);
  }

  /* ---------- Buscadores que "escriben" + chips/azulejos ---------- */
  $$('[data-type]').forEach((el, idx) => {
    if (reduce) { el.textContent = el.dataset.type.split('|')[0]; return; }
    const list = el.dataset.type.split('|');
    const chips = el.closest('.any') ? $$('.chip', el.closest('.any')) : [];
    const tiles = el.closest('.any') ? $$('.tile', el.closest('.any')) : [];
    let wi = 0, ci = 0, dir = 1;
    function step() {
      const word = list[wi];
      ci += dir;
      el.textContent = word.slice(0, ci);
      let wait = 90;
      if (dir === 1 && ci >= word.length) { dir = -1; wait = 1500; }
      else if (dir === -1 && ci <= 0) { dir = 1; wi = (wi + 1) % list.length; wait = 500; }
      if (chips.length) {
        const typed = el.textContent.toLowerCase();
        chips.forEach(ch => ch.classList.toggle('is-match', typed.length > 1 && ch.textContent.toLowerCase().startsWith(typed)));
      }
      if (tiles.length && ci === word.length) {
        const on = tiles.filter(t => t.textContent.trim());
        on.forEach(t => t.classList.remove('is-on'));
        const pick = on[(wi + idx) % on.length]; if (pick) pick.classList.add('is-on');
        on.forEach((t, i) => { if (i % 2 === wi % 2) t.classList.add('is-on'); });
      }
      setTimeout(step, wait);
    }
    setTimeout(step, 600 + idx * 400);
  });

  /* ---------- Interruptor de confirmación ---------- */
  const toggle = $('#toggle');
  if (toggle && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => { if (entries[0].isIntersecting) { setTimeout(() => toggle.classList.add('is-on'), 500); io.disconnect(); } }, { threshold: 0.8 });
    io.observe(toggle);
    toggle.addEventListener('click', () => toggle.classList.toggle('is-on'));
  }

  /* ---------- Flechas de la sección de tecnología ---------- */
  const techRow = $('#techRow');
  $$('[data-tech]').forEach(btn => btn.addEventListener('click', () => {
    if (!techRow) return;
    if (btn.dataset.tech === 'next') techRow.appendChild(techRow.firstElementChild);
    else techRow.insertBefore(techRow.lastElementChild, techRow.firstElementChild);
  }));

  /* ---------- Cómo funciona: pasos activos ---------- */
  const stepLis = $$('#stepsNav li');
  $$('[data-goto]').forEach(b => b.addEventListener('click', () => {
    const t = document.getElementById(b.dataset.goto);
    if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 140, behavior: reduce ? 'auto' : 'smooth' });
  }));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { const n = Number(e.target.dataset.step); stepLis.forEach((li, i) => li.classList.toggle('is-active', i === n - 1)); } });
    }, { rootMargin: '-40% 0px -50% 0px' });
    $$('.step').forEach(s => io.observe(s));
  }

  /* ---------- FAQ ---------- */
  $$('.faq-q').forEach(q => q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const open = item.classList.toggle('is-open');
    q.setAttribute('aria-expanded', String(open));
  }));

  /* ---------- Noria de casos del hero móvil (9 tarjetas sobre un círculo) ---------- */
  const fan = $('#fan');
  if (fan) {
    const cards = $$('.fan-card', fan);
    const R = 437, STEP = 17.5, SPAN = STEP * cards.length, CY = -410.5;
    let offset = 0, drag = null, vel = -3.9, last = performance.now(), running = false;
    const layout = () => {
      cards.forEach((c, i) => {
        let phi = (i - (cards.length - 1) / 2) * STEP + offset;
        phi = ((phi + SPAN / 2) % SPAN + SPAN) % SPAN - SPAN / 2;
        const rad = phi * Math.PI / 180;
        c.style.transform = `translate(${(R * Math.sin(rad)).toFixed(1)}px, ${(R * Math.cos(rad) + CY).toFixed(1)}px) rotate(${(-phi).toFixed(2)}deg)`;
      });
    };
    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!drag) { if (Math.abs(vel) > 4) vel *= 0.94; else vel = -3.9; offset += vel * dt; layout(); }
      if (running && getComputedStyle(fan).display !== 'none') requestAnimationFrame(frame); else running = false;
    };
    const start = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } };
    layout();
    if (!reduce) { start(); window.addEventListener('resize', start); }
    fan.addEventListener('pointerdown', e => { drag = { x: e.clientX, t: performance.now() }; vel = 0; fan.setPointerCapture(e.pointerId); });
    fan.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; const now = performance.now(); offset += dx / R * 180 / Math.PI; vel = (dx / R * 180 / Math.PI) / Math.max(0.001, (now - drag.t) / 1000); drag = { x: e.clientX, t: now }; layout(); });
    const end = () => { drag = null; last = performance.now(); start(); };
    fan.addEventListener('pointerup', end); fan.addEventListener('pointercancel', end);
  }

})();
