'use strict';

// Teach slide layouts: the designer names an arrangement and supplies the words
// and pictures; this file does the arranging.
//
// Why it exists. On 12 September 2026 the teacher asked for teaching that is not
// one black block and got a paragraph of guidance naming three good shapes. His
// own rebuilt decks looked right because an agent hand-composed every slide; the
// next deck the plugin made on its own (a Year 4 RE lesson, 13 September) put a
// picture on one half and a column of same-sized cards on the other on every
// Teach slide, because that is the cheapest thing to assemble from free zones
// and the easiest to get past the picture-size check. Guidance lost to effort.
//
// So the good arrangements are now as cheap as the lazy one: a Teach slide is
// `template: "teach-layout"` with a `layout` name, and the builder expands it
// into the existing templates and content objects before anything is validated
// or drawn. Every existing check still sees ordinary slides. What the expansion
// guarantees, and a designer could not reliably do by hand, is the teacher's
// standard from 13 September: text centred, sibling cards the same width and
// height with the same gaps, and cards that belong together sharing one text size.
//
// Nothing a designer supplies is ever dropped. A slot a layout does not use is an
// error that names the layouts which do use it, never a silent omission.

const QUESTION_BLUE = '0070C0';
const TEACH_ORANGE = 'E46C0A';
const STAR = '✨ ';

class TeachLayoutError extends Error {
  constructor(message) {
    super(message);
    this.code = 'TEACH_LAYOUT_INVALID';
  }
}

const SLOT_KEYS = [
  'lead', 'lines', 'question', 'sticky', 'pictures', 'captions', 'sides',
  'headingRole', 'speakers', 'statement', 'steps', 'columns', 'answers', 'extract'
];

// Keys that belong to the whole slide and pass straight through to the expanded one.
const PASS_THROUGH = [
  'title', 'headerStyle', 'instruction', 'designUnitId', 'designUnitIds',
  'speakerNotes', 'decorations', 'representationRefs', 'successCriteriaRefs',
  'stickyKnowledgeRefs', 'photoRefs',
  // Passed through so build.js can name the `speakerNotes` rename itself.
  'notes'
];

// Uniformity is the builder's job on these slides, so the knobs that would undo
// it are refused rather than quietly overridden.
const OWNED_TEXT_KEYS = ['align', 'fontSize', 'heightMode', 'widthMode', 'placement',
  'weight', 'color', 'colour', 'colorRole', 'sizeGroup'];

const CONTAINER_TYPES = new Set(['text', 'stack', 'row', 'bullets', 'steps']);

function fail(where, message) {
  throw new TeachLayoutError(`${where}: ${message}`);
}

// ─── slot readers ──────────────────────────────────────────────

function textSlot(value, where, role) {
  let item;
  if (typeof value === 'string') {
    item = { value };
  } else if (value && typeof value === 'object' && !Array.isArray(value)) {
    const owned = OWNED_TEXT_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(value, k));
    if (owned.length) {
      fail(where, `${owned.join(', ')} cannot be set on a teach-layout line; the layout ` +
        'sets size, alignment and colour so every slide stays centred and even. Use ' +
        '"orange": true to lift the one line that carries the weight.');
    }
    const words = value.value != null ? value.value : value.text;
    item = { value: words };
    if (value.emphasis !== undefined) item.emphasis = value.emphasis;
    if (value.picture !== undefined) item.picture = value.picture;
    if (value.orange === true) item.orange = true;
  } else {
    fail(where, 'expected the words as a string, or an object with a "value".');
  }
  if (typeof item.value !== 'string' || !item.value.trim()) {
    fail(where, 'this line is empty.');
  }
  if (item.orange && (role === 'question' || role === 'sticky')) {
    fail(where, `a ${role === 'question' ? 'question stays blue' : 'line to remember stays purple'}; ` +
      'orange belongs on one explanation line.');
  }
  if (item.orange && Array.isArray(item.emphasis) &&
      item.emphasis.some((e) => e && e.role === 'vocabulary')) {
    fail(where, 'orange cannot go on a line carrying a taught word in vocabulary green; ' +
      'the two colours fight. Put the orange on another line.');
  }
  return item;
}

