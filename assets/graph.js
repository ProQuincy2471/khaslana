/* ===========================================================================
   KHASLANA — the constellation of chapters

   Obsidian's graph view works because the links are real: you wrote
   `[[other note]]` yourself. Nothing here has that — a chapter is a slab of
   generated HTML with no markup pointing at its siblings. So the graph has
   to find its own edges, and it finds two different kinds:

     mention   Chapter A's body actually contains chapter B's title as a
               whole word — "Choque" turning up inside "Taponamiento
               Cardiaco" is a real clinical relationship, not a guess.
               Weighted heavily.

     kinship   A and B share a specific keyword in their titles or aliases
               — a pathogen, a syndrome — filtered through a stop-list of
               boilerplate section words ("tratamiento", "diagnostico" are
               in almost every chapter and would turn the graph into a
               hairball). Weighted lightly, and only kept when the shared
               word is rare enough to mean something.

   No dependency, one canvas, physics simple enough to run every frame for
   a hundred-odd nodes without a quad-tree. Wired into the same motion tiers
   as the sky and the emblems (see canvas.js) — Still runs the layout once,
   synchronously, and stops; Subtle throttles to 8fps; Full runs free.
   =========================================================================== */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ── Building the graph ─────────────────────────────────────────────────── */

let G = null;
let gBuiltSig = null;
/* True only right after a genuine (re)build — a filter change or a
   revisit to the room should redraw the graph exactly as you left it,
   not reheat and rerun the layout on top of wherever you dragged things. */
let gNeedsSettle = true;

const graphSignature = () =>
  CODEX.entries.length + '|' + (CODEX.entries[0]?.id || '') + '|' + (CODEX.entries.at(-1)?.id || '');

/* Boilerplate that shows up in nearly every chapter's section headings and
   would otherwise link everything to everything. Kept short on purpose —
   it only needs to catch the words common enough to be noise. */
const GRAPH_STOP = new Set([
  'definicion','definiciones','epidemiologia','etiologia','fisiopatologia','diagnostico',
  'diagnostica','diagnosticos','tratamiento','tratamientos','manifestaciones','clinicas',
  'clinica','clinico','clasificacion','complicaciones','pronostico','prevencion','cuadro',
  'tabla','figura','manejo','abordaje','generalidades','introduccion','conceptos','factores',
  'riesgo','riesgos','criterios','escala','nota','notas','perlas','trampas','examen',
  'sospecha','laboratorio','gabinete','estudios','seguimiento','indicaciones',
  'contraindicaciones','signos','sintomas','sintomatologia','caso','casos','simulacro',
  'enarm','referencias','bibliografia','anexo','anexos','resumen','puntos','clave','claves',
  'importantes','general','especifico','especifica','primaria','secundaria','inicial',
  'aguda','agudo','cronica','cronico','paciente','pacientes','mexico','enfermedad',
  'sindrome','trastorno','manejo','poblacion','adultos','pediatrico','pediatrica',
]);

/* A whole-word substring check on already-normalised text — does A's body
   actually say B's name, not just contain its letters. */
function graphMentions(hay, needle) {
  if (!hay || needle.length < 5) return false;
  let i = -1;
  while ((i = hay.indexOf(needle, i + 1)) !== -1) {
    const before = i === 0 ? ' ' : hay[i - 1];
    const after = (i + needle.length >= hay.length) ? ' ' : hay[i + needle.length];
    if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return true;
  }
  return false;
}

