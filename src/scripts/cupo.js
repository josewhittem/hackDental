// Cupo del grupo: lee la configuración de #site (ver src/data/site.ts) y pinta plazas, cuenta atrás y estados.
// Estados: abierto (más de 3 plazas libres), «quedan pocas» (3 o menos) y «completo» (0 libres o plazo vencido).
export function initCupo() {
  const site = document.getElementById('site');
  if (!site) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CAP = +site.dataset.cap || 10;
  const taken = Math.min(CAP, Math.max(0, +site.dataset.taken || 0));
  const DEADLINE = new Date(site.dataset.deadline);
  const pad = (n) => String(n).padStart(2, '0');

  const left = Math.max(0, CAP - taken);
  const expired = !(DEADLINE > Date.now());
  const full = left <= 0 || expired;
  const urg = !full && left <= 3;

  /* Reloj corto: «Xd Yh MMm» (franja superior y botones de plazas) */
  const clockTick = () => {
    let t = Math.max(0, Math.floor((DEADLINE - Date.now()) / 1000));
    const d = Math.floor(t / 86400);
    t %= 86400;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const txt = (d > 0 ? d + 'd ' : '') + h + 'h ' + pad(m) + 'm';
    $$('#hd-clock, [data-pz-clock]').forEach((el) => { el.textContent = txt; });
  };
  clockTick();
  setInterval(clockTick, 30000);

  /* Cuenta atrás con casillas (días : horas : min : seg) */
  $$('[data-cd]').forEach((c) => {
    c.innerHTML = ['días', 'horas', 'min', 'seg']
      .map((l, i) => `${i ? '<span class="sep">:</span>' : ''}<span class="u"><span class="d">00</span><span class="l">${l}</span></span>`)
      .join('');
  });
  const tickCd = () => {
    const diff = Math.max(0, DEADLINE - Date.now());
    const closed = full || diff <= 0;
    const v = closed
      ? ['00', '00', '00', '00']
      : [pad(Math.floor(diff / 864e5)), pad(Math.floor(diff / 36e5) % 24), pad(Math.floor(diff / 6e4) % 60), pad(Math.floor(diff / 1e3) % 60)];
    $$('[data-cd]').forEach((c) => {
      c.classList.toggle('closed', closed);
      $$('.d', c).forEach((el, i) => { if (el.textContent !== v[i]) el.textContent = v[i]; });
    });
  };
  tickCd();
  if (!reduce) setInterval(tickCd, 1000);

  /* Textos y estados */
  $$('[data-avail-short]').forEach((el) => {
    el.textContent = full ? 'Cupo completo' : urg ? `Quedan ${left} plazas` : `${left} plazas libres`;
  });
  $$('[data-open]').forEach((el) => {
    const t = full ? el.dataset.full : urg && el.dataset.urg != null ? el.dataset.urg : el.dataset.open;
    if (t != null) el.textContent = t.replace('{n}', left);
  });
  $$('[data-pz-left]').forEach((el) => {
    el.textContent = full ? 'Cupo completo · lista de espera' : `Quedan ${left} de ${CAP}`;
  });
  $$('.pz-seats').forEach((m) => {
    m.innerHTML = Array.from({ length: CAP }, (_, i) => '<i' + (i < taken ? '' : ' class="free"') + '></i>').join('');
  });
  const dot = $('#hdr-dot');
  if (dot) { dot.classList.toggle('amb', full); dot.classList.toggle('urg', urg); }
  site.classList.toggle('is-full', full);
  site.classList.toggle('is-urg', urg);
}
