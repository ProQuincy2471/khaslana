# KHASLANA

A private study workspace for the ENARM — **September 28–30, 2026**.

No build step, no dependencies, no network. Everything you write is stored in that
browser's `localStorage`.

**Double-click `abrir.command`.** It serves the app at `http://localhost:8124` and opens it.

Opening `index.html` directly also works, but Chrome treats every local file as its own
origin, so the in-app chapter reader comes up blank — from `file://` chapters open in a
new tab instead. Same lesson as `how-do-i-tell-you`.

---

## The six rooms

| | | |
|---|---|---|
| **Dawn** | today | Countdown, Coreflame, the week so far, a month calendar of days lit, what's next on **The March**, the day's ember, **Today's Titan**, the constellation, Scratch |
| **Atlas** | chapters | Everything unsealed so far, searchable. **One click on a card opens the chapter in the side panel**; ⤢ reads it full width |
| **Path** | the road | Weeks remaining, ground held on each Path, trial log, the full constellation |
| **Chronicle** | journal | The gratitude diary rebuilt so questions never repeat, plus a month calendar, running stats and full-text search |
| **Embers** | voices | What your people told you, filtered by source or by tone, with a random draw |
| **Setup** | tools | The March template per weekday, exam date, reindexing, backups |

**⌘K opens the Gate** — one field that reaches everything: any room, any chapter (opens
straight into the reader), any shortcut, any unfinished block of the March (starts a timer
on it), plus actions — write today's Chronicle, log a trial, draw an ember, show what's
due for review, show what you marked shaky. Arrows to move, Enter to run.

Keys `1`–`6` jump between rooms. `/` jumps to search. `Esc` closes the reader, the dock,
or the Gate.

**The Glass** is a timer bound to a block. Hover any block on the March and press ◷, or
start one from the Gate. It runs in the rail with a ring, survives reloads and closed
laptops — it stores when the sand runs out rather than counting ticks — and when it
finishes it ticks the block for you, because doing the block was the point.

**Scratch** is a pad on Dawn for whatever shows up mid-day and shouldn't be lost.

**The weekday March is the real timetable**, not a generic study plan: waking at 5:15,
chess at 6:40, Clase AM Nutrición at 7, TRE at 8 on Monday–Wednesday, ENARMIND at 8:45,
Clase PM Nutrición at 1, and the ENARM stretch from four to nine.

That stretch is entered as **four blocks with real breaks between them**, not one
five-hour slab. Five hours is not a thing you tick; it is a thing you fail to tick and
then feel bad about. Four blocks with gaps is the same five hours and each one closes.
The morning Chronicle (gratitud, intención) sits at 5:45 and the evening one (cierre,
aprendizaje) at 10 — the journal has always had a morning half and an evening half, and
this is where they actually go.

Blocks share a `key` across the days they repeat on, so TRE is simply absent from
Thursday's and Friday's lists and editing it once edits all three.

**Changing the template is not enough, and the first pass got this wrong.** `dayMarch`
copies the template into `S.ritual` the first time you open a day and returns that copy
forever — a day is a *record*, not a view of the template. So migrating the template left
every day already visited on the old plan, and the new schedule appeared only on days
that had never been opened. It looked correct in testing (where the days had been cleared)
and wrong on the actual machine. The migration now rebuilds days too: the past is left
alone, and from today forward a day with nothing ticked is still only a plan, so it is
rebuilt. *Reset all to defaults* does the same across every untouched day rather than
today alone.

**Anything filed as `admin` survives the migration** — a saved templates array replaces the defaults
wholesale, so the new schedule has to be written into existing state rather than
inherited, and his own errands are carried across and re-sorted into place, along with
anything caught from the Scratch — neither was ever the template's to replace. The
version is read off the *saved* object, not the merged one: `s` has already been spread
over the defaults and always carries the current version, so the migration would never
have run.

**The month calendar opens any day.** Click a cell and The March shows that day —
forward or back — with **Back to today** in the card header. Future days show what the
template has planned for them, with a dot on the calendar so a planned Thursday doesn't
look identical to an empty one, and blocks caught from the Scratch are marked ✦.

The plan is computed *without* materialising the day. `dayMarch` writes the template into
state the moment you look at a day, so counting from state would have made every future
day you happened to click look different from the ones you hadn't. The calendar asks
`plannedCount` instead.

A day still ahead is a plan, not a record: its checkboxes are dashed and won't tick.
Letting them would put a lit day on the calendar for a Thursday you haven't lived yet,
which turns the whole month display into a lie. You can add to it and remove from it
freely — **Add a block** takes the same syntax as the Scratch, so `20:30 guardia` gives
you a servicio block at half past eight.

**Scratch reads itself for dates.** A note jotted between patients usually carries a when
inside it — `guardia el jueves 8pm`, `12/09 entregar papeles`, `mañana llamar al banco`,
`cita dentista 15 de septiembre 10:30 am`. Any line with a day in it surfaces under the
pad with the date, the hour and a guessed kind; **→** puts it on the March at that day and
time, **×** says it wasn't a date and stops it coming back. Lines with no date are left
alone, and the note itself is never edited or removed.

It is an offer, not an insert. A number in a clinical note is not always a date — `12/8`
could be a blood pressure — so nothing reaches the calendar without a tap. Both Spanish
and English are read: relative days (`hoy`, `mañana`, `pasado mañana`, `tomorrow`),
weekdays with or without `próximo`, `d/m` and `d-m-yyyy`, `15 de septiembre` and `Sep 30`,
and bare `el día 20`. Times understand `20:00`, `8pm`, `a las 6` and `de la mañana`; a
bare small hour is read as evening, which is what a note usually means. A dateless block
sorts to the end of the day rather than pretending to a time. The kind is guessed from
the words — `guardia` → servicio, `preguntas` → questions, `repasar` → review — and every
field is editable once it lands.

**One click to read.** It used to take two — the card opened a panel of metadata and the
chapter was a second click behind a button, which is two clicks too many for the thing
the room exists to do. Clicking a card now loads the chapter straight into the side panel;
the metadata and the stage controls moved behind a **Details** tab, because reading is the
common case and grading yourself on a topic is the rare one. The panel widened from
`clamp(300px, 30vw, 430px)` to `clamp(320px, 46vw, 760px)` to suit its new job, and below
1240px it overlays instead of pushing the grid.

**Zoom, on both readers.** `− 100% +` in the panel's tab row and in the reader bar, plus
plain `+`, `−` and `0` on the keyboard while a chapter is open — not `⌘+`, which belongs
to the browser. Eleven steps from 60% to 200%. One level, shared by the panel and the full
reader and remembered across reloads: the size that suits your eyes is not a per-chapter
decision.

It sets `zoom` on the chapter's own `documentElement` rather than `transform: scale()` on
the iframe, so the layout genuinely reflows instead of being magnified into a horizontal
scrollbar. That said, the chapters declare a minimum width of their own (~340px), so in
the **side panel** anything past about 110% still scrolls sideways — measured: no overflow
at 80% or 100%, 65px at 125%, 254px at 180%. The full-width reader has no overflow at any
step up to 200%, which is what ⤢ is for.

The iframe is only rebuilt when the chapter actually changes. Re-setting `src` on every
re-render would throw away your scroll position each time you advanced a stage — verified
by scrolling to 500px, advancing a stage, and confirming it stayed at 500.

**The constellation** (`assets/graph.js`) — a second way to see the Atlas, next to List in
the header: a force-directed graph of every chapter, in the spirit of Obsidian's graph view.
Obsidian's edges come from links you typed yourself; nothing here has that, so the graph
finds its own two kinds:

