'use strict';

// SHARED rainforest-layers geometry — the single source of truth for the cross
// section of a tropical rainforest: four stacked horizontal bands, top to bottom,
// emergent / canopy / understorey / forest floor. Imported by every engine that
// draws it (slides, worksheets, working wall, stick-in pack), so the picture on
// the board, on the sheet, on the wall and glued in the book is the identical
// drawing. It produces ONLY the SVG and its true aspect, so each engine places it
// tight (NO DEADSPACE) however it embeds images.
//
//   tightSvg(spec) → { svg, aspect, w, h }   cropped tight to the drawing
//   cacheKey(spec) → string                  stable pre-render cache key
//
// THE IDEA THE PICTURE CARRIES. Band tint is the light gradient: the sky band is
// brightest, each band below is darker, and the forest floor is nearly dark. That
// ramp is the lesson's whole point (light thins as it goes down, so plants thin
// too), so it is drawn as a wide luminance step rather than four decorative
// greens: it survives a glance from the back of a classroom, a working-wall
// print, and a small greyscale stick-in copy, because the steps differ in
// brightness and not only in hue. Anything added later must keep those four
// brightness steps clearly apart.
//
// Spec (every option defaults OFF, so the bare figure is the four tinted bands
// with their trees and nothing else):
//   labels     true to print the four layer names in a gutter beside their bands,
//              each joined to its band by a short leader. UK spelling
//              "understorey" throughout.
//   heights    true to print the height of each layer under its name (about 60 m,
//              30 to 45 m, 5 to 20 m, ground level). Implies a label gutter.
//   notes      a band → short phrase map, e.g.
//              { canopy: 'a thick roof of leaves', 'forest floor': 'nearly dark' }.
//              Prints the phrase under that band's name, in house blue, joined to
//              the band by the same leader. Implies a label gutter, and band names
//              are as forgiving as `highlight`.
//              WHAT THIS IS FOR. A layer name says what a band is CALLED; a note
//              says what it DOES, which is the part of a rainforest lesson that
//              actually has to be learnt. Without somewhere on the figure to put
//              that, the reason ends up as a paragraph in a text panel beside the
//              picture (or only in the speaker notes, where a teacher who does not
//              open them never meets it), and a paragraph about a diagram teaches
//              far less than a few words sitting on the part they explain. Keep
//              each note to a handful of words: it wraps to two or three short
//              lines and shrinks to fit its band, so a sentence-length note
//              survives but wins nothing that splitting it across two slides
//              would not do better.
//   light      true to add the sun above the canopy with light arrows coming down
//              and thinning band by band, plus the note "about 2 rays in every
//              100" on the forest floor.
//   highlight  a pair of band names, e.g. ["emergent", "canopy"] — those two stay
//              full strength and the other two dim back, for a slide that talks
//              about half the diagram. Names are forgiving: "forest floor",
//              "forest-floor" and "floor" all resolve, as does "understory"
//              (rendered as "understorey" whatever the spec spells).
//   blank      true for the WRITE-ON form: the same four tinted bands and trees,
//              but no layer names — a ruled line sits in the gutter beside each
//              band for the child to write the name on, which is the form the
//              stick-in pack and the child's own labelled drawing use.

// ─── CONSTANTS (geometry units; the whole drawing scales on placement) ────
const DIAG_W  = 1000;      // width of the forest cross section itself
const BAND_H  = {          // height of each band, top to bottom (sums to DIAG_H)
  emergent:      380,      // tall, mostly open sky
  canopy:        260,      // the dense unbroken roof
  understorey:   340,      // dim, thin trunks and big leaves
  'forest-floor': 220      // dark ground
};
const DIAG_H  = 1200;      // total height of the cross section

const GUTTER_GAP   = 40;   // gap between the diagram and the label gutter
const GUTTER_W     = 480;  // label gutter width (holds "Understorey", the longest name)
// The write-on gutter is much wider than the printed one on purpose: a child's
// handwriting needs far more room than the typeset word, and this form is printed
// small (a stick-in slip, a column on a sheet), so a line sized to the printed
// name leaves them writing "understorey" in a 3cm space. At 760 the ruled line is
// about 50mm on a 125mm-wide slip, which "understorey" fits comfortably in a Year
// 4 hand. Widening it also shortens the whole piece relative to its width, which
// is what lets four slips tile an A4 page instead of two, so a class set prints on
// half the paper. Both of those are the same measurement: keep them together if
// this number is ever revisited.
const GUTTER_W_BLANK = 760;
// A note gutter is wider than a name-only one because it holds a short phrase
// rather than one word: at 900 a note wraps to two comfortable lines instead of
// four cramped ones, and the picture still keeps most of the figure's width.
const GUTTER_W_NOTES = 900;
const LEADER_LEN   = 26;   // short line joining a band to its label
const MARGIN       = 10;   // hair of margin so strokes are not clipped

