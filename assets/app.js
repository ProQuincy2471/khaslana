/* ===========================================================================
   KHASLANA — engine
   No dependencies, no build, no network. State lives in localStorage.
   =========================================================================== */

const BUILD = '2026.08.18-uxf1';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const CODEX   = window.KHASLANA_CODEX   || { entries: [], areas: [], sourceDir: '', generated: null };
const PROMPTS = window.KHASLANA_PROMPTS || {};
const SEEDS   = window.KHASLANA_VOICES  || [];

const STORE = 'khaslana.v1';

/* ── The Paths, and their lights ── */
/* Ten specialties, ten hues that have to survive being read as a 6px dot.
   The first set had Cirugía #f0857a, Urgencias #ff7a5c and Infectología
   #f2803c — three warm corals inside thirty degrees of each other — with
   Ginecología's rose close behind, and those four are most of the Atlas.
   These are walked around the wheel instead, and the two biggest areas
   (Infectología and Pediatría) sit at opposite ends of it. */
const AREA_COLOR = {
  infecto:        '#f2803c',   // orange
  pedia:          '#86d0a4',   // green
  mi:             '#7fd8e8',   // cyan
  cirugia:        '#e05c6e',   // deep red — the knife, and clearly not coral
  urgencias:      '#ffc043',   // amber, a warning light
  gineco:         '#e88ad0',   // magenta — pulled off Cirugía's red
  farmaco:        '#9b8cf0',   // violet
  psiquiatria:    '#6f8ce8',   // indigo
  'salud-publica':'#c2b49a',   // warm neutral
  'otras-esp':    '#3fb8a4',   // teal
  otros:          '#8b93a4',   // slate
};
const areaColor = (a) => AREA_COLOR[a] || AREA_COLOR.otros;

/* ═══════════════════════════════════════════════════════════════════════
   THE THREE ASPECTS

   Same workspace, three registers to walk it in. Each one re-tunes the
   palette, the greeting, the epigraph, and which voices come up first —
   because on different days you need a different kind of company.

   Nothing here reproduces game dialogue or art; each is written from the
   documented arc.
   ═══════════════════════════════════════════════════════════════════════ */

const ASPECTS = {
  khaslana: {
    name: 'Khaslana',
    who: 'Phainon',            // the name in the rail is the person, not the app
    sub: 'The long march to dawn',
    of: 'Phainon · Amphoreus',
    /* the flame, carried a long way, for people who will never know */
    line: 'The road is walked in the dark. The dawn is the reason, not the light you travel by.',
    voices: ['khaslana', 'amphoreus'],
    seal: 'embers',              // the Coreflame
    mark: 'sigil',               // the inked Coreflame, cut in the Amphoreus hand
    streak: 'Coreflame · days lit',
    held: 'Ground claimed',
    titan: 'Today\u2019s Titan',
    lit: 'Coreflame lit',
    acc: '#e8c88a', acc2: '#f2803c',
    ink: '#05060d',
    /* The hour, in this character's palette: deep night, dawn, day, dusk,
       late. Amphoreus runs on fire — even its midday is warm. */
    ambient: ['#3d5a8a', '#ff8a3c', '#f0c98a', '#f2662c', '#6b3a8e'],
    greetings: ['Still night', 'Good morning', 'Good afternoon', 'Good evening'],
  },
  wanderer: {
    name: 'Wanderer',
    who: 'Wanderer',
    sub: 'The name comes after the walking',
    of: 'Scaramouche · Kabukimono · Alatus’ opposite number',
    /* red and purple traded for teal and white after Irminsul */
    line: 'Letting go is not losing. It is deciding what gets to come with you.',
    voices: ['wanderer', 'khaslana'],
    seal: 'chronicle',           // the Plume of Luxury
    mark: 'wind',
    streak: 'The walk · days gone',
    held: 'Ground kept',
    titan: 'Today\u2019s shadow',
    lit: 'The walk continues',
    acc: '#8fd3e8', acc2: '#9b8cf0',
    ink: '#060810',
    /* Inazuma under a permanent storm: electro violet and cold teal, and
       no warm hour anywhere in it. */
    ambient: ['#4b3f9e', '#7fb8e8', '#8fd3e8', '#9b8cf0', '#5a3fa8'],
    greetings: ['Still awake', 'Morning', 'Afternoon', 'Evening'],
  },
  alatus: {
    name: 'Alatus',
    who: 'Xiao',
    sub: 'The watch nobody was asked to keep',
    of: 'Xiao · Conqueror of Demons',
    /* the last yaksha, paying a debt nobody is counting */
    line: 'Karmic debt is paid in nights, quietly, by someone nobody is watching.',
    voices: ['alatus', 'khaslana'],
    seal: 'chronicle',           // the yaksha mask
    mark: 'flower',
    streak: 'The watch · nights held',
    held: 'Ground held',
    titan: 'Today\u2019s demon',
    lit: 'The watch begins',
    acc: '#7ec9a4', acc2: '#3f8f7a',
    ink: '#04080a',
    /* Liyue's peaks at night, which is when he works. Jade throughout,
       with one amber hour at dusk when the lanterns go up. */
    ambient: ['#1f5a52', '#7ec9a4', '#a8dcc4', '#d9a24e', '#2a6b5e'],
    greetings: ['The watch holds', 'Morning', 'Afternoon', 'Nightfall'],
  },
};

const aspect = () => ASPECTS[S.aspect] || ASPECTS.khaslana;

function applyAspect() {
  const a = aspect();
  const r = document.documentElement.style;
  r.setProperty('--asp', a.acc);
  r.setProperty('--asp-2', a.acc2);
  r.setProperty('--ink-0', a.ink);
  document.documentElement.dataset.aspect = S.aspect || 'khaslana';

  const seal = $('#sigilSeal');
  if (seal) seal.dataset.emblem = a.seal;
  mountEmblems();               // every figure changes with the aspect
  const nm = $('#sigilName');
  if (nm) nm.textContent = a.who;
  const sub = $('#sigilSub');
  if (sub) sub.textContent = a.sub;
  r.setProperty('--acc', roomAccent(S.view || 'dawn'));
  /* Set here, not only in Dawn — switching aspect from inside the Atlas
     used to leave the previous character's light on the walls. */
  r.setProperty('--acc-2', ambientLight());
  renderAspectPicker();
}

function renderAspectPicker() {
  const el = $('#aspectPicker');
  if (!el) return;
  el.innerHTML = Object.entries(ASPECTS).map(([id, a]) => `
    <button class="asp ${(S.aspect || 'khaslana') === id ? 'on' : ''}" data-aspect="${id}"
            style="--ac:${a.acc}" title="${esc(a.name)} — ${esc(a.of)}">
      <span class="asp-dot"></span><span class="asp-n">${esc(a.name)}</span>
    </button>`).join('');
}

/* ── Each room carries its own light, and each aspect re-tunes all six ── */
const ROOM_ACCENT = {
  khaslana: { dawn: '#f2803c', atlas: '#e8c88a', path: '#7fd8e8', chronicle: '#9b8cf0', embers: '#f0a7b8', files: '#6ea8fe', setup: '#8b93a4' },
  wanderer: { dawn: '#8fd3e8', atlas: '#cfe6f0', path: '#9b8cf0', chronicle: '#b9a2e0', embers: '#7fd8e8', files: '#7cb0f5', setup: '#8792a8' },
  alatus:   { dawn: '#7ec9a4', atlas: '#c9e4d2', path: '#4f9e84', chronicle: '#8fd3c0', embers: '#e8c88a', files: '#6fbfd8', setup: '#7f8f8a' },
};
const roomAccent = (view) =>
  (ROOM_ACCENT[S.aspect] || ROOM_ACCENT.khaslana)[view] || '#e8c88a';

/* ── Seed March: fixed morning shift, Mon–Fri ── */
const uid = () => Math.random().toString(36).slice(2, 9);
const T = (time, text, kind) => ({ id: uid(), key: uid(), time, text, kind });

/* ── The weekday March ──────────────────────────────────────────────────
   Jordan's actual timetable, not a generic study plan: two Nutrición
   classes, TRE on Monday–Wednesday, ENARMIND after the morning block, and
   the long ENARM stretch from four to nine.

   That stretch is entered as blocks with breaks between them rather than
   as one five-hour slab. Five hours is not a thing you tick; it is a thing
   you fail to tick and then feel bad about. Four blocks with real gaps is
   the same five hours, and each one closes.

   `k` is the shared key that makes a block the same block across days —
   editing it on Tuesday edits it on all of them, and TRE simply isn't in
   Thursday's or Friday's list. */
const WEEKDAY = [
  { k: 'wake',   at: '05:15', kind: 'body',    d: [1,2,3,4,5], t: 'Up. Feet on the floor before the second alarm' },
  { k: 'jrn-am', at: '05:45', kind: 'mind',    d: [1,2,3,4,5], t: 'Chronicle — gratitud and intención, while the day is still yours' },
  { k: 'chess',  at: '06:40', kind: 'rest',    d: [1,2,3,4,5], t: 'Chess' },
  { k: 'nut-am', at: '07:00', kind: 'service', d: [1,2,3,4,5], t: 'Clase AM · Nutrición' },
  { k: 'tre',    at: '08:00', kind: 'service', d: [1,2,3],     t: 'Clase TRE' },
  { k: 'enmind', at: '08:45', kind: 'drill',   d: [1,2,3,4,5], t: 'ENARMIND' },
  { k: 'brk-am', at: '10:30', kind: 'body',    d: [1,2,3,4,5], t: 'Off the screen. Eat something that isn’t coffee' },
  { k: 'nut-pm', at: '13:00', kind: 'service', d: [1,2,3,4,5], t: 'Clase PM · Nutrición' },
  { k: 'brk-pm', at: '15:15', kind: 'rest',    d: [1,2,3,4,5], t: 'Properly off before the long stretch — not scrolling' },
  { k: 'enarm1', at: '16:00', kind: 'study',   d: [1,2,3,4,5], t: 'ENARM — first block, the thing that needs full attention' },
  { k: 'brk-1',  at: '17:30', kind: 'rest',    d: [1,2,3,4,5], t: 'Fifteen minutes off your feet. It buys the next block' },
  { k: 'enarm2', at: '17:45', kind: 'study',   d: [1,2,3,4,5], t: 'ENARM — second block, or switch topic if it stopped landing' },
  { k: 'brk-2',  at: '19:15', kind: 'rest',    d: [1,2,3,4,5], t: 'Stand up. Eat. Ten minutes of nothing' },
  { k: 'enarm3', at: '19:30', kind: 'drill',   d: [1,2,3,4,5], t: 'Questions on whatever you just read' },
  { k: 'stop',   at: '21:00', kind: 'body',    d: [1,2,3,4,5], t: 'Nine o’clock. Stop — the stopping is part of it' },
  { k: 'jrn-pm', at: '22:00', kind: 'mind',    d: [1,2,3,4,5], t: 'Chronicle — cierre and aprendizaje, and leave tomorrow ready' },
];

const weekdayTemplate = (d) => WEEKDAY
  .filter(b => b.d.includes(d))
  .map(b => ({ id: uid(), key: b.k, time: b.at, text: b.t, kind: b.kind }));

/* The weekend is still about the *shape* of a block rather than a quota.
   You are not going to have exactly sixty questions on a given Saturday,
   and a template that lies to you is one you stop ticking. */
const DEFAULT_TEMPLATES = {
  6: [
    T('09:00', 'The heaviest thing on the list, while you are fresh', 'study'),
    T('12:00', 'A timed block of questions — however many you have', 'study'),
    T('16:00', 'Go back through what you got wrong', 'study'),
    T('19:00', 'Deliberate rest — no guilt attached', 'body'),
    T('22:00', 'Chronicle', 'mind'),
  ],
  0: [
    T('10:00', 'Revisit the week — the parts that have already faded', 'study'),
    T('12:00', 'Look at the Path and decide what next week is for', 'mind'),
    T('14:00', 'An actual day off', 'body'),
    T('21:00', 'Chronicle, and close the week', 'mind'),
  ],
};
for (const d of [1, 2, 3, 4, 5]) DEFAULT_TEMPLATES[d] = weekdayTemplate(d);

/* The things you reach for anyway. Edit the row in Setup.
   `app` is the native URL scheme, when the desktop app registers one — the
   browser asks permission the first time and then goes straight there. If the
   app isn't installed nothing happens, so the web address stays reachable
   from the small ↗ on each chip. */
const DEFAULT_SHORTCUTS = [
  { id: uid(), label: 'Spotify',  url: 'https://open.spotify.com',    app: 'spotify://open',  color: '#1DB954' },
  { id: uid(), label: 'WhatsApp', url: 'https://web.whatsapp.com',    app: 'whatsapp://send', color: '#25D366' },
  { id: uid(), label: 'YouTube',  url: 'https://youtube.com',         app: '',                    color: '#FF3B30' },
  /* YouTube opens natively with app: '' because youtube.com is a Universal
     Link Google itself registers — these four aren't, so without a real
     scheme the chip could only ever reach the web version. Chess and
     Calendar are left blank: neither app publishes one to try. */
  { id: uid(), label: 'Gmail',    url: 'https://mail.google.com',     app: 'googlegmail://',      color: '#EA6C5B' },
  { id: uid(), label: 'ChatGPT',  url: 'https://chatgpt.com',         app: 'chatgpt://',          color: '#10A37F' },
  { id: uid(), label: 'Claude',   url: 'https://claude.ai',           app: 'claude://',           color: '#D97757' },
  { id: uid(), label: 'Chess',    url: 'https://chess.com',           app: '',                    color: '#81B64C' },
  { id: uid(), label: 'Drive',    url: 'https://drive.google.com',    app: 'googledrive://',      color: '#F4C025' },
  { id: uid(), label: 'Calendar', url: 'https://calendar.google.com', app: '',                    color: '#5B9BF8' },
];

/* Drawn, not fetched — a favicon would mean a request to nine companies
   every time Dawn renders. These are line figures in the same constructed
   language as the emblems, so the shortcut row belongs to the page instead
   of looking like a browser bookmark bar bolted on. Matched by label, so a
   shortcut saved before these existed still picks one up; anything the map
   doesn't know keeps its initial. */
const SC_GLYPHS = {
  /* The three bars inside the disc. Without the disc they are a wifi
     indicator, which is what the first attempt read as. */
  spotify:  `<path d="M12 2.9a9.1 9.1 0 1 1 0 18.2 9.1 9.1 0 0 1 0-18.2Z"/>` +
            `<path d="M6.7 9.2c3.4-1.1 7.5-.8 10.7 1"/>` +
            `<path d="M7.5 12.3c2.7-.9 6-.6 8.4.9"/>` +
            `<path d="M8.3 15.3c2.1-.7 4.5-.5 6.3.7"/>`,
  /* The bubble is the easy half; it is the handset that makes it WhatsApp
     rather than any chat app. */
  whatsapp: `<path d="M12 3.9a8.1 8.1 0 0 0-6.9 12.4L3.9 20.1l3.9-1.2A8.1 8.1 0 1 0 12 3.9Z"/>` +
            `<path d="M9.5 8.9c-.4 2.3 2.2 5.1 4.5 5.6.7.1 1.3-.4 1.4-1 .1-.4-.1-.8-.5-1l-1.1-.5c-.4-.2-.8 0-1 .4-.9-.5-1.6-1.2-2-2.1.4-.2.6-.6.4-1l-.5-1.1c-.2-.4-.6-.6-1-.5-.6.2-1.1.6-1.2 1.2Z"/>`,
  youtube:  `<path d="M3.6 8.4a2.6 2.6 0 0 1 2.6-2.6h11.6a2.6 2.6 0 0 1 2.6 2.6v7.2a2.6 2.6 0 0 1-2.6 2.6H6.2a2.6 2.6 0 0 1-2.6-2.6Z"/>` +
            `<path d="m10.4 9.3 4.8 2.7-4.8 2.7Z"/>`,
  /* The fold has to run all the way down to the bottom corners — that
     deep V is the M the logo is named for. A shallow crease is a generic
     envelope. */
  gmail:    `<path d="M3.2 7.1h17.6v9.8H3.2Z"/>` +
            `<path d="M3.2 7.1 12 14.6l8.8-7.5"/>` +
            `<path d="m3.2 16.9 6.1-5.2M20.8 16.9l-6.1-5.2"/>`,
  /* Three interlocking loops at sixty degrees. The mark is a knot, and the
     hexagon the first version drew was just a nut. */
  chatgpt:  `<path d="M6.9 9.5h10.2a2.5 2.5 0 0 1 0 5H6.9a2.5 2.5 0 0 1 0-5Z"/>` +
            `<path d="M6.9 9.5h10.2a2.5 2.5 0 0 1 0 5H6.9a2.5 2.5 0 0 1 0-5Z" transform="rotate(60 12 12)"/>` +
            `<path d="M6.9 9.5h10.2a2.5 2.5 0 0 1 0 5H6.9a2.5 2.5 0 0 1 0-5Z" transform="rotate(120 12 12)"/>`,
  /* Ten spokes meeting at the centre, alternating long and short and tilted
     off the axes — the burst is asymmetric, and an even eight-ray asterisk
     is the generic version of it. */
  claude:   `<path d="M12 12 20.7 14.8M12 12 15.9 17.3M12 12v9.2M12 12 8.1 17.3M12 12 3.3 14.8` +
            `M12 12 5.7 10M12 12 6.6 4.6M12 12V5.4M12 12l5.4-7.4M12 12l6.3 2"/>`,
  /* A rook. The knight is the truer chess.com mark and turns to mush below
     twenty pixels; the rook survives at fourteen. */
  chess:    `<path d="M7.3 5.5v3.3h9.4V5.5h-2.1v1.5h-1.6V5.5h-2v1.5H9.4V5.5Z"/>` +
            `<path d="m8.9 8.8-.7 6.9h7.6l-.7-6.9"/>` +
            `<path d="M6.7 15.7h10.6v2.8H6.7Z"/>`,
  /* Flat and wide, with the three seams meeting at the centroid. An
     equilateral triangle with a Y in it is a tent; Drive's is squat. */
  drive:    `<path d="m12 6.2 9.6 11.6H2.4Z"/>` +
            `<path d="M12 6.2v5.6M12 11.8 5.4 17.8M12 11.8l6.6 6"/>`,
  calendar: `<path d="M4.4 7h15.2v12.2H4.4Z"/><path d="M4.4 11h15.2"/><path d="M8.4 4.8v3.4M15.6 4.8v3.4"/>` +
            `<path d="M8.2 14.3h1.4M13.9 14.3h1.4M8.2 16.9h1.4M13.9 16.9h1.4"/>`,
};
SC_GLYPHS.claudeai = SC_GLYPHS.claude;
const scGlyph = (label) => SC_GLYPHS[norm(label).replace(/[^a-z]/g, '')] || null;

const DEFAULT_STATE = {
  examDate: '2026-09-28',
  shortcuts: structuredClone(DEFAULT_SHORTCUTS),
  aspect: 'khaslana',
  timer: null,     // { taskId, label, total, endsAt, paused, left }
  scratch: '',
  templates: DEFAULT_TEMPLATES,
  ritual: {}, topics: {}, journal: {}, decks: {},
  sims: [], voices: [], hidden: [], weekNotes: {}, scratchSeen: {},
  tmplVersion: 3,
  motion: 'auto',   // 'auto' | 'still' | 'subtle' | 'full'
  readZoom: 1,      // chapter zoom, shared by the panel and the full reader
  view: 'dawn',
  updatedAt: 0,     // when this state was last written, anywhere — the sync clock
};

let S = load();