function buildGraphData(force) {
  const sig = graphSignature();
  if (G && !force && gBuiltSig === sig) return G;
  gBuiltSig = sig;
  gNeedsSettle = true;

  const nodes = CODEX.entries.map(e => ({
    id: e.id, e,
    r: clamp(4 + Math.sqrt((e.sections?.length || 0) * 0.9 + (e.cases || 0) * 3), 4, 13),
    x: 0, y: 0, fx: null, fy: null,
    kw: new Set(),
  }));
  const byId = new Map(nodes.map(n => [n.id, n]));

  /* Seed positions by area, so the layout starts already roughly clustered
     rather than as a ball of static the physics has to untangle from
     scratch — Obsidian's own graph does this too, less visibly. */
  const areas = [...new Set(nodes.map(n => n.e.area))]
    .sort((a, b) => nodes.filter(n => n.e.area === b).length - nodes.filter(n => n.e.area === a).length);
  /* A fixed home for each specialty, not just a starting position. Without
     an anchor the physics only knows about edges and general repulsion —
     nothing tells it "these are the same kind of thing" — so a settle
     erodes whatever grouping the seed had and areas end up interleaved.
     Bigger areas get more of the ring's circumference, proportional to
     their share of the chapters, so Pediatría (29 chapters) and
     Farmacología (1) don't get equal wedges. */
  const total = nodes.length || 1;
  const areaAnchor = new Map();
  const RING = 260;
  let sweep = 0;
  for (const a of areas) {
    const share = nodes.filter(n => n.e.area === a).length / total;
    const ca = sweep + share * Math.PI;      // centre of this area's wedge
    areaAnchor.set(a, [Math.cos(ca) * RING, Math.sin(ca) * RING]);
    sweep += share * Math.PI * 2;
  }
  for (const n of nodes) {
    const [cx, cy] = areaAnchor.get(n.e.area);
    const rr = 20 + Math.random() * 60;
    const a2 = Math.random() * Math.PI * 2;
    n.x = cx + Math.cos(a2) * rr;
    n.y = cy + Math.sin(a2) * rr;
  }

  for (const n of nodes) {
    norm(n.e.title + ' ' + (n.e.aliases || []).join(' ') + ' ' + (n.e.subtitle || ''))
      .split(/[^a-z0-9]+/)
      .filter(w => w.length >= 5 && !GRAPH_STOP.has(w))
      .forEach(w => n.kw.add(w));
  }

  const wMap = new Map();
  const addWeight = (a, b, w) => {
    if (a === b) return;
    const k = a < b ? a + '|' + b : b + '|' + a;
    wMap.set(k, (wMap.get(k) || 0) + w);
  };

  for (const a of nodes) {
    const needle = norm(a.e.title);
    for (const b of nodes) {
      if (a === b) continue;
      if (graphMentions(b.e.haystack, needle)) addWeight(a.id, b.id, 4);
    }
  }

  const bucket = (map, key) => { let b = map.get(key); if (!b) { b = []; map.set(key, b); } return b; };

  const inv = new Map();
  for (const n of nodes) for (const w of n.kw) bucket(inv, w).push(n);
  for (const list of inv.values()) {
    if (list.length < 2 || list.length > 6) continue;   // 1 = nothing shared; 7+ = not specific
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++)
        addWeight(list[i].id, list[j].id, 1);
  }

  let edges = [...wMap.entries()].map(([k, w]) => { const [s, t] = k.split('|'); return { s, t, w }; });

  /* Keep the graph legible rather than complete: each node keeps its five
     strongest links, plus anything weighted 3+ regardless of rank — a real
     mention should never be pruned for being the sixth-best one. */
  const byNode = new Map();
  for (const ed of edges) { bucket(byNode, ed.s).push(ed); bucket(byNode, ed.t).push(ed); }
  const keep = new Set();
  for (const list of byNode.values()) {
    list.sort((a, b) => b.w - a.w);
    list.slice(0, 5).forEach(ed => keep.add(ed));
    list.filter(ed => ed.w >= 3).forEach(ed => keep.add(ed));
  }
  edges = edges.filter(ed => keep.has(ed));

  G = { nodes, edges, byId, areaAnchor, maxW: Math.max(1, ...edges.map(e => e.w)) };
  return G;
}

function graphNeighbors(node) {
  const s = new Set([node.id]);
  for (const ed of G.edges) {
    if (ed.s === node.id) s.add(ed.t);
    else if (ed.t === node.id) s.add(ed.s);
  }
  return s;
}

