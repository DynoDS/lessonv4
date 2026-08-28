"use strict";

// Overview family renderers: photoMapOverview, heroCallouts and causeCards.
// Each keeps its distinct spatial grammar, validation, widths, gaps, tints
// and font sizes.

const {
  printableDxa,
  fitTitleSize,
  tryReadPhoto,
  photoAspect,
} = require("./layout");
const { esc, mm, hash, imgTag, titleBarHtml } = require("./shared");

const FONT_STACK_FALLBACK = "'Segoe Print', cursive";

// Local title-fit wrapper used by this renderer family.
function titlePtFor(card, style) {
  const base = card.page.size === "A3" ? style.sizes.a3TitlePt : style.sizes.a4TitlePt;
  return fitTitleSize(card.title || "", base, card.page.size, card.page.orientation, style);
}

// Read the required photo or throw the current required-photo error.
function overviewPhoto(specDir, relPath, label) {
  const buf = tryReadPhoto(specDir, relPath);
  if (!buf) throw new Error(`Card "${label}" could not read required photo "${relPath}".`);
  return { buf, aspect: photoAspect(buf) || 1.5 };
}

// Contain-fit within maxWIn/maxHIn at the photo's true aspect.
function overviewImageHtml(photo, maxWIn, maxHIn) {
  let wIn = maxWIn;
  let hIn = wIn / photo.aspect;
  if (hIn > maxHIn) {
    hIn = maxHIn;
    wIn = hIn * photo.aspect;
  }
  const padMm = mm(80 / 1440);
  return `<div style="text-align:center;padding:${padMm}mm 0;">${imgTag(photo.buf, mm(wIn), mm(hIn), "margin:0 auto;")}</div>`;
}

// One centred (or left-aligned, via opts.align) bold line, spacing 60 dxa
// before and after every time.
function overviewTextHtml(text, pt, style, opts = {}) {
  const vMm = mm(60 / 1440);
  const align = opts.align === "left" ? "left" : "center";
  const bold = opts.bold !== false;
  const colour = opts.color || style.colours.body;
  return (
    `<div style="box-sizing:border-box;padding:${vMm}mm 0;text-align:${align};` +
    `font-family:'${style.fonts.body}', ${FONT_STACK_FALLBACK};font-weight:${bold ? "bold" : "normal"};` +
    `font-size:${pt}pt;color:${hash(colour)};">${esc(text || "")}</div>`
  );
}

// A cell in one of the overview grammars: fixed width, optional fill,
// per-side dxa margins (converted to mm), content vertically centred.
// fillColour may be falsy, in which case no background is drawn.
function overviewCellHtml(innerHtml, opts) {
  const { widthMm, fillColour, marginsDxa } = opts;
  const m = marginsDxa || { top: 0, bottom: 0, left: 0, right: 0 };
  const padTop = mm(m.top / 1440);
  const padBottom = mm(m.bottom / 1440);
  const padLeft = mm(m.left / 1440);
  const padRight = mm(m.right / 1440);
  const bg = fillColour ? `background:${hash(fillColour)};` : "";
  return (
    `<div style="box-sizing:border-box;width:${widthMm}mm;flex:none;${bg}` +
    `padding:${padTop}mm ${padRight}mm ${padBottom}mm ${padLeft}mm;display:flex;flex-direction:column;justify-content:center;">${innerHtml}</div>`
  );
}

// An empty spacer cell between two content cells.
function gapCellHtml(widthMm) {
  return `<div style="width:${widthMm}mm;flex:none;"></div>`;
}

// A row of cells, stretched to a shared height with vertically centred content.
function rowHtml(cellsHtml) {
  return `<div style="display:flex;align-items:stretch;width:100%;">${cellsHtml.join("")}</div>`;
}

// ─── photoMapOverview: 3-5 photo tiles, then a map + "big idea" key row ───

function renderPhotoMapOverview(card, style, specDir) {
  const tiles = Array.isArray(card.tiles) ? card.tiles : [];
  if (tiles.length < 3 || tiles.length > 5) {
    throw new Error(`Card "${card.title || card.type}" requires 3-5 photo tiles.`);
  }
  if (!card.map || !card.map.photo) {
    throw new Error(`Card "${card.title || card.type}" requires a map.photo.`);
  }

  const pdxa = printableDxa(card.page.size, card.page.orientation, style);
  const titlePt = titlePtFor(card, style);
  const titleHtml = titleBarHtml(card.title || "Overview", style.colours.referenceTableHeaderFill, style, titlePt, card.page.size, card.page.orientation);

  const gap = 130;
  const tileWidth = Math.floor((pdxa.width - gap * (tiles.length - 1)) / tiles.length);
  const tilePhotos = tiles.map((tile) => overviewPhoto(specDir, tile.photo, card.title || card.type));

  const tileCellsHtml = [];
  tiles.forEach((tile, idx) => {
    const inner =
      overviewTextHtml(tile.title, 34, style, { color: style.colours.referenceTableHeaderFill }) +
      overviewImageHtml(tilePhotos[idx], tileWidth / 1440 - 0.35, 1.7) +
      overviewTextHtml(tile.caption, 25, style);
    tileCellsHtml.push(
      overviewCellHtml(inner, {
        widthMm: mm(tileWidth / 1440),
        fillColour: idx % 2 ? "F4F6FA" : "FFFFFF",
        marginsDxa: { top: 150, bottom: 150, left: 150, right: 150 },
      })
    );
    if (idx < tiles.length - 1) tileCellsHtml.push(gapCellHtml(mm(gap / 1440)));
  });
  const tilesHtml = rowHtml(tileCellsHtml);

  const mapPhoto = overviewPhoto(specDir, card.map.photo, card.title || card.type);
  const mapWidth = Math.round(pdxa.width * 0.42);
  const textWidth = pdxa.width - mapWidth - gap;

  const mapInner =
    overviewImageHtml(mapPhoto, mapWidth / 1440 - 0.4, 2.25) +
    overviewTextHtml(card.map.caption || "", 25, style, { color: style.colours.referenceTableHeaderFill });
  const mapCellHtml = overviewCellHtml(mapInner, {
    widthMm: mm(mapWidth / 1440),
    fillColour: "DEEAF1",
    marginsDxa: { top: 130, bottom: 130, left: 180, right: 180 },
  });

  const keyInner =
    overviewTextHtml(card.keyHeading || "The big idea", 27, style, { color: "0D9488" }) +
    overviewTextHtml(card.keySentence || "", 34, style);
  const keyCellHtml = overviewCellHtml(keyInner, {
    widthMm: mm(textWidth / 1440),
    fillColour: "F0FDFA",
    marginsDxa: { top: 220, bottom: 220, left: 260, right: 260 },
  });

  const mapRowHtml = rowHtml([mapCellHtml, gapCellHtml(mm(gap / 1440)), keyCellHtml]);

  return titleHtml + tilesHtml + mapRowHtml;
}

