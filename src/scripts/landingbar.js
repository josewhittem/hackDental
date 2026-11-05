// Barra de ejemplos de la landing (componente de Jose, 5 nov 2026) pasada a módulo:
// cuatro landings por tratamiento en una pantalla con transición, títulos que entran deslizados,
// segmentos de progreso y, si hay WebGL, el pedestal con los modelos 3D (three.js r128).
import * as THREE from 'three';

const THEMES = [
  { name: 'Implantes', pitch: 'Resuelve dudas de precio y dolor antes de la primera cita.', bg: '#e2f3eb', ink: '#0c2a21', muted: '#4b6259', acc: '#008060', acc2: '#a8ebc8', dark: 0 },
  { name: 'Ortodoncia', pitch: 'Vende alineadores invisibles con pago a meses.', bg: '#edf6f1', ink: '#0c2a21', muted: '#4b6259', acc: '#00a37a', acc2: '#c9eadb', dark: 0 },
  { name: 'Blanqueamiento', pitch: 'Convierte una búsqueda rápida en una cita para hoy.', bg: '#c9eadb', ink: '#0c2a21', muted: '#3f5a50', acc: '#00543f', acc2: '#ffffff', dark: 0 },
  { name: 'El doctor', pitch: 'Tu cara y tu trayectoria generan la confianza que cierra la cita.', bg: '#0a3a2d', ink: '#ffffff', muted: '#b4d3c6', acc: '#17c394', acc2: '#a8ebc8', dark: 1 },
];
const N = THEMES.length;
const E = 'cubic-bezier(.22,.8,.2,1)';

