#!/usr/bin/env node
"use strict";

// A fraction in any drawing's label is stacked: installed before a drawing is
// taken hold of (shared/visuals/stacked-fraction-labels.js).
require("../shared/visuals/stacked-fraction-labels").installOnSharedDrawings();

// Working-wall HTML/PDF builder entry point. Same JSON contract, same look;
// A3 only (see the "A3 only" hard error below). Cards are rendered to HTML
// fragments, assembled into one document carrying a named @page rule per
// orientation, then printed to PDF through worksheet-html's Chrome step.
// When no Chrome is available the HTML itself is written and the build says
// `PDF_SKIPPED:` - the same signal the worksheet and stick-in-sheets HTML
// builders use.
//
// Usage: node build.js <working-wall.json> [output-dir] [--validate-only]

const fs = require("fs");
const path = require("path");

const style = require("./style.json");
const { sanitizeHouseStyle } = require("../shared/text/house-style");
const { sixSevenNumbers, sixSevenMessage } = require("../shared/text/no-six-seven");
const { safeFilenameComponent } = require("../shared/text/filename");
const { preRenderSvgs } = require("./src/svg-renderer");
const { stackFractionsInHtml, STACKED_FRACTION_IN_LINE_CSS } = require("../shared/text/stacked-fractions");
const { PAGE_CSS } = require("./src/shared");
const { tryReadPhoto } = require("./src/layout");
const { renderSectionHeading, renderLabelledDiagram, renderMnemonicPoster, renderBanner } = require("./src/render-display");
const { renderStickyKnowledge, renderVocabDefinition, renderWorkedExample, renderSentenceStem, renderMisconception } = require("./src/render-panels");
const { renderReferenceTable, renderEquivalenceGrid, renderVocabChips } = require("./src/render-grids");
const { renderPhotoMapOverview, renderHeroCallouts, renderCauseCards } = require("./src/render-overview");
const { renderDiagramSection } = require("./src/render-section");
const { renderStepByStep } = require("./src/render-steps");
const { continueStepSheets } = require("./src/step-colours");
const { takePlacements, assertFiguresReadable, shrunkDrawings, assertFigureWordsReadable } = require("./src/figure-size");
const { cardLabel } = require("./src/visuals");
const { measurePages, edgeMessage, PART_TOLERANCE_MM } = require("./src/page-measure");
const chrome = require("../worksheet-html/src/chrome");
const {
  prepareWorkingWallOptionalImages,
  wrapWorkingWallPage,
} = require("./src/decorations");

const RENDERERS = {
  stickyKnowledge: renderStickyKnowledge,
  workedExample: renderWorkedExample,
  sentenceStem: renderSentenceStem,
  misconception: renderMisconception,
  referenceTable: renderReferenceTable,
  vocabDefinition: renderVocabDefinition,
  vocabChips: renderVocabChips,
  equivalenceGrid: renderEquivalenceGrid,
  mnemonicPoster: renderMnemonicPoster,
  sectionHeading: renderSectionHeading,
  banner: renderBanner,
  labelledDiagram: renderLabelledDiagram,
  photoMapOverview: renderPhotoMapOverview,
  heroCallouts: renderHeroCallouts,
  causeCards: renderCauseCards,
  diagramSection: renderDiagramSection,
  stepByStep: renderStepByStep,
};

function naturalFilename(topic, ext) {
  const safe = safeFilenameComponent(topic);
  return `Working Wall - ${safe}.${ext}`;
}

const CARD_PICTURE_TYPES = new Set([
  "stickyKnowledge",
  "workedExample",
  "misconception",
]);

function collectUnresolvedEducationalSvg(node, pointer, out) {
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      collectUnresolvedEducationalSvg(item, `${pointer}/${index}`, out);
    });
    return;
  }
  if (!node || typeof node !== "object") return;

  if (
    node.kind === "educational-svg" &&
    (typeof node.imagePath !== "string" || !node.imagePath.trim())
  ) {
    out.push(pointer);
  }

  for (const [key, value] of Object.entries(node)) {
    collectUnresolvedEducationalSvg(value, `${pointer}/${key}`, out);
  }
}