// ─── heroCallouts: one large hero photo + exactly two grouped callouts ───

function renderHeroCallouts(card, style, specDir) {
  const groups = Array.isArray(card.groups) ? card.groups : [];
  if (!card.heroPhoto || groups.length !== 2) {
    throw new Error(`Card "${card.title || card.type}" requires heroPhoto and exactly two callout groups.`);
  }

  const pdxa = printableDxa(card.page.size, card.page.orientation, style);
  const titlePt = titlePtFor(card, style);
  const titleHtml = titleBarHtml(card.title || "Overview", style.colours.referenceTableHeaderFill, style, titlePt, card.page.size, card.page.orientation);

  const gap = 180;
  const heroWidth = Math.round(pdxa.width * 0.46);
  const calloutWidth = pdxa.width - heroWidth - gap;
  const hero = overviewPhoto(specDir, card.heroPhoto, card.title || card.type);

  const heroInner =
    overviewImageHtml(hero, heroWidth / 1440 - 0.4, 5.0) +
    overviewTextHtml(card.heroCaption || "", 26, style, { color: style.colours.referenceTableHeaderFill });
  const heroCellHtml = overviewCellHtml(heroInner, {
    widthMm: mm(heroWidth / 1440),
    fillColour: "FFFFFF",
    marginsDxa: { top: 180, bottom: 180, left: 180, right: 180 },
  });

  // Each group is its own full-width tinted block stacked inside the
  // callout column; a 90-before/90-after spacer sits between the two groups.
  const groupBlocksHtml = groups.map((group, idx) => {
    const groupInner =
      overviewTextHtml(group.title, 34, style, { color: idx === 0 ? "1F4E79" : "0D9488" }) +
      (group.items || []).map((item) => overviewTextHtml(item, 28, style, { align: "left" })).join("");
    return overviewCellHtml(groupInner, {
      widthMm: mm(calloutWidth / 1440),
      fillColour: idx === 0 ? "DEEAF1" : "F0FDFA",
      marginsDxa: { top: 180, bottom: 180, left: 240, right: 240 },
    });
  });
  const spacerMm = mm(180 / 1440);
  const calloutInner = groupBlocksHtml[0] + `<div style="height:${spacerMm}mm;"></div>` + groupBlocksHtml[1];

  const calloutCellHtml = overviewCellHtml(calloutInner, {
    widthMm: mm(calloutWidth / 1440),
    fillColour: null,
    marginsDxa: { top: 160, bottom: 160, left: 0, right: 0 },
  });

  const bodyHtml = rowHtml([heroCellHtml, gapCellHtml(mm(gap / 1440)), calloutCellHtml]);
  return titleHtml + bodyHtml;
}

// ─── causeCards: exactly three cards, actor -> action -> teal reason ───

function renderCauseCards(card, style, specDir) {
  const people = Array.isArray(card.people) ? card.people : [];
  if (people.length !== 3) {
    throw new Error(`Card "${card.title || card.type}" requires exactly three cause cards.`);
  }

  const pdxa = printableDxa(card.page.size, card.page.orientation, style);
  const titlePt = titlePtFor(card, style);
  const titleHtml = titleBarHtml(card.title || "What is changing?", style.colours.referenceTableHeaderFill, style, titlePt, card.page.size, card.page.orientation);

  const gap = 180;
  const cardWidth = Math.floor((pdxa.width - gap * 2) / 3);
  const photos = people.map((person) => overviewPhoto(specDir, person.photo, card.title || card.type));

  const cellsHtml = [];
  people.forEach((person, idx) => {
    const inner =
      overviewTextHtml(person.title, 38, style, { color: style.colours.referenceTableHeaderFill }) +
      overviewImageHtml(photos[idx], cardWidth / 1440 - 0.55, 2.7) +
      overviewTextHtml(person.action, 29, style) +
      overviewTextHtml("↓", 30, style, { color: "0D9488" }) +
      overviewTextHtml(person.reason, 30, style, { color: "0D9488" });
    cellsHtml.push(
      overviewCellHtml(inner, {
        widthMm: mm(cardWidth / 1440),
        fillColour: idx === 1 ? "F4F6FA" : "FFFFFF",
        marginsDxa: { top: 170, bottom: 170, left: 210, right: 210 },
      })
    );
    if (idx < 2) cellsHtml.push(gapCellHtml(mm(gap / 1440)));
  });

  const bodyHtml = rowHtml(cellsHtml);
  return titleHtml + bodyHtml;
}

module.exports = { renderPhotoMapOverview, renderHeroCallouts, renderCauseCards };
