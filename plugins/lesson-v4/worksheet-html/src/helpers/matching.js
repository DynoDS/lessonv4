"use strict";

// Activities that JOIN one thing to another.
//
// This family exists because of a gap real worksheets exposed. Every helper
// before it renders one self-contained block: a table, a chart, a set of
// questions. But a great many published sheets ask the child to CONNECT things
// across the page - draw a line from the picture to the category, place the
// artefact on the timeline, match the plant to its region. Nothing in the
// engine could express that, so those sheets could not be built at all.
//
// The engine does NOT draw the connecting line. The child does; that is the
// task. What a helper here provides is the pair of things to be joined and a
// clear place to aim at, which is what the printed dot is for.
//
// All three are HTML and CSS rather than SVG, on purpose. A drawn helper is
// scaled to its zone, so its labels shrink with it and a legibility floor has
// to be computed to stop them printing too small to read. Text in HTML prints
// at the point size the design system states, whatever width the zone gives
// it, so the problem cannot arise here in the first place.

const { BODY_PT, PT_MM, LINE_MM, NOTE_LINE_MM, WRITING_LINE_MM, esc, promptHtml, linesFor } = require("./shared");
const { SPACE, INSET } = require("../tokens");

// The widest a zone can ever be, so a minimum height can be stated as the
// SHORTEST the content could come out. Same reasoning as text.js.
const WIDEST_ZONE_MM = 261;

// ─── match-up ────────────────────────────────────────────────────────────
// Two columns of cards with a dot on each facing edge, and the child draws the
// line between them. The two columns need not be the same length, and usually
// are not: eight materials on the left, three states of matter on the right.

const MATCH_CARD_MIN_MM = 16; // one card. Not a text size: it is how big a
// target a child can reliably draw a line to, which is a bigger thing than the
// label sitting in it.
const MATCH_GAP_MM = 3; // between one card and the next, at the tightest
// A card, so the card inset. It was a flat 3mm both ways while the card-row
// below used a flat 2mm, for the same object on the same page.
const MATCH_CARD_PAD_V_MM = INSET.card.v;
const MATCH_CARD_PAD_H_MM = INSET.card.h;
const MATCH_DOT_MM = 3;
// The reserved slot an authored symbol prints in, so a column of cards stays
// aligned whether or not each one carries one.
const MATCH_SYMBOL_MM = 6;

// The corridor the child draws ACROSS, and the single most important number in
// this helper: it is not a gap between two columns, it is the space the
// activity happens in. Eight lines crossing it have to stay far enough apart to
// be told from one another, and a child has to be able to run a pencil down it
// without hitting the cards on either side.
//
// A fixed 14mm was wrong, and wrong in the way that only shows on paper: on a
// full-width sheet it left the two columns all but touching, with the dots
// hanging into what little space there was. Daniel picked it out by eye at once.
// A SHARE of the width holds up at every size instead, with a floor so a narrow
// zone still leaves a usable run, and a ceiling so a landscape page does not
// turn into two thin columns either side of a void.
// Asked on the check sheet, at the narrowest a match-up ever gets: "is there
// enough room down the middle to draw the lines?" The answer was "probably",
// which is a weak yes and not a settled number. So it went UP rather than
// staying where it was: a borderline verdict on the thing the whole activity
// happens in should be resolved towards the child. Worth asking again once a
// class has actually drawn on one.
const MATCH_CORRIDOR_SHARE = 0.24;
const MATCH_CORRIDOR_MIN_MM = 20;
const MATCH_CORRIDOR_MAX_MM = 40;

function matchCorridorMm(zoneWidthMm) {
  return Math.max(
    MATCH_CORRIDOR_MIN_MM,
    Math.min(MATCH_CORRIDOR_MAX_MM, zoneWidthMm * MATCH_CORRIDOR_SHARE)
  );
}

// The room a label actually has inside one card: the column, less the corridor
// it shares, less its own padding and the dot it sits beside.
function matchLabelWidthMm(zoneWidthMm) {
  const columnMm = (zoneWidthMm - matchCorridorMm(zoneWidthMm)) / 2;
  return Math.max(12, columnMm - MATCH_CARD_PAD_H_MM * 2 - MATCH_DOT_MM - 2);
}