function collectIncompleteEmojiPictures(node, pointer, out) {
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      collectIncompleteEmojiPictures(item, `${pointer}/${index}`, out);
    });
    return;
  }
  if (!node || typeof node !== "object") return;

  const picture = node.picture;
  if (picture && typeof picture === "object" && picture.kind === "emoji") {
    const value = typeof picture.value === "string" ? picture.value.trim() : "";
    const alt = typeof picture.alt === "string" ? picture.alt.trim() : "";
    if (!value || !alt) out.push(`${pointer}/picture`);
  }

  for (const [key, value] of Object.entries(node)) {
    collectIncompleteEmojiPictures(value, `${pointer}/${key}`, out);
  }
}

// Where a picture IS the content rather than a decoration. On these families a
// tile, a hero or a person without a readable photograph is not a thinner card,
// it is an empty one, and the renderers refuse it mid-render one slot at a
// time. Checking the whole spec first means a repair sees every missing
// photograph at once, named by card and tile, instead of fixing one and
// meeting the next: a geography wall failed with `could not read required
// photo "undefined"` after a repair removed four tile photos that its own
// validation had accepted.
function requiredPhotoSlots(card) {
  const slots = [];
  const at = (photo, where) => slots.push({ photo, where });
  if (card.type === "photoMapOverview") {
    (Array.isArray(card.tiles) ? card.tiles : []).forEach((tile, i) => {
      at(tile && tile.photo, `tile ${i + 1}${tile && tile.title ? ` "${tile.title}"` : ""}`);
    });
    at(card.map && card.map.photo, "the map");
  } else if (card.type === "heroCallouts") {
    at(card.heroPhoto, "the hero photograph");
  } else if (card.type === "causeCards") {
    (Array.isArray(card.people) ? card.people : []).forEach((person, i) => {
      at(person && person.photo, `person ${i + 1}${person && person.name ? ` "${person.name}"` : ""}`);
    });
  }
  return slots;
}

function assertRequiredPhotosAreReadable(cards, specDir) {
  const faults = [];
  cards.forEach((card) => {
    if (!card || typeof card !== "object") return;
    const label = card.title || card.type;
    requiredPhotoSlots(card).forEach(({ photo, where }) => {
      if (!photo) {
        faults.push(`Card "${label}" ${where} has no photo.`);
      } else if (!tryReadPhoto(specDir, photo)) {
        faults.push(`Card "${label}" ${where} names "${photo}", which could not be read.`);
      }
    });
  });
  if (faults.length) {
    const list = faults.map((fault) => "  " + fault).join("\n");
    throw new Error(
      `${faults.length} required Working Wall photograph(s) missing:\n${list}\n` +
        "On these card types the photograph is the content, so a slot cannot " +
        "stand on its words: re-point it at a published picture, drop the whole " +
        "tile if the card still meets its minimum, or use a card type the " +
        "surviving pictures support."
    );
  }
}

function assertFinalOptionalPictureContract(cards) {
  const unsupportedPictures = [];
  cards.forEach((card, index) => {
    if (
      card &&
      card.picture &&
      typeof card.picture === "object" &&
      !CARD_PICTURE_TYPES.has(card.type)
    ) {
      unsupportedPictures.push(`/cards/${index}/picture`);
    }
  });
  if (unsupportedPictures.length > 0) {
    throw new Error(
      `Unsupported Working Wall card-level picture(s): ${unsupportedPictures.join(", ")}. ` +
        `Card-level picture is supported only on stickyKnowledge, workedExample, and misconception.`
    );
  }

  const coexisting = [];
  cards.forEach((card, index) => {
    if (!card || !card.picture || typeof card.picture !== "object") return;
    const hasPhoto = typeof card.photo === "string" && card.photo.trim();
    const hasVisual = card.visual && typeof card.visual === "object";
    if (hasPhoto || hasVisual) {
      coexisting.push(`/cards/${index}/picture`);
    }
  });
  if (coexisting.length > 0) {
    throw new Error(
      `Conflicting Working Wall card visual(s): ${coexisting.join(", ")}. ` +
        `A card-level P2 picture must not coexist with a P1 photo or visual; P1 wins, ` +
        `so the Working Wall Designer must drop the optional picture from that card before build.`
    );
  }

  const unresolved = [];
  collectUnresolvedEducationalSvg(cards, "/cards", unresolved);
  if (unresolved.length > 0) {
    throw new Error(
      `Unresolved Working Wall Educational SVG request(s): ${unresolved.join(", ")}. ` +
        `The Working Wall Designer must resolve each request to imagePath, replace an ordinary P2 with a complete emoji picture, or remove the optional request/card before build.`
    );
  }

  const incompleteEmoji = [];
  collectIncompleteEmojiPictures(cards, "/cards", incompleteEmoji);
  if (incompleteEmoji.length > 0) {
    throw new Error(
      `Incomplete Working Wall emoji picture(s): ${incompleteEmoji.join(", ")}. ` +
        `Emoji pictures require non-empty value and alt fields before build.`
    );
  }
}