/* ── Physics ─────────────────────────────────────────────────────────────
   The first version carried velocity between steps — repulsion and springs
   both added impulses to `vx/vy` every frame, damped by a flat 0.86. With
   83 densely-linked chapters (one node with 21 neighbours) that never
   actually settles: two forces pulling a pair to different rest distances
   at once just oscillate, and the "stop once it's calm" check compared
   the total against a fixed threshold that a system in that kind of
   argument never drops below. The loop ran forever, every node visibly
   trembling, and a target you clicked had usually moved by the time the
   click landed — which is exactly what broke.

   This is Fruchterman–Reingold instead: no velocity at all, just a force
   for this step converted straight to a displacement, capped by a
   "temperature" that cools every step toward zero. A system that can only
   move less over time cannot oscillate forever — it has nowhere to put
   the energy. Convergence is the property that was actually needed here,
   not a more forgiving stop condition. */
const K_LEN = 44;              // the distance two unconnected chapters would rather keep
let gTemp = 0;                 // current cap on a node's displacement this step, in px

function graphStep() {
  const { nodes, edges } = G;
  const n = nodes.length;
  if (n < 2 || gTemp <= 0) return 0;

  const Fx = new Float64Array(n), Fy = new Float64Array(n);
  const idx = new Map(nodes.map((nd, i) => [nd.id, i]));

  /* Repulsion that never fades with distance is what actually blew the
     layout apart: 83 nodes all pushing on 83 others, with nothing to
     counter it at long range, settles at a scale of thousands of pixels —
     ten times the size of the anchor ring meant to hold areas together.
     A cutoff (no push past REPEL_MAX) is what a real spatial-hash
     implementation would give you for free; skipping the pair here does
     the same job without needing one at this node count. */
  const REPEL_MAX = 240, REPEL_MAX2 = REPEL_MAX * REPEL_MAX;
  for (let i = 0; i < n; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < n; j++) {
      const b = nodes[j];
      let dx = a.x - b.x, dy = a.y - b.y;
      let d2 = dx * dx + dy * dy;
      if (d2 > REPEL_MAX2) continue;
      if (d2 < 0.4) { dx = (Math.random() - 0.5) * 0.5; dy = (Math.random() - 0.5) * 0.5; d2 = 0.4; }
      const d = Math.sqrt(d2);
      const rep = (K_LEN * K_LEN) / d;
      const fx = (dx / d) * rep, fy = (dy / d) * rep;
      Fx[i] += fx; Fy[i] += fy;
      Fx[j] -= fx; Fy[j] -= fy;
    }
  }
  for (const ed of edges) {
    const ia = idx.get(ed.s), ib = idx.get(ed.t);
    const a = nodes[ia], b = nodes[ib];
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 0.01;
    const rest = K_LEN * clamp(1 - ed.w * 0.05, 0.4, 1);   // a stronger link wants to sit closer
    const att = (d - rest) * 0.16 * Math.min(2, 0.6 + ed.w * 0.12);
    const fx = (dx / d) * att, fy = (dy / d) * att;
    Fx[ia] += fx; Fy[ia] += fy;
    Fx[ib] -= fx; Fy[ib] -= fy;
  }
  /* Pull toward the specialty's own anchor, not toward a shared centre.
     This is what actually keeps areas apart — without it, edges and
     repulsion alone don't know two nodes are "the same kind of thing",
     and a settle just erodes whatever grouping the seed started with. It
     is deliberately gentler than a real mention edge, so a chapter that
     genuinely belongs to a cross-specialty cluster (the chest-trauma
     group spanning Cirugía/Urgencias/Infectología) can still be pulled
     out of its home wedge by real connections — grouped by default,
     not grouped by force. */
  for (let i = 0; i < n; i++) {
    const [ax, ay] = G.areaAnchor.get(nodes[i].e.area);
    Fx[i] += (ax - nodes[i].x) * 0.16;
    Fy[i] += (ay - nodes[i].y) * 0.16;
  }

  let moved = 0;
  for (let i = 0; i < n; i++) {
    const a = nodes[i];
    if (a.fx != null) { a.x = a.fx; a.y = a.fy; continue; }   // pinned while dragged
    const mag = Math.hypot(Fx[i], Fy[i]) || 1e-6;
    const cap = Math.min(mag, gTemp);
    const dx = (Fx[i] / mag) * cap, dy = (Fy[i] / mag) * cap;
    a.x += dx; a.y += dy;
    moved += Math.abs(dx) + Math.abs(dy);
  }
  gTemp = Math.max(0, gTemp * 0.985);
  return moved;
}