function matchCardHeightMm(label, zoneWidthMm) {
  const textMm = linesFor(label, matchLabelWidthMm(zoneWidthMm)) * LINE_MM;
  return Math.max(MATCH_CARD_MIN_MM, textMm + MATCH_CARD_PAD_V_MM * 2);
}

function matchColumnHeightMm(items, zoneWidthMm) {
  if (!items.length) return 0;
  const cards = items.reduce(
    (h, item) => h + matchCardHeightMm(item.label, zoneWidthMm),
    0
  );
  return cards + (items.length - 1) * MATCH_GAP_MM;
}

function renderMatchUp(spec) {
  const column = (items) =>
    (items || [])
      .map(
        (item) => `
        <li class="h-match-card">
          ${
            item.symbol
              ? `<span class="h-match-symbol">${esc(String(item.symbol))}</span>`
              : ""
          }
          <span class="h-match-label">${esc(item.label)}</span>
          <span class="h-match-dot"></span>
        </li>`
      )
      .join("");

  return `
    <div class="h-match">
      ${spec.text ? `<p class="h-match-stem">${promptHtml(spec.text)}</p>` : ""}
      <div class="h-match-cols">
        <ul class="h-match-col h-match-left">${column(spec.left)}</ul>
        <ul class="h-match-col h-match-right">${column(spec.right)}</ul>
      </div>
    </div>`;
}

function measureMatchUp(spec, widthMm) {
  const stemMm = spec.text ? linesFor(spec.text, widthMm) * LINE_MM + 2 : 0;
  // The taller of the two columns sets the height. The shorter one spreads its
  // own cards down the same distance, which is why a three-card column beside
  // an eight-card one still reaches the bottom.
  const tallest = Math.max(
    matchColumnHeightMm(spec.left || [], widthMm),
    matchColumnHeightMm(spec.right || [], widthMm)
  );
  return stemMm + tallest;
}

// The longest single word anywhere in the activity, in millimetres.
//
// A label WRAPS, so the minimum is not "the longest label on one line". But a
// word cannot wrap inside itself: "photosynthesis" either fits its card or
// breaks out of it, so the widest word is the real floor.
function longestWordMm(spec) {
  const labels = [...(spec.left || []), ...(spec.right || [])].map((i) => i.label || "");
  const longest = labels
    .flatMap((label) => String(label).split(/\s+/))
    .reduce((n, word) => Math.max(n, word.length), 0);
  return longest * BODY_PT * PT_MM * 0.5;
}

function needsMatchUp(spec) {
  // A card wide enough for the longest word in it, twice over, plus the
  // corridor between them.
  //
  // This started as a flat 100mm, which refused every half-page column outright
  // and made the helper full-width-only. Daniel asked whether it fitted
  // different zones and the honest answer was no. A minimum that follows the
  // CONTENT lets a short-labelled sort sit in a column beside something else,
  // while a set of long scientific words still asks for the room it genuinely
  // needs - which is the rule the rest of the engine already works to.
  const cardMm = Math.max(
    30,
    longestWordMm(spec) + MATCH_CARD_PAD_H_MM * 2 + MATCH_DOT_MM + 2
  );
  return {
    minWidthMm: Math.min(267, cardMm * 2 + MATCH_CORRIDOR_MIN_MM),
    minHeightMm: measureMatchUp(spec, WIDEST_ZONE_MM),
  };
}

// ─── card-row ────────────────────────────────────────────────────────────
// A row of small titled cards, each optionally carrying a picture: the plants
// along the foot of a rainforest sheet, the four artefacts under a timeline.
//
// The row is INSIDE the helper rather than being six zones in a layout. Six
// cards are one thing a child reads as a set, and a layout that had to be
// rebuilt every time the count changed would be geometry standing in for
// content, which is the mistake this engine is built to avoid.