// `options.validateOnly` stops after the layout checks and writes nothing.
//
// Every capacity rule the wall has - the characters a table cell holds at its
// column width, the inches a panel of items needs at the readable floor - is
// only reachable by drawing the pages, so the designer used to find out it had
// overrun by handing the spec to the builder and reading the failure back. Two
// consecutive lessons lost a designer-and-builder round trip that way, one to a
// table cell 75 characters long where 74 fit and one to a panel 0.1in over at
// 36pt. The rules cannot move to the designer, so the check does: the same
// pages, the same warnings, no PDF.
// The most of its printed height a section's drawing gives up when the drawn
// page shows its part running over: a tenth. The words are already at their
// smallest by then (the drawing has first call on the room), so a few
// millimetres off the drawing keeps every word and cannot be seen, where a
// refusal cost a rewrite: the perimeter wall lost "Rectangle 1:" and
// "Rectangle 2:" that way. Past a tenth the drawing would be the small picture
// the teacher turned down, so the sheet goes back with the size of the overrun
// (his answers of 10 October 2026, from pictures of that poster).
const DRAWING_GIVES_AT_MOST = 0.1;

function pagesHtml(pageDivs) {
  // A fraction typed with a slash prints top and bottom, as on every other
  // surface, at the size that stands inside one planned line
  // (shared/text/stacked-fractions.js).
  return stackFractionsInHtml(`<!doctype html><html><head><meta charset="utf-8"><style>${PAGE_CSS}${STACKED_FRACTION_IN_LINE_CSS}</style></head><body>${pageDivs.join("")}</body></html>`);
}

function partTooTall(card, partIndex, overMm, canGiveMm) {
  const part = (card.parts || [])[partIndex] || {};
  return new Error(
    `WALL_PART_TOO_TALL: ${cardLabel(card)} part ${partIndex + 1} ("${String(part.heading || "").trim()}") prints ${overMm.toFixed(1)}mm taller than its panel, measured on the drawn page with its words at their smallest size. ` +
      (canGiveMm > 0
        ? `Its drawing can give up ${canGiveMm.toFixed(1)}mm and no more without becoming too small for a wall. `
        : `It has no drawing that can give the room up. `) +
      "Make room first: give this idea a sheet of its own (a diagramSection with one part), or move a line to another part. " +
      "Only then shorten a line to a shorter whole sentence, keeping its label."
  );
}

