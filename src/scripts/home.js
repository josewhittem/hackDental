// Comportamiento de la home: menú móvil, cabecera al hacer scroll, calculadora, cupo, carrusel, VSL y pop-up del ebook.
import { ApiService } from '../api/service.js';
import { initCupo } from './cupo.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* ---------- Barra superior: menú móvil ---------- */
(() => {
  const top = $('#hdr'), bg = $('#hd-burger');
  if (!top || !bg) return;
  bg.addEventListener('click', () => {
    const o = top.classList.toggle('open');
    bg.setAttribute('aria-expanded', String(o));
    bg.setAttribute('aria-label', o ? 'Cerrar menú' : 'Abrir menú');
  });
  $$('#hd-menu a').forEach((a) => a.addEventListener('click', () => { top.classList.remove('open'); bg.setAttribute('aria-expanded', 'false'); }));
})();

/* ---------- Scroll: cabecera compacta, subrayados y barra fija inferior ---------- */
const paint = () => {
  const vh = innerHeight, sy = scrollY;
  $$('.hl:not(#h1hl)').forEach((h) => { if (h.getBoundingClientRect().top < vh * 0.8) h.classList.add('on'); });
  const hdr = $('#hdr');
  if (hdr) { hdr.classList.toggle('scrolled', sy > 10); hdr.classList.toggle('compact', sy > 80); }
  const contacto = $('#contacto'), bar = $('#deadbar');
  if (contacto && bar) bar.classList.toggle('on', sy > 700 && contacto.getBoundingClientRect().top > vh - 40);
};
addEventListener('scroll', paint, { passive: true });
addEventListener('resize', paint);
requestAnimationFrame(() => { $('#h1hl')?.classList.add('on'); paint(); });

/* ---------- Calculadora de presupuestos sin firmar ---------- */
(() => {
  const cn = $('#c-n'), ci = $('#c-i');
  if (!cn || !ci) return;
  let pct = 40;
  const setP = (el) => el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min)) * 100 + '%');
  const calc = () => {
    setP(cn); setP(ci);
    $('#c-n-o').textContent = cn.value;
    $('#c-i-o').textContent = fmt(ci.value) + ' €';
    const lost = cn.value * 12 * ci.value * (1 - pct / 100);
    $('#c-out').textContent = fmt(lost) + ' €';
    $('#c-rec').textContent = '+' + fmt(lost * 0.1) + ' €';
  };
  cn.addEventListener('input', calc);
  ci.addEventListener('input', calc);
  $$('#c-p button').forEach((b) => b.addEventListener('click', () => {
    pct = +b.dataset.p;
    $$('#c-p button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    calc();
  }));
  calc();
})();

/* ---------- Cupo: plazas, cuenta atrás y estados ---------- */
initCupo();

/* ---------- Carrusel de anuncios bajo el hero ---------- */
(() => {
  const reel = $('#reel');
  if (!reel) return;
  const box = reel.parentElement;
  reel.addEventListener('touchstart', () => box.classList.add('hold'), { passive: true });
  reel.addEventListener('touchend', () => box.classList.remove('hold'));
  if (!reduce) $$('video', reel).forEach((v) => { v.muted = true; v.play().catch(() => {}); });
})();

/* ---------- VSL: arranca solo sin sonido; un clic lo reinicia con audio ---------- */
(() => {
  const vsl = $('#vsl'), vv = $('#vsl-v'), vprog = $('#vsl-prog');
  if (!vsl || !vv) return;
  const vState = (s) => { vsl.classList.remove('muted', 'noauto'); if (s) vsl.classList.add(s); };
  if (reduce) vState('noauto');
  else { vv.muted = true; vState('muted'); const pr = vv.play(); if (pr) pr.catch(() => vState('noauto')); }
  const vUnmute = () => {
    vv.pause(); vv.muted = false; vv.loop = false;
    try { vv.currentTime = 0; } catch (e) { /* aún sin metadatos */ }
    vState(null);
    vv.play().catch(() => vState('noauto'));
  };
  const vToggle = () => {
    if (vsl.classList.contains('muted') || vsl.classList.contains('noauto')) return vUnmute();
    if (vv.paused) vv.play().catch(() => {}); else vv.pause();
  };
  $('#vsl-unmute').addEventListener('click', (e) => { e.stopPropagation(); vUnmute(); });
  $('#vsl-play').addEventListener('click', (e) => { e.stopPropagation(); vToggle(); });
  vsl.addEventListener('click', vToggle);
  vv.addEventListener('play', () => vsl.classList.add('playing'));
  vv.addEventListener('pause', () => vsl.classList.remove('playing'));
  vv.addEventListener('timeupdate', () => { vprog.style.width = (vv.duration ? (vv.currentTime / vv.duration) * 100 : 0) + '%'; });
  vv.addEventListener('ended', () => { vsl.classList.remove('playing'); vprog.style.width = '0'; vv.currentTime = 0; });
})();

/* ---------- Pop-up del ebook ---------- */
(() => {
  const pop = $('#pop');
  if (!pop) return;
  let popShown = false;
  const openPop = () => { popShown = true; pop.hidden = false; requestAnimationFrame(() => pop.classList.add('show')); };
  const closePop = () => { pop.classList.remove('show'); setTimeout(() => { pop.hidden = true; }, 300); };
  $('#pop-x').addEventListener('click', closePop);
  $('#pop-skip').addEventListener('click', closePop);
  pop.addEventListener('click', (e) => { if (e.target === pop) closePop(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) closePop(); });
  $$('[data-pop]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openPop(); }));

  const form = $('#pop-form'), done = $('#pop-done');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = form.elements.email, btn = form.querySelector('button');
    if (!input.checkValidity()) { input.reportValidity(); return; }
    btn.disabled = true;
    try {
      // PENDIENTE: confirmar en n8n que el flujo acepta este payload (solo correo, origen «ebook-home»).
      await ApiService.sendData({ email: input.value.trim(), from: 'ebook-home' });
      pop.classList.add('sent');
      setTimeout(closePop, 1800);
    } catch (err) {
      done.textContent = 'No se ha podido enviar. Escríbeme por WhatsApp y te lo mando.';
      pop.classList.add('sent');
    } finally {
      btn.disabled = false;
    }
  });

  if (!location.search.includes('nopop')) {
    setTimeout(() => { if (!popShown) openPop(); }, 7000);
    document.addEventListener('mouseout', (e) => { if (!popShown && !e.relatedTarget && e.clientY < 8) openPop(); });
  }
})();