export function initLandingBar(root) {
  if (!root) return null;
  const DUR = +root.dataset.duration || 5000;
  const AUTO = root.dataset.autoplay !== 'false' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => root.querySelector('#' + id);
  const segWrap = $('lb-segs'), screen = $('lb-screen'), scan = $('lb-scan'), stage = $('lb-r'), card = $('lb-card'), pEl = $('lb-p');

  /* ---------- pantalla: una landing por tema, con barrido al cambiar ---------- */
  const SL = [...screen.querySelectorAll('.lb-slide')];
  let lastSlide = null;
  function showSlide(n, first) {
    const s = SL[n]; if (!s) return;
    SL.forEach((x) => { if (x !== s && x !== lastSlide) x.classList.remove('prev', 'cur'); });
    if (lastSlide && lastSlide !== s) { lastSlide.classList.remove('cur'); lastSlide.classList.add('prev'); }
    s.classList.remove('prev', 'cur');
    if (first) { s.style.transition = 'none'; s.classList.add('cur'); void s.offsetWidth; s.style.transition = ''; lastSlide = s; return; }
    void s.offsetWidth; s.classList.add('cur');
    scan.style.transition = 'none'; scan.style.top = '100%'; scan.style.opacity = 1; void scan.offsetWidth;
    scan.style.transition = 'top 1s cubic-bezier(.65,0,.25,1),opacity .35s ease .85s'; scan.style.top = '0%'; scan.style.opacity = 0;
    const old = lastSlide; lastSlide = s;
    setTimeout(() => { if (old && old !== lastSlide) old.classList.remove('prev'); }, 1050);
  }

  /* ---------- segmentos ---------- */
  const SEG = THEMES.map((t, i) => {
    const b = document.createElement('button');
    b.className = 'lb-seg'; b.type = 'button'; b.setAttribute('aria-label', 'Ver landing ' + t.name);
    b.innerHTML = '<span class="lb-bar"><i></i></span><small>' + t.name + '</small>';
    b.onclick = () => go(i, 0, true);
    segWrap.appendChild(b);
    return b;
  });

  /* posición del haz y del centro 3D (también si no hay WebGL) */
  const place = () => {
    const fr = root.getBoundingClientRect(), cr = stage.getBoundingClientRect(), br = card.getBoundingClientRect();
    root.style.setProperty('--lb-x', cr.left + cr.width / 2 - fr.left + 'px');
    root.style.setProperty('--lb-seam', br.top - fr.top + 'px');
  };
  place();
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(root);

  /* ---------- títulos ---------- */
  const tA = $('lb-tA'), tB = $('lb-tB');
  let front = tA, back = tB;
  [tA, tB].forEach((t) => { t.style.opacity = 0; });
  function swapTitle(txt, dir) {
    const out = front, inn = back;
    out.classList.remove('u'); out.style.transition = `transform .45s ${E},opacity .35s ease,filter .45s ease`;
    out.style.transform = `translateX(${-dir * 40}px)`; out.style.opacity = 0; out.style.filter = 'blur(6px)';
    inn.style.transition = 'none'; inn.innerHTML = '<span></span>'; inn.firstChild.textContent = txt; inn.classList.remove('u');
    inn.style.transform = `translateX(${dir * 40}px)`; inn.style.opacity = 0; inn.style.filter = 'blur(6px)'; void inn.offsetWidth;
    inn.style.transition = `transform .7s ${E} .12s,opacity .55s ease .12s,filter .6s ease .12s`;
    inn.style.transform = 'translateX(0)'; inn.style.opacity = 1; inn.style.filter = 'blur(0)'; inn.classList.add('u');
    front = inn; back = out;
  }
  function setPitch(T, first) {
    if (first) { pEl.textContent = T.pitch; return; }
    pEl.classList.add('out');
    setTimeout(() => { pEl.textContent = T.pitch; pEl.classList.remove('out'); }, 300);
  }

  /* ---------- estado ---------- */
  const col = (h) => new THREE.Color(h);
  const tgt = { bg: col(THEMES[0].bg), acc: col(THEMES[0].acc), ped: col(0xffffff), pedTop: col(0xe6efe9), dark: 0 };
  let cur = -1, t0 = performance.now(), paused = false;
  function go(i, dir, user) {
    const n = ((i % N) + N) % N;
    if (n === cur) { t0 = performance.now(); return; }
    const first = cur < 0;
    dir = dir || (cur < 0 ? 1 : (n - cur + N) % N <= N / 2 ? 1 : -1);
    cur = n; t0 = performance.now();
    const T = THEMES[cur];
    root.style.setProperty('--lb-bg', T.bg); root.style.setProperty('--lb-ink', T.ink); root.style.setProperty('--lb-muted', T.muted);
    root.style.setProperty('--lb-acc', T.acc); root.style.setProperty('--lb-acc2', T.acc2);
    swapTitle(T.name, dir); showSlide(cur, first); setPitch(T, first);
    SEG.forEach((s, k) => { s.classList.toggle('on', k === cur); s.querySelector('i').style.width = k < cur ? '100%' : '0%'; });
    tgt.bg.set(T.bg); tgt.acc.set(T.acc); tgt.ped.set(T.dark ? 0x12433a : 0xffffff); tgt.pedTop.set(T.dark ? 0x2a6a58 : 0xe6efe9); tgt.dark = T.dark;
    root.dispatchEvent(new CustomEvent('landingbar:change', { detail: { index: cur, name: T.name, user: !!user }, bubbles: true }));
  }

  /* arrastre con el dedo o el ratón */
  let dx = null;
  card.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; dx = e.clientX; });
  addEventListener('pointerup', (e) => {
    if (dx === null) return;
    const d = e.clientX - dx;
    if (Math.abs(d) > 40) go(cur + (d < 0 ? 1 : -1), d < 0 ? 1 : -1, true);
    dx = null;
  });

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) t0 = performance.now(); }).observe(root);

  /* escena 3D (opcional: sin WebGL la barra funciona igual, sin modelos) */
  let three = null;
  try { three = build3D(root, stage, tgt); } catch (err) { console.warn('Barra de ejemplos sin 3D:', err); }

  go(0, 1);

  (function loop(now) {
    requestAnimationFrame(loop);
    if (!visible) return;
    now = now || 0;
    const p = Math.min(1, (now - t0) / DUR);
    if (cur >= 0) SEG[cur].querySelector('i').style.width = (AUTO && !paused ? p * 100 : 100) + '%';
    if (AUTO && !paused && p >= 1) go(cur + 1, 1);
    if (three) three.tick(now, cur);
  })();

  return { go: (i) => go(i, 0, true), pause: () => { paused = true; }, play: () => { paused = false; t0 = performance.now(); }, get index() { return cur; } };
}

