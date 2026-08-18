/* ===========================================================================
   KHASLANA — constructed emblems

   Not illustrations. The UI language of Amphoreus and of Genshin's menus is
   built geometry: concentric rings, graduated tick marks, rhombi, arcs that
   stop short of closing. Precise reads as designed; sketched reads as cheap.

   Six emblems, one per room, each carrying a specific referent:

     Dawn       the long march toward a dawn nobody has seen yet
     Atlas      the armillary — a world held up and mapped
     Path       Nanook's Destruction — the broken ring, Irontomb waiting
     Chronicle  the two names: one construction and its mirror
     Embers     the Coreflame — a Titan's life kept in a vessel
     Setup      the Kabukimono's jingasa, seen from above; the mechanism

   Everything is generated from parameters. Nothing is eyeballed.
   =========================================================================== */

const TAU = Math.PI * 2;
const pol = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
const f = (n) => Math.round(n * 100) / 100;

function arc(cx, cy, r, a0, a1) {
  const [x0, y0] = pol(cx, cy, r, a0);
  const [x1, y1] = pol(cx, cy, r, a1);
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${f(x0)} ${f(y0)}A${f(r)} ${f(r)} 0 ${large} ${sweep} ${f(x1)} ${f(y1)}`;
}

function ticks(cx, cy, rIn, rOut, count, offset = 0, every = 1) {
  const out = [];
  for (let i = 0; i < count; i++) {
    if (i % every !== 0) continue;
    const a = offset + (i / count) * TAU;
    const [x0, y0] = pol(cx, cy, rIn, a);
    const [x1, y1] = pol(cx, cy, rOut, a);
    out.push(`M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`);
  }
  return out.join('');
}

const rhombus = (cx, cy, rx, ry) =>
  `M${f(cx)} ${f(cy - ry)}L${f(cx + rx)} ${f(cy)}L${f(cx)} ${f(cy + ry)}L${f(cx - rx)} ${f(cy)}Z`;

/* A flame with a sharp tip and a wide, rounded base. The earlier version
   curved symmetrically to a point at both ends, which is why it read as a
   lens or an eye rather than as fire. */
function flame(cx, base, h, w) {
  const tip = base - h;
  return `M${f(cx)} ${f(tip)}` +
    `C${f(cx + w * 0.86)} ${f(tip + h * 0.38)} ${f(cx + w)} ${f(base - h * 0.24)} ${f(cx + w * 0.4)} ${f(base - h * 0.05)}` +
    `C${f(cx + w * 0.17)} ${f(base + h * 0.04)} ${f(cx - w * 0.17)} ${f(base + h * 0.04)} ${f(cx - w * 0.4)} ${f(base - h * 0.05)}` +
    `C${f(cx - w)} ${f(base - h * 0.24)} ${f(cx - w * 0.86)} ${f(tip + h * 0.38)} ${f(cx)} ${f(tip)}Z`;
}


/* ── extra shapes, for the aspects that need them ── */

/* A petal: two arcs meeting at a point, pointing outward from (cx,cy). */
function petal(cx, cy, a, len, wid) {
  const [tx, ty] = pol(cx, cy, len, a);
  const [lx, ly] = pol(cx, cy, len * 0.52, a - wid);
  const [rx, ry] = pol(cx, cy, len * 0.52, a + wid);
  return `M${f(cx)} ${f(cy)}Q${f(lx)} ${f(ly)} ${f(tx)} ${f(ty)}Q${f(rx)} ${f(ry)} ${f(cx)} ${f(cy)}Z`;
}

/* A chain link — an ellipse drawn as two arcs, tilted. */
function link(cx, cy, rx, ry, rot) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * TAU;
    const x = rx * Math.cos(t), y = ry * Math.sin(t);
    pts.push(`${f(cx + x * Math.cos(rot) - y * Math.sin(rot))} ${f(cy + x * Math.sin(rot) + y * Math.cos(rot))}`);
  }
  return 'M' + pts.join('L') + 'Z';
}

/* A ridge of peaks — Liyue's karst, as a polyline. */
function peaks(x0, x1, base, hs) {
  const step = (x1 - x0) / hs.length;
  let d = `M${f(x0)} ${f(base)}`;
  hs.forEach((h, i) => {
    d += `L${f(x0 + step * (i + 0.5))} ${f(base - h)}L${f(x0 + step * (i + 1))} ${f(base)}`;
  });
  return d;
}

/* A wind blade: an arc that thins as it curls. */
function blade(cx, cy, r, a0, sweep) {
  return arc(cx, cy, r, a0, a0 + sweep);
}


/* A rounded lobe — a real petal, not a spike. Cubic on both flanks so the
   tip is soft and the waist is full. */
function lobe(cx, cy, a, len, wid) {
  const [tx, ty] = pol(cx, cy, len, a);
  const [l1x, l1y] = pol(cx, cy, len * 0.22, a - wid * 1.9);
  const [l2x, l2y] = pol(cx, cy, len * 0.86, a - wid);
  const [r2x, r2y] = pol(cx, cy, len * 0.86, a + wid);
  const [r1x, r1y] = pol(cx, cy, len * 0.22, a + wid * 1.9);
  return `M${f(cx)} ${f(cy)}C${f(l1x)} ${f(l1y)} ${f(l2x)} ${f(l2y)} ${f(tx)} ${f(ty)}` +
         `C${f(r2x)} ${f(r2y)} ${f(r1x)} ${f(r1y)} ${f(cx)} ${f(cy)}Z`;
}

/* One curl of the Anemo triskelion: a blade with a thick shoulder that
   tapers as it wraps the centre. */
function curl(cx, cy, a, R) {
  const a0 = a - 1.02, a1 = a + 0.58;
  const [ox0, oy0] = pol(cx, cy, R, a0);
  const [ox1, oy1] = pol(cx, cy, R, a1);
  const [tx, ty]   = pol(cx, cy, R * 0.26, a1 + 0.42);   // the tail, near the centre
  const [sx, sy]   = pol(cx, cy, R * 0.66, a0 + 0.2);    // the shoulder it swells from
  return `M${f(ox0)} ${f(oy0)}A${f(R)} ${f(R)} 0 0 1 ${f(ox1)} ${f(oy1)}` +
         `Q${f(tx)} ${f(ty)} ${f(sx)} ${f(sy)}Z`;
}

/* A chain link as a stadium: two straights closed by two half-turns. */
function stadium(cx, cy, halfLen, r, rot) {
  const ux = Math.cos(rot), uy = Math.sin(rot);
  const nx = -uy, ny = ux;
  const P = (u, n) => [cx + ux * u + nx * n, cy + uy * u + ny * n];
  const [ax, ay] = P(-halfLen, r), [bx, by] = P(halfLen, r);
  const [dx, dy] = P(halfLen, -r), [ex, ey] = P(-halfLen, -r);
  return `M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}` +
         `A${f(r)} ${f(r)} 0 0 1 ${f(dx)} ${f(dy)}L${f(ex)} ${f(ey)}` +
         `A${f(r)} ${f(r)} 0 0 1 ${f(ax)} ${f(ay)}Z`;
}

/* A proper crescent. The earlier version arced both edges the long way
   round (large-arc=1 on both), which is why it read as chueca — two
   arcs both bowing the "long" direction don't converge into a clean
   sliver, they fight each other into a lopsided lens. The fix mirrors
   the standard crescent-icon construction: pick two tip points on one
   circle, sweep the OUTER edge the long way round (large-arc=1) to
   trace the moon's back, then close with a SECOND, smaller circle
   through the same two points swept the short way (large-arc=0) —
   SVG solves that circle's centre on its own, so the only thing that
   changes the crescent's thickness is `inner`, relative to the chord
   between the tips. */
function crescentMoon(cx, cy, r, inner, a, span = 1.15) {
  const [x0, y0] = pol(cx, cy, r, a - span);
  const [x1, y1] = pol(cx, cy, r, a + span);
  const chord = Math.hypot(x1 - x0, y1 - y0);
  const rInner = Math.max(chord / 2 + 1, r * inner);
  return `M${f(x0)} ${f(y0)}A${f(r)} ${f(r)} 0 1 1 ${f(x1)} ${f(y1)}` +
         `A${f(rInner)} ${f(rInner)} 0 0 0 ${f(x0)} ${f(y0)}Z`;
}

/* A second graduated band, between the outer frame and whatever the
   centre holds. Every emblem here already carries real, specific detail
   — but the frame sits at r≈92 and most of what a room actually means
   lives at r≈40–70, which left a bare gap of naked canvas in between on
   most of them: ninety-plus degrees of nothing, regardless of how
   detailed the centre was. One more ring, its count and gap free per
   call so eighteen emblems don't all wear the identical second dial,
   fills that gap without redesigning each figure from scratch — the
   root the frame already established, carried one layer further in. */
function innerRing(c, r, count, gap = 0) {
  return [
    { d: arc(c, c, r, gap, TAU - gap - 0.001), w: 0.5, o: 0.3 },
    { d: ticks(c, c, r - 5, r, count, 0), w: 0.35, o: 0.24 },
    { d: ticks(c, c, r - 9, r, count, 0, 4), w: 0.65, o: 0.42 },
  ];
}

/* The frame every emblem shares, so the six read as one set. */
function frame(c, opts = {}) {
  const p = [];
  const gap = opts.gap ?? 0.14;
  const r = opts.r ?? 92;
  for (let i = 0; i < 4; i++) {
    p.push({ d: arc(c, c, r, (i / 4) * TAU + gap, ((i + 1) / 4) * TAU - gap), w: 0.7, o: 0.45, ring: 1 });
  }
  p.push({ d: ticks(c, c, r - 8, r, 72, 0), w: 0.4, o: 0.26, ring: 1 });
  p.push({ d: ticks(c, c, r - 14, r, 72, 0, 6), w: 0.7, o: 0.5, ring: 1 });
  return p;
}

/* Two groups on purpose: only the graduated ring turns. Rotating the whole
   figure made it unreadable — you saw arcs sliding past and nothing else.

   Every emblem here carries real detail — fifteen, twenty elements, each
   one meaning something specific (twelve rhombi for twelve Titans, a
   bracket around the bough that isn't there). None of that is the
   problem. The opacities were tuned for a 200px figure sitting at full
   size and full attention, and almost everywhere that figure is actually
   *seen* — a 44px medallion in a legend, a watermark behind other
   content at 0.3 container opacity on top of that — those same values
   compound down to single digits. A stroke at 0.3 opacity inside a
   watermark at 0.3 container opacity is 9% visible. The detail was never
   missing; it just never crossed the threshold of being seen. `boost`
   lifts the whole curve — faint hairlines gain the most, the two or
   three already-strong strokes per figure gain the least — so the same
   construction actually reads at the sizes it is actually shown at. */
/* A true zero stays zero — that's an intentional no-op placeholder
   somewhere in the set (a zero-length path with round linecaps would
   otherwise turn into a stray visible dot once boosted). */
const boost = (o) => o === 0 ? 0 : Math.min(1, o * 1.55 + 0.1);
const wrap = (p, S, k) => {
  const path = (x) => `<path d="${x.d}" stroke-opacity="${boost(x.o)}" stroke-width="${f((x.w === 0 ? 0 : Math.max(x.w, 0.55)) * k)}"/>`;
  const ring = p.filter(x => x.ring).map(path).join('');
  const core = p.filter(x => !x.ring).map(path).join('');
  return `<svg viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<g class="em-ring" style="transform-origin:${S / 2}px ${S / 2}px">${ring}</g>` +
    `<g class="em-core">${core}</g></svg>`;
};

/* ═══════════════════════════════════════════════════════════════════════
   DAWN — the horizon, and a sun that has not finished rising
   ═══════════════════════════════════════════════════════════════════════ */
function emDawn(k) {
  const S = 200, c = 100, p = frame(c);
  p.push(...innerRing(c, 68, 44));
  const hz = c + 26;

  p.push({ d: `M${c - 76} ${hz}H${c + 76}`, w: 1, o: 0.6 });
  p.push({ d: `M${c - 88} ${hz + 9}H${c - 40}M${c + 40} ${hz + 9}H${c + 88}`, w: 0.5, o: 0.3 });
  p.push({ d: arc(c, hz, 34, Math.PI, TAU), w: 1, o: 0.72 });
  p.push({ d: arc(c, hz, 22, Math.PI, TAU), w: 0.5, o: 0.35 });
  /* the disc's own graduated rim, upper half only — the two outlines
     alone read as a coin; ticks along the arc read as something burning */
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    const [x0, y0] = pol(c, hz, 22, a);
    const [x1, y1] = pol(c, hz, 27, a);
    p.push({ d: `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`, w: 0.4, o: 0.3 });
  }

  /* graduated rays: longer at the centre, shorter toward the horizon */
  for (let i = -4; i <= 4; i++) {
    const a = -Math.PI / 2 + i * 0.33;
    const long = i === 0 ? 30 : Math.abs(i) === 2 ? 22 : 15;
    const [x0, y0] = pol(c, hz, 42, a);
    const [x1, y1] = pol(c, hz, 42 + long, a);
    p.push({ d: `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`, w: i % 2 ? 0.5 : 0.85, o: i % 2 ? 0.34 : 0.6 });
  }
  /* a second, shorter set of rays between the first — the corona a rising
     sun actually throws is dense near the disc, not nine even spokes */
  for (let i = -3; i <= 3; i++) {
    const a = -Math.PI / 2 + (i + 0.5) * 0.33;
    const [x0, y0] = pol(c, hz, 42, a);
    const [x1, y1] = pol(c, hz, 42 + 8, a);
    p.push({ d: `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`, w: 0.32, o: 0.2 });
  }
  p.push({ d: rhombus(c, hz, 4, 7), w: 0.7, o: 0.7 });

  /* ground: a low, uneven silhouette instead of a bare line — the march
     is walked on real terrain, not a horizon abstracted to nothing.
     Small optimization pass: a touch more relief so it doesn't read as
     a wobble in the horizon line at a glance. */
  p.push({ d: peaks(c - 76, c + 76, hz, [5, 11, 4, 9, 6]), w: 0.4, o: 0.22 });
  /* far stars, thinned to five and pulled slightly further from the
     glow so they don't crowd the rays at small sizes */
  for (const [dx, dy] of [[-60, -32], [-36, -48], [34, -46], [56, -28], [66, -40]]) {
    p.push({ d: rhombus(c + dx, hz + dy, 1.2, 1.8), w: 0.4, o: 0.28 });
  }
  return wrap(p, S, k);
}

/* ═══════════════════════════════════════════════════════════════════════
   ATLAS — the armillary: a world held up, and ruled
   ═══════════════════════════════════════════════════════════════════════ */
function emAtlas(k) {
  const S = 200, c = 100, p = frame(c);
  p.push(...innerRing(c, 66, 40));
  const R = 46;

  p.push({ d: arc(c, c, R, 0, TAU - 0.001), w: 1, o: 0.66 });
  p.push({ d: `M${c} ${c - R}H${c}`, w: 0, o: 0 });

  /* meridians as ellipses of narrowing width — a third, near-edge-on pass
     added so the sphere reads as ruled all the way round, not just at
     the two quarters an armillary's brass usually shows from the front */
  for (const rx of [R * 0.22, R * 0.34, R * 0.68]) {
    p.push({ d: `M${c} ${c - R}A${f(rx)} ${R} 0 0 0 ${c} ${c + R}A${f(rx)} ${R} 0 0 0 ${c} ${c - R}Z`, w: 0.55, o: 0.36 });
  }
  /* equator and two tropics */
  p.push({ d: `M${c - R} ${c}H${c + R}`, w: 0.8, o: 0.55 });
  for (const dy of [-R * 0.5, R * 0.5]) {
    const half = Math.sqrt(R * R - dy * dy);
    p.push({ d: `M${f(c - half)} ${f(c + dy)}H${f(c + half)}`, w: 0.45, o: 0.28 });
  }
  /* degree ticks along the equator — an armillary is a measuring
     instrument first, and measuring instruments are graduated */
  for (let i = -6; i <= 6; i++) {
    if (i === 0) continue;
    const x = c + (i / 6) * R * 0.94;
    p.push({ d: `M${f(x)} ${f(c - 3)}V${f(c + 3)}`, w: 0.3, o: 0.24 });
  }
  /* a continent, sketched as a coastline the sphere carries — the world
     an armillary rules is a specific one, not a bare grid */
  p.push({ d: `M${f(c - R * 0.5)} ${f(c - R * 0.14)}Q${f(c - R * 0.32)} ${f(c - R * 0.3)} ${f(c - R * 0.16)} ${f(c - R * 0.1)}` +
              `Q${f(c - R * 0.06)} ${f(c + R * 0.05)} ${f(c - R * 0.2)} ${f(c + R * 0.12)}` +
              `Q${f(c - R * 0.4)} ${f(c + R * 0.1)} ${f(c - R * 0.5)} ${f(c - R * 0.14)}Z`, w: 0.35, o: 0.3 });
  /* the horizon ring — the fixed circle an armillary's wandering rings
     turn inside, set at a shallow tilt so it reads as the outermost
     brass. Small optimization: a slightly deeper tilt and one more
     degree-tick pass so it doesn't read as a stray underline. */
  p.push({ d: `M${c - R - 12} ${c + 7}A${R + 12} ${(R + 12) * 0.34} 0 0 0 ${c + R + 12} ${c + 7}`, w: 0.65, o: 0.42 });
  p.push({ d: ticks(c, c + 7, R + 8, R + 12, 24, Math.PI, 1), w: 0.3, o: 0.22 });
  p.push({ d: ticks(c, c + 7, R + 6, R + 8, 24, Math.PI, 4), w: 0.4, o: 0.28 });
  /* the axis, tilted, with rhombus poles and a crossbar near each end —
     an armillary's pole isn't a bare rod, it's mounted */
  const tilt = 0.32;
  const [ax0, ay0] = pol(c, c, R + 16, -Math.PI / 2 - tilt);
  const [ax1, ay1] = pol(c, c, R + 16, Math.PI / 2 - tilt);
  p.push({ d: `M${f(ax0)} ${f(ay0)}L${f(ax1)} ${f(ay1)}`, w: 0.7, o: 0.5 });
  p.push({ d: rhombus(ax0, ay0, 4, 6.5), w: 0.7, o: 0.7 });
  p.push({ d: rhombus(ax1, ay1, 4, 6.5), w: 0.7, o: 0.7 });
  for (const [ax, ay, a] of [[ax0, ay0, -Math.PI / 2 - tilt], [ax1, ay1, Math.PI / 2 - tilt]]) {
    const [gx0, gy0] = pol(ax, ay, 7, a + Math.PI / 2);
    const [gx1, gy1] = pol(ax, ay, 7, a - Math.PI / 2);
    p.push({ d: `M${f(gx0)} ${f(gy0)}L${f(gx1)} ${f(gy1)}`, w: 0.4, o: 0.34 });
  }
  return wrap(p, S, k);
}

/* ═══════════════════════════════════════════════════════════════════════
   PATH — Destruction. Nanook's ring, broken; Irontomb waiting inside.
   The one emblem in the set that is deliberately not whole.
   ═══════════════════════════════════════════════════════════════════════ */
function emPath(k) {
  const S = 200, c = 100, p = frame(c, { gap: 0.3 });
  p.push(...innerRing(c, 72, 36, 0.3));

  /* Rebuilt a fourth time, and this time genuinely from a different
     idea — every earlier version was some shape broken into two halves
     with a rhombus in the gap; three attempts at the same underlying
     construction is why it kept reading as "the thing that was already
     there." Destruction isn't a container that split, it's a single
     blow — so the figure is an impact crater: one point struck, cracks
     radiating outward denser near the strike, debris thrown clear at
     the ends of the longest ones. Nothing here is two matched pieces. */
  const ix = c, iy = c + 18;

  /* the spike driven into the strike point — an inverted rhombus, but
     now it's the thing that CAUSED the break, planted at the centre of
     the crater rather than floating in a gap between two halves */
  p.push({ d: `M${ix} ${iy - 36}L${ix + 11} ${iy - 6}L${ix} ${iy + 2}L${ix - 11} ${iy - 6}Z`, w: 1.1, o: 0.78 });
  p.push({ d: `M${ix} ${iy - 24}L${ix + 6} ${iy - 8}L${ix} ${iy - 3}L${ix - 6} ${iy - 8}Z`, w: 0.5, o: 0.42 });

  /* the crater rim: a broken, uneven ring right around the strike —
     not a clean circle, a rough lip thrown up by the impact */
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    const r0 = 20 + (i % 3) * 3;
    const [x0, y0] = pol(ix, iy, r0, a);
    const [x1, y1] = pol(ix, iy, r0 + 5, a + 0.15);
    p.push({ d: `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`, w: 0.4, o: 0.32 });
  }

  /* the cracks: sixteen fractures at irregular angles and irregular
     lengths, radiating from the strike point clean out toward the
     frame — dense and short near the centre, sparse and long further
     out, the way a real shatter pattern actually distributes */
  let seed = 11;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const cracks = 16;
  for (let i = 0; i < cracks; i++) {
    const a = (i / cracks) * TAU + (rnd() - 0.5) * 0.3;
    const len = 30 + rnd() * 40;
    const bend = (rnd() - 0.5) * 0.4;
    const [mx, my] = pol(ix, iy, len * 0.5, a + bend);
    const [x1, y1] = pol(ix, iy, len, a);
    p.push({ d: `M${ix} ${iy}Q${f(mx)} ${f(my)} ${f(x1)} ${f(y1)}`, w: 0.3 + rnd() * 0.5, o: 0.24 + rnd() * 0.36 });
    /* a short branch off roughly a third of the cracks, closer to the
       strike — real fractures fork, they don't run as single lines */
    if (i % 3 === 0) {
      const [bx, by] = pol(ix, iy, len * 0.35, a);
      const [tx, ty] = pol(bx, by, len * 0.3, a + (rnd() > 0.5 ? 0.6 : -0.6));
      p.push({ d: `M${f(bx)} ${f(by)}L${f(tx)} ${f(ty)}`, w: 0.28, o: 0.22 });
    }
    /* debris thrown clear at the end of every second, longer crack */
    if (i % 2 === 0 && len > 50) {
      const [dx1, dy1] = pol(ix, iy, len + 8, a);
      p.push({ d: rhombus(dx1, dy1, 1.6 + rnd() * 1.4, 2.6 + rnd() * 2), w: 0.4, o: 0.3 });
    }
  }
  return wrap(p, S, k);
}

/* ═══════════════════════════════════════════════════════════════════════
   CHRONICLE — the two names. One construction and its mirror, interlocked:
   Khaslana and Phainon, Kabukimono and Wanderer, dawn and dusk.
   ═══════════════════════════════════════════════════════════════════════ */
function emChronicle(k) {
  const S = 200, c = 100, p = frame(c);
  p.push(...innerRing(c, 70, 48));

  /* Rebuilt a third time as the actual duality mark — an S-seam splitting
     one disc into two matched, opposed halves, each holding a mark of
     the other inside it. The wedge/hourglass version didn't read as
     anything on sight; this one leans on a shape everyone already
     recognizes as "two mirrored halves" and builds it honestly from the
     same arc/rhombus vocabulary as the rest of the set rather than
     copying a yin-yang outline wholesale. */
  const R = 48;
  p.push({ d: arc(c, c, R, 0, TAU - 0.001), w: 1, o: 0.66 });

  /* the S-seam: two half-circles of radius R/2, one bowing right at the
     top, one bowing left at the bottom, joined at the centre */
  p.push({ d: `M${c} ${c - R}A${R / 2} ${R / 2} 0 0 1 ${c} ${c}A${R / 2} ${R / 2} 0 0 0 ${c} ${c + R}`, w: 0.85, o: 0.6 });
  /* a fainter echo of the seam, offset inward, so the division reads as
     cut rather than drawn once */
  p.push({ d: `M${c - 2} ${c - R + 3}A${R / 2 - 2} ${R / 2 - 2} 0 0 1 ${c - 2} ${c - 3}A${R / 2 - 2} ${R / 2 - 2} 0 0 0 ${c - 2} ${c + R - 3}`, w: 0.32, o: 0.26 });

  /* the mark each half carries from the other — a small rhombus sitting
     inside the "wrong" half, top and bottom, the way each name still
     carries a trace of its mirror */
  p.push({ d: rhombus(c, c - R / 2, 3.4, 5.4), w: 0.65, o: 0.58 });
  p.push({ d: rhombus(c, c + R / 2, 3.4, 5.4), w: 0.65, o: 0.58 });
  p.push({ d: arc(c, c - R / 2, 9, 0, TAU - 0.001), w: 0.32, o: 0.24 });
  p.push({ d: arc(c, c + R / 2, 9, 0, TAU - 0.001), w: 0.32, o: 0.24 });

  /* the fixed point at the centre, where the seam turns */
  p.push({ d: rhombus(c, c, 6, 9.5), w: 0.85, o: 0.72 });
  p.push({ d: arc(c, c, 3, 0, TAU - 0.001), w: 0.5, o: 0.5 });

  /* ticks graduating the outer boundary at the seam's own two crossing
     points, and a mirrored rhombus pair further out on the shared axis */
  for (const y of [c - R, c + R]) p.push({ d: `M${c - 4} ${f(y)}H${c + 4}`, w: 0.4, o: 0.32 });
  for (const dy of [-72, 72]) p.push({ d: rhombus(c, c + dy, 3, 4.8), w: 0.5, o: 0.4 });
  return wrap(p, S, k);
}

/* ═══════════════════════════════════════════════════════════════════════
   EMBERS — the Coreflame. A Titan's life kept in a vessel, so the figure
   is containment: a ring open at the top, twelve rhombi for twelve Titans.
   ═══════════════════════════════════════════════════════════════════════ */
function emEmbers(k) {
  const S = 200, c = 100, p = frame(c, { r: 94 });
  p.push(...innerRing(c, 60, 40));

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU - Math.PI / 2;
    const [x, y] = pol(c, c, 74, a);
    p.push({ d: rhombus(x, y, 3.6, 6.4), w: 0.6, o: i % 3 === 0 ? 0.75 : 0.32 });
    /* a spoke tying each Titan's mark back to the vessel — twelve seats
       around an empty ring read as decoration; twelve seats wired to
       what they're holding up reads as containment */
    const [ix, iy] = pol(c, c, 62, a);
    p.push({ d: `M${f(ix)} ${f(iy)}L${f(x)} ${f(y)}`, w: 0.3, o: 0.18 });
  }

  /* the vessel, open where the flame leaves it */
  p.push({ d: arc(c, c, 56, -Math.PI / 2 + 0.5, -Math.PI / 2 - 0.5 + TAU), w: 1, o: 0.6 });
  p.push({ d: arc(c, c, 62, -Math.PI / 2 + 0.62, -Math.PI / 2 - 0.62 + TAU), w: 0.45, o: 0.28 });
  /* a third, inner wall — a vessel holding a Titan's whole life is more
     than a single shell */
  p.push({ d: arc(c, c, 50, -Math.PI / 2 + 0.4, -Math.PI / 2 - 0.4 + TAU), w: 0.32, o: 0.2 });

  /* Partial rework of the base and licks: the pedestal was a flat
     trapezoid that read as furniture more than reliquary, and the two
     side-licks were plain smaller flames that duplicated the main one
     rather than answering it. Rebuilt as a tiered stand — two stacked
     rings narrowing to a foot — and the side licks now curl outward
     and back, closer to how a real flame drifts off-axis. */
  p.push({ d: `M${c - 24} ${c + 56}L${c - 28} ${c + 64}H${c + 28}L${c + 24} ${c + 56}Z`, w: 0.5, o: 0.36 });
  p.push({ d: `M${c - 16} ${c + 64}L${c - 20} ${c + 74}H${c + 20}L${c + 16} ${c + 64}Z`, w: 0.5, o: 0.36 });
  p.push({ d: `M${c - 20} ${c + 74}H${c + 20}`, w: 0.32, o: 0.24 });

  p.push({ d: flame(c, c + 40, 78, 30), w: 1.05, o: 0.75 });
  p.push({ d: flame(c, c + 36, 42, 15), w: 0.6, o: 0.45 });
  /* two side licks, curling off-axis rather than standing parallel to
     the main flame — drift, not a smaller copy */
  for (const side of [-1, 1]) {
    const [bx, by] = [c + side * 14, c + 44];
    const [tx, ty] = [bx + side * 16, by - 30];
    const [mx, my] = [bx + side * 22, by - 12];
    p.push({ d: `M${f(bx)} ${f(by)}Q${f(mx)} ${f(my)} ${f(tx)} ${f(ty)}Q${f(bx + side * 4)} ${f(by - 16)} ${f(bx)} ${f(by)}Z`, w: 0.4, o: 0.34 });
  }
  /* embers drifting above the main flame, four now instead of three,
     with one further out to break the tight vertical cluster */
  for (const [dx, dy] of [[-10, -58], [8, -66], [-2, -76], [18, -50]]) {
    p.push({ d: rhombus(c + dx, c + dy, 1.4, 2.2), w: 0.4, o: 0.32 });
  }
  return wrap(p, S, k);
}

/* ═══════════════════════════════════════════════════════════════════════
   SETUP — the jingasa seen from above, and the mechanism under it.
   The Wanderer's hat carries a lotus; the puppet under it is a machine.
   ═══════════════════════════════════════════════════════════════════════ */
function wSetup(k) {
  const S = 200, c = 100, p = frame(c);
  p.push(...innerRing(c, 66, 44));

  /* Rebuilt a third time — neither the ring-with-petals nor the flat
     crosshatch weave read as an actual hat. This time it's drawn with
     real dimension: a brim ellipse (the perspective a jingasa is
     usually shown in, tilted, not a flat plan view), rising ribs to an
     apex, woven cross-ticks along the ribs, and a chin cord hanging
     free below — the parts that make something unmistakably a hat
     rather than a generic dial. */
  const apex = [c, c - 46], bcy = c + 22, brx = 62, bry = 20;

  /* the brim: outer and inner ellipse, the gap between them the rim's
     own thickness */
  p.push({ d: `M${c - brx} ${bcy}A${brx} ${bry} 0 1 0 ${c + brx} ${bcy}A${brx} ${bry} 0 1 0 ${c - brx} ${bcy}Z`, w: 1, o: 0.68 });
  p.push({ d: `M${c - brx + 6} ${bcy}A${brx - 6} ${bry - 4} 0 1 0 ${c + brx - 6} ${bcy}A${brx - 6} ${bry - 4} 0 1 0 ${c - brx + 6} ${bcy}Z`, w: 0.4, o: 0.3 });

  /* twelve ribs, curving from the brim up to the apex — a jingasa's
     structure is visible ribs under the straw, and the curve (not a
     straight line) is what sells the cone rather than a flat triangle */
  const n = 12;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const bx = c + brx * Math.cos(t * TAU), by = bcy + bry * Math.sin(t * TAU);
    const front = Math.sin(t * TAU) > -0.2;   // ribs on the near half read stronger
    const midx = c + (bx - c) * 0.4, midy = apex[1] + (by - apex[1]) * 0.62;
    p.push({ d: `M${f(bx)} ${f(by)}Q${f(midx)} ${f(midy)} ${f(apex[0])} ${f(apex[1])}`, w: front ? 0.6 : 0.35, o: front ? 0.48 : 0.24 });
    /* weave ticks along the rib, three per rib, short cross-strokes */
    for (const rt of [0.28, 0.52, 0.74]) {
      const rx0 = bx + (apex[0] - bx) * rt, ry0 = by + (apex[1] - by) * rt;
      const perp = Math.atan2(apex[1] - by, apex[0] - bx) + Math.PI / 2;
      p.push({ d: `M${f(rx0 - Math.cos(perp) * 3)} ${f(ry0 - Math.sin(perp) * 3)}L${f(rx0 + Math.cos(perp) * 3)} ${f(ry0 + Math.sin(perp) * 3)}`, w: 0.24, o: front ? 0.28 : 0.16 });
    }
  }
  /* the apex, and a small finial */
  p.push({ d: arc(apex[0], apex[1], 4, 0, TAU - 0.001), w: 0.6, o: 0.56 });
  p.push({ d: rhombus(apex[0], apex[1] - 7, 2, 4), w: 0.5, o: 0.46 });

  /* the lotus, small, sitting just above the brim on the near face */
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.5;
    p.push({ d: lobe(c, bcy - 6, a, 10, 0.4), w: 0.45, o: 0.42 });
  }

  /* the chin cord: two strands from the brim's edges, hanging free and
     knotted below — nothing about a hat reads as worn without it */
  const [lx, ly] = [c - brx + 4, bcy + 4];
  const [rx, ry] = [c + brx - 4, bcy + 4];
  p.push({ d: `M${f(lx)} ${f(ly)}Q${c - 30} ${f(bcy + 30)} ${c - 6} ${f(bcy + 40)}`, w: 0.4, o: 0.34 });
  p.push({ d: `M${f(rx)} ${f(ry)}Q${c + 30} ${f(bcy + 30)} ${c + 6} ${f(bcy + 40)}`, w: 0.4, o: 0.34 });
  p.push({ d: rhombus(c, bcy + 42, 2.2, 3.4), w: 0.5, o: 0.44 });
  return wrap(p, S, k);
}


/* ═══════════════════════════════════════════════════════════════════════
   THE WANDERER'S SET
   Anemo, the Irminsul erasure, the names worn in order, the Plume of
   Luxury, the vessel he was made to be and was refused, the jingasa.
   ═══════════════════════════════════════════════════════════════════════ */

/* Dawn — Anemo. Three blades turning out of a still centre: the element
   he ended up with, not the one he was built for. */
function wDawn(k) {
  const S = 200, c = 100, p = frame(c);
  p.push(...innerRing(c, 68, 40));
  /* Partial rework: the faint third pass read as clutter more than
     motion once seen next to the rebuilt emblems, and the trailing
     wind-arc sat disconnected from the blade it was meant to trail off
     of. Replaced with a genuine spiral streak per blade — three short
     arcs of shrinking radius, each starting where the last leaves off —
     so the trail reads as one continuous curl unspooling, not a loose
     mark near the tip. */
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU - Math.PI / 2;
    p.push({ d: curl(c, c, a, 52), w: 1.05, o: 0.68 });
    p.push({ d: curl(c, c, a, 32), w: 0.5, o: 0.3 });
    /* a spiral streak of three shrinking arcs, trailing the blade's tip */
    let sr = 62;
    for (let j = 0; j < 3; j++) {
      const a0 = a - 1.02 + j * 0.5, a1 = a0 + 0.7;
      p.push({ d: arc(c, c, sr, a0, a1), w: 0.4 - j * 0.08, o: 0.3 - j * 0.07 });
      sr -= 5;
    }
  }
  /* motion ticks re-thinned and pulled tighter to the centre, so the
     turbulence reads as close to the still eye rather than scattered
     evenly across the whole dial */
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.3;
    const r0 = 18 + (i % 2) * 6;
    const [x0, y0] = pol(c, c, r0, a);
    const [x1, y1] = pol(c, c, r0 + 5, a + 0.3);
    p.push({ d: `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`, w: 0.28, o: 0.18 });
  }
  p.push({ d: arc(c, c, 13, 0, TAU - 0.001), w: 0.9, o: 0.62 });
  p.push({ d: arc(c, c, 18, 0, TAU - 0.001), w: 0.32, o: 0.22 });
  p.push({ d: rhombus(c, c, 4, 6.5), w: 0.6, o: 0.55 });
  return wrap(p, S, k);
}

/* Atlas — Irminsul. The tree of records, with one branch simply absent:
   the entry he rewrote so that it had never been there. */
function wAtlas(k) {
  const S = 200, c = 100, p = frame(c);
  p.push(...innerRing(c, 66, 44));

  /* Rebuilt a fourth time, ruled out of trees entirely — a literal tree
     and an abstract branching diagram both failed, which means the
     shape itself was never the problem to fix, the *category* was.
     Irminsul is a record before it needs to look like anything organic
     at all, so this drops the tree reading completely: a standing stone
     tablet, ruled with rows the way an actual archive page is, with one
     block of rows physically chiselled out — blank, jagged-edged — for
     the entry that was rewritten so it had never existed. Nothing here
     branches, forks, or grows. */
  const top = c - 66, bot = c + 60, lw = 54, rw = 46;   // trapezoidal slab, narrower at the base

  /* the slab: a simple trapezoid, wider at the top the way a standing
     stele actually tapers, with a bevelled inner frame */
  p.push({ d: `M${c - lw} ${top}H${c + lw}L${c + rw} ${bot}H${c - rw}Z`, w: 1.1, o: 0.74 });
  p.push({ d: `M${c - lw + 7} ${top + 7}H${c + lw - 7}L${c + rw - 6} ${bot - 6}H${c - rw + 6}Z`, w: 0.4, o: 0.3 });

  /* the ruled rows: eighteen, narrowing to match the taper, each drawn
     at slightly uneven length the way carved rows never come out
     perfectly even — this is the record itself, not decoration on it */
  const rows = 18;
  let seed = 5;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const erasedFrom = 6, erasedTo = 10;   // rows 6..10 are the missing entry
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1);
    const y = top + 14 + t * (bot - top - 24);
    const halfW = (lw + (rw - lw) * t) - 12;
    if (i >= erasedFrom && i <= erasedTo) continue;   // the erased block stays bare
    const inset = rnd() * halfW * 0.3;
    p.push({ d: `M${f(c - halfW + inset * 0.4)} ${f(y)}H${f(c + halfW - inset)}`, w: 0.3, o: 0.2 + rnd() * 0.14 });
  }
  /* the erased block: a jagged chiselled-out rectangle where those rows
     used to be, with debris chips at its ragged edge */
  const eY0 = top + 14 + (erasedFrom / (rows - 1)) * (bot - top - 24) - 6;
  const eY1 = top + 14 + (erasedTo / (rows - 1)) * (bot - top - 24) + 4;
  const eHalf = (lw + (rw - lw) * ((erasedFrom + erasedTo) / 2 / (rows - 1))) - 10;
  p.push({ d: `M${f(c - eHalf)} ${f(eY0)}L${f(c + eHalf - 4)} ${f(eY0 + 3)}L${f(c + eHalf)} ${f(eY1)}L${f(c - eHalf + 5)} ${f(eY1 - 4)}Z`, w: 0.55, o: 0.4 });
  for (let i = 0; i < 6; i++) {
    const ex = c - eHalf + rnd() * eHalf * 2, ey = eY0 + rnd() * (eY1 - eY0);
    p.push({ d: rhombus(ex, ey, 1.2, 1.8), w: 0.3, o: 0.22 });
  }
  /* the struck-out bracket marking the erasure, same motif this project
     has used for "the entry that isn't there" from the start */
  p.push({ d: arc(c + eHalf + 8, (eY0 + eY1) / 2, 9, -2.4, 0.5), w: 0.55, o: 0.4 });
  p.push({ d: `M${f(c + eHalf + 3)} ${f((eY0 + eY1) / 2 - 6)}l7 7M${f(c + eHalf + 15)} ${f((eY0 + eY1) / 2 - 6)}l-7 7`, w: 0.6, o: 0.48 });

  /* corner rhombi on the frame, and index-ticks down both margins —
     an archive is cross-referenced, not just written */
  for (const [dx, y] of [[-lw + 4, top + 4], [lw - 4, top + 4], [-rw + 4, bot - 4], [rw - 4, bot - 4]]) {
    p.push({ d: rhombus(c + dx, y, 2.4, 3.6), w: 0.5, o: 0.44 });
  }
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1);
    const y = top + 14 + t * (bot - top - 24);
    const halfW = (lw + (rw - lw) * t) - 12;
    p.push({ d: `M${f(c - halfW - 4)} ${f(y)}h3`, w: 0.24, o: 0.18 });
  }

  /* the pedestal it stands on */
  p.push({ d: `M${c - rw - 8} ${bot}H${c + rw + 8}V${bot + 8}H${c - rw - 8}Z`, w: 0.6, o: 0.46 });
  p.push({ d: `M${c - rw - 4} ${bot + 8}H${c + rw + 4}`, w: 0.32, o: 0.26 });
  return wrap(p, S, k);
}

/* Path — the names, worn in order. Five rings up a line; the last is open,
   because the one he is now has not finished being written. */
function wPath(k) {
  const S = 200, c = 100, p = frame(c, { gap: 0.24 });
  p.push(...innerRing(c, 68, 36, 0.24));

  /* Rebuilt as a real galaxy, not one spiral track with a handful of
     rings on it — Jordan asked for the spiral idea pushed much further,
     so this is three arms winding out from a bright core, each traced
     as its own logarithmic curve, with scattered star-dust along every
     arm rather than five isolated marks on an otherwise bare line. The
     names are still there — five larger rhombi on the longest arm — but
     they're now findable inside a field of smaller ones, the way a
     specific star is findable inside an actual galaxy. */
  const arm = (rot, turns, len, tone) => {
    const steps = 46;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = rot + t * turns * TAU;
      const r = 4 + t * len;
      const [x, y] = pol(c, c, r, a);
      d += (i === 0 ? 'M' : 'L') + `${f(x)} ${f(y)}`;
    }
    p.push({ d, w: tone, o: 0.3 * tone + 0.1 });
  };
  arm(0, 1.35, 64, 0.7);
  arm(TAU / 3, 1.3, 58, 0.5);
  arm(TAU * 2 / 3, 1.25, 60, 0.5);

  /* star-dust: many small rhombi scattered with density that falls off
     toward the rim, seeded along each arm's own curve so the scatter
     still traces the spiral rather than filling randomly */
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (const [rot, turns, len] of [[0, 1.35, 64], [TAU / 3, 1.3, 58], [TAU * 2 / 3, 1.25, 60]]) {
    for (let i = 0; i < 14; i++) {
      const t = 0.15 + (i / 14) * 0.85;
      const a = rot + t * turns * TAU + (rnd() - 0.5) * 0.5;
      const r = 4 + t * len + (rnd() - 0.5) * 8;
      const [x, y] = pol(c, c, r, a);
      const sz = 0.9 + rnd() * 1.4;
      p.push({ d: rhombus(x, y, sz, sz * 1.5), w: 0.35, o: 0.16 + (1 - t) * 0.14 });
    }
  }

  /* the five names, larger and set apart, riding the first arm */
  const n = 5;
  for (let i = 0; i < n; i++) {
    const t = 0.12 + (i / (n - 1)) * 0.8;
    const a = 1.35 * t * TAU;
    const r = 4 + t * 64;
    const [x, y] = pol(c, c, r, a);
    const last = i === n - 1;
    p.push({ d: rhombus(x, y, last ? 5 : 3.4 + i * 0.3, last ? 8 : 5.4 + i * 0.5), w: last ? 1.05 : 0.7, o: last ? 0.78 : 0.42 + i * 0.06 });
    if (last) p.push({ d: arc(x, y, 11, a + 0.4, a + TAU - 0.6), w: 0.4, o: 0.3 });   // still open
    const [tx, ty] = pol(x, y, 9, a + Math.PI / 2);
    p.push({ d: `M${f(x)} ${f(y)}L${f(tx)} ${f(ty)}`, w: 0.3, o: 0.22 });
  }

  /* the bright core: concentric rings and short rays, where every arm
     actually originates */
  p.push({ d: arc(c, c, 10, 0, TAU - 0.001), w: 0.7, o: 0.56 });
  p.push({ d: arc(c, c, 6, 0, TAU - 0.001), w: 0.5, o: 0.44 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const [x0, y0] = pol(c, c, 10, a), [x1, y1] = pol(c, c, 15, a);
    p.push({ d: `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`, w: 0.32, o: 0.3 });
  }
  return wrap(p, S, k);
}

/* Chronicle — the Plume of Luxury. Ei's parting feather: proof of identity
   as the Kabukimono, thrown away as Scaramouche. Built from graduated
   barbs on a spine, not sketched. */
function wChronicle(k) {
  const S = 200, c = 100, p = frame(c);
  p.push(...innerRing(c, 70, 48));

  /* Rebuilt a fourth time, ruled out from feathers entirely — two
     attempts at "a feather" (a fan, then a single quill) both failed to
     land, and a third feather would just be the same failed idea again.
     The Plume of Luxury is worn as a hair ornament, not carried as a
     found quill, so this drops the bird-feather reading altogether: a
     kanzashi pin, straight and sharp, with a jeweled crest at the head
     and strings of dangling beads (bira-bira) hanging and swaying —
     the actual silhouette of the object as an ornament, ornate but
     nothing here traces a spine-and-vane shape. */
  const headY = c - 52, tipY = c + 62;
  /* the pin: one long, straight, sharply pointed shaft */
  p.push({ d: `M${c - 2} ${headY}L${c + 2} ${headY}L${c + 1.4} ${tipY - 14}L${c} ${tipY}L${c - 1.4} ${tipY - 14}Z`, w: 1, o: 0.72 });
  p.push({ d: `M${c} ${headY + 6}V${tipY - 18}`, w: 0.3, o: 0.3 });

  /* the crest: a tight cluster of small jeweled petals fanning from the
     head, not blades — a cluster reads as an ornament, blades read as
     a feather every time */
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.26;
    const len = 20 - Math.abs(i - 4) * 1.6;
    const [tx, ty] = pol(c, headY, len, a);
    p.push({ d: rhombus((c + tx) / 2, (headY + ty) / 2, 2.2, len / 2.1), w: 0.5, o: 0.5 - Math.abs(i - 4) * 0.03 });
  }
  p.push({ d: arc(c, headY, 5, 0, TAU - 0.001), w: 0.7, o: 0.64 });

  /* three chains of dangling beads, each a different length and swing,
     the way bira-bira strands actually hang unevenly off a kanzashi */
  const chains = [
    { x: c - 16, n: 4, swing: -0.14 },
    { x: c, n: 6, swing: 0.04 },
    { x: c + 16, n: 4, swing: 0.16 },
  ];
  for (const { x, n, swing } of chains) {
    let px = x, py = headY + 8;
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 + swing * (i + 1);
      const step = 12 + i * 0.6;
      const [nx, ny] = pol(px, py, step, a);
      p.push({ d: `M${f(px)} ${f(py)}L${f(nx)} ${f(ny)}`, w: 0.3, o: 0.26 });
      p.push({ d: rhombus(nx, ny, 1.6 + i * 0.15, 2.4 + i * 0.2), w: 0.45, o: 0.4 + i * 0.03 });
      px = nx; py = ny;
    }
  }

  /* two smaller side pins crossing behind the main one, the way a
     kanzashi is usually worn as a set, not a single ornament alone */
  for (const side of [-1, 1]) {
    p.push({ d: `M${c + side * 26} ${c - 30}L${c + side * 4} ${c + 20}`, w: 0.4, o: 0.3 });
    p.push({ d: rhombus(c + side * 26, c - 30, 2, 3.2), w: 0.4, o: 0.36 });
  }
  return wrap(p, S, k);
}

/* Embers — the vessel. He was built to hold the Electro Gnosis and was
   found unsuitable, so the containment is complete and the centre is empty. */
function wEmbers(k) {
  const S = 200, c = 100, p = frame(c, { r: 94 });
  p.push(...innerRing(c, 62, 40));

  /* Rebuilt as a segmented shell, not concentric full rings — a vessel
     built and then never used doesn't read as containment through more
     circles, it reads through being a shell in pieces: six wedge plates
     with real gaps between them, each independently sound, none of them
     ever closed into a whole because nothing was ever poured in. */
  const n = 6, segR = 60, gapA = 0.1;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU + gapA, a1 = ((i + 1) / n) * TAU - gapA;
    p.push({ d: band(c, c, segR, segR - 12, a0, a1), w: 0.85, o: i === 0 ? 0.68 : 0.4 });
    p.push({ d: band(c, c, segR - 16, segR - 22, a0, a1), w: 0.4, o: 0.26 });
    const [mx, my] = pol(c, c, segR - 6, (a0 + a1) / 2);
    p.push({ d: rhombus(mx, my, 2.2, 3.4), w: 0.5, o: 0.4 });
    /* a strut bracing each plate back to the hollow centre — held
       apart, not simply floating as six separate arcs */
    const [ix, iy] = pol(c, c, 24, (a0 + a1) / 2);
    const [ox, oy] = pol(c, c, segR - 22, (a0 + a1) / 2);
    p.push({ d: `M${f(ix)} ${f(iy)}L${f(ox)} ${f(oy)}`, w: 0.3, o: 0.2 });
  }
  /* the hollow centre — a plain ring this time, no dotted-absence trick,
     because the emptiness here isn't a gap in a pattern, it's the point */
  p.push({ d: arc(c, c, 20, 0, TAU - 0.001), w: 0.5, o: 0.36 });
  p.push({ d: arc(c, c, 24, 0, TAU - 0.001), w: 0.28, o: 0.2 });
  return wrap(p, S, k);
}

/* ═══════════════════════════════════════════════════════════════════════
   ALATUS' SET
   The Qingxin on the peaks, Liyue's karst, karmic debt, the Nuo-opera
   yaksha mask, the polearm, and Morax's contract.
   ═══════════════════════════════════════════════════════════════════════ */

/* Dawn — Qingxin. It grows only on the high peaks, which is where he is. */
function xDawn(k) {
  const S = 200, c = 100, p = frame(c);
  p.push(...innerRing(c, 68, 40));
  const cy = c - 16;

  /* Rebuilt again — the crystal star read as generic geometry, not as a
     specific flower. Back to a bloom, but built as three actual depths
     of petals (back row peeking between, middle row, front row on top)
     rather than one flat ring of lobes, the way a real high-altitude
     bloom photographs: layered, slightly open, veined. */
  const layer = (n, len, wid, rot, w, o) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU - Math.PI / 2 + rot;
      p.push({ d: lobe(c, cy, a, len, wid), w, o });
      const [vx, vy] = pol(c, cy, len * 0.82, a);
      p.push({ d: `M${c} ${cy}L${f(vx)} ${f(vy)}`, w: w * 0.3, o: o * 0.6 });
      /* two side veins branching off the centre vein, close to the tip */
      const [mx, my] = pol(c, cy, len * 0.55, a);
      for (const s of [-1, 1]) {
        const [ex, ey] = pol(mx, my, len * 0.22, a + s * 0.9);
        p.push({ d: `M${f(mx)} ${f(my)}L${f(ex)} ${f(ey)}`, w: w * 0.2, o: o * 0.4 });
      }
    }
  };
  layer(5, 22, 0.55, TAU / 10, 0.55, 0.4);            // back row, peeking between
  layer(5, 38, 0.5, 0, 0.9, 0.62);                     // middle row, main bloom
  layer(5, 30, 0.42, TAU / 20, 0.6, 0.5);              // front row, slightly rotated in

  /* stamens: fine threads with a bead at the tip, at the very centre */
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    const [x, y] = pol(c, cy, 9 + (i % 2) * 3, a);
    p.push({ d: `M${c} ${cy}L${f(x)} ${f(y)}`, w: 0.28, o: 0.4 });
    p.push({ d: rhombus(x, y, 0.9, 1.4), w: 0.3, o: 0.5 });
  }
  p.push({ d: arc(c, cy, 6, 0, TAU - 0.001), w: 0.75, o: 0.66 });

  /* two smaller buds either side, still closed, on their own short stems */
  for (const side of [-1, 1]) {
    const [bx, by] = [c + side * 30, cy + 14];
    p.push({ d: `M${c} ${cy + 6}Q${f(c + side * 16)} ${f(cy + 10)} ${f(bx)} ${f(by)}`, w: 0.4, o: 0.32 });
    p.push({ d: lobe(bx, by, side > 0 ? -0.4 : Math.PI + 0.4, 12, 0.5), w: 0.5, o: 0.4 });
    p.push({ d: lobe(bx, by, side > 0 ? 0.4 : Math.PI - 0.4, 12, 0.5), w: 0.5, o: 0.4 });
  }

  /* the stem, down to the peaks, and the peaks themselves — two strata
     layers so the rock reads as more than a bare triangle silhouette */
  p.push({ d: `M${c} ${cy + 8}Q${c + 3} ${(cy + c + 68) / 2} ${c} ${c + 68}`, w: 0.45, o: 0.34 });
  p.push({ d: peaks(c - 76, c + 76, c + 68, [18, 32, 22]), w: 0.75, o: 0.42 });
  p.push({ d: peaks(c - 66, c + 66, c + 60, [10, 20, 13]), w: 0.32, o: 0.2 });
  for (const [px, py, len] of [[c - 30, c + 46, 12], [c + 18, c + 40, 10]]) {
    p.push({ d: `M${f(px - len / 2)} ${f(py)}L${f(px + len / 2)} ${f(py - 3)}`, w: 0.28, o: 0.2 });
  }
  p.push({ d: `M${c - 84} ${c + 68}H${c + 84}`, w: 0.5, o: 0.26 });
  return wrap(p, S, k);
}

/* Atlas — the karst. The land itself, which is the whole of the contract. */
function xAtlas(k) {
  const S = 200, c = 100, p = frame(c);
  p.push(...innerRing(c, 66, 44));
  p.push({ d: peaks(c - 66, c + 66, c + 46, [36, 60, 28, 48]), w: 1.05, o: 0.7 });
  p.push({ d: peaks(c - 56, c + 56, c + 46, [18, 32, 15, 26]), w: 0.5, o: 0.28 });
  /* a third, distant range behind the first two — the karst goes on
     past what one ridge line can show */
  p.push({ d: peaks(c - 70, c + 70, c + 30, [12, 22, 9, 18, 14]), w: 0.32, o: 0.2 });
  /* strata lines cut across the tallest peaks — karst is layered stone,
     not a smooth silhouette */
  for (const [px, py, len] of [[c - 40, c + 6, 14], [c + 10, c - 14, 18], [c + 44, c + 2, 12]]) {
    p.push({ d: `M${f(px - len / 2)} ${f(py)}L${f(px + len / 2)} ${f(py - 4)}`, w: 0.3, o: 0.22 });
  }
  p.push({ d: `M${c - 76} ${c + 46}H${c + 76}`, w: 0.85, o: 0.55 });
  p.push({ d: `M${c - 62} ${c + 56}H${c + 62}`, w: 0.45, o: 0.24 });
  /* a real crescent, hanging over the ridge, with a thin halo arc.
     Small optimization: nudged left of centre so it isn't stacked
     directly over the tallest peak, and the halo widened slightly so
     it reads as light rather than a stray second moon. */
  p.push({ d: crescentMoon(c + 30, c - 42, 17, 0.66, -0.35, 1.02), w: 0.85, o: 0.6 });
  p.push({ d: arc(c + 30, c - 42, 24, 0, TAU - 0.001), w: 0.22, o: 0.13 });
  /* stars, re-spaced so none sit directly under the halo */
  for (const [dx, dy] of [[-54, -54], [-32, -68], [8, -60], [60, -58], [72, -40]]) {
    p.push({ d: rhombus(c + dx, c + dy, 1.4, 2), w: 0.35, o: 0.26 });
  }
  return wrap(p, S, k);
}

/* Path — karmic debt. Links that do not come apart, and one being carried:
   the toll that drove the other four yakshas to madness or death. */
function xPath(k) {
  const S = 200, c = 100, p = frame(c, { gap: 0.22 });
  p.push(...innerRing(c, 68, 36, 0.22));

  /* Rebuilt a fourth time, ruled off chains entirely — three attempts
     (a hanging chain, a polygon net, five chains to a knot) all used
     linked-loop geometry, which is why the fourth still needed to be
     something else on sight, not just a different arrangement of links.
     Karmic debt as a cangue instead: a wooden yoke locked around the
     neck, worn openly, the actual historical shape of a public burden
     — flat board, not a single link anywhere in it. */
  const boardY = c - 6, boardW = 70, boardH = 20;

  /* the board, frontal, with rounded ends */
  p.push({ d: `M${c - boardW} ${boardY - boardH / 2}H${c + boardW}` +
              `A${boardH / 2} ${boardH / 2} 0 0 1 ${c + boardW} ${boardY + boardH / 2}` +
              `H${c - boardW}A${boardH / 2} ${boardH / 2} 0 0 1 ${c - boardW} ${boardY - boardH / 2}Z`, w: 1.1, o: 0.74 });
  /* the neck-hole, cut through the centre */
  p.push({ d: arc(c, boardY, 15, 0, TAU - 0.001), w: 0.9, o: 0.66 });
  p.push({ d: arc(c, boardY, 19, 0, TAU - 0.001), w: 0.35, o: 0.26 });

  /* wood grain: long uneven lines running the length of the board,
     broken where they'd cross the neck-hole */
  for (const dy of [-7, -3, 3, 7]) {
    const y = boardY + dy;
    const halfGap = Math.sqrt(Math.max(15 * 15 - dy * dy, 0)) + 3;
    p.push({ d: `M${c - boardW + 10} ${y}H${f(c - halfGap)}`, w: 0.28, o: 0.2 });
    p.push({ d: `M${f(c + halfGap)} ${y}H${c + boardW - 10}`, w: 0.28, o: 0.2 });
  }

  /* the hinge at one end, and the locking peg at the other — this is
     how a cangue actually closes around a neck rather than being cast
     as one piece */
  const [hx, hy] = [c - boardW + 6, boardY];
  p.push({ d: `M${hx - 5} ${hy - 10}V${hy + 10}`, w: 0.6, o: 0.5 });
  p.push({ d: rhombus(hx, hy, 2.4, 5), w: 0.55, o: 0.5 });
  const [lx, ly] = [c + boardW - 6, boardY];
  p.push({ d: `M${lx + 5} ${ly - 8}V${ly + 8}`, w: 0.5, o: 0.44 });
  p.push({ d: `M${lx} ${ly - 10}V${ly + 10}`, w: 0.75, o: 0.62 });   // the peg driven through

  /* rope lashing the ends together, since a locked peg alone wasn't
     how these were actually secured */
  for (const t of [-6, -2, 2, 6]) {
    p.push({ d: `M${c - boardW - 4} ${boardY + t}q-6 0 -6 6`, w: 0.3, o: 0.24 });
  }

  /* two weight-chains hanging from the underside — the burden this
     carries is still there, just worn instead of held */
  for (const side of [-1, 1]) {
    const bx = c + side * boardW * 0.6, by = boardY + boardH / 2;
    let px = bx, py = by;
    for (let i = 0; i < 3; i++) {
      const ny = py + 11;
      p.push({ d: stadium(bx, (py + ny) / 2, 5.5, 3, Math.PI / 2), w: 0.5, o: 0.4 - i * 0.06 });
      py = ny;
    }
    p.push({ d: rhombus(bx, py + 8, 5, 8), w: 0.7, o: 0.56 });
  }

  /* five small marks along the top edge, one for each yaksha this
     debt was meant to bind */
  for (let i = 0; i < 5; i++) {
    const x = c + (i - 2) * 22;
    p.push({ d: rhombus(x, boardY - boardH / 2 - 8, i === 2 ? 2.6 : 1.8, i === 2 ? 4 : 2.8), w: 0.5, o: i === 2 ? 0.7 : 0.3 });
  }
  return wrap(p, S, k);
}

/* Chronicle — the yaksha mask, after the Nuo opera masks. The face put on
   to do the work; the two names again, in another form. */
function xChronicle(k) {
  const S = 200, c = 100, p = frame(c);
  p.push(...innerRing(c, 70, 48));

  /* Rebuilt a third time, back to full curves and pushed to the density
     Jordan actually asked for — a real Oni mask, not a geometric
     stand-in for one: bulging brow, ridged horns, flared nostrils,
     bared fangs, wrinkles, tattoos, ear tufts. Every curve below is
     bespoke to this face rather than reused from a generic primitive,
     since a mask this specific doesn't come from arcs and rhombi alone. */
  const jaw = c + 52, top = c - 40;

  /* the face: broad temples, heavy cheekbones, a jaw that squares off
     rather than tapering to a soft chin */
  p.push({ d: `M${c - 42} ${c - 14}C${c - 44} ${top - 4} ${c - 30} ${top - 14} ${c - 10} ${top - 12}` +
              `C${c + 10} ${top - 14} ${c + 30} ${top - 4} ${c + 42} ${c - 14}` +
              `C${c + 46} ${c + 6} ${c + 40} ${c + 24} ${c + 24} ${c + 40}` +
              `C${c + 14} ${c + 50} ${c - 14} ${c + 50} ${c - 24} ${c + 40}` +
              `C${c - 40} ${c + 24} ${c - 46} ${c + 6} ${c - 42} ${c - 14}Z`, w: 1.15, o: 0.74 });
  /* jaw muscle and cheekbone ridges, one curve each side */
  for (const side of [-1, 1]) {
    p.push({ d: `M${c + side * 38} ${c - 10}Q${c + side * 30} ${c + 4} ${c + side * 30} ${c + 18}`, w: 0.35, o: 0.28 });
    p.push({ d: `M${c + side * 32} ${c + 22}Q${c + side * 22} ${c + 34} ${c + side * 12} ${c + 40}`, w: 0.3, o: 0.24 });
  }
  /* forehead wrinkles, three shallow parallel curves */
  for (const dy of [-30, -25, -20]) {
    p.push({ d: `M${c - 22} ${c + dy + 4}Q${c} ${c + dy} ${c + 22} ${c + dy + 4}`, w: 0.28, o: 0.2 });
  }

  /* horns: a real curled sweep, base to tip, with an inner ridge and
     graduated growth rings — a carved horn, not a spike */
  for (const side of [-1, 1]) {
    const b = [c + side * 26, top - 6];
    const m1 = [c + side * 50, top - 30];
    const m2 = [c + side * 46, top - 58];
    const t = [c + side * 20, top - 82];
    p.push({ d: `M${f(b[0])} ${f(b[1])}C${f(b[0] + side * 22)} ${f(b[1] - 10)} ${f(m1[0])} ${f(m1[1] + 4)} ${f(m1[0])} ${f(m1[1])}` +
                `C${f(m1[0] - side * 2)} ${f(m1[1] - 20)} ${f(m2[0])} ${f(m2[1] + 14)} ${f(m2[0])} ${f(m2[1])}` +
                `C${f(m2[0] - side * 6)} ${f(m2[1] - 16)} ${f(t[0])} ${f(m2[1] - 8)} ${f(t[0])} ${f(t[1])}`, w: 0.9, o: 0.64 });
    p.push({ d: `M${f(b[0] + side * 6)} ${f(b[1] - 2)}C${f(b[0] + side * 24)} ${f(b[1] - 14)} ${f(m1[0] + side * 4)} ${f(m1[1])} ${f(m1[0] + side * 3)} ${f(m1[1] - 6)}` +
                `C${f(m1[0])} ${f(m1[1] - 22)} ${f(m2[0] + side * 3)} ${f(m2[1] + 10)} ${f(m2[0] + side * 2)} ${f(m2[1] - 4)}`, w: 0.32, o: 0.3 });
    for (const t2 of [0.2, 0.4, 0.58, 0.75, 0.9]) {
      const rx = b[0] + (t[0] - b[0]) * t2, ry = b[1] + (t[1] - b[1]) * t2;
      p.push({ d: `M${f(rx - 6)} ${f(ry)}Q${f(rx)} ${f(ry - 3)} ${f(rx + 6)} ${f(ry)}`, w: 0.3, o: 0.26 });
    }
    p.push({ d: `M${f(b[0] - side * 5)} ${f(b[1] + 4)}Q${f(b[0])} ${f(b[1] - 4)} ${f(b[0] + side * 8)} ${f(b[1])}`, w: 0.5, o: 0.4 });   // base collar
  }

  /* ears, small and folded, at the temples */
  for (const side of [-1, 1]) {
    p.push({ d: `M${c + side * 44} ${c - 2}Q${c + side * 56} ${c + 2} ${c + side * 52} ${c + 18}Q${c + side * 44} ${c + 20} ${c + side * 40} ${c + 8}Z`, w: 0.55, o: 0.42 });
    p.push({ d: `M${c + side * 46} ${c + 4}Q${c + side * 50} ${c + 10} ${c + side * 46} ${c + 15}`, w: 0.28, o: 0.28 });
  }

  /* brows: thick, furrowed, sweeping down hard toward the nose */
  for (const side of [-1, 1]) {
    p.push({ d: `M${c + side * 34} ${c - 20}C${c + side * 22} ${c - 26} ${c + side * 12} ${c - 20} ${c + side * 6} ${c - 8}` +
                `C${c + side * 14} ${c - 10} ${c + side * 26} ${c - 14} ${c + side * 34} ${c - 12}Z`, w: 0.9, o: 0.66 });
    for (const t3 of [0.2, 0.45, 0.7]) {
      const bx = c + side * (34 - t3 * 26), by = c - 20 + t3 * 10;
      p.push({ d: `M${f(bx)} ${f(by)}l${side * 3} -2`, w: 0.24, o: 0.2 });
    }
  }

  /* eyes: bulging, angry, with lid creases and under-eye wrinkles. The
     lid was two symmetric quadratics meeting at sharp points, which read
     as flat — an angry eye is asymmetric, narrower and lower at the
     inner corner than the outer, so the curve was rebuilt around that
     instead of a mirrored lens. */
  for (const side of [-1, 1]) {
    p.push({ d: `M${c + side * 31} ${c - 3}Q${c + side * 19} ${c - 11} ${c + side * 9} ${c - 1}` +
                `Q${c + side * 19} ${c + 7} ${c + side * 29} ${c + 1}Z`, w: 0.95, o: 0.7 });
    p.push({ d: rhombus(c + side * 19, c - 2, 3.2, 2.8), w: 0.5, o: 0.56 });
    p.push({ d: `M${c + side * 28} ${c - 7}Q${c + side * 18} ${c - 14} ${c + side * 9} ${c - 6}`, w: 0.32, o: 0.3 });
    p.push({ d: `M${c + side * 26} ${c + 3}Q${c + side * 18} ${c + 9} ${c + side * 11} ${c + 2}`, w: 0.28, o: 0.24 });
    p.push({ d: `M${c + side * 33} ${c - 4}q3 -2 4 -6`, w: 0.24, o: 0.2 });   // outer eye crease
  }

  /* nose: a wide bridge, flared nostrils, a shaded tip */
  p.push({ d: `M${c - 5} ${c - 4}Q${c - 9} ${c + 8} ${c - 12} ${c + 16}Q${c - 6} ${c + 21} ${c} ${c + 20}` +
              `Q${c + 6} ${c + 21} ${c + 12} ${c + 16}Q${c + 9} ${c + 8} ${c + 5} ${c - 4}`, w: 0.55, o: 0.42 });
  p.push({ d: `M${c - 10} ${c + 16}Q${c - 13} ${c + 19} ${c - 9} ${c + 21}`, w: 0.32, o: 0.3 });
  p.push({ d: `M${c + 10} ${c + 16}Q${c + 13} ${c + 19} ${c + 9} ${c + 21}`, w: 0.32, o: 0.3 });
  p.push({ d: `M${c - 3} ${c + 14}Q${c} ${c + 17} ${c + 3} ${c + 14}`, w: 0.24, o: 0.22 });

  /* mouth: wide, snarling, with real fangs and a visible tooth row */
  p.push({ d: `M${c - 26} ${c + 26}Q${c} ${c + 40} ${c + 26} ${c + 26}Q${c} ${c + 34} ${c - 26} ${c + 26}Z`, w: 1, o: 0.72 });
  p.push({ d: `M${c - 24} ${c + 28}Q${c} ${c + 32} ${c + 24} ${c + 28}`, w: 0.3, o: 0.3 });   // lip line
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const tx = c + i * 6.5;
    p.push({ d: `M${f(tx - 2.4)} ${c + 29}L${f(tx)} ${c + 34}L${f(tx + 2.4)} ${c + 29}Z`, w: 0.35, o: 0.34 });
  }
  for (const side of [-1, 1]) {
    p.push({ d: `M${c + side * 20} ${c + 29}L${c + side * 15} ${c + 44}L${c + side * 11} ${c + 30}Z`, w: 0.75, o: 0.6 });
    p.push({ d: `M${c + side * 18} ${c + 31}L${c + side * 15} ${c + 40}`, w: 0.28, o: 0.3 });
  }
  for (const side of [-1, 1]) {
    p.push({ d: `M${c + side * 22} ${c + 30}q${side * 4} 3 ${side * 6} 8`, w: 0.3, o: 0.26 });   // mouth corner crease
  }
  p.push({ d: rhombus(c, c + 46, 2.6, 4), w: 0.4, o: 0.34 });   // chin marking

  /* temple hair tufts, three strokes a side */
  for (const side of [-1, 1]) {
    for (const t4 of [0, 1, 2]) {
      const bx = c + side * 46, by = c - 6 + t4 * 6;
      const [tx, ty] = [bx + side * 12, by - 4 + t4 * 2];
      p.push({ d: `M${f(bx)} ${f(by)}Q${f(bx + side * 6)} ${f(by - 6)} ${f(tx)} ${f(ty)}`, w: 0.3, o: 0.24 });
    }
  }

  /* the forehead mark: a rhombus with a small ring of ticks, like the
     mark on the earlier version but with real ceremonial framing */
  p.push({ d: rhombus(c, c - 32, 4.5, 7.5), w: 0.8, o: 0.72 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const [x0, y0] = pol(c, c - 32, 9, a), [x1, y1] = pol(c, c - 32, 12, a);
    p.push({ d: `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`, w: 0.28, o: 0.2 });
  }

  /* cheek markings — a small spiral flame-mark each side, painted lacquer */
  for (const side of [-1, 1]) {
    p.push({ d: `M${c + side * 30} ${c + 10}q${side * 8} -4 ${side * 10} 6q${side * 2} 8 ${side * -6} 10q${side * -6} 2 ${side * -8} -4`, w: 0.3, o: 0.26 });
  }

  /* a mirrored rhombus beneath the jaw — the two names, once more,
     reflected top to bottom across the whole mask */
  p.push({ d: rhombus(c, jaw + 6, 2.4, 3.8), w: 0.4, o: 0.32 });

  /* Cleanup pass, per Jordan's note: kept as an Oni mask, but the pore
     scatter and the second wrinkle pass were noise added purely to hit
     an element count rather than carving anything real — cut. What's
     left is every stroke that actually reads as part of the face. */
  return wrap(p, S, k);
}

/* Embers — the polearm. Bane of All Evil: the thing he actually does. */
function xEmbers(k) {
  const S = 200, c = 100, p = frame(c, { r: 94 });
  p.push(...innerRing(c, 62, 40));

  /* Rebuilt a fourth time, ruled off weapons entirely — the polearm has
     been drawn three separate ways (an ornate blade, a pinwheel of
     blades, another ornate blade) and rejected each time, so a fourth
     weapon-shaped attempt was never going to be the fix. Bane of All
     Evil is what it *does* — wards off evil — and the object that does
     that on sight is an ofuda: a paper exorcism talisman, warding-glyph
     down the centre, hung with paper streamers. Nothing here is a
     blade, a shaft, or a guard. */
  const top = c - 74, bot = c + 60, halfW = 26;

  /* the paper strip, with a notched, pointed top the way a real ofuda
     is cut rather than a plain rectangle */
  p.push({ d: `M${c - halfW} ${top + 14}L${c} ${top}L${c + halfW} ${top + 14}V${bot}H${c - halfW}Z`, w: 1.1, o: 0.76 });
  p.push({ d: `M${c - halfW + 5} ${top + 16}L${c} ${top + 6}L${c + halfW - 5} ${top + 16}V${bot - 5}H${c - halfW + 5}Z`, w: 0.35, o: 0.28 });

  /* the warding glyph: a bold zigzag lightning-line down the centre,
     the shape a shide paper streamer actually folds into, flanked by
     two thinner echoes */
  p.push({ d: `M${c - 10} ${top + 22}L${c + 9} ${top + 38}L${c - 8} ${top + 54}L${c + 9} ${top + 70}` +
              `L${c - 8} ${top + 86}L${c + 6} ${top + 100}L${c - 4} ${bot - 8}`, w: 1, o: 0.72 });
  for (const dx of [-13, 13]) {
    p.push({ d: `M${c + dx} ${top + 20}V${bot - 10}`, w: 0.3, o: 0.22 });
  }
  /* rungs crossing the glyph at intervals, the way warding script is
     annotated rather than one clean bolt */
  for (let i = 0; i < 7; i++) {
    const y = top + 24 + i * 11;
    p.push({ d: `M${c - 16} ${f(y)}H${c + 16}`, w: 0.22, o: 0.14 });
  }

  /* the seal: a bold rhombus stamp, offset toward the top the way a red
     seal actually sits on a real ofuda, not centred like a bullseye */
  p.push({ d: rhombus(c, top + 34, 7, 11), w: 0.9, o: 0.7 });
  p.push({ d: rhombus(c, top + 34, 3.4, 5.4), w: 0.45, o: 0.5 });

  /* corner and edge ticks — the border of a real talisman is marked,
     not a bare rule */
  for (const y of [top + 46, top + 62, top + 78, top + 94]) {
    p.push({ d: `M${c - halfW} ${f(y)}h4`, w: 0.24, o: 0.18 });
    p.push({ d: `M${c + halfW - 4} ${f(y)}h4`, w: 0.24, o: 0.18 });
  }

  /* two paper streamers hanging off the bottom edge, each its own
     zigzag fold — the part that makes this read as hung and used
     rather than a flat printed sheet */
  for (const side of [-1, 1]) {
    const bx = c + side * 12;
    let d = `M${bx} ${bot}`;
    let y = bot;
    for (let i = 0; i < 4; i++) {
      y += 9;
      d += `L${bx + side * (i % 2 ? 5 : -5)} ${y}`;
    }
    p.push({ d, w: 0.4, o: 0.34 });
  }

  /* five small marks for the five yakshas, arced clear above the
     talisman's own peak rather than stacked down a shaft */
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.32;
    const [x, y] = pol(c, top - 4, 20, a);
    p.push({ d: rhombus(x, y, i === 2 ? 2.6 : 1.8, i === 2 ? 4 : 2.8), w: 0.5, o: i === 2 ? 0.72 : 0.28 });
  }
  return wrap(p, S, k);
}

/* Setup — Morax's contract. Geo is angular and binding, so the figure is
   nested squares turned against each other, sealed at the centre. */
function xSetup(k) {
  const S = 200, c = 100, p = frame(c);
  p.push(...innerRing(c, 66, 44));

  /* Rebuilt a fourth time, ruled off both seals and squares — a chop and
     a rosette are the same underlying idea (a mark stamped on
     something) told two ways, which is why the chop still "didn't say
     anything." The contract itself is the more literal, more legible
     object: an unrolled scroll, rolled cylinders at both ends, ruled
     with text, a wax seal pressed at the bottom and a cord tying it
     shut. Nothing square, nothing carved — a document, not a die. */
  const midY = c, halfLen = 56, rollR = 11, flatTop = c - 26, flatBot = c + 26;

  /* the two rolled ends, drawn as short cylinders — an ellipse cap plus
     two side lines down to the flat sheet, not a plain circle */
  for (const side of [-1, 1]) {
    const rx = c + side * halfLen;
    p.push({ d: `M${rx} ${flatTop}A${rollR} ${rollR} 0 1 ${side > 0 ? 1 : 0} ${rx} ${flatBot}`, w: 1, o: 0.72 });
    p.push({ d: `M${rx - (side > 0 ? 0 : rollR * 0.6)} ${flatTop}A${rollR * 0.6} ${rollR} 0 1 ${side > 0 ? 1 : 0} ${rx - (side > 0 ? 0 : rollR * 0.6)} ${flatBot}`, w: 0.4, o: 0.3 });
    /* the roll's own end-grain rings */
    for (const rr of [rollR * 0.5]) p.push({ d: arc(rx, midY, rr, 0, TAU - 0.001), w: 0.3, o: 0.26 });
  }

  /* the flat sheet between the rolls, creased where it leaves each roll */
  p.push({ d: `M${c - halfLen} ${flatTop}H${c + halfLen}`, w: 0.9, o: 0.66 });
  p.push({ d: `M${c - halfLen} ${flatBot}H${c + halfLen}`, w: 0.9, o: 0.66 });
  for (const side of [-1, 1]) {
    p.push({ d: `M${c + side * (halfLen - rollR)} ${flatTop}V${flatBot}`, w: 0.32, o: 0.24 });
  }

  /* ruled text: seven uneven rows across the sheet, the actual terms
     of the contract, with one row visibly heavier — the clause that
     binds it */
  let seed = 3;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let i = 0; i < 7; i++) {
    const y = flatTop + 6 + i * 6.5;
    const inset = rnd() * 14;
    p.push({ d: `M${c - halfLen + rollR + 4} ${f(y)}H${f(c + halfLen - rollR - 4 - inset)}`, w: i === 3 ? 0.5 : 0.28, o: i === 3 ? 0.44 : 0.2 + rnd() * 0.1 });
  }

  /* the wax seal, pressed at the bottom edge, with a mark inside and
     a few drips — this is what actually seals it, not a carved face */
  const [sx, sy] = [c - halfLen * 0.3, flatBot + 14];
  p.push({ d: arc(sx, sy, 12, 0, TAU - 0.001), w: 0.9, o: 0.7 });
  p.push({ d: rhombus(sx, sy, 4, 6.5), w: 0.55, o: 0.56 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    const [dx1, dy1] = pol(sx, sy, 13, a);
    const [dx2, dy2] = pol(sx, sy, 16, a + 0.1);
    p.push({ d: `M${f(dx1)} ${f(dy1)}L${f(dx2)} ${f(dy2)}`, w: 0.28, o: 0.22 });
  }

  /* the cord, tied at the seal and trailing free */
  p.push({ d: `M${sx} ${sy - 12}C${sx - 10} ${flatTop - 6} ${sx + 14} ${flatTop - 10} ${sx + 4} ${flatTop - 16}`, w: 0.4, o: 0.34 });
  p.push({ d: `M${sx + 18} ${sy}C${sx + 30} ${sy + 8} ${sx + 22} ${sy + 20} ${sx + 32} ${sy + 26}`, w: 0.35, o: 0.28 });

  /* five small marks along the top, for the five contracts Morax is
     said to have kept longest */
  for (let i = 0; i < 5; i++) {
    const x = c + (i - 2) * 20;
    p.push({ d: rhombus(x, flatTop - 12, i === 2 ? 2.6 : 1.7, i === 2 ? 4 : 2.6), w: 0.5, o: i === 2 ? 0.68 : 0.28 });
  }
  return wrap(p, S, k);
}

/* Setup, Khaslana — the Scepter, and the recursion inside it. Rings that
   never quite close, each turned a little further than the last. */
function emScepter(k) {
  const S = 200, c = 100, p = frame(c);
  p.push(...innerRing(c, 68, 40));

  /* Rebuilt as a cut gem set in a mounting, not a stack of open rings —
     the recursion the rings tried to show reads clearer as facets meeting
     at a single vertex than as circles that don't quite close. A
     hexagonal stone, in three concentric cuts, each rotated against
     the last, held by four prongs. */
  const facet = (r, rot) => {
    const pts = [0, 1, 2, 3, 4, 5].map(i => pol(c, c - 6, r, rot + i * TAU / 6));
    return 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
  };
  p.push({ d: facet(50, 0), w: 1.05, o: 0.72 });
  p.push({ d: facet(50, TAU / 12), w: 0.5, o: 0.32 });
  p.push({ d: facet(32, TAU / 12), w: 0.75, o: 0.55 });
  p.push({ d: facet(16, 0), w: 0.5, o: 0.4 });
  /* facet lines from the outer ring in to the inner — the cuts of the
     stone, not just its silhouette at three sizes */
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6;
    const [x0, y0] = pol(c, c - 6, 50, a);
    const [x1, y1] = pol(c, c - 6, 16, a + TAU / 12);
    p.push({ d: `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`, w: 0.32, o: 0.24 });
  }
  p.push({ d: rhombus(c, c - 6, 6, 9), w: 0.7, o: 0.68 });

  /* the mounting: four prongs closing over the stone's outer edge, and a
     short pedestal below — a setting, not a shaft through the whole page */
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const [ox, oy] = pol(c, c - 6, 50, a);
    const [ix, iy] = pol(c, c - 6, 58, a);
    p.push({ d: `M${f(ox)} ${f(oy)}L${f(ix)} ${f(iy)}`, w: 0.6, o: 0.48 });
    p.push({ d: rhombus(ix, iy, 2.2, 3.4), w: 0.5, o: 0.42 });
  }
  p.push({ d: `M${c - 10} ${c + 46}L${c - 6} ${c + 30}H${c + 6}L${c + 10} ${c + 46}Z`, w: 0.6, o: 0.46 });
  p.push({ d: `M${c - 16} ${c + 58}L${c - 10} ${c + 46}H${c + 10}L${c + 16} ${c + 58}Z`, w: 0.55, o: 0.4 });
  p.push({ d: `M${c - 16} ${c + 58}H${c + 16}`, w: 0.35, o: 0.26 });
  return wrap(p, S, k);
}

/* ═══════════════════════════════════════════════════════════════════════
   THE TWO NAMES, small — for the Chronicle's half headers
   ═══════════════════════════════════════════════════════════════════════ */
function halfSigil(which) {
  const S = 24, c = 12;
  const up = which === 'dawn';
  const y = up ? 15 : 9;
  const p = [`M2.5 ${y}H21.5`, arc(c, y, 6, up ? Math.PI : 0, up ? TAU : Math.PI)];
  for (let i = -2; i <= 2; i++) {
    const a = -Math.PI / 2 + i * 0.52 + (up ? 0 : Math.PI);
    const [x0, y0] = pol(c, y, 8.4, a);
    const [x1, y1] = pol(c, y, i === 0 ? 11.4 : 10.2, a);
    p.push(`M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`);
  }
  p.push(rhombus(c, y, 1.5, 2.2));
  return `<svg viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${
    p.map(d => `<path d="${d}"/>`).join('')}</svg>`;
}

/* ═══════════════════════════════════════════════════════════════════════
   THE RAIL SIGILS

   Every stroke swells at its middle and comes to a thorn at both ends,
   the same cut-not-measured hand as the Coreflame — a *filled* figure,
   two quadratic flanks bowing out from a shared pair of points, because
   a stroke has one width for its whole length and cannot produce that
   taper.

   A version between this one and the one before it tried fixing the
   shape per room and only varying the texture per aspect, on the theory
   that a nav icon has to be read by outline before it's read by lore.
   True as far as it went, and wrong about what mattered more here: it
   made three characters share one figure with different trim, and that
   read as *less* personal than eighteen unrelated shapes had, not more.
   Eighteen distinct figures again — one per (room, aspect) — but drawn
   as small, confident reads of that character's own big room emblem
   below, not invented separately from it. The nav icon and the 200px
   figure are the same referent at two sizes now, which is what actually
   keeps eighteen different shapes from feeling like eighteen different
   design languages.
   ═══════════════════════════════════════════════════════════════════════ */

/* A stroke thickest at `bias` along its length, pointed at both ends.
   The control point sits at twice the half-width because a quadratic
   reaches only half way to its control at the midpoint. */
function barb(x0, y0, x1, y1, w, bias = 0.5) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * w * 2, ny = (dx / L) * w * 2;
  const mx = x0 + dx * bias, my = y0 + dy * bias;
  return `M${f(x0)} ${f(y0)}Q${f(mx + nx)} ${f(my + ny)} ${f(x1)} ${f(y1)}` +
         `Q${f(mx - nx)} ${f(my - ny)} ${f(x0)} ${f(y0)}Z`;
}

/* A thorn thrown off a point — fat near its root, so it reads as growth
   out of the stroke rather than as a second stroke crossing it. */
const spur = (x, y, a, len, w) => {
  const [x1, y1] = pol(x, y, len, a);
  return barb(x, y, x1, y1, w, 0.3);
};

const ellip = (cx, cy, rx, ry) =>
  `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}` +
  `A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;