function load() {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    const s = { ...structuredClone(DEFAULT_STATE), ...parsed };

    /* Shortcuts saved before native schemes existed have no `app` key, and a
       saved array replaces the defaults wholesale — so they'd silently keep
       opening the website forever. Fill them in from the defaults by name. */
    for (const sc of (s.shortcuts || [])) {
      if (sc.app === undefined) {
        const d = DEFAULT_SHORTCUTS.find(x => x.label.toLowerCase() === String(sc.label).toLowerCase());
        sc.app = d ? d.app : '';
      }
      /* An early build shipped bare schemes with no path; those don't resolve. */
      if (sc.app === 'spotify:')    sc.app = 'spotify://open';
      if (sc.app === 'whatsapp://') sc.app = 'whatsapp://send';
      /* Gmail, ChatGPT, Claude and Drive shipped with app: '' before their
         schemes were known — that blank is baked into every saved state, so
         bumping DEFAULT_SHORTCUTS alone never reaches a device that already
         has shortcuts. Fill the gap the same way a first-run would, unless
         the field holds a scheme of its own (someone typed one in by hand). */
      if (sc.app === '') {
        const d = DEFAULT_SHORTCUTS.find(x => x.label.toLowerCase() === String(sc.label).toLowerCase());
        if (d && d.app) sc.app = d.app;
      }
    }
    /* Blocks predate the notion of repeating across days. Give every block a
       key, and let identical time+text on different days share one — so the
       seeded template arrives already linked instead of seven strangers. */
    const byText = {};
    for (const d of Object.keys(s.templates || {})) {
      for (const t of s.templates[d]) {
        if (t.key) continue;
        const sig = `${t.time}|${t.text}|${t.kind}`;
        t.key = byText[sig] ||= uid();
      }
    }

    /* The weekday March is now the real timetable. A saved templates array
       replaces the defaults wholesale, so the new schedule has to be
       written in rather than inherited — but anything filed as `admin` is
       Jordan's own and gets carried across untouched, along with any block
       he added that the seed doesn't know about. */
    /* Read the version off the *saved* object. `s` has already been merged
       over the defaults, so it always carries the current version and the
       migration would never run. */
    if ((parsed.tmplVersion || 1) < 3) {
      const byTime = (a, b) => (a.time || '99:99').localeCompare(b.time || '99:99');
      const seeded = new Set(WEEKDAY.map(b => b.k));

      for (const d of [1, 2, 3, 4, 5]) {
        const keep = (s.templates?.[d] || []).filter(t => t.kind === 'admin' && !seeded.has(t.key));
        s.templates[d] = [...weekdayTemplate(d), ...keep].sort(byTime);
      }

      /* Changing the template is not enough, and this is the part the first
         pass got wrong. `dayMarch` copies the template into `S.ritual` the
         first time you look at a day and then returns that copy forever —
         it is a record, not a view. So every day already opened kept the
         old plan, and the new schedule only showed up on days that had
         never been visited. Which is exactly why it looked right here and
         wrong on Jordan's screen.

         Days already lived are left alone: those are the record. From today
         forward, a day with nothing ticked is still only a plan, so it gets
         rebuilt — carrying across his own admin blocks and anything caught
         from the Scratch, which were never the template's to replace. */
      const n = new Date();
      const tkey = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
      for (const [k, day] of Object.entries(s.ritual || {})) {
        if (k < tkey) continue;                              // the past is a record
        if ((day.tasks || []).some(t => t.done)) continue;   // touched: leave it
        const [y, m, dd] = k.split('-').map(Number);
        const dow = new Date(y, m - 1, dd).getDay();
        const base = (dow >= 1 && dow <= 5) ? weekdayTemplate(dow)
                                            : (DEFAULT_TEMPLATES[dow] || []).map(t => ({ ...t, id: uid() }));
        const keep = (day.tasks || []).filter(t => t.caught || t.kind === 'admin');
        day.tasks = [...base.map(t => ({ ...t, done: false })), ...keep].sort(byTime);
      }
      s.tmplVersion = 3;
    }
    return s;
  } catch { return structuredClone(DEFAULT_STATE); }
}
let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    S.updatedAt = Date.now();
    try { localStorage.setItem(STORE, JSON.stringify(S)); }
    catch { toast('Could not save — storage is full'); }
    syncPush();
  }, 180);
}

/* ═══════════════════════════════════════════════════════════════════════
   SYNC — the same state, on the phone and on the Mac, using GitHub itself

   No Cloudflare, no second account: the backend is the GitHub repo this
   app already lives in, written to directly from the browser via the
   Contents API with a personal access token you generate once (Setup →
   Sync) and that lives only in this device's localStorage — it's never
   committed, never sent anywhere but api.github.com. One JSON file,
   `data/state.json`, one writer at a time, last-write-wins by timestamp
   — the same merge strategy the Cloudflare version had, just aimed at a
   different backend.

   The one real constraint of this approach, worth being honest about:
   every push is a real git commit. Autosaving on every keystroke the way
   `save()` does locally would flood the repo's history, so the push to
   GitHub is throttled hard — at most once a minute, plus once when the
   tab is hidden or closed, so nothing written is ever lost, it just
   doesn't all become its own commit. */
const GH_TOKEN_KEY = 'khaslana.gh.token.v1';
const GH_REPO_KEY  = 'khaslana.gh.repo.v1';   // "owner/repo"
const GH_PATH = 'data/state.json';

function ghConfig() {
  const token = localStorage.getItem(GH_TOKEN_KEY) || '';
  const repo  = localStorage.getItem(GH_REPO_KEY) || '';
  return token && repo && repo.includes('/') ? { token, repo } : null;
}
function ghSetConfig(token, repo) {
  localStorage.setItem(GH_TOKEN_KEY, token);
  localStorage.setItem(GH_REPO_KEY, repo);
}
function ghClearConfig() {
  localStorage.removeItem(GH_TOKEN_KEY);
  localStorage.removeItem(GH_REPO_KEY);
}
const b64encodeUtf8 = (str) => btoa(unescape(encodeURIComponent(str)));
const b64decodeUtf8 = (b64) => decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));

let ghSha = null;          // cached sha of the last known remote file
let ghPushPending = false;
let ghLastSyncedAt = 0;    // for the Setup status line
let ghLastError = null;    // the thing that made every sync failure invisible until now

/* A bad/expired token, a repo typo, or GitHub itself being unreachable all
   used to land in the same silent `catch {}` as "offline, try later" —
   indistinguishable from working sync to anyone looking at the Setup
   screen, which is exactly the failure mode "dice que están conectados
   pero nunca se sincroniza" describes. Every catch below now runs this
   first, so the status line can say what actually happened instead of
   just going quiet. */
function ghNoteError(err) {
  const msg = String(err?.message || err || 'unknown error');
  let hint = msg;
  if (/\b401\b/.test(msg)) hint = 'The token was rejected (401) — it may have expired or been revoked. Generate a new one in Setup.';
  else if (/\b403\b/.test(msg)) hint = "The token doesn't have permission (403) — check it has Contents: Read and write on this repo.";
  else if (/\b404\b/.test(msg)) hint = "Repo not found (404) — check the owner/repo spelling in Setup.";
  else if (/\b409\b/.test(msg)) hint = null; // handled as a normal retry, not a user-facing error
  if (hint) { ghLastError = hint; renderSyncStatus(); }
}

async function ghGetFile(cfg) {
  let res;
  try {
    res = await fetch(`https://api.github.com/repos/${cfg.repo}/contents/${GH_PATH}`, {
      headers: { Authorization: `Bearer ${cfg.token}`, Accept: 'application/vnd.github+json' },
      cache: 'no-store',
    });
  } catch (err) {
    throw new Error('network: ' + (err?.message || err));
  }
  if (res.status === 404) return { sha: null, doc: null };
  if (!res.ok) throw new Error('github get ' + res.status);
  const json = await res.json();
  return { sha: json.sha, doc: JSON.parse(b64decodeUtf8(json.content)) };
}

function syncPush() {
  ghPushPending = true;
}

async function ghFlush() {
  const cfg = ghConfig();
  if (!cfg || !ghPushPending) return;
  ghPushPending = false;
  try {
    /* Re-check the remote right before writing, sha or no sha. A cached sha
       only proves nothing's changed there since it was last fetched — it
       says nothing about whether THIS device's S is the newer copy. Sync
       here is the whole document, last write wins by clock, not a merge:
       pushing stale local state over a genuinely newer remote (the other
       device wrote since this tab last pulled) would silently erase
       whatever changed there — tick a task on the phone, then an
       already-open computer tab autosaves and overwrites it back to
       untouched. Adopt the newer copy instead of pushing over it, the
       same way syncPull() does at boot. */
    const cur = await ghGetFile(cfg);
    ghSha = cur.sha;
    if (cur.doc && cur.doc.updatedAt > (S.updatedAt || 0)) {
      localStorage.setItem(STORE, JSON.stringify({ ...cur.doc.state, updatedAt: cur.doc.updatedAt }));
      location.reload();
      return;
    }
    const body = {
      message: 'sync ' + new Date(S.updatedAt).toISOString(),
      content: b64encodeUtf8(JSON.stringify({ state: S, updatedAt: S.updatedAt }, null, 0)),
    };
    if (ghSha) body.sha = ghSha;
    const res = await fetch(`https://api.github.com/repos/${cfg.repo}/contents/${GH_PATH}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${cfg.token}`, Accept: 'application/vnd.github+json', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json();
      ghSha = json.content.sha;
      ghLastSyncedAt = Date.now();
      ghLastError = null;
      renderSyncStatus();
    } else if (res.status === 409) {
      /* the other device wrote since we last checked — refetch the sha
         and let the next tick retry rather than clobbering it blind */
      ghSha = null;
      ghPushPending = true;
    } else {
      let detail = '';
      try { detail = (await res.json())?.message || ''; } catch {}
      ghPushPending = true;   // don't drop the edit — retry once whatever's wrong gets fixed
      throw new Error(`github put ${res.status}${detail ? ': ' + detail : ''}`);
    }
  } catch (err) { ghNoteError(err); }
}
setInterval(ghFlush, 60000);
/* The push side re-checks the remote before writing, but that only
   catches a device that's already stale AT THE MOMENT it pushes — it
   does nothing about how it got stale. A tab that's simply left open,
   never backgrounded (so the visibilitychange pull below never fires),
   sitting on the phone's edit from an hour ago: the next trivial local
   action here — a scratch-pad keystroke, a zoom nudge, anything that
   calls save() — stamps *now* as this device's updatedAt. That's newer
   than the phone's real edit by the clock, so last-write-wins pushes it
   and erases the phone's edit, even though the content being pushed is
   the stale copy. A periodic pull, not just one at boot and one on
   refocus, is what actually keeps a long-open tab from drifting into
   that window in the first place. */
setInterval(() => { if (!document.hidden) syncPull().then(renderSyncStatus); }, 60000);
/* "Synced 3m ago" going stale on its own would undersell a sync that
   genuinely just happened — this only re-renders the rail badge's text
   against the clock, no network involved. */
setInterval(() => { if (!document.hidden) renderRailSync(); }, 20000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) ghFlush();
  /* Coming back to a tab that was just left open — Setup connected, no
     local edit pending here — never re-checked before this: syncPull()
     only ran once, at boot. Ticking a task on the phone then switching
     back to a computer tab that's been sitting open the whole time is
     exactly the case that silently showed nothing. */
  else syncPull().then(renderSyncStatus);
});
window.addEventListener('pagehide', () => { if (ghPushPending) ghFlush(); });

/* Runs once at boot, after the page has already painted with whatever was
   local. If GitHub has something newer — written from the other device
   since this one was last open — the local copy is replaced and the
   page reloads once through the normal boot path, rather than trying to
   hot-swap eighty screens' worth of already-rendered state by hand. */
async function syncPull() {
  const cfg = ghConfig();
  if (!cfg) return;
  try {
    const cur = await ghGetFile(cfg);
    ghSha = cur.sha;
    ghLastError = null;
    if (!cur.doc || !cur.doc.updatedAt) return;
    ghLastSyncedAt = Date.now();
    if (cur.doc.updatedAt <= (S.updatedAt || 0)) return;
    localStorage.setItem(STORE, JSON.stringify({ ...cur.doc.state, updatedAt: cur.doc.updatedAt }));
    location.reload();
  } catch (err) { ghNoteError(err); }
}

function renderSyncStatus() {
  const el = $('#syncStatus');
  const tokenInput = $('#syncToken');
  const cfg = ghConfig();
  /* The token field is blank on every load, on every device, always — it's
     never written back into the input once saved, so nothing readable ever
     sits in the DOM. That's deliberate, not a sign it was lost, but a
     blank password field next to a form reads as "empty" regardless of
     intent. The line below it is the real answer to "is this still
     connected"; the placeholder here just stops the field itself from
     making the case that it isn't. */
  if (tokenInput) tokenInput.placeholder = cfg ? 'Saved on this device — leave blank to keep it' : 'Personal access token';
  renderRailSync(cfg);
  if (!el) return;
  if (!cfg) { el.textContent = 'Not connected.'; el.className = 'entry-sub'; return; }
  /* Every sync failure used to land in a bare `catch {}` — a dead token,
     no permission, a typo'd repo, all looked identical to "hasn't had
     anything to push yet" from here, which is exactly how "dice que
     están conectados" and "nunca se sincroniza" coexist. Show the real
     failure the moment there is one, ahead of the otherwise-reassuring
     "Connected to…" line, instead of only ever reporting success. */
  if (ghLastError) {
    el.textContent = `Connected to ${cfg.repo}, but the last sync failed: ${ghLastError}`;
    el.className = 'entry-sub scan-status error';
    return;
  }
  el.className = 'entry-sub';
  el.textContent = ghLastSyncedAt
    ? `Connected to ${cfg.repo}. Last synced ${new Date(ghLastSyncedAt).toLocaleTimeString()}.`
    : `Connected to ${cfg.repo}. Not synced yet this session.`;
}

/* The one-tap sync control in the rail, reachable from every room instead
   of only from Setup — the whole point being asked for: somewhere to hit
   "sync now" and see it actually happen, not just trust the 60-second
   timer and a status line buried in a settings screen. */
function renderRailSync(cfg = ghConfig()) {
  const btn = $('#railSync');
  const txt = $('#railSyncText');
  if (!btn || !txt) return;
  btn.classList.remove('ok', 'error', 'syncing');
  if (!cfg) { txt.textContent = 'Not connected'; return; }
  if (ghLastError) { btn.classList.add('error'); txt.textContent = 'Sync error — tap to retry'; return; }
  if (ghPushPending) { txt.textContent = 'Changes pending — tap to sync'; return; }
  btn.classList.add('ok');
  txt.textContent = ghLastSyncedAt
    ? 'Synced ' + timeAgoShort(Date.now() - ghLastSyncedAt)
    : 'Connected — tap to sync';
}

const timeAgoShort = (ms) => {
  const s = Math.floor(ms / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  return Math.floor(m / 60) + 'h ago';
};

let manualSyncRunning = false;
async function manualSync() {
  const cfg = ghConfig();
  if (!cfg) { toast('Connect sync in Setup first'); return go('setup'); }
  if (manualSyncRunning) return;
  manualSyncRunning = true;
  const btn = $('#railSync');
  btn?.classList.add('syncing');
  try {
    /* Pull first — whatever changed elsewhere shows up here — then flush,
       which pushes anything pending here (including whatever this exact
       tap might be reacting to, if save()'s own debounce hasn't fired
       yet). syncPull() reloads the page itself when it adopts something
       newer, so nothing after that line runs in that case — the flush
       and the toast below only fire when there was nothing new to pull. */
    await syncPull();
    await ghFlush();
  } finally {
    manualSyncRunning = false;
    btn?.classList.remove('syncing');
  }
  renderSyncStatus();
  if (ghLastError) toast('Sync failed — see Setup for why');
  else toast('Synced');
}

/* ═══════════════════════════════════════════════════════════════════════
   DATES
   ═══════════════════════════════════════════════════════════════════════ */

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY3   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const keyOf    = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseKey = (k) => { const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d); };
const todayKey = () => keyOf(new Date());
const addDays  = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const daysBetween = (a,b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
const mondayOf = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay()+6)%7)); x.setHours(0,0,0,0); return x; };