/* One synchronous burst, always — never a live loop the user has to wait
   out or click through. Real Obsidian doesn't animate its graph into
   existence either; it opens already arranged and only moves in direct
   response to your hand on it. ~350 steps is comfortably past where the
   temperature (and so the motion) has cooled to nothing, and it costs a
   few milliseconds even at n≈100 — an instant, not an animation. */
function graphSettle(heat) {
  gTemp = heat;
  for (let i = 0; i < 350 && gTemp > 0.01; i++) graphStep();
  gTemp = 0;
  gNeedsSettle = false;
  graphDraw();
}

/* The only thing still allowed to move live is a node you are physically
   holding — it tracks the cursor directly, with no physics involved, so
   it cannot jitter. Letting go asks for one small, instant local
   resettle rather than reopening a running loop. */
function graphPause() { graphTwinkleStop(); }

/* ── Camera & rendering ─────────────────────────────────────────────────── */

let gCanvas = null, gCtx = null, gW = 0, gH = 0, gDPR = 1;
let gCam = { x: 0, y: 0, k: 1 };
let gHover = null, gSelected = null, gDrag = null, gMouse = { x: 0, y: 0 };
let gMatch = null;   // Set of matching ids, or null = everything matches
let gWired = false;

/* ── The sky behind it ──────────────────────────────────────────────────
   The room is called the constellation for a reason that was entirely
   metaphorical until now — grey dots on a black field don't actually
   read as stars. A backdrop field (drawn in screen space, so it never
   pans or zooms with the graph — it's the sky, not part of the map) and
   a slow twinkle make the metaphor literal. This is the one thing in
   the room allowed to loop continuously: it never touches a node's
   position, so it carries none of the risk the old physics loop did. */