const CARD_PAD_V_MM = INSET.card.v;
const CARD_PAD_H_MM = INSET.card.h;
const CARD_GAP_MM = 3;
// Only a fallback for a picture whose natural size is unknown. The CSS draws
// a card's image at `width: 100%; height: auto` - the photo's OWN aspect -
// so the estimate must use that same aspect. A flat 0.6 guessed here while
// the browser drew the truth: a square photo rendered two-thirds taller than
// it was measured, and the zone's `overflow: hidden` cut the difference off
// the bottom of the card without anything looking wrong. resolveImages fills
// `imageWidth`/`imageHeight` from the file's real header before any measuring
// runs, so the fallback should almost never be reached.
const CARD_IMAGE_RATIO = 0.6;

function cardImageAspect(card) {
  return card.imageWidth > 0 && card.imageHeight > 0
    ? card.imageHeight / card.imageWidth
    : CARD_IMAGE_RATIO;
}

function cardInnerWidthMm(widthMm, columns) {
  const gaps = (columns - 1) * CARD_GAP_MM;
  return Math.max(10, (widthMm - gaps) / columns - CARD_PAD_H_MM * 2);
}

function cardColumns(spec) {
  const count = (spec.cards || []).length || 1;
  return Math.max(1, Math.min(spec.columns || count, count));
}

const CARD_BORDER_MM = 0.8; // 0.4mm top and bottom

// A response the designer asks EVERY card for: a line to explain a choice, a
// box to tick. Asked for once on the helper and repeated on each card, because
// "write why beside each one" is one instruction to a child, not six.
const CARD_MARK_BOX_MM = 4;

// The ruled line a child writes on takes the year group's own height, the same
// as every other writing helper: a Year 6 card measured on Year 1 lines is
// measured wrong.
function cardWriteMm(spec) {
  return WRITING_LINE_MM[spec && spec.phase === "upper" ? "upper" : "lower"] + 1;
}

function cardResponseMm(spec) {
  return (
    ((spec && spec.writeLabel) ? NOTE_LINE_MM + cardWriteMm(spec) : 0) +
    ((spec && spec.markLabel) ? Math.max(NOTE_LINE_MM, CARD_MARK_BOX_MM) + 1 : 0)
  );
}

function cardHeightMm(card, innerMm, spec) {
  const titleMm = card.title ? linesFor(card.title, innerMm) * LINE_MM : 0;
  const imageMm = card.imageHref ? innerMm * cardImageAspect(card) : 0;
  const captionMm = card.caption
    ? linesFor(card.caption, innerMm) * NOTE_LINE_MM
    : 0;

  // Every part of this answers to something in the CSS below. The border and
  // the two 1mm margins were left out of the first version, which came to
  // 0.8mm short: the bottom of the caption on the tallest card in each row was
  // sliced off, and the row still looked finished.
  const marginsMm = (card.title ? 1 : 0) + (card.caption ? 1 : 0);
  return (
    titleMm +
    imageMm +
    captionMm +
    cardResponseMm(spec) +
    CARD_PAD_V_MM * 2 +
    CARD_BORDER_MM +
    marginsMm +
    0.5
  );
}

// Where a card's dot sits, when it has one. A card row is often HALF a
// matching activity: six plants along the foot of a page, each to be joined to
// a layer of the diagram above them. Without somewhere to aim, the instruction
// "draw a line from each plant" has nothing to point at, and the sheet's whole
// task quietly becomes a reading exercise.
const CARD_DOT_SIDES = new Set(["top", "bottom", "left", "right"]);

function cardDotSide(spec) {
  return CARD_DOT_SIDES.has(spec.dot) ? spec.dot : null;
}

