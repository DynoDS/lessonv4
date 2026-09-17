#!/usr/bin/env node
"use strict";

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
const { htmlToPdf } = require("../worksheet-html/src/chrome");
const { PAGE_CSS } = require("./src/shared");
const { tryReadPhoto } = require("./src/layout");
const { renderSectionHeading, renderLabelledDiagram, renderMnemonicPoster, renderBanner } = require("./src/render-display");
const { renderStickyKnowledge, renderVocabDefinition, renderWorkedExample, renderSentenceStem, renderMisconception } = require("./src/render-panels");
const { renderReferenceTable, renderEquivalenceGrid, renderVocabChips } = require("./src/render-grids");
const { renderPhotoMapOverview, renderHeroCallouts, renderCauseCards } = require("./src/render-overview");
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
    const svgImages = await preRenderSvgs(spec, specDir);
    const ctx = { svgImages };

    // A renderer returns either a single page-inner HTML string, or an ARRAY
    // of them for a card that spans several physical pages (mnemonicPoster,
    // banner) - every page in that array shares the one card's page config.
    // flatMap turns each card into 1-or-more page divs, so total page count
    // is sum(Array.isArray(r) ? r.length : 1) over all cards.
    const pageDivs = cards.flatMap((card, cardIndex) => {
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

      const result = renderer(card, style, specDir, ctx);
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

    if (layoutWarnings.length > 0) {
      throw new Error(`Layout validation failed:\n${layoutWarnings.join("\n")}`);
    }

    for (const notice of optionalVisuals.notices) {
      console.log(notice);
    }

    if (options.validateOnly) {
      console.log(`WORKING_WALL_LAYOUT_OK: ${cards.length} card(s), ${pageDivs.length} page(s)`);
      return null;
    }

    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${PAGE_CSS}</style></head><body>${pageDivs.join("")}</body></html>`;

    let outPath;
    try {
      const pdf = await htmlToPdf(html, {});
      assertPhysicalPages(pdf, pageDivs.length);
      outPath = path.join(outDir, naturalFilename(spec.topic, "pdf"));
      fs.writeFileSync(outPath, pdf);
    } catch (err) {
      if (err && err.physicalPageMismatch) throw err;
      outPath = path.join(outDir, naturalFilename(spec.topic, "html"));
      fs.writeFileSync(outPath, html);
      console.log(`PDF_SKIPPED: ${err && err.message ? err.message.split("\n")[0] : err}`);
    }
    console.log(`Built: ${outPath}`);
    console.log(`Cards: ${cards.length}`);
    return outPath;
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