- **Mention** — chapter A's body genuinely contains chapter B's title as a whole word.
  "Choque" turning up inside *Taponamiento Cardíaco* is a real clinical relationship, not
  a coincidence. Weighted heavily.
- **Kinship** — A and B share a specific keyword in their titles or aliases, filtered
  through a stop-list of boilerplate ("tratamiento", "diagnóstico", "manifestaciones" are
  in nearly every chapter and would otherwise turn the graph into a hairball) and kept only
  when 2–6 chapters share it, so a coincidence isn't mistaken for a relationship. Weighted
  lightly.

Run against the real 83-chapter folder, this surfaces genuine clusters without being told
to: *Neumotórax — Hemotórax — Taponamiento Cardíaco — Choque — Trauma torácico* (chest
trauma, weights 8–10), *Chlamydia trachomatis — Conjuntivitis neonatal*, *Insuficiencia
Venosa Crónica — Trombosis Venosa Profunda*. 3 of 83 chapters end up with no edges at all,
which is correct — a graph where everything connects to everything has stopped meaning
anything, and Obsidian's own graphs have orphans too.

Nodes are sized by section-and-case count and coloured by specialty (the same palette as
the List cards).

**The layout is one instant burst, never a running loop.** The first version carried
velocity between frames — repulsion and springs both added impulses to `vx/vy`, damped by
a flat factor, and kept animating for as long as the tab was open. With 83 densely-linked
chapters (one node with 21 neighbours) that never actually settled: two forces arguing
over two different rest distances for the same pair just oscillate forever, and the
"stop once it's calm" check compared the total against a threshold a system in that kind
of argument never drops below. Every node trembled continuously, and a target you clicked
had usually moved by the time the click landed — you couldn't read the graph or use it.

It's [Fruchterman–Reingold](https://en.wikipedia.org/wiki/Force-directed_graph_drawing)
now instead: no velocity carried between steps, just a force converted straight to a
displacement, capped by a "temperature" that cools every step toward zero
(`assets/graph.js`, `graphStep`/`graphSettle`). A system that can only move less over time
cannot oscillate — it has nowhere to put the energy. ~350 steps (cooling from 30px down
to under 0.01px of allowed movement per step) runs synchronously in a few milliseconds
even at n≈100, so the graph opens already arranged and dead still, the way Obsidian's own
graph does — it doesn't animate into existence, it just *is* arranged, and only moves in
direct response to your hand on it. Verified: sampling every node's position 1.2 seconds
after opening showed **zero drift** at any node.

**Drag** a node and it tracks the cursor directly — no physics runs while you're holding
it, so it cannot jitter under your own hand (verified: a neighbouring node's position was
provably unchanged for the whole duration of a drag elsewhere in the graph). Releasing
triggers one small, instant, local resettle (the same capped-and-cooling burst, just
cooler) so former neighbours don't end up sitting on top of it — verified stable again
immediately after. **Drag** empty space to pan, **scroll** to zoom, **click** opens the
chapter in the side panel — verified a click-with-no-movement opens the dock and a
click-that-was-actually-a-drag does not. **Hover** shows a peek card (area, title,
subtitle, stage, connection count) and brightens the node's direct neighbours while
dimming the rest of the graph, the way Obsidian's own hover-highlight works.

The same search, area and stage filters as the List apply here too — dimming rather than
removing, since an edge crossing out of the current filter is still context worth seeing.
Both views now read that filter from one shared `filteredTopics()` rather than the grid
computing it privately, so "matches" means the same thing in both places by construction.
Filtering **never reheats the layout** — a search keystroke redraws with new dimming only;
verified typing a query moved every node by exactly zero. Only a genuine chapter-set
change (a folder scan) or **Reflow** asks for a fresh settle.

**Positions persist.** `buildGraphData()` is memoized against a signature of the chapter
set and only reseeds when that set actually changes — a filter change or a visit to
another room and back leaves everything exactly where you put it.