// Band tints — the light gradient, brightest at the top to near dark at the floor.
const SKY_TINT    = '#EAF6FF';   // emergent band: pale open sky
const CANOPY_TINT = '#A8D98A';   // canopy band: bright sunlit green
const UNDER_TINT  = '#4C7A50';   // understorey band: dim green
const FLOOR_TINT  = '#33261A';   // forest floor: dark brown

// Ink drawn on the bands.
const EMERGENT_CROWN = '#5FA357';   // small crowns of the emergent trees
const EMERGENT_TRUNK = '#7A5A3C';   // tall widely spaced trunks
const CANOPY_LOBE    = '#79C25E';   // overlapping treetops forming the roof
const CANOPY_EDGE    = '#4E8F42';   // outline that keeps the roof reading as one mass
const UNDER_TRUNK    = '#2F4F33';   // thin understorey trunks
const UNDER_LEAF     = '#2A5231';   // large understorey leaves, darker than their band
const UNDER_LEAF_EDGE = '#7FAE83';  // pale leaf outline, so leaves read on a dim band
const FLOOR_LITTER   = '#5A4128';   // leaf litter on the ground
const FLOOR_ROOT     = '#4A3623';   // roots spreading across the floor

const LIGHT_COLOUR = '#F5A623';   // sun and light arrows, house orange
const SUN_R        = 62;
const TEXT_DARK    = '#1F2A22';   // layer names
const TEXT_MUTED   = '#4A5A4E';   // height lines
const FLOOR_TEXT   = '#FFFFFF';   // the "2 rays in every 100" note, on dark ground
const WRITE_LINE   = '#6B7A6E';   // the blank form's write-on rule

const NAME_FONT   = 66;
const HEIGHT_FONT = 46;
const NOTE_FONT   = 46;
const FONT        = 'Comic Sans MS, sans-serif';

// Band notes: house blue, so a note reads as the teaching point beside the plain
// black name, and still separates from the muted height line in greyscale print.
const BAND_NOTE_COLOUR   = '#0070C0';
const BAND_NOTE_FONT     = 48;
const BAND_NOTE_MIN_FONT = 34;   // floor if a long note has to shrink into a short band
const BAND_NOTE_WRAP     = 24;   // characters per line before wrapping

const DIM_OPACITY = 0.30;   // how far a non-highlighted band falls back
// ─── END CONSTANTS ────────────────────────────────────────────────────────

const { printsInInk, inkGrey } = require('./surface-profiles');

// Every colour the drawing uses, by the name it has above, and the same
// table in the greys a photocopier keeps. The band note and the light arrows
// were blue and orange; as greys they still sit apart from the black names
// and the band tints they cross.
const COLOURS = {
  SKY_TINT: SKY_TINT,
  CANOPY_TINT: CANOPY_TINT,
  UNDER_TINT: UNDER_TINT,
  FLOOR_TINT: FLOOR_TINT,
  EMERGENT_CROWN: EMERGENT_CROWN,
  EMERGENT_TRUNK: EMERGENT_TRUNK,
  CANOPY_LOBE: CANOPY_LOBE,
  CANOPY_EDGE: CANOPY_EDGE,
  UNDER_TRUNK: UNDER_TRUNK,
  UNDER_LEAF: UNDER_LEAF,
  UNDER_LEAF_EDGE: UNDER_LEAF_EDGE,
  FLOOR_LITTER: FLOOR_LITTER,
  FLOOR_ROOT: FLOOR_ROOT,
  LIGHT_COLOUR: LIGHT_COLOUR,
  TEXT_DARK: TEXT_DARK,
  TEXT_MUTED: TEXT_MUTED,
  FLOOR_TEXT: FLOOR_TEXT,
  WRITE_LINE: WRITE_LINE,
  BAND_NOTE_COLOUR: BAND_NOTE_COLOUR
};
const INK = Object.fromEntries(Object.entries(COLOURS).map(([k, v]) => [k, inkGrey(v, { lightest: 0xF2 })]));
INK.BAND_NOTE_COLOUR = '#1A1A1A';
INK.FLOOR_TEXT = '#FFFFFF';