function renderCardRow(spec) {
  const columns = cardColumns(spec);
  const dot = cardDotSide(spec);
  const cards = (spec.cards || [])
    .map(
      (card) => `
      <li class="h-card">
        ${card.title ? `<p class="h-card-title">${esc(card.title)}</p>` : ""}
        ${
          card.imageHref
            ? `<img class="h-card-img" src="${esc(card.imageHref)}" alt="">`
            : ""
        }
        ${card.caption ? `<p class="h-card-caption">${esc(card.caption)}</p>` : ""}
        ${
          spec.writeLabel
            ? `<div class="h-card-write">
                <span class="h-card-write-label">${esc(spec.writeLabel)}</span>
                <span class="h-card-write-line" style="height:${cardWriteMm(spec)}mm"></span>
              </div>`
            : ""
        }
        ${
          spec.markLabel
            ? `<div class="h-card-mark">
                <span class="h-card-mark-box"></span>
                <span>${esc(spec.markLabel)}</span>
              </div>`
            : ""
        }
        ${dot ? `<span class="h-card-dot h-card-dot-${dot}"></span>` : ""}
      </li>`
    )
    .join("");

  return `
    <div class="h-cardrow">
      ${spec.text ? `<p class="h-cardrow-stem">${esc(spec.text)}</p>` : ""}
      <ul class="h-cardrow-list" style="--h-card-cols:${columns}">${cards}</ul>
    </div>`;
}

function measureCardRow(spec, widthMm) {
  const columns = cardColumns(spec);
  const innerMm = cardInnerWidthMm(widthMm, columns);
  const cards = spec.cards || [];
  const rows = Math.ceil(cards.length / columns) || 1;

  // Every card in one row is as tall as the tallest card in it, because they
  // sit on a shared baseline. Measuring the average instead let a card with a
  // two-line caption run past the bottom of the zone.
  let total = 0;
  for (let r = 0; r < rows; r += 1) {
    const inRow = cards.slice(r * columns, (r + 1) * columns);
    const tallest = inRow.reduce(
      (h, card) => Math.max(h, cardHeightMm(card, innerMm, spec)),
      MATCH_CARD_MIN_MM
    );
    total += tallest + (r < rows - 1 ? CARD_GAP_MM : 0);
  }

  const stemMm = spec.text ? linesFor(spec.text, widthMm) * LINE_MM + 2 : 0;
  return stemMm + total;
}

function needsCardRow(spec) {
  const columns = cardColumns(spec);
  return {
    // A card holding a title and a caption stops being readable somewhere
    // around 30mm across, so the width this needs follows how many cards are
    // asked to share the row.
    minWidthMm: Math.min(267, columns * 30 + (columns - 1) * CARD_GAP_MM),
    minHeightMm: measureCardRow(spec, WIDEST_ZONE_MM),
  };
}

// ─── timeline ────────────────────────────────────────────────────────────
// A line across the page with named bands along it and dated points beneath,
// for a child to place events or artefacts onto.
//
// Positions are given as fractions from 0 to 1, NOT as dates the helper works
// out for itself. A school timeline is almost never to scale: the Stone Age
// runs from two million years ago to four thousand, and drawn honestly the
// last two eras would be invisible. The teacher decides the spacing, because
// the spacing is a teaching decision.

// An era's name chip. 8mm rather than 7: a note-size label is 4.3mm on its
// line, and the chip now carries its own box edge as well as its padding, so
// 7mm left it a tenth of a millimetre short. The chip clips what it cannot
// hold and says nothing, which is the failure this engine keeps meeting.
const TL_CHIP_MM = 8;
const TL_ERA_PAD_V_MM = SPACE.hair;
const TL_ERA_PAD_H_MM = SPACE.tight;
const TL_LINE_MM = 10; // the line itself, and the depth its ticks hang down
const TL_MARK_MM = 20; // a tick plus the date under it, which runs to two short
// lines at note size ("2,000,000 years ago" does not fit on one). The marks sit
// in an absolutely-positioned strip, so this height is not negotiable the way an
// ordinary block's is: a strip too short does not grow, it lets its labels run
// out of the bottom and over whatever is printed next.
const TL_CAPTION_MM = 8;
const TL_LABEL_MM = 26; // how wide one date label is allowed to be before it wraps

// The marks strip is pulled UP over the line, so its ticks hang from the line
// rather than starting below it. Only the part below the line adds height.
const TL_MARKS_BELOW_MM = TL_MARK_MM - TL_LINE_MM;

function percent(value) {
  return Math.max(0, Math.min(100, Number(value) * 100));
}