function toText(slot, role, extra) {
  const out = { type: 'text', value: slot.value, align: 'center' };
  if (role === 'sticky' && !/^\s*✨/.test(out.value)) out.value = STAR + out.value;
  if (slot.emphasis !== undefined) out.emphasis = slot.emphasis;
  if (slot.picture !== undefined) out.picture = slot.picture;
  if (role === 'question') out.color = QUESTION_BLUE;
  else if (slot.orange) out.color = TEACH_ORANGE;
  return Object.assign(out, extra || {});
}

function pictureSlot(value, where) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      typeof value.type !== 'string') {
    fail(where, 'expected a picture: an image, a labelled diagram or another drawn visual, ' +
      'written as its usual content object with a "type".');
  }
  if (CONTAINER_TYPES.has(value.type)) {
    fail(where, `"${value.type}" is words, not a picture; words go in lines, lead, question or sticky.`);
  }
  return value;
}

function listSlot(data, key, where, reader) {
  const value = data[key];
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail(where, `"${key}" must be a list.`);
  return value.map((item, i) => reader(item, `${where} ${key}[${i}]`));
}

// ─── building blocks that carry the standard ──────────────────────

function card(item, group, extra) {
  return Object.assign(item, { heightMode: 'fill', sizeGroup: group }, extra || {});
}

// A column of equal cards: equal slices, one text size, centred on its neighbour.
function column(items, group, ratio) {
  const stack = {
    type: 'stack',
    verticalAlign: 'center',
    items: items.map((item) => card(item, group, { weight: 1 }))
  };
  if (ratio) stack.heightRatio = ratio;
  return stack;
}

// A row of equal cards: one height, one text size.
function cardRow(items, group) {
  return {
    type: 'row',
    equaliseTextCards: true,
    items: items.map((item) => Object.assign(item, { sizeGroup: group }))
  };
}

// The single line along the bottom of a slide starts large enough to read as a
// deliberate band rather than a footnote; the fit pass brings it down if it must.
const BAR = { fontSize: 32 };

function bar(s) {
  return s.sticky ? toText(s.sticky, 'sticky', BAR) : toText(s.lead, 'lead', BAR);
}

function withWeight(visual, weight) {
  return Object.assign({}, visual, { weight });
}

// ─── the catalogue ────────────────────────────────────────────