/* ====================================================================== escena */
function build3D(root, stage, tgt) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, root.clientWidth <= 640 ? 1.5 : 2));
  r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  stage.prepend(r.domElement);
  const W = () => r.domElement.clientWidth, H = () => r.domElement.clientHeight;

  const sc = new THREE.Scene(); sc.fog = new THREE.Fog(new THREE.Color(THEMES[0].bg), 11, 18.5);
  const cam = new THREE.PerspectiveCamera(28, 1.8, 0.1, 50);
  const es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: 0x6d7c8c, side: THREE.BackSide })));
  [[0, 6, 0, 8, 1, 8, 3], [6, 2, 2, 1, 5, 5, 2.4], [-6, 2, 2, 1, 5, 5, 1.6], [0, 1, -7, 6, 3, 1, 1], [0, -6, 0, 10, 1, 10, 0.5]].forEach(([x, y, z, a, b, c, k]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k) }));
    m.position.set(x, y, z); es.add(m);
  });
  sc.environment = new THREE.PMREMGenerator(r).fromScene(es, 0.04).texture;
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.55); sc.add(hemi);
  const key = new THREE.SpotLight(0xffffff, 2.6, 30, 0.42, 0.6); key.position.set(3, 9, 5); key.target.position.set(0, 0.4, 0); sc.add(key, key.target);
  const fillL = new THREE.DirectionalLight(0xffffff, 0.35); fillL.position.set(-4, 3, 5); sc.add(fillL);
  const rim = new THREE.PointLight(0x008060, 3, 8); rim.position.set(0, 1.4, -1.8); sc.add(rim);

  const M = (c, m, ro) => new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: ro });
  const ti = M(0xb7c0ca, 1, 0.2), tiD = M(0x86909c, 1, 0.3), en = M(0xf1e7d6, 0, 0.22);
  const wh = new THREE.MeshPhysicalMaterial({ color: 0xfafafa, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.05 });
  const V = (x, y) => new THREE.Vector2(x, y);
  function crownG(s) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.LatheGeometry([V(0, -0.05), V(0.45, -0.05), V(0.75, 0.2), V(0.98, 0.65), V(1.05, 1.05), V(1, 1.35), V(0.82, 1.5), V(0.5, 1.48), V(0.25, 1.55), V(0, 1.5)], 64), s);
    m.scale.z = 0.86; g.add(m);
    [[0.42, 0.42], [-0.42, 0.42], [0.42, -0.36], [-0.42, -0.36]].forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), s); c.scale.y = 0.55; c.position.set(x, 1.48, z); g.add(c); });
    return g;
  }
  function implant() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.LatheGeometry([V(0, -2.1), V(0.18, -2.08), V(0.42, -1.9), V(0.52, -1.4), V(0.58, 0), V(0.62, 0.25), V(0, 0.25)], 48), tiD));
    class Hx extends THREE.Curve { getPoint(t) { const a = t * Math.PI * 18, y = -1.85 + t * 1.85, q = 0.5 + 0.11 * Math.min(1, (y + 1.9) * 1.2); return new THREE.Vector3(Math.cos(a) * q, y, Math.sin(a) * q); } }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new Hx(), 400, 0.07, 8), ti));
    const a = new THREE.Mesh(new THREE.LatheGeometry([V(0, 0), V(0.6, 0), V(0.62, 0.12), V(0.5, 0.3), V(0.36, 1.05), V(0.3, 1.15), V(0, 1.15)], 48), ti); a.position.y = 0.25; g.add(a);
    const c = crownG(en); c.position.y = 1.15; g.add(c);
    g.scale.setScalar(0.6); g.position.y = 1.4; return g;
  }
  function tooth(s) { const g = crownG(s); const rt = new THREE.Mesh(new THREE.LatheGeometry([V(0, -2), V(0.25, -1.9), V(0.55, -1), V(0.72, 0), V(0, 0)], 32), s); rt.scale.z = 0.8; g.add(rt); return g; }
  function incisor(mat) {
    const t = new THREE.Group(); t.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.42), mat));
    const ed = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.42, 24, 1, false, 0, Math.PI), mat); ed.rotation.set(Math.PI / 2, 0, Math.PI / 2); ed.position.y = 0.55; t.add(ed);
    const ed2 = ed.clone(); ed2.rotation.z = -Math.PI / 2; ed2.position.y = -0.55; t.add(ed2); return t;
  }
  function aligner() {
    const g = new THREE.Group(), n = 5;
    const sh = new THREE.MeshPhysicalMaterial({ color: 0xd6f7e6, transparent: true, opacity: 0.38, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false });
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) / 2) * 0.42, x = Math.sin(a) * 2.2, z = Math.cos(a) * 2.2 - 2.2;
      const t = incisor(en); t.position.set(x, 0, z); t.rotation.y = a; g.add(t);
      const s = incisor(sh); s.scale.set(1.1, 1.08, 1.25); s.position.set(x, 0.02, z); s.rotation.y = a; g.add(s);
    }
    g.position.set(0, 0.72, 0.7); g.scale.setScalar(0.62); return g;
  }
  function white() {
    const t = tooth(wh); t.scale.setScalar(0.6); t.position.y = 1.35;
    const sp = new THREE.Group(); sp.position.y = 0.65;
    const sh = new THREE.Shape();
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, q = i % 2 ? 0.07 : 0.28; if (i) sh.lineTo(Math.cos(a) * q, Math.sin(a) * q); else sh.moveTo(q, 0); }
    const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false });
    const sm = new THREE.MeshStandardMaterial({ color: 0xa8ebc8, emissive: 0x5fd3a8, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.25 });
    [[1.05, 2, 1], [-1.1, 1.5, 0.7], [0.8, 0.5, 0.55], [-0.6, 2.4, 0.5]].forEach(([x, y, s]) => { const m = new THREE.Mesh(sg, sm); m.position.set(x, y, 0.4); m.scale.setScalar(s); sp.add(m); });
    const w = new THREE.Group(); w.add(t, sp); w.userData.sp = sp; return w;
  }
  function doctor() {
    const g = new THREE.Group();
    const tex = new THREE.TextureLoader().load(root.dataset.doctorImg); tex.encoding = THREE.sRGBEncoding;
    const back = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.06, 0.12, 64), M(0xffffff, 0, 0.35)); back.rotation.x = Math.PI / 2; g.add(back);
    const ph = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); ph.position.z = 0.065; g.add(ph); g.userData.ph = ph;
    const rA = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.07, 16, 80, Math.PI), M(0x008060, 0.3, 0.25)); rA.rotation.z = Math.PI * 0.15; g.add(rA);
    const rB = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.07, 16, 80, Math.PI), M(0xa8ebc8, 0.3, 0.25)); rB.rotation.z = Math.PI * 1.15; g.add(rB);
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.beginPath();
    if (x.roundRect) x.roundRect(4, 4, 504, 120, 60); else x.rect(4, 4, 504, 120);
    x.fill();
    x.fillStyle = '#008060'; x.beginPath(); x.arc(68, 64, 30, 0, 7); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 8; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(54, 64); x.lineTo(64, 75); x.lineTo(83, 53); x.stroke();
    x.fillStyle = '#0b1b33'; x.font = '800 40px "Bricolage Grotesque",Onest,system-ui,sans-serif'; x.textBaseline = 'middle'; x.fillText('Especialista', 116, 66);
    const bt = new THREE.CanvasTexture(cv); bt.encoding = THREE.sRGBEncoding; bt.anisotropy = 8;
    const bd = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.375), new THREE.MeshBasicMaterial({ map: bt, transparent: true, toneMapped: false })); bd.position.set(0, -1.12, 0.2); g.add(bd); g.userData.bd = bd;
    g.position.y = 1.38; g.scale.setScalar(0.95); return g;
  }

  const items = [implant(), aligner(), white(), doctor()].map((m, i) => {
    const h = new THREE.Group(), sp = new THREE.Group(); sp.add(m); h.add(sp);
    h.userData = { spin: sp, m, sway: i === 1 || i === 3 }; sc.add(h); return h;
  });

  /* pedestal */
  const sv = document.createElement('canvas'); sv.width = sv.height = 128; const c2 = sv.getContext('2d');
  const gg = c2.createRadialGradient(64, 64, 0, 64, 64, 64); gg.addColorStop(0, 'rgba(0,0,0,.55)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c2.fillStyle = gg; c2.fillRect(0, 0, 128, 128);
  const ped = new THREE.Group();
  const pedM = M(0xffffff, 0.15, 0.3), pedTopM = M(0xe6efe9, 0.85, 0.14);
  ped.add(new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.75, 0.24, 64), pedM));
  const pt = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.06, 64), pedTopM); pt.position.y = 0.14; ped.add(pt);
  const ringM = new THREE.MeshStandardMaterial({ color: 0x008060, emissive: 0x008060, emissiveIntensity: 1, fog: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.57, 0.045, 12, 96), ringM); ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; ped.add(ring);
  const shd = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sv), transparent: true, depthWrite: false, fog: false })); shd.rotation.x = -Math.PI / 2; shd.position.y = 0.18; ped.add(shd);
  const beamM = new THREE.MeshBasicMaterial({ color: 0x008060, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false, fog: false });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.5, 4, 64, 1, true), beamM); beam.position.y = 2.15; ped.add(beam);
  const floorShd = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 2.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sv), transparent: true, opacity: 0.6, depthWrite: false, fog: false })); floorShd.rotation.x = -Math.PI / 2; floorShd.position.y = -0.13; ped.add(floorShd);
  ped.position.y = -1.15; sc.add(ped);

  let sx = 2.6, f = 0, darkK = 0;
  function fit() {
    const w = W(), h = H(); if (!w || !h) return;
    r.setSize(w, h, false); const as = w / h; cam.aspect = as;
    cam.fov = 34; cam.position.set(0, 1.1, 10.5); cam.lookAt(0, 1.15, 0); cam.updateProjectionMatrix();
    const half = Math.tan((cam.fov * Math.PI) / 360) * 10.5 * as; sx = half * 1.9;
  }
  const ro = new ResizeObserver(fit); ro.observe(stage); ro.observe(root); fit();

  return {
    tick(now, cur) {
      let d = cur - f; if (d > N / 2) d -= N; if (d < -N / 2) d += N; f += d * 0.07; f = (f + N) % N;
      sc.fog.color.lerp(tgt.bg, 0.06); ringM.color.lerp(tgt.acc, 0.06); ringM.emissive.copy(ringM.color); beamM.color.copy(ringM.color); rim.color.copy(ringM.color);
      pedM.color.lerp(tgt.ped, 0.06); pedTopM.color.lerp(tgt.pedTop, 0.06); darkK += (tgt.dark - darkK) * 0.06;
      hemi.intensity = 0.22 + 0.1 * darkK; beamM.opacity = 0.08 + 0.08 * darkK + 0.03 * Math.sin(now / 500); ringM.emissiveIntensity = 0.7 + 0.8 * darkK + 0.3 * Math.sin(now / 300);
      items.forEach((h, i) => {
        let o = i - f; if (o > N / 2) o -= N; if (o < -N / 2) o += N; const a = Math.abs(o);
        h.position.set(o * sx, -0.95 + Math.sin(now / 600 + i) * 0.06 * (a < 0.5 ? 1 : 0.4), -a * 2.8); h.rotation.y = -o * 0.42; h.rotation.z = o * 0.05;
        h.scale.setScalar(1.24 - Math.min(a, 1.5) * 0.4);
        const sp = h.userData.spin; if (h.userData.sway) sp.rotation.y = Math.sin(now / 1400) * 0.4; else sp.rotation.y += a < 0.5 ? 0.011 : 0.004;
        const k = h.userData.m.userData.sp;
        if (k) k.children.forEach((c, j) => { c.rotation.z = now / 400 + j; c.scale.setScalar((0.6 + 0.4 * Math.sin(now / 250 + j)) * [1, 0.7, 0.55, 0.5][j] * (1 - Math.min(a, 1) * 0.6)); });
        if (i === 3) { const v = 1 - Math.min(a, 1) * 0.45, fc = sc.fog.color; [h.userData.m.userData.ph, h.userData.m.userData.bd].forEach((mm) => mm.material.color.setRGB(1, 1, 1).lerp(fc, 1 - v)); }
      });
      r.render(sc, cam);
    },
  };
}