// Which way a date label hangs off its own tick.
//
// A timeline's first and last marks are the two that matter most, and they sit
// at the very ends of the line. Centred on their ticks like every other label,
// half of each one hangs off the edge of the zone and is sliced away: the
// printed sheet opened with ",000 years ago" and closed with "4,000 years"
// running into the margin. So the end labels tuck INWARD from their tick while
// the ticks themselves stay exactly where the teacher put them.
const TL_EDGE = 0.08;

function labelShift(at) {
  const value = Number(at);
  if (value <= TL_EDGE) return "0";
  if (value >= 1 - TL_EDGE) return "-100%";
  return "-50%";
}

function renderTimeline(spec) {
  const eras = (spec.eras || [])
    .map((era) => {
      const left = percent(era.from);
      const width = percent(era.to) - left;
      return `<span class="h-tl-era" style="left:${left}%; width:${width}%">${esc(era.label)}</span>`;
    })
    .join("");

  const marks = (spec.marks || [])
    .map(
      (mark) => `
      <span class="h-tl-mark" style="left:${percent(mark.at)}%">
        <span class="h-tl-tick"></span>
        <span class="h-tl-mark-label" style="transform:translateX(${labelShift(mark.at)})">${esc(mark.label)}</span>
      </span>`
    )
    .join("");

  return `
    <div class="h-tl">
      ${spec.text ? `<p class="h-tl-stem">${esc(spec.text)}</p>` : ""}
      <div class="h-tl-band">
        <div class="h-tl-eras">${eras}</div>
        <div class="h-tl-line"></div>
        <div class="h-tl-marks">${marks}</div>
      </div>
      ${spec.caption ? `<p class="h-tl-caption">${esc(spec.caption)}</p>` : ""}
    </div>`;
}

function measureTimeline(spec, widthMm) {
  const stemMm = spec.text ? linesFor(spec.text, widthMm) * LINE_MM + 2 : 0;
  const captionMm = spec.caption ? TL_CAPTION_MM : 0;
  // TL_MARKS_BELOW_MM, not TL_MARK_MM: the strip overlaps the line, and
  // counting its full height claimed 10mm the figure never used.
  return stemMm + TL_CHIP_MM + TL_LINE_MM + TL_MARKS_BELOW_MM + captionMm + 2;
}

function needsTimeline(spec) {
  const marks = (spec.marks || []).length;
  const eras = (spec.eras || []).length;
  return {
    // A timeline is a full-width object, and the more it carries the wider it
    // has to be before its dates stop colliding with each other.
    minWidthMm: Math.min(267, Math.max(140, (marks + eras) * 24)),
    minHeightMm: measureTimeline(spec, WIDEST_ZONE_MM),
  };
}

