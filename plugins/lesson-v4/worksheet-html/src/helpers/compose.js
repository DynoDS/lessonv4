"use strict";

// Several things in one zone.
//
// A zone used to hold exactly one helper. That is how the slide deck works,
// and it is right for slides: when a slide needs six things, the TEMPLATE has
// six zones. A worksheet is not like that. A worksheet question IS a diagram
// plus a prompt plus somewhere to write, as one numbered item, and no
// arrangement of zones makes those three things one question.
//
// The old Word builder had half of this. A "compound question" took a list of
// parts and stacked them, which is the right idea. But side by side was
// hand-written per shape: triangleRowTable, geoboardRowTable, each with its own
// fixed size and its own lettering, which is why there was never an angle-row.
// Nobody had written one.
//
// So a zone's content is one of three things, and any of them can nest:
//
//   { helper: "angle", ... }            one thing, exactly as before
//   { stack: [ ... ] }                  one above another
//   { row: [ ... ] }                    side by side
//   { row: {...}, repeat: 5 }           five of the same thing side by side
//   { stack: {...}, repeat: 6 }         six of the same thing down the page
//
// ─── why this does not explode ───────────────────────────────────────────
//
// The worry is that three helpers sharing a zone need their own minimum size,
// separate from each helper's own, and that every combination would need
// judging by hand. It does not, because the minimums COMPOSE, by the same two
// rules the layout tree already uses:
//
//   a row    shares the WIDTH:  width is the sum, height is the tallest
//   a stack  shares the HEIGHT: width is the widest, height is the sum
//
// So five angles side by side need 241mm, and nobody worked that out: it is
// five times an angle's own 45mm plus the gaps. A person still supplies one
// number per helper. Everything built out of them is arithmetic.

const { SPACE } = require("../tokens");
const { esc } = require("./shared");
const { formatQuestionLabel } = require("../labels");

const GAP_MM = SPACE.item;

// A heading is not a neighbour: it belongs to what it introduces.
//
// A stack put the same gap between everything in it. Between two questions
// that is right. Between a section label and the block it names, or between an
// instruction and the thing it instructs, it is wrong twice over: the heading
// reads as one more item in the list rather than as the title of the one below
// it, and a ten-item stack spends forty millimetres of a two-hundred-and-
// fifty-millimetre page saying nothing.
//
// So an introducer is joined to what follows it at the tight step. This is the
// design system's own rhythm - four steps, and `tight` is the one for things
// that belong together - applied to the join rather than to the item.
const TIGHT_GAP_MM = SPACE.tight;
const INTRODUCERS = new Set(["section-label", "instruction"]);

function introduces(item) {
  return Boolean(
    item && !Array.isArray(item) && typeof item === "object" && INTRODUCERS.has(item.helper)
  );
}

// The gap above item i of a stack: none above the first, tight under something
// that introduced it, the ordinary item gap otherwise. Measuring, checking and
// drawing all read it here, so they cannot disagree about how tall a stack is.
function gapAboveMm(items, i) {
  if (i === 0) return 0;
  return introduces(items[i - 1]) ? TIGHT_GAP_MM : GAP_MM;
}

function stackGapsMm(items) {
  let total = 0;
  for (let i = 1; i < items.length; i += 1) total += gapAboveMm(items, i);
  return total;
}

// The gutter a question number sits in. Wide enough for "(10)" at body size,
// because a sheet whose numbering shifts left at question ten reads as two
// different sheets stapled together.
// The label column, the gap after it, and the two together - which is the room
// a numbered question gives up off its own width.
//
// It was one 9mm figure doing all three jobs, and 9mm is what "(1a)" measures
// at body weight, so a grouped Part filled its column edge to edge: the sheet
// printed "(1a)6,734" with the bracket touching the number being rounded and
// nothing between the label and the work. A label with no space after it stops
// reading as a label and starts reading as part of the question.
//
// So the label is set one step smaller (see `questionNumber` in tokens.js), the
// column is sized to hold "(1a)" at that size, and the gap is the same
// `space-tight` step that separates a number from its words everywhere else on
// the sheet. Measured in Chrome at 10pt bold Comic Sans, a label leaves this
// much clear before the question begins:
//
//   (1)     4.74mm wide   5.3mm clear
//   (1a)    6.70mm wide   3.3mm clear
//   (10a)   8.85mm wide   1.2mm clear   the widest a real sheet reaches
//
// The two must add to the gutter, because the gutter is what the measurement
// takes off the body's width and the CSS is what the browser actually draws.
// And the gutter is spent width: the approved partitioning page fits with about
// 3mm to spare, so this is 10mm and not the 14mm that would centre every label
// comfortably. A label that overruns its column runs into the gap rather than
// into the words.
const NUMBER_LABEL_MM = 8;
const NUMBER_GAP_MM = SPACE.tight;
const NUMBER_GUTTER_MM = NUMBER_LABEL_MM + NUMBER_GAP_MM;

