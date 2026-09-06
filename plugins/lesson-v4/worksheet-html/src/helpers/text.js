"use strict";

// Helpers made of words: questions to answer, lines to write on, a passage to
// read. Nothing here is subject-specific. A source is a history source, a
// science explanation or an RE text depending only on what is put in it.

const { LINE_MM, NOTE_LINE_MM, WRITING_LINE_MM, WRITING_LINE_GROWN_RATIO, PT_MM, BLANK_MM, esc, promptHtml, linesFor } = require("./shared");
const { SPACE, TYPE } = require("../tokens");
const { formatQuestionLabel } = require("../labels");

// ─── quiet instruction ──────────────────────────────────────────────────
// A child-facing instruction that belongs to a zone but not to another
// helper: "Use the chart to help you." It deliberately carries no answer
// space and no number. Before this existed designers used an empty questions
// helper, which rendered invalid list markup and made an instruction pretend
// to be a question.

function renderInstruction(spec) {
  return `<p class="h-instruction">${promptHtml(spec.text, spec.blankWidthMm)}</p>`;
}

function measureInstruction(spec, widthMm) {
  return linesFor(spec.text, widthMm, spec.blankWidthMm) * LINE_MM;
}

// ─── short questions ─────────────────────────────────────────────────────
// Read-off questions: a number, the question, and a short answer space on the
// same line. No writing lines, because the answer is a word or a number.
//
// `text` is the quiet instruction over the set: "Add these fractions." Sixteen
// other helpers already carry one and these two did not, which left the single
// commonest shape on a maths sheet - an instruction over a column of questions
// - with nowhere to put the instruction. It is optional: where the questions
// speak for themselves, a line saying so is one more thing to read.

const CONTEXT_PICTURE_MM = 5.5;
const CONTEXT_PICTURE_SLOT_MM = 7;

// A drawn or photographed context picture needs more ink than an emoji to be
// recognisable. At the emoji size a line drawing renders around the height of
// one body-text letter: on 30 August 2026 the Year 4 water-cycle sheet's
// wet-pavement drawing printed as "a tiny grey squiggle" at desk distance and
// the run stayed BLOCKED on it (WORKSHEETS-001), because no supported size
// existed to repair to. An emoji is a glyph and stays readable at text size;
// an image gets a taller slot, and the measurement below counts the extra
// height so the zone cannot clip.
const IMAGE_CONTEXT_PICTURE_MM = 11;
const IMAGE_CONTEXT_PICTURE_SLOT_MM = 14;

function pictureSlotMm(picture) {
  if (!picture) return 0;
  return picture.type === "image" ? IMAGE_CONTEXT_PICTURE_SLOT_MM : CONTEXT_PICTURE_SLOT_MM;
}

function pictureHeightMm(picture) {
  if (!picture) return 0;
  return picture.type === "image" ? IMAGE_CONTEXT_PICTURE_MM : CONTEXT_PICTURE_MM;
}

function questionText(item) {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    return String(item.text == null ? "" : item.text);
  }
  return String(item == null ? "" : item);
}

function pictureRequest(item) {
  return item && typeof item === "object" && !Array.isArray(item) && item.picture
    ? item.picture
    : null;
}

function fallbackEmoji(picture) {
  if (!picture) return "";
  if (picture.kind === "emoji" && picture.value != null) return String(picture.value);
  if (picture.fallbackEmoji != null) return String(picture.fallbackEmoji);
  return "";
}