async function build(specPath, outDir, options = {}) {
  const spec = sanitizeHouseStyle(JSON.parse(fs.readFileSync(specPath, "utf8")));
  const sixSeven = sixSevenNumbers(spec);
  if (sixSeven.length) throw new Error(sixSevenMessage(sixSeven, "working wall"));
  const layoutWarnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.map(String).join(" ");
    layoutWarnings.push(message);
    originalWarn(...args);
  };

  try {
    if (!spec.topic || typeof spec.topic !== "string") {
      throw new Error("spec.topic is required and must be a non-empty string.");
    }

    const cards = spec.cards || [];

    if (cards.length === 0) {
      console.log("No cards in working-wall.json - nothing to build.");
      return null;
    }

    // The designer's contract is 0-2 teaching cards; wall furniture (a banner,
    // a mnemonic poster, a section heading) is requested separately and does
    // not count. This used to be discipline only, so a run that overshot
    // printed silently; now it is refused here, before any page is drawn.
    // The engine's own test fixtures sweep many card types through one build
    // on purpose, so a spec may declare `"fixtureSweep": true` to lift the
    // cap - that flag is for fixtures under test-fixtures-a3/ only, and the
    // designer never writes it.
    const FURNITURE = new Set(["banner", "mnemonicPoster", "sectionHeading"]);
    const teachingCards = cards.filter((c) => !FURNITURE.has(c && c.type));
    if (teachingCards.length > 2 && spec.fixtureSweep !== true) {
      throw new Error(
        `${teachingCards.length} teaching cards in working-wall.json; the wall takes at most 2 ` +
          `(furniture like a banner or section heading is not counted). Combine or cut cards.`
      );
    }

    // A vocab-chip grid holds at most 12 chips on the page; extra chips used
    // to fall off the bottom edge without a word said. Refused instead.
    for (const card of cards) {
      if (card && card.type === "vocabChips" && Array.isArray(card.chips) && card.chips.length > 12) {
        throw new Error(
          `vocabChips card carries ${card.chips.length} chips; 12 is the most a page holds, ` +
            `and the rest would be cut off. Split into two chip cards.`
        );
      }
    }

    // Before any picture is drawn: a step's colour reaches its drawing too.
    continueStepSheets(cards);

    assertFinalOptionalPictureContract(cards);

    const specDir = path.dirname(specPath);
    assertRequiredPhotosAreReadable(cards, specDir);

    const pagePaddingMm = style.marginsCm.a3 * 10;
    const optionalVisuals = prepareWorkingWallOptionalImages(
      cards,
      specDir,
      pagePaddingMm
    );

    // Pre-render any SVG primitives the cards need (clock faces, step
    // badges) into PNG buffers before the render loop; one shared pre-render
    // pass feeds every wall renderer.
    let svgImages = await preRenderSvgs(spec, specDir);
    // What each section part's drawing gives up, once the drawn page is read.
    const give = {};
    let ctx = { svgImages, widths: {}, cards, give };

    // A renderer returns either a single page-inner HTML string, or an ARRAY
    // of them for a card that spans several physical pages (mnemonicPoster,
    // banner) - every page in that array shares the one card's page config.
    // flatMap turns each card into 1-or-more page divs, so total page count
    // is sum(Array.isArray(r) ? r.length : 1) over all cards.
    const placedByCard = [];
    const drawPages = () => cards.flatMap((card, cardIndex) => {
      const renderer = RENDERERS[card.type];
      if (!renderer) {
        throw new Error(`Unknown card type: "${card.type}"`);
      }
      if (!card.page || !card.page.size || !card.page.orientation) {
        throw new Error(`Card "${card.type}" missing required page config (size + orientation).`);
      }
      if (card.page.size !== "A3") {
        throw new Error(`Card "${card.type}" is ${card.page.size}; the working wall is A3 only. Set page.size to "A3".`);
      }

      // The size each lesson drawing printed at on this card, against the
      // wall's floor: words were the only thing any layout check measured, so a
      // sheet of stamp-sized figures used to pass (src/figure-size.js).
      takePlacements();
      const result = renderer(card, style, specDir, ctx);
      placedByCard[cardIndex] = takePlacements();
      assertFiguresReadable(card, placedByCard[cardIndex], cardLabel(card));
      const innerHtmls = Array.isArray(result) ? result : [result];
      const orientationClass = card.page.orientation === "landscape" ? "landscape" : "portrait";
      return innerHtmls.map((innerHtml) =>
        wrapWorkingWallPage(
          orientationClass,
          pagePaddingMm,
          innerHtml,
          optionalVisuals.decorationPlans.get(cardIndex)
        )
      );
    });

    let pageDivs = drawPages();

    // A drawing is first laid out for a guessed width, and a card that prints
    // it smaller shrinks its numbers and labels with it. So the cards are
    // drawn, any drawing printed well under its laid-out width is laid out
    // again to fit the room its card offered, and the cards are drawn again
    // (src/figure-size.js). A drawing laid out narrower changes shape, which
    // can change the room a card offers, so this is settled over a few
    // passes. A drawing with no width at which it fits its room with words
    // at wall size is left as it was, and a pass that cannot be drawn (a
    // card that no longer fits) is given up and the last good pages kept:
    // the words check below then says what the sheet needs.
    const fitDrawings = async () => {
      if (layoutWarnings.length > 0) return;
      for (let pass = 0; pass < 3; pass += 1) {
        const widths = { ...ctx.widths };
        for (const shrunk of cards.flatMap((card, cardIndex) => shrunkDrawings(placedByCard[cardIndex] || [], card))) {
          if (shrunk.kind === "label") {
            // A labelled photograph: the type that prints its names at size.
            const px = svgImages.fitLabel(shrunk.identity, shrunk.room.wMm, shrunk.room.hMm, shrunk.labelPt);
            if (px > shrunk.labelPx * 1.05) widths[shrunk.identity] = px;
            continue;
          }
          const width = svgImages.fitWidth(shrunk.identity, shrunk.room.wMm, shrunk.room.hMm);
          if (width > 0 && width < shrunk.layoutWidthMm) widths[shrunk.identity] = width;
        }
        if (Object.keys(widths).every((id) => ctx.widths[id] === widths[id])) break;
        const kept = { svgImages, ctx, pageDivs, placed: placedByCard.slice(), warnings: layoutWarnings.length };
        try {
          svgImages = await preRenderSvgs(spec, specDir, widths, svgImages);
          ctx = { svgImages, widths, cards, give };
          pageDivs = drawPages();
          if (layoutWarnings.length > kept.warnings) throw new Error("the redrawn pass did not fit");
        } catch (err) {
          ({ svgImages, ctx, pageDivs } = kept);
          placedByCard.splice(0, placedByCard.length, ...kept.placed);
          layoutWarnings.length = kept.warnings;
          break;
        }
      }
    };
    const assertSound = () => {
      if (layoutWarnings.length > 0) {
        throw new Error(`Layout validation failed:\n${layoutWarnings.join("\n")}`);
      }
      cards.forEach((card, cardIndex) => assertFigureWordsReadable(card, placedByCard[cardIndex] || [], cardLabel(card)));
    };
    await fitDrawings();
    assertSound();

    // The sums above say what the page should draw; this reads what it did
    // draw, in the Chrome that prints it (src/page-measure.js). A section part
    // that runs over has its drawing give the overrun up and the sheet is
    // drawn again, a few times at most because a drawing laid out for less
    // room can change shape. Anything else printed past its box, or past the
    // page, is refused by name. With no Chrome to ask, the sums stand, as they
    // did before, and the build says so.
    let browser = null;
    if (options.measure !== false) {
      try {
        browser = await chrome.launchBrowser();
      } catch (err) {
        console.log(`WALL_PAGE_NOT_MEASURED: no browser to draw the page in, so the layout was checked by its sums alone (${err && err.message ? err.message.split("\n")[0] : err})`);
      }
    }
    try {
    if (browser) {
      const figureAtFirst = {};
      let measured = await measurePages(browser, pagesHtml(pageDivs));
      for (let round = 0; round < 4; round += 1) {
        const over = measured.parts.filter((part) => part.overMm > PART_TOLERANCE_MM);
        if (!over.length) break;
        for (const part of measured.parts) {
          if (figureAtFirst[part.id] === undefined) figureAtFirst[part.id] = part.figureMm;
        }
        for (const part of over) {
          const [cardIndex, partIndex] = part.id.split(":").map(Number);
          const givenMm = (give[part.id] || 0) * 25.4;
          const canGiveMm = figureAtFirst[part.id] * DRAWING_GIVES_AT_MOST;
          if (round === 3 || givenMm + part.overMm > canGiveMm) {
            throw partTooTall(cards[cardIndex], partIndex, givenMm + part.overMm, canGiveMm);
          }
          give[part.id] = (givenMm + part.overMm + 0.2) / 25.4;
        }
        pageDivs = drawPages();
        await fitDrawings();
        assertSound();
        measured = await measurePages(browser, pagesHtml(pageDivs));
      }
      if (measured.edges.length > 0) {
        throw new Error(`Layout validation failed:\n${measured.edges.map(edgeMessage).join("\n")}`);
      }
    }

    for (const notice of optionalVisuals.notices) {
      console.log(notice);
    }

    // What each card's drawings printed at, for a caller that asks.
    if (options.report) options.report.placedByCard = placedByCard;

    if (options.validateOnly) {
      console.log(`WORKING_WALL_LAYOUT_OK: ${cards.length} card(s), ${pageDivs.length} page(s)`);
      return null;
    }

    const html = pagesHtml(pageDivs);

    let outPath;
    try {
      const pdf = await chrome.htmlToPdf(html, browser ? { browser } : {});
      assertPhysicalPages(pdf, pageDivs.length);
      // The folder the wall is written to is made if it is not there: three
      // workers in one trial lost a build to a folder they had not made first.
      fs.mkdirSync(outDir, { recursive: true });
      outPath = path.join(outDir, naturalFilename(spec.topic, "pdf"));
      fs.writeFileSync(outPath, pdf);
    } catch (err) {
      if (err && err.physicalPageMismatch) throw err;
      fs.mkdirSync(outDir, { recursive: true });
      outPath = path.join(outDir, naturalFilename(spec.topic, "html"));
      fs.writeFileSync(outPath, html);
      console.log(`PDF_SKIPPED: ${err && err.message ? err.message.split("\n")[0] : err}`);
    }
    console.log(`Built: ${outPath}`);
    console.log(`Cards: ${cards.length}`);
    return outPath;
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  } finally {
    console.warn = originalWarn;
  }
}