const css = `
  /* ─── match-up ─── */
  .h-match { font-size: var(--type-body); display: flex; flex-direction: column; height: 100%; }
  .h-match-stem { margin: 0 0 var(--space-tight); line-height: 1.35; }
  /* The corridor, and it must stay in step with matchCorridorMm above: a share
     of the width, floored so a narrow zone still leaves a usable run and capped
     so a landscape page does not become two thin columns either side of a void. */
  .h-match-cols {
    display: flex;
    gap: clamp(${MATCH_CORRIDOR_MIN_MM}mm, ${MATCH_CORRIDOR_SHARE * 100}%, ${MATCH_CORRIDOR_MAX_MM}mm);
    flex: 1; align-items: stretch;
  }
  /* Spare height goes BETWEEN the cards, never inside them. A card that grows
     to fill the column turns a one-word label into a large empty box, and a
     large empty box on a worksheet means "write in here" - which is the wrong
     instruction, because the task is to draw a line FROM this card, not to
     write in it. Spreading the cards instead also does the activity a favour:
     it pushes the dots apart, so eight lines crossing the corridor stay far
     enough from one another to be told apart.
     This is also what matchColumnHeightMm above already predicts. The stretch
     was the CSS disagreeing with the helper's own measurement. */
  .h-match-col {
    list-style: none; margin: 0; padding: 0;
    flex: 1 1 0;
    display: flex; flex-direction: column; gap: ${MATCH_GAP_MM}mm;
    /* Both columns span the same distance, which is what keeps the first card
       level with the first category and the last with the last. It is also
       what measureMatchUp above already describes: "the shorter one spreads
       its own cards down the same distance". The gap is a floor, not a fixed
       value - the spare the engine hands this block is distributed here. */
    justify-content: space-between;
  }
  .h-match-card {
    flex: 0 0 auto;
    min-height: ${MATCH_CARD_MIN_MM}mm;
    box-sizing: border-box;
    border: var(--rule-line) solid var(--colour-ink);
    padding: ${MATCH_CARD_PAD_V_MM}mm ${MATCH_CARD_PAD_H_MM}mm;
    display: flex; align-items: center; gap: var(--space-tight);
    position: relative;
    line-height: 1.35;
  }
  /* A literal symbol the DESIGNER wrote, in a reserved slot ahead of the
     label so every card in a column lines up whether or not it has one. The
     engine prints it and never interprets it: what a triangle means on this
     sheet is the lesson's business, not the renderer's. */
  .h-match-symbol {
    flex: 0 0 ${MATCH_SYMBOL_MM}mm;
    width: ${MATCH_SYMBOL_MM}mm;
    text-align: center;
    color: var(--colour-ink);
  }
  .h-match-label { flex: 1; }
  /* The dot is what the child aims the line at, so it sits ON the card's
     facing edge rather than tucked inside the border. Half of it hangs over
     the edge, which is what makes the join look deliberate once the line is
     drawn. */
  .h-match-dot {
    width: ${MATCH_DOT_MM}mm; height: ${MATCH_DOT_MM}mm;
    border-radius: 50%;
    background: var(--colour-question);
    position: absolute; top: 50%;
    flex: none;
  }
  .h-match-left .h-match-dot { right: -${MATCH_DOT_MM / 2}mm; transform: translateY(-50%); }
  .h-match-right .h-match-dot { left: -${MATCH_DOT_MM / 2}mm; transform: translateY(-50%); }
  .h-match-right .h-match-card { flex-direction: row-reverse; }

  /* ─── card-row ─── */
  .h-cardrow { font-size: var(--type-body); }
  .h-cardrow-stem { margin: 0 0 var(--space-tight); line-height: 1.35; }
  .h-cardrow-list {
    list-style: none; margin: 0; padding: 0;
    display: grid;
    grid-template-columns: repeat(var(--h-card-cols), 1fr);
    gap: ${CARD_GAP_MM}mm;
  }
  .h-card {
    box-sizing: border-box;
    border: var(--rule-line) solid var(--colour-ink);
    padding: ${CARD_PAD_V_MM}mm ${CARD_PAD_H_MM}mm;
    display: flex; flex-direction: column; align-items: center;
    text-align: center;
    position: relative;
  }
  /* The same dot a match-up uses, so a child meets one mark meaning "join this
     to something" across every sheet rather than two. */
  .h-card-dot {
    position: absolute;
    width: ${MATCH_DOT_MM}mm; height: ${MATCH_DOT_MM}mm;
    border-radius: 50%;
    background: var(--colour-question);
  }
  .h-card-dot-top { top: -${MATCH_DOT_MM / 2}mm; left: 50%; transform: translateX(-50%); }
  .h-card-dot-bottom { bottom: -${MATCH_DOT_MM / 2}mm; left: 50%; transform: translateX(-50%); }
  .h-card-dot-left { left: -${MATCH_DOT_MM / 2}mm; top: 50%; transform: translateY(-50%); }
  .h-card-dot-right { right: -${MATCH_DOT_MM / 2}mm; top: 50%; transform: translateY(-50%); }
  .h-card-title {
    margin: 0 0 var(--space-hair);
    font-weight: bold; color: var(--colour-ink);
    line-height: 1.35;
  }
  .h-card-img { width: 100%; height: auto; display: block; }
  .h-card-caption {
    margin: var(--space-hair) 0 0;
    font-size: var(--type-note); color: var(--colour-ink);
    line-height: 1.35;
  }
  /* One response, repeated on every card, because the designer asked the whole
     row for it. Never added because a card looked like it had room. */
  .h-card-write { margin-top: var(--space-hair); }
  .h-card-write-label {
    display: block;
    font-size: var(--type-note); color: var(--colour-quiet);
  }
  /* Height is set in the markup, because it depends on the year group's
     writing line rather than on the card. */
  .h-card-write-line {
    display: block;
    border-bottom: var(--rule-hair) dotted var(--colour-rule);
  }
  .h-card-mark {
    margin-top: var(--space-hair);
    display: flex; align-items: center; gap: var(--space-tight);
    font-size: var(--type-note); color: var(--colour-ink);
  }
  .h-card-mark-box {
    flex: none;
    width: ${CARD_MARK_BOX_MM}mm; height: ${CARD_MARK_BOX_MM}mm;
    border: var(--rule-line) solid var(--colour-ink);
  }

  /* ─── timeline ─── */
  .h-tl { font-size: var(--type-body); }
  .h-tl-stem { margin: 0 0 var(--space-tight); line-height: 1.35; }
  .h-tl-band { position: relative; }
  .h-tl-eras { position: relative; height: ${TL_CHIP_MM}mm; }
  /* An era is a panel that needs separating from the one beside it, which is
     the job --colour-tint exists for. It was a solid black slab with white
     text: the heaviest mark on the page, spent on a label rather than on
     anything the child does, and the only raw colour anywhere in the helpers.
     Tint plus an ordinary box edge says "these are bands" just as clearly. */
  .h-tl-era {
    position: absolute; top: 0;
    box-sizing: border-box;
    text-align: center;
    font-size: var(--type-note); line-height: 1.35;
    background: var(--colour-tint); color: var(--colour-ink);
    border: var(--rule-line) solid var(--colour-ink);
    padding: ${TL_ERA_PAD_V_MM}mm ${TL_ERA_PAD_H_MM}mm;
    white-space: nowrap; overflow: hidden;
  }
  /* The line is the spine of the whole figure, so it is drawn heavier than a
     writing rule and in the question colour: it is part of what is being
     asked, not something the child writes on. */
  .h-tl-line {
    height: ${TL_LINE_MM}mm;
    border-top: var(--rule-heavy) solid var(--colour-question);
    margin-top: 1mm;
  }
  .h-tl-marks { position: relative; height: ${TL_MARK_MM}mm; margin-top: -${TL_LINE_MM}mm; }
  /* The tick sits EXACTLY where the teacher put it and never moves. The label
     hangs off it, and which way it hangs is decided per mark, so an end date
     tucks inward instead of being sliced off by the edge of the zone. */
  .h-tl-mark { position: absolute; top: 0; }
  .h-tl-tick {
    position: absolute; left: 0; top: 0;
    display: block; width: 0; height: ${TL_LINE_MM}mm;
    border-left: var(--rule-line) dashed var(--colour-quiet);
  }
  .h-tl-mark-label {
    position: absolute; top: ${TL_LINE_MM}mm; left: 0;
    display: block; width: ${TL_LABEL_MM}mm;
    text-align: center;
    font-size: var(--type-note); line-height: 1.35;
    color: var(--colour-ink);
  }
  .h-tl-caption {
    margin: var(--space-tight) 0 0; text-align: center;
    font-weight: bold; line-height: 1.35;
  }
`;

const helpers = {
  "match-up": {
    render: renderMatchUp,
    measure: measureMatchUp,
    needs: needsMatchUp,
    // Taller cards spread further apart make the lines easier to draw and
    // easier to read back, so spare height is a real gain here. Not greedy
    // enough to swallow a page: growth is capped at half again elsewhere.
    greed: 2,
  },
  "card-row": {
    render: renderCardRow,
    measure: measureCardRow,
    needs: needsCardRow,
    // A set of cards is as big as its contents. Stretching them taller adds
    // white space inside a border and nothing else.
    greed: 0,
  },
  timeline: {
    render: renderTimeline,
    measure: measureTimeline,
    needs: needsTimeline,
    // A timeline gains nothing from being taller; it gains from being wider,
    // and width is not what greed hands out.
    greed: 0,
  },
};

module.exports = { helpers, css };
