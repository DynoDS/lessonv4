'use strict';

const FONT = 'Comic Sans MS';

const COLOURS = {
  bg:          'F2D9C7',
  title:       '0070C0',
  lo:          '7030A0',
  body:        '000000',
  prompt:      '0070C0',
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
  scStep:           14,
  scLabel:          13,
  tableHeader:      14,
  tableCell:        13,
  caption:          12,
  teachHeading:     18,
  teachBody:        16,
  numberBoxDigit:   28,
  annotationLabel:  14
};

const FIT = 'shrink';
const MIN_FONT_PT = 10;

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
