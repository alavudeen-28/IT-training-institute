// Lightweight multi-color cursor sparkle trail (teal + amber).
// Place this file at: assets/js/cursor-sparkle.js
// Include it near the end of your page, before index.js:
// <script src="assets/js/cursor-sparkle.js"></script>
//
// Changes vs previous version:
// - Uses multiple color sources (reads --color-primary and --color-accent by default).
// - Particles pick colors randomly from palette or as blended mixes for a richer look.
// - Exposes API to set colors at runtime: CursorSparkle.setColors([...hexStrings])
// - Keeps performance caps and the same canvas-based approach.

(() => {
  // Config (tweak if you want)
  const PARTICLES_PER_MOVE = 2;   // how many particles to spawn per mouse move event
  const PARTICLE_LIFE = 30;       // base life in frames
  const PARTICLE_SPREAD = 1.2;    // angular spread multiplier
  const DAMPING = 0.96;           // velocity damping
  const MAX_PARTICLES = 1200;     // safety cap
  const MIXED_COLOR_PROB = 0.4;   // probability to create a blended color between two palette colors

  // Create canvas overlay
  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-sparkle-canvas';
  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  let dpr = Math.max(1, window.devicePixelRatio || 1);

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing to CSS pixels
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // read palette colors from CSS vars; fallback to default teal + amber
  function getCssPalette() {
    const style = getComputedStyle(document.documentElement);
    const primary = (style.getPropertyValue('--color-primary') || '').trim() || '#0d9488';
    // const accent  = (style.getPropertyValue('--color-accent')  || '').trim() || '#0d3c0aff';
    const accent = (style.getPropertyValue('--color-primary') || '').trim() || '#0d9488';

    return [primary, accent];
  }

  // hex to rgb helper (accepts #RRGGBB or #RGB)
  function hexToRgb(hex) {
    if (!hex) return { r: 0, g: 0, b: 0 };
    hex = hex.replace(/\s/g, '');
    if (hex[0] === '#') hex = hex.slice(1);
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  // blend two rgb colors by t (0..1)
  function blendRgb(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t)
    };
  }

  // build palette as rgb objects
  let paletteHex = getCssPalette();
  let paletteRgb = paletteHex.map(hexToRgb);

  // Public API to set new palette at runtime (accepts array of hex strings)
  function setPalette(hexArray) {
    if (!Array.isArray(hexArray) || hexArray.length === 0) return;
    paletteHex = hexArray.slice(0, 6);
    paletteRgb = paletteHex.map(hexToRgb);
  }

  // particle structure: { x, y, vx, vy, life, r, colorRgb }
  let particles = [];
  let prev = null;
  let isTouchActive = false;

  function pickColor() {
    // choose either a direct palette color or a blend between two palette colors
    if (paletteRgb.length === 0) return { r: 13, g: 148, b: 136 };
    if (paletteRgb.length === 1) return paletteRgb[0];
    if (Math.random() < MIXED_COLOR_PROB) {
      const i = Math.floor(Math.random() * paletteRgb.length);
      let j = Math.floor(Math.random() * paletteRgb.length);
      if (j === i) j = (j + 1) % paletteRgb.length;
      const t = Math.random();
      return blendRgb(paletteRgb[i], paletteRgb[j], t);
    } else {
      const k = Math.floor(Math.random() * paletteRgb.length);
      return paletteRgb[k];
    }
  }

  function spawnParticles(x, y, dx, dy) {
    const speedBase = Math.min(6, Math.hypot(dx, dy) * 0.35 + 0.8);
    for (let i = 0; i < PARTICLES_PER_MOVE; i++) {
      if (particles.length > MAX_PARTICLES) particles.shift(); // cap
      const ang = Math.atan2(dy, dx) + (Math.random() - 0.5) * PARTICLE_SPREAD;
      const speed = speedBase * (0.3 + Math.random() * 1.2);
      const vx = Math.cos(ang) * speed + (Math.random() - 0.5) * 0.6;
      const vy = Math.sin(ang) * speed + (Math.random() - 0.5) * 0.6;
      const colorRgb = pickColor();
      particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx,
        vy,
        life: PARTICLE_LIFE + Math.floor(Math.random() * 30),
        r: 1 + Math.random() * 3,
        colorRgb
      });
    }
  }

  // mouse and touch handlers
  function onMove(clientX, clientY) {
    if (!prev) prev = { x: clientX, y: clientY };
    const dx = clientX - prev.x;
    const dy = clientY - prev.y;
    const dist = Math.hypot(dx, dy);

    // spawn more when moving faster
    if (dist > 1) {
      spawnParticles(clientX, clientY, dx, dy);
    }

    prev.x = clientX;
    prev.y = clientY;
  }

  document.addEventListener('mousemove', (e) => {
    isTouchActive = false;
    onMove(e.clientX, e.clientY);
  }, { passive: true });

  document.addEventListener('touchstart', (e) => {
    isTouchActive = true;
    const t = e.touches[0];
    prev = { x: t.clientX, y: t.clientY };
    onMove(t.clientX, t.clientY);
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    onMove(t.clientX, t.clientY);
  }, { passive: true });

  document.addEventListener('mouseleave', () => { prev = null; }, { passive: true });

  // animation loop
  function draw() {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= DAMPING;
      p.vy *= DAMPING;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      const lifeRatio = Math.max(0, p.life / (PARTICLE_LIFE + 30));
      const alpha = Math.pow(lifeRatio, 1.4); // smoother fade
      const size = p.r * (1.0 + (1 - lifeRatio) * 0.8);

      // draw radial gradient circle for sparkle using particle color
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4);
      const r = p.colorRgb.r, g = p.colorRgb.g, b = p.colorRgb.b;
      grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      grad.addColorStop(0.25, `rgba(${r},${g},${b},${alpha * 0.6})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
      ctx.fill();

      // small bright core
      ctx.beginPath();
      ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, alpha * 1.6)})`;
      ctx.arc(p.x, p.y, Math.max(0.6, size * 0.5), 0, Math.PI * 2);
      ctx.fill();

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);

  // Optional: toggle on/off when typing to avoid distraction
  let typing = false;
  document.addEventListener('focusin', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
      typing = true;
    }
  }, true);
  document.addEventListener('focusout', () => { typing = false; }, true);

  // Public API (optional) to enable/disable or set color palette
  window.CursorSparkle = {
    enable() { canvas.style.display = 'block'; },
    disable() { canvas.style.display = 'none'; },
    setColor(hex) {
      // legacy single-color setter (keeps palette with one color)
      setPalette([hex]);
    },
    setColors(hexArray) {
      setPalette(hexArray);
    },
    getColors() {
      return paletteHex.slice();
    }
  };
})();