const ord = (n) => n + (['th','st','nd','rd'][(n%100-20)%10] || ['th','st','nd','rd'][n%100] || 'th');
const longDate  = (k) => { const d = parseKey(k); return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${ord(d.getDate())}`; };
const shortDate = (k) => { const d = parseKey(k); return `${DAY3[d.getDay()]} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}`; };

function hashOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

/* Accent-blind, for searching Spanish clinical text. */
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

let toastTimer, scratchTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ═══════════════════════════════════════════════════════════════════════
   THE MARCH
   ═══════════════════════════════════════════════════════════════════════ */

/* The kinds of block a day can hold. More than four, because a real day is
   not four things — and each carries its own light so the March reads as a
   shape rather than a list. */
/* Nine kinds means nine colours that have to be told apart at the size of a
   4px dot. The first set had `service` on var(--cyan) and `review` on
   #7fd8e8 — the same colour twice — and `rest` and `admin` were both
   desaturated blue-greys. These are spread around the wheel on purpose:
   warm for the work, blue for what is scheduled for you, green for the
   body, and the two neutrals pulled apart, one cool and one warm. */
const KINDS = {
  study:   { label: 'deep study', c: '#f2803c' },   // ember
  drill:   { label: 'questions',  c: '#e8c88a' },   // sand
  review:  { label: 'review',     c: '#7fd8e8' },   // cyan
  service: { label: 'clase',      c: '#5b8fe0' },   // blue — clearly not the cyan
  body:    { label: 'body',       c: '#86d0a4' },   // green
  rest:    { label: 'off',        c: '#8b96b5' },   // cool slate
  mind:    { label: 'mind',       c: '#9b8cf0' },   // violet
  people:  { label: 'people',     c: '#f0a7b8' },   // rose
  admin:   { label: 'admin',      c: '#c2b49a' },   // warm neutral — not the slate
};
const KIND_LABEL = Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, v.label]));
const kindColor = (k) => (KINDS[k] || KINDS.admin).c;

/* Only these count toward the Coreflame — the rest of a day matters, but
   it isn't what the streak is measuring. */
const STUDY_KINDS = new Set(['study', 'drill', 'review']);

function dayMarch(key) {
  if (!S.ritual[key]) {
    const tmpl = S.templates[parseKey(key).getDay()] || [];
    S.ritual[key] = { tasks: tmpl.map(t => ({ ...t, id: uid(), done: false })) };
    save();
  }
  return S.ritual[key];
}

/* What a day holds *without* materialising it. `dayMarch` writes the
   template into state the moment you look at a day, which would make every
   future day you happen to click look different from the ones you haven't
   — so the calendar asks this instead. */
const plannedCount = (key) =>
  (S.ritual[key]?.tasks || S.templates[parseKey(key).getDay()] || []).length;

function dayStats(key) {
  const tasks = S.ritual[key]?.tasks || [];
  const done = tasks.filter(t => t.done).length;
  const study = tasks.filter(t => STUDY_KINDS.has(t.kind));
  const studyDone = study.filter(t => t.done).length;
  return {
    total: tasks.length, done,
    pct: tasks.length ? Math.round(done / tasks.length * 100) : 0,
    study: study.length, studyDone,
    /* A day with no study blocks planned counts if you did what you planned —
       a rest day you meant to take should not break the flame. */
    lit: study.length ? studyDone / study.length >= 0.6 : done > 0,
  };
}

function coreflame() {
  let n = 0, d = new Date();
  if (!S.ritual[keyOf(d)] || !dayStats(keyOf(d)).lit) d = addDays(d, -1);
  for (let i = 0; i < 400; i++) {
    const k = keyOf(d);
    if (S.ritual[k] && dayStats(k).lit) { n++; d = addDays(d, -1); } else break;
  }
  return n;
}

/* ═══════════════════════════════════════════════════════════════════════
   THE GLASS — a timer bound to a block of the March

   Deadline-based, not tick-based: it stores when the sand runs out, so it
   stays honest through a reload, a closed laptop, or a backgrounded tab.
   ═══════════════════════════════════════════════════════════════════════ */

const DEFAULT_MINUTES = 50;

function startGlass(taskId, minutes = DEFAULT_MINUTES) {
  const task = (S.ritual[todayKey()]?.tasks || []).find(t => t.id === taskId);
  S.timer = {
    taskId,
    label: task ? task.text : 'Focus',
    kind: task ? task.kind : 'study',
    total: minutes * 60000,
    endsAt: Date.now() + minutes * 60000,
    paused: false,
    left: 0,
  };
  save();
  renderGlass();
  if (S.view === 'dawn') renderDawn();   // the block needs to show it's running
  toast(`${minutes} minutes. Nothing else until the sand runs out.`);
}

const glassLeft = () => {
  if (!S.timer) return 0;
  return S.timer.paused ? S.timer.left : Math.max(0, S.timer.endsAt - Date.now());
};

function pauseGlass() {
  if (!S.timer || S.timer.paused) return;
  S.timer.left = glassLeft();
  S.timer.paused = true;
  save(); renderGlass();
}
function resumeGlass() {
  if (!S.timer || !S.timer.paused) return;
  S.timer.endsAt = Date.now() + S.timer.left;
  S.timer.paused = false;
  save(); renderGlass();
}
function stopGlass(silent) {
  S.timer = null;
  save(); renderGlass();
  if (S.view === 'dawn') renderDawn();
  if (!silent) toast('Glass set down');
}

/* When it runs out the block ticks itself — the point was to do the block. */
function finishGlass() {
  const t = S.timer;
  if (!t) return;
  const day = S.ritual[todayKey()];
  const task = day?.tasks.find(x => x.id === t.taskId);
  if (task && !task.done) { task.done = true; }
  S.timer = null;
  save();
  renderGlass();
  if (S.view === 'dawn') renderDawn();
  toast('Time. That block is done.');
}

const mmss = (ms) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const KIND_COLOR = new Proxy({}, { get: (_, k) => kindColor(k) });

function renderGlass() {
  const el = $('#railGlass');
  if (!el) return;
  const t = S.timer;

  if (!t) {
    el.className = 'rail-glass empty';
    el.innerHTML = `<button class="glass-start" id="glassQuick" title="Start ${DEFAULT_MINUTES} minutes">
        <span class="gq-mark">◷</span><span class="gq-t">Start a block</span></button>`;
    return;
  }

  const left = glassLeft();
  if (left <= 0 && !t.paused) return finishGlass();

  const pct = 1 - left / t.total;
  const R = 15, C = 2 * Math.PI * R;

  el.className = `rail-glass ${t.paused ? 'paused' : ''}`;
  el.style.setProperty('--gc', KIND_COLOR[t.kind] || 'var(--ember)');
  el.innerHTML = `
    <svg class="glass-ring" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="${R}" class="gr-track"/>
      <circle cx="18" cy="18" r="${R}" class="gr-fill"
              stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${(C * (1 - pct)).toFixed(2)}"/>
    </svg>
    <div class="glass-body">
      <div class="glass-t">${mmss(left)}</div>
      <div class="glass-l">${esc(t.label)}</div>
    </div>
    <div class="glass-acts">
      <button data-glass="${t.paused ? 'resume' : 'pause'}" title="${t.paused ? 'Resume' : 'Pause'}">${t.paused ? '▶' : '❚❚'}</button>
      <button data-glass="stop" title="Set it down">✕</button>
    </div>`;
}

/* One interval for the whole app. */
setInterval(() => { if (S.timer && !S.timer.paused) renderGlass(); }, 1000);

/* ═══════════════════════════════════════════════════════════════════════
   THE SCAN — the folder is the source of truth

   The server hands out a directory listing for codex/, so the app can just
   look. Anything in the folder that isn't in the pre-built index gets
   fetched and parsed right here, with the same rules the Node indexer uses
   (assets/extract.js), and cached so it only ever happens once per chapter.

   If there are 23 files, you get 23 chapters. Running the indexer is
   optional — it only saves the browser the parsing.
   ═══════════════════════════════════════════════════════════════════════ */

const SCAN_STORE = 'khaslana.codex.v1';
let scanState = { status: 'idle', found: 0, added: 0, gone: 0, note: '' };

function loadScanned() {
  try { return JSON.parse(localStorage.getItem(SCAN_STORE)) || {}; }
  catch { return {}; }
}
function saveScanned(map) {
  try { localStorage.setItem(SCAN_STORE, JSON.stringify(map)); }
  catch { /* over quota: the entries still work this session */ }
}

/* Pull the filenames out of whatever listing the server produced. */
function parseListing(html) {
  const names = new Set();
  for (const m of html.matchAll(/href="([^"?#]+\.html)"/gi)) {
    let n = m[1];
    if (n.startsWith('/')) n = n.slice(n.lastIndexOf('/') + 1);
    try { n = decodeURIComponent(n); } catch {}
    if (n && !n.includes('/')) names.add(n);
  }
  return [...names];
}

async function scanCodex(opts = {}) {
  /* file:// has no listing to read — there the pre-built index is all there is. */
  if (location.protocol === 'file:') {
    scanState = { status: 'offline', found: CODEX.entries.length, added: 0, gone: 0,
      note: 'Opened from a file, so the folder cannot be listed. Run abrir.command to scan live.' };
    return scanState;
  }

  scanState = { ...scanState, status: 'scanning', note: '' };
  renderScanStatus();

  let files;
  try {
    const res = await fetch('codex/', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    const body = await res.text();
    /* Static hosts with no real directory (GitHub Pages, Cloudflare Pages)
       don't 404 a missing "codex/" — they fall back to serving the app's
       own index.html with a 200. That page has no chapter links in it, so
       parseListing would read it as "the folder is now empty" and the code
       below would delete every chapter already loaded from the pre-built
       index. <title>KHASLANA</title> only appears in that shell, never in
       a real listing, so it's the signal that this wasn't one. */
    if (body.includes('<title>KHASLANA</title>')) throw new Error('no listing on this host');
    files = parseListing(body);
  } catch (err) {
    scanState = { status: 'error', found: CODEX.entries.length, added: 0, gone: 0,
      note: `Could not read the folder (${err.message}). Showing the last built index.` };
    renderScanStatus();
    return scanState;
  }

  const known = new Map(CODEX.entries.map(e => [e.file, e]));
  const cached = loadScanned();
  const fresh = files.filter(f => !known.has(f) && !cached[f]);
  const gone = CODEX.entries.filter(e => !files.includes(e.file)).map(e => e.file);

  /* Bring in anything already parsed on a previous visit. */
  for (const f of files) {
    if (!known.has(f) && cached[f]) CODEX.entries.push(cached[f]);
  }

  /* Parse the genuinely new ones. Chapters are heavy, so do it in sequence
     and let the UI update as each lands. */
  let added = 0;
  for (const f of fresh) {
    scanState = { ...scanState, status: 'reading', note: f };
    renderScanStatus();
    try {
      const html = await (await fetch('codex/' + encodeURIComponent(f), { cache: 'no-store' })).text();
      const entry = KHASLANA_EXTRACT.toEntry(html, f, { path: (CODEX.sourceDir || '') + '/' + f });
      CODEX.entries.push(entry);
      cached[f] = entry;
      added++;
    } catch { /* a chapter that won't load is skipped, not fatal */ }
  }
  if (added) saveScanned(cached);

  /* Drop anything that has left the folder. */
  if (gone.length) {
    CODEX.entries = CODEX.entries.filter(e => files.includes(e.file));
    for (const f of gone) delete cached[f];
    saveScanned(cached);
  }

  /* Keep the area filters honest about what is actually present. */
  const present = new Set(CODEX.entries.map(e => e.area));
  const all = (window.KHASLANA_EXTRACT?.AREAS || []).map(a => ({ id: a.id, label: a.label }))
    .concat([{ id: 'otros', label: 'Otros' }]);
  CODEX.areas = all.filter(a => present.has(a.id));
  CODEX.entries.sort((a, b) => a.title.localeCompare(b.title, 'es'));

  scanState = { status: 'done', found: files.length, added, gone: gone.length, note: '' };
  renderScanStatus();

  if (added || gone.length) {
    $('#tagAtlas').textContent = CODEX.entries.length;
    if (S.view === 'atlas') renderAtlas();
    if (S.view === 'dawn') renderDawn();
    if (S.view === 'path') renderPath();
    if (added) toast(`${added} new ${added === 1 ? 'chapter' : 'chapters'} unsealed`);
  }
  return scanState;
}

function renderScanStatus() {
  const el = $('#scanStatus');
  if (!el) return;
  const s = scanState;
  const line = {
    idle:     () => `${CODEX.entries.length} chapters loaded.`,
    scanning: () => 'Looking in the folder…',
    reading:  () => `Reading ${s.note}…`,
    done:     () => `${s.found} in the folder · ${CODEX.entries.length} loaded` +
                    (s.added ? ` · ${s.added} new` : '') + (s.gone ? ` · ${s.gone} removed` : ''),
    offline:  () => s.note,
    error:    () => s.note,
  }[s.status]();
  el.textContent = line;
  el.className = 'entry-sub scan-status ' + s.status;
}

/* ═══════════════════════════════════════════════════════════════════════
   THE ATLAS
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Two axes, because one ladder never described real studying ──
   STAGE is how far through the chapter you've got.
   CONFIDENCE is whether it actually stuck. They move independently:
   you can be "drilled" and still shaky, and that pair is the useful signal. */

const STAGES = ['untouched', 'skimmed', 'read', 'studied', 'drilled', 'mastered'];
const STAGE = {
  untouched: { label: 'Untouched', short: '—',  hint: 'Never opened',                        w: 0 },
  skimmed:   { label: 'Skimmed',   short: 'SK', hint: 'Flicked through, know what is in it', w: 1 },
  read:      { label: 'Read',      short: 'RD', hint: 'Read properly, once',                 w: 2 },
  studied:   { label: 'Studied',   short: 'ST', hint: 'Worked through it, made it mine',     w: 3 },
  drilled:   { label: 'Drilled',   short: 'DR', hint: 'Sat questions on it',                 w: 4 },
  mastered:  { label: 'Mastered',  short: 'MA', hint: 'Would not hesitate on exam day',      w: 5 },
};

const CONF = {
  0: { label: 'Unrated', color: 'var(--faint)' },
  1: { label: 'Shaky',   color: 'var(--crit)'  },
  2: { label: 'Okay',    color: 'var(--warn)'  },
  3: { label: 'Solid',   color: 'var(--ok)'    },
};

/* How long a chapter stays fresh before it wants revisiting. */
const REVIEW_AFTER = { 0: 10, 1: 4, 2: 10, 3: 24 };

/* Old three-state data migrates on read, so nothing saved is lost. */
const MIGRATE = { nuevo: 'untouched', curso: 'read', dominado: 'mastered' };

function topicRec(id) {
  const r = S.topics[id];
  if (!r) return { stage: 'untouched', conf: 0, touched: null };
  if (r.state && !r.stage) {          // migrate in place, once
    S.topics[id] = { stage: MIGRATE[r.state] || 'untouched', conf: r.state === 'dominado' ? 3 : 0, touched: r.touched || null };
    save();
    return S.topics[id];
  }
  return { stage: r.stage || 'untouched', conf: r.conf ?? 0, touched: r.touched || null };
}

const topicStage = (id) => topicRec(id).stage;
const topicConf  = (id) => topicRec(id).conf;

function setTopic(id, patch) {
  const cur = topicRec(id);
  S.topics[id] = { ...cur, ...patch, touched: todayKey() };
  save();
}

/* Held ground = studied or better and not shaky. */
const isHeld = (id) => {
  const r = topicRec(id);
  return STAGE[r.stage].w >= 3 && r.conf !== 1;
};

/* Wants revisiting: far enough along to have been learned, and stale. */
function isDue(id) {
  const r = topicRec(id);
  if (STAGE[r.stage].w < 2 || !r.touched) return false;
  return daysBetween(r.touched, todayKey()) >= REVIEW_AFTER[r.conf];
}
const daysSince = (id) => {
  const r = topicRec(id);
  return r.touched ? daysBetween(r.touched, todayKey()) : null;
};
/* Los capítulos se sirven por el symlink codex/ — una ruta relativa que
   resuelve igual abriendo el index con file:// que sirviéndolo por http.
   El file:// absoluto queda de respaldo por si falta el enlace.

   Every accented filename here went through macOS's own APFS at some
   point, which stores "á" as "a" + a separate combining accent (NFD) —
   the index was generated from a directory listing in that form, for
   every chapter that has one. The files themselves, once through git and
   onto the deployed host, ended up the ordinary precomposed way (NFC).
   Same character, different bytes: a filesystem doing a byte-exact
   lookup for the NFD form 404s on the NFC file that's actually there.
   Twenty of the eighty-three chapters have an accent in the title, so
   this silently 404'd a quarter of the library — and because the host
   answers a missing path with Khaslana's own shell instead of a real
   404, what loaded in the chapter's place was Khaslana itself, nested
   inside its own reader. Normalizing to NFC here, once, fixes every
   affected chapter without needing to touch the generated index.

   One more layer on top of that, found the hard way: Cloudflare Pages
   itself 308-redirects any request for a bare `.html` path to the
   extension-less "clean" URL — and that redirect's own Location header
   carries the target as raw UTF-8 bytes, NOT percent-encoded. HTTP
   header values are Latin-1 by spec, so a browser decoding that header
   reads each UTF-8 byte of an accented character as its own Latin-1
   codepoint — "á" (bytes C3 A1) comes back as "Ã¡" — landing on a URL
   that matches no real file. Cloudflare then answers *that* with
   Khaslana's own shell instead of a 404, which is what actually made
   "Adenocarcinoma gástrico" load Khaslana-inside-itself: not a caching
   bug, not a stale service worker — a live Cloudflare redirect mangling
   every accented chapter's URL on every single request, no matter how
   correct the encoding was going in. The fix is to never let that
   redirect fire at all: request the clean URL directly (Cloudflare
   serves the same file at both; only the .html→clean-URL *hop* is
   broken), by stripping the extension here before encoding. */
const chapterURL = (e) => {
  if (e.rel) {
    const slash = e.rel.indexOf('/');
    if (slash < 0) return e.rel;
    try {
      const dir  = e.rel.slice(0, slash);
      let name = decodeURIComponent(e.rel.slice(slash + 1)).normalize('NFC');
      if (name.toLowerCase().endsWith('.html')) name = name.slice(0, -5);
      return dir + '/' + encodeURIComponent(name);
    } catch { return e.rel; }
  }
  return 'file://' + e.path.split('/').map(s => encodeURIComponent(s.normalize('NFC'))).join('/');
};

function todaysTitan() {
  const es = CODEX.entries;
  if (!es.length) return null;
  /* Shaky ground first — a topic you half-know will cost you the question. */
  const shaky = es.filter(e => topicConf(e.id) === 1);
  if (shaky.length) return { e: shaky[hashOf(todayKey()) % shaky.length], why: 'You marked this one shaky' };

  const due = es.filter(e => isDue(e.id));
  if (due.length) {
    const worst = due.sort((a, b) => daysSince(b.id) - daysSince(a.id))[0];
    return { e: worst, why: `Fading — ${daysSince(worst.id)} days since you touched it` };
  }

  const started = es.filter(e => { const w = STAGE[topicStage(e.id)].w; return w >= 1 && w < 3; });
  if (started.length) return { e: started[0], why: 'Started and left unfinished' };

  const fresh = es.filter(e => topicStage(e.id) === 'untouched');
  if (fresh.length) return { e: fresh[hashOf(todayKey()) % fresh.length], why: 'Still unopened' };

  return { e: es[hashOf(todayKey()) % es.length], why: 'All held — keep it that way' };
}

const constelNodes = () => CODEX.entries.map(e => ({
  id: e.id,
  /* the canvas only needs three tiers of brightness */
  state: isHeld(e.id) ? 'dominado' : STAGE[topicStage(e.id)].w >= 1 ? 'curso' : 'nuevo',
  color: topicConf(e.id) === 1 ? '#f0857a' : areaColor(e.area),
}));

/* ═══════════════════════════════════════════════════════════════════════
   EMBERS
   ═══════════════════════════════════════════════════════════════════════ */

function allVoices() {
  const seed = SEEDS.map((v, i) => ({ ...v, id: 'seed-' + i, seed: true }))
    .filter(v => !S.hidden.includes(v.id));
  return [...seed, ...S.voices];
}
const LORE = new Set(['khaslana', 'amphoreus', 'wanderer', 'alatus']);
const isFriend  = (v) => !LORE.has(v.fuente) && v.fuente !== 'self';
const voiceClass = (v) => LORE.has(v.fuente) ? v.fuente : v.fuente === 'self' ? 'propia' : 'amigo';
const VOICE_NAME = { khaslana: 'Khaslana', amphoreus: 'Amphoreus', wanderer: 'The Wanderer', alatus: 'Alatus' };
const voiceWho   = (v) => VOICE_NAME[v.fuente] || (v.fuente === 'self' ? 'You' : v.fuente);

function verseOfDay() {
  const all = allVoices();
  if (!all.length) return null;
  const pref = aspect().voices;
  /* Friends count double; the active aspect's own register counts double
     too, so the room you are standing in is the one that speaks. */
  const pool = all.flatMap(v =>
    isFriend(v) ? [v, v] : pref.includes(v.fuente) ? [v, v] : [v]);
  return pool[hashOf('verse' + todayKey() + (S.aspect || '')) % pool.length];
}

/* ═══════════════════════════════════════════════════════════════════════
   CHRONICLE
   ═══════════════════════════════════════════════════════════════════════ */

function draw(cat) {
  const pool = PROMPTS[cat] || [];
  if (!pool.length) return 0;
  if (!S.decks[cat] || !S.decks[cat].length) {
    const idx = pool.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    S.decks[cat] = idx;
  }
  const n = S.decks[cat].shift();
  save();
  return n;
}

const CATS = ['gratitud', 'intencion', 'afirmacion', 'cierre', 'aprendizaje'];

function dayJournal(key) {
  if (!S.journal[key]) {
    S.journal[key] = {
      prompts: Object.fromEntries(CATS.map(c => [c, draw(c)])),
      a: { gratitud:['','',''], intencion:['','',''], afirmacion:'', cierre:['','',''], aprendizaje:'' },
    };
    save();
  }
  return S.journal[key];
}

const journalFilled = (j) => {
  const a = j.a || {};
  return [...(a.gratitud||[]), ...(a.intencion||[]), a.afirmacion, ...(a.cierre||[]), a.aprendizaje]
    .filter(x => x && x.trim()).length;
};

/* ═══════════════════════════════════════════════════════════════════════
   DAWN
   ═══════════════════════════════════════════════════════════════════════ */

function salutation() {
  const h = new Date().getHours();
  const g = aspect().greetings;
  return h < 5 ? g[0] : h < 12 ? g[1] : h < 18 ? g[2] : g[3];
}

/* The ambient light follows the hour *and* the aspect. It used to be one
   shared palette, which meant the room looked the same whichever register
   you were walking in — the accents changed and nothing else did. Now
   Amphoreus is warm at every hour, Inazuma is cold at every hour, and
   Liyue is jade until the lanterns go up at dusk. */
function ambientLight() {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  const p = aspect().ambient || ASPECTS.khaslana.ambient;
  if (h < 5)  return p[0];   // deep night
  if (h < 8)  return p[1];   // dawn
  if (h < 16) return p[2];   // day
  if (h < 20) return p[3];   // dusk
  return p[4];               // late
}

/* ═══════════════════════════════════════════════════════════════════════
   THE SCRATCH, READ FOR DATES

   A note jotted mid-shift usually carries a when inside it — "jueves 8pm
   guardia", "12/09 entregar papeles", "mañana llamar al banco". Retyping
   that into the March is exactly the friction that makes people stop
   using a calendar, so the pad is read for those and the block is offered.

   Offered, not inserted. The guess can be wrong — a number in a note is
   not always a date — and a calendar that fills itself behind your back
   is one you stop trusting. One tap moves it across; the note stays put.
   ═══════════════════════════════════════════════════════════════════════ */

const WEEKDAYS_ES = { domingo:0, lunes:1, martes:2, miercoles:3, jueves:4, viernes:5, sabado:6,
                      dom:0, lun:1, mar:2, mie:3, jue:4, vie:5, sab:6 };
const WEEKDAYS_EN = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6,
                      mon:1, tue:2, wed:3, thu:4, fri:5, sat:6, sun:0 };
const MONTHS_ANY = {
  enero:0, febrero:1, marzo:2, abril:3, mayo:4, junio:5, julio:6, agosto:7,
  septiembre:8, setiembre:8, octubre:9, noviembre:10, diciembre:11,
  ene:0, feb:1, abr:3, jun:5, jul:6, ago:7, sept:8, sep:8, oct:9, nov:10, dic:11,
  january:0, february:1, march:2, april:3, may:4, june:5, july:6, august:7,
  september:8, october:9, november:10, december:11,
  jan:0, mar:2, apr:3, aug:7, dec:11,
};

/* What a line is *about*, guessed from the words in it. Order matters:
   the first kind listed wins a tie, so "banco de preguntas" reads as
   questions rather than as an errand at the bank. */
const KIND_HINTS = {
  drill:   ['pregunta','simulacro','reactivo','banco de','quiz','mock','examen de practica','question'],
  study:   ['estudiar','leer','capitulo','clase','curso','tema de','study','read','lecture'],
  review:  ['repas','revisar','flashcard','anki','review'],
  service: ['guardia','turno','servicio','hospital','consulta','pase de visita','clinica','shift','rotacion'],
  people:  ['cumple','boda','cena','comida con','visita','ver a','familia','birthday','dinner'],
  body:    ['gym','gimnasio','correr','entrenar','ejercicio','nadar','run','workout','futbol'],
  mind:    ['terapia','meditar','journal','descansar la mente','psicologo'],
  rest:    ['descanso','dormir','vacaciones','day off','rest'],
  admin:   ['papel','tramite','pagar','banco','cita','entregar','documento','recibo','renovar','inscripcion',
            'appointment','pay','deadline','entrega'],
};

function guessKind(n) {
  let best = 'admin', hi = 0;
  for (const [kind, words] of Object.entries(KIND_HINTS)) {
    const score = words.reduce((a, w) => a + (n.includes(w) ? 1 : 0), 0);
    if (score > hi) { hi = score; best = kind; }
  }
  return best;
}

/* Resolve a weekday to the next time it comes round. Said on a Friday,
   "el viernes" almost always means today — so today counts, unless the
   line says próximo/next. */
function nextWeekday(target, bumpAWeek) {
  const now = new Date();
  let delta = (target - now.getDay() + 7) % 7;
  if (bumpAWeek && delta === 0) delta = 7;
  return keyOf(addDays(now, delta));
}

/* A bare day/month with no year rolls forward, so a note about "5/01"
   written in December lands in January, not eleven months ago. */
function nextDate(month, day) {
  const now = new Date();
  let y = now.getFullYear();
  if (new Date(y, month, day) < new Date(now.getFullYear(), now.getMonth(), now.getDate())) y++;
  return keyOf(new Date(y, month, day));
}

/* Returns { key, span } or null — span is the slice of text that carried
   the date, so it can be lifted out of the block's title. */
function findWhen(n) {
  let m;
  const hit = (key, text) => ({ key, span: text });

  if ((m = /\bpasado ma[nñ]ana\b/.exec(n)))            return hit(keyOf(addDays(new Date(), 2)), m[0]);
  if ((m = /\bma[nñ]ana\b/.exec(n)))                   return hit(keyOf(addDays(new Date(), 1)), m[0]);
  if ((m = /\btomorrow\b/.exec(n)))                    return hit(keyOf(addDays(new Date(), 1)), m[0]);
  if ((m = /\b(hoy|today|tonight|esta noche)\b/.exec(n))) return hit(todayKey(), m[0]);

  /* 12/09, 12-09-2026, 12.09 — day first, the way it is written here. */
  if ((m = /\b(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?\b/.exec(n))) {
    const d = +m[1], mo = +m[2] - 1;
    if (d >= 1 && d <= 31 && mo >= 0 && mo <= 11) {
      if (m[3]) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return hit(keyOf(new Date(y, mo, d)), m[0]); }
      return hit(nextDate(mo, d), m[0]);
    }
  }

  /* 12 de septiembre · 12 sep · sept 12 · September 12 */
  const names = Object.keys(MONTHS_ANY).sort((a, b) => b.length - a.length).join('|');
  if ((m = new RegExp(`\\b(\\d{1,2})\\s*(?:de\\s+)?(${names})\\b`).exec(n)))
    return hit(nextDate(MONTHS_ANY[m[2]], +m[1]), m[0]);
  if ((m = new RegExp(`\\b(${names})\\s+(\\d{1,2})\\b`).exec(n)))
    return hit(nextDate(MONTHS_ANY[m[1]], +m[2]), m[0]);

  /* Weekdays, with or without a próximo in front. */
  const wds = { ...WEEKDAYS_ES, ...WEEKDAYS_EN };
  const wdNames = Object.keys(wds).sort((a, b) => b.length - a.length).join('|');
  if ((m = new RegExp(`\\b(?:el\\s+|this\\s+|on\\s+)?(proximo|next)?\\s*(${wdNames})\\b`).exec(n)))
    return hit(nextWeekday(wds[m[2]], !!m[1]), m[0]);

  /* "el día 15", "el 30" — a bare day of the month. */
  if ((m = /\bel\s+(?:d[ií]a\s+)?(\d{1,2})\b/.exec(n))) {
    const d = +m[1];
    if (d >= 1 && d <= 31) {
      const now = new Date();
      return hit(d >= now.getDate() ? keyOf(new Date(now.getFullYear(), now.getMonth(), d))
                                    : nextDate((now.getMonth() + 1) % 12, d), m[0]);
    }
  }
  return null;
}

/* Returns { time, span } or null. A bare hour with no am/pm is read as
   evening when it is small — a note saying "a las 7" is far more often
   seven at night than seven in the morning, given the shift. */
function findTime(n) {
  const pm = /\b(pm|de la tarde|de la noche|por la tarde|por la noche|tonight)\b/.test(n);
  const am = /\b(am|de la ma[nñ]ana|por la ma[nñ]ana|morning)\b/.test(n);
  const clamp = (h, mm) => `${String(Math.min(23, h)).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  let m;

  /* The "a las" is swallowed with the hour so it doesn't survive into the title. */
  if ((m = /\b(?:a\s+las\s+|at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?\b/.exec(n))) {
    let h = +m[1];
    if ((m[3] === 'pm' || (!m[3] && pm)) && h < 12) h += 12;
    if ((m[3] === 'am' || (!m[3] && am)) && h === 12) h = 0;
    return { time: clamp(h, +m[2]), span: m[0] };
  }
  if ((m = /\b(?:a\s+las\s+|at\s+)?(\d{1,2})\s*(am|pm)\b/.exec(n))) {
    let h = +m[1];
    if (m[2] === 'pm' && h < 12) h += 12;
    if (m[2] === 'am' && h === 12) h = 0;
    return { time: clamp(h, 0), span: m[0] };
  }
  if ((m = /\b(?:a\s+las|at)\s+(\d{1,2})\b/.exec(n))) {
    let h = +m[1];
    if (pm && h < 12) h += 12;
    else if (!am && h < 8) h += 12;
    return { time: clamp(h, 0), span: m[0] };
  }
  return null;
}

/* Read the pad. One line in, at most one block out. */
function readScratch(text) {
  const out = [];
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (line.length < 4) continue;

    const n = norm(line);
    const when = findWhen(n);
    if (!when || when.key < todayKey()) continue;
    const at = findTime(n);

    /* Lift the date and time out, then the connective tissue they leave
       behind, so the block reads as the thing itself. */
    let title = line;
    for (const span of [when.span, at?.span].filter(Boolean)) {
      const i = norm(title).indexOf(span);
      if (i !== -1) title = title.slice(0, i) + title.slice(i + span.length);
    }
    title = title
      .replace(/^[\s\-–—•*·>+]+/, '')
      .replace(/\b(el|la|los|las|de|del|a|al|para|por|on|at|the|this|next|proximo|próximo)\b\s*$/gi, '')
      .replace(/^\s*(el|la|a|at|on|para|para el|the)\b\s*/i, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s,;:.\-–—]+|[\s,;:.\-–—]+$/g, '')
      .trim();
    if (title.length < 2) title = line;

    out.push({
      hash: 'sc' + hashOf(n),
      key: when.key,
      time: at?.time || '',
      text: title.charAt(0).toUpperCase() + title.slice(1),
      kind: guessKind(n),
    });
  }
  /* Two identical lines are one intention. */
  const seen = new Set();
  return out.filter(h => !seen.has(h.hash) && seen.add(h.hash));
}

