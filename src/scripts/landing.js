// Comportamiento de la landing «Rediseño web gratis»: escritura en la hero, cabecera, barra fija, formulario y la barra 3D.
import { ApiService } from '../api/service.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Escritura en el resalte de la hero ---------- */
(() => {
  const el = $('#typ');
  if (!el || reduce) return;
  const words = el.dataset.words.split('|');
  let w = 0, i = words[0].length, del = false;
  const tick = () => {
    const word = words[w];
    if (!del) {
      i++; el.textContent = word.slice(0, i);
      if (i >= word.length) { del = true; return setTimeout(tick, 2200); }
      return setTimeout(tick, 70);
    }
    i--; el.textContent = word.slice(0, i);
    if (i <= 0) { del = false; w = (w + 1) % words.length; return setTimeout(tick, 350); }
    setTimeout(tick, 38);
  };
  setTimeout(() => { del = true; tick(); }, 2600);
})();

/* ---------- Scroll: cabecera, subrayados, flechas y barra fija ---------- */
const paint = () => {
  const vh = innerHeight, sy = scrollY;
  $$('.hl:not(#h1hl), .rv').forEach((h) => { if (h.getBoundingClientRect().top < vh * 0.85) h.classList.add('on'); });
  const hdr = $('#hdr');
  if (hdr) { hdr.classList.toggle('scrolled', sy > 10); hdr.classList.toggle('compact', sy > 80); }
  const stick = $('#stick'), pedir = $('#pedir'), cta = $('.hero5 .ctas');
  if (stick && pedir && cta) stick.classList.toggle('off', cta.getBoundingClientRect().bottom > 0 || pedir.getBoundingClientRect().top < vh - 40);
};
addEventListener('scroll', paint, { passive: true });
addEventListener('resize', paint);
requestAnimationFrame(() => { $('#h1hl')?.classList.add('on'); paint(); });

/* ---------- Formulario «déjanos tu web» ---------- */
(() => {
  const form = $('#pform'), box = $('#pedir-box');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const btn = form.querySelector('button');
    btn.disabled = true;
    try {
      // PENDIENTE: confirmar en n8n que el flujo acepta este payload (web + WhatsApp, origen «rediseno-web»).
      await ApiService.sendData({ website: form.elements.website.value.trim(), telefono: form.elements.telefono.value.trim(), from: 'rediseno-web' });
      box.classList.add('is-sent');
    } catch (err) {
      $('.sent', box).textContent = 'No se ha podido enviar. Escríbenos por WhatsApp.';
      box.classList.add('is-sent');
    } finally {
      btn.disabled = false;
    }
  });
})();

/* ---------- Barra de ejemplos con modelos 3D (three.js se carga aparte para no frenar el resto) ---------- */
const bar = document.getElementById('landing-bar');
if (bar) import('./landingbar.js').then((m) => m.initLandingBar(bar)).catch((err) => console.warn('Barra de ejemplos sin 3D:', err));