// A picture beside a question earns its place only while it costs the words
// nothing. It is dropped the moment it would push the question onto another
// line, because a picture is a help and a wrapped question is a cost.
//
// Both widths are checked, not one. A row puts its answer blank beside the
// words or beneath them, and the words get a different width in each; measuring
// the picture against only one of them kept pictures that added a line in the
// other, which is the same fault as measuring anything else against a width it
// does not get. The decision cannot know which arrangement it will be in - the
// arrangement depends on whether the picture is there - so a picture stays only
// if it is free in BOTH.
function selectContextPictures(items, widths) {
  const textWidthMm = typeof widths === "number" ? widths : widths.inlineMm;
  const otherWidthMm = typeof widths === "number" ? widths : widths.belowMm;
  const requests = items.map(pictureRequest);
  if (!requests.some(Boolean)) return null;

  let selected;
  const anyImages = requests.some(
    (picture) => picture && typeof picture.imageHref === "string" && picture.imageHref
  );
  if (anyImages) {
    selected = requests.map((picture) => {
      if (!picture) return null;
      if (typeof picture.imageHref === "string" && picture.imageHref) {
        return {
          type: "image",
          href: picture.imageHref,
          alt: picture.alt || picture.context || picture.concept || "",
        };
      }
      if (picture.kind !== "emoji") return null;
      const value = fallbackEmoji(picture);
      return value ? { type: "emoji", value, alt: picture.alt || "" } : null;
    });
  } else {
    const emojis = requests.map(fallbackEmoji);
    selected = emojis.map((value, i) => value && requests[i]
      ? {
          type: "emoji",
          value,
          alt: requests[i].alt || requests[i].context || requests[i].concept || "",
        }
      : null);
  }

  const costsALine = (text, roomMm, slotMm) =>
    linesFor(text, Math.max(10, roomMm - slotMm)) > linesFor(text, roomMm);

  selected = selected.map((picture, i) => {
    if (!picture) return null;
    const text = questionText(items[i]);
    const slotMm = pictureSlotMm(picture);
    return costsALine(text, textWidthMm, slotMm) || costsALine(text, otherWidthMm, slotMm)
      ? null
      : picture;
  });
  return selected.some(Boolean) ? selected : null;
}