function sortDay(day) {
  day.tasks.sort((a, b) => {
    const ta = a.time || '99:99', tb = b.time || '99:99';
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });
}

/* Point The March at a day, bringing the month calendar with it — a day in
   October is no use as a selection if the calendar is still showing August. */
function openMarch(key) {
  marchKey = key;
  const d = parseKey(key);
  dcCursor = new Date(d.getFullYear(), d.getMonth(), 1);
  renderScratch();
  renderDawn();
}

function scratchToMarch(hit) {
  const day = dayMarch(hit.key);
  day.tasks.push({ id: uid(), key: uid(), time: hit.time, text: hit.text, kind: hit.kind, done: false, caught: true });
  sortDay(day);
  S.scratchSeen[hit.hash] = { state: 'added', key: hit.key };
  save();
  toast(`On the March · ${shortDate(hit.key)}${hit.time ? ' · ' + hit.time : ''}`);
  /* Show the day it landed on. Sending a block into next Thursday and
     then having no way to look at next Thursday was the whole problem. */
  openMarch(hit.key);
}

function renderScratch() {
  const text = S.scratch || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  $('#scratchMeta').textContent = words ? `${words} ${words === 1 ? 'word' : 'words'}` : '';

  const hits = readScratch(text);
  const open = hits.filter(h => !S.scratchSeen[h.hash]);
  const done = hits.filter(h => S.scratchSeen[h.hash]?.state === 'added');

  const el = $('#scratchCatch');
  if (!open.length && !done.length) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <div class="sc-catch-head">
      <span>${open.length ? `${open.length} ${open.length === 1 ? 'note has' : 'notes have'} a date in it` : 'Caught'}</span>
      ${open.length > 1 ? `<button class="btn sm ghost" id="catchAll">Add all</button>` : ''}
    </div>
    ${open.map(h => `
      <div class="sc-hit" style="--kc:${kindColor(h.kind)}">
        <div class="sc-hit-body">
          <div class="t">${esc(h.text)}</div>
          <div class="m">${esc(shortDate(h.key))}${h.time ? ' · ' + esc(h.time) : ' · no time'} · ${esc(KIND_LABEL[h.kind])}</div>
        </div>
        <button class="sc-hit-go" data-scadd="${h.hash}" title="Put this on the March">→</button>
        <button class="sc-hit-no" data-scskip="${h.hash}" title="Not a date — leave it here">×</button>
      </div>`).join('')}
    ${done.map(h => `
      <div class="sc-hit caught">
        <div class="sc-hit-body">
          <div class="t">${esc(h.text)}</div>
          <div class="m">on the March · ${esc(shortDate(S.scratchSeen[h.hash].key))}</div>
        </div>
        <span class="sc-hit-tick">✓</span>
      </div>`).join('')}`;
}

/* Adding a block by typing it. The same reader the Scratch uses, so
   "18:00 Guardia" gives you a service block at six — you should not have
   to learn a second syntax for the same idea. */
function addBlockToDay() {
  const el = $('#mAdd');
  const raw = (el?.value || '').trim();
  if (!raw) return;
  const at = findTime(norm(raw));
  let text = raw;
  if (at) {
    const i = norm(text).indexOf(at.span);
    if (i !== -1) text = (text.slice(0, i) + text.slice(i + at.span.length)).replace(/\s{2,}/g, ' ').trim();
  }
  text = text.replace(/^[\s\-–—•·]+/, '').trim() || raw;
  const day = dayMarch(marchKey);
  day.tasks.push({
    id: uid(), key: uid(), time: at?.time || '',
    text: text.charAt(0).toUpperCase() + text.slice(1),
    kind: guessKind(norm(raw)), done: false, caught: true,
  });
  sortDay(day);
  save();
  el.value = '';
  renderDawn();
  toast(`Added to ${shortDate(marchKey)}`);
}

function renderDawn() {
  const key = todayKey();
  const d = parseKey(key);
  const left = Math.max(0, daysBetween(key, S.examDate));

  document.documentElement.style.setProperty('--acc-2', ambientLight());

  $('#dateStamp').textContent = `${DAYS[d.getDay()]} · ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  $('#greeting').innerHTML = `${salutation()}, <em>Jordan</em>.`;
  $('#aspectLine').textContent = aspect().line;
  const ex = parseKey(S.examDate);
  $('#cdNum').textContent = left;
  $('#cdCap').textContent = left === 0 ? 'the day itself' : left === 1 ? 'one day remains' : 'days remain';
  $('#cdSub').textContent = `ENARM · ${MONTHS[ex.getMonth()].slice(0,3)} ${ex.getDate()} ${ex.getFullYear()}`;

  const st = dayStats(key);
  const flame = coreflame();
  const held = CODEX.entries.filter(e => isHeld(e.id)).length;
  const last = S.sims.slice(-5);
  const avg = last.length ? Math.round(last.reduce((a,s) => a + s.right/s.total*100, 0) / last.length) : null;

  $('#vitals').innerHTML = `
    <div class="vital flame"><div class="v">${flame}</div><div class="k">${esc(aspect().streak)}</div></div>
    <div class="vital"><div class="v">${held}<small>/${CODEX.entries.length}</small></div><div class="k">${esc(aspect().held)}</div></div>
    <div class="vital"><div class="v">${avg !== null ? avg + '<small>%</small>' : '—'}</div><div class="k">Last five trials</div></div>
    <div class="vital"><div class="v">${Math.ceil(left/7)}</div><div class="k">Weeks remaining</div></div>`;

  /* The week behind you: Monday through Sunday of the current week. */
  const mon = mondayOf(new Date());
  $('#weekLine').innerHTML = Array.from({ length: 7 }, (_, i) => {
    const dd = addDays(mon, i), k = keyOf(dd);
    const isToday = k === key;
    const ahead = daysBetween(key, k) > 0;
    const s = S.ritual[k] ? dayStats(k) : null;
    const cls = ahead ? 'ahead' : s?.lit ? 'lit' : (s && s.done > 0) ? 'part' : '';
    const title = ahead ? 'still ahead' : s ? `${s.done}/${s.total} · study ${s.studyDone}/${s.study}` : 'nothing logged';
    return `<div class="wl-day ${cls} ${isToday ? 'today' : ''}" title="${esc(shortDate(k))} — ${esc(title)}">
      <div class="wd">${DAY3[dd.getDay()]}</div><div class="wdot"></div></div>`;
  }).join('');

  /* Shortcuts — the monogram is drawn, not fetched, so nothing phones home.
     If a native scheme is set the chip opens the app; the ↗ always opens web. */
  $('#shortcuts').innerHTML = (S.shortcuts || []).map(s => `
    <span class="sc-wrap" style="--sc:${esc(s.color)}">
      <a class="sc ${s.app ? 'has-app' : ''}" href="${esc(s.app || s.url)}"
         ${s.app ? `data-app="${esc(s.app)}"` : 'target="_blank" rel="noopener noreferrer"'}
         title="${esc(s.app ? s.app + '  (native app)' : s.url)}">
        <span class="sc-mark">${scGlyph(s.label)
          ? `<svg viewBox="0 0 24 24" aria-hidden="true">${scGlyph(s.label)}</svg>`
          : esc((s.label || '?').trim().charAt(0).toUpperCase())}</span>
        <span class="sc-label">${esc(s.label)}</span>
      </a>
      ${s.app ? `<a class="sc-web" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"
                    title="Open the web version instead">↗</a>` : ''}
    </span>`).join('') +
    `<button class="sc sc-edit" data-goto="setup" title="Edit shortcuts">
       <span class="sc-mark">+</span><span class="sc-label">Edit</span></button>`;

  const v = verseOfDay();
  $('#verse').innerHTML = v
    ? `<p>${esc(v.texto)}</p><div class="attrib">— ${esc(voiceWho(v))}</div>`
    : `<p style="font-style:normal;font-size:17px;color:var(--faint)">Add embers and one will surface here each morning.</p>`;

  /* The March follows whichever day is selected in the month calendar, not
     today — a block sent forward from the Scratch is invisible otherwise,
     which is the whole reason for sending it forward. */
  const mk = marchKey, md = parseKey(mk);
  const ahead = mk > key, behind = mk < key;
  const day = dayMarch(mk);
  const mst = dayStats(mk);

  $('#ritualDay').innerHTML = mk === key
    ? `${DAYS[d.getDay()]} · ${day.tasks.length} blocks`
    : `${shortDate(mk)} · ${day.tasks.length} blocks <span class="rd-when">${ahead ? 'still ahead' : 'already walked'}</span>`;
  $('#ritualBack').hidden = mk === key;

  $('#ritualList').innerHTML = (day.tasks.length ? day.tasks.map(t => `
    <div class="task ${t.done ? 'done' : ''} ${ahead ? 'plan' : ''} ${S.timer?.taskId === t.id ? 'running' : ''}"
         style="--kc:${kindColor(t.kind)}" data-task="${t.id}" data-tday="${mk}">
      <div class="mark-box"></div>
      <div class="task-body">
        <div class="t">${esc(t.text)}${t.caught ? '<span class="from-scratch" title="Caught in the Scratch">✦</span>' : ''}</div>
        <div class="m">
          <span class="hh">${esc(t.time || '—')}</span>
          <span class="anchor"><i></i>${esc(KIND_LABEL[t.kind] || t.kind)}</span>
        </div>
      </div>
      ${t.done || ahead ? '' : `<button class="task-run" data-run="${t.id}" title="Start ${DEFAULT_MINUTES} minutes on this">◷</button>`}
      ${mk === key ? '' : `<button class="task-kill" data-tkill2="${t.id}" data-tday="${mk}" title="Remove from this day">×</button>`}
    </div>`).join('')
    : `<div class="empty" style="margin:16px 24px">Nothing on the March for ${esc(shortDate(mk))}.</div>`)
    + `<div class="march-add">
         <input id="mAdd" placeholder="Add a block to ${esc(mk === key ? 'today' : shortDate(mk))} — e.g. 18:00 Guardia" autocomplete="off">
         <button class="btn sm ghost" id="mAddGo">Add</button>
       </div>`;

  $('#dayBar').style.width = mst.pct + '%';
  $('#dayPct').textContent = mst.pct + '%';
  $('#dayMeta').textContent = ahead
    ? `${day.tasks.length} planned · study ${mst.study}`
    : `${mst.done} of ${mst.total} · study ${mst.studyDone}/${mst.study}`;

  /* What's next on the March — the first unticked block still ahead.
     Always about today, whatever day the list is showing. */
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const toMin = (t) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec((t || '').trim());
    return m ? +m[1] * 60 + +m[2] : null;
  };
  const pending = dayMarch(key).tasks.filter(t => !t.done);
  const upcoming = pending.filter(t => { const m = toMin(t.time); return m !== null && m >= nowMin; })
    .sort((a, b) => toMin(a.time) - toMin(b.time));
  const next = upcoming[0] || pending[0] || null;

  const nb = $('#nextBlock');
  nb.classList.toggle('done-all', !next);
  nb.innerHTML = next ? `
    <div style="--kc:${kindColor(next.kind)}">
      <div class="nb-when">${upcoming.length ? 'Next up' : 'Still owed'} · ${esc(next.kind)}</div>
      <div class="nb-time">${esc(next.time || '—')}</div>
      <div class="nb-text">${esc(next.text)}</div>
    </div>`
    : `<div class="nb-when" style="--kc:var(--ok)">The March</div>
       <div class="nb-time">All done.</div>
       <div class="nb-text">Nothing left owed today. That is the whole point of writing it down.</div>`;

  const f = todaysTitan();
  $('#focusCard').innerHTML = f ? `
    <div class="fc-head">
      <h3 class="sect">${esc(aspect().titan)}</h3>
      <div class="entry-sub" style="margin-top:5px">${esc(f.why)}</div>
    </div>
    <div class="fc-body" style="--pc:${areaColor(f.e.area)}">
      <div class="fc-title">${esc(f.e.title)}</div>
      ${f.e.subtitle ? `<div style="font-size:12.5px;color:var(--faint);line-height:1.55;margin-bottom:12px">${esc(f.e.subtitle)}</div>` : ''}
      <div class="row" style="gap:6px">
        <span class="pill" style="border-color:${areaColor(f.e.area)}66;color:${areaColor(f.e.area)}">${esc(f.e.areaLabel)}</span>
        <span class="pill">${(f.e.sections||[]).length} sections</span>
        ${f.e.cases ? `<span class="pill gold">${f.e.cases} cases</span>` : ''}
      </div>
      <div class="fc-acts">
        <button class="btn primary" data-read="${esc(f.e.id)}">Read it</button>
        <button class="btn" data-dock="${esc(f.e.id)}">Look inside</button>
      </div>
    </div>`
    : `<div class="fc-body"><div class="empty">The Atlas is empty. Run the indexer from Setup.</div></div>`;

  $('#constelCount').textContent = `${held} of ${CODEX.entries.length}`;
  drawConstellation($('#constelMini'), constelNodes(), { height: 176 });

  const isMon = new Date().getDay() === 1;
  const target = isMon ? new Date() : mondayOf(addDays(new Date(), 7));
  const away = daysBetween(key, keyOf(target));
  $('#nextRelease').innerHTML = `
    <h3 class="sect" style="margin-bottom:10px">Next unsealing</h3>
    <div style="font-family:var(--serif);font-size:30px;color:var(--paper);line-height:1.1">
      ${isMon ? 'Today' : shortDate(keyOf(target))}</div>
    <div class="entry-sub" style="margin-top:7px">
      ${isMon ? 'Check the platform and log what opened' : `in ${away} ${away===1?'day':'days'} · Monday`}</div>`;

  renderDawnCal();
}

/* ── The month, on Dawn — the Coreflame's own record ──
   Chronicle's calendar tracks what you wrote; this one tracks what you did. */
let dcCursor = null;

/* Which day The March is showing. The calendar sets it; it resets to today
   on its own if the app is left open across midnight. */
let marchKey = todayKey();

function renderDawnCal() {
  if (!dcCursor) { const d = new Date(); dcCursor = new Date(d.getFullYear(), d.getMonth(), 1); }
  const y = dcCursor.getFullYear(), m = dcCursor.getMonth();
  $('#dcMonth').textContent = `${MONTHS[m]} ${y}`;

  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const tk = todayKey();
  const exam = S.examDate;

  const cells = ['M','T','W','T','F','S','S'].map(d => `<div class="dow">${d}</div>`);
  for (let i = 0; i < lead; i++) cells.push('<span class="cal-cell blank"></span>');

  let lit = 0;
  for (let d = 1; d <= days; d++) {
    const k = keyOf(new Date(y, m, d));
    const st = S.ritual[k] ? dayStats(k) : null;
    const isLit = st?.lit;
    if (isLit) lit++;
    /* A day with blocks on it but nothing ticked still gets a mark — that
       is what a plan is, and a future day that looks identical to an empty
       one is the reason none of this was visible before. */
    const planned = plannedCount(k);
    const cls = [
      isLit ? 'burn' : st && st.done > 0 ? 'part' : planned && k > tk ? 'planned' : '',
      k === tk ? 'today' : '',
      k === marchKey ? 'sel' : '',
      k === exam ? 'exam' : '',
      k > tk ? 'future' : '',
    ].filter(Boolean).join(' ');
    const title = k === exam ? 'ENARM'
      : k > tk ? (planned ? `${planned} planned — open it` : 'nothing planned yet — open it')
      : st ? `${st.done}/${st.total} · study ${st.studyDone}/${st.study}` : 'nothing logged';
    cells.push(`<button class="cal-cell ${cls}" data-mday="${k}" title="${esc(title)}">${d}</button>`);
  }

  $('#dcGrid').innerHTML = cells.join('');
  const away = Math.max(0, daysBetween(tk, exam));
  $('#dcLegend').innerHTML = `${lit} ${lit === 1 ? 'day' : 'days'} lit this month` +
    (parseKey(exam).getMonth() === m && parseKey(exam).getFullYear() === y
      ? ` · <span style="color:var(--ember)">the ENARM is this month</span>`
      : ` · ${away} to go`);
}

/* Atlas and Embers already carry a live count in their nav tag; Path and
   Chronicle used to say "the road" and "journal" forever, which is a
   label, not information. Recomputed on every navigation — cheap, and it
   means the tag is never more than one room-switch stale. */