const ORDER = ['emergent', 'canopy', 'understorey', 'forest-floor'];

const DISPLAY_NAME = {
  emergent: 'Emergent',
  canopy: 'Canopy',
  understorey: 'Understorey',
  'forest-floor': 'Forest floor'
};

// UK spelling throughout, and the heights the lesson teaches. The bands are drawn
// touching, so their heights have to meet as well: the understorey runs up to the
// canopy's lower edge (30 m) rather than stopping at 20 m, which would print a
// ten-metre gap the picture itself does not show.
const HEIGHT_TEXT = {
  emergent: 'about 60 m',
  canopy: '30 to 45 m',
  understorey: '5 to 30 m',
  'forest-floor': 'ground level'
};

function f(n) { return Number(n).toFixed(2); }

// Accept the spellings a designer might reasonably write, so a highlight pair
// never silently fails to match and dim the wrong two bands.
function normaliseBand(name) {
  const s = String(name == null ? '' : name).trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (s === 'emergent' || s === 'emergents') return 'emergent';
  if (s === 'canopy') return 'canopy';
  if (s === 'understorey' || s === 'understory') return 'understorey';
  if (s === 'forest-floor' || s === 'floor' || s === 'forest') return 'forest-floor';
  return null;
}

// Designer-supplied text, so it is escaped before it goes anywhere near the SVG.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// notes: { canopy: 'a thick roof of leaves', ... } → keyed by canonical band name,
// blank and unrecognised entries dropped so a typo cannot label the wrong band.
function resolveNotes(data) {
  const raw = (data && typeof data.notes === 'object' && data.notes) || {};
  const out = {};
  Object.keys(raw).forEach(function (k) {
    const band = normaliseBand(k);
    const text = String(raw[k] == null ? '' : raw[k]).trim();
    if (band && text) out[band] = text;
  });
  return out;
}

// Rough advance width per character for Comic Sans at a given size. Only ever used
// to size the label gutter, and deliberately a slight OVER-estimate: a gutter a
// hair too wide costs a little padding, while one too narrow clips a note.
function textW(text, font) {
  return String(text).length * font * 0.62;
}

// Greedy word wrap. A word longer than the line budget takes its own line rather
// than being cut, because a clipped word on a diagram reads as a rendering fault.
function wrapNote(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach(function (w) {
    const next = line ? line + ' ' + w : w;
    if (next.length <= maxChars || !line) { line = next; return; }
    lines.push(line);
    line = w;
  });
  if (line) lines.push(line);
  return lines;
}

function resolveHighlight(data) {
  const raw = Array.isArray(data.highlight) ? data.highlight : [];
  const set = [];
  raw.forEach(function (n) {
    const b = normaliseBand(n);
    if (b && set.indexOf(b) === -1) set.push(b);
  });
  return set;
}

// The y range each band occupies, top to bottom.
function bandBounds() {
  const out = {};
  let y = 0;
  ORDER.forEach(function (b) {
    out[b] = { top: y, h: BAND_H[b], bottom: y + BAND_H[b], mid: y + BAND_H[b] / 2 };
    y += BAND_H[b];
  });
  return out;
}

function cacheKey(data) {
  const d = data || {};
  const labels  = d.blank ? 'blank' : (d.labels ? '1' : '0');
  const heights = d.heights ? '1' : '0';
  const light   = d.light ? '1' : '0';
  const hl      = resolveHighlight(d).join('+');
  // Notes are part of the drawing, so two slides whose notes differ must not
  // share one pre-rendered PNG.
  const n       = resolveNotes(d);
  const notes   = ORDER
    .filter(function (b) { return n[b]; })
    .map(function (b) { return b + '=' + n[b]; })
    .join('|');
  return 'rain:' + labels + ':' + heights + ':' + light + ':' + hl + ':' + notes;
}

// ── Band content ───────────────────────────────────────────────────────────
// Each band returns its TINT (`bg`) separately from its trees (`ink`), because
// the two are drawn in two passes: every band's tint first, then every band's
// ink on top. A tall emergent tree has to be visible against the darker bands it
// passes through, and a single pass per band would have the understorey's tint
// painted straight over its trunk (which reads as a stub floating in mid air).
// Both halves of a band carry the same dim opacity, so a highlight still fades
// the whole band as one.