function attr(value) {
  return esc(value).replace(/"/g, "&quot;");
}

function pictureMarkup(picture) {
  if (!picture) return "";
  if (picture.type === "image") {
    return `<span class="h-context-picture h-context-picture--image"><img src="${picture.href}" alt="${attr(picture.alt)}"></span>`;
  }
  return `<span class="h-context-picture h-context-picture--emoji" role="img" aria-label="${attr(picture.alt)}">${esc(picture.value)}</span>`;
}

// Where the short answer blank goes: beside the question, or under it.
//
// The blank used to be inline always, taking its 20mm out of the text's width
// whatever that did to the words. A prompt that would have sat on one line
// therefore wrapped onto two so the blank could keep its place, which is the
// wrong trade: the child reads the question first.
//
// So the blank stays inline while that costs nothing, and drops beneath only
// when keeping it inline would make the prompt wrap MORE than it otherwise
// would. Measurement below adds a row for exactly the same condition, because
// the estimate and the markup have to agree or the zone clips.
const SHORT_BLANK_MIN_MM = 20;

// The real width of the number column, which is `min-width` on `.h-num` and not
// the 5mm the arithmetic used to assume, and the real gap between one flex item
// and the next. Both are read straight off the CSS below, because a question
// row is a flex row and its height depends on where that flex row wraps.
//
// This is where the sheets were being lost. `.h-text` was `flex: 1 1 auto`, so
// a long question's own content width became the size the flex line tried to
// honour; in a narrow zone the line could not, and the browser put the number,
// the words and the answer blank on THREE separate lines. The arithmetic was
// still measuring one line, in a column 8mm wider than the words actually got.
// A single question came out 15mm taller than its estimate - about 57px, near
// ten times the 6px that cost a lesson its worksheets - and `overflow: hidden`
// on the zone quietly cut the difference off.
//
// `.h-text` is now `flex: 1 1 0` with `min-width: 0`, so it takes the room that
// is left and wraps its words INSIDE that room instead of pushing itself onto a
// line of its own. The row then has the shape the arithmetic below describes.
const QUESTION_NUMBER_COL_MM = 9;
const QUESTION_GAP_MM = SPACE.tight;

// What the words on a question row are actually given, in the two arrangements
// a row can take. Written once and used by the markup's own wrap decision, the
// measurement and the width the text is laid out in, because the moment those
// three disagree the zone clips.
function questionTextWidths(widthMm, picture, showNumbers) {
  const numberMm = showNumbers ? QUESTION_NUMBER_COL_MM + QUESTION_GAP_MM : 0;
  // `picture` is the selected picture object (its type sets its slot), or a
  // plain boolean where only presence at the emoji size is being asked about.
  const slotMm = picture === true ? CONTEXT_PICTURE_SLOT_MM : pictureSlotMm(picture || null);
  const pictureMm = slotMm ? slotMm + QUESTION_GAP_MM : 0;

  // The blank beneath the words: the words get the whole row bar the gutter.
  const belowMm = Math.max(10, widthMm - numberMm - pictureMm);
  // The blank beside the words: it takes its fixed width and its gap as well.
  const inlineMm = Math.max(10, belowMm - SHORT_BLANK_MIN_MM - QUESTION_GAP_MM);

  return { belowMm, inlineMm };
}

function blankBelow(question, widthMm, picture, showNumbers = true) {
  const { belowMm, inlineMm } = questionTextWidths(widthMm, picture, showNumbers);
  return linesFor(question, inlineMm) > linesFor(question, belowMm);
}

// A prompt short enough that its answer blank should sit beside the words
// rather than out at the edge of the row.
//
// The margin matters: a prompt measured at close to the full line would, once
// a real font is applied, sometimes need the room the blank is no longer
// leaving it and wrap to a second line the arithmetic did not count. Two
// thirds of the line keeps a clear gap between "this fits easily" and "this
// needs the whole row", so only prompts that are plainly short are moved.
const SHORT_PROMPT_SHARE = 0.66;

function promptIsShort(question, widthMm, picture, showNumbers = true) {
  const { inlineMm } = questionTextWidths(widthMm, picture, showNumbers);
  if (linesFor(question, inlineMm) > 1) return false;
  const charMm = 12 * PT_MM * 0.5; // body type, the width linesFor assumes
  return String(question).length * charMm <= inlineMm * SHORT_PROMPT_SHARE;
}

function renderQuestions(spec, widthMm = 100) {
  const showNumbers = spec.showNumbers !== false;
  const pictures = selectContextPictures(
    spec.items,
    questionTextWidths(widthMm, false, showNumbers)
  );
  const items = spec.items
    .map(
      (q, i) => `
      <li class="h-q${
        blankBelow(questionText(q), widthMm, pictures && pictures[i], showNumbers)
          ? " h-q--blank-below"
          : ""
      }${
        promptIsShort(questionText(q), widthMm, pictures && pictures[i], showNumbers)
          ? " h-q--short"
          : ""
      }">
        ${showNumbers ? `<span class="h-num">${esc(formatQuestionLabel(i + (spec.startAt || 1)))}</span>` : ""}
        ${pictureMarkup(pictures && pictures[i])}
        <span class="h-text">${promptHtml(questionText(q))}</span>
        <span class="h-blank"></span>
      </li>`
    )
    .join("");
  return `
    ${stem(spec)}
    <ol class="h-questions">${items}</ol>`;
}

function measureQuestions(spec, widthMm) {
  const showNumbers = spec.showNumbers !== false;
  const gapMm = SPACE.item; // margin-bottom on .h-q
  const pictures = selectContextPictures(
    spec.items,
    questionTextWidths(widthMm, false, showNumbers)
  );
  return (
    stemMm(spec, widthMm) +
    spec.items.reduce((h, q, i) => {
      const picture = pictures && pictures[i];
      const { belowMm, inlineMm } = questionTextWidths(widthMm, picture, showNumbers);
      // A blank that drops beneath the prompt is a flex line of its own, and
      // the prompt above it then gets the full width back. That second line
      // costs its own height AND the row gap above it - the gap was missed, so
      // every question with a dropped blank was measured 2mm short.
      const below = blankBelow(questionText(q), widthMm, picture, showNumbers);
      // An image picture is taller than a text line and stretches its flex
      // row; the row costs whichever is taller, words or picture.
      const textMm =
        linesFor(questionText(q), below ? belowMm : inlineMm) * LINE_MM;
      return (
        h +
        Math.max(textMm, pictureHeightMm(picture)) +
        (below ? QUESTION_GAP_MM + LINE_MM : 0) +
        gapMm
      );
    }, 0)
  );
}

// Shared by both, and written once, because the measurement and the markup
// have to agree to the millimetre or the last question is drawn outside the
// zone and clipped without a word.
function stem(spec) {
  return spec.text ? `<p class="h-q-stem">${promptHtml(spec.text)}</p>` : "";
}

function stemMm(spec, widthMm) {
  return spec.text ? linesFor(spec.text, widthMm) * LINE_MM + SPACE.tight : 0;
}

// ─── written answers ─────────────────────────────────────────────────────
// A question the child answers in their own words, with ruled lines under it.
// `lines` is capped rather than stretched: fifteen lines for one question does
// not read as spare room to a child, it reads as "write fifteen lines".

const MAX_WRITING_LINES = 6;

// A child's written sentence is about ten to twelve words, and in a
// primary-school hand that is roughly this much line, end to end. It is the
// number the designers were told to do arithmetic with by hand ("two lines in
// a half-width column, one at full width"), moved into the engine so the
// arithmetic is done against the width the zone actually has rather than the
// width a designer guessed at. 150 reproduces exactly that hand rule at the
// widths a real zone offers once its number gutter is off: one line per
// sentence across a full page (about 168mm usable), two per sentence in a
// half-width column (about 78mm).
const SENTENCE_RUN_MM = 150;

// The ruled lines an item gets, from either of the two ways of asking.
//
// `sentences` states the DEMAND - how many written things the prompt asks for
// ("explain two ways, then identify one more" is three) - and the engine
// turns that into lines at this zone's real width, so the same question gets
// two lines at full width and four in a half-width column without anyone
// re-counting. `lines` remains the exact count for when the designer wants a
// specific one. Both at once is a contradiction: one of them is wrong, and
// the engine cannot know which, so it refuses rather than guessing.
function writingLinesFor(q, widthMm) {
  if (q.sentences !== undefined && q.lines !== undefined) {
    throw new Error(
      "WRITTEN_ANSWERS_OVERSPECIFIED: an item gives sentences AND lines. " +
        "State the demand with sentences and let the engine size the lines, " +
        "or state an exact lines count - not both."
    );
  }
  if (q.sentences !== undefined) {
    const n = Number(q.sentences);
    if (!Number.isInteger(n) || n < 1) {
      throw new Error(
        `WRITTEN_ANSWERS_SENTENCES_INVALID: sentences must be a whole number ` +
          `of written things, 1 or more (got ${JSON.stringify(q.sentences)}).`
      );
    }
    return Math.min(
      MAX_WRITING_LINES,
      Math.ceil((n * SENTENCE_RUN_MM) / Math.max(40, widthMm))
    );
  }
  return Math.min(q.lines || 3, MAX_WRITING_LINES);
}

function renderWrittenAnswers(spec, widthMm = 100) {
  const showNumbers = spec.showNumbers !== false;
  const numberGutterMm = showNumbers ? 6 : 0;
  const phase = spec.phase === "upper" ? "upper" : "lower";
  const lineMm = WRITING_LINE_MM[phase];
  const pictures = selectContextPictures(spec.items, widthMm - numberGutterMm);

  const items = spec.items
    .map((q, i) => {
      const lines = writingLinesFor(q, widthMm - numberGutterMm);
      // The cap travels with the line because the base height is per phase: a
      // Year 2 line starts taller than a Year 5 one, so one shared ceiling
      // would mean two different things. See WRITING_LINE_GROWN_RATIO.
      const grownMm = (lineMm * WRITING_LINE_GROWN_RATIO).toFixed(2);
      const ruled = Array.from(
        { length: lines },
        () => `<span class="h-line" style="height:${lineMm}mm;max-height:${grownMm}mm"></span>`
      ).join("");
      return `
      <li class="h-q h-written">
        ${showNumbers ? `<span class="h-num">${esc(formatQuestionLabel(i + (spec.startAt || 1)))}</span>` : ""}
        <div class="h-body">
          <div class="h-written-prompt">
            ${pictureMarkup(pictures && pictures[i])}
            <span class="h-text">${esc(q.text)}</span>
          </div>
          <div class="h-lines">${ruled}</div>
        </div>
      </li>`;
    })
    .join("");
  // Its own class as well as the shared one: short questions and written
  // answers look alike but must behave in opposite ways when the page has room
  // left over. Written answers take it (more room to write is a real gain);
  // short questions must not, because stretching the gaps between them only
  // makes the sheet look padded.
  // Wrapped, because the list claims the full height of what it sits in so
  // that spare room goes into the writing lines. With an instruction line as
  // its SIBLING that came to the stem's height plus all of the zone, and the
  // bottom 7.7mm was cut off at every width. The wrapper is what they share.
  return `
    <div class="h-answers-block">
      ${stem(spec)}
      <ol class="h-questions h-answers">${items}</ol>
    </div>`;
}

function measureWrittenAnswers(spec, widthMm) {
  const showNumbers = spec.showNumbers !== false;
  const numberGutterMm = showNumbers ? 6 : 0;
  const phase = spec.phase === "upper" ? "upper" : "lower";
  const lineMm = WRITING_LINE_MM[phase];
  const gapMm = 4;
  const baseTextWidth = widthMm - numberGutterMm;
  const pictures = selectContextPictures(spec.items, baseTextWidth);
  return stemMm(spec, widthMm) + spec.items.reduce((h, q, i) => {
    const picture = pictures && pictures[i];
    const lines = writingLinesFor(q, baseTextWidth);
    const textWidth = baseTextWidth - pictureSlotMm(picture);
    // The prompt row is as tall as its tallest flex item: the wrapped words,
    // or an image picture at its readable size.
    const promptMm = Math.max(
      linesFor(q.text, textWidth) * LINE_MM,
      pictureHeightMm(picture)
    );
    return h + promptMm + lines * lineMm + gapMm;
  }, 0);
}

// ─── section label ───────────────────────────────────────────────────────
// The mode-of-work heading a block of a sheet sits under: Fluency, Problem
// Solving, Practise, Apply, Stretch.
//
// It marks the mode of work and never the topic. "Adding pence" and
// "Conjunctions practice" are topic labels: they say what a child already
// knows from the questions, and spend the one place on the page that could
// have said what KIND of thinking this block wants instead.
//
// The label a subject uses is its own. Maths says Fluency, Problem Solving and
// Going Deeper, because that is the language already on the board in a primary
// maths lesson; English, science and the rest say Practise, Apply and Stretch,
// because "Fluency" means maths to a nine-year-old and reads as a mistake
// anywhere else.
//
// It is a helper rather than a field on every other helper because it belongs
// to a BLOCK and not to an activity, and a block is often several helpers
// stacked. Put it at the top of a stack:
//
//   { stack: [ { helper: "section-label", text: "Fluency" }, { ... } ] }

function renderSectionLabel(spec) {
  return `<p class="h-section-label">${esc(spec.text)}</p>`;
}

function measureSectionLabel(spec, widthMm) {
  return linesFor(spec.text, widthMm) * SECTION_LINE_MM + SPACE.tight;
}

const SECTION_LINE_MM = TYPE.sectionLabel * PT_MM * 1.35;

function needsSectionLabel(spec) {
  return {
    // Wide enough for the label to sit on one line. A heading that wraps stops
    // reading as a heading, and these are one or two words by design.
    minWidthMm: Math.max(25, String(spec.text || "").length * SECTION_CHAR_MM),
    minHeightMm: SECTION_LINE_MM + SPACE.tight,
  };
}

// A character at section-label size, measured the way shared.js measures body
// text so there is one character-width constant in the engine rather than two.
const SECTION_CHAR_MM = TYPE.sectionLabel * PT_MM * 0.5;

// ─── source text ─────────────────────────────────────────────────────────
// A passage, account or extract the child reads and works from.

function renderSourceText(spec) {
  const paras = spec.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("");
  return `
    <div class="h-source">
      ${spec.heading ? `<h3>${esc(spec.heading)}</h3>` : ""}
      ${paras}
      ${spec.attribution ? `<p class="h-attr">${esc(spec.attribution)}</p>` : ""}
    </div>`;
}

function measureSourceText(spec, widthMm) {
  // Each part matches something in the CSS below, rather than being a guess
  // with a rounding-up allowance on the end. The old version carried a bare
  // "+ 6" that answered to nothing, and between that and an attribution
  // measured at body size when it prints at note size, this helper claimed
  // 13mm more than it used at every width. That 13mm became a hole under
  // every source on every sheet.
  const headingMm = spec.heading ? LINE_MM + 2 : 0; // h3, margin-bottom 2mm
  const attrMm = spec.attribution ? NOTE_LINE_MM : 0; // prints at note size
  const body = spec.paragraphs.reduce(
    (h, p) => h + linesFor(p, widthMm - 8) * LINE_MM + 2, // p, margin-bottom 2mm
    0
  );
  return headingMm + body + attrMm;
}

// A helper's look lives with its code, so adding one touches a single file.
const css = `
  /* The same quiet instruction line every other helper's stem uses, so a
     sheet carrying two of them does not print them two different ways. */
  .h-q-stem { margin: 0 0 var(--space-tight); line-height: 1.35; }
  .h-instruction {
    margin: 0;
    font-size: var(--type-body);
    line-height: 1.35;
  }
  /* A write-in blank inside prompt text, swapped in for a designer's run of
     underscores. One uniform width everywhere: wide enough for a real written
     word, and never hinting by its length at which word it wants. */
  .h-blank {
    display: inline-block;
    width: ${BLANK_MM}mm;
    height: 0.9em;
    border-bottom: var(--rule-hair) dotted var(--colour-rule);
    vertical-align: baseline;
  }
  /* The block's heading. Question blue, because it is part of what is being
     asked rather than something the child writes, and the same size and colour
     a fact file's title and a method frame's title already use. */
  .h-section-label {
    margin: 0 0 var(--space-tight);
    font-size: var(--type-sectionLabel);
    color: var(--colour-question);
    line-height: 1.35;
  }
  .h-questions { list-style: none; margin: 0; padding: 0; }
  .h-q {
    display: flex; align-items: baseline;
    /* Wrapping is what lets a blank drop beneath its prompt when keeping it
       inline would cost the question a line. Without a modifier class nothing
       wraps, so an ordinary question is unaffected. */
    flex-wrap: wrap;
    gap: var(--space-tight);
    margin-bottom: var(--space-item);
    font-size: var(--type-body);
    /* Pinned, and it must stay in step with LINE_MM in shared.js. Left
       unset, the browser uses Comic Sans's own default of about 1.5, every
       line comes out taller than the estimate, and the bottom of the zone is
       quietly clipped. */
    line-height: 1.35;
  }
  /* Bold, black and bracketed, and the same wherever a number appears. Blue
     numbers beside black bracketed ones on the same sheet read as two sheets
     stapled together, which is what a real lesson looked like: three helpers
     could print their own number and sixty-two had it typed in by hand. */
  .h-num {
    color: var(--colour-ink);
    font-weight: bold;
    font-size: var(--type-body);
    min-width: ${QUESTION_NUMBER_COL_MM}mm;
    /* A number never wraps onto a line of its own, and never shrinks below the
       column every other number on the sheet starts in. */
    flex: 0 0 auto;
  }
  /* "flex: 1 1 0" and not "1 1 auto", and the difference decides whether a
     worksheet prints. With "auto" the words' own content width is the size the
     flex line tries to honour, so a long question in a narrow zone pushed
     itself onto a second flex line and the answer blank onto a third - three
     lines where the arithmetic had measured one, and 15mm of the zone quietly
     cut off. With a zero basis the words take the room that is left and wrap
     inside it, which is the shape the measurement describes.

     "min-width: 0" is what lets them: a flex item will not shrink below its
     longest unbreakable word without it, and one long word would put the wrap
     back. */
  .h-text { flex: 1 1 0; min-width: 0; overflow-wrap: break-word; }

  /* A SHORT prompt lets its blank sit straight after the words.
     .h-text normally takes the whole row (flex 1 1 0) so a long prompt wraps
     inside the room it is given rather than pushing the number, the words and
     the blank onto three lines. The cost is that a three-word prompt ALSO
     filled the row, so "The job:" printed at the left margin with its answer
     line at the far right edge of the page and a child could not tell the line
     belonged to it. Only a prompt that comfortably fits one line gets sized to
     its own words, so the long-prompt behaviour that the measurement depends
     on is untouched. A short prompt is one line either way, so the height
     arithmetic does not move. */
  .h-q--short .h-text { flex: 0 1 auto; }
  .h-context-picture {
    flex: 0 0 ${CONTEXT_PICTURE_SLOT_MM}mm;
    width: ${CONTEXT_PICTURE_SLOT_MM}mm;
    height: ${CONTEXT_PICTURE_MM}mm;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
  }
  .h-context-picture img {
    display: block;
    max-width: ${CONTEXT_PICTURE_SLOT_MM}mm;
    max-height: ${CONTEXT_PICTURE_MM}mm;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  /* A drawn/photographed picture at a size a child can actually recognise.
     Emoji stay at text size above; see IMAGE_CONTEXT_PICTURE_MM. */
  .h-context-picture--image {
    flex: 0 0 ${IMAGE_CONTEXT_PICTURE_SLOT_MM}mm;
    width: ${IMAGE_CONTEXT_PICTURE_SLOT_MM}mm;
    height: ${IMAGE_CONTEXT_PICTURE_MM}mm;
  }
  .h-context-picture--image img {
    max-width: ${IMAGE_CONTEXT_PICTURE_SLOT_MM}mm;
    max-height: ${IMAGE_CONTEXT_PICTURE_MM}mm;
  }
  .h-context-picture--emoji {
    font-family: "Segoe UI Emoji", "Apple Color Emoji", sans-serif;
    font-size: 14pt;
    line-height: 1.35;
  }
  .h-written-prompt {
    display: flex;
    align-items: flex-start;
    gap: var(--space-tight);
  }
  /* A fixed length, pushed to the right-hand edge. Written as "flex: 1 0 18mm"
     the blank took whatever was left over after its own question, so every
     answer line on a sheet was a different length and started in a different
     place: three questions in a narrow column read as three ragged edges
     rather than a column to write down. */
  .h-blank {
    flex: 0 0 ${SHORT_BLANK_MIN_MM}mm;
    border-bottom: var(--rule-hair) dotted var(--colour-rule);
    margin-left: var(--space-tight);
    align-self: flex-end;
    height: 5mm;
  }
  /* The prompt was going to wrap anyway, so the blank takes its own row and
     the words above it get the full width back. It keeps the left-hand gutter
     so the writing line still starts where every other one does. */
  .h-q--blank-below .h-blank {
    flex-basis: calc(100% - 9mm);
    margin-left: 9mm;
  }

  .h-written { align-items: flex-start; }
  .h-body { flex: 1; }
  .h-lines { margin-top: var(--space-hair); }
  .h-line {
    display: block;
    border-bottom: var(--rule-hair) dotted var(--colour-rule);
  }

  /* Written answers claim spare height (greed 3). This is what makes that
     true. Without it the engine hands the zone extra height, the lines stay
     where they were, and the difference becomes a hole underneath: leftover
     pooling between two blocks instead of collecting at the foot of the page.
     The extra goes into the writing LINES, not the gaps between questions,
     because a taller line is more room to write and a wider gap is nothing.
     Growth is capped elsewhere at half again the natural height, so a line can
     get roomier but never turns into an invitation to write an essay. */
  .h-answers-block { height: 100%; display: flex; flex-direction: column; }
  .h-answers { flex: 1; display: flex; flex-direction: column; }
  .h-answers .h-written { flex: 1; }
  .h-answers .h-written:last-child { margin-bottom: 0; }
  .h-answers .h-body { display: flex; flex-direction: column; }
  .h-answers .h-lines { flex: 1; display: flex; flex-direction: column; }
  /* Grow, but start from the line height already set on the element. A plain
     "flex: 1" sets the starting height to zero, and inside a stack that had
     nothing spare to hand out the lines collapsed to their own border: two
     ruled lines came out as 0.3mm each, which is to say a child had nowhere
     to write and the sheet still looked finished. */
  /* A composed stack can be a few millimetres tighter in the browser than the
     arithmetic estimate because a question wraps one line earlier. Allow all
     ruled lines to yield that tiny discrepancy together; keeping shrink at
     zero clipped the final requested line completely. */
  .h-answers .h-line { flex: 1 1 auto; }
  /* The link that made none of the rule above true.
     .h-q aligns on the BASELINE so a question number sits on the first line of
     its text rather than floating at the top of a tall block, and that is right.
     But baseline alignment stops the body stretching, so the height the engine
     handed a written-answers block stopped at the body and never reached the
     ruled lines. Every claim above was accurate about intent and inert in fact:
     a Year 4 Greater Depth sheet printed three tight lines under each prompt
     with 45mm of blank paper below them, and the room report stayed silent
     because a greedy block is assumed to have used what it was given.
     Stretch the body and put the number back on the first line by hand: the
     number and the body's first line share a font size and a line height, so a
     number sitting at the top of a stretched box lands on the same baseline it
     did before. Scoped to written answers, so an ordinary question row - where
     baseline alignment is doing real work against inline blanks - is untouched.
     The cap is what keeps this from overcorrecting. Room a line cannot use is
     better left as paper than turned into a two-centimetre gap between rules
     that reads as a mistake; how many lines a question deserves is the
     designer's decision, made with the sentences field, not something to reach by
     stretching three of them. */
  .h-answers .h-written { align-items: stretch; }
  .h-answers .h-written > .h-num { align-self: flex-start; }

  .h-source {
    border-left: 1mm solid var(--colour-given);
    /* The gap between the quote bar and the words is spacing, not the inset of
       a box: there is no box here, only a stripe. Same 4mm it always was. */
    padding: 0 0 0 var(--space-item);
    font-size: var(--type-body);
  }
  /* Every line height here is pinned, and they must stay in step with LINE_MM
     and NOTE_LINE_MM in shared.js. Any one left unset falls back to Comic
     Sans's own default of about 1.5, runs taller than the estimate, and clips
     the bottom of the zone without anything looking wrong. */
  .h-source h3 {
    margin: 0 0 2mm; font-size: var(--type-body);
    color: var(--colour-question); line-height: 1.35;
  }
  .h-source p { margin: 0 0 2mm; line-height: 1.35; }
  .h-source .h-attr {
    font-size: var(--type-note); color: var(--colour-quiet);
    font-style: italic; line-height: 1.35; margin-bottom: 0;
  }
`;

// Text cannot be squeezed shorter than it is, so its minimum HEIGHT is simply
// how tall it comes out at its minimum width. A constant would be a guess in
// both directions at once: `questions` used to claim it needed 20mm whatever
// was in it, so one short question sat in a 10mm space and was reported as
// half its own stated minimum, while three long ones would have overflowed a
// zone the check had approved.
//
// This is the same move already made for widths, where a four-column table
// needs more room than a two-column one. A minimum states what THIS content
// needs, not what the helper needs on average.
// The height is measured at the WIDEST a zone could ever be, not the narrowest.
// Text gets shorter as it gets wider, so the widest case is the SHORTEST the
// content can possibly come out, which is what a minimum has to be: no zone
// shorter than this can hold it at any width. Measured at the narrowest width
// instead, it states the tallest case and refuses zones that would have been
// fine, which took the demo sheets from four building to two.
//
// A zone that is narrower AND too short is caught anyway, by the measurement
// that runs on the real width.
const WIDEST_ZONE_MM = 261; // the printable width of A4 landscape

function heightFromContent(measurer, minWidthMm) {
  return (spec) => ({
    minWidthMm,
    minHeightMm: measurer(spec, WIDEST_ZONE_MM),
  });
}

const helpers = {
  instruction: {
    render: renderInstruction,
    measure: measureInstruction,
    needs: heightFromContent(measureInstruction, 45),
    greed: 0,
  },
  questions: {
    requires: ["items"],
    render: renderQuestions,
    measure: measureQuestions,
    // Questions stay narrow-friendly: the text wraps, so width costs lines
    // rather than breaking the helper outright.
    needs: heightFromContent(measureQuestions, 60),
    greed: 0, // never stretch the gaps between questions
  },
  "written-answers": {
    requires: ["items"],
    render: renderWrittenAnswers,
    measure: measureWrittenAnswers,
    needs: heightFromContent(measureWrittenAnswers, 70),
    greed: 3, // writing space is the right home for spare room
  },
  "section-label": {
    render: renderSectionLabel,
    measure: measureSectionLabel,
    needs: needsSectionLabel,
    // A heading gains nothing at all from spare height. Growing it would put
    // white space between a block's name and the block, which reads as two
    // things rather than one.
    greed: 0,
  },
  "source-text": {
    render: renderSourceText,
    measure: measureSourceText,
    needs: heightFromContent(measureSourceText, 70),
    greed: 0, // a passage is as long as it is
  },
};

module.exports = { helpers, css };