// ─── which of the three is this? ─────────────────────────────────────────

function isRow(content) {
  return content && content.row !== undefined;
}

function isStack(content) {
  return content && content.stack !== undefined;
}

function isComparisonPair(content) {
  return content && content.comparisonPair !== undefined;
}

// A semantic mini-layout: any two real representations around one response
// target. It deliberately composes existing helpers instead of introducing a
// second rendering path, so charts, bars, diagrams and future helpers retain
// their own sizing, safety and given/blank rules.
function normaliseContent(content) {
  if (!isComparisonPair(content)) return content;
  const pair = content.comparisonPair || {};
  if (!pair.left || !pair.right) {
    throw new Error("comparisonPair: `left` and `right` representations are required");
  }
  const response = pair.response || { helper: "comparison-target" };
  const { comparisonPair, ...outer } = content;
  return {
    ...outer,
    row: [pair.left, response, pair.right],
    parts: content.parts || [1, 0.22, 1],
    comparisonPairStyle: true,
  };
}

// A row may be written out in full, or as one item and a count. Five identical
// angles are a count, not five copies of the same JSON.
function itemsOf(content) {
  content = normaliseContent(content);
  const { repeat } = content || {};
  const listed = isStack(content) ? content.stack : isRow(content) ? content.row : null;
  if (listed == null) return [];
  if (Array.isArray(listed)) return listed;
  // One item and a count, in either direction. Six identical blank record rows
  // are a count, not six copies of the same JSON - and writing them out six
  // times is how the fourth one quietly ends up different from the other five.
  const times = Number(repeat) > 0 ? Math.floor(Number(repeat)) : 1;
  return Array.from({ length: times }, () => listed);
}

// A width used only to ask an item its shape. Any width would do: the answer
// wanted is the ratio, not the size.
const REFERENCE_WIDTH_MM = 100;

// ─── the four questions, asked of anything ───────────────────────────────
// Each takes the same shape as a helper's own, so a group and a helper are
// interchangeable everywhere. That is what lets them nest.