function emergentParts(B, T) {
  const b = B.emergent;
  const bg = `<rect x="0" y="${f(b.top)}" width="${DIAG_W}" height="${f(b.h)}" fill="${T.SKY_TINT}"/>`;
  const parts = [];

  // A FEW very tall, WIDELY SPACED trees whose small crowns rise clear above
  // everything else. Trunks run down past the canopy so they read as one tree.
  const trunks = [170, 460, 750];
  trunks.forEach(function (x) {
    // The trunk runs all the way to the ground so the tree reads as one tall
    // tree passing through every layer, not a stub floating in the understorey.
    const topY = 150, baseY = B['forest-floor'].top + 10;
    const topHalf = 9, baseHalf = 17;   // slight taper, thicker at the bottom
    parts.push(
      `<polygon points="${f(x - topHalf)},${f(topY)} ${f(x + topHalf)},${f(topY)} ` +
      `${f(x + baseHalf)},${f(baseY)} ${f(x - baseHalf)},${f(baseY)}" fill="${T.EMERGENT_TRUNK}"/>`
    );
    // Small crown — deliberately small, so "rises clear above, but is not big" reads.
    parts.push(`<ellipse cx="${f(x)}" cy="120" rx="92" ry="66" fill="${T.EMERGENT_CROWN}"/>`);
    parts.push(`<ellipse cx="${f(x - 46)}" cy="152" rx="58" ry="42" fill="${T.EMERGENT_CROWN}"/>`);
    parts.push(`<ellipse cx="${f(x + 46)}" cy="152" rx="58" ry="42" fill="${T.EMERGENT_CROWN}"/>`);
  });
  return { bg: bg, ink: parts };
}

function canopyParts(B, T) {
  const b = B.canopy;
  const bg = `<rect x="0" y="${f(b.top)}" width="${DIAG_W}" height="${f(b.h)}" fill="${T.CANOPY_TINT}"/>`;
  const parts = [];
  // A CONTINUOUS band of overlapping treetops: lobes spaced closer than their
  // radius so no gap of sky ever shows through — an unbroken roof.
  // Solid mass first, so no sky can ever show between the crowns, then TWO
  // offset rows of overlapping crowns on top of it — the second row is what
  // stops the band below the skyline reading as a flat slab of green.
  const r = 104, step = 88, cy = b.top + 78;
  parts.push(`<rect x="0" y="${f(cy)}" width="${DIAG_W}" height="${f(b.bottom - cy)}" fill="${T.CANOPY_LOBE}"/>`);
  const row2 = b.top + 176;
  for (let x = -40 + step / 2; x <= DIAG_W + 40; x += step) {
    parts.push(`<circle cx="${f(x)}" cy="${f(row2)}" r="${f(r * 0.86)}" fill="${T.CANOPY_LOBE}" stroke="${T.CANOPY_EDGE}" stroke-width="5"/>`);
  }
  for (let x = -40; x <= DIAG_W + 40; x += step) {
    parts.push(`<circle cx="${f(x)}" cy="${f(cy)}" r="${f(r)}" fill="${T.CANOPY_LOBE}" stroke="${T.CANOPY_EDGE}" stroke-width="5"/>`);
  }
  return { bg: bg, ink: parts };
}

function understoreyParts(B, T) {
  const b = B.understorey;
  const bg = `<rect x="0" y="${f(b.top)}" width="${DIAG_W}" height="${f(b.h)}" fill="${T.UNDER_TINT}"/>`;
  const parts = [];

  // Thinner trunks and large leaves in a dimmer green — sparse, so the band reads
  // as "less growing here" beside the solid canopy above it.
  const xs = [90, 250, 400, 560, 720, 900];
  xs.forEach(function (x, i) {
    parts.push(`<rect x="${f(x - 7)}" y="${f(b.top + 20)}" width="14" height="${f(b.h - 10)}" fill="${T.UNDER_TRUNK}"/>`);
    // Two or three large leaves per trunk, alternating side and tilt.
    const leaves = (i % 2 === 0) ? [[-1, 90], [1, 190], [-1, 268]] : [[1, 120], [-1, 220]];
    leaves.forEach(function (l) {
      const dir = l[0], dy = l[1];
      const cx = x + dir * 62;
      const cy = b.top + dy;
      const rot = dir > 0 ? 24 : -24;
      parts.push(
        `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="66" ry="27" fill="${T.UNDER_LEAF}" ` +
        `stroke="${T.UNDER_LEAF_EDGE}" stroke-width="4" transform="rotate(${rot} ${f(cx)} ${f(cy)})"/>`
      );
    });
  });
  return { bg: bg, ink: parts };
}