**Each specialty has a fixed home, and that's what makes Reflow mean something.** The
first version had repulsion and edge-springs and nothing else — no force in the whole
system knew that two Pediatría chapters were "the same kind of thing", so a settle just
scattered them wherever the physics happened to land, areas interleaved with each other,
and pressing Reflow reshuffled the same tangle into a differently-shaped tangle. Every
specialty now gets a fixed anchor point on a ring around the centre (bigger areas get a
wider wedge — Pediatría's 29 chapters and Farmacología's 1 aren't given equal room), and
every node is pulled gently toward its own area's anchor, deliberately weaker than a real
mention edge so a chapter that genuinely belongs to a cross-specialty cluster — the
chest-trauma group spanning Cirugía, Urgencias and Infectología — can still be pulled out
of its home wedge by an actual connection. Grouped by default, not grouped by force.

Measured, not eyeballed: nearest-neighbour purity (is the closest other chapter to a given
one in the same specialty?) went from what random placement would give by chance — **24%**,
computed from the actual area sizes — to **78%** after a settle. Reflow now visibly does
something, too: scrambling every position by up to ±1000px and pressing it brought purity
from 22% back to 82%, restoring the same recognisable regions rather than producing a new
random tangle. The first version's repulsion also never faded with distance, which is what
let a handful of nodes drift thousands of pixels out on a single thin thread — a repulsion
cutoff (nothing pushes past ~240px) means only genuinely nearby nodes contest space, and
distant clusters are held apart by their anchors instead of by force alone.

**The room is called the constellation, and now it looks like one.** A field of small
stars sits behind the graph, in screen space rather than world space — they never pan or
zoom with the map, so they read as sky rather than as part of it. They twinkle on a slow
sine, and it's the one thing in the room allowed to loop continuously: the twinkle never
touches a node's position, so it carries none of the risk the old velocity-based physics
did. Verified directly — sampled every node's position across 1.2 seconds *with the
twinkle loop actively running*, and drift was 0.0000 at every one. Still mode paints the
stars once and never loops; leaving Atlas stops the loop entirely (`graphPause` now has
something to actually pause again).

**Ground you've claimed draws its own constellation.** Every chapter marked mastered
breathes a soft gold halo, and each is joined to its nearest other mastered chapter by a
thin dashed gold line — a real map of what you've learned, not a metaphor left unbuilt.
Computed fresh each frame (cheap: the mastered set is always a small fraction of the
graph) rather than cached, so marking something mastered from the side panel updates the
sky the moment you close the dock.

**Double-click a chapter to focus it.** Everything outside it and its direct connections
drops to near-invisible — edges to 6% opacity, other nodes to 13% — so you can actually
read what a genuinely busy hub like *Choque* (21 connections) connects to, instead of
squinting through the whole mesh. A pill at the bottom names what's focused with a **Clear**
button; **Esc**, clicking empty space, or double-clicking the focused chapter again all
back out the same way. Rebuilding the graph (a folder scan, Reflow) clears any focus first
— the old node object it pointed at won't exist after a rebuild, and holding a stale
reference across one was the kind of bug that only shows up the second time you touch it.

**The hover card names what a chapter is closest to**, not just how many connections it
has — up to three titles, ranked by the same edge weight the layout itself uses, so "why
is this chapter here" has an answer one hover away without opening it.

**The specialty is said, not implied.** The colour rail on a card went from 2px at 55%
opacity to 5px at 90% with a glow, the card carries a wash of its area's colour, and the
area is now spelled out on the card with a matching dot. A hue on its own is not a label
when there are eight of them.

Making the rail loud exposed the palette behind it: Cirugía `#f0857a`, Urgencias `#ff7a5c`
and Infectología `#f2803c` were three warm corals inside thirty degrees of hue, with
Ginecología's rose right behind — and those four are most of the Atlas. The ten specialty
colours are now walked around the wheel, with the two largest areas at opposite ends.
Checked by CIE76 ΔE rather than by hue angle, because hue alone lies: Salud Pública and
Urgencias sit 1° apart and are obviously different, since one is a desaturated neutral and
the other a vivid amber. The closest pair of areas actually in the Atlas is now **ΔE 33**,
against a just-noticeable threshold of about 2.3.

The side panel carries the same colour down its edge, so the
panel and the card you opened it from read as the same object.

**Reading a chapter.** "Read" opens it full-screen inside Khaslana, with a bar carrying
the chapter's Path colour, its state (click to cycle) and a new-tab escape. Chapters are
served through the `codex/` symlink, which the indexer rebuilds every run — so a relative
path works identically over `http://` and `file://`.

**Blocks repeat across days.** Every block carries a key shared by all the weekdays it
appears on, so the row in Setup has seven day toggles: switch a block on or off any day,
and edit it once to change it everywhere it repeats. Nine kinds instead of four — *deep
study, questions, review, servicio, body, rest, mind, people, admin* — each with its own
colour, so the March reads as a shape rather than a list. Only *deep study*, *questions*
and *review* count toward the Coreflame.

**The March** is written as the *shape* of a block, not a quota. You will not have
exactly sixty questions on a given Tuesday, and a template that lies to you is a template
you stop ticking. Setup → *Reset all to defaults* pulls the current wording back (and
rebuilds today too, unless you've already ticked something).

---

## The rail

**The rail icons went through three designs.** Attempt one gave each aspect a completely
unrelated silhouette per room — Khaslana's Dawn was a sun, Wanderer's was a
wind-triskelion, Alatus's was a flower. Attempt two fixed the *shape* per room instead
(Dawn is always a sunrise, Atlas is always a globe) and let only the *texture* inside vary
by aspect, on the theory that a nav icon is read by outline before it's read by lore. True
as far as it went, and it made three characters share one figure with different trim —
which read as *less* personal than eighteen unrelated shapes had, not more.

Eighteen distinct figures again (`assets/emblem.js`, `sgKDawn` … `sgXSetup`, one function
per room per aspect) — but this time each is a small, confident read of that *character's
own big room emblem* below, rather than invented separately from it. Khaslana's Path icon
is Destruction's split ring and inverted rhombus, at icon scale; Alatus's Atlas icon is
the same karst-and-moon horizon as the 200px figure. The nav icon and the big emblem are
the same referent at two sizes now, which is what keeps eighteen genuinely different
shapes from reading as eighteen unrelated design languages — not a shared outline, but a
shared *source*.

Two real bugs came out of building the texture-only version and stayed fixed going into
this one, both checked with `getBBox()` rather than assumed: an annulus drawn as one
`band()` sweeping nearly the full 360° rendered as a sliver a tenth of a pixel tall —
`ring()` draws it as two honest semicircles instead — and the shared `flame()` primitive,
used bare and symmetric, reads as a raindrop rather than fire at icon scale. A second,
smaller `lobe()` offset to one side of the flame's body is what breaks the teardrop
symmetry, on both the Embers nav icon and the big Coreflame emblem it's drawn from.

## The big emblems

**Boosted, not redrawn.** Every room emblem already carried real, specific detail —
`emEmbers` has twelve rhombi for twelve Titans, `wAtlas` has a bracket around the bough
that was erased, `wPath` has five rings with the last one left open. None of that was the
problem. The opacities were tuned for a 200px figure looked at directly, and almost
everywhere that figure is actually *seen* — a 44px medallion in Setup's legend, a
watermark sitting behind other content at 0.3 container opacity on top of that — those
same values compound down to single digits. A stroke at 0.3 opacity inside a 0.3-opacity
watermark is 9% visible. The detail was never missing; it just never crossed the threshold
of being seen at the sizes it's actually shown at. `boost()` in `wrap()` lifts the whole
opacity curve — faint hairlines gain the most, the two or three already-strong strokes per
figure gain the least — measured on `emDawn`: minimum opacity across its twenty strokes
went from roughly 0.2 to 0.5, average from somewhere in the 0.4s to 0.81.

**A second ring, between the frame and the centre.** The shared `frame()` sits at r≈92;
what a room actually *means* mostly lives at r≈40–70. That gap was bare canvas on most of
the eighteen — visibly detailed at the centre, visibly empty around it, however rich the
construction underneath. `innerRing()` adds one more graduated band into that gap, radius
and tooth-count free per call so eighteen emblems don't all wear an identical second dial,
and the three "broken ring" emblems (`emPath`, `wPath`, `xPath` — Destruction, the names
still open, karmic debt) get a matching gap in their inner ring rather than a full one, so
the second layer doesn't contradict the point of the first.

**`emSetup` was Wanderer's function wearing a Khaslana name.** Renamed to `wSetup` — no
behaviour change, but the old name was actively misleading about which aspect it belonged
to, exactly the kind of confusion that makes "did we forget to personalize this one"
plausible even when the emblem itself was fine.

**All eighteen figures got real, structural detail on top of the boost**, not just
brighter strokes. The first pass only touched the four Jordan named as reading thin —
`wAtlas` (the tree), `wChronicle` (the Plume), `xChronicle` (the yaksha mask), `xEmbers`
(the polearm) — on the reasoning that the other fourteen were already dense enough. Wrong:
next to those four, the other fourteen read as flat by comparison even though each one was
individually fine, and "some emblems got attention and some didn't" is exactly the kind of
inconsistency that makes a whole set look unfinished. Second pass brought the remaining
fourteen up to the same order of density, each addition specific to what that room's figure
actually is rather than a generic pass of "add more lines":

- **`wAtlas`** (tree) — sixteen leaf-lobes around the canopy, bark ticks, five boughs each
  with a sub-twig and its own leaf. 27 → 66 elements.
- **`wChronicle`** (Plume) — barbs as drooping quadratics with an afterfeather layer and a
  spine groove. 24 → 45.
- **`xChronicle`** (yaksha mask) — ridge lines and grooves per horn, lacquer cheek swirls,
  nostril flares, chin marking. 18 → 38.
- **`xEmbers`** (polearm) — fuller grooves either side of the midrib, a knotted streamer
  off the collar. 24 → 33.
- **`emDawn`** (horizon) — a ticked rim on the sun's disc, a second interleaved ray layer,
  a low uneven ground silhouette instead of a bare line, six stars in the sky above it.
  23 → 48.
- **`emAtlas`** (armillary) — a third meridian, degree ticks along the equator, a coastline
  sketched onto the sphere, a horizon ring the wandering rings turn inside, crossbars at
  both poles. 19 → 37.
- **`emPath`** (Destruction) — a second, inner ring cracked at the same break, a closer
  layer of debris, ticks along the surviving arcs, three satellite rhombi at shard tips.
  19 → 29.
- **`emChronicle`** (two names) — a nested second pair of crescents, ticks along the shared
  axis, a smaller echo of each rhombus pair, two bridging arcs between the crescent tips.
  17 → 33.
- **`emEmbers`** (Coreflame) — spokes tying each Titan's rhombus back to the vessel, a
  third inner wall, a pedestal, two side licks off the main flame, three drifting embers.
  25 → 45.
- **`emScepter`** (Setup) — the actual scepter was never drawn, only the rings it runs;
  added a shaft through the whole figure, a crossguard, and a head with its own five ticks.
  19 → 29.
- **`wSetup`** (jingasa) — a woven rim on the brim, a vein and a tucked sepal per petal, a
  tooth on each spoke, a second inner ring at the centre. 27 → 51.
- **`wDawn`** (Anemo) — a third, fainter pass of each curl further out, a trailing wind-arc
  off every blade tip, scattered motion ticks between them. 17 → 33.
- **`wPath`** (the names) — a second parallel line, a smaller echo inside each closed ring,
  rungs bridging consecutive rings like ladder steps. 16 → 25.
- **`wEmbers`** (vessel) — an outer containment band with its own rim ticks, stress cracks
  off alternating spokes, a doubled dotted-absence ring at the centre. 25 → 31.
- **`xDawn`** (Qingxin) — a vein down each of the five main petals, a ring of unopened
  buds, a stem connecting the flower to the ground, strata lines on the peaks below it.
  28 → 40.
- **`xAtlas`** (karst) — a third, distant mountain range, strata cuts across the tallest
  peaks, a halo arc around the crescent, five stars in the sky. 14 → 24.
- **`xPath`** (karmic debt) — a fifth link added above the original four, wear-marks at
  each joint, two smaller weights flanking the main one. 20 → 28.
- **`xSetup`** (Morax's contract) — one more nested square closer to centre, edge ticks
  along the outer square, a diagonal brace from each corner rhombus back to the seal.
  18 → 40.

All eighteen checked programmatically after the edit: every function evaluated with no
`NaN` in its output and every coordinate inside the emblem's own canvas, not just eyeballed
in a screenshot.

**Path and Chronicle carry live information in their nav tag now**, not a fixed label.
Atlas and Embers already did (a chapter count, a voice count); Path said "the road" and
Chronicle said "journal" forever, which is a caption, not a status. Path now reads weeks
remaining, Chronicle reads "written today" the moment you put anything in today's entry —
recomputed on every room switch and, for Chronicle, live as you type, not just on load.

**"Walking as"** — the three-dot aspect picker had no label at all, which reads as a
settings toggle rather than as "this is who you are right now." One caption fixes it.
`.rail-flame`'s top border came out too: it made the Coreflame block look bolted onto the
seal and picker above it rather than the same identity block continuing downward.

**The mobile bottom bar** (below 900px, the rail becomes a fixed strip along the bottom of
the screen). Three changes:

- **Icons at 19–22px** instead of 15 — legible at arm's length rather than a smudge, and a
  real touch target: buttons now hold a 52px minimum height.
- **The active tab is a filled pill**, not a thin 2px line along the top edge. A hairline
  is easy to miss on a bar you glance at rather than read; a coloured rounded background
  behind the icon and label reads at a glance the way a phone's own tab bar does. The
  desktop rail keeps its original edge-mounted bar — this only changes the mobile strip.
- **`env(safe-area-inset-bottom)` padding**, on the bar itself and on the floating Glass
  timer above it. The iPhone home-indicator gesture area sits in exactly this spot;
  without accounting for it the bar reads as jammed against the edge and the gesture can
  overlap the tap targets. Evaluates to `0px` on anything without a notch, so it costs
  nothing there.

## The second pass — thirteen rebuilt from the ground up

The enrichment pass above added detail *inside* each emblem's existing composition — more
lobes on the same canopy, more grooves on the same blade. Jordan's next round of feedback
was sharper than "add more": five emblems earned small tuning, and the other thirteen
needed a genuinely different construction, not the same skeleton with extra strokes on it.
So thirteen got rebuilt — same referent, same shared `frame()`/`innerRing()` dial that
makes the eighteen read as one set, but a different compositional idea underneath:

- **`emPath`** — was a split ring with shards. Now a hexagonal tomb lid, cracked open, with
  fractures running clean through the whole dial and two broken chain links wrapped around
  it. Irontomb is half the referent and was never actually drawn as a thing before, only
  implied by a floating rhombus.
- **`emChronicle`** — was two facing crescents. Now two wedges, one dropping from the top
  and one rising from the bottom, meeting at a single point at the seam — one shape cut in
  half and mirrored, closer to what "one construction and its mirror" means than two
  separate circles ever was.
- **`emScepter`** — was four open recursive rings. Now a hexagonal cut gem in three facet
  layers, held by four prongs on a short pedestal — the Scepter's recursion reads as facets
  meeting at a vertex, and the instrument finally has an actual setting instead of a shaft
  drawn through the whole page.
- **`wAtlas`** — was a literal canopy-trunk-roots tree. Now a symmetric binary branching
  diagram, three levels of forks with a node-rhombus at each one — Irminsul is a *record*
  before it's a tree, so the figure reads as a data structure now, with the erased entry
  as a cut branch and a struck-out bracket instead of a missing bough.
- **`wPath`** — was five rings up a diagonal line. Now a true Archimedean spiral, tightest
  at the centre where the newest name is still being written — the names were never worn
  in a straight line.
- **`wChronicle`** — was one quill with barbs. Now a fanned plume of seven blades opening
  from a shared base — the Plume of Luxury is an ornament on a headdress, not a single
  found feather.
- **`wEmbers`** — was three concentric full rings. Now six wedge plates with real gaps
  between them, each braced back to a hollow centre — a shell in pieces, since nothing was
  ever poured into it whole.
- **`wSetup`** — was concentric rings with lotus petals laid on top. Now an actual two-
  direction weave of chords filling the disc, the lotus reduced to a small mark at the
  crown — a jingasa is plaited straw before it's a stack of dials.
- **`xDawn`** — was a five-lobe flower. Now a faceted six-point crystal star with straight
  facet edges — Qingxin grows where the air is cold enough to cut, so the figure reads as
  ice more than petal.
- **`xPath`** — was a vertical chain with a weight hanging off it. Now a radial net — three
  concentric polygons tied by spokes with the weight caught inside — karmic debt binds from
  every direction, not from above.
- **`xChronicle`** — was a face built from cubic curves. Now the same mask rebuilt entirely
  from straight facet edges — chevron brows, diamond eyes, a faceted jaw — a Nuo mask read
  as a cut seal wants a harder hand than a sculpted one.
- **`xEmbers`** — was one weapon standing at rest. Now three blades rotated 120° apart
  around a centre point, the wind-arc each one cuts through its own swing — *Bane of All
  Evil* is what the polearm does, which is three strikes around a point, not a shaft
  standing still.
- **`xSetup`** — was nested rotated squares. Now a twelve-tooth radial seal with six chords
  binding opposite teeth together — Geo's contracts are sworn and sealed, and a seal is a
  rosette of teeth, not a stack of rotated frames.

**Five got small tuning instead of a rebuild** — the composition already worked and didn't
need reinventing: `emDawn` (ground relief deepened slightly, stars re-spaced), `emAtlas`
(the horizon ring's tilt and tick density adjusted), `xAtlas` (the moon and its halo moved
off the tallest peak, stars re-spaced around it). Two got a partial rework — enough to fix
a specific weak spot without touching the rest: `wDawn` (the loose trailing wind-mark
replaced with a genuine three-arc spiral streak per blade, motion ticks pulled tighter to
centre) and `emEmbers` (the flat trapezoid pedestal rebuilt as a two-tier stand, the side
licks changed from parallel small flames to flames that actually curl off-axis).

All eighteen re-verified the same way as the first pass — every function evaluated
programmatically for `NaN` and out-of-canvas coordinates, zero found — plus a full visual
pass through a standalone comparison page (`emblems-preview.html`, not part of the app
proper) rendering all eighteen live from `assets/emblem.js` side by side by aspect.

## The third pass — twelve more, named one at a time

The second pass rebuilt thirteen emblems on spec, but "different skeleton" turned out not
to be enough on its own — several of the new constructions were legitimately unrecognizable
("no se parece a nada," "no me dice nada"), which is a different failure than "reads as the
same old thing." Jordan went through the comparison page and named exactly which ones
didn't land, several with a reference for what should replace them. That precision is what
made this pass fast to act on — no guessing at what "better" meant.

**One was a real bug, not a design complaint.** `crescentMoon()` swept *both* edges of the
crescent the long way round (`large-arc=1` on both arcs), which is why `xAtlas`'s moon read
as lopsided — two arcs both bowing the "long" direction fight each other into an asymmetric
lens instead of converging into a clean sliver. Fixed to the standard crescent-icon
construction: outer edge swept large (`1,1`), inner edge swept short (`0,0`) through the
same two tip points, letting SVG solve the inner circle's centre rather than guessing at an
ellipse radius. Only the shared helper changed; `xAtlas`'s karst-and-crescent composition
was never the complaint.

**Eleven got rebuilt again, each toward a specific note:**

- **`xDawn`** — the faceted crystal star from pass two "didn't transmit anything." Back to
  a bloom, but built with actual depth this time: three layers of petals (back row peeking
  between, main row, a slightly-rotated front row), veined, with stamens at the centre and
  two closed buds on their own stems. A flower needed to look like a specific flower, not
  a hexagon.
- **`wAtlas`** — the binary-tree diagram "no se parece a nada." Back to a literal tree, but
  the third construction of it this project has had: seven limbs across three tiers (the
  top-right erased), each forking once before ending in an actual leaf *cluster* — three to
  four overlapping lobes at different angles, not one lobe per branch tip — plus full bark,
  a six-root system, and small rhombi drifting free near the canopy for the records
  Irminsul keeps but doesn't show. Pushed past 100 elements, since this was the one Jordan
  explicitly said could go that far.
- **`emPath`** — the hexagonal tomb from pass two had a lid, a seam, seven cracks, two
  chain links and a rhombus all fighting for attention at once ("mezclados... no se
  entiende nada"). Rebuilt down to one idea drawn cleanly: a hexagonal seal split along a
  single jagged break into two halves that have shifted apart, rivets at the surviving
  vertices, the inverted rhombus sitting in the gap where the halves used to meet.
- **`wPath`** — the single spiral track read fine but thin; Jordan asked for the
  galaxy/spiral idea pushed with real density. Rebuilt as three logarithmic spiral arms
  winding from a bright, rayed core, star-dust scattered along each arm with a small
  seeded-random generator so the scatter still traces the spiral rather than filling at
  random, and the five names riding the longest arm as larger marks inside the field.
- **`xPath`** — the polygon net "no dice nada." Rebuilt as what karmic debt actually looks
  like in the story: five short chains, one from each yaksha's own point around the rim,
  all pulled down and knotted into a single weight at the bottom. Five sources, one burden,
  not an abstract web.
- **`emChronicle`** — the wedge/hourglass construction from pass two didn't read as
  anything. Rebuilt around an S-seam splitting one disc into two matched halves, each
  carrying a small mark of the other inside it — the actual "two mirrored halves" image,
  built honestly from this set's own arc-and-rhombus vocabulary rather than tracing a
  yin-yang outline.
- **`wChronicle`** — the seven-blade fan read as an abstract starburst, not a feather.
  Back to one feather — the actual object — but built from the set's own tapered-stroke
  primitive (`barb`, the same one the rail sigils use) instead of plain lines, so the spine
  and all sixteen barbs a side genuinely swell and taper rather than reading as wire.
- **`xChronicle`** — asked for directly: a real Oni mask, "muy realista y detallada,"
  100+ elements. Back to full organic curves rather than the angular facets from pass two:
  bulging brow, a ridged and grooved horn pair with growth rings, folded ears, flared
  nostrils, bared fangs over a visible tooth row, forehead and cheek wrinkles, temple hair
  tufts, painted cheek marks, and a scatter of pore-marks across the skin for surface grain.
  106 elements, verified.
- **`xEmbers`** — the three-blade pinwheel read as "una wind turbine," which is the opposite
  of a weapon someone carries. Back to the polearm at rest, but a genuinely more ornate
  build than either earlier version: an engraved dragon-line curling up each face of the
  blade, a lugged guard instead of a plain collar, a real wrapped-cord grip texture down the
  haft, and a faceted, weighted butt cap.
- **`wSetup`** — the woven crosshatch "no dice nada." Rebuilt with actual dimension instead
  of a flat mandala: a tilted brim ellipse, twelve curved ribs rising to an apex, weave
  ticks along the ribs, and — the part that was genuinely missing before — a chin cord
  hanging free from the brim and knotted below. Nothing reads as a worn hat without
  something hanging off it.
- **`xSetup`** — the twelve-tooth rosette "no dice nada." Rebuilt as a literal chop: a
  square carved stamp-face with a bold symmetric glyph, a twisted-rope border standing in
  for a plain circle, corner reinforcement cuts, and a handle above to hold it by — the
  object that actually seals a contract, not an abstract rosette.

Two of the rail sigils (`sgWPath`, `sgKChronicle`) were also rebuilt to match — a mini
tapered spiral and a mini S-seam respectively — since the nav icon is meant to be a small
read of the same big emblem, and the old ones (rings-on-a-line, facing crescents) no longer
matched what they pointed at. The rest of the sigils were checked against their new big
emblems and left alone where the small-scale read still held.

## The fourth pass — ruling out categories, not just shapes

By the third pass, several emblems had been rebuilt twice and still weren't landing — which
meant the problem wasn't the specific construction, it was the *category* of construction.
A tree drawn two different ways is still a tree; if "tree" itself wasn't reading, a third
tree was never going to fix it. Jordan's instruction for this pass was explicit: no reuse of
anything from a previous version of these seven, full stop. So each one got a different
*kind* of object, not just a different drawing of the same kind:

- **`emPath`** — every version so far had been some shape broken into two matched halves
  with a rhombus in the gap (a split ring, a split hexagon). Destruction isn't a container
  that came apart, it's a single blow, so this is an impact crater instead: one strike
  point, sixteen fractures radiating outward at seeded-random angles and lengths — denser
  and shorter near the centre, sparser and longer further out, a third of them forking
  partway along the way real fractures do — with debris rhombi thrown clear at the ends of
  the longest cracks. Nothing here is two pieces of anything.
- **`wChronicle`** — two feather attempts (a fan, a single quill) had both failed, so a
  third feather was ruled out on principle. The Plume of Luxury is worn as a hair ornament,
  not carried as a found quill, so this drops birds entirely: a kanzashi pin, straight and
  sharp, a cluster of small jeweled petals at the head instead of blades, and three strings
  of dangling beads (bira-bira) swaying at different lengths and angles, the way they
  actually hang unevenly off a real hairpin.
- **`wAtlas`** — a literal tree and an abstract branching diagram had both failed, so trees
  were ruled out as a category, not just as a specific drawing. Irminsul as a record before
  it needs to look organic at all: a standing stone tablet, tapered like a real stele, ruled
  with eighteen rows at uneven lengths the way carved text actually comes out, with five
  consecutive rows physically chiselled into a jagged blank gap — the entry rewritten so it
  had never existed — marked by the same struck-out bracket this project has used for that
  idea since the first pass.
- **`xPath`** — three chain-based attempts (a hanging weight, a polygon net, five chains to
  a knot) had all used linked-loop geometry. Karmic debt as a cangue instead: a wooden yoke
  locked frontally around a neck-hole, wood grain broken correctly where it crosses the
  hole, a hinge at one end and a driven peg at the other, rope lashing, and two weight-chains
  hanging off the underside for the burden that's still there — just worn now, not carried.
  Not one link anywhere in the main construction.
- **`xChronicle`** — kept as the Oni mask, since that direction was confirmed as right; the
  note this time was to clean it up. Cut the pore-texture scatter and a duplicate wrinkle
  pass — both added late purely to push the element count past 100 rather than because they
  carved anything real — and rebuilt the eye lids around an asymmetric curve (narrower and
  lower at the inner corner) instead of a mirrored lens, since a genuinely angry eye isn't
  symmetric. 90 elements, still dense, no longer padded.
- **`xEmbers`** — the polearm had been drawn three separate ways (ornate, a pinwheel, ornate
  again) and rejected each time as "no me gusta la lanza." Ruled off weapons entirely: Bane
  of All Evil is what it *does* — wards off evil — so the object that shows that on sight is
  an ofuda, a paper exorcism talisman. Notched, pointed top; a bold zigzag warding-glyph down
  the centre with annotation rungs crossing it; an offset red-seal stamp; two paper streamers
  folding in a zigzag off the bottom edge. No blade, shaft, or guard anywhere in it.
- **`xSetup`** — a carved chop and a radial rosette are the same underlying idea (a mark
  stamped on something) told two ways, which is why the chop still didn't communicate
  anything on its own. The contract itself, literally: an unrolled scroll with cylindrical
  rolled ends, seven uneven ruled rows between them, a wax seal pressed at the bottom edge
  with drip marks and a trailing cord. Nothing square, nothing carved — a document.

Eight rail sigils (`sgKPath`, `sgWAtlas`, `sgWChronicle`, `sgXPath`, `sgXEmbers`,
`sgXSetup`, plus the two already updated in the third pass) now match their big emblem's
construction rather than an earlier version of it. All eighteen big emblems and all
eighteen sigils re-verified programmatically — zero `NaN`, zero out-of-canvas coordinates
— and checked visually through the same standalone comparison page.

## The look

Borrowed from **"How do I tell you"**, deliberately:

- **Instrument Serif** and **Inter**, both embedded as base64 so the page never
  needs the network. `assets/fonts.css` (SIL OFL).
- A **real sky**: 2,061 stars from the Yale Bright Star Catalogue, stereographically
  projected and drifting one full turn every four and a half hours. Colour comes from
  each star's actual B–V index. It pauses when the tab is hidden — a black canvas on
  return is that, not a failure. The canvas sits *above* the two ambient lights, not
  below: underneath them the faint stars washed out entirely on a large screen. In Still
  mode there is no draw loop, so it paints once now and once more on the next frame —
  measuring a canvas that is still 0×0 was leaving an empty sky forever. See **Motion**
  below for the sizing bug that kept it to a corner of the screen.
- A **live accent** that shifts per room and per Path, and an ambient light that
  follows the hour: cold before dawn, ember at dusk.
- The **dock** slides in from the right and *pushes* the content aside rather than
  covering it.

**The emblems are constructed, not drawn** (`assets/emblem.js`). The UI language of
Amphoreus — and of Genshin's menus — is built geometry: concentric rings, graduated tick
marks, rhombi, arcs that stop short of closing. It reads as precise rather than
illustrated, which is exactly why a sketched feather looked cheap and a compass figure
does not. Every figure is generated from parameters, so nothing is eyeballed.

**Eighteen emblems: six rooms × three aspects.** Every aspect gets its own complete set
drawn from that character's story — not Phainon's figures in a different colour. The
legend in Setup always shows the set you're currently wearing.

**Khaslana — Amphoreus**

| | |
|---|---|
| Dawn | The horizon and a sun that hasn't finished rising |
| Atlas | The armillary — Kephale's world, held up and ruled |
| Path | **Destruction.** Nanook's ring split and offset so it no longer meets itself, shards thrown along the break, an inverted rhombus at the core because Destruction points down. Deliberately not whole — Irontomb is born of the reconstruction itself |
| Chronicle | Two crescents on a shared axis: Khaslana and Phainon |
| Embers | The Coreflame — a flame in a vessel open at the top, twelve rhombi for twelve Titans |
| Setup | The Scepter, and the recursion turning inside it — rings that never quite close, each further round than the last |

**Wanderer — Scaramouche**

| | |
|---|---|
| Dawn | **Anemo.** Three blades turning out of a still centre: the element he ended up with, not the one he was built for |
| Atlas | **Irminsul**, with the branch he erased simply absent — an empty bracket where a record used to be |
| Path | **The names, worn in order.** Five rings ascending — Kabukimono, Kunikuzushi, Scaramouche, Balladeer, Wanderer. The last is drawn open, because it hasn't finished being written |
| Chronicle | **The Plume of Luxury** — Ei's parting feather, built from graduated barbs on a spine. Proof of identity as the Kabukimono, thrown away as Scaramouche |
| Embers | **The vessel** he was made to hold the Electro Gnosis in, and was refused. Containment complete, centre empty |
| Setup | The jingasa from above — the lotus on its crown, the puppet mechanism beneath |

**Alatus — Xiao**

| | |
|---|---|
| Dawn | **Qingxin**, five petals over a peak line. It only grows on the high peaks, which is where he is |
| Atlas | **Liyue's karst** under a night moon: the whole of the contract, and the night watch |
| Path | **Karmic debt.** Links that do not come apart, and the weight hanging off them — the toll that drove the other four yakshas to madness or death |
| Chronicle | **The yaksha mask**, after the Nuo opera masks it's based on: horns, angular eyes, the face put on to do the work |
| Embers | **The polearm** — Bane of All Evil — with five marks for the Five Yakshas, one still lit |
| Setup | **Morax's contract**: nested squares turned against each other, angular and binding, sealed at the centre |

The rest of the vocabulary turns too. The streak is the **Coreflame · days lit**, the
**walk · days gone**, or the **watch · nights held** — and the mark drawn beside it in the
rail is a flame, a turning wind, or a Qingxin that opens a petal at a time as the streak
holds. Today's chapter is **Today's Titan**, **Today's shadow**, or **Today's demon**.

**Only the graduated ring turns**, once every ten minutes, and the core stays still so
the figure stays readable. Three separate things had to be fixed to get there:

- Rotating the *whole* emblem meant you never saw a figure at all, only arcs sliding past.
- `vector-effect: non-scaling-stroke` on a rotating group makes the browser rebuild the
  stroke geometry every frame. The static core keeps it (it never moves, so it costs
  nothing); the ring gives it up and becomes a cheap composited transform.
- The reduced-motion block squashed `animation-duration` to `0.01ms` without also setting
  `animation-iteration-count: 1`. That does **not** stop an `infinite` animation — it makes
  it complete a full revolution every hundredth of a millisecond. If you have macOS
  *Reduce motion* on, that is what made the rings appear to spin wildly.

**Motion is a three-way setting, not a boolean.** A page cannot switch off the operating
system's *Reduce Motion* — the media query is read-only, by design — and the honest thing
to do about that is not "give up", which is what the first pass did: it left the emblems
frozen and the sky dead, and the only escape was turning the system setting off and
slowing the whole machine down for one app.

So the OS preference is now the **default** for a preference of Khaslana's own rather
than the verdict. Set it in Setup; it affects nothing outside this page.

| | | |
|---|---|---|
| **Match the system** | default | Reduce Motion on → starts at Subtle |
| **Still** | 0 paints/s | Nothing loops. One paint and done |
| **Subtle** | 8 paints/s | Everything moves, at a third of the amplitude, repainted eight times a second |
| **Full** | 61 paints/s | Every frame |

Those rates are measured, not estimated — instrumenting `clearRect` over one second gives
0 / 8 / 61. The throttle gates the **paint**, not the `requestAnimationFrame`: drawing two
thousand stars is the entire cost and a skipped-frame comparison is free, so Subtle is
about seven times cheaper than Full while still moving.

**The sky was never full-screen.** `#sky` had `position: fixed; inset: 0` and nothing
else. A canvas is a *replaced* element, so `width: auto` resolves to its intrinsic 300×150
instead of stretching between `left` and `right` — the box is over-constrained and `right`
is dropped. Worse, `resize()` writes the measured size back onto the attribute, so it
settled at that size rather than growing. The sky was a small patch in the top-left
corner: 106 lit pixels where there should have been 11,882. Adding `width: 100%; height:
100%` fixed it. This, not the z-index or the reduced-motion loop, is the larger part of
why the stars were missing in the browser.

**The turn is driven from JS, not from a CSS animation.** Stopping the rings outright
under reduced motion was the correct default and the wrong answer here — it left them
frozen, which is what "they don't rotate" meant. A ring at **0.6°/s** is drift, not
motion: you never catch it moving, you only notice an hour later that it isn't where it
was. So `spinRings` writes two custom properties, `--turn` and `--turn-slow`, five times
a second, and every ring on the page is a plain `transform: rotate(var(--turn))` that the
reduced-motion rules have no reason to touch. One style write drives all of them, and it
skips entirely while the tab is hidden.

**The Amphoreus sigils** (`sgDawn` … `sgSetup`). A second hand, used for Khaslana only.
The emblems above are instrument-drawn — compasses, graduated rings, everything closing
on a centre. These are cut: every stroke swells at its middle and comes to a thorn at
both ends, and terminals throw spurs past the joint instead of stopping at it. That taper
is the entire character of the mark and **a stroked path cannot produce it**, because a
stroke has one width for its whole length. Each is a filled figure instead — two
quadratic flanks bowing out from a shared pair of points (`barb`). More work per stroke,
and the only way it reads as inked rather than drafted.

| | |
|---|---|
| Dawn | The risen sun. The one mark in the set that is radially symmetric, because a sunrise is the only thing here arriving from every direction at once |
| Atlas | A world put inside a frame and read. The four sides overshoot their corners, which is what stops it reading as a box |
| Path | The balance — not justice, weight |
| Chronicle | The serpent that comes back round on itself: two hooks turning opposite ways |
| Embers | The vessel. A Coreflame is carried, never left in the open |
| Setup | The mechanism: a shaft, two crossbars, and the ring that turns it |

They replace the rail tabs when you're wearing Khaslana, and the other two aspects keep
the drafted icons — the ink hand belongs to Amphoreus. The **Coreflame mark** in the rail
is the same figure: `coreflameSigil` returns path data, the canvas fills it with `Path2D`,
and the rays lengthen as the streak holds — the diagonals only appear once it is
genuinely established. Sharing the path string is what stops the mark and the tabs from
drifting apart.

**A line in every room** (`data/lore.js`). Eighteen inscriptions per aspect — one per room,
rotating daily and keyed by room as well as date, so the six rooms never show the same
line on the same day. None of it is dialogue from either game; each is written from the
documented arc and aimed at the room it sits in, so the Atlas gets a line about gathering
and the Path gets one about distance. The brief was narrow on purpose: all three of them
got up again from something, and not one of them got up because they felt like it.

**The rail carries the person, not the app.** The heading reads **Phainon**, **Wanderer**
or **Xiao** depending on which register you're wearing. Khaslana is the name of the tool;
the name at the top is whoever you're walking as today.

**The ambient light belongs to the character too**, not just the hour. It used to be one
shared five-stage palette, which meant switching aspect changed the accents and nothing
else — the room looked identical. Now each aspect has its own hours and its own gradient
composition:

| | |
|---|---|
| **Phainon** | A fire out of frame, low and to the left, with the last of the sky in the opposite corner. Amphoreus runs on fire, so it is warm at every hour — even midday |
| **Wanderer** | Inazuma under a storm that never quite breaks. The light comes from above, cold, and there is no warm corner anywhere in it |
| **Xiao** | Liyue's peaks after dark, which is when he works. A jade mist along the bottom and one small moon high on the right — jade all day, with a single amber hour at dusk when the lanterns go up |

`--acc-2` is set in `applyAspect`, not only in Dawn. Switching aspect from inside the
Atlas used to leave the previous character's light on the walls.

**Nine kinds, nine colours you can actually tell apart.** The first palette had `service`
on `var(--cyan)` and `review` on `#7fd8e8` — the same colour twice — and `rest` and
`admin` were both desaturated blue-greys. They are now spread around the wheel: warm for
the work, blue for what is scheduled for you, green for the body, and the two neutrals
pulled apart, one cool and one warm.

**The hour is readable.** It was 8.5px uppercase mono in the faintest grey on the page,
which is no use to anyone glancing at a list to find out what is next; it is now 12.5px,
tabular, near-white, and the second loudest thing in the row after the block's own text.
The kind gets a filled 5px dot as well as coloured text — nine hues at 9px are hard to
place, and a solid dot reads far faster than a tinted letterform. Each row also carries
its kind down its left edge, so a day reads as a shape (a column of blue for the classes,
orange for the study stretch) before you have read a word of it.

`[hidden]` is only a `display: none` in the UA stylesheet, so any element the app gives a
display to ignores it — buttons are flex here, which is why **Back to today** stayed on
screen while genuinely hidden. There is now a global `[hidden] { display: none !important }`.

**The shortcuts carry drawn glyphs**, not initials — and not favicons, which would mean a
request to nine companies every time Dawn renders. They're line figures in the same
constructed language as everything else, matched by label so a shortcut saved before they
existed still picks one up. Anything the map doesn't know keeps its letter.

---

## The three aspects

Same workspace, three registers to walk it in. The picker sits under the name in the
rail. Switching one re-tunes the accent palette for **all six rooms**, the greeting, the
epigraph under it, the seal, and which voices come up first — because on different days
you need a different kind of company.

| | | |
|---|---|---|
| **Khaslana** | Phainon · Amphoreus | Ember and gold. *The long march to dawn.* The flame carried a long way, for people who will never know |
| **Wanderer** | Scaramouche · Kabukimono | Teal, blue and white — the palette his design took on after Irminsul. *The name comes after the walking* |
| **Alatus** | Xiao · Conqueror of Demons | Jade. *The watch nobody was asked to keep.* The last yaksha, paying a karmic debt no one is counting |

Alatus is anchored to the documented arc: *Alatus* means winged; he is the last of the
yakshas assembled to put down the dying curses of the Archon War; the karmic debt that
drove the others to madness or death is the one he alone still resists; he was enslaved
by an ancient god, freed by Morax, and has guarded Liyue since as repayment — from the
rooftops, refusing to be thanked. Original lines, no dialogue copied.

---

**The Chorus is split four ways** so each register is visible as itself: **Khaslana**
(the road), **Amphoreus** (the Flame-Chase — Titans, Coreflames, the recursions),
**The Wanderer** (acceptance and the other self — the puppet made and discarded, the
names worn in order, the Plume of Luxury carried and then thrown away, the erasure from
Irminsul), and **Alatus** (the solitary watch). 79 inscriptions in all. Original writing
anchored to researched lore; no dialogue is reproduced.

The Chronicle's two halves also change temperature: dawn runs warm, dusk runs teal and
white. That shift is lifted straight from the Wanderer's redesign after Irminsul, where
red and purple were traded for teal, blue and far more white. Letting go, said in colour.

And one thing that isn't borrowed: the **constellation**. Every chapter is a star.
Faint dots are unclaimed, rings are chapters you've opened, filled stars are ground you
hold — and the claimed ones join into a figure that grows as September gets closer.
Placement is dart-throwing with a minimum distance, seeded per chapter so the figure is
always the same one. Deliberately *not* Lloyd relaxation, which converges to a visible
grid.

---

## The folder is the source of truth

**Whatever is in `~/Desktop/All 101 ENARM/` is what you get.** Drop the Monday batch in,
reload, and they are there. If there are 23 files you see 23 chapters. There is no step
to remember.

How it works: the local server hands out a directory listing for `codex/`, so on every
load the app reads the folder, compares it against what it already knows, fetches only
the genuinely new chapters, and parses them in the browser using the same rules the Node
indexer uses — `assets/extract.js` is loaded by both, so they cannot drift. Parsed
chapters are cached in `localStorage` (about 10 KB each), so a chapter is only ever read
once. Delete a file and it disappears from the Atlas on the next scan.

Setup shows the live count — *23 in the folder · 23 loaded · 1 new* — with **Scan the
folder now** to re-check without reloading, and **Forget cached** to force a full re-read.

**Pre-building is optional.** `node scripts/index-codex.mjs` still exists and is worth
running after a big batch: it writes `data/codex-index.js` so the browser has nothing to
parse on load, and it rebuilds the `codex/` symlink if you ever move the source folder.

```bash
cd ~/Khaslana && node scripts/index-codex.mjs
```

Moved the folder?

```bash
node scripts/index-codex.mjs --dir "/new/path"
```

**One limit, stated plainly:** opening `index.html` from `file://` cannot list a
directory, so there the pre-built index is all you get and Setup says so. Run
`abrir.command` for the live scan.

Search covers titles, aliases, section headings and the full body text, and it is
**accent-blind** — `penicilina benzatinica` finds `penicilina benzatínica`.

---

## How the pieces behave

**The Coreflame** counts consecutive lit days backwards from today. A day is lit when at
least 60% of its *study* blocks are done — or, on a day you deliberately planned with no
study blocks, when you did what you planned. Rest days you meant to take don't break it.

**The March** materialises from the weekday template the first time you open a day.
Editing the template later only affects days you haven't opened yet; past days keep what
they actually were.

**The Chronicle** is written in **Spanish** — the interface stays English, but the
questions don't. It is easier to say something true in the language you think in.

Five decks, each its own panel: **Gratitud · Intención · Ancla · Cierre · Aprendizaje**.
185 prompts, shuffled and dealt without repeats until exhausted, then reshuffled. They
span the whole of a life rather than just what you're studying. `⟳` draws the next card.

The day splits into two halves — *Al despertar* and *Al cerrar el día* — and only one is
open at a time. Which one defaults by the clock; after 5pm it opens at dusk. Each header
carries its own count so you can see what's still owed.

**Chapter progress runs on two axes**, because one ladder never described real studying.

*Stage* — how far through it you are: `Untouched → Skimmed → Read → Studied → Drilled →
Mastered`. Click the chip on a card to advance one step, or jump straight to any rung
from the dock.

*Confidence* — whether it actually stuck: `Shaky · Okay · Solid`, the three dots. Click
the level you're already on to clear it.

They move independently, and that pair is the useful signal: **drilled but shaky** is the
most dangerous state there is, and it's invisible on a single ladder. *Ground claimed*
means studied-or-better **and not shaky**.

From those two, the Atlas derives **Due for review** on its own — a chapter goes stale
after 4 days if you marked it shaky, 10 if okay, 24 if solid. Today's Titan picks in that
order: anything shaky first, then whatever is fading hardest, then what you started and
left, then something unopened.

Old three-state data (`Unclaimed/In progress/Claimed`) migrates automatically the first
time each chapter is read.

**Shortcuts** — the row on Dawn opens whatever you keep reaching for. Editable in Setup:
name, URL, colour, and an optional **native app scheme**. Spotify (`spotify://open`) and
WhatsApp (`whatsapp://send`) ship with theirs, so those chips open the desktop app rather
than a browser tab — macOS asks permission the first time, then goes straight there.

The scheme is handed to the OS through a **throwaway hidden iframe**, not by following the
link. Letting the anchor navigate gives the whole tab to the URL handler and Chrome then
tears the page down — which is why Khaslana kept closing itself when you opened Spotify.

If an app isn't installed the click does nothing and the browser can't tell us, so every
chip with a scheme also carries a small ↗ on hover that opens the web version instead.
Add schemes for anything else you install.

Shortcuts saved before schemes existed are migrated on load — matched by name against the
defaults, and bare schemes from an early build (`spotify:`) are repaired. Nothing you had
configured is lost.

The monograms are drawn locally, so the page still makes no outbound requests of its own.

---

## The stale tab

Khaslana never navigates — Dawn, Atlas, Setup are all one page switched by JS, so a tab
left open for a day is still running whatever code loaded it, however many times the
files on disk have changed since. `serve.py` already sends `Cache-Control: no-store` on
everything, which was never the actual problem: no HTTP request happens at all until the
tab is told to make one, and nothing tells it to.

So the running page asks itself. Every 90 seconds — and once whenever the tab regains
focus — it refetches `assets/app.js` with `cache: 'no-store'` and compares the text
against what actually booted. A full-text comparison, not a length or a hash: the file is
a few hundred KB at most, and a real diff is the only check that can't coincidentally
agree on two different edits. Verified directly: appended a comment to `app.js`, called
the check function, watched the banner appear; clicked its button, watched the URL pick
up a cache-busting `?_r=` param and the newly-booted page's own fingerprint include the
appended line — confirmed the reload actually fetched the changed file, not a cached copy
of the same one.

**It never reloads on its own.** A silent reload while you're mid-sentence in the
Chronicle is worse than the staleness it would fix, so a change in the fetched text shows
a banner — pinned to the top, not a toast that fades — with **Reload now** and a dismiss.
Setup → **This tab** carries the same button for whenever you'd rather not wait for the
next check. Both call one `hardReload()`: `location.replace()` with a fresh query string,
because `location.reload()` alone can still be served out of some browsers' back/forward
cache, which skips the network entirely and would defeat the whole mechanism.

Setup → **This tab** also prints a `BUILD_STAMP` — hand-bumped in `app.js`, not generated,
since there's no build step to stamp it automatically. It exists because "does this look
more detailed to you" is a bad way to debug a caching disagreement: two people looking at
the same hairline SVG geometry can honestly disagree about whether it changed. A string
that either matches the one just written into the file or doesn't settles it in one
glance, no eyeballing required.

## Adding your own material

- **Embers** — add from the Embers room, or write them into `data/voices.js` so they live
  in the file and survive a cleared browser. What friends said counts double in the
  daily draw.
- **Prompts** — append to any list in `data/prompts.js`.
- **Backups** — Setup → Export. Do it now and then; `localStorage` is not forever.

## Files

```
index.html                 the shell
assets/app.css             styling
assets/app.js              logic
assets/canvas.js           the sky, the flame, the constellation
assets/fonts.css           Instrument Serif + Inter, embedded
data/codex-index.js        generated — do not edit
data/sky.js                real star catalogue
data/prompts.js            Chronicle repertoire
data/voices.js             Embers seed
scripts/index-codex.mjs    the indexer
```