function makeCompose({
  render,
  measure,
  needs,
  greed,
  fills = () => false,
  enough = null,
}) {
  // A row divides its width the way a layout divides a page: by proportion.
  // `parts` sets them explicitly. Left unset, the default is NOT equal shares.
  //
  // Equal shares look obviously right and are obviously wrong. Every drawing
  // is cropped tight to its own outline, so a 45 degree angle is tall and
  // narrow while a 120 degree angle is short and wide. Give them equal widths
  // and they come out 59mm and 17mm tall: the same three angles a child is
  // being asked to compare, drawn at wildly different sizes, with the sharpest
  // one made to look the biggest.
  //
  // So the default divides the width in proportion to each item's own shape,
  // which brings them all out the SAME HEIGHT and reads as one row of things
  // rather than a jumble.
  function sharesOf(content, count) {
    const items = itemsOf(content);
    let parts;

    if (Array.isArray(content.parts) && content.parts.length === count) {
      parts = content.parts;
    } else {
      parts = items.map(shapeRatio);
    }

    const total = parts.reduce((a, b) => a + b, 0);
    return total > 0
      ? parts.map((p) => p / total)
      : parts.map(() => 1 / count);
  }

  // An item's width-to-height ratio, asked in a way the height cap cannot
  // spoil.
  //
  // Every drawing caps its height so one picture cannot swallow a page. At any
  // given width a tall narrow drawing may ALREADY be at that cap, and then its
  // measured height stops telling you its shape: a 30 degree angle and a 90
  // degree one both come back "60mm", the sharp one looks square, and the row
  // hands it far too much width. It then came out 56mm tall beside two 20mm
  // ones, in a question asking a child to compare them.
  //
  // So: halve the width until the height starts tracking it again, which is
  // the point at which the cap has stopped biting and the ratio is real.
  function shapeRatio(item) {
    let widthMm = REFERENCE_WIDTH_MM;
    let heightMm = measureContent(item, widthMm);

    for (let i = 0; i < 10; i++) {
      const halved = measureContent(item, widthMm / 2);
      if (halved < heightMm * 0.6) break; // height responds to width: not capped
      widthMm /= 2;
      heightMm = halved;
    }

    return heightMm > 0 ? widthMm / heightMm : 1;
  }

  // Divide a row's width between its items.
  //
  // Every item gets its OWN minimum first, and only what is left over is
  // divided by shape. Dividing the whole width by shape looks equivalent and
  // is not: a sharp angle is narrow, so a shape-proportional share gave it
  // 30mm when it needs 45mm to be usable. The row as a whole passed the fit
  // check, because a row's minimum is the sum of its parts and the sum was
  // satisfied, so nothing anywhere objected to one of the three angles being
  // below its own floor.
  function widthsIn(content, items, widthMm) {
    const gutters = GAP_MM * Math.max(0, items.length - 1);
    const usable = Math.max(0, widthMm - gutters);

    // Parts STATED are parts meant. Each item gets exactly its share and
    // nothing else, so the same parts on several rows put their edges in the
    // same place down the page.
    //
    // This matters more than it sounds. Three questions on a maths sheet each
    // had a drawing on the left and its question on the right, and the
    // question column came out a different width in every one, because each
    // row was allocated on its own: the sheet read as three unrelated blocks
    // rather than a column of questions. Anything a stated split would starve
    // is refused by the fit check, so exactness is safe here.
    if (Array.isArray(content.parts) && content.parts.length === items.length) {
      const shares = sharesOf(content, items.length);
      return shares.map((s) => s * usable);
    }

    const floors = items.map((item) => needsContent(item).minWidthMm);
    const floorTotal = floors.reduce((a, b) => a + b, 0);

    // Not enough room even for the floors. The fit check refuses this case, so
    // reaching here means something asked for a layout without checking first:
    // fall back to shares of what there is rather than inventing width.
    //
    // Strictly GREATER than, because floors that add up to exactly the width
    // available fit exactly. Written as ">=" this took the give-up branch for
    // the commonest case of all, a drawing beside its questions where the two
    // floors happen to fill the row, and divided the width by shape instead:
    // a grid map needing 110mm was handed 28mm.
    if (floorTotal > usable) {
      const shares = sharesOf(content, items.length);
      return shares.map((s) => s * usable);
    }

    const spare = usable - floorTotal;
    const shares = sharesOf(content, items.length);
    return floors.map((floor, i) => floor + shares[i] * spare);
  }

  // A question number belongs to the QUESTION, and a question is a zone's
  // content: one helper, or a stack of a picture and a prompt and somewhere to
  // write. So it is numbered here rather than in each helper.
  //
  // It was in the helpers, and three of sixty-five could do it. The other
  // sixty-two needed "(1)" typed into their text by hand, so a sheet mixing the
  // two printed a rendered number beside a typed one - different colour,
  // different weight, one bracketed and one not. Numbering every helper
  // separately would have been sixty-two chances to do it differently again.
  //
  // A helper holding a SET of questions numbers its own items instead, with
  // `startAt` continuing the count. Setting both is refused rather than
  // silently printing two numbers.
  function renderContent(content, widthMm = REFERENCE_WIDTH_MM) {
    content = normaliseContent(content);
    const items = itemsOf(content);

    if (content && content.number !== undefined) {
      // A set of questions numbers its own items, so a number on the whole set
      // would print a second number beside the first.
      if (content.startAt !== undefined) {
        throw new Error(
          "NUMBERING_CONFLICT: this content has both a number and a startAt. " +
            "Use number for one question, or startAt for a set that numbers its " +
            "own items, and never both."
        );
      }
      const { number, ...rest } = content;
      return `
        <div class="h-numbered">
          <span class="h-numbered-n">${esc(formatQuestionLabel(number))}</span>
          <div class="h-numbered-body">${renderContent(rest, widthMm - NUMBER_GUTTER_MM)}</div>
        </div>`;
    }

    if (isRow(content)) {
      const shares = sharesOf(content, items.length);
      const renderWidths = widthsIn(content, items, widthMm);

      // Each item STARTS at its own minimum width and grows by its share of
      // whatever is spare. That is exactly what widthsIn works out, and it has
      // to be, because one is what the page is measured by and the other is
      // what the page actually does.
      //
      // They disagreed. Rendering used the shape shares alone, with no floor,
      // so on a real sheet a bar chart beside its questions took nearly all
      // the width and the questions were squeezed to nothing: three questions
      // vanished off a maths worksheet that the measurement said fitted at
      // 96%. Flex says the same thing in its own terms: grow by the share,
      // never start below the floor.
      // Stated parts are exact, so the item is given the share and no floor to
      // start from. Left to the default, it starts at its own minimum and
      // grows by its share, which is what widthsIn works out.
      const exact = Array.isArray(content.parts) && content.parts.length === items.length;

      const cells = items
        .map((item, i) => {
          const basis = exact ? "0" : `${needsContent(item).minWidthMm}mm`;
          return `
        <div class="h-row-item" style="flex: ${shares[i]} 1 ${basis};">
          ${content.letters ? `<div class="h-row-letter">(${String.fromCharCode(97 + i)})</div>` : ""}
          <div class="h-row-body">${renderContent(item, renderWidths[i])}</div>
        </div>`;
        })
        .join("");
      return `<div class="h-row${content.comparisonPairStyle ? " h-comparison-pair" : ""}">${cells}</div>`;
    }

    if (isStack(content)) {
      // Who takes the spare when the stack has more height than its parts
      // asked for. Normally every part that can use height shares it. But a
      // part whose content IS the space (a box to draw in) has no ceiling,
      // where writing lines beside it do - so when the stack holds both, the
      // room goes to the one that keeps gaining and the lines stay the size
      // the question asked for.
      //
      // Shared equally, a sheet with a question above a drawing box printed
      // half the leftover as a hole under the question's two ruled lines and
      // gave the box half the space it should have had.
      const growing = growersIn(items);
      const cells = items
        .map((item, i) => {
          const grows = growing[i];
          const gap = gapAboveMm(items, i);
          const space = gap ? ` style="margin-top:${gap}mm"` : "";
          return `<div class="h-stack-item${grows ? " h-stack-item--grows" : ""}"${space}>${renderContent(item, widthMm)}</div>`;
        })
        .join("");
      return `<div class="h-stack">${cells}</div>`;
    }

    return render(content, widthMm);
  }

  function measureContent(content, widthMm) {
    content = normaliseContent(content);
    const items = itemsOf(content);

    // The number sits in a gutter beside the content, so it costs width and
    // never height. Measured off the same constant the CSS uses.
    if (content && content.number !== undefined) {
      const { number, ...rest } = content;
      return measureContent(rest, widthMm - NUMBER_GUTTER_MM);
    }

    if (isRow(content)) {
      // Side by side, so the row is as tall as its tallest item, each measured
      // at the width it will actually get.
      const widths = widthsIn(content, items, widthMm);
      const letterMm = content.letters ? 6 : 0;
      return (
        Math.max(...items.map((item, i) => measureContent(item, widths[i]))) +
        letterMm
      );
    }

    if (isStack(content)) {
      // One above another, so heights add, with a gap between each.
      return (
        items.reduce((sum, item) => sum + measureContent(item, widthMm), 0) +
        stackGapsMm(items)
      );
    }

    return measure(content, widthMm);
  }

  function needsContent(content, widthMm) {
    content = normaliseContent(content);
    const items = itemsOf(content);

    // The gutter is width the content does not get, so it is added to what the
    // content asks for. Left out, a numbered question is approved against a
    // zone 9mm wider than it will actually have.
    if (content && content.number !== undefined) {
      const { number, ...rest } = content;
      const need = needsContent(rest,
        Number.isFinite(widthMm) ? widthMm - NUMBER_GUTTER_MM : undefined);
      return { ...need, minWidthMm: need.minWidthMm + NUMBER_GUTTER_MM };
    }

    if (isRow(content)) {
      const widths = Number.isFinite(widthMm) ? widthsIn(content, items, widthMm) : null;
      const ns = items.map((item, i) => needsContent(item, widths ? widths[i] : undefined));
      return {
        minWidthMm:
          ns.reduce((s, n) => s + n.minWidthMm, 0) +
          GAP_MM * Math.max(0, ns.length - 1),
        minHeightMm: Math.max(...ns.map((n) => n.minHeightMm)) + (content.letters ? 6 : 0),
      };
    }

    if (isStack(content)) {
      const ns = items.map(item => needsContent(item, widthMm));
      return {
        minWidthMm: Math.max(...ns.map((n) => n.minWidthMm)),
        minHeightMm:
          ns.reduce((s, n) => s + n.minHeightMm, 0) + stackGapsMm(items),
      };
    }

    return needs(content, widthMm);
  }

  // A group can use spare height if ANY of its parts can. Taking the largest
  // appetite rather than adding them up keeps a group from out-competing a
  // single helper in another zone just for having more parts in it.
  function greedContent(content) {
    content = normaliseContent(content);
    const items = itemsOf(content);
    if (!items.length) return greed(content.helper);
    return Math.max(...items.map(greedContent));
  }

  // A group has no ceiling if any part of it has none: the room can go to that
  // part and stop at the others.
  function fillsContent(content) {
    content = normaliseContent(content);
    const items = itemsOf(content);
    if (!items.length) return fills(content.helper);
    return items.some(fillsContent);
  }

  // Which parts of a stack the browser will actually hand the leftover to.
  // Worked out once here so `renderContent`, `enoughContent` and
  // `inspectContent` cannot disagree about it - they did, and a report
  // describing a page nobody printed is worse than no report.
  function growersIn(items) {
    const someFill = items.some((item) => fillsContent(item));
    return items.map((item) =>
      someFill ? fillsContent(item) : greedContent(item) > 0
    );
  }

  // The height past which this content stops gaining.
  //
  // The same three rules the minimums compose by, applied to the other end of
  // the range: a row is as tall as its tallest part, a stack is the sum of its
  // parts. The one thing a stack does differently is that a part which will not
  // GROW contributes only its natural height - it is never going to take any of
  // the leftover, so counting its unused allowance would hand that allowance to
  // whichever sibling does grow. That is the leak that let a drawing box beside
  // one instruction line take the instruction's spare room as well as its own.
  function enoughContent(content, widthMm) {
    content = normaliseContent(content);
    if (!enough) return Infinity;
    const items = itemsOf(content);

    if (content && content.number !== undefined) {
      const { number, ...rest } = content;
      return enoughContent(rest, widthMm - NUMBER_GUTTER_MM);
    }

    if (isRow(content)) {
      const widths = widthsIn(content, items, widthMm);
      const letterMm = content.letters ? 6 : 0;
      return (
        Math.max(...items.map((item, i) => enoughContent(item, widths[i]))) +
        letterMm
      );
    }

    if (isStack(content)) {
      const growing = growersIn(items);
      return (
        items.reduce(
          (sum, item, i) =>
            sum +
            (growing[i]
              ? enoughContent(item, widthMm)
              : measureContent(item, widthMm)),
          0
        ) + stackGapsMm(items)
      );
    }

    return enough(content, widthMm);
  }

  // What to call this in an error message. Nested groups are bracketed, and
  // repeats are counted rather than listed: "a row of 4 angles" reads, where
  // "angle, angle, angle, angle" does not, and a refusal nobody can read is
  // barely better than no refusal.
  function describeContent(content) {
    if (isComparisonPair(content)) return "a comparison pair";
    content = normaliseContent(content);
    const items = itemsOf(content);

    if (isRow(content) || isStack(content)) {
      const kind = isRow(content) ? "row" : "stack";
      const inner = items.map(describeContent);
      const allSame = inner.every((d) => d === inner[0]);
      const body = allSame ? `${items.length} x ${inner[0]}` : inner.join(" + ");
      return `a ${kind} of [${body}]`;
    }

    return content.helper;
  }

  // Does this fit NICELY, not just legally?
  //
  // "It fits" only means nothing was refused and nothing was clipped. Both can
  // be true of a page nobody would hand to a child: a diagram squeezed to
  // exactly its smallest usable size while the writing lines beside it have
  // room to spare is a legal page and a bad one.
  //
  // What can be checked is HEADROOM: how much bigger than its own floor each
  // part actually came out. A part sitting at 1.0 is at the edge of usable. A
  // part at 1.0 with a sibling at 3.0 is worse, because the room existed and
  // went somewhere that needed it less.
  //
  // This is a report, not a refusal. Where the line sits between "snug" and
  // "too tight" is a teacher's judgement, and it should come from real sheets
  // rather than a number picked here.
  function inspectContent(content, widthMm, heightMm, label = "") {
    content = normaliseContent(content);
    const items = itemsOf(content);
    const need = needsContent(content);

    // Height is judged against what this content NATURALLY wants at the width
    // it actually got, not against its stated minimum height. The stated
    // minimum is worked out at the minimum WIDTH, and text given three times
    // that width wraps to a third of the lines, so comparing the two says
    // nothing: one short question came out "half its minimum height" while
    // being perfectly comfortable.
    const naturalHeightMm = measureContent(content, widthMm);

    const self = {
      label: label || describeContent(content),
      gotWidthMm: widthMm,
      gotHeightMm: heightMm,
      needWidthMm: need.minWidthMm,
      needHeightMm: naturalHeightMm,
      widthHeadroom: need.minWidthMm > 0 ? widthMm / need.minWidthMm : Infinity,
      heightHeadroom: naturalHeightMm > 0 ? heightMm / naturalHeightMm : Infinity,
      // How much spare height this content can actually USE. A writing frame
      // turns spare room into longer answer lines; a chart or a set of
      // questions gains nothing and simply leaves the room blank. Carried here
      // so the tightness report can tell dead space apart from workspace
      // without knowing what any individual helper is.
      greed: greedContent(content),
      // The height past which this content stops gaining. `greed` says spare
      // room CAN be used here; this says how much of it. Without the pair, a
      // report cannot tell a writing frame that used its room from a number
      // cell that was simply handed the rest of the page.
      usefulHeightMm: enoughContent(content, widthMm),
      // Whether room past that useful size is still work rather than waste.
      // A surface a child draws on is the one thing a short column's leftover
      // can honestly become; see fillShortColumns in render.js.
      fills: fillsContent(content),
      // Whether the height was IMPOSED or CHOSEN. In a row every item is handed
      // the row's height, so a short item beside a tall one comes out with
      // blank space under it that nobody asked for. In a stack each item takes
      // its own natural height, so there is nothing to report.
      heightImposed: false,
      parts: [],
    };

    if (isRow(content)) {
      const widths = widthsIn(content, items, widthMm);
      self.parts = items.map((item, i) => {
        // Side by side: each gets its share of the width and the row's height.
        const part = inspectContent(item, widths[i], heightMm);
        part.heightImposed = true;
        return part;
      });
    } else if (isStack(content)) {
      // One above another, each at the full width. Height is NOT simply natural
      // any more, and the report was wrong for as long as it assumed so: a
      // stack item marked as growing is given "flex: 1 1 auto", so the browser
      // shares whatever the stack has left over equally between those items on
      // top of their natural heights. A Year 4 Greater Depth sheet's answer
      // blocks were drawn at 73mm each and reported at 33mm, which is a report
      // describing a page nobody printed - the same fault the zone heights
      // above were repaired for, one level down.
      //
      // The share is worked out exactly as renderContent decides it, so the two
      // cannot drift apart: fill items take it when any exists, greedy items
      // otherwise, and equal flex-grow means equal shares.
      const naturals = items.map((item) => measureContent(item, widthMm));
      const growing = growersIn(items);
      const growers = growing.filter(Boolean).length;
      const gaps = stackGapsMm(items);
      const leftover = heightMm - naturals.reduce((a, b) => a + b, 0) - gaps;
      const share = growers > 0 && leftover > 0 ? leftover / growers : 0;

      self.parts = items.map((item, i) => {
        const part = inspectContent(item, widthMm, naturals[i] + (growing[i] ? share : 0));
        // A grown item did not choose its height; the stack handed it one, the
        // same way a row hands its items the row's height.
        if (growing[i] && share > 0) part.heightImposed = true;
        return part;
      });
    }

    return self;
  }

  return {
    renderContent,
    measureContent,
    needsContent,
    greedContent,
    fillsContent,
    enoughContent,
    describeContent,
    inspectContent,
  };
}

