'use strict';

const { FONT, COLOURS, FIT } = require('../styles');
const { fitGroupId, growFitObjectName } = require('../text-fit');
const { arrow, rule } = require('./_geom');

const PAD = 0.12;
const SOURCE_GAP = 0.14;
const SOURCE_FONT_MAX = 28;
const NODE_FONT_MAX = 34;
const SOURCE_FILL = 'FFFFFF';
const SOURCE_LINE = 'E46C0A';
const MIDDLE_FILL = 'DEEAF1';
const MIDDLE_LINE = '0070C0';
const OUTCOME_FILL = 'FFFFFF';
const OUTCOME_LINE = '0070C0';
const CONNECTOR = '6F6F6F';
const NODE_LINE_W = 2;
const CONNECTOR_W = 0.025;

function nodeText(value) {
  return String(value == null ? '' : value);
}

function drawNode(pptx, slide, rect, value, style, objectName) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    fill: { color: style.fill },
    line: { color: style.line, width: NODE_LINE_W },
    rectRadius: 0.08
  });
  slide.addText(value, {
    x: rect.x + 0.08,
    y: rect.y + 0.06,
    w: rect.w - 0.16,
    h: rect.h - 0.12,
    fontFace: FONT,
    fontSize: style.font,
    bold: true,
    color: style.text,
    align: 'center',
    valign: 'middle',
    margin: 0,
    fit: FIT,
    objectName: objectName
  });
}

function drawSourcePathway(pptx, slide, zone, data) {
  const sources = (Array.isArray(data.sources) ? data.sources : [])
    .map(nodeText)
    .filter(function (value) { return value.trim() !== ''; });
  const middle = nodeText(data.middle);
  const outcome = nodeText(data.outcome);

  if (sources.length < 2 || sources.length > 6 || !middle || !outcome) {
    throw new Error(
      'SOURCE_PATHWAY_CAPACITY: source-pathway requires 2 to 6 sources, one middle node and one outcome.'
    );
  }

  const x = zone.x + PAD;
  const y = zone.y + PAD;
  const w = Math.max(2.0, zone.w - 2 * PAD);
  const h = Math.max(2.2, zone.h - 2 * PAD);

  const sourceH = Math.max(0.68, Math.min(1.08, h * 0.23));
  const sourceW = (w - SOURCE_GAP * (sources.length - 1)) / sources.length;
  const joinY = y + h * 0.39;
  const middleH = Math.max(0.62, Math.min(0.88, h * 0.17));
  const outcomeH = Math.max(0.62, Math.min(0.88, h * 0.17));
  const middleW = Math.max(1.7, Math.min(2.7, w * 0.28));
  const outcomeW = Math.max(1.7, Math.min(2.7, w * 0.28));
  const centreX = x + w / 2;
  const middleY = y + h * 0.49;
  const outcomeY = y + h - outcomeH;

  const sourceGroup = fitGroupId(zone, 'source-pathway-sources');
  const sourceCentres = [];

  sources.forEach(function (source, index) {
    const rect = {
      x: x + index * (sourceW + SOURCE_GAP),
      y: y,
      w: sourceW,
      h: sourceH
    };
    sourceCentres.push(rect.x + rect.w / 2);
    drawNode(
      pptx,
      slide,
      rect,
      source,
      {
        fill: SOURCE_FILL,
        line: SOURCE_LINE,
        text: COLOURS.body,
        font: SOURCE_FONT_MAX
      },
      growFitObjectName(sourceGroup, SOURCE_FONT_MAX, 'source-' + index)
    );
  });

  sourceCentres.forEach(function (sourceCentre) {
    rule(
      pptx,
      slide,
      sourceCentre,
      y + sourceH,
      sourceCentre,
      joinY,
      CONNECTOR,
      CONNECTOR_W
    );
  });

  rule(
    pptx,
    slide,
    sourceCentres[0],
    joinY,
    sourceCentres[sourceCentres.length - 1],
    joinY,
    CONNECTOR,
    CONNECTOR_W
  );

  const middleRect = {
    x: centreX - middleW / 2,
    y: middleY,
    w: middleW,
    h: middleH
  };
  const outcomeRect = {
    x: centreX - outcomeW / 2,
    y: outcomeY,
    w: outcomeW,
    h: outcomeH
  };

  arrow(
    pptx,
    slide,
    centreX,
    joinY,
    centreX,
    middleRect.y,
    { color: MIDDLE_LINE, width: 3 }
  );

  drawNode(
    pptx,
    slide,
    middleRect,
    middle,
    {
      fill: MIDDLE_FILL,
      line: MIDDLE_LINE,
      text: COLOURS.body,
      font: NODE_FONT_MAX
    },
    growFitObjectName(
      fitGroupId(zone, 'source-pathway-middle'),
      NODE_FONT_MAX,
      'middle'
    )
  );

  arrow(
    pptx,
    slide,
    centreX,
    middleRect.y + middleRect.h,
    centreX,
    outcomeRect.y,
    { color: OUTCOME_LINE, width: 3 }
  );

  drawNode(
    pptx,
    slide,
    outcomeRect,
    outcome,
    {
      fill: OUTCOME_FILL,
      line: OUTCOME_LINE,
      text: COLOURS.body,
      font: NODE_FONT_MAX
    },
    growFitObjectName(
      fitGroupId(zone, 'source-pathway-outcome'),
      NODE_FONT_MAX,
      'outcome'
    )
  );
}

module.exports = { drawSourcePathway };