function floorParts(B, T) {
  const b = B['forest-floor'];
  const bg = `<rect x="0" y="${f(b.top)}" width="${DIAG_W}" height="${f(b.h)}" fill="${T.FLOOR_TINT}"/>`;
  const parts = [];

  // Roots spreading out from where the trunks meet the ground.
  [170, 460, 750].forEach(function (x) {
    [-1, 1].forEach(function (dir) {
      parts.push(
        `<path d="M ${f(x)} ${f(b.top + 6)} Q ${f(x + dir * 90)} ${f(b.top + 30)} ${f(x + dir * 170)} ${f(b.top + 74)}" ` +
        `fill="none" stroke="${T.FLOOR_ROOT}" stroke-width="16" stroke-linecap="round"/>`
      );
    });
  });

  // Leaf litter — scattered fallen leaves, and almost nothing growing.
  const litter = [
    [70, 60, -18], [200, 118, 22], [330, 74, -30], [455, 140, 12],
    [560, 86, 28], [690, 132, -22], [800, 68, 16], [910, 126, -14],
    [130, 168, 10], [620, 176, -26], [880, 178, 20], [390, 186, 8]
  ];
  litter.forEach(function (l) {
    const cx = l[0], cy = b.top + l[1], rot = l[2];
    parts.push(
      `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="34" ry="13" fill="${T.FLOOR_LITTER}" ` +
      `transform="rotate(${rot} ${f(cx)} ${f(cy)})"/>`
    );
  });
  return { bg: bg, ink: parts };
}

// ── Light overlay ──────────────────────────────────────────────────────────
// The sun above, and arrows coming down that THIN band by band — five reach the
// top of the canopy, two get through it, one reaches the floor. The thinning is
// the point, so the count and the stroke both drop at each step.

function lightParts(B, T) {
  const parts = [];
  const sunX = 905, sunY = 88;

  parts.push(`<circle cx="${sunX}" cy="${sunY}" r="${SUN_R}" fill="${T.LIGHT_COLOUR}"/>`);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const x1 = sunX + Math.cos(a) * (SUN_R + 14);
    const y1 = sunY + Math.sin(a) * (SUN_R + 14);
    const x2 = sunX + Math.cos(a) * (SUN_R + 46);
    const y2 = sunY + Math.sin(a) * (SUN_R + 46);
    parts.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${T.LIGHT_COLOUR}" stroke-width="12" stroke-linecap="round"/>`);
  }

  function arrow(x, y1, y2, w) {
    const head = w * 2.6;
    parts.push(`<line x1="${f(x)}" y1="${f(y1)}" x2="${f(x)}" y2="${f(y2 - head)}" stroke="${T.LIGHT_COLOUR}" stroke-width="${f(w)}" stroke-linecap="round"/>`);
    parts.push(`<polygon points="${f(x)},${f(y2)} ${f(x - head * 0.7)},${f(y2 - head)} ${f(x + head * 0.7)},${f(y2 - head)}" fill="${T.LIGHT_COLOUR}"/>`);
  }

  // Full strength down through the open sky to the top of the canopy.
  [110, 300, 490, 680, 870].forEach(function (x) {
    arrow(x, B.emergent.top + 180, B.canopy.top - 6, 16);
  });
  // Only two get through the canopy roof.
  [300, 680].forEach(function (x) {
    arrow(x, B.understorey.top + 30, B.understorey.top + 210, 10);
  });
  // One thin ray reaches the forest floor.
  arrow(300, B.understorey.bottom - 90, B['forest-floor'].top + 10, 6);

  return parts;
}

// ── Labels ─────────────────────────────────────────────────────────────────