function updateNavTags() {
  const left = Math.max(0, daysBetween(todayKey(), S.examDate));
  const weeks = Math.floor(left / 7);
  const tp = $('#tagPath');
  if (tp) tp.textContent = left <= 0 ? 'exam week' : weeks >= 1 ? `${weeks}w left` : `${left}d left`;

  const j = S.journal[todayKey()];
  const tc = $('#tagChronicle');
  if (tc) tc.textContent = (j && journalFilled(j) > 0) ? 'written today' : 'journal';
}


/* ═══════════════════════════════════════════════════════════════════════
   ATLAS
   ═══════════════════════════════════════════════════════════════════════ */

let codexQuery = '', codexArea = 'all', codexState = 'all', codexView = 'list';

function scoreTopic(e, q) {
  if (!q) return 1;
  let s = 0;
  const t = norm(e.title);
  if (t.includes(q)) s += 200 - t.indexOf(q);
  if ((e.aliases||[]).some(a => norm(a).includes(q))) s += 150;
  if (norm(e.subtitle).includes(q)) s += 80;
  const h = (e.sections||[]).findIndex(x => norm(x).includes(q));
  if (h !== -1) s += 60 - Math.min(h, 40);
  if (e.haystack.includes(q)) s += 10;
  return s;
}

/* Three dots: shaky · okay · solid. Click one to set it, click it again to clear. */
const confDots = (id, conf) => `<span class="conf" title="How well it stuck">${
  [1,2,3].map(n => `<button class="cdot ${conf >= n ? 'on' : ''}" data-conf="${id}" data-n="${n}"
      style="--dc:${CONF[conf || 0].color}" title="${CONF[n].label}"></button>`).join('')
}</span>`;

/* The three filters — search, area, stage — used to live only inside
   renderAtlas's grid path. The Graph needs the exact same set (a filtered
   node should mean the same thing whichever view is showing it), so this
   is the one place that decides what "matches" means. */
function filteredTopics() {
  const q = norm(codexQuery.trim());
  return CODEX.entries
    .filter(e => codexArea === 'all' || e.area === codexArea)
    .filter(e => codexState === 'all' ? true
              : codexState === 'due'   ? isDue(e.id)
              : codexState === 'shaky' ? topicConf(e.id) === 1
              : topicStage(e.id) === codexState)
    .map(e => ({ e, s: scoreTopic(e, q) }))
    .filter(x => x.s > 0)
    .sort((a, b) => q ? b.s - a.s : a.e.title.localeCompare(b.e.title, 'es'));
}

