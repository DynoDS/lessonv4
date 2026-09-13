'use strict';

// Comic Sans advance widths, shared by every surface that measures words it is
// about to draw: the board, and the shared drawings in shared/visuals/ that the
// board, the worksheet, the wall and the stick-in pack all place. Moved here
// from builder/src/glyph-width.js on 13 September 2026 so a shared drawing
// measures its numerals with the same table the slides do.

// How wide is this text, really?
//
// Every helper that draws a card around its own words has to know how much
// room the words need before it can decide how big the card is. Until now each
// one guessed with a single "average characters per em" constant, and the
// guesses were deliberately low - the reasoning being that a low estimate makes
// a card hug its longest line instead of rounding up, and that the grow-fit
// pass would carry whatever slack the estimate left.
//
// That reasoning has a hole in it, and a Year 4 place-value deck fell through
// it. The grow-fit pass changes the FONT SIZE inside a box. It cannot make the
// box wider. So an estimate that comes in UNDER the real width does not leave
// slack for anything to carry: it draws a box too narrow for its own words, and
// the fit pass then shrinks the words to fit the box the layout gave them. On
// that deck a Your Turn asking children to draw charts for 6,032, 6,302 and
// 6,320 was laid out at 16pt and shipped at 12pt, while the "(4)" beside it -
// priced with a nearly-honest constant - stayed at 16pt. A question two-thirds
// the size of its own number, on a slide the class reads from the back row.
//
// There is no single safe constant to reach for instead. In Comic Sans a "W" is
// 1.04em and an "l" is 0.27em, so any average is wildly wrong for some real
// string: "6,032" runs at 0.58em per character and "Round 5.6 to the nearest
// whole number." at 0.52em. So this stops averaging and adds up the real
// advance widths instead.
//
// PROVENANCE. The tables are the horizontal advance of each glyph in Comic Sans
// MS (comicbd.ttf and comic.ttf, unitsPerEm 2048), divided by unitsPerEm, to
// four decimal places. They describe the font the deck NAMES, which is the font
// the classroom machine renders with - so measurement here is right whether or
// not the building machine happens to have Comic Sans installed. That is why
// this is a table rather than a call into the Python fit pass, which measures
// with a bundled look-alike when the real face is absent.

// Characters Comic Sans has no glyph for - arrows, ticks, the sparkle - are
// drawn by whatever fallback face the renderer picks, so their width is not
// knowable here. They are priced generously on purpose: over-estimating widens
// a card, which costs a little room, and under-estimating shrinks a child's
// question, which costs the reading.
const UNKNOWN_EM = 1.1;

const BOLD = {
  " ":0.4336,"!":0.2378,"\"":0.4375,"#":0.8428,"$":0.6934,"%":0.8203,
  "&":0.6543,"'":0.4336,"(":0.3662,")":0.3662,"*":0.5298,"+":0.6104,
  ",":0.4336,"-":0.6104,".":0.4336,"/":0.5117,"0":0.6104,"1":0.6104,
  "2":0.6104,"3":0.6104,"4":0.6104,"5":0.6104,"6":0.6104,"7":0.6104,
  "8":0.6104,"9":0.6104,":":0.4336,";":0.4336,"<":0.6104,"=":0.6104,
  ">":0.6104,"?":0.5659,"@":0.9312,"A":0.7314,"B":0.6304,"C":0.6187,
  "D":0.7217,"E":0.6245,"F":0.6069,"G":0.6797,"H":0.7681,"I":0.5464,"J":0.665,
  "K":0.6108,"L":0.5508,"M":0.8828,"N":0.813,"O":0.7983,"P":0.5327,"Q":0.8765,
  "R":0.6401,"S":0.6934,"T":0.6958,"U":0.7368,"V":0.6748,"W":1.0396,
  "X":0.7236,"Y":0.6353,"Z":0.6934,"[":0.3765,"\\":0.5498,"]":0.3765,
  "^":0.6104,"_":0.627,"`":0.5562,"a":0.5557,"b":0.5933,"c":0.5137,"d":0.5874,
  "e":0.5591,"f":0.5083,"g":0.5308,"h":0.5776,"i":0.2803,"j":0.4033,"k":0.54,
  "l":0.2739,"m":0.7769,"n":0.5234,"o":0.5259,"p":0.5347,"q":0.52,"r":0.4805,
  "s":0.4868,"t":0.4712,"u":0.52,"v":0.4863,"w":0.6841,"x":0.5903,"y":0.5527,
  "z":0.5381,"{":0.3662,"|":0.4214,"}":0.3662,"~":0.6104,"\u00a3":0.7935,
  "\u00d7":0.6104,"\u00f7":0.6104,"\u2248":0.6104,"\u00b0":0.6104,
  "\u2013":0.4414,"\u2014":0.8828,"\u201c":0.4336,"\u201d":0.4336,
  "\u2026":0.6753,"\u00bd":0.6104,"\u00bc":0.6104,"\u00be":0.6104,
  "\u2022":0.6104,"\u2265":0.6104,"\u2264":0.6104,"\u2212":0.6104
};

