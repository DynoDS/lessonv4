'use strict';

const FONT = 'Comic Sans MS';

const COLOURS = {
  bg:          'F2D9C7',
  title:       '0070C0',
  lo:          '7030A0',
  body:        '000000',
  prompt:      '0070C0',
  questionLabel: '7030A0',
  green:       '00B050',
  orange:      'E46C0A',
  problem:     'C00000',
  vocabBg:     'D5F5E3',
  stickyBg:    'DEEAF1',
  sticky:      '7030A0',   // sticky-knowledge words, the LO's purple
  scPanelBg:   'D5F5E3',
  scPanelLine: '00B050',
  teachLeft:   '0070C0',
  teachRight:  'E46C0A',
  tableHeader: '0070C0',
  tableGrid:   'BBBBBB',
  placeholder: 'E0E0E0',
  placeholderLine: 'CCCCCC',
  dim:         '888888',
  pureWhite:   'FFFFFF',
  // Chart/grid lines sit directly on the warm peach slide background (bg,
  // above) with no white card behind them, so a pale blue-grey (the usual
  // "faint gridline" choice on a white background) lands at almost the same
  // lightness as the peach and all but disappears. This mid grey keeps the
  // same faint, unobtrusive feel but stays visibly darker than the peach.
  gridLine:    '8C8C8C'
};

// Per-subject slide background, keyed by lesson.json's "subject" field.
// Subjects not listed here fall back to COLOURS.bg (the warm peach).
const SUBJECT_COLOURS = {
  Maths: 'D5E3F0'
};

// Ceilings, in points. Several sat below MIN_FONT_PT, which is incoherent: a
// ceiling under the floor caps its text below the smallest size the deck says
// may reach a classroom. The unread ones were raised to the floor on
// 19 September 2026 so none can be wired up later as a quiet trap, and a test
// holds them there.
//
// `instruction` is the exception, and it is left at 16 ON PURPOSE with its
// evidence, because it is the one the builder actually reads. `headers.js` hands
// it straight to the slide with no growth and no floor check, so every header
// cue in every deck prints at this size, under the 18 the board holds to. Raising
// it to 18 was tried and backed out the same day: the band is 5.06in and holds
// about 37 characters at 18pt, and a survey of 2,250 header instructions across
// 19 built lessons found 681 of them, close to a third, longer than that. Every
// one would have turned into a TEXT_OVERLOAD, so a deck in three would carry a
// fault about its header furniture. That is the cry-wolf failure this same day's
// work was spent removing from the size check, and it would have buried the real
// faults again.
//
// The floor cannot be lowered for one shape either: `shape_floor` in
// fit_text_postprocess.py only ever RAISES a floor, deliberately.
//
// So this stays a known open fault, and the repair is upstream rather than here:
// a header instruction is meant to be a short secondary cue ("Use the word bank"),
// the teacher deleted this deck's as "pointless", and a third of them being too
// long to read says the field is being used for something it is not for. Fix what
// gets written into it, then this can come up to the floor and stay there.
const SIZE_CEILINGS = {
  slideTitle:       28,
  instruction:      16,
  lo:               36,
  heading:          24,
  lessonCoverLo:    40,
  lessonCoverDate:  32,
  lessonCoverInstr: 20,
  body:             18,
  bullets:          18,
  steps:            18,
  stepBadge:        20,
  mathsQuestion:    28,
  question:         18,
  scStep:           18,
  scLabel:          18,
  tableHeader:      18,
  tableCell:        18,
  caption:          18,
  teachHeading:     18,
  teachBody:        18,
  numberBoxDigit:   28,
  annotationLabel:  18
};

const FIT = 'shrink';
// The projection floor: the smallest text a child at the back of the room can
// read off the board, and the floor `fit_text_postprocess.py` enforces on the
// built deck. Helpers take their own floor as `Math.max(LOCAL_MIN, MIN_FONT_PT)`
// so one number moves them all, and so a helper written later cannot quietly
// sit below the deck it is drawn into.
//
// It was 10 until September 2026, which is a comfortable size on paper held at
// desk distance and unreadable at four metres. A quarter of the text on decks
// built under it came out below 20pt and some of it at 10, and the review pass
// caught one instance of that in three lessons. Text aims for 20 - helpers size
// their boxes for it - and this is the separate, lower question of what may
// reach a classroom at all.
const MIN_FONT_PT = 18;

// The card look (slide visual refresh, Aug 2026): a white rounded card drawn
// behind each top-level content block so content reads as grouped chunks
// rather than text floating on the tinted background. Drawn centrally in
// content/index.js; these constants keep every card identical. The radius
// matches the SC panel's so the deck keeps one corner language.
const CARD = {
  fill:   'FFFFFF',
  line:   'D8D8D8',
  lineW:  0,   // the reference redesigns draw no stroke: the shadow is the edge
  categoryLineW: 2.0,
  radius: 0.08,
  pad:    0.12,
  itemGap: 0.12,
  // Wider, softer halo sitting almost under the card (matched by eye to the
  // reference redesigns) rather than a hard offset drop shadow.
  shadow: { type: 'outer', blur: 10, offset: 1, angle: 90, color: '000000', opacity: 0.18 }
};

// Card params inside a panel (the green SC panel's interior). Tighter padding
// and gaps than the open slide's cards: the panel is narrow, and every tenth
// of an inch of padding here comes straight off the font size the fit pass
// can give the steps - the reason the first white-cards-inside render read
// smaller from the back of the room.
const CARD_COMPACT = {
  fill:   'FFFFFF',
  line:   'E3E3E3',
  lineW:  0,   // no stroke here either; see CARD
  categoryLineW: 2.0,
  radius: 0.06,
  pad:    0.05,
  itemGap: 0.07,
  shadow: { type: 'outer', blur: 6, offset: 1, angle: 90, color: '000000', opacity: 0.14 }
};

const SAFE = {
  shadow: () => ({ type: 'outer', blur: 6, offset: 2, color: '000000', opacity: 0.15 })
};

module.exports = { FONT, COLOURS, SUBJECT_COLOURS, SIZE_CEILINGS, FIT, MIN_FONT_PT, SAFE, CARD, CARD_COMPACT };
