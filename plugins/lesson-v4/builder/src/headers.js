'use strict';

const { FONT, COLOURS, SIZE_CEILINGS, FIT, CARD } = require('./styles');
const { HEADER_TITLE, HEADER_STARTER } = require('./layout');
const { drawSignal, signalWidth } = require('./signals');

// Card look: a white pill hugging a header text, so the title and the task
// prompt read as objects on the slide the way every content block now does,
// instead of bare text floating on the background. Width comes from a
// generous glyph estimate (Comic Sans bold runs wide); the pill may run a
// little past the words but must never cut them short.
//
// A signal icon (pencil, talk, tick, magnifier) rides at the start of the
// pill when the slide names one - the instruction is where children look to
// find out what to do, so that is where the picture language lives. With an
// icon the text anchors to the icon's right edge and reads leftwards from
// there (left-aligned), so the width estimate's spare lands as quiet padding
// at the pill's far end instead of a hole between icon and words. Returns
// the absolute x where the text must start, or 0 when no icon drew.
function drawHeaderPill(slide, text, fontPt, box, align, signal) {
  const iconH   = Math.min(0.40, box.h - 0.10);
  const iconW   = signal ? signalWidth(signal, iconH) : 0;
  const iconGap = iconW ? 0.12 : 0;
  // Header instructions are now deliberately short secondary cues rather than
  // the main pupil task. Keep the pill close to that short cue: Comic Sans bold
  // is generously estimated at 0.56em without an icon and 0.54em with one.
  // The text frame still uses shrink-to-fit, so a slightly wide glyph never
  // escapes the pill.
  const factor = iconW ? 0.54 : 0.56;
  const rawW = String(text).length * fontPt * factor / 72 + 0.36 + iconW + iconGap;
  const w    = Math.min(box.w + 0.10, rawW);
  // The pill NEVER grows past the header band: the body content below starts
  // where the band ends, so a taller pill sits under whatever the template
  // puts there (the two-question overlap Daniel caught). A long instruction
  // shrinks to fit inside the band instead, exactly as it did before pills.
  const h    = box.h;
  const x    = align === 'right' ? box.x + box.w - w + 0.05 : box.x - 0.05;
  const px   = Math.max(0.02, x);
  slide.addShape('roundRect', {
    x: px, y: box.y, w: w, h: h,
    fill: { color: CARD.fill },
    line: CARD.lineW ? { color: CARD.line, width: CARD.lineW } : { type: 'none' },
    rectRadius: CARD.radius,
    shadow: Object.assign({}, CARD.shadow)
  });
  if (iconW) {
    drawSignal(slide, signal, { x: px + 0.12, y: box.y + (h - iconH) / 2, h: iconH });
    return px + 0.12 + iconW + iconGap;
  }
  return 0;
}

function drawTitleHeader(slide, data, ctx) {
  const title = data.title || data.heading || '';
  const instruction = data.instruction || '';

  const pills = !!(ctx && ctx.cardLook);

  // Titles stay bare text (the teacher's call): the pill treatment belongs to
  // the instruction only, where "Answer in your books" earns reading as a
  // little sign of its own.
  if (title) {
    slide.addText(title, {
      x: HEADER_TITLE.titleX, y: HEADER_TITLE.titleY,
      w: HEADER_TITLE.titleW, h: HEADER_TITLE.titleH,
      fontFace: FONT, fontSize: SIZE_CEILINGS.slideTitle, bold: true,
      color: COLOURS.title, align: 'left', valign: 'top',
      underline: { style: 'sng' }, margin: 0, fit: FIT
    });
  }
  if (instruction) {
    let textX = 0;
    if (pills) {
      textX = drawHeaderPill(slide, instruction, SIZE_CEILINGS.instruction, {
        x: HEADER_TITLE.instructionX, y: HEADER_TITLE.instructionY,
        w: HEADER_TITLE.instructionW, h: HEADER_TITLE.instructionH
      }, 'right', data.signal);
    }
    const right = HEADER_TITLE.instructionX + HEADER_TITLE.instructionW;
    slide.addText(instruction, {
      x: textX || HEADER_TITLE.instructionX, y: HEADER_TITLE.instructionY,
      w: (right - (pills ? 0.12 : 0)) - (textX || HEADER_TITLE.instructionX),
      h: HEADER_TITLE.instructionH,
      fontFace: FONT, fontSize: SIZE_CEILINGS.instruction, bold: true,
      color: COLOURS.body, align: textX ? 'left' : 'right', valign: 'middle',
      margin: 0, fit: FIT
    });
  }
}

function drawStarterHeader(slide, data, ctx) {
  const dateText = 'Date';
  const lo = data.lo || '';
  const heading = data.heading || data.title || 'Starter';
  const instruction = data.instruction || '';

  slide.addText(dateText, {
    x: HEADER_STARTER.dateX, y: HEADER_STARTER.dateY,
    w: HEADER_STARTER.dateW, h: HEADER_STARTER.dateH,
    fontFace: FONT, fontSize: SIZE_CEILINGS.lo, bold: true,
    color: COLOURS.body, align: 'left', valign: 'middle',
    underline: { style: 'sng' }, margin: 0, fit: FIT
  });

  if (lo) {
    slide.addText('LO: ' + lo, {
      x: HEADER_STARTER.loX, y: HEADER_STARTER.loY,
      w: HEADER_STARTER.loW, h: HEADER_STARTER.loH,
      fontFace: FONT, fontSize: SIZE_CEILINGS.lo, bold: true,
      color: COLOURS.lo, align: 'left', valign: 'middle',
      underline: { style: 'sng' }, margin: 0, fit: FIT
    });
  }

  const pills = !!(ctx && ctx.cardLook);

  // The Starter label is a title, so it stays bare like every other title;
  // only the instruction takes a pill.
  slide.addText(heading, {
    x: HEADER_STARTER.headingX, y: HEADER_STARTER.headingY,
    w: HEADER_STARTER.headingW, h: HEADER_STARTER.headingH,
    fontFace: FONT, fontSize: SIZE_CEILINGS.heading, bold: true,
    color: COLOURS.title, align: 'left', valign: 'middle',
    underline: { style: 'sng' }, margin: 0, fit: FIT
  });

  if (instruction) {
    let textX = 0;
    if (pills) {
      textX = drawHeaderPill(slide, instruction, SIZE_CEILINGS.instruction, {
        x: HEADER_STARTER.instructionX, y: HEADER_STARTER.instructionY,
        w: HEADER_STARTER.instructionW, h: HEADER_STARTER.instructionH
      }, 'right', data.signal);
    }
    const right = HEADER_STARTER.instructionX + HEADER_STARTER.instructionW;
    slide.addText(instruction, {
      x: textX || HEADER_STARTER.instructionX, y: HEADER_STARTER.instructionY,
      w: (right - (pills ? 0.12 : 0)) - (textX || HEADER_STARTER.instructionX),
      h: HEADER_STARTER.instructionH,
      fontFace: FONT, fontSize: SIZE_CEILINGS.instruction, bold: true,
      color: COLOURS.body, align: textX ? 'left' : 'right', valign: 'middle',
      margin: 0, fit: FIT
    });
  }
}

function drawHeader(slide, data, ctx) {
  if (data.headerStyle === 'starter') {
    drawStarterHeader(slide, data, ctx);
  } else {
    drawTitleHeader(slide, data, ctx);
  }
}

module.exports = { drawHeader, drawTitleHeader, drawStarterHeader };
