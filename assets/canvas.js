/* ===========================================================================
   KHASLANA — the drawn things
   The sky, the Coreflame, and the constellation of ground you've claimed.
   =========================================================================== */

/* Motion is a three-way setting, not a boolean — see the MOTION block in
   app.css for why. Read live from the root element so changing it in Setup
   takes effect without a reload.

   still   nothing loops; one paint.
   subtle  the loops run, at a third of the amplitude and 8fps rather than
           60. The expensive part of every one of these is the paint, so
           gating the paint is where the cost actually goes.
   full    every frame. */
const MOTION = () => document.documentElement.dataset.motion || 'full';
const STILL  = () => MOTION() === 'still';
const AMP    = () => (MOTION() === 'subtle' ? 0.34 : 1);
const FRAME_GAP = () => (MOTION() === 'subtle' ? 125 : 0);

/* One rAF loop, throttled to the tier. Returns a stop handle. */
function paced(frame) {
  let raf = null, last = -1e9;
  function loop(t) {
    if (document.hidden) { raf = null; return; }
    if (t - last >= FRAME_GAP()) { frame(t); last = t; }
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  return () => { if (raf) cancelAnimationFrame(raf); raf = null; };
}

/* Seeded RNG so every star and every node lands in the same place each load. */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}
const seedOf = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

/* B–V colour index → an actual star colour. Blue-white through amber. */
function bvColor(bv) {
  const t = Math.max(0, Math.min(1, (bv + 0.35) / 1.95));
  const r = Math.round(168 + t * 87);
  const g = Math.round(200 + t * 4  - t * t * 40);
  const b = Math.round(255 - t * 96);
  return [r, g, b];
}

/* ═══════════════════════════════════════════════════════════════════════
   THE SKY — real stars, stereographic, drifting the way the sky drifts
   ═══════════════════════════════════════════════════════════════════════ */