let gStars = null;
function seedStars() {
  gStars = [];
  const n = 130;
  for (let i = 0; i < n; i++) {
    gStars.push({
      x: Math.random(), y: Math.random(),
      r: 0.35 + Math.random() * 1.05,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.3,
    });
  }
}
function drawStars(t) {
  if (!gStars || !gW) return;
  const ctx = gCtx;
  for (const s of gStars) {
    const tw = STILL() ? 0.55 : 0.4 + 0.4 * Math.sin((t || 0) / 1500 * s.speed + s.phase);
    ctx.globalAlpha = 0.1 + tw * 0.24;
    ctx.fillStyle = '#cdd7ea';
    ctx.beginPath();
    ctx.arc(s.x * gW, s.y * gH, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* One continuous loop, entirely separate from the physics — it redraws
   the frame (stars twinkling, held-node glow breathing) but never calls
   graphStep, so it cannot reintroduce the jitter the settle-once model
   was built to kill. Still mode skips it and paints once. */
let gTwinkleStop = null;
function graphTwinkleStart() {
  if (gTwinkleStop || !gCanvas) return;
  if (STILL()) { graphDraw(); return; }
  gTwinkleStop = paced((t) => graphDraw(t));
}
function graphTwinkleStop() { if (gTwinkleStop) { gTwinkleStop(); gTwinkleStop = null; } }

/* ── Focus: double-click a node to isolate its neighbourhood ────────────
   A persistent version of the hover-highlight — everything outside the
   clicked node and its direct connections dims and stays dim until you
   back out. Useful for actually reading a hub's connections rather than
   catching them mid-hover. */
let gFocus = null;
function graphSetFocus(node) {
  gFocus = node;
  const hud = $('#graphFocusHud');
  if (hud) {
    hud.hidden = !node;
    if (node) $('#graphFocusName').textContent = node.e.title;
  }
  graphDraw();
}

function resizeGraphCanvas() {
  const box = $('#codexGraph');
  gDPR = Math.min(window.devicePixelRatio || 1, 2);
  gW = box.clientWidth; gH = box.clientHeight;
  if (!gW || !gH) return;
  gCanvas.width = gW * gDPR; gCanvas.height = gH * gDPR;
  gCanvas.style.width = gW + 'px'; gCanvas.style.height = gH + 'px';
  gCtx.setTransform(gDPR, 0, 0, gDPR, 0, 0);
}

/* Which nodes are "held" (mastered and not shaky) this frame, and the
   thin gold lines joining each to its nearest other held node — a real
   constellation drawn from your own progress, not decoration. Cheap to
   recompute per frame: the held set is always a small fraction of the
   graph. */
function heldConstellation() {
  const held = G.nodes.filter(nd => typeof isHeld === 'function' && isHeld(nd.id));
  const lines = [];
  const done = new Set();
  for (const a of held) {
    let best = null, bestD = Infinity;
    for (const b of held) {
      if (a === b) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < bestD) { bestD = d; best = b; }
    }
    if (best) {
      const key = a.id < best.id ? a.id + '|' + best.id : best.id + '|' + a.id;
      if (!done.has(key)) { done.add(key); lines.push([a, best]); }
    }
  }
  return { held, lines };
}

function graphDraw(t) {
  if (!G || !gCtx || !gW) return;
  const ctx = gCtx;
  ctx.clearRect(0, 0, gW, gH);
  drawStars(t);

  ctx.save();
  ctx.translate(gW / 2 + gCam.x, gH / 2 + gCam.y);
  ctx.scale(gCam.k, gCam.k);

  const neigh = gFocus ? graphNeighbors(gFocus) : (gHover ? graphNeighbors(gHover) : null);
  const focusMode = !!gFocus;

  for (const ed of G.edges) {
    const a = G.byId.get(ed.s), b = G.byId.get(ed.t);
    const dim = gMatch && (!gMatch.has(a.id) || !gMatch.has(b.id));
    const hl = neigh && neigh.has(a.id) && neigh.has(b.id);
    let alpha = 0.05 + Math.min(0.32, (ed.w / G.maxW) * 0.32);
    if (dim) alpha *= 0.2;
    else if (focusMode && !hl) alpha *= 0.06;
    else if (gHover && !hl) alpha *= 0.22;
    if (hl) alpha = Math.min(1, alpha * 3 + 0.28);
    ctx.strokeStyle = hl ? `rgba(232,200,138,${alpha.toFixed(3)})` : `rgba(196,206,222,${alpha.toFixed(3)})`;
    ctx.lineWidth = (hl ? 1.5 : 0.75) / gCam.k;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }

  /* The constellation of what you've actually claimed, laid over
     everything else — brighter than a mention edge, breathing gently
     under Subtle/Full, a plain gold line under Still. */
  const { lines: heldLines } = heldConstellation();
  if (heldLines.length) {
    const breathe = STILL() ? 0 : 0.14 * Math.sin((t || 0) / 1100);
    ctx.strokeStyle = `rgba(232,200,138,${(0.55 + breathe + (focusMode ? -0.35 : 0)).toFixed(3)})`;
    ctx.lineWidth = 1 / gCam.k;
    ctx.setLineDash([1 / gCam.k, 3.4 / gCam.k]);
    for (const [a, b] of heldLines) {
      const dim = focusMode && !(neigh.has(a.id) && neigh.has(b.id));
      if (dim) continue;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  const showLabels = gCam.k > 0.95;
  for (const nd of G.nodes) {
    const dim = (gMatch && !gMatch.has(nd.id)) || (focusMode && nd !== gFocus && !neigh.has(nd.id));
    const hlNode = nd === gHover || nd === gFocus || (neigh && neigh.has(nd.id));
    const col = areaColor(nd.e.area);
    const held = typeof isHeld === 'function' && isHeld(nd.id);
    ctx.globalAlpha = dim ? 0.13 : ((gHover || focusMode) && !hlNode ? 0.26 : 1);

    /* A held node breathes a soft halo — the same "ground claimed"
       language the constellation lines carry, on the star itself. */
    if (held && !STILL() && !dim) {
      const pulse = 0.5 + 0.5 * Math.sin((t || 0) / 900 + nd.x * 0.05);
      const glow = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, nd.r * (3 + pulse));
      glow.addColorStop(0, 'rgba(232,200,138,0.32)');
      glow.addColorStop(1, 'rgba(232,200,138,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r * (3 + pulse), 0, Math.PI * 2); ctx.fill();
    }

    ctx.beginPath();
    ctx.fillStyle = col;
    ctx.arc(nd.x, nd.y, nd.r + (nd === gHover || nd === gFocus ? 1.6 : 0), 0, Math.PI * 2);
    ctx.fill();
    if (held) {
      ctx.lineWidth = 1.3 / gCam.k;
      ctx.strokeStyle = 'rgba(244,239,230,0.75)';
      ctx.stroke();
    }
    if (nd === gSelected) {
      ctx.lineWidth = 1.8 / gCam.k;
      ctx.strokeStyle = '#f4efe6';
      ctx.globalAlpha = Math.min(1, (dim ? 0.15 : 1) + 0.3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const wantsLabel = !dim && (showLabels || hlNode ||
      (gMatch && gMatch.has(nd.id) && gMatch.size <= 14));
    if (wantsLabel) {
      ctx.font = `${11 / gCam.k}px Inter, sans-serif`;
      ctx.fillStyle = hlNode ? '#f4efe6' : 'rgba(244,239,230,0.68)';
      ctx.textBaseline = 'middle';
      ctx.fillText(nd.e.title, nd.x + nd.r + 5 / gCam.k, nd.y);
    }
  }
  ctx.restore();
}

function graphFit() {
  if (!G || !G.nodes.length || !gW) return;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of G.nodes) {
    minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
  }
  const w = Math.max(60, maxX - minX), h = Math.max(60, maxY - minY);
  gCam.k = clamp(Math.min(gW / (w + 90), gH / (h + 90)), 0.12, 2.2);
  gCam.x = -((minX + maxX) / 2) * gCam.k;
  gCam.y = -((minY + maxY) / 2) * gCam.k;
  graphDraw();
}

function graphZoomStep(dir) {
  if (dir === 0) return graphFit();
  gCam.k = clamp(gCam.k * (dir > 0 ? 1.25 : 1 / 1.25), 0.12, 4);
  graphDraw();
}

function graphRelax() {
  /* A rebuild makes new node objects — any reference to an old one
     (hovered, focused, dragged mid-relax) would point at a ghost. */
  gHover = gSelected = gDrag = null;
  showGraphCard(null);
  graphSetFocus(null);
  buildGraphData(true);
  gCam = { x: 0, y: 0, k: 1 };
  graphSettle(30);
  graphFit();
  toast('Letting the constellation settle');
}

/* ── The hover card ─────────────────────────────────────────────────────── */

/* The 2–3 chapters this one is most strongly tied to — real value in the
   card, not just a count. Same weight the layout itself uses, so "why is
   this here" has an answer one hover away. */
function topConnections(nd) {
  const mine = G.edges.filter(ed => ed.s === nd.id || ed.t === nd.id).sort((a, b) => b.w - a.w);
  return mine.slice(0, 3).map(ed => G.byId.get(ed.s === nd.id ? ed.t : ed.s).e.title);
}

function showGraphCard(nd) {
  const card = $('#graphCard');
  if (!card) return;
  if (!nd) { card.hidden = true; return; }
  const rec = topicRec(nd.id);
  const n = graphNeighbors(nd).size - 1;
  const top = topConnections(nd);
  card.style.setProperty('--pc', areaColor(nd.e.area));
  card.innerHTML = `
    <div class="gc-area">${esc(nd.e.areaLabel)}</div>
    <div class="gc-title">${esc(nd.e.title)}</div>
    ${nd.e.subtitle ? `<div class="gc-sub">${esc(nd.e.subtitle)}</div>` : ''}
    <div class="gc-meta">${esc(STAGE[rec.stage].label)} · ${n} connection${n === 1 ? '' : 's'}</div>
    ${top.length ? `<div class="gc-links">closest to ${top.map(t => esc(t)).join(' · ')}</div>` : ''}
    <div class="gc-hint">double-click to focus</div>`;
  const box = $('#codexGraph').getBoundingClientRect();
  let left = gMouse.x + 18, cardTop = gMouse.y + 18;
  if (left + 236 > box.width) left = gMouse.x - 250;
  if (cardTop + 128 > box.height) cardTop = Math.max(8, gMouse.y - 136);
  card.style.left = left + 'px';
  card.style.top = cardTop + 'px';
  card.hidden = false;
}

/* ── Hit testing & input ───────────────────────────────────────────────── */

function graphPointFromEvent(ev) {
  const rect = gCanvas.getBoundingClientRect();
  return { sx: ev.clientX - rect.left, sy: ev.clientY - rect.top };
}
function graphNodeAt(sx, sy) {
  const wx = (sx - gW / 2 - gCam.x) / gCam.k;
  const wy = (sy - gH / 2 - gCam.y) / gCam.k;
  let best = null, bestD = Infinity;
  for (const nd of G.nodes) {
    const d = Math.hypot(nd.x - wx, nd.y - wy);
    const hitR = Math.max(nd.r, 6 / gCam.k) + 2 / gCam.k;
    if (d <= hitR && d < bestD) { best = nd; bestD = d; }
  }
  return best;
}

function wireGraphEvents() {
  if (gWired) return;
  gWired = true;
  const c = gCanvas;
  let downX = 0, downY = 0, moved = false;

  c.addEventListener('mousemove', (ev) => {
    const { sx, sy } = graphPointFromEvent(ev);
    gMouse = { x: sx, y: sy };
    if (gDrag) return;
    const hit = graphNodeAt(sx, sy);
    if (hit !== gHover) { gHover = hit; showGraphCard(hit); graphDraw(); }
    else if (hit) showGraphCard(hit);
    c.style.cursor = hit ? 'pointer' : 'grab';
  });
  c.addEventListener('mouseleave', () => {
    if (gDrag) return;
    if (gHover) { gHover = null; showGraphCard(null); graphDraw(); }
  });
  c.addEventListener('mousedown', (ev) => {
    const { sx, sy } = graphPointFromEvent(ev);
    downX = sx; downY = sy; moved = false;
    const hit = graphNodeAt(sx, sy);
    if (hit) { hit.fx = hit.x; hit.fy = hit.y; gDrag = { node: hit }; }
    else { gDrag = { pan: true, sx, sy, camX: gCam.x, camY: gCam.y }; c.style.cursor = 'grabbing'; }
  });
  window.addEventListener('mousemove', (ev) => {
    if (!gDrag) return;
    const { sx, sy } = graphPointFromEvent(ev);
    if (Math.abs(sx - downX) > 3 || Math.abs(sy - downY) > 3) moved = true;
    if (gDrag.pan) {
      gCam.x = gDrag.camX + (sx - gDrag.sx);
      gCam.y = gDrag.camY + (sy - gDrag.sy);
      graphDraw();
    } else {
      /* The held node just follows the cursor — no physics runs while
         you're holding it, so it cannot jitter under your own hand. */
      gDrag.node.fx = (sx - gW / 2 - gCam.x) / gCam.k;
      gDrag.node.fy = (sy - gH / 2 - gCam.y) / gCam.k;
      graphDraw();
    }
  });
  window.addEventListener('mouseup', (ev) => {
    if (!gDrag) return;
    const wasPan = gDrag.pan;
    const draggedNode = wasPan ? null : gDrag.node;
    if (!wasPan) { gDrag.node.fx = null; gDrag.node.fy = null; }
    gDrag = null;
    c.style.cursor = 'grab';
    if (!moved && !wasPan) {
      const { sx, sy } = graphPointFromEvent(ev);
      const hit = graphNodeAt(sx, sy);
      if (hit) { gSelected = hit; graphDraw(); openDock(hit.id, 'read'); }
      else if (gFocus) { graphSetFocus(null); }   // empty space clears a focus
    } else if (draggedNode) {
      /* Moved it somewhere — one small, instant, local resettle so its
         former neighbours don't just sit overlapping it forever. Never a
         running loop: the same capped-and-cooling burst as the initial
         layout, just with less heat. */
      graphSettle(9);
    }
  });
  c.addEventListener('dblclick', (ev) => {
    ev.preventDefault();
    const { sx, sy } = graphPointFromEvent(ev);
    const hit = graphNodeAt(sx, sy);
    graphSetFocus(hit && hit !== gFocus ? hit : null);
  });
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && gFocus && $('#codexGraph') && !$('#codexGraph').hidden) graphSetFocus(null);
  });
  c.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const { sx, sy } = graphPointFromEvent(ev);
    const wx = (sx - gW / 2 - gCam.x) / gCam.k, wy = (sy - gH / 2 - gCam.y) / gCam.k;
    const dir = ev.deltaY > 0 ? -1 : 1;
    gCam.k = clamp(gCam.k * (dir > 0 ? 1.12 : 1 / 1.12), 0.12, 4);
    gCam.x = sx - gW / 2 - wx * gCam.k;
    gCam.y = sy - gH / 2 - wy * gCam.k;
    graphDraw();
  }, { passive: false });

  window.addEventListener('resize', () => {
    if ($('#codexGraph') && !$('#codexGraph').hidden) { resizeGraphCanvas(); graphDraw(); }
  });
}