// Each entry says which slots it takes, how many, and how to arrange them.
// `n` ranges are [min, max]; a slot not named is not accepted by that layout.
const LAYOUTS = {
  // ── with pictures ──
  'lead-picture-lines': {
    use: 'The big idea across the top, one picture below it, the explanation beside the picture.',
    slots: { lead: 1, pictures: [1, 1], lines: [1, 3], question: [0, 1], sticky: [0, 1] },
    column: [1, 4],
    build: (s) => ({
      template: 'split-v-80-20', primarySide: 'bottom',
      secondary: toText(s.lead, 'lead'),
      primary: { type: 'row', items: [s.pictures[0], column(s.columnItems, 'column', 0.9)] }
    })
  },
  'picture-top-cards': {
    use: 'A wide picture across the top, two or three equal cards in a row underneath.',
    slots: { pictures: [1, 1], lines: [2, 3] },
    build: (s) => ({
      template: 'split-v-60-40', primarySide: 'top',
      primary: s.pictures[0],
      secondary: cardRow(s.lines.map((l) => toText(l, 'line')), 'cards')
    })
  },
  'two-pictures-captions': {
    use: 'Two pictures compared, each line directly under its own picture, one idea joining them along the bottom.',
    slots: { pictures: [2, 2], captions: [2, 2], sticky: [0, 1], lead: [0, 1] },
    oneOf: ['sticky', 'lead'],
    build: (s) => ({
      template: 'split-v-80-20', primarySide: 'top',
      primary: {
        type: 'row',
        items: s.pictures.map((picture, i) => ({
          type: 'stack',
          items: [withWeight(picture, 3),
            card(toText(s.captions[i], 'line'), 'captions', { weight: 1 })]
        }))
      },
      secondary: bar(s)
    })
  },
  'question-lines-picture': {
    use: 'The question in a band across the top, then the explanation beside the picture that answers it.',
    slots: { question: 1, pictures: [1, 1], lines: [1, 3], sticky: [0, 1] },
    column: [1, 4],
    columnSkipsQuestion: true,
    build: (s) => ({
      template: 'split-v-80-20', primarySide: 'bottom',
      secondary: toText(s.question, 'question'),
      primary: { type: 'row', items: [column(s.columnItems, 'column', 0.9), s.pictures[0]] }
    })
  },
  'compare-pictures': {
    use: 'Two things, or a wrong idea and the truth, in two matching cards, each with its own picture and line.',
    slots: { sides: 2, headingRole: [0, 1] },
    sideNeedsPicture: true,
    build: (s) => Object.assign({
      template: 'teach-compare',
      leftHeading: s.sides[0].heading, rightHeading: s.sides[1].heading,
      leftContent: compareSide(s.sides[0], true),
      rightContent: compareSide(s.sides[1], true)
    }, s.headingRole ? { headingRole: s.headingRole } : {})
  },
  'picture-statement-question': {
    use: 'Half the slide is the picture; the other half is one big statement with a smaller question under it.',
    slots: { pictures: [1, 1], lead: 1, question: 1 },
    build: (s) => ({
      template: 'split-h-50-50', primarySide: 'left',
      primary: s.pictures[0],
      secondary: {
        type: 'stack',
        items: [
          card(toText(s.lead, 'lead'), 'statement', { weight: 2, fontSize: 40 }),
          card(toText(s.question, 'question'), 'question', { weight: 1 })
        ]
      }
    })
  },
  'picture-three-cards': {
    use: 'A two by two grid of equal squares: the picture in one, one idea in each of the other three.',
    slots: { pictures: [1, 1], lines: [1, 3], question: [0, 1], sticky: [0, 1] },
    column: [3, 3],
    build: (s) => ({
      template: 'grid-4',
      cells: [s.pictures[0]].concat(s.columnItems.map((item) => card(item, 'cells', { fontSize: 32 })))
    })
  },
  'three-pictures-captions': {
    use: 'One idea shown three ways, or three parts: three pictures in a row, each line directly under its picture.',
    slots: { pictures: [3, 3], captions: [3, 3] },
    build: (s) => ({
      template: 'split-v-60-40', primarySide: 'top',
      primary: { type: 'row', items: s.pictures },
      secondary: cardRow(s.captions.map((c) => toText(c, 'line')), 'captions')
    })
  },
  'zigzag': {
    use: 'Two steps or a before and after: picture then words on the top row, words then picture on the bottom row.',
    slots: { pictures: [2, 2], lines: [2, 2] },
    build: (s) => ({
      template: 'split-v-50-50', primarySide: 'top',
      primary: { type: 'row', items: [s.pictures[0],
        card(toText(s.lines[0], 'line'), 'zigzag', { fontSize: 32 })] },
      secondary: { type: 'row', items: [
        card(toText(s.lines[1], 'line'), 'zigzag', { fontSize: 32 }), s.pictures[1]] }
    })
  },
  'big-fact-picture': {
    use: 'One big fact fills the top of the slide; the picture and the line to remember sit underneath.',
    slots: { lead: 1, pictures: [1, 1], sticky: 1 },
    build: (s) => ({
      template: 'split-v-60-40', primarySide: 'top',
      primary: card(toText(s.lead, 'lead'), 'fact', { fontSize: 54 }),
      secondary: { type: 'row', items: [s.pictures[0],
        card(toText(s.sticky, 'sticky'), 'fact-sticky', { fontSize: 30 })] }
    })
  },
  'labelled-picture-lines': {
    use: 'A picture with its parts labelled on it, and the explanation beside it in equal cards.',
    slots: { pictures: [1, 1], lines: [1, 3], question: [0, 1], sticky: [0, 1] },
    column: [2, 4],
    labelled: true,
    build: (s) => ({
      template: 'split-h-60-40', primarySide: 'left',
      primary: s.pictures[0],
      secondary: column(s.columnItems, 'column', 0.85)
    })
  },
  'question-picture-answer': {
    use: 'A big question on one half; the picture and the answer on the other.',
    slots: { question: 1, pictures: [1, 1], lines: [1, 1] },
    build: (s) => ({
      template: 'split-h-50-50', primarySide: 'left',
      primary: card(toText(s.question, 'question'), 'question', { fontSize: 40 }),
      secondary: {
        type: 'stack',
        items: [withWeight(s.pictures[0], 2.2), card(toText(s.lines[0], 'line'), 'answer', { weight: 1 })]
      }
    })
  },
  'banner-picture-sidebar': {
    use: 'A short banner, a big picture under it, and equal key-point cards down the side.',
    slots: { lead: 1, pictures: [1, 1], lines: [1, 3], question: [0, 1], sticky: [0, 1] },
    column: [2, 3],
    build: (s) => ({
      template: 'body-sidebar',
      banner: toText(s.lead, 'lead'),
      body: s.pictures[0],
      sidebar: column(s.columnItems, 'sidebar')
    })
  },
  'picture-steps': {
    use: 'The explanation as numbered steps beside the picture, for something that happens in order.',
    slots: { pictures: [1, 1], steps: [2, 5] },
    build: (s) => ({
      template: 'split-h-50-50', primarySide: 'right',
      primary: s.pictures[0],
      secondary: { type: 'steps', steps: s.steps }
    })
  },
  'picture-with-statement': {
    use: 'The picture takes most of the slide, with one statement along the bottom.',
    slots: { pictures: [1, 1], lead: 1 },
    build: (s) => ({
      template: 'split-v-80-20', primarySide: 'top',
      primary: s.pictures[0],
      secondary: toText(s.lead, 'lead')
    })
  },
  'one-speaker': {
    use: 'The object on one side and one person\'s claim on the other, for the class to test.',
    slots: { pictures: [1, 1], speakers: [1, 1] },
    build: (s) => ({ template: 'speech-bubbles-1', statement: s.pictures[0], speakers: s.speakers })
  },
  'two-speakers': {
    use: 'The idea across the top, two people underneath each saying what it means to them.',
    slots: { statement: 1, speakers: [2, 2] },
    build: (s) => ({ template: 'speech-bubbles-2', statement: toText(s.statement, 'lead'), speakers: s.speakers })
  },

  // ── without pictures ──
  'statement-support-sticky': {
    use: 'One big statement, a supporting line under it, and the line to remember along the bottom.',
    slots: { lead: 1, lines: [1, 1], sticky: 1 },
    build: (s) => ({
      template: 'split-v-70-30', primarySide: 'top',
      primary: {
        type: 'stack',
        items: [card(toText(s.lead, 'lead'), 'statement', { weight: 2, fontSize: 54 }),
          card(toText(s.lines[0], 'line'), 'support', { weight: 1 })]
      },
      secondary: toText(s.sticky, 'sticky', BAR)
    })
  },
  'two-cards-bar': {
    use: 'Two equal cards side by side, with the idea that joins them along the bottom.',
    slots: { lines: [2, 2], sticky: [0, 1], lead: [0, 1] },
    oneOf: ['sticky', 'lead'],
    build: (s) => ({
      template: 'split-v-70-30', primarySide: 'top',
      primary: cardRow(s.lines.map((l) => toText(l, 'line', { fontSize: 36 })), 'cards'),
      secondary: bar(s)
    })
  },
  'lead-three-cards': {
    use: 'A lead line across the top, three equal cards in a row underneath.',
    slots: { lead: 1, lines: [3, 3] },
    build: (s) => ({
      template: 'split-v-75-25', primarySide: 'bottom',
      secondary: toText(s.lead, 'lead'),
      primary: cardRow(s.lines.map((l) => toText(l, 'line', { fontSize: 38 })), 'cards')
    })
  },
  'four-cards': {
    use: 'Four equal cards in a two by two grid, one idea each.',
    slots: { lines: [2, 4], question: [0, 1], sticky: [0, 1] },
    column: [4, 4],
    build: (s) => ({
      template: 'grid-4',
      cells: s.columnItems.map((item) => card(item, 'cells', { fontSize: 36 }))
    })
  },
  'question-answer-sticky': {
    use: 'The question on top, the answer in the middle and the line to remember at the bottom, all one width.',
    slots: { question: 1, lines: [1, 1], sticky: 1 },
    build: (s) => ({
      template: 'body-full',
      body: column([toText(s.question, 'question'), toText(s.lines[0], 'line'),
        toText(s.sticky, 'sticky')], 'column')
    })
  },
  'steps': {
    use: 'Numbered steps, one per row, for a process or a method with no picture.',
    slots: { steps: [3, 6] },
    build: (s) => ({ template: 'teach-steps', steps: s.steps })
  },
  'compare-words': {
    use: 'Two words, or a wrong idea and the truth, in two matching cards with no pictures.',
    slots: { sides: 2, headingRole: [0, 1] },
    build: (s) => Object.assign({
      template: 'teach-compare',
      leftHeading: s.sides[0].heading, rightHeading: s.sides[1].heading,
      leftContent: compareSide(s.sides[0], false),
      rightContent: compareSide(s.sides[1], false)
    }, s.headingRole ? { headingRole: s.headingRole } : {})
  },
  'word-meaning-example': {
    use: 'Three equal columns with a heading each, such as the word, what it means and an example.',
    slots: { columns: 3 },
    build: (s) => ({
      template: 'split-v-80-20', primarySide: 'bottom',
      secondary: cardRow(s.columns.map((c) => toText(c.heading, 'lead')), 'headings'),
      primary: cardRow(s.columns.map((c) => toText(c.text, 'line', { fontSize: 40 })), 'columns')
    })
  },
  'question-three-answers': {
    use: 'One big question, then three possible answers in equal cards for the class to weigh up.',
    slots: { question: 1, answers: [3, 3] },
    build: (s) => ({
      template: 'split-v-60-40', primarySide: 'top',
      primary: card(toText(s.question, 'question'), 'question', { fontSize: 48 }),
      secondary: cardRow(s.answers.map((a) => toText(a, 'line', { fontSize: 32 })), 'answers')
    })
  },
  'source-text': {
    use: 'A written source or passage children read closely: the lead line on top, the passage full width, then any explanation, question and line to remember under it.',
    slots: { lead: [0, 1], extract: 1, lines: [0, 2], question: [0, 1], sticky: [0, 1] },
    build: (s) => {
      const items = [];
      if (s.lead) items.push(card(toText(s.lead, 'lead'), 'lead', { weight: 0.7 }));
      // A passage is read line by line, so it keeps a left edge: centred prose
      // loses the reader's place at the start of every line.
      items.push(Object.assign({ type: 'text', value: s.extract.value, align: 'left',
        heightMode: 'fill', weight: 3 }, s.extract.emphasis ? { emphasis: s.extract.emphasis } : {}));
      if (s.lines.length) {
        items.push(Object.assign(cardRow(s.lines.map((l) => toText(l, 'line')), 'lines'), { weight: 1 }));
      }
      if (s.question) items.push(card(toText(s.question, 'question'), 'question', { weight: 0.8 }));
      if (s.sticky) items.push(card(toText(s.sticky, 'sticky'), 'sticky', { weight: 0.8 }));
      return { template: 'body-full', body: { type: 'stack', items } };
    }
  }
};