const REGULAR = {
  " ":0.2988,"!":0.2378,"\"":0.4243,"#":0.8428,"$":0.6934,"%":0.8203,
  "&":0.6543,"'":0.3882,"(":0.3662,")":0.3662,"*":0.5298,"+":0.4805,
  ",":0.2769,"-":0.4165,".":0.249,"/":0.5117,"0":0.6104,"1":0.4502,"2":0.6104,
  "3":0.6104,"4":0.6104,"5":0.6104,"6":0.6104,"7":0.6104,"8":0.6104,
  "9":0.6104,":":0.2988,";":0.2988,"<":0.3813,"=":0.5103,">":0.3813,
  "?":0.5239,"@":0.9312,"A":0.7314,"B":0.6304,"C":0.6025,"D":0.7217,
  "E":0.6245,"F":0.6069,"G":0.6797,"H":0.7681,"I":0.5464,"J":0.665,"K":0.6108,
  "L":0.5508,"M":0.8828,"N":0.7969,"O":0.7983,"P":0.5205,"Q":0.8765,
  "R":0.6284,"S":0.6934,"T":0.6797,"U":0.7368,"V":0.6499,"W":1.0396,
  "X":0.7236,"Y":0.6353,"Z":0.6934,"[":0.3765,"\\":0.5498,"]":0.3765,
  "^":0.5811,"_":0.627,"`":0.5562,"a":0.5117,"b":0.5933,"c":0.5137,"d":0.5874,
  "e":0.5479,"f":0.5083,"g":0.5308,"h":0.5776,"i":0.2803,"j":0.4033,"k":0.54,
  "l":0.2739,"m":0.7769,"n":0.5234,"o":0.5259,"p":0.5347,"q":0.52,"r":0.4805,
  "s":0.4868,"t":0.4712,"u":0.52,"v":0.4863,"w":0.6841,"x":0.5903,"y":0.5205,
  "z":0.5381,"{":0.3662,"|":0.4214,"}":0.3662,"~":0.5977,"\u00a3":0.7935,
  "\u00d7":0.4805,"\u00f7":0.4805,"\u2248":0.6196,"\u00b0":0.4092,
  "\u2013":0.4414,"\u2014":0.8828,"\u201c":0.3936,"\u201d":0.3936,
  "\u2026":0.6753,"\u00bd":0.6509,"\u00bc":0.6509,"\u00be":0.6509,
  "\u2022":0.3872,"\u2265":0.3813,"\u2264":0.3813,"\u2212":0.4805
};

// PowerPoint lays a line out from hinted, rounded glyph boxes rather than from
// raw advances, so a measured line runs a whisker wider than the sum of its
// advances (about 1.5% on the strings this was checked against). This clears
// that, and nothing more: the point is a box that is never narrower than its
// words, not a box padded for comfort.
const RENDER_SAFETY = 1.03;

// The width of one line of text as a multiple of the font size.
function textWidthEm(text, bold) {
  const table = bold === false ? REGULAR : BOLD;
  let em = 0;
  for (const ch of String(text == null ? '' : text)) {
    const advance = table[ch];
    em += advance === undefined ? UNKNOWN_EM : advance;
  }
  return em * RENDER_SAFETY;
}

module.exports = { textWidthEm, UNKNOWN_EM, RENDER_SAFETY };