// ─── Physical page check ────────────────────────────────────────────────
//
// The sheets that come off the printer must be the sheets the cards asked for.
// This used to be the working-wall-builder agent's job: it ran this script by
// hand, rendered the result to images and looked at them. Every other printable
// resource is built by one shared command with no agent, and the wall now joins
// them, so the part a machine can settle lives here and runs on every build.
//
// The fault it exists for: a card whose text overran its page pushed the
// remainder onto a second A3 sheet holding nothing but "times the place to its
// right." in a box. The build said `Built:` and nobody compared the pages laid
// out with the pages the file actually held.

function pdfPageCount(buf) {
  // `/Type /Page` is a sheet and `/Type /Pages` is the tree that owns them, so
  // the trailing character is what tells them apart. Chrome writes these object
  // headers uncompressed, which is what makes reading them from the bytes work.
  const matches = buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 0;
}

function assertPhysicalPages(pdf, laidOut) {
  const printed = pdfPageCount(pdf);
  // Zero means the count could not be read, not that the file is empty. A wall
  // that is otherwise sound is not withheld because this one check went blind.
  if (printed === 0 || printed === laidOut) return;
  const err = new Error(
    `The cards laid out ${laidOut} page(s) and the PDF holds ${printed} page(s). ` +
      (printed > laidOut
        ? `A card has overrun its page and pushed the rest onto a sheet of its own. ` +
          `Shorten the card that overflowed, or give its page fewer items.`
        : `A page was lost between the layout and the print.`)
  );
  err.physicalPageMismatch = true;
  throw err;
}

module.exports = { build, assertRequiredPhotosAreReadable, pdfPageCount, assertPhysicalPages };

if (require.main === module) {
  const args = process.argv.slice(2);
  const validateOnly = args.includes("--validate-only");
  const [specPath, outDirArg] = args.filter((arg) => arg !== "--validate-only");
  if (!specPath) {
    console.error("Usage: node build.js <working-wall.json> [output-dir] [--validate-only]");
    process.exit(1);
  }
  const outDir = outDirArg ? path.resolve(outDirArg) : path.dirname(path.resolve(specPath));
  build(path.resolve(specPath), outDir, { validateOnly }).catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