function compareSide(side, withPicture) {
  const text = toText(side.text, 'line');
  if (!withPicture) return card(text, 'compare', { fontSize: 36 });
  return {
    type: 'stack',
    items: [withWeight(side.picture, 2.4), card(text, 'compare', { weight: 1 })]
  };
}

// ─── reading a slide against its layout ────────────────────────────

function countRange(spec) {
  if (spec === undefined) return null;
  if (typeof spec === 'number') return [spec, spec];
  return spec;
}

function usersOf(key) {
  return Object.keys(LAYOUTS).filter((name) => LAYOUTS[name].slots[key] !== undefined);
}

function expandSlide(slide, slideNumber) {
  const where = `slide ${slideNumber} (teach-layout)`;
  const name = slide.layout;
  const def = LAYOUTS[name];
  if (!def) {
    fail(where, `"${name}" is not a teach layout. Choose one of: ${Object.keys(LAYOUTS).join(', ')}.`);
  }
  const at = `${where} "${name}"`;

  // A slot this layout does not arrange would be dropped from the board. Refuse it.
  SLOT_KEYS.forEach((key) => {
    if (slide[key] !== undefined && def.slots[key] === undefined) {
      fail(at, `this layout has nowhere to put "${key}", so it would not appear on the slide. ` +
        `Layouts that use "${key}": ${usersOf(key).join(', ')}.`);
    }
  });
  Object.keys(slide).forEach((key) => {
    if (key === 'template' || key === 'layout' || SLOT_KEYS.includes(key) ||
        PASS_THROUGH.includes(key)) return;
    fail(at, `"${key}" is not read on a teach-layout slide.`);
  });

  const s = {};
  const singles = ['lead', 'question', 'sticky', 'statement', 'extract'];
  // A Teach unit can carry two key questions, and every one stays on the board.
  // The layouts that hold a column of cards take both as cards; a layout with a
  // single question place takes one.
  const takesTwoQuestions = !!def.column && !def.columnSkipsQuestion;
  singles.forEach((key) => {
    const range = countRange(def.slots[key]);
    if (!range) return;
    const present = slide[key] !== undefined;
    if (range[0] === 1 && !present) fail(at, `needs "${key}".`);
    if (!present) return;
    if (key === 'question' && Array.isArray(slide[key])) {
      if (!takesTwoQuestions) {
        fail(at, 'this layout has one place for a question. A layout with a column of cards ' +
          '(lead-picture-lines, picture-three-cards, labelled-picture-lines, banner-picture-sidebar, ' +
          'four-cards) takes two.');
      }
      if (slide[key].length < 1 || slide[key].length > 2) {
        fail(at, `takes one or two questions; found ${slide[key].length}.`);
      }
      s.questions = slide[key].map((q, i) => textSlot(q, `${at} question[${i}]`, 'question'));
      s.question = s.questions[0];
      return;
    }
    s[key] = textSlot(slide[key], `${at} ${key}`, key);
    if (key === 'question') s.questions = [s[key]];
  });
  if (def.oneOf && !def.oneOf.some((k) => s[k])) {
    fail(at, `needs one of ${def.oneOf.map((k) => `"${k}"`).join(' or ')} for the bar along the bottom.`);
  }
  if (def.oneOf && def.oneOf.every((k) => s[k])) {
    fail(at, `takes ${def.oneOf.map((k) => `"${k}"`).join(' or ')}, not both: there is one bar along the bottom.`);
  }

  const lists = {
    lines: (v, w) => textSlot(v, w, 'line'),
    captions: (v, w) => textSlot(v, w, 'line'),
    answers: (v, w) => textSlot(v, w, 'line'),
    pictures: (v, w) => pictureSlot(v, w),
    steps: (v, w) => {
      if (typeof v !== 'string' || !v.trim()) fail(w, 'each step is its words as a string.');
      return v;
    },
    speakers: (v, w) => {
      if (!v || typeof v !== 'object' || typeof v.speech !== 'string') {
        fail(w, 'each speaker needs "speech", and may name "name" and "child".');
      }
      return v;
    },
    columns: (v, w) => {
      if (!v || typeof v !== 'object') fail(w, 'each column needs "heading" and "text".');
      return { heading: textSlot(v.heading, `${w} heading`, 'lead'), text: textSlot(v.text, `${w} text`, 'line') };
    },
    sides: (v, w) => {
      if (!v || typeof v !== 'object') fail(w, 'each side needs "heading" and "text".');
      if (typeof v.heading !== 'string' || !v.heading.trim()) fail(w, 'each side needs a "heading".');
      const side = { heading: v.heading, text: textSlot(v.text, `${w} text`, 'line') };
      if (def.sideNeedsPicture) side.picture = pictureSlot(v.picture, `${w} picture`);
      else if (v.picture !== undefined) {
        fail(w, 'this layout has no pictures; use "compare-pictures" to show one on each side.');
      }
      return side;
    }
  };
  Object.keys(lists).forEach((key) => {
    const range = countRange(def.slots[key]);
    if (!range) return;
    s[key] = listSlot(slide, key, at, lists[key]);
    if (s[key].length < range[0] || s[key].length > range[1]) {
      const want = range[0] === range[1] ? `${range[0]}` : `${range[0]} to ${range[1]}`;
      fail(at, `takes ${want} ${key}; found ${s[key].length}.`);
    }
  });
  if (def.slots.headingRole !== undefined && slide.headingRole !== undefined) {
    s.headingRole = slide.headingRole;
  }

  if (def.labelled && s.pictures[0].type !== 'label-diagram') {
    fail(at, 'this layout is for a picture with its parts labelled; its picture must be a "label-diagram".');
  }

  const oranges = [s.lead, s.sticky, s.statement].concat(s.questions || [])
    .concat(s.lines || [], s.captions || [], s.answers || [],
      (s.sides || []).map((x) => x.text), (s.columns || []).map((x) => x.text))
    .filter((x) => x && x.orange);
  if (oranges.length > 1) {
    fail(at, `${oranges.length} lines are orange. One line per slide may be orange, the one you would say louder.`);
  }

  if (def.column) {
    s.columnItems = (s.lines || []).map((l) => toText(l, 'line'))
      .concat(!def.columnSkipsQuestion && s.questions ? s.questions.map((q) => toText(q, 'question')) : [])
      .concat(s.sticky ? [toText(s.sticky, 'sticky')] : []);
    const [min, max] = def.column;
    if (s.columnItems.length < min || s.columnItems.length > max) {
      const want = min === max ? `${min}` : `${min} to ${max}`;
      fail(at, `the cards beside the picture take ${want} lines in total (lines, question and ` +
        `line to remember together); found ${s.columnItems.length}.`);
    }
  }

  const expanded = def.build(s);
  PASS_THROUGH.forEach((key) => {
    if (slide[key] !== undefined) expanded[key] = slide[key];
  });
  return expanded;
}

function isTeachLayout(slide) {
  return !!slide && typeof slide === 'object' && slide.template === 'teach-layout';
}

// Returns a copy of the lesson with every teach-layout slide expanded. Throws a
// TeachLayoutError naming the slide and the fix when a slide cannot be expanded.
function expandTeachLayouts(lesson) {
  if (!lesson || typeof lesson !== 'object' || !Array.isArray(lesson.slides)) return lesson;
  if (!lesson.slides.some(isTeachLayout)) return lesson;
  return Object.assign({}, lesson, {
    slides: lesson.slides.map((slide, i) => (isTeachLayout(slide) ? expandSlide(slide, i + 1) : slide))
  });
}

module.exports = {
  LAYOUTS,
  TeachLayoutError,
  expandTeachLayouts,
  isTeachLayout
};