function labelParts(band, B, opts, T) {
  const b = B[band];
  const parts = [];
  const gx = DIAG_W + GUTTER_GAP;
  const gw = opts.blank ? GUTTER_W_BLANK : (opts.gutterW || GUTTER_W);

  // Short leader from the band edge to its label, so a name can never be read
  // against the wrong band.
  parts.push(`<line x1="${f(DIAG_W)}" y1="${f(b.mid)}" x2="${f(gx - 8)}" y2="${f(b.mid)}" stroke="${T.TEXT_MUTED}" stroke-width="5"/>`);

  if (opts.blank) {
    // WRITE-ON form: a ruled line the child writes the layer's name on.
    parts.push(
      `<line x1="${f(gx + LEADER_LEN)}" y1="${f(b.mid + 22)}" x2="${f(gx + gw - 20)}" y2="${f(b.mid + 22)}" ` +
      `stroke="${T.WRITE_LINE}" stroke-width="6" stroke-linecap="round"/>`
    );
    return parts;
  }

  const hasHeight = opts.heights;
  const note = opts.notes && opts.notes[band];

  // With a note, the block is stacked and centred on the band as one unit (name,
  // note, height), so two or three lines stay tied to the band they belong to.
  // Without one, the original two-line geometry is kept exactly as it was, so
  // every diagram already in a deck, on a sheet or on a wall redraws unchanged.
  if (note) {
    const noteLines = wrapNote(note, BAND_NOTE_WRAP);
    let nf = BAND_NOTE_FONT;
    const stack = function (font) {
      const rows = [{ t: DISPLAY_NAME[band], font: NAME_FONT, lh: NAME_FONT * 1.12, fill: T.TEXT_DARK, bold: true }];
      noteLines.forEach(function (l) {
        rows.push({ t: l, font: font, lh: font * 1.20, fill: T.BAND_NOTE_COLOUR, bold: true });
      });
      if (hasHeight) {
        rows.push({ t: HEIGHT_TEXT[band], font: HEIGHT_FONT, lh: HEIGHT_FONT * 1.18, fill: T.TEXT_MUTED, bold: false });
      }
      return rows;
    };
    let rows = stack(nf);
    const totalH = function (rs) { return rs.reduce(function (s, r) { return s + r.lh; }, 0); };
    // A short band (the forest floor is the shortest) plus a long note would
    // otherwise run into its neighbour, so the note shrinks until the block fits.
    while (totalH(rows) > b.h - 16 && nf > BAND_NOTE_MIN_FONT) {
      nf -= 4;
      rows = stack(nf);
    }
    let y = b.mid - totalH(rows) / 2;
    rows.forEach(function (r) {
      parts.push(
        `<text x="${f(gx + LEADER_LEN)}" y="${f(y + r.lh / 2)}" text-anchor="start" dominant-baseline="central" ` +
        `font-family="${FONT}" font-size="${f(r.font)}"${r.bold ? ' font-weight="bold"' : ''} fill="${r.fill}">${esc(r.t)}</text>`
      );
      y += r.lh;
    });
    return parts;
  }

  const nameY = hasHeight ? b.mid - 10 : b.mid;
  parts.push(
    `<text x="${f(gx + LEADER_LEN)}" y="${f(nameY)}" text-anchor="start" dominant-baseline="central" ` +
    `font-family="${FONT}" font-size="${NAME_FONT}" font-weight="bold" fill="${T.TEXT_DARK}">${DISPLAY_NAME[band]}</text>`
  );
  if (hasHeight) {
    parts.push(
      `<text x="${f(gx + LEADER_LEN)}" y="${f(b.mid + 62)}" text-anchor="start" dominant-baseline="central" ` +
      `font-family="${FONT}" font-size="${HEIGHT_FONT}" fill="${T.TEXT_MUTED}">${HEIGHT_TEXT[band]}</text>`
    );
  }
  return parts;
}

// ── Assembly ───────────────────────────────────────────────────────────────