function renderAtlas() {
  const counts = {};
  for (const e of CODEX.entries) counts[e.area] = (counts[e.area] || 0) + 1;

  $('#codexFilters').innerHTML = [
    `<button class="chip ${codexArea==='all'?'on':''}" data-area="all" style="--pc:var(--gold)">All <span class="n">${CODEX.entries.length}</span></button>`,
    ...CODEX.areas.filter(a => counts[a.id]).map(a =>
      `<button class="chip ${codexArea===a.id?'on':''}" data-area="${a.id}" style="--pc:${areaColor(a.id)}"><span class="pdot"></span>${esc(a.label)} <span class="n">${counts[a.id]}</span></button>`),
    `<span class="div"></span>`,
  ].join('');

  const nDue = CODEX.entries.filter(e => isDue(e.id)).length;
  const nShaky = CODEX.entries.filter(e => topicConf(e.id) === 1).length;

  $('#stageFilters').innerHTML = [
    `<button class="chip ${codexState==='all'?'on':''}" data-state="all" style="--pc:var(--gold)">Any stage</button>`,
    ...STAGES.map(s => {
      const n = CODEX.entries.filter(e => topicStage(e.id) === s).length;
      return `<button class="chip ${codexState===s?'on':''}" data-state="${s}" style="--pc:var(--gold)" title="${STAGE[s].hint}">${STAGE[s].label} <span class="n">${n}</span></button>`;
    }),
    `<span class="div"></span>`,
    `<button class="chip ${codexState==='due'?'on':''}" data-state="due" style="--pc:var(--warn)">Due for review <span class="n">${nDue}</span></button>`,
    `<button class="chip ${codexState==='shaky'?'on':''}" data-state="shaky" style="--pc:var(--crit)">Shaky <span class="n">${nShaky}</span></button>`,
  ].join('');

  const q = norm(codexQuery.trim());
  const list = filteredTopics();

  $$('.vt', $('#viewToggle')).forEach(b => b.classList.toggle('on', b.dataset.vt === codexView));
  $('#codexGrid').hidden = codexView !== 'list';
  $('#codexGraph').hidden = codexView !== 'graph';
  if (codexView === 'graph') {
    renderGraphView(new Set(list.map(x => x.e.id)));
    $('#tagAtlas').textContent = CODEX.entries.length;
    return;
  }

  $('#codexGrid').innerHTML = list.length ? list.map(({ e }) => {
    const rec = topicRec(e.id);
    let keys;
    if (q) {
      const hit = (e.sections||[]).find(h => norm(h).includes(q));
      keys = hit || e.subtitle || (e.sections||[]).slice(0,3).join(' · ');
      keys = esc(keys).replace(
        new RegExp(`(${codexQuery.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'ig'), '<mark>$1</mark>');
    } else {
      keys = esc(e.subtitle || (e.sections||[]).slice(0,3).join(' · '));
    }
    return `
      <article class="topic ${isHeld(e.id) ? 'held' : ''}" style="--pc:${areaColor(e.area)}" data-id="${e.id}">
        <div class="tp-area"><i></i>${esc(e.areaLabel)}</div>
        <h4 class="tp-title">${esc(e.title)}</h4>
        <div class="tp-keys">${keys}</div>
        <div class="tp-foot">
          <button class="state-cycle" data-w="${STAGE[rec.stage].w}" data-stage="${e.id}"
                  title="${STAGE[rec.stage].hint} — click to advance">${STAGE[rec.stage].label}</button>
          ${confDots(e.id, rec.conf)}
          ${isDue(e.id) ? `<span class="due-mark" title="${daysSince(e.id)} days since you touched it">due</span>` : ''}
          <span class="spacer"></span>
          <button class="open-link" data-read="${esc(e.id)}" style="color:var(--gold)">Read →</button>
        </div>
      </article>`;
  }).join('') : `<div class="empty" style="grid-column:1/-1">Nothing matches.</div>`;

  $('#tagAtlas').textContent = CODEX.entries.length;
}

/* ── Chapter zoom ───────────────────────────────────────────────────────
   The chapters are generated at one size and read on a laptop, in a side
   panel that is half the width they assume. `zoom` on the chapter's own
   documentElement rather than `transform: scale()` on the iframe: zoom
   reflows, so the text rewraps to the panel and the tables stay inside it,
   where a scale would just make a too-wide layout bigger and hand you a
   horizontal scrollbar.

   One level shared by the panel and the full reader, and remembered — the
   size that suits your eyes is not a per-chapter decision. */
const ZOOM_STEPS = [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2];

const readZoom = () => (typeof S.readZoom === 'number' ? S.readZoom : 1);

function applyZoom(frame) {
  if (!frame) return;
  const set = () => {
    try {
      const d = frame.contentDocument;
      if (d?.documentElement) d.documentElement.style.zoom = readZoom();
    } catch { /* cross-origin — only possible from file://, where the frame is empty anyway */ }
  };
  set();
  /* The document may not exist yet on a fresh src, so catch it on load too. */
  frame.addEventListener('load', set, { once: true });
}

function applyZoomAll() {
  const pct = Math.round(readZoom() * 100) + '%';
  $$('.zoomer .z-val').forEach(b => b.textContent = pct);
  $$('.zoomer').forEach(z => z.classList.toggle('off', readZoom() === 1));
  applyZoom($('#dockRead iframe'));
  applyZoom($('#rdFrame'));
}

/* step: -1 smaller, +1 bigger, 0 back to 100%. */
function stepZoom(step) {
  if (step === 0) S.readZoom = 1;
  else {
    const i = ZOOM_STEPS.indexOf(readZoom());
    const at = i === -1 ? ZOOM_STEPS.indexOf(1) : i;
    S.readZoom = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, at + step))];
  }
  save();
  applyZoomAll();
  toast(`Chapter at ${Math.round(readZoom() * 100)}%`);
}

/* Belt-and-suspenders under everything upstream of this (chapterURL()'s
   own NFC fix, the service worker's guard against caching a disguised
   shell): same-origin means a chapter iframe's own document is readable
   the moment it loads, which makes this the one place that can catch
   the wrong content regardless of *why* it was wrong — a stale copy
   from before any of those fixes existed, a deploy still propagating, a
   flaky connection, anything. If what actually loaded is Khaslana's own
   shell instead of the chapter, retry once with a cache-busting query
   string — a new URL is a new cache key, nothing stale can be sitting
   under it — and only give up and call onFail if the retry also comes
   back wrong. */
function guardChapterFrame(frame, url, onFail) {
  let attempt = 0;
  const check = () => {
    let doc;
    try { doc = frame.contentDocument; } catch { return; }   // cross-origin: not ours to guard (Access's own login page, say — a different, already-visible problem)
    if (!doc) return;
    /* Two independent signals, not one — the title alone missed a real
       case: a fresh Cloudflare Access session redirecting through its own
       login flow can transiently land back on Khaslana's shell with a
       title that isn't a clean "KHASLANA" (a query string or hash still
       attached, whitespace, whatever the redirect chain leaves behind).
       #nav is Khaslana's own room list — no chapter's own HTML has an
       element with that id — so it catches the shell by what it actually
       *is*, not by a string that redirect noise can slip past. */
    const looksLikeKhaslana = doc.title.includes('KHASLANA') || !!doc.getElementById('nav');
    if (!looksLikeKhaslana) return;   // loaded fine
    attempt++;
    if (attempt > 1) { onFail?.(); return; }
    frame.addEventListener('load', check, { once: true });
    frame.src = url + (url.includes('?') ? '&' : '?') + '_r=' + Date.now();
  };
  frame.addEventListener('load', check, { once: true });
}

/* ── The dock ───────────────────────────────────────────────────────────
   One click on a card and you are reading. It used to take two — the card
   opened a panel of metadata, and the chapter was a second click behind a
   button — which is two clicks too many for the thing the room exists to
   do. The chapter is now loaded straight into the panel and the metadata
   moved behind a tab, because reading is the common case and grading
   yourself on a topic is the rare one. */
let dockPane = 'read';

function openDock(id, pane) {
  const e = CODEX.entries.find(x => x.id === id);
  if (!e) return;

  /* The dock is a side panel with an embedded iframe reading the chapter
     in place. On touch input (see isTouchNarrow — a wide tablet counts:
     it's still a finger, matchMedia('(max-width: 900px)') alone was
     letting an iPad in landscape fall straight through to this and hit
     the same unscrollable panel a phone used to), that embedded iframe
     has not scrolled reliably through several different fixes aimed at
     it directly — while the exact same content in the full-width reader
     (#reader/#rdFrame) always has. Skip the twin that doesn't work and
     go straight to the one that does. Details (the other dock tab —
     stage, confidence, sections) isn't an iframe and was never part of
     this, so it still opens in the dock as normal. */
  if ((pane || dockPane) === 'read' && CAN_READ_INLINE && isTouchNarrow()) {
    return openReader(id);
  }

  const c = areaColor(e.area);
  const rec = topicRec(e.id);
  const same = $('#dock').dataset.id === id;
  if (pane) dockPane = pane;

  $('#dkArea').textContent = e.areaLabel;
  $('#dkArea').style.color = c;
  $('#dkTitle').textContent = e.title;
  $('#dkSub').textContent = e.subtitle || '';
  $('#dock').style.setProperty('--pc', c);

  /* Only rebuild the iframe when the chapter actually changes — re-setting
     src on a re-render would throw away your scroll position every time you
     advanced a stage. */
  if (!CAN_READ_INLINE) {
    dockPane = 'info';
    $('#dockRead').innerHTML = '';
  } else if (!same || !$('#dockRead').firstChild) {
    const url = chapterURL(e);
    $('#dockRead').innerHTML = `<iframe src="${esc(url)}" title="${esc(e.title)}" loading="lazy"></iframe>`;
    guardChapterFrame($('#dockRead iframe'), url, () => {
      $('#dockRead').innerHTML = `<div class="uxf-fail" style="position:static;height:100%">
        <p><b>This chapter loaded wrong twice in a row.</b></p>
        <p class="uxf-fail-sub">Not a caching problem on this device — a real network or deploy issue.
           Try again in a moment, or open it in its own tab.</p>
        <a class="btn sm" href="${esc(url)}" target="_blank" rel="noopener">Abrir aparte ↗</a>
      </div>`;
    });
  }
  $$('.dtab').forEach(b => b.classList.toggle('on', b.dataset.dtab === dockPane));
  $('.dock-tabs').classList.toggle('no-read', !CAN_READ_INLINE);
  document.documentElement.dataset.dpane = dockPane;
  applyZoomAll();

  $('#dockBody').innerHTML = `
    <div style="--pc:${c}">
      <div class="dock-meta">
        ${e.cases  ? `<span class="pill gold">${e.cases} clinical cases</span>` : ''}
        ${e.tables ? `<span class="pill">${e.tables} tables</span>` : ''}
        ${e.flows  ? `<span class="pill">${e.flows} algorithms</span>` : ''}
      </div>

      <div class="dock-sec">Where you are with it</div>
      <div class="stage-ladder">
        ${STAGES.map(s => `
          <button class="rung ${rec.stage === s ? 'on' : ''} ${STAGE[s].w < STAGE[rec.stage].w ? 'past' : ''}"
                  data-setstage="${e.id}" data-to="${s}" title="${STAGE[s].hint}">
            <span class="rl">${STAGE[s].label}</span>
            <span class="rh">${STAGE[s].hint}</span>
          </button>`).join('')}
      </div>

      <div class="dock-sec">How well it stuck</div>
      <div class="conf-row">
        ${[1,2,3].map(n => `
          <button class="cbtn ${rec.conf === n ? 'on' : ''}" data-conf="${e.id}" data-n="${n}"
                  style="--dc:${CONF[n].color}">${CONF[n].label}</button>`).join('')}
      </div>
      <div class="entry-sub" style="margin-top:10px;line-height:1.7;text-transform:none;letter-spacing:0;font-family:var(--sans);font-size:12px">
        ${rec.touched
          ? `Last touched ${daysSince(e.id) === 0 ? 'today' : `${daysSince(e.id)} days ago`}${
              isDue(e.id) ? ' — wants revisiting' : rec.conf ? `, fresh for about ${Math.max(0, REVIEW_AFTER[rec.conf] - daysSince(e.id))} more days` : ''}`
          : 'Never touched.'}
      </div>

      ${(e.aliases||[]).length ? `
        <div class="dock-sec">Also known as</div>
        <div style="font-size:13px;color:var(--dim);line-height:1.7">${e.aliases.map(esc).join(' · ')}</div>` : ''}

      <div class="dock-sec">${(e.sections||[]).length} sections</div>
      <ul class="dock-list">${(e.sections||[]).map(s => `<li>${esc(s)}</li>`).join('')}</ul>

      ${e.source ? `
        <div class="dock-sec">Source</div>
        <div style="font-size:12px;color:var(--faint);line-height:1.7">${esc(e.source)}</div>` : ''}

      <div class="dock-acts">
        <button class="btn primary" data-read="${e.id}">Read it full width</button>
        ${e.cases ? `<button class="btn" data-exam="${esc(e.title)}" data-n="${e.cases}">Log a trial on this</button>` : ''}
      </div>
    </div>`;

  document.documentElement.classList.add('docked');
  $('#dock').dataset.id = id;
}
/* Same fix as closeReader() below, and the same reasoning: #dock stays
   mounted off-screen (visibility:hidden, not display:none) so its close
   animation can run, which means its own embedded chapter iframe kept
   rendering in the background too. isTouchNarrow() sends touch input to
   the reader instead, so this path is mouse/trackpad-only on a normal
   laptop or desktop — but a 2-in-1 with a trackpad attached doesn't
   always report (hover:none), so it can still land here on a touch
   screen and hit the identical freeze. */
function closeDock() {
  document.documentElement.classList.remove('docked');
  setTimeout(() => {
    if (document.documentElement.classList.contains('docked')) return;
    const iframe = $('#dockRead iframe');
    if (iframe) iframe.src = 'about:blank';
    $('#dock').dataset.id = '';
  }, 550);
}

/* ── The Reader ──
   Chrome treats every local file as its own opaque origin, so a file:// page
   gets a blank iframe. Opened that way we hand the chapter to a real tab
   instead of showing an empty reader. Run abrir.command to read in place. */
const CAN_READ_INLINE = location.protocol !== 'file:';

let readingId = null;

function openReader(id) {
  const e = CODEX.entries.find(x => x.id === id);
  if (!e) return;

  if (!CAN_READ_INLINE) {
    window.open(chapterURL(e), '_blank');
    toast('Opened in a tab — run abrir.command to read in place');
    return;
  }
  readingId = id;

  const rd = $('#reader');
  rd.style.setProperty('--pc', areaColor(e.area));
  $('#rdArea').textContent = e.areaLabel;
  $('#rdTitle').textContent = e.title;
  $('#rdTab').href = chapterURL(e);
  refreshReaderState();

  /* Sólo recargar si es otro capítulo — volver al mismo conserva tu scroll. */
  const frame = $('#rdFrame');
  const url = chapterURL(e);
  if (frame.dataset.src !== url) {
    frame.src = url;
    frame.dataset.src = url;
    guardChapterFrame(frame, url, () => toast('This chapter loaded wrong twice in a row — try again in a moment.'));
  }
  applyZoomAll();

  document.documentElement.classList.add('reading');
  /* Que Esc funcione de inmediato. Una vez que hagas clic dentro del capítulo
     el foco se va al iframe y el atajo deja de llegar — para eso está la
     flecha de volver, siempre visible. */
  $('#rdBack').focus();
}

function refreshReaderState() {
  if (!readingId) return;
  const rec = topicRec(readingId);
  const btn = $('#rdState');
  btn.textContent = STAGE[rec.stage].label;
  btn.title = STAGE[rec.stage].hint + ' — click to advance';
  btn.dataset.stage = readingId;
  btn.dataset.reread = '1';
  btn.style.color = STAGE[rec.stage].w >= 3 ? 'var(--ok)' : STAGE[rec.stage].w >= 1 ? 'var(--ember)' : '';
}

/* Closing the reader only ever toggled a CSS class — #reader stays
   position:fixed and mounted with opacity:0 (that's what lets the close
   animate and what keeps your scroll position if you come straight back
   in). But #rdFrame's chapter — a few hundred KB of HTML, tables, and
   inline SVGs — kept running off-screen too, indefinitely, since nothing
   ever unloaded it. On a phone or tablet that's real ongoing layout and
   compositing work fighting your next touch — a pinch-zoom, a tab
   switch — for however long it takes the device to catch up, which is
   exactly the "trabado, luego se descongela solo" freeze. Unloading the
   frame a beat after the close transition ends (matching #reader's own
   0.32s) frees that weight without touching the close animation itself
   — and is skipped if you've already reopened the reader by then, so
   flipping quickly between chapters still doesn't pay this cost. */
function closeReader() {
  document.documentElement.classList.remove('reading');
  setTimeout(() => {
    if (document.documentElement.classList.contains('reading')) return;
    const frame = $('#rdFrame');
    frame.src = 'about:blank';
    frame.dataset.src = '';
  }, 400);
}

/* ═══════════════════════════════════════════════════════════════════════
   PATH
   ═══════════════════════════════════════════════════════════════════════ */

function renderPath() {
  const exam = parseKey(S.examDate);
  const thisMon = keyOf(mondayOf(new Date()));
  const rows = [];
  let cur = mondayOf(new Date()), n = 1;

  while (cur <= exam && n < 80) {
    const k = keyOf(cur), end = addDays(cur, 6), now = k === thisMon;
    rows.push(`
      <div class="week-row ${now ? 'now' : ''}">
        <div>
          <div class="wk">Week ${n}</div>
          <div class="wnote">${MONTHS[cur.getMonth()].slice(0,3)} ${cur.getDate()} – ${MONTHS[end.getMonth()].slice(0,3)} ${end.getDate()}</div>
        </div>
        <input type="text" data-week="${k}" value="${esc(S.weekNotes[k] || '')}"
               placeholder="${now ? 'What this week is for…' : '…'}">
      </div>`);
    cur = addDays(cur, 7); n++;
  }
  $('#weekStrip').innerHTML = rows.join('') || `<div class="empty">Check the exam date in Setup.</div>`;

  const byArea = {};
  for (const e of CODEX.entries) {
    byArea[e.area] ??= { label: e.areaLabel, total: 0, held: 0, open: 0 };
    byArea[e.area].total++;
    if (isHeld(e.id)) byArea[e.area].held++;
    else if (STAGE[topicStage(e.id)].w >= 1) byArea[e.area].open++;
  }
  $('#areaProgress').innerHTML = Object.entries(byArea)
    .sort((a,b) => b[1].total - a[1].total)
    .map(([id,a]) => `
      <div class="subject-row" style="--pc:${areaColor(id)}">
        <div class="sr-top">
          <span class="sr-name">${esc(a.label)}</span>
          <span class="sr-n">${a.held}/${a.total}${a.open ? ` · ${a.open} open` : ''}</span>
        </div>
        <div class="bar"><i style="width:${Math.round(a.held/a.total*100)}%"></i></div>
      </div>`).join('') || `<div class="empty">No chapters indexed.</div>`;

  const held = CODEX.entries.filter(e => isHeld(e.id)).length;
  $('#constelCount2').textContent = `${held} of ${CODEX.entries.length}`;
  drawConstellation($('#constelBig'), constelNodes(), { height: 260 });

  const spark = S.sims.slice(-24);
  $('#simSpark').innerHTML = spark.length
    ? spark.map(s => {
        const p = Math.round(s.right/s.total*100);
        return `<i style="height:${Math.max(6,p)}%" title="${esc(s.name)} · ${p}%"></i>`;
      }).join('')
    : `<div style="font-size:15px;color:var(--faint);font-family:var(--serif);font-style:italic">No trials sat yet.</div>`;

  $('#simList').innerHTML = S.sims.slice().reverse().slice(0,14).map(s => {
    const p = Math.round(s.right/s.total*100);
    const cls = p >= 70 ? 'good' : p >= 55 ? 'mid' : 'low';
    return `
      <div class="sim-row">
        <div><div class="sname">${esc(s.name)}</div><div class="sdate">${shortDate(s.date)}</div></div>
        <div class="sfrac">${s.right}/${s.total}</div>
        <div class="spct ${cls}">${p}%</div>
      </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════════════
   CHRONICLE
   ═══════════════════════════════════════════════════════════════════════ */

let journalKey = todayKey();

const promptText = (cat, i) => (PROMPTS[cat]||[])[i] ?? (PROMPTS[cat]||[])[0] ?? '';

const lineInputs = (cat, values) => `<div class="lines">${[0,1,2].map(i => `
  <div class="line-in">
    <input type="text" data-j="${cat}" data-i="${i}" value="${esc(values[i]||'')}" placeholder="…">
    <span class="bullet"></span>
  </div>`).join('')}</div>`;

/* Each slot is its own panel — five distinct things to answer, not one long
   list. The names stay in Spanish because the questions are. */
const SLOT = {
  gratitud:    { n: 1, name: 'Gratitud',    hint: 'lo que ya está',          c: 'var(--gold)'   },
  intencion:   { n: 2, name: 'Intención',   hint: 'lo que quieres que pase', c: 'var(--ember)'  },
  afirmacion:  { n: 3, name: 'Ancla',       hint: 'lo que te sostiene',      c: 'var(--rose)'   },
  cierre:      { n: 4, name: 'Cierre',      hint: 'lo que sí pasó',          c: 'var(--cyan)'   },
  aprendizaje: { n: 5, name: 'Aprendizaje', hint: 'lo que te llevas',        c: 'var(--violet)' },
};

function promptBlock(cat, j) {
  const s = SLOT[cat];
  const open = cat === 'afirmacion' || cat === 'aprendizaje';
  const total = open ? 1 : 3;
  const done = open
    ? ((j.a[cat] || '').trim() ? 1 : 0)
    : (j.a[cat] || []).filter(x => x && x.trim()).length;

  return `
    <section class="slot ${done === total ? 'full' : done ? 'part' : ''}" style="--sc:${s.c}">
      <header class="slot-head">
        <span class="slot-n">${String(s.n).padStart(2,'0')}</span>
        <span class="slot-name">${s.name}</span>
        <span class="slot-hint">${s.hint}</span>
        <span class="slot-count">${done}/${total}</span>
        <button class="reroll" data-reroll="${cat}" title="Otra pregunta">⟳</button>
      </header>
      <p class="slot-q">${esc(promptText(cat, j.prompts[cat]))}</p>
      ${open ? `<textarea data-j="${cat}" placeholder="…">${esc(j.a[cat]||'')}</textarea>`
             : lineInputs(cat, j.a[cat] || ['','',''])}
    </section>`;
}

/* How many lines of a half are filled, out of how many it wants. */
function halfCount(j, cats) {
  let done = 0, total = 0;
  for (const c of cats) {
    const open = c === 'afirmacion' || c === 'aprendizaje';
    total += open ? 1 : 3;
    done += open ? ((j.a[c] || '').trim() ? 1 : 0)
                 : (j.a[c] || []).filter(x => x && x.trim()).length;
  }
  return `${done}/${total}`;
}

/* Which half is open. Defaults by the clock — mornings open the dawn half,
   evenings the dusk one — and stays wherever you last put it. */
let duskOpen = null;

function renderChronicle() {
  const j = dayJournal(journalKey);
  const isToday = journalKey === todayKey();
  if (duskOpen === null) duskOpen = new Date().getHours() >= 17;

  $('#entryCard').innerHTML = `
    <div class="entry-head">
      <div>
        <div class="entry-date">${longDate(journalKey)}</div>
        <div class="entry-sub">${isToday ? 'Today' : parseKey(journalKey).getFullYear()} · ${journalFilled(j)} lines</div>
      </div>
      <span class="pill ${isToday ? 'ember' : ''}">${isToday ? 'Open' : 'Archive'}</span>
    </div>
    <section class="block ${duskOpen ? 'shut' : ''}" data-half="dawn">
      <button class="block-when" data-half-toggle="dawn">
        <span class="bw-ico" data-sigil="dawn"></span>
        Al despertar
        <span class="bw-count">${halfCount(j, ['gratitud','intencion','afirmacion'])}</span>
        <span class="bw-chev">▾</span>
      </button>
      <div class="block-body">
        ${promptBlock('gratitud', j)}
        ${promptBlock('intencion', j)}
        ${promptBlock('afirmacion', j)}
      </div>
    </section>

    <section class="block night ${duskOpen ? '' : 'shut'}" data-half="dusk">
      <button class="block-when" data-half-toggle="dusk">
        <span class="bw-ico" data-sigil="dusk"></span>
        Al cerrar el día
        <span class="bw-count">${halfCount(j, ['cierre','aprendizaje'])}</span>
        <span class="bw-chev">▾</span>
      </button>
      <div class="block-body">
        ${promptBlock('cierre', j)}
        ${promptBlock('aprendizaje', j)}
      </div>
    </section>`;

  renderCalendar();
  renderChronStats();
  renderHistory();
  mountEmblems();
}

/* ── The month ── */
let calCursor = null;   // Date pinned to the 1st of the shown month

function renderCalendar() {
  if (!calCursor) { const d = parseKey(journalKey); calCursor = new Date(d.getFullYear(), d.getMonth(), 1); }
  const y = calCursor.getFullYear(), m = calCursor.getMonth();
  $('#calMonth').textContent = `${MONTHS[m]} ${y}`;

  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7;          // weeks start Monday
  const days = new Date(y, m + 1, 0).getDate();
  const tk = todayKey();

  const cells = ['M','T','W','T','F','S','S'].map(d => `<div class="dow">${d}</div>`);
  for (let i = 0; i < lead; i++) cells.push(`<span class="cal-cell blank"></span>`);

  let written = 0;
  for (let d = 1; d <= days; d++) {
    const k = keyOf(new Date(y, m, d));
    const e = S.journal[k];
    const n = e ? journalFilled(e) : 0;
    if (n) written++;
    const cls = [
      n ? 'has' : '',
      k === tk ? 'today' : '',
      k === journalKey ? 'on' : '',
      k > tk ? 'future' : '',
    ].filter(Boolean).join(' ');
    /* the mark widens with how much you wrote that day */
    const w = 4 + Math.min(10, n * 1.1);
    cells.push(`<button class="cal-cell ${cls}" data-jkey="${k}" style="--dw:${w}px" title="${n} lines">${d}</button>`);
  }
  $('#calGrid').innerHTML = cells.join('');
  $('#calLegend').textContent = `${written} ${written === 1 ? 'day' : 'days'} written this month`;
}

/* ── Stats ── */
function renderChronStats() {
  const entries = Object.entries(S.journal).filter(([, e]) => journalFilled(e) > 0);
  const totalLines = entries.reduce((a, [, e]) => a + journalFilled(e), 0);
  const words = entries.reduce((a, [, e]) => {
    const x = e.a || {};
    const all = [...(x.gratitud||[]), ...(x.intencion||[]), x.afirmacion, ...(x.cierre||[]), x.aprendizaje];
    return a + all.filter(Boolean).join(' ').split(/\s+/).filter(Boolean).length;
  }, 0);

  /* Writing streak, counted backwards. Today not yet written doesn't break it. */
  let run = 0, d = new Date();
  const wrote = (dt) => { const e = S.journal[keyOf(dt)]; return e && journalFilled(e) > 0; };
  if (!wrote(d)) d = addDays(d, -1);
  while (wrote(d) && run < 400) { run++; d = addDays(d, -1); }

  /* How much of the repertoire is still unseen */
  const totalPrompts = CATS.reduce((a, c) => a + (PROMPTS[c] || []).length, 0);
  const leftInDecks = CATS.reduce((a, c) => a + (S.decks[c]?.length ?? (PROMPTS[c] || []).length), 0);

  $('#chronStats').innerHTML = `
    <h3 class="sect" style="margin-bottom:14px">The record</h3>
    <div class="cstats">
      <div class="cstat"><div class="cv">${entries.length}</div><div class="ck">days written</div></div>
      <div class="cstat"><div class="cv">${run}</div><div class="ck">day streak</div></div>
      <div class="cstat"><div class="cv">${totalLines}</div><div class="ck">lines kept</div></div>
      <div class="cstat"><div class="cv">${words.toLocaleString('en-GB')}</div><div class="ck">words</div></div>
    </div>
    <div class="entry-sub" style="margin-top:16px;line-height:1.7">
      ${leftInDecks} of ${totalPrompts} questions still unasked
    </div>`;
}

/* ── History, with search across everything you've written ── */
let journalQuery = '';

function renderHistory() {
  const q = norm(journalQuery.trim());
  let keys = Object.keys(S.journal).sort().reverse();

  if (q) {
    keys = keys.filter(k => {
      const x = S.journal[k].a || {};
      const hay = [...(x.gratitud||[]), ...(x.intencion||[]), x.afirmacion, ...(x.cierre||[]), x.aprendizaje]
        .filter(Boolean).join(' ');
      return norm(hay).includes(q);
    });
  } else if (!keys.includes(todayKey())) {
    keys.unshift(todayKey());
  }

  $('#histList').innerHTML = keys.length ? keys.slice(0, 80).map(k => {
    const e = S.journal[k];
    let snip = '';
    if (e) {
      const x = e.a || {};
      const all = [...(x.gratitud||[]), ...(x.intencion||[]), x.afirmacion, ...(x.cierre||[]), x.aprendizaje].filter(Boolean);
      snip = q ? (all.find(s => norm(s).includes(q)) || all[0] || '') : (all[0] || '');
    }
    return `
      <button class="hist-item ${k === journalKey ? 'on' : ''}" data-jkey="${k}">
        <div class="hd">${shortDate(k)}${k === todayKey() ? ' · today' : ''}</div>
        <div class="hp">${snip ? esc(snip) : (e ? `${journalFilled(e)} lines` : 'unopened')}</div>
      </button>`;
  }).join('') : `<div style="padding:14px 16px;font-size:12.5px;color:var(--faint)">Nothing written matches that.</div>`;
}

/* ═══════════════════════════════════════════════════════════════════════
   EMBERS
   ═══════════════════════════════════════════════════════════════════════ */

let voiceFilter = 'all';
let toneFilter = 'all';
let drawnId = null;

const TONES = {
  flame:  ['Flame', 'var(--ember)', 'for when you need pushing'],
  road:   ['Road',  'var(--cyan)',  'for when you need perspective'],
  anchor: ['Anchor','var(--gold)',  'for when you need steadying'],
};

function renderEmbers() {
  const all = allVoices();
  const friends = all.filter(isFriend);

  $('#voiceFilters').innerHTML = [
    ['all', 'All', all.length, 'var(--gold)'],
    ['friends', 'From my people', friends.length, 'var(--cyan)'],
    ['self', 'Mine', all.filter(v => v.fuente === 'self').length, 'var(--gold)'],
    ['khaslana', 'Inscriptions', all.filter(v => v.fuente === 'khaslana').length, 'var(--ember)'],
    ['amphoreus', 'Amphoreus', all.filter(v => v.fuente === 'amphoreus').length, 'var(--ember)'],
    ['wanderer', 'The Wanderer', all.filter(v => v.fuente === 'wanderer').length, 'var(--violet)'],
    ['alatus', 'Alatus', all.filter(v => v.fuente === 'alatus').length, '#7ec9a4'],
  ].map(([id,label,n,c]) =>
    `<button class="chip ${voiceFilter===id?'on':''}" data-vf="${id}" style="--pc:${c}">${label} <span class="n">${n}</span></button>`).join('');

  $('#toneFilters').innerHTML = [
    `<button class="chip ${toneFilter==='all'?'on':''}" data-vt="all" style="--pc:var(--dimmer)">Any tone</button>`,
    ...Object.entries(TONES).map(([id,[label,c,hint]]) =>
      `<button class="chip ${toneFilter===id?'on':''}" data-vt="${id}" style="--pc:${c}" title="${hint}"><span class="pdot"></span>${label} <span class="n">${all.filter(v=>v.tono===id).length}</span></button>`),
  ].join('');

  /* One drawn at random — for the days you need to go looking. */
  const drawn = drawnId ? all.find(v => v.id === drawnId) : null;
  $('#drawnEmber').innerHTML = drawn ? `
    <div class="dr-body">
      <div class="dr-label">Drawn at random${drawn.tono && TONES[drawn.tono] ? ` · ${TONES[drawn.tono][0]}` : ''}</div>
      <p>${esc(drawn.texto)}</p>
      <div class="who">— ${esc(voiceWho(drawn))}</div>
    </div>
    <button class="btn dr-again" id="drawAgain">Draw another</button>`
    : `<div class="dr-body">
         <div class="dr-label">When you need one</div>
         <p style="font-size:19px;color:var(--dimmer)">Pull an ember at random instead of scrolling for it.</p>
       </div>
       <button class="btn primary dr-again" id="drawAgain">Draw one</button>`;

  const list = all.filter(v =>
    (voiceFilter === 'all' ? true :
     voiceFilter === 'friends' ? isFriend(v) : v.fuente === voiceFilter) &&
    (toneFilter === 'all' || v.tono === toneFilter));

  $('#voicesGrid').innerHTML = list.length ? list.map(v => `
    <div class="voice ${voiceClass(v)}">
      <button class="kill" data-vkill="${v.id}" title="Remove">×</button>
      <p>${esc(v.texto)}</p>
      <div class="who"><span class="dash"></span>${esc(voiceWho(v))}</div>
    </div>`).join('')
    : `<div class="empty">Nothing here yet. Add what people have told you — it's what you'll read on the bad days.</div>`;

  $('#tagEmbers').textContent = friends.length || '';
}

/* ═══════════════════════════════════════════════════════════════════════
   SETUP
   ═══════════════════════════════════════════════════════════════════════ */

let tmplDay = new Date().getDay();

/* Which weekdays currently carry a block with this key. */
const blockDays = (key) =>
  [0,1,2,3,4,5,6].filter(d => (S.templates[d] || []).some(x => x.key === key));

/* Toggle a block on or off a given weekday. */
function toggleBlockDay(key, day) {
  const list = (S.templates[day] ??= []);
  const at = list.findIndex(x => x.key === key);
  if (at !== -1) {
    if (blockDays(key).length === 1) return toast('That would remove the block entirely');
    list.splice(at, 1);
  } else {
    const src = Object.values(S.templates).flat().find(x => x.key === key);
    if (!src) return;
    list.push({ ...src, id: uid() });
    list.sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  }
  save();
  renderSetup();
}

/* Editing a repeating block edits it everywhere it repeats. */
function editBlock(key, field, value) {
  for (const d of Object.keys(S.templates)) {
    for (const t of S.templates[d]) if (t.key === key) t[field] = value;
  }
  save();
}

function renderSetup() {
  $('#examDate').value = S.examDate;
  $('#dayTabs').innerHTML = [1,2,3,4,5,6,0].map(d =>
    `<button class="daytab ${tmplDay===d?'on':''}" data-day="${d}">${DAY3[d]}</button>`).join('');

  const rows = S.templates[tmplDay] || [];
  $('#tmplRows').innerHTML = rows.length ? rows.map(t => {
    const on = blockDays(t.key);
    return `
    <div class="tmpl-row" data-tid="${t.id}" data-tkey="${t.key}" style="--kc:${kindColor(t.kind)}">
      <input type="text" data-f="time" value="${esc(t.time)}" placeholder="18:00">
      <input type="text" data-f="text" value="${esc(t.text)}" placeholder="What you do">
      <select data-f="kind">
        ${Object.entries(KINDS).map(([k, v]) =>
          `<option value="${k}" ${t.kind === k ? 'selected' : ''}>${v.label}</option>`).join('')}
      </select>
      <div class="repeat" title="Which weekdays this block repeats on">
        ${[1,2,3,4,5,6,0].map(d => `
          <button class="rd ${on.includes(d) ? 'on' : ''} ${d === tmplDay ? 'here' : ''}"
                  data-rkey="${t.key}" data-rday="${d}" title="${DAYS[d]}">${DAY3[d][0]}</button>`).join('')}
      </div>
      <button class="kill" data-tkill="${t.id}">×</button>
    </div>`;
  }).join('') : `<div class="empty">Nothing set for ${DAYS[tmplDay]}.</div>`;

  $('#scRows').innerHTML = (S.shortcuts || []).length ? S.shortcuts.map(s => `
    <div class="sc-row" data-sid="${s.id}">
      <input type="color" data-f="color" value="${esc(s.color)}" title="Colour">
      <input type="text" data-f="label" value="${esc(s.label)}" placeholder="Name">
      <input type="text" data-f="url" value="${esc(s.url)}" placeholder="https://…">
      <input type="text" data-f="app" value="${esc(s.app || '')}" placeholder="spotify:" title="Native app scheme, optional">
      <button class="kill" data-skill="${s.id}">×</button>
    </div>`).join('') : `<div class="empty">No shortcuts.</div>`;

  $('#loreGrid').innerHTML = Object.entries(EMBLEMS[S.aspect] || EMBLEMS.khaslana).map(([id, e]) => `
    <div class="lore-row">
      <div class="lore-mark" data-emblem="${id}" data-stroke="2.4"></div>
      <div>
        <div class="lore-name">${id[0].toUpperCase() + id.slice(1)}</div>
        <div class="lore-of">${esc(e.of)}</div>
      </div>
    </div>`).join('');
  mountEmblems();

  renderScanStatus();
  const MOTIONS = [
    ['auto',   'Match the system', OS_REDUCED ? 'your Mac asks for reduced motion → subtle' : 'your Mac has no preference set → full'],
    ['still',  'Still',            'nothing moves. One paint and done'],
    ['subtle', 'Subtle',           'slow, small, and repainted eight times a second instead of sixty'],
    ['full',   'Full',             'every frame'],
  ];
  $('#motionPick').innerHTML = MOTIONS.map(([id, label, why]) => `
    <button class="mo ${(S.motion || 'auto') === id ? 'on' : ''}" data-motion="${id}">
      <span class="mo-n">${esc(label)}</span>
      <span class="mo-w">${esc(why)}</span>
    </button>`).join('');
  $('#motionStatus').textContent = `Running at “${motionLevel()}”`;

  $('#reindexCmd').textContent = 'cd ~/Khaslana\nnode scripts/index-codex.mjs';
  $('#indexInfo').textContent = CODEX.generated
    ? `Last indexed ${new Date(CODEX.generated).toLocaleString('en-GB')} · ${CODEX.entries.length} chapters`
    : 'No index generated yet.';
}

/* ═══════════════════════════════════════════════════════════════════════
   OPENING THINGS OUTSIDE THE APP
   ═══════════════════════════════════════════════════════════════════════

   An iOS home-screen PWA (display-mode: standalone) has no tab strip, so
   window.open()/target="_blank" often just does nothing there — no error,
   no new tab, the tap looks ignored. Same-tab navigation always works
   because it never needs one. Everywhere else — a normal browser tab —
   window.open still opens a real new tab, so Khaslana stays open behind
   it instead of being replaced just to check email. */
const IS_STANDALONE = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function openExternal(url) {
  if (!url) return;
  if (IS_STANDALONE) location.href = url;
  else window.open(url, '_blank', 'noopener');
}

/* One shortcut chip, one native-scheme attempt, one fallback — used by both
   the Dawn shortcut row and the Gate's own "Open" entries, which used to
   duplicate this by hand and had drifted: the Gate's copy never got the
   web fallback added below, so a shortcut with a scheme the OS didn't
   recognize just silently did nothing when launched from ⌘K. */
function openShortcut(scheme, webUrl) {
  if (!scheme) return openExternal(webUrl);
  let handedOff = false;
  const onHide = () => { handedOff = true; };
  document.addEventListener('visibilitychange', onHide, { once: true });
  const f = document.createElement('iframe');
  f.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(f);
  try { f.contentWindow.location.href = scheme; }
  catch { f.src = scheme; }
  setTimeout(() => {
    f.remove();
    document.removeEventListener('visibilitychange', onHide);
    if (!handedOff) openExternal(webUrl);
  }, 1200);
}

/* ═══════════════════════════════════════════════════════════════════════
   THE GATE — one field that reaches everything (⌘K)
   ═══════════════════════════════════════════════════════════════════════ */

let gateOpen = false, gateSel = 0, gateHits = [];

function gateSources() {
  const out = [];

  for (const v of VIEWS) {
    out.push({ kind: 'Room', label: v[0].toUpperCase() + v.slice(1), sub: 'go there', run: () => go(v) });
  }

  for (const e of CODEX.entries) {
    out.push({
      kind: 'Chapter', label: e.title, sub: e.areaLabel,
      hay: e.haystack, color: areaColor(e.area),
      run: () => { go('atlas'); setTimeout(() => openReader(e.id), 50); },
    });
  }

  for (const s of (S.shortcuts || [])) {
    out.push({
      kind: 'Open', label: s.label, sub: s.app || s.url, color: s.color,
      run: () => openShortcut(s.app, s.url),
    });
  }

  const day = S.ritual[todayKey()];
  for (const t of (day?.tasks || []).filter(t => !t.done)) {
    out.push({
      kind: 'Focus', label: `${DEFAULT_MINUTES} min — ${t.text}`, sub: t.time || 'unscheduled',
      color: KIND_COLOR[t.kind], run: () => { startGlass(t.id); go('dawn'); },
    });
  }

  out.push(
    { kind: 'Do', label: 'Write today\'s Chronicle', sub: 'jump to the entry', run: () => { journalKey = todayKey(); go('chronicle'); } },
    { kind: 'Do', label: 'Log a trial', sub: 'record a block of questions', run: () => { go('path'); setTimeout(() => $('#simName').focus(), 60); } },
    { kind: 'Do', label: 'Draw an ember', sub: 'pull one at random', run: () => {
        const pool = allVoices(); if (!pool.length) return;
        drawnId = pool[Math.floor(Math.random() * pool.length)].id; go('embers'); } },
    { kind: 'Do', label: 'Export a backup', sub: 'download your data', run: () => $('#btnExport').click() },
    { kind: 'Do', label: 'What needs reviewing', sub: 'chapters going stale', run: () => { codexState = 'due'; codexArea = 'all'; go('atlas'); } },
    { kind: 'Do', label: 'What I marked shaky', sub: 'weak ground', run: () => { codexState = 'shaky'; codexArea = 'all'; go('atlas'); } },
  );

  return out;
}

function gateSearch(q) {
  const all = gateSources();
  if (!q) {
    return all.filter(x => x.kind !== 'Chapter').slice(0, 12);
  }
  const n = norm(q);
  return all
    .map(x => {
      const l = norm(x.label);
      let s = 0;
      if (l.startsWith(n)) s += 300;
      else if (l.includes(n)) s += 180 - l.indexOf(n);
      if (norm(x.sub).includes(n)) s += 40;
      if (x.hay && x.hay.includes(n)) s += 12;
      /* actions and rooms outrank the 22 chapters on a tie */
      if (s && x.kind !== 'Chapter') s += 25;
      return { x, s };
    })
    .filter(r => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 14)
    .map(r => r.x);
}

function renderGate() {
  const q = $('#gateInput').value;
  gateHits = gateSearch(q);
  if (gateSel >= gateHits.length) gateSel = Math.max(0, gateHits.length - 1);

  $('#gateList').innerHTML = gateHits.length ? gateHits.map((h, i) => `
    <button class="gate-row ${i === gateSel ? 'on' : ''}" data-gate="${i}">
      <span class="gk" style="${h.color ? `color:${h.color};border-color:${h.color}55` : ''}">${esc(h.kind)}</span>
      <span class="gl">${esc(h.label)}</span>
      <span class="gs">${esc(h.sub || '')}</span>
    </button>`).join('')
    : `<div class="gate-none">Nothing by that name.</div>`;
}

function openGate() {
  gateOpen = true; gateSel = 0;
  document.documentElement.classList.add('gated');
  $('#gateInput').value = '';
  renderGate();
  setTimeout(() => $('#gateInput').focus(), 40);
}
function closeGate() {
  gateOpen = false;
  document.documentElement.classList.remove('gated');
}
function runGate(i) {
  const h = gateHits[i];
  if (!h) return;
  closeGate();
  h.run();
}

/* ═══════════════════════════════════════════════════════════════════════
   FILES — UltraXFiles
   ═══════════════════════════════════════════════════════════════════════

   El archivo de evidencia es una aplicación aparte, compilada a
   ./ultraxfiles/ y montada en un iframe. Tres decisiones que conviene no
   deshacer:

   · El src se pone la PRIMERA vez que entras, no al cargar Khaslana. Son
     ~570 kB de bundle; cobrárselos a alguien que sólo viene a marcar la
     March sería un impuesto sobre la vista más usada.
   · Se le añade ?v= con el sello de build para que un service worker con
     copia vieja no pueda devolver un index.html caducado.
   · Si no carga —primera visita sin red, por ejemplo— se muestra una salida
     en vez de un rectángulo negro.                                        */

let filesMounted = false;

/* Belt-and-suspenders on top of the display:none→block fix above: same
   origin means this can reach into the iframe's own document and force
   momentum scrolling directly on whatever's tall in there, instead of
   hoping the iframe's own stylesheet already has it. Modern iOS doesn't
   strictly need `-webkit-overflow-scrolling: touch` anymore — Safari's
   had native momentum scroll by default for years — but it's a no-op
   where it isn't needed and costs nothing to also try. */
function forceTouchScroll(frame) {
  try {
    const doc = frame.contentDocument;
    if (!doc) return;
    const style = doc.createElement('style');
    style.textContent = `
      html, body { -webkit-overflow-scrolling: touch !important; overscroll-behavior: contain; }
      * { -webkit-overflow-scrolling: touch !important; }
    `;
    doc.head?.appendChild(style);
  } catch { /* cross-origin or not ready yet — nothing lost, the CSS lock still stands on its own */ }
}

function renderFiles() {
  const frame = $('#uxfFrame');
  const load  = $('#uxfLoad');
  const fail  = $('#uxfFail');
  if (!frame || filesMounted) return;
  filesMounted = true;

  const stamp = BUILD;   // el mismo sello que la cáscara: sube en cada publicación
  const t = setTimeout(() => {                    // ni carga ni falla: red muerta
    if (load) load.hidden = true;
    if (fail) fail.hidden = false;
  }, 12000);

  frame.addEventListener('load', () => {
    clearTimeout(t);
    if (load) load.hidden = true;
    if (fail) fail.hidden = true;
    forceTouchScroll(frame);
  }, { once: true });

  frame.addEventListener('error', () => {
    clearTimeout(t);
    if (load) load.hidden = true;
    if (fail) fail.hidden = false;
  }, { once: true });

  frame.src = './ultraxfiles/index.html?v=' + encodeURIComponent(stamp);
}

/* ═══════════════════════════════════════════════════════════════════════
   WELLBEING — la guía ACP embebida
   ═══════════════════════════════════════════════════════════════════════

   Mismo trato que Files, por la misma razón: un solo archivo autocontenido
   bajo ./wellbeing/, montado perezosamente, con la misma salida en caso de
   fallo en vez de un rectángulo negro. */

let wellbeingMounted = false;

function renderWellbeing() {
  const frame = $('#wbFrame');
  const load  = $('#wbLoad');
  const fail  = $('#wbFail');
  if (!frame || wellbeingMounted) return;
  wellbeingMounted = true;

  const stamp = BUILD;
  const t = setTimeout(() => {
    if (load) load.hidden = true;
    if (fail) fail.hidden = false;
  }, 12000);

  frame.addEventListener('load', () => {
    clearTimeout(t);
    if (load) load.hidden = true;
    if (fail) fail.hidden = true;
    forceTouchScroll(frame);
  }, { once: true });

  frame.addEventListener('error', () => {
    clearTimeout(t);
    if (load) load.hidden = true;
    if (fail) fail.hidden = false;
  }, { once: true });

  frame.src = './wellbeing/index.html?v=' + encodeURIComponent(stamp);
}

/* ═══════════════════════════════════════════════════════════════════════
   ROUTING
   ═══════════════════════════════════════════════════════════════════════ */

const RENDER = {
  dawn: renderDawn, atlas: renderAtlas, path: renderPath,
  chronicle: renderChronicle, embers: renderEmbers, files: renderFiles, setup: renderSetup,
  /* Last on purpose: the number-key shortcuts (see the keydown handler
     below) are just this object's key order, 1-indexed. Adding wellbeing
     anywhere earlier would silently bump Setup from 7 to 8 for anyone who
     already has that muscle memory. */
  wellbeing: renderWellbeing,
};
const VIEWS = Object.keys(RENDER);

/* Each room carries a line from whichever aspect you are walking in — not
   a quote, but something that character actually did, aimed at the room it
   sits in. It turns over daily and it is keyed by room as well as by date,
   so the six rooms never show the same line on the same day. */
function mountRoomNotes() {
  const set = (window.KHASLANA_LORE || {})[S.aspect] || {};
  document.querySelectorAll('.room-note[data-room]').forEach(el => {
    const pool = set[el.dataset.room];
    if (!pool || !pool.length) { el.innerHTML = ''; return; }
    const v = pool[hashOf(todayKey() + el.dataset.room + S.aspect) % pool.length];
    el.innerHTML = `<span class="rn-mark"></span>
      <span class="rn-t">${esc(v.t)}</span>
      <span class="rn-w">${esc(v.w)}</span>`;
  });
}

/* Touch, not viewport width, is what actually needed the "route to a
   real page instead of an iframe" fix — a wide iPad in landscape is
   still a finger, and matchMedia('(max-width: 900px)') alone was letting
   it fall through to the broken embedded path (the dock preview, Files)
   that only a mouse ever proved reliable. (hover: none) and
   (pointer: coarse) is the standard pairing for "primary input is a
   finger," regardless of how wide that finger's screen is. Shared by
   go() and openDock() so both redirects agree on what counts. */
const isTouchNarrow = () => window.matchMedia('(max-width: 900px), (hover: none) and (pointer: coarse)').matches;

function go(view) {
  /* Files and Wellbeing are each a whole separate app embedded in an
     iframe. Every fix aimed at getting a touch drag to reach inside that
     iframe on a phone — locking the page scroll behind it, matching
     #reader's always-mounted shape instead of display:none/block,
     forcing momentum scroll straight into the iframe's own document —
     went in, and none of them came back confirmed working. There's no
     way to test any further iframe-side theory against real hardware
     here, and "debe quedar sí o sí" isn't served by a fourth guess at
     the same mechanism. So: stop routing around it and remove it
     instead, for touch input generally. A real navigation — leaving the
     iframe, leaving Khaslana's page entirely for the one the phone or
     tablet is actually now on — has no iframe for a touch drag to fail
     to reach, because there isn't one anymore. Whatever was blocking it
     stops applying by construction, not by another attempt at
     outsmarting it. The edge-swipe-back gesture (or the browser's own
     back control) returns to Khaslana afterward. */
  if ((view === 'files' || view === 'wellbeing') && isTouchNarrow()) {
    location.href = view === 'files' ? './ultraxfiles/' : './wellbeing/';
    return;
  }
  S.view = view; save();
  document.documentElement.style.setProperty('--acc', roomAccent(view));
  if (view !== 'atlas') { closeDock(); if (typeof graphPause === 'function') graphPause(); }
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'view-' + view));
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.view === view));
  RENDER[view]?.();
  mountEmblems();
  mountRoomNotes();
  updateNavTags();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ═══════════════════════════════════════════════════════════════════════
   EVENTS
   ═══════════════════════════════════════════════════════════════════════ */

document.addEventListener('click', (ev) => {
  const t = ev.target;

  /* Native app links: hand the scheme to the OS through a throwaway iframe.
     Letting the anchor navigate hands the whole tab to the URL handler, and
     Chrome then tears the page down — which is why Khaslana kept closing.

     Not every scheme here is one the app publishes and confirms — YouTube's
     app: '' works today only because google.com/youtube is itself a
     Universal Link, which the others aren't. A scheme that's wrong, or
     whose app just isn't installed, used to mean the chip did nothing at
     all with no sign of failure. Now it's timed: the OS switching away to
     the app is what hides the tab, so if this tab is still the visible one
     after a beat, the scheme didn't take, and the ↗'s own web address
     opens instead — same outcome as tapping ↗ by hand. */
  const appLink = t.closest('[data-app]');
  if (appLink) {
    ev.preventDefault();
    const webFallback = appLink.parentElement?.querySelector('.sc-web')?.href || '';
    openShortcut(appLink.dataset.app, webFallback);
    return;
  }

  /* Same standalone problem, wider net: any plain "open in a new tab" link
     in the app (the chapter reader, UltraXFiles' "open apart", the Gate's
     own ↗) is target="_blank", which is exactly the thing that goes quiet
     on a home-screen iOS install. Same-tab navigation there instead. */
  if (IS_STANDALONE) {
    const blankLink = t.closest('a[target="_blank"][href]');
    if (blankLink) {
      ev.preventDefault();
      location.href = blankLink.href;
      return;
    }
  }

  /* Must be scoped to the buttons: <html> also carries data-aspect, so a bare
     [data-aspect] matches every click in the document and eats the whole app. */
  const asp = t.closest('button.asp[data-aspect]');
  if (asp) {
    S.aspect = asp.dataset.aspect;
    save();
    applyAspect();
    /* Re-render whatever room is open, not just Dawn: the emblem legend in
       Setup reads its text at render time, so it kept showing the previous
       aspect's descriptions under the new figures. */
    RENDER[S.view]?.();
    mountEmblems();
    mountRoomNotes();
    return toast(`${aspect().name} — ${aspect().of}`);
  }

  /* The Gate */
  if (t.closest('#gateOpen')) return openGate();
  const gateRow = t.closest('[data-gate]');
  if (gateRow) return runGate(+gateRow.dataset.gate);
  if (gateOpen && !t.closest('.gate-panel')) return closeGate();

  /* The Glass */
  const gl = t.closest('[data-glass]');
  if (gl) {
    const a = gl.dataset.glass;
    if (a === 'pause') pauseGlass();
    else if (a === 'resume') resumeGlass();
    else stopGlass();
    return;
  }
  if (t.closest('#glassQuick')) {
    const day = S.ritual[todayKey()];
    const nextTask = (day?.tasks || []).find(x => !x.done);
    if (!nextTask) return toast('Nothing left on the March today');
    return startGlass(nextTask.id);
  }
  const runBtn = t.closest('[data-run]');
  if (runBtn) { ev.stopPropagation(); return startGlass(runBtn.dataset.run); }

  const navBtn = t.closest('#nav button');
  if (navBtn) return go(navBtn.dataset.view);
  const goto = t.closest('[data-goto]');
  if (goto) return go(goto.dataset.goto);

  if (t.closest('#dockClose')) return closeDock();
  if (t.closest('#rdBack')) return closeReader();

  const readBtn = t.closest('[data-read]');
  if (readBtn) { ev.stopPropagation(); return openReader(readBtn.dataset.read); }

  const dockBtn = t.closest('[data-dock]');
  if (dockBtn) { go('atlas'); return setTimeout(() => openDock(dockBtn.dataset.dock), 60); }

  /* March. The remove button sits inside the row, so it has to be caught
     before the row's own toggle. */
  const tk2 = t.closest('[data-tkill2]');
  if (tk2) {
    const day = dayMarch(tk2.dataset.tday);
    day.tasks = day.tasks.filter(x => x.id !== tk2.dataset.tkill2);
    save(); return renderDawn();
  }

  const task = t.closest('.task');
  if (task) {
    const key = task.dataset.tday || todayKey();
    /* A day that hasn't happened cannot be ticked. Letting it would put a
       lit day on the calendar for a Thursday you haven't lived yet, which
       makes the whole month display a lie. */
    if (key > todayKey()) return toast('That day hasn\'t happened yet');
    const item = S.ritual[key]?.tasks.find(x => x.id === task.dataset.task);
    if (item) {
      const before = coreflame();
      item.done = !item.done;
      save();
      renderDawn();
      const st = dayStats(key);
      if (item.done && st.pct === 100) toast('The day is done. The flame carries.');
      else if (item.done && st.lit && before === 0) toast(aspect().lit);
    }
    return;
  }

  /* Atlas filters */
  if (t.dataset.area)  { codexArea = t.dataset.area;   return renderAtlas(); }
  if (t.dataset.state) { codexState = t.dataset.state; return renderAtlas(); }

  /* Advance the stage by one — from a card, the dock, or the reader bar */
  const cyc = t.closest('[data-stage]');
  if (cyc) {
    ev.stopPropagation();
    const id = cyc.dataset.stage;
    const next = STAGES[(STAGES.indexOf(topicStage(id)) + 1) % STAGES.length];
    setTopic(id, { stage: next });
    renderAtlas();
    if ($('#dock').dataset.id === id && document.documentElement.classList.contains('docked')) openDock(id);
    if (cyc.dataset.reread) refreshReaderState();
    toast(next === 'mastered' ? 'Mastered — ground held' : STAGE[next].label);
    return;
  }

  /* Jump straight to a stage from the dock ladder */
  const setst = t.closest('[data-setstage]');
  if (setst) {
    ev.stopPropagation();
    const id = setst.dataset.setstage;
    setTopic(id, { stage: setst.dataset.to });
    renderAtlas();
    openDock(id);
    refreshReaderState();
    return;
  }

  /* Confidence — clicking the level you're already on clears it */
  const cf = t.closest('[data-conf]');
  if (cf) {
    ev.stopPropagation();
    const id = cf.dataset.conf, n = +cf.dataset.n;
    setTopic(id, { conf: topicConf(id) === n ? 0 : n });
    renderAtlas();
    if ($('#dock').dataset.id === id && document.documentElement.classList.contains('docked')) openDock(id);
    return;
  }

  const zb = t.closest('.zoomer button[data-zoom]');
  if (zb) return stepZoom(+zb.dataset.zoom);

  /* Atlas: List / Graph */
  const vt = t.closest('.vt[data-vt]');
  if (vt) { codexView = vt.dataset.vt; return renderAtlas(); }

  const gz = t.closest('.zoomer button[data-gz]');
  if (gz) return graphZoomStep(+gz.dataset.gz);

  if (t.id === 'graphRelax') return graphRelax();
  if (t.id === 'graphFocusClear') return graphSetFocus(null);

  if (t.id === 'staleReload' || t.id === 'btnForceReload') return hardReload();
  if (t.id === 'staleDismiss') { $('#staleBanner')?.remove(); return; }
  if (t.id === 'btnForceRefresh') return forgetDeviceCache();
  if (t.id === 'btnRelock') {
    localStorage.removeItem('khaslana.unlocked.v1');
    location.reload();
    return;
  }
  if (t.id === 'btnSyncConnect') {
    const repo = $('#syncRepo').value.trim();
    const token = $('#syncToken').value.trim();
    if (!repo.includes('/') || !token) { toast('Need owner/repo and a token'); return; }
    ghSetConfig(token, repo);
    ghSha = null;
    $('#syncStatus').textContent = 'Connecting…';
    syncPull().then(() => { renderSyncStatus(); toast('Connected'); });
    return;
  }
  if (t.id === 'btnSyncDisconnect') {
    ghClearConfig();
    ghSha = null;
    renderSyncStatus();
    return;
  }
  if (t.closest('#railSync') || t.id === 'btnSyncNow') return manualSync();

  /* Dock tabs */
  const dtab = t.closest('button.dtab[data-dtab]');
  if (dtab) {
    dockPane = dtab.dataset.dtab;
    document.documentElement.dataset.dpane = dockPane;
    $$('.dtab').forEach(b => b.classList.toggle('on', b === dtab));
    return;
  }
  if (t.closest('#dockWide')) return openReader($('#dock').dataset.id);

  /* One click on the card opens the chapter in the side panel. */
  const card = t.closest('.topic');
  if (card && !t.closest('a') && !t.closest('button')) return openDock(card.dataset.id, 'read');

  /* Log a trial */
  if (t.dataset.exam) {
    closeDock();
    go('path');
    setTimeout(() => {
      $('#simName').value = t.dataset.exam;
      if (t.dataset.n) $('#simTotal').value = t.dataset.n;
      $('#simRight').focus();
      toast('Log the result here when you finish');
    }, 60);
    return;
  }

  /* Chronicle */
  const jk = t.closest('[data-jkey]');
  if (jk) {
    journalKey = jk.dataset.jkey;
    const d = parseKey(journalKey);
    calCursor = new Date(d.getFullYear(), d.getMonth(), 1);
    return renderChronicle();
  }
  if (t.id === 'btnToday') {
    journalKey = todayKey();
    const d = parseKey(journalKey);
    calCursor = new Date(d.getFullYear(), d.getMonth(), 1);
    return renderChronicle();
  }
  /* Only ever one half in view: clicking a header opens that one. */
  const half = t.closest('[data-half-toggle]');
  if (half) {
    duskOpen = half.dataset.halfToggle === 'dusk';
    return renderChronicle();
  }
  if (t.id === 'dcPrev') { dcCursor.setMonth(dcCursor.getMonth() - 1); return renderDawnCal(); }
  if (t.id === 'dcNext') { dcCursor.setMonth(dcCursor.getMonth() + 1); return renderDawnCal(); }

  /* Open a day on the March. Any day — that is the point. */
  const mday = t.closest('[data-mday]');
  if (mday) {
    openMarch(mday.dataset.mday);
    $('.ritual')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return;
  }
  if (t.id === 'ritualBack') return openMarch(todayKey());

  if (t.id === 'mAddGo' || (t.id === 'mAdd' && ev.type === 'submit')) return addBlockToDay();

  if (t.id === 'calPrev') { calCursor.setMonth(calCursor.getMonth() - 1); return renderCalendar(); }
  if (t.id === 'calNext') { calCursor.setMonth(calCursor.getMonth() + 1); return renderCalendar(); }
  if (t.dataset.reroll) {
    dayJournal(journalKey).prompts[t.dataset.reroll] = draw(t.dataset.reroll);
    save();
    return renderChronicle();
  }

  /* Embers */
  if (t.dataset.vf) { voiceFilter = t.dataset.vf; return renderEmbers(); }
  if (t.closest('[data-vt]')) { toneFilter = t.closest('[data-vt]').dataset.vt; return renderEmbers(); }
  if (t.id === 'drawAgain') {
    const pool = allVoices().filter(v => v.id !== drawnId);
    if (!pool.length) return toast('Nothing to draw yet');
    drawnId = pool[Math.floor(Math.random() * pool.length)].id;
    return renderEmbers();
  }
  if (t.dataset.vkill) {
    const id = t.dataset.vkill;
    if (id.startsWith('seed-')) S.hidden.push(id);
    else S.voices = S.voices.filter(v => v.id !== id);
    save();
    return renderEmbers();
  }
  if (t.id === 'vAdd') {
    const texto = $('#vText').value.trim();
    if (!texto) return toast('Write the message first');
    S.voices.push({ id: uid(), texto, fuente: $('#vWho').value.trim() || 'self', tono: $('#vTone').value });
    save();
    $('#vText').value = ''; $('#vWho').value = '';
    toast('Kept');
    return renderEmbers();
  }

  /* Trials */
  if (t.id === 'simAdd') {
    const name = $('#simName').value.trim() || 'Trial';
    const total = +$('#simTotal').value, right = +$('#simRight').value;
    if (!total || right > total || right < 0) return toast('Check those numbers');
    S.sims.push({ id: uid(), date: todayKey(), name, total, right });
    save();
    $('#simName').value = ''; $('#simTotal').value = ''; $('#simRight').value = '';
    const p = Math.round(right/total*100);
    toast(p >= 70 ? `${p}% — that holds` : `${p}% — logged. Go through the misses.`);
    return renderPath();
  }

  /* Setup */
  const rd = t.closest('[data-rkey]');
  if (rd) return toggleBlockDay(rd.dataset.rkey, +rd.dataset.rday);

  if (t.dataset.day) { tmplDay = +t.dataset.day; return renderSetup(); }
  if (t.dataset.tkill) {
    S.templates[tmplDay] = S.templates[tmplDay].filter(x => x.id !== t.dataset.tkill);
    save(); return renderSetup();
  }
  if (t.id === 'tmplAdd') { (S.templates[tmplDay] ??= []).push(T('', 'New block', 'study')); save(); return renderSetup(); }
  if (t.id === 'tmplCopy') {
    const src = S.templates[tmplDay] || [];
    for (const d of [1,2,3,4,5]) if (d !== tmplDay) S.templates[d] = src.map(x => ({ ...x, id: uid() }));
    save(); toast('Copied to Monday–Friday'); return renderSetup();
  }
  /* Shortcuts */
  if (t.dataset.skill) {
    S.shortcuts = S.shortcuts.filter(x => x.id !== t.dataset.skill);
    save(); return renderSetup();
  }
  if (t.id === 'scAdd') {
    (S.shortcuts ??= []).push({ id: uid(), label: 'New', url: 'https://', color: '#8b93a4' });
    save(); return renderSetup();
  }
  if (t.id === 'scReset') {
    S.shortcuts = structuredClone(DEFAULT_SHORTCUTS);
    save(); toast('Shortcuts reset'); return renderSetup();
  }

  if (t.id === 'tmplReset') {
    S.templates = structuredClone(DEFAULT_TEMPLATES);
    /* Every day from today forward gets rebuilt, not just today — a day is
       copied out of the template the first time you open it, so resetting
       the template alone leaves every day you have already looked at on the
       old plan. Anything ticked is a record and is left exactly as it is. */
    const tk = todayKey();
    let rebuilt = 0, kept = 0;
    for (const k of Object.keys(S.ritual)) {
      if (k < tk) continue;
      if (S.ritual[k].tasks.some(x => x.done)) { kept++; continue; }
      delete S.ritual[k];
      rebuilt++;
    }
    save();
    dayMarch(tk);
    toast(kept
      ? `Template reset · ${rebuilt} rebuilt, ${kept} kept their ticks`
      : `Template reset · ${rebuilt} ${rebuilt === 1 ? 'day' : 'days'} rebuilt`);
    renderDawn();
    return renderSetup();
  }

  /* Data */
  if (t.id === 'btnExport') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
    a.download = `khaslana-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    return toast('Backup downloaded');
  }
  if (t.id === 'btnImport') return $('#fileImport').click();
  if (t.id === 'btnReindex') { go('setup'); return toast('The folder status is on the right'); }
  /* Scratch → March */
  if (t.dataset.scadd) {
    const hit = readScratch(S.scratch).find(h => h.hash === t.dataset.scadd);
    return hit ? scratchToMarch(hit) : renderScratch();
  }
  if (t.dataset.scskip) {
    S.scratchSeen[t.dataset.scskip] = { state: 'skipped' };
    save(); return renderScratch();
  }
  if (t.id === 'catchAll') {
    const open = readScratch(S.scratch).filter(h => !S.scratchSeen[h.hash]);
    open.forEach(h => {
      const day = dayMarch(h.key);
      day.tasks.push({ id: uid(), key: uid(), time: h.time, text: h.text, kind: h.kind, done: false, caught: true });
      sortDay(day);
      S.scratchSeen[h.hash] = { state: 'added', key: h.key };
    });
    save();
    toast(`${open.length} ${open.length === 1 ? 'block' : 'blocks'} on the March`);
    renderScratch(); renderDawn();
    return;
  }

  /* Scoped to the button. `<html>` also carries data-motion, so a bare
     [data-motion] closest() matches every click on the page — exactly the
     bug the aspect picker had with data-aspect. */
  const mo = t.closest('button.mo[data-motion]');
  if (mo) {
    S.motion = mo.dataset.motion;
    save();
    applyMotion();
    renderSetup();
    return toast(`Motion — ${motionLevel()}`);
  }

  if (t.id === 'btnRescan') { toast('Scanning the folder…'); return scanCodex(); }
  if (t.id === 'btnForget') {
    localStorage.removeItem(SCAN_STORE);
    toast('Cached chapters forgotten — rescanning');
    return scanCodex();
  }
});

document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.id === 'codexSearch') { codexQuery = t.value; return renderAtlas(); }
  if (t.id === 'journalSearch') { journalQuery = t.value; return renderHistory(); }
  if (t.id === 'gateInput') { gateSel = 0; return renderGate(); }
  if (t.id === 'scratchPad') {
    S.scratch = t.value; save();
    /* Re-read on a pause, not on every keystroke — a half-typed "jue"
       should not flash a Thursday at you while you are still writing. */
    clearTimeout(scratchTimer);
    scratchTimer = setTimeout(renderScratch, 450);
    return;
  }

  if (t.dataset.j) {
    const j = dayJournal(journalKey), cat = t.dataset.j;
    if (t.dataset.i !== undefined) { j.a[cat] ??= ['','','']; j.a[cat][+t.dataset.i] = t.value; }
    else j.a[cat] = t.value;
    if (journalKey === todayKey()) updateNavTags();
    return save();
  }
  if (t.dataset.week) { S.weekNotes[t.dataset.week] = t.value; return save(); }

  const row = t.closest('.tmpl-row');
  if (row && t.dataset.f) {
    editBlock(row.dataset.tkey, t.dataset.f, t.value);
    return;
  }
  const scRow = t.closest('.sc-row');
  if (scRow && t.dataset.f) {
    const item = S.shortcuts.find(x => x.id === scRow.dataset.sid);
    if (item) { item[t.dataset.f] = t.value; save(); }
    return;
  }
  if (t.id === 'examDate') { S.examDate = t.value; save(); }
});

document.addEventListener('change', (ev) => {
  const t = ev.target;
  const row = t.closest('.tmpl-row');
  if (row && t.dataset.f === 'kind') { editBlock(row.dataset.tkey, 'kind', t.value); renderSetup(); }
  if (t.id === 'fileImport' && t.files?.[0]) {
    const r = new FileReader();
    r.onload = () => {
      try {
        S = { ...structuredClone(DEFAULT_STATE), ...JSON.parse(r.result) };
        save(); go(S.view || 'dawn'); toast('Backup restored');
      } catch { toast('That file is not readable'); }
    };
    r.readAsText(t.files[0]);
  }
});

document.addEventListener('keydown', (ev) => {
  /* ⌘K / Ctrl-K reaches the Gate from anywhere, including inside a field. */
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
    ev.preventDefault();
    return gateOpen ? closeGate() : openGate();
  }

  if (ev.key === 'Enter' && ev.target?.id === 'mAdd') { ev.preventDefault(); return addBlockToDay(); }

  /* +, − and 0 resize the chapter while one is open. Plain keys, not ⌘+ —
     that one belongs to the browser and taking it would be rude. Skipped
     while typing, and while a modifier is held. */
  const focused = ev.target;
  const typing = focused instanceof Element &&
    (focused.matches('input, textarea, select') || focused.isContentEditable);
  const chapterOpen = document.documentElement.classList.contains('reading') ||
    (document.documentElement.classList.contains('docked') &&
     document.documentElement.dataset.dpane === 'read');
  if (chapterOpen && !typing && !gateOpen && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
    if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); return stepZoom(1); }
    if (ev.key === '-' || ev.key === '_') { ev.preventDefault(); return stepZoom(-1); }
    if (ev.key === '0')                   { ev.preventDefault(); return stepZoom(0); }
  }

  if (gateOpen) {
    if (ev.key === 'Escape') { ev.preventDefault(); return closeGate(); }
    if (ev.key === 'ArrowDown') { ev.preventDefault(); gateSel = Math.min(gateSel + 1, gateHits.length - 1); return renderGate(); }
    if (ev.key === 'ArrowUp')   { ev.preventDefault(); gateSel = Math.max(gateSel - 1, 0); return renderGate(); }
    if (ev.key === 'Enter')     { ev.preventDefault(); return runGate(gateSel); }
    return;
  }

  /* ev.target no siempre es un Element (document no tiene .matches), y si
     esto revienta se caen todos los atajos sin decir nada. */
  const el = ev.target;
  if (el instanceof Element && el.matches('input, textarea, select')) {
    if (ev.key === 'Escape') el.blur();
    return;
  }
  if (ev.key === 'Escape') {
    if (document.documentElement.classList.contains('reading')) return closeReader();
    return closeDock();
  }
  /* Con el lector abierto los atajos de sala estorban. */
  if (document.documentElement.classList.contains('reading')) return;
  const n = +ev.key;
  if (n >= 1 && n <= VIEWS.length) return go(VIEWS[n-1]);
  if (ev.key === '/') { ev.preventDefault(); go('atlas'); setTimeout(() => $('#codexSearch').focus(), 50); }
});

/* Redraw the canvases when the layout changes under them */
let rzTimer;
window.addEventListener('resize', () => {
  clearTimeout(rzTimer);
  rzTimer = setTimeout(() => {
    if (S.view === 'dawn') drawConstellation($('#constelMini'), constelNodes(), { height: 176 });
    if (S.view === 'path') drawConstellation($('#constelBig'), constelNodes(), { height: 260 });
  }, 180);
});

/* ═══════════════════════════════════════════════════════════════════════
   START
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Motion ────────────────────────────────────────────────────────────
   A page cannot switch off the operating system's Reduce Motion — the
   media query is read-only. So the system setting becomes the *default*
   for a preference of the app's own rather than the verdict: with Reduce
   Motion on, Khaslana starts at `subtle` instead of dead, and the choice
   is his in Setup. Nothing here changes anything outside this page. */
const OS_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motionLevel = () =>
  (!S.motion || S.motion === 'auto') ? (OS_REDUCED ? 'subtle' : 'full') : S.motion;

function applyMotion() {
  document.documentElement.dataset.motion = motionLevel();
  if (typeof SKY_RESTART === 'function') SKY_RESTART();
  spinRings();
}

/* ── The turn ──────────────────────────────────────────────────────────
   One revolution every ten minutes for the room emblems, every fifteen for
   the rail seal. Slow enough that you never catch it moving — you only
   notice, an hour later, that it isn't where it was. Two custom properties
   drive every ring on the page, so this is one style write per tick. */
const TURN_FAST = 600000, TURN_SLOW = 900000;
function spinRings() {
  if (document.hidden || motionLevel() === 'still') return;
  const t = Date.now();
  const r = document.documentElement.style;
  r.setProperty('--turn',      ((t % TURN_FAST) / TURN_FAST * 360).toFixed(2) + 'deg');
  r.setProperty('--turn-slow', ((t % TURN_SLOW) / TURN_SLOW * 360).toFixed(2) + 'deg');
}
/* The tier has to be on the root element before anything draws — the sky
   reads it on its first paint. */
document.documentElement.dataset.motion = motionLevel();
spinRings();
/* A full turn takes 10–15 minutes — "you never catch it moving" was the
   design goal, not a side effect. 200ms bought nothing toward that (each
   tick moved the ring under a tenth of a degree) and cost a style write,
   and the recalc it triggers, five times a second forever. 4s still
   lands well over a hundred ticks across the slower ring's full turn —
   plenty for something already meant to be imperceptible mid-motion —
   for a fraction of the main-thread work, freeing it up for the moments
   that actually need it, like a view transition. */
setInterval(spinRings, 4000);
document.addEventListener('visibilitychange', spinRings);

applyAspect();
initSky($('#sky'));
mountEmblems();
dayMarch(todayKey());
renderGlass();
$('#scratchPad').value = S.scratch || '';
renderScratch();
$('#tagAtlas').textContent = CODEX.entries.length;
$('#buildStamp').textContent = 'BUILD ' + BUILD;
updateNavTags();

const left = Math.max(0, daysBetween(todayKey(), S.examDate));
$('#railCount').innerHTML = `<b>${left}</b> days<br>${Math.floor(left/7)} weeks, ${left%7} days`;

/* go() now navigates away entirely for files/wellbeing on a phone instead
   of switching to them in-app (see go() itself for why). Restoring one of
   those two as the boot view on that same phone would fire that
   navigation before anyone touched anything — and worse, coming back to
   Khaslana afterward boots into the same saved view and immediately
   fires it again. An unrequested, unbreakable bounce. Land on Dawn there
   instead; Files and Wellbeing are one tap away either way. */
{
  const bootView = RENDER[S.view] ? S.view : 'dawn';
  const bootsIntoABounce = isTouchNarrow() && (bootView === 'files' || bootView === 'wellbeing');
  go(bootsIntoABounce ? 'dawn' : bootView);
}

/* Look at the folder every time the app opens. Whatever is in there is what
   you get — no command to remember, no step to forget on a Monday. */
scanCodex();

/* Check the server once the page is already usable — never blocks the
   first paint on a network round-trip. */
{
  const cfg = ghConfig();
  if (cfg && $('#syncRepo')) $('#syncRepo').value = cfg.repo;   // the token stays blank — never re-shown
  renderSyncStatus();
}
syncPull().then(renderSyncStatus);

/* ═══════════════════════════════════════════════════════════════════════
   STALE TAB DETECTION

   `serve.py` already sends `Cache-Control: no-store` on everything, so
   the HTTP layer was never the problem. The actual problem: Khaslana is a
   single page that never navigates — Dawn, Atlas, Setup are all the same
   document, switched by JS. If the tab has been sitting open since
   yesterday, the code *running* is whatever loaded yesterday, and no
   amount of server-side cache-busting touches that — the browser has no
   reason to ever ask again until you reload.

   So this asks for it: it refetches app.js on an interval and compares
   the text to what actually booted. Full-text comparison rather than a
   length or hash — this file is a few hundred KB at most, and a real diff
   is the only version of "did this change" that can't coincidentally
   agree on two different edits. When it disagrees, a banner appears —
   never a silent auto-reload, because a silent reload while you're mid-
   sentence in the Chronicle is worse than the staleness it would fix. */
let BOOT_SOURCE = null;

async function fetchAppSource() {
  try {
    const res = await fetch('assets/app.js', { cache: 'no-store' });
    return res.ok ? await res.text() : null;
  } catch { return null; }   // offline, or the server isn't running right now
}

async function checkForUpdate() {
  if (document.hidden || !BOOT_SOURCE) return;
  const now = await fetchAppSource();
  if (now && now !== BOOT_SOURCE) showUpdateBanner();
}

function showUpdateBanner() {
  if ($('#staleBanner')) return;   // already showing
  const el = document.createElement('div');
  el.id = 'staleBanner';
  el.innerHTML = `<span>This tab is running yesterday's build — Khaslana doesn't reload itself while you're mid-sentence.</span>
    <button id="staleReload">Reload now</button>
    <button id="staleDismiss" title="Remind me later">×</button>`;
  document.body.appendChild(el);
}

/* One function, two doors in: the banner's own button, and Setup's
   manual one for whenever you'd rather not wait for the next check. A
   cache-busting query string forces a genuinely fresh navigation —
   `location.reload()` alone can still be served out of the back/forward
   cache in some browsers, which skips the network entirely. */
function hardReload() {
  location.replace(location.pathname + '?_r=' + Date.now());
}

/* The button for when reloading isn't enough — unregisters this device's
   service worker and empties the Cache Storage API entirely, so the next
   load re-fetches every file from the network with nothing old left to
   fall back on. This is the one fix for a poisoned cache (a bad response
   saved before Access let a real one through, say), because a poisoned
   cache answers every reload from the same bad copy — reloading harder
   changes nothing when the thing being asked is the thing that's wrong.
   No prompt: it's reversible in the sense that matters, since the very
   next load just rebuilds the cache from whatever's actually live. */
async function forgetDeviceCache() {
  const status = $('#forceRefreshStatus');
  if (status) status.textContent = 'Clearing…';
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
  } catch { /* whatever didn't clear, the reload below still forces a fresh fetch */ }
  location.replace(location.pathname + '?_r=' + Date.now());
}

fetchAppSource().then(src => { BOOT_SOURCE = src; });
setInterval(checkForUpdate, 90000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForUpdate(); });

/* Reuses the existing BUILD constant (line 6) rather than a second stamp —
   Setup's copy had its own id at first and silently wrote into the rail's
   `#buildStamp` instead (first match wins on a duplicate id), leaving the
   visible Setup field blank. One constant, two elements, unique ids. */
console.log('[khaslana] build', BUILD);
const buildStampSetupEl = $('#buildStampSetup');
if (buildStampSetupEl) buildStampSetupEl.textContent = BUILD;

/* ═══════════════════════════════════════════════════════════════════════
   PWA — installable, and usable offline once opened once.

   file:// has no service-worker support at all, so this only registers
   when the page is actually being served — abrir.command's local server,
   or wherever it ends up deployed.

   The root cause behind a whole session's worth of "still stale after
   the fix": a browser only checks a service worker's own script for
   changes on navigation to a page in its scope. Khaslana is one document
   that's never navigated away from — Dawn, Atlas, Setup are all the
   same page, switched by JS — so on a device where the tab is just left
   open, or the PWA is only ever backgrounded and reopened rather than
   actually reloaded, the browser had *no trigger at all* to look at
   sw.js again. Not a 90-second delay, not "eventually" — never, until an
   actual reload happened. And CHECK_FOR_UPDATE's own fetch runs through
   whatever service worker is currently in control: a stale one just
   answers from its own stale logic, so the mechanism meant to detect
   staleness was itself a casualty of the exact staleness it existed to
   catch. That's the deadlock every earlier fix this session ran into
   without knowing it — the code was right and still couldn't reach a
   device that never re-checked for it.

   registration.update() is the explicit call that does what navigation
   would have — force the browser to refetch sw.js and compare it
   byte-for-byte, independent of any page reload. Ticking it on the same
   cadence as CHECK_FOR_UPDATE (and once on becoming visible again) means
   a tab left open for days is never more than that interval away from
   noticing a new service worker exists, which is what makes everything
   downstream of it (network-first app.js, the stale-tab banner, even
   "Forget this device's cache") actually reach a long-open tab instead
   of arguing with a version of the SW that's stuck in the past. */
let swRegistration = null;
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      swRegistration = reg;
    }).catch(() => { /* offline on first load: fine, just no SW yet */ });
  });

  /* skipWaiting + clients.claim (in sw.js) mean a new worker takes over
     an already-open tab without waiting for it to close — this fires the
     moment that happens. More reliable than the app.js text diff below,
     which depends on the fetch reaching a fresh service worker in the
     first place; this fires directly off the browser's own worker
     lifecycle, nothing to be stale about. */
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (BOOT_SOURCE !== null) showUpdateBanner();   // ignore the very first controller taking over on a fresh install
  });

  const pokeForUpdate = () => swRegistration?.update().catch(() => {});
  setInterval(pokeForUpdate, 90000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pokeForUpdate(); });
}