function initSky(canvas) {
  const STARS = window.KHASLANA_SKY || [];
  if (!STARS.length) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let W = 0, H = 0, DPR = 1;

  /* Pre-compute what never changes. */
  const prepped = STARS.map(([ra, dec, mag, bv]) => {
    const raR = ra * Math.PI / 180, decR = dec * Math.PI / 180;
    const [r, g, b] = bvColor(bv);
    return {
      sinDec: Math.sin(decR), cosDec: Math.cos(decR), ra: raR,
      /* magnitude → size and brightness, kept deliberately faint */
      size: Math.max(0.35, (5.6 - mag) * 0.34),
      alpha: Math.max(0.05, Math.min(0.46, (5.6 - mag) * 0.072)),
      col: `${r},${g},${b}`,
      phase: Math.random() * Math.PI * 2,
      twinkle: 0.55 + Math.random() * 0.9,
    };
  });

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* Centre of the projection, drifting westward like a real night. */
  const DEC0 = 22 * Math.PI / 180;
  const sinD0 = Math.sin(DEC0), cosD0 = Math.cos(DEC0);

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const ra0 = (t / 260000) % (Math.PI * 2);   // one full turn in ~4.5 h

    /* Sub-linear scale: a bigger window widens the field of view instead of
       magnifying the same patch, so a wide screen shows MORE stars rather
       than the same few spread thin. Density and brightness lift with it. */
    const big = Math.max(W, H);
    const scale = 380 + big * 0.3;
    const lift = Math.min(1.7, Math.max(1, big / 900));

    const cx = W * 0.5, cy = H * 0.44;

    for (const s of prepped) {
      const dRa = s.ra - ra0;
      const cosDra = Math.cos(dRa);
      const cosc = sinD0 * s.sinDec + cosD0 * s.cosDec * cosDra;
      if (cosc <= 0.06) continue;                // behind us

      const k = 1 / (1 + cosc);
      const x = cx + scale * k * s.cosDec * Math.sin(dRa) * 2;
      const y = cy - scale * k * (cosD0 * s.sinDec - sinD0 * s.cosDec * cosDra) * 2;
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;

      const amp = 0.18 * AMP();
      const tw = STILL() ? 1 : (1 - amp) + amp * Math.sin(t / 1400 * s.twinkle + s.phase);
      const r = s.size * lift;
      ctx.globalAlpha = Math.min(0.62, s.alpha * tw * lift);
      ctx.fillStyle = `rgb(${s.col})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.2832);
      ctx.fill();

      /* the few genuinely bright ones get a bloom */
      if (r > 1.5) {
        ctx.globalAlpha = s.alpha * tw * 0.18;
        ctx.beginPath();
        ctx.arc(x, y, r * 4.5, 0, 6.2832);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* Pausing while hidden is deliberate — a black canvas on return is this,
     not a failure. (Learned the hard way in "How do I tell you".) */
  let stop = null;

  /* Still mode has no loop, so the single draw has to land after layout —
     measuring a canvas that is still 0×0 leaves an empty sky that never
     gets redrawn. Draw once now and once more on the next frame. */
  function paintOnce() {
    resize();
    if (W > 0 && H > 0) draw(performance.now());
  }

  function start() {
    if (stop) { stop(); stop = null; }
    if (STILL()) { paintOnce(); requestAnimationFrame(paintOnce); }
    else if (!document.hidden) stop = paced(draw);
  }

  resize();
  start();
  SKY_RESTART = start;                     // Setup calls this when the tier changes

  window.addEventListener('resize', () => { resize(); if (STILL()) paintOnce(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (stop) { stop(); stop = null; } }
    else start();
  });
}
let SKY_RESTART = null;

/* ═══════════════════════════════════════════════════════════════════════
   THE COREFLAME — burns higher the longer the streak holds
   ═══════════════════════════════════════════════════════════════════════ */

/* The streak mark changes with the aspect: Khaslana keeps a flame, the
   Wanderer turns a wind, Alatus opens a Qingxin. Same growth curve. */
function drawMark(canvas, days, kind) {
  if (kind === 'wind')   return drawWind(canvas, days);
  if (kind === 'flower') return drawFlower(canvas, days);
  if (kind === 'sigil')  return drawSigil(canvas, days);
  return drawFlame(canvas, days);
}

/* ── Khaslana's Coreflame, cut rather than lit ──────────────────────────
   The same inked hand as the rail tabs: a rhombus disc with rays that
   lengthen as the streak holds, and the diagonals that only appear once
   it is genuinely established. The path comes from `coreflameSigil` in
   emblem.js so the mark and the tabs cannot drift apart — Path2D takes
   SVG path data directly, which is the whole reason to share it. */
function drawSigil(canvas, days) {
  const { ctx, W, H } = markCanvas(canvas);
  const vigour = vigourOf(days);
  let stop = null;

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    if (vigour === 0) return drawCold(ctx, W, H, 'rgba(244,239,230,0.4)');

    const breath = STILL() ? 0 : Math.sin(t / 1400) * 0.045 * AMP();
    const S = 32, k = (W / S) * (0.86 + vigour * 0.12 + breath);
    const cx = W / 2, cy = H / 2 + 1;

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15 * k * 1.6);
    glow.addColorStop(0, `rgba(255,157,77,${0.28 * vigour})`);
    glow.addColorStop(1, 'rgba(255,157,77,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    ctx.translate(-S / 2, -S / 2);

    const grad = ctx.createLinearGradient(0, S, 0, 0);
    grad.addColorStop(0,    '#c8501f');
    grad.addColorStop(0.45, '#f2803c');
    grad.addColorStop(0.85, '#ff9d4d');
    grad.addColorStop(1,    '#f2dcb0');
    ctx.fillStyle = grad;
    ctx.fill(new Path2D(coreflameSigil(vigour)));
    ctx.restore();
  }

  if (STILL() || vigour === 0) frame(0); else stop = paced(frame);
}

/* Shared: fast at first, then settling, so day three feels like progress. */
const vigourOf = (days) => days <= 0 ? 0 : Math.min(1, 0.34 + Math.log1p(days) / 3.6);

function markCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const W = 34, H = 46;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  return { ctx, W, H };
}

/* Unlit is the same everywhere: the thing is still there, just cold. */
function drawCold(ctx, W, H, stroke) {
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(W / 2, H - 8, 4.5, 0, 6.2832); ctx.stroke();
  ctx.globalAlpha = 1;
}

/* ── The Wanderer: three blades turning out of a still centre ── */
function drawWind(canvas, days) {
  const { ctx, W, H } = markCanvas(canvas);
  const vigour = vigourOf(days);
  let stop = null;

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    if (vigour === 0) return drawCold(ctx, W, H, 'rgba(244,239,230,0.4)');

    const cx = W / 2, cy = H / 2 + 2;
    const spin = STILL() ? 0 : (t / 2600) * AMP();
    const r = 6 + vigour * 8;

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
    glow.addColorStop(0, `rgba(143,211,232,${0.26 * vigour})`);
    glow.addColorStop(1, 'rgba(143,211,232,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = spin + (i / 3) * 6.2832;
      ctx.strokeStyle = i === 0 ? '#cfe6f0' : '#8fd3e8';
      ctx.globalAlpha = 0.55 + vigour * 0.45;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, r, a - 1.4, a + 0.7);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#cfe6f0';
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, 6.2832); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (STILL() || vigour === 0) frame(0); else stop = paced(frame);
}

/* ── Alatus: a Qingxin that opens a petal at a time ── */
function drawFlower(canvas, days) {
  const { ctx, W, H } = markCanvas(canvas);
  const vigour = vigourOf(days);
  let stop = null;

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    if (vigour === 0) return drawCold(ctx, W, H, 'rgba(244,239,230,0.4)');

    const cx = W / 2, cy = H / 2 + 2;
    const sway = STILL() ? 0 : Math.sin(t / 1800) * 0.05 * AMP();
    const len = 6 + vigour * 9;

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, len * 2);
    glow.addColorStop(0, `rgba(126,201,164,${0.24 * vigour})`);
    glow.addColorStop(1, 'rgba(126,201,164,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    /* petals open as the watch holds: two at day one, all five by day ten */
    const open = Math.max(2, Math.round(2 + vigour * 3));
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * 6.2832 + sway;
      const lit = i < open;
      const L = lit ? len : len * 0.45;
      ctx.globalAlpha = lit ? 0.55 + vigour * 0.4 : 0.16;
      ctx.strokeStyle = '#c9e4d2';
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + Math.cos(a - 0.6) * L * 0.6, cy + Math.sin(a - 0.6) * L * 0.6,
                           cx + Math.cos(a) * L, cy + Math.sin(a) * L);
      ctx.quadraticCurveTo(cx + Math.cos(a + 0.6) * L * 0.6, cy + Math.sin(a + 0.6) * L * 0.6, cx, cy);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#7ec9a4';
    ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, 6.2832); ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (STILL() || vigour === 0) frame(0); else stop = paced(frame);
}

function drawFlame(canvas, days) {
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const W = 34, H = 46;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  /* Grows fast at first, then settles — so day 3 feels like progress. */
  const vigour = days <= 0 ? 0 : Math.min(1, 0.34 + Math.log1p(days) / 3.6);

  let raf = null;
  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    if (vigour === 0) {
      /* Unlit: the ember is still there, just cold. */
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = 'rgba(244,239,230,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(W / 2, H - 8, 4.5, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }

    const flick = STILL() ? 0 : (Math.sin(t / 260) * 0.5 + Math.sin(t / 97) * 0.28) * AMP();
    const h = (13 + vigour * 22) + flick * 1.7;      // flame height
    const w = (5 + vigour * 5.5) + flick * 0.55;     // flame width
    const baseY = H - 6;
    const tipY = baseY - h;

    /* glow */
    const glow = ctx.createRadialGradient(W / 2, baseY - h * 0.42, 0, W / 2, baseY - h * 0.42, h * 0.95);
    glow.addColorStop(0, `rgba(255,157,77,${0.3 * vigour})`);
    glow.addColorStop(1, 'rgba(255,157,77,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    /* body */
    const grad = ctx.createLinearGradient(0, baseY, 0, tipY);
    grad.addColorStop(0,    '#c8501f');
    grad.addColorStop(0.42, '#f2803c');
    grad.addColorStop(0.82, '#ff9d4d');
    grad.addColorStop(1,    '#f2dcb0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(W / 2, tipY);
    ctx.bezierCurveTo(W / 2 + w, tipY + h * 0.42, W / 2 + w * 0.92, baseY - h * 0.1, W / 2, baseY);
    ctx.bezierCurveTo(W / 2 - w * 0.92, baseY - h * 0.1, W / 2 - w, tipY + h * 0.42, W / 2, tipY);
    ctx.fill();

    /* inner core */
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#ffe9c4';
    ctx.beginPath();
    ctx.moveTo(W / 2, tipY + h * 0.34);
    ctx.bezierCurveTo(W / 2 + w * 0.42, tipY + h * 0.66, W / 2 + w * 0.3, baseY - 3, W / 2, baseY - 1.5);
    ctx.bezierCurveTo(W / 2 - w * 0.3, baseY - 3, W / 2 - w * 0.42, tipY + h * 0.66, W / 2, tipY + h * 0.34);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (STILL() || vigour === 0) frame(0); else raf = paced(frame);
}

/* ═══════════════════════════════════════════════════════════════════════
   THE CONSTELLATION — one star per chapter; claimed ones light and join
   ═══════════════════════════════════════════════════════════════════════ */

function drawConstellation(canvas, nodes, opts = {}) {
  const H = opts.height || 190;
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.clientWidth || 300;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (!nodes.length) return;

  /* Dart-throwing with a minimum distance. Deliberately NOT Lloyd relaxation —
     that converges to a visible grid, which looks synthetic. */
  const pad = 16;
  const minD = Math.max(13, Math.sqrt((W - pad * 2) * (H - pad * 2) / nodes.length) * 0.62);
  const placed = [];
  for (const n of nodes) {
    const rand = rng(seedOf(n.id));
    let best = null, bestScore = -1;
    for (let a = 0; a < 40; a++) {
      const x = pad + rand() * (W - pad * 2);
      const y = pad + rand() * (H - pad * 2);
      let near = Infinity;
      for (const p of placed) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < near) near = d;
      }
      if (near > bestScore) { bestScore = near; best = { x, y }; }
      if (near > minD) break;
    }
    placed.push({ ...best, ...n });
  }

  /* Join the claimed ones by a nearest-neighbour walk — a figure that grows. */
  const lit = placed.filter(p => p.state === 'dominado');
  if (lit.length > 1) {
    const path = [lit[0]];
    const rest = lit.slice(1);
    while (rest.length) {
      const last = path[path.length - 1];
      let bi = 0, bd = Infinity;
      rest.forEach((r, i) => {
        const d = Math.hypot(r.x - last.x, r.y - last.y);
        if (d < bd) { bd = d; bi = i; }
      });
      path.push(rest.splice(bi, 1)[0]);
    }
    ctx.lineWidth = 0.8;
    for (let i = 1; i < path.length; i++) {
      const g = ctx.createLinearGradient(path[i-1].x, path[i-1].y, path[i].x, path[i].y);
      g.addColorStop(0, hexA(path[i-1].color, 0.42));
      g.addColorStop(1, hexA(path[i].color, 0.42));
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(path[i-1].x, path[i-1].y);
      ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
    }
  }

  for (const p of placed) {
    const claimed = p.state === 'dominado';
    const open = p.state === 'curso';
    const r = claimed ? 2.6 : open ? 2 : 1.3;

    if (claimed) {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 11);
      g.addColorStop(0, hexA(p.color, 0.5));
      g.addColorStop(1, hexA(p.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, 6.2832); ctx.fill();
    }

    ctx.fillStyle = claimed ? p.color : open ? hexA(p.color, 0.72) : 'rgba(244,239,230,0.2)';
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();

    if (open) {                      // a ring: engaged, not yet held
      ctx.strokeStyle = hexA(p.color, 0.4);
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(p.x, p.y, r + 3.2, 0, 6.2832); ctx.stroke();
    }
  }
}

/* #rrggbb → rgba() at a given alpha */
function hexA(hex, a) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
}