const css = `
  /* A question's number, in the gutter beside it.
     Bold, black and bracketed, and the same wherever a number appears on the
     sheet. It sits in a fixed gutter rather than flowing with the text so that
     question 10 starts where question 1 started: numbering that shifts left
     part way down a page reads as two sheets stapled together. */
  /* The BODY stretches to the zone; only the NUMBER is pinned to the top.
     Both were pinned, and it meant numbering a question changed its layout: a
     sorting grid or a recording table given a whole side of the page filled it
     while the content was unnumbered, then collapsed to the height of its own
     heading the moment the same content became question 3, leaving the rest of
     the side blank. Every other link in the chain already passes the zone's
     real height down - the zone is drawn at a stated height, the stack and the
     greedy helpers are told to fill it - and this was the one that handed down
     "as tall as your text" instead. A helper that claims spare height should
     get it wherever it sits, and a numbered question is still a question. */
  .h-numbered { display: flex; align-items: stretch; height: 100%; gap: ${NUMBER_GAP_MM}mm; }
  /* The label is a MARKER, not furniture. It used to be set in a tinted chip
     with a heavy navy rule down its left edge, which made the loudest mark in
     the question the part that only says where you are. Blue because that is
     already what "this is the question" means on this sheet, and nothing else:
     no fill, no rule, no chip. The question itself stays black, so the two are
     told apart by colour rather than by a box. */
  .h-numbered-n {
    flex: 0 0 ${NUMBER_LABEL_MM}mm;
    font-size: var(--type-questionNumber); font-weight: bold;
    color: var(--colour-question); line-height: 1.35;
    text-align: left;
    box-sizing: border-box;
    /* Beside the question's FIRST line, never centred down its side. */
    align-self: flex-start;
  }
  .h-numbered-body { flex: 1; min-width: 0; min-height: 0; }

  /* Side by side. Each item takes its share of the width and the row is as
     tall as its tallest, which is exactly what the measurement assumes. */
  .h-row { display: flex; align-items: stretch; gap: ${GAP_MM}mm; width: 100%; height: 100%; }
  .h-row-item { display: flex; flex-direction: column; min-width: 0; }
  .h-row-body { flex: 1; min-height: 0; }
  .h-comparison-pair {
    box-sizing: border-box;
    border: var(--rule-line) solid var(--colour-ink);
    border-top: var(--rule-heavy) solid var(--colour-question);
    border-radius: 2mm;
    background: var(--colour-surface);
  }
  .h-comparison-pair > .h-row-item {
    justify-content: center;
    background: var(--colour-paper);
    border: var(--rule-hair) solid var(--colour-rule);
    border-radius: 1.5mm;
    box-sizing: border-box;
  }
  .h-row-letter {
    text-align: center; font-size: var(--type-note);
    color: var(--colour-quiet); margin-bottom: 1mm; flex: none;
  }

  /* One above another. An item that can use spare height takes it; the rest
     keep their natural size, so the leftover does not spread itself evenly
     over things that gain nothing from it. */
  /* No gap here: each item carries its own top margin, because the join under
     a heading is tighter than the join between two questions. */
  .h-stack { display: flex; flex-direction: column; width: 100%; height: 100%; }
  .h-stack-item { flex: none; min-height: 0; }
  /* Share spare height without throwing away the natural height that the fit
     pass already proved each child can use. flex: 1 means 1 1 0%: two
     growing helpers start equal even when one asked for five writing lines and
     the other asked for two, so the longer one is clipped while the fit report
     still says the stack is sound. Keep each measured basis, then distribute
     only what is genuinely spare. */
  .h-stack-item--grows { flex: 1 1 auto; }
`;

module.exports = { makeCompose, css, GAP_MM, isRow, isStack, isComparisonPair, itemsOf };