// `profile` is optional: the stick-in pack passes its own and every colour
// becomes the grey it would photocopy to. The bands were chosen as a brightness
// ramp so that this still shows the light thinning towards the floor.
function tightSvg(data, profile) {
  const T = printsInInk(profile) ? INK : COLOURS;
  const d = data || {};
  const blank = d.blank === true;
  // The write-on form prints no names, so it carries no notes either: a note is a
  // strong clue to the very name the child is there to recall.
  const notes = blank ? {} : resolveNotes(d);
  const hasNotes = Object.keys(notes).length > 0;
  // Heights and notes imply the gutter; the blank form always needs it for its
  // write-on lines.
  const showLabels = blank || d.labels === true || d.heights === true || hasNotes;
  const heights = !blank && d.heights === true;
  const light = d.light === true;
  const highlight = resolveHighlight(d);
  const dimming = highlight.length > 0;

  const B = bandBounds();
  const bodyParts = {
    emergent: emergentParts(B, T),
    canopy: canopyParts(B, T),
    understorey: understoreyParts(B, T),
    'forest-floor': floorParts(B, T)
  };

  // The gutter is measured to its own longest line, never left at a fixed width:
  // this figure is placed by its true aspect, so slack inside the gutter is
  // deadspace that shrinks the picture in every zone it lands in. Notes can only
  // widen it beyond the name-only width, and never past the two-line cap.
  let nameGutterW = GUTTER_W;
  if (hasNotes) {
    let widest = 0;
    ORDER.forEach(function (band) {
      widest = Math.max(widest, textW(DISPLAY_NAME[band], NAME_FONT));
      if (heights) widest = Math.max(widest, textW(HEIGHT_TEXT[band], HEIGHT_FONT));
      if (notes[band]) {
        wrapNote(notes[band], BAND_NOTE_WRAP).forEach(function (l) {
          widest = Math.max(widest, textW(l, BAND_NOTE_FONT));
        });
      }
    });
    nameGutterW = Math.max(GUTTER_W, Math.min(GUTTER_W_NOTES, LEADER_LEN + widest + 30));
  }
  const gutterW = showLabels ? GUTTER_GAP + (blank ? GUTTER_W_BLANK : nameGutterW) : 0;
  const w = DIAG_W + gutterW + 2 * MARGIN;
  const h = DIAG_H + 2 * MARGIN;

  const parts = [];
  // White base under the cross section so a dimmed band falls back to paper
  // consistently on every surface, and the light gradient is not read against
  // whatever colour sits behind the image.
  parts.push(`<rect x="0" y="0" width="${DIAG_W}" height="${DIAG_H}" fill="#FFFFFF"/>`);

  // Bands are clipped to the diagram box so overhanging treetops and roots
  // never push the tight crop out and bake in deadspace.
  parts.push(`<defs><clipPath id="rainClip"><rect x="0" y="0" width="${DIAG_W}" height="${DIAG_H}"/></clipPath></defs>`);

  const dimAttr = function (band) {
    return (dimming && highlight.indexOf(band) === -1) ? ` opacity="${DIM_OPACITY}"` : '';
  };

  // Pass 1: every band's tint, top to bottom — the light gradient on its own.
  ORDER.forEach(function (band) {
    parts.push(`<g clip-path="url(#rainClip)"${dimAttr(band)}>${bodyParts[band].bg}</g>`);
  });
  // Pass 2: every band's trees on top, so a tall emergent trunk stays visible
  // through the darker bands it passes down through.
  ORDER.forEach(function (band) {
    parts.push(`<g clip-path="url(#rainClip)"${dimAttr(band)}>${bodyParts[band].ink.join('')}</g>`);
  });

  // Outline round the whole cross section, so the four bands read as one figure.
  parts.push(`<rect x="0" y="0" width="${DIAG_W}" height="${DIAG_H}" fill="none" stroke="${T.TEXT_DARK}" stroke-width="6"/>`);

  if (light) {
    parts.push(`<g clip-path="url(#rainClip)">${lightParts(B, T).join('')}</g>`);
    // The number that makes the thinning concrete, printed on the dark floor.
    const fb = B['forest-floor'];
    parts.push(
      `<text x="${f(DIAG_W / 2)}" y="${f(fb.mid + 24)}" text-anchor="middle" dominant-baseline="central" ` +
      `font-family="${FONT}" font-size="${NOTE_FONT}" font-weight="bold" fill="${T.FLOOR_TEXT}">about 2 rays in every 100</text>`
    );
  }

  if (showLabels) {
    ORDER.forEach(function (band) {
      parts.push(`<g${dimAttr(band)}>${labelParts(band, B, { blank: blank, heights: heights, notes: notes, gutterW: nameGutterW }, T).join('')}</g>`);
    });
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="${f(-MARGIN)} ${f(-MARGIN)} ${f(w)} ${f(h)}">${parts.join('')}</svg>`;
  return { svg, aspect: w / h, w, h };
}

module.exports = { tightSvg, cacheKey, ORDER, DISPLAY_NAME, HEIGHT_TEXT, normaliseBand };