/* An arc with thickness — outer sweep, then the inner one swung back. */
function band(cx, cy, rOut, rIn, a0, a1) {
  const [ax, ay] = pol(cx, cy, rOut, a0), [bx, by] = pol(cx, cy, rOut, a1);
  const [cx2, cy2] = pol(cx, cy, rIn, a1), [dx, dy] = pol(cx, cy, rIn, a0);
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M${f(ax)} ${f(ay)}A${f(rOut)} ${f(rOut)} 0 ${large} 1 ${f(bx)} ${f(by)}` +
         `L${f(cx2)} ${f(cy2)}A${f(rIn)} ${f(rIn)} 0 ${large} 0 ${f(dx)} ${f(dy)}Z`;
}

const SIG = 32, sc = 16;

/* A full annulus as two half-bands rather than one near-360° sweep — at a
   ring this small a single arc that nearly closes on itself is exactly
   the kind of edge case SVG's arc flags get wrong: a single sweep that
   size rendered as a sliver a tenth of a pixel tall. Two honest
   semicircles have no such edge to fall off. */
const ring = (cx, cy, rOut, rIn) =>
  band(cx, cy, rOut, rIn, 0.001, Math.PI - 0.001) + band(cx, cy, rOut, rIn, Math.PI + 0.001, TAU - 0.001);

/* KHASLANA — the horizon, the armillary, Destruction's rhombus, the two
   names, the Coreflame, the Scepter's recursion. */
function sgKDawn() {
  const hz = 22, R = 9, top = hz - R + 1;
  const p = [`M${sc - R} ${hz}A${R} ${R} 0 0 1 ${sc + R} ${hz}Z`, barb(2, hz, 30, hz, 1, 0.5)];
  const RAYS = 5, MID = 2;
  for (let i = 0; i < RAYS; i++) {
    const off = i - MID, a = -Math.PI / 2 + off * (3.3 / MID);
    const len = i === MID ? 10.5 : 8 - Math.abs(off) * 0.9;
    const [x1, y1] = pol(sc, top, len, a);
    p.push(barb(sc, top, x1, y1, i === MID ? 1.3 : 1, 0.3));
  }
  return p;
}
function sgKAtlas() {
  const R = 11;
  return [ring(sc, sc, R, R - 1.6), ellip(sc, sc, 3.2, R - 1.2), barb(sc - R + 1.4, sc, sc + R - 1.4, sc, 0.85, 0.5)];
}
function sgKPath() {
  /* The strike point and its radiating cracks — the same impact-crater
     construction as emPath, at icon scale. */
  const p = [`M${sc} ${sc - 8}L${sc + 5} ${sc - 1}L${sc} ${sc + 1}L${sc - 5} ${sc - 1}Z`];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    p.push(barb(sc, sc, sc + Math.cos(a) * (7 + (i % 2) * 4), sc + Math.sin(a) * (7 + (i % 2) * 4), 0.5, 0.3));
  }
  return p;
}
function sgKChronicle() {
  /* The S-seam splitting one disc into two, the same construction as
     emChronicle now — Khaslana and Phainon, one figure and its mirror. */
  return [
    ring(sc, sc, 10.4, 9),
    band(sc, sc - 4.6, 5.2, 3.8, 0, Math.PI), band(sc, sc + 4.6, 5.2, 3.8, Math.PI, TAU),
    rhombus(sc, sc, 2, 3.2), ellip(sc, sc - 4.6, 1.3, 1.3), ellip(sc, sc + 4.6, 1.3, 1.3),
  ];
}
function sgKEmbers() {
  const p = [band(sc, 12, 8.4, 6, 0.5, Math.PI - 0.5), flame(sc, 24.5, 13.5, 10)];
  p.push(lobe(sc + 4.6, 17, -0.55, 5.4, 0.3), lobe(sc - 4.2, 20, Math.PI + 0.55, 4.2, 0.3));
  return p;
}
function sgKSetup() {
  const p = [ring(sc, sc, 10.6, 8.6)];
  for (let i = 0; i < 8; i++) p.push(spur(sc, sc, (i / 8) * TAU, 7.4, 0.55));
  p.push(ring(sc, sc, 4.6, 3.4), ellip(sc, sc, 1.4, 1.4));
  return p;
}

/* WANDERER — Anemo, Irminsul's gap, the names still open, the Plume, the
   refused vessel, the jingasa. */
function sgWDawn() {
  const p = [];
  for (let i = 0; i < 3; i++) { p.push(curl(sc, sc, (i / 3) * TAU - Math.PI / 2, 10.5)); }
  p.push(ring(sc, sc, 3.4, 2.2));
  return p;
}
function sgWAtlas() {
  /* The archive tablet, ruled and with one row erased — the same
     construction as wAtlas now, at icon scale. */
  const p = [barb(sc - 7, sc - 9, sc + 7, sc - 9, 0.9, 0.5), barb(sc - 6, sc + 9, sc + 6, sc + 9, 0.9, 0.5),
    barb(sc - 7, sc - 9, sc - 6, sc + 9, 0.7, 0.5), barb(sc + 7, sc - 9, sc + 6, sc + 9, 0.7, 0.5)];
  for (const y of [-5.5, -1.5, 5.5]) p.push(barb(sc - 4.5, sc + y, sc + 4.5, sc + y, 0.4, 0.5));
  return p;
}
function sgWPath() {
  /* a small spiral of tapered segments, matching the galaxy wPath is
     built from now — sigils are filled shapes, so this is built from
     `barb` segments the same way the other icons are, not a raw stroke */
  const p = [];
  const steps = 7;
  let prev = pol(sc, sc, 1.5, -Math.PI / 2);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, a = t * 1.9 * TAU - Math.PI / 2, r = 1.5 + t * 10.5;
    const next = pol(sc, sc, r, a);
    p.push(barb(prev[0], prev[1], next[0], next[1], 0.55 + t * 0.35, 0.5));
    prev = next;
  }
  p.push(ellip(sc, sc, 1.3, 1.3));
  return p;
}
function sgWChronicle() {
  /* The kanzashi pin with hanging bead-chains — the same construction
     as wChronicle now, no feather anywhere in it. */
  const p = [barb(sc, 4, sc, 27, 0.7, 0.4), ellip(sc, 4, 2.2, 2.2)];
  for (const x of [sc - 4, sc, sc + 4]) {
    p.push(barb(x, 8, x, 8 + 6 + (x === sc ? 3 : 0), 0.5, 0.5));
    p.push(ellip(x, 14 + (x === sc ? 3 : 0), 1, 1));
  }
  return p;
}
function sgWEmbers() {
  /* The vessel built for the Gnosis, and refused — containment without
     a flame in it. Open at the top, deliberately empty at the centre. */
  const p = [];
  for (const [r, w] of [[9.2, 1], [7.4, 0.55]]) p.push(ring(sc, sc, r, r - w));
  for (let i = 0; i < 6; i++) p.push(spur(sc, sc, (i / 6) * TAU - Math.PI / 2, 5.6, i === 0 ? 0.85 : 0.5));
  return p;
}
function sgWSetup() {
  const p = [ring(sc, sc, 10.4, 8.6)];
  for (let i = 0; i < 6; i++) { if (i === 2) continue; p.push(spur(sc, sc, (i / 6) * TAU, 7.6, 0.5)); }
  p.push(ellip(sc, sc, 2, 2));
  return p;
}

/* ALATUS — Qingxin over the peak line, the karst and the moon, karmic
   chain, the yaksha mask, the polearm, Morax's nested squares. */
function sgXDawn() {
  const p = [];
  for (let i = 0; i < 5; i++) p.push(lobe(sc, 20.5, -Math.PI / 2 + (i - 2) * 0.5, 10.5, 0.32));
  p.push(barb(6, 27, 26, 27, 1, 0.5));
  return p;
}
function sgXAtlas() {
  return [peaks(4, 28, 24, [7, 11, 6, 13, 8]), crescentMoon(22, 8, 4.2, 0.66, -Math.PI / 2.6, 1.0)];
}
function sgXPath() {
  /* The cangue — a board with a neck-hole cut through it — the same
     construction as xPath now, no chain links. */
  return [
    stadium(sc, sc, 11, 4, 0), ring(sc, sc, 4.4, 3),
    barb(sc - 9, sc - 5, sc - 9, sc + 5, 0.6, 0.5), barb(sc + 9, sc - 5, sc + 9, sc + 5, 0.6, 0.5),
  ];
}
function sgXChronicle() {
  return [
    band(sc, sc + 2, 9.4, 6.7, 0.35, Math.PI - 0.35),
    spur(sc - 5, sc - 4, -2.3, 6.8, 0.85), spur(sc + 5, sc - 4, -0.84, 6.8, 0.85),
    barb(sc - 5.4, sc, sc - 2, sc + 1.4, 0.9, 0.5), barb(sc + 5.4, sc, sc + 2, sc + 1.4, 0.9, 0.5),
  ];
}
function sgXEmbers() {
  /* The ofuda talisman, notched top and a warding zigzag — the same
     construction as xEmbers now, no blade anywhere in it. */
  return [
    `M${sc - 7} ${8}L${sc} ${4}L${sc + 7} ${8}V${26}H${sc - 7}Z`,
    barb(sc - 3, 9, sc + 3, 15, 0.5, 0.5), barb(sc + 3, 15, sc - 3, 21, 0.5, 0.5),
    rhombus(sc, 12, 2.4, 3.6),
  ];
}
function sgXSetup() {
  /* The unrolled scroll, rolled ends and a wax seal — the same
     construction as xSetup now, nothing square. */
  return [
    ring(sc - 9, sc, 3, 1.6), ring(sc + 9, sc, 3, 1.6),
    barb(sc - 6, sc - 4, sc + 6, sc - 4, 0.5, 0.5), barb(sc - 6, sc + 4, sc + 6, sc + 4, 0.5, 0.5),
    ellip(sc - 3, sc + 8, 2.4, 2.4), rhombus(sc - 3, sc + 8, 1, 1.6),
  ];
}

const SIGILS_BY_ASPECT = {
  khaslana: {
    dawn:      { draw: sgKDawn,      of: 'The horizon, and a sun that has not finished rising' },
    atlas:     { draw: sgKAtlas,     of: 'The armillary — a world held up, and ruled' },
    path:      { draw: sgKPath,      of: 'Destruction — the ring broken, the rhombus pointing down' },
    chronicle: { draw: sgKChronicle, of: 'The two names, one figure and its mirror' },
    embers:    { draw: sgKEmbers,    of: 'The Coreflame — carried, never left to burn in the open' },
    setup:     { draw: sgKSetup,     of: 'The Scepter, and the recursion turning inside it' },
  },
  wanderer: {
    dawn:      { draw: sgWDawn,      of: 'Anemo — three blades turning out of a still centre' },
    atlas:     { draw: sgWAtlas,     of: 'Irminsul, with the branch he erased simply absent' },
    path:      { draw: sgWPath,      of: 'The names worn in order; the last ring still open' },
    chronicle: { draw: sgWChronicle, of: 'The Plume of Luxury, graduated barbs on a spine' },
    embers:    { draw: sgWEmbers,    of: 'The vessel built for the Gnosis, and refused — open, not filled' },
    setup:     { draw: sgWSetup,     of: 'The jingasa from above, and the mechanism beneath it' },
  },
  alatus: {
    dawn:      { draw: sgXDawn,      of: 'Qingxin — it only grows on the high peaks, which is where he is' },
    atlas:     { draw: sgXAtlas,     of: 'Liyue’s karst under a night moon' },
    path:      { draw: sgXPath,      of: 'Karmic debt — links that do not come apart' },
    chronicle: { draw: sgXChronicle, of: 'The yaksha mask: horns, angular eyes' },
    embers:    { draw: sgXEmbers,    of: 'The polearm, with marks for the five yakshas' },
    setup:     { draw: sgXSetup,     of: 'Morax’s contract: nested squares, angular and binding' },
  },
};
function sigilSvg(room, aspect) {
  const s = (SIGILS_BY_ASPECT[aspect] || SIGILS_BY_ASPECT.khaslana)[room];
  if (!s) return null;
  return `<svg class="ico sig" viewBox="0 0 ${SIG} ${SIG}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${
    s.draw().map(x => typeof x === 'string'
      ? `<path d="${x}"/>`
      : `<path d="${x.d}" fill-rule="evenodd"/>`).join('')}</svg>`;
}

/* The Coreflame mark, as path data for the canvas to fill. The rays grow
   and the disc opens as the streak holds — at nothing lit it is a bare
   rhombus, cold. */
function coreflameSigil(vigour) {
  const p = [];
  const long = 5 + vigour * 10, short = 4 + vigour * 5.6;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU - Math.PI / 2;
    const [x0, y0] = pol(sc, sc, 4.6, a), [x1, y1] = pol(sc, sc, 4.6 + long, a);
    p.push(barb(x0, y0, x1, y1, 0.6 + vigour * 0.9, 0.32));
  }
  if (vigour > 0.45) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU - Math.PI / 4;
      const [x0, y0] = pol(sc, sc, 5, a), [x1, y1] = pol(sc, sc, 5 + short, a);
      p.push(barb(x0, y0, x1, y1, 0.5 + vigour * 0.5, 0.34));
    }
  }
  p.push(rhombus(sc, sc, 1.6 + vigour * 1.4, 2.4 + vigour * 1.8));
  return p.join('');
}

/* ═══════════════════════════════════════════════════════════════════════
   MOUNTING
   ═══════════════════════════════════════════════════════════════════════ */

/* Six rooms × three aspects. Same construction language throughout, so the
   set still reads as one system — but every figure comes out of its own
   character's story rather than being Phainon's with a different colour. */
const EMBLEMS = {
  khaslana: {
    dawn:      { draw: emDawn,      of: 'The horizon, and a sun that has not finished rising' },
    atlas:     { draw: emAtlas,     of: 'The armillary — Kephale\'s world, held up and ruled' },
    path:      { draw: emPath,      of: 'Destruction — Nanook\'s ring broken, Irontomb inside' },
    chronicle: { draw: emChronicle, of: 'Two names, one figure and its mirror: Khaslana, Phainon' },
    embers:    { draw: emEmbers,    of: 'The Coreflame — a Titan\'s life kept in a vessel' },
    setup:     { draw: emScepter,   of: 'The Scepter, and the recursion turning inside it' },
  },
  wanderer: {
    dawn:      { draw: wDawn,       of: 'Anemo — the element he ended up with, not the one he was built for' },
    atlas:     { draw: wAtlas,      of: 'Irminsul, with the branch he erased simply absent' },
    path:      { draw: wPath,       of: 'The names worn in order; the last one still open' },
    chronicle: { draw: wChronicle,  of: 'The Plume of Luxury — proof of identity, carried and then dropped' },
    embers:    { draw: wEmbers,     of: 'The vessel built for the Electro Gnosis, and refused' },
    setup:     { draw: wSetup,      of: 'The jingasa from above, and the mechanism beneath it' },
  },
  alatus: {
    dawn:      { draw: xDawn,       of: 'Qingxin — it only grows on the high peaks, which is where he is' },
    atlas:     { draw: xAtlas,      of: 'Liyue\'s karst under a night moon: the whole of the contract' },
    path:      { draw: xPath,       of: 'Karmic debt — links that do not come apart, and the weight carried' },
    chronicle: { draw: xChronicle,  of: 'The yaksha mask, after the Nuo opera: the face put on to do the work' },
    embers:    { draw: xEmbers,     of: 'The polearm, Bane of All Evil — and five marks for five yakshas' },
    setup:     { draw: xSetup,      of: 'Morax\'s contract: nested squares, angular and binding' },
  },
};

const emblemSet = () => EMBLEMS[document.documentElement.dataset.aspect] || EMBLEMS.khaslana;
const NAV_ORIGINAL = new Map();

function mountEmblems() {
  const set = emblemSet();
  const asp = document.documentElement.dataset.aspect || 'khaslana';
  document.querySelectorAll('[data-emblem]').forEach(el => {
    const e = set[el.dataset.emblem] || set.embers;
    const stroke = +(el.dataset.stroke || 1);
    const key = asp + el.dataset.emblem + stroke;
    if (el.dataset.drawn === key) return;          // don't redraw needlessly
    el.innerHTML = e.draw(stroke);
    el.dataset.drawn = key;
    el.title = e.of;
  });
  /* The rail tabs — every aspect gets its own inked hand now, not just
     Khaslana. NAV_ORIGINAL keeps the markup's drafted icons as the one
     fallback for anything a set doesn't define. */
  document.querySelectorAll('#nav button[data-view]').forEach(btn => {
    const ico = btn.querySelector('svg.ico');
    if (!ico) return;
    if (!NAV_ORIGINAL.has(btn.dataset.view)) NAV_ORIGINAL.set(btn.dataset.view, ico.outerHTML);
    if (btn.dataset.icon === asp) return;
    const next = sigilSvg(btn.dataset.view, asp) || NAV_ORIGINAL.get(btn.dataset.view);
    ico.outerHTML = next;
    btn.dataset.icon = asp;
  });

  document.querySelectorAll('[data-sigil]').forEach(el => {
    if (el.dataset.drawn) return;
    el.innerHTML = halfSigil(el.dataset.sigil);
    el.dataset.drawn = '1';
  });
}