/* ── The legend ─────────────────────────────────────────────────────────── */

function renderGraphLegend() {
  const el = $('#graphLegend');
  if (!el) return;
  const counts = {};
  for (const n of G.nodes) counts[n.e.area] = (counts[n.e.area] || 0) + 1;
  el.innerHTML = CODEX.areas.filter(a => counts[a.id]).map(a =>
    `<span class="gl-item" style="--pc:${areaColor(a.id)}"><i></i>${esc(a.label)} <b>${counts[a.id]}</b></span>`
  ).join('');
}

/* ── Entry point, called from renderAtlas ─────────────────────────────────
   `matchSet` is the id set already computed by the same filters (search,
   area, stage) the list view uses — the graph never invents its own
   notion of what "matches". Positions persist across filter changes and
   across leaving and returning to the room; only a genuine change in the
   chapter set (a folder scan) reseeds the layout. */
function renderGraphView(matchSet) {
  gCanvas = $('#graphCanvas');
  if (!gCanvas) return;
  gCtx = gCanvas.getContext('2d');
  const first = !G;
  gMatch = matchSet;

  buildGraphData();
  if (gNeedsSettle) {
    /* A rebuild (a folder scan added or removed a chapter) makes new
       node objects — any old reference would point at a ghost. */
    gHover = gSelected = gDrag = null;
    graphSetFocus(null);
    showGraphCard(null);
  }
  if (!gStars) seedStars();
  wireGraphEvents();
  resizeGraphCanvas();
  renderGraphLegend();
  /* Only a genuine (re)build asks for a settle. A search keystroke or an
     area chip re-renders this on every change — reheating and rerunning
     the layout each time would undo wherever you'd dragged things, on
     every letter you typed. */
  if (gNeedsSettle) graphSettle(30);
  if (first) graphFit();
  graphDraw();          // paint immediately — the twinkle loop's first tick isn't instant
  graphTwinkleStart();
}
