"use strict";

// Which helpers have had their smallest usable size settled by looking at one
// on paper, and what was said.
//
// Every minimum in this engine starts as a guess. The only way to turn one into
// a fact is to print the helper at descending sizes and have a teacher say
// where it stops working, which is how the slide helpers were sized.
//
// This file is the record of that. It exists for two reasons: so the size
// ladder stops asking about helpers already settled, and so the reasoning
// behind a number survives longer than the conversation it came from.
//
// A helper is listed here only when a real verdict was given. "I could not see
// it" is not a verdict, it is a bug in the ladder, and those helpers stay on
// the list to be asked about again.

const JUDGED = {
  // ─── the check-sheet pass, 29 July 2026 ───
  //
  // The first round asked "what looks wrong" over a twenty-four page book and
  // got nothing back, which was a fair result for a bad question. This round
  // asked eight specific ones with the thing beside a centimetre scale, and
  // every one came back answered. The lesson is in the question, not the
  // teacher: "is each box big enough for a child to draw in" is answerable and
  // "what looks wrong" is not.
  storyboard: {
    on: "2026-07-29",
    said: "box is fine, smallest it should be, but the children couldn't write on the lines",
    did:
      "TWO findings in one answer, and they pull opposite ways. The drawing box " +
      "is confirmed at its floor and must not go smaller. The writing lines under " +
      "it were the fault: at a 90mm two-column storyboard each line is 43mm, and " +
      "43mm is not a line a child writes a sentence on. A column carrying writing " +
      "lines now needs 70mm rather than 45mm, so a two-column storyboard asks for " +
      "144mm and gets an 8.5cm line, which is what the full-page cocoa-bean sheet " +
      "already gave it. A storyboard with no lines is unchanged.",
  },
  "match-up": {
    on: "2026-07-29",
    said: "probably",
    did:
      "A weak yes on the 18mm corridor at its narrowest, so it went up rather " +
      "than staying put: floor 18mm to 20mm and share 22% to 24%. 'Probably' is " +
      "the answer to re-ask once a real sheet has been used with a class, and it " +
      "stays on the list for that reason.",
    open: "borderline, not settled. Ask again after a class has drawn on one.",
  },
  "fact-file": {
    on: "2026-07-29",
    said: "fine but not for sentences",
    did:
      "No change to the floor, which is what the question asked about: an 18mm " +
      "slot holds a country name. The rest of the answer is a real gap and not a " +
      "sizing one. A fact file whose answer is a sentence needs a taller slot, " +
      "and there is currently no way to ask for one.",
    open: "a per-field height, for the fields that take a sentence rather than a word",
  },
  "coin-strip": {
    on: "2026-07-29",
    said: "they do look like real coins and looks fine",
    did:
      "Confirmed, and it confirms the decision to break from the Word builder: " +
      "all eight denominations were shown at once, drawn to their real diameters, " +
      "rather than the uniform sizing the reference still recommends.",
  },
  // Asked as "are these writing lines far enough apart for a Year 2 child's
  // handwriting", because those two numbers set the floor for every writing
  // space in the engine.
  "written-answers-line-height": {
    on: "2026-07-29",
    said: "should be fine",
    did: "no change: 8mm for Years 1 to 3 and 6mm for Years 4 to 6 confirmed",
  },
  // These three had been carried as guesses in the state document since the
  // first day, and were bulk-confirmed once under "rest are fine". This time
  // each was shown on its own at its stated minimum with a direct question, and
  // each was answered yes, so they are settled rather than assumed.
  "tally-chart": {
    on: "2026-07-29",
    said: "yes, fine, at its stated minimum, asked on its own",
    did: "no change: the floor is now a finding rather than a guess",
  },
  pictogram: {
    on: "2026-07-29",
    said: "yes fine",
    did: "no change: the floor is now a finding rather than a guess",
  },
  "grid-map": {
    on: "2026-07-29",
    said: "yes, the place names read without crowding the lines",
    did: "no change: the floor is now a finding rather than a guess",
  },

  angle: {
    on: "2026-07-29",
    said: "think angles could go even smaller",
    did: "lowered the floor from 45mm to 32mm",
  },
  triangle: {
    on: "2026-07-29",
    said: "triangle could be smaller",
    did: "lowered the floor from 50mm to 36mm",
  },
  venn: {
    on: "2026-07-29",
    said: "59 is fine for reading, not for writing on, 75 probably same",
    did: "two floors: a Venn that arrives blank is one a child writes into and keeps the larger floor; one that arrives filled in is a worked example and can be smaller",
    open: "at 59mm the region labels print at 4.9pt, against a 9pt floor from the design system, so the width cannot actually drop that far. Worth settling whether the judgement was about the circles or the words.",
  },
  "blank-surface": {
    on: "2026-07-29",
    said: "55mm for blank-surface (numberline) is too small",
    did: "no change: 55mm is the smallest rung shown and already sits below the 100mm floor, so this confirms it",
  },
  carroll: {
    on: "2026-07-29",
    said: "for carroll, 55 too small",
    did: "no change: below the existing 100mm floor, so confirmed",
  },
  "clock-row": {
    on: "2026-07-29",
    said: "58 for clocks",
    did: "no change: below the existing 106mm floor, so confirmed",
  },
  "line-graph": {
    on: "2026-07-29",
    said: "44mm for line graph too small",
    did: "no change: below the existing 80mm floor, so confirmed",
  },
  "fraction-bar": {
    on: "2026-07-29",
    said: "for 40mm on fraction bar, only the writing is too small",
    did: "no change to the floor: the BAR is usable at 40mm and the label is what fails, so the floor is being set by the label rather than the drawing",
    open: "moving the label outside the bar would let this go considerably smaller",
  },

  // ─── second pass, the remaining twenty ───
  "bar-model": {
    on: "2026-07-29",
    said: "bar model could be even smaller, and do bar models only have 2 like that?",
    did: "lowered from 90mm to 70mm for a two-part bar, and from 28mm to 22mm per part, so a four-part bar comes down from 112mm to 88mm. A comparison goes 100mm to 80mm.",
    note: "the ladder only ever showed a TWO-part bar, which is the example being thin rather than the helper: it takes any number of parts, and a comparison shape of two stacked bars with a labelled difference.",
  },
  "recording-table": {
    on: "2026-07-29",
    said: "all fit, but it depends what children are writing. All are fine if they're ticking, or writing one word, if they're writing sentences though...",
    did: "added a `writing` field: tick, word (the default) or sentence. It sets both the column width and the row height, so a three-column table goes 80mm for ticks, 90mm for words and 156mm for sentences. The minimum height now follows the row count too, where a flat 35mm had said a six-row table needed no more room than a two-row one.",
  },

  // Everything below was confirmed at its current floor in the same pass:
  // "rest are fine".
  ...Object.fromEntries(
    [
      "bar-chart",
      "column-method-grid",
      "coordinate-grid",
      "data-table",
      "geoboard",
      "grid-map",
      "line-pair",
      "multiple-choice",
      "number-line",
      "pictogram",
      "questions",
      "rainforest-layers",
      "reflection-grid",
      "sort-grid",
      "source-text",
      "tally-chart",
      "translation-shape",
      "written-answers",
    ].map((name) => [
      name,
      { on: "2026-07-29", said: "rest are fine", did: "no change: current floor confirmed" },
    ])
  ),
};

function isJudged(name) {
  return Boolean(JUDGED[name]);
}

function judgedNames() {
  return Object.keys(JUDGED).sort();
}

module.exports = { JUDGED, isJudged, judgedNames };
