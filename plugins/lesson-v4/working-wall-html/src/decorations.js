"use strict";

const fs = require("node:fs");

const {
  WALL_DECORATION_TYPES,
  inspectDecorations,
  fitContainedDecoration,
  rotatedRectIntersectsRect,
  opacityForTransparency,
} = require("../../shared/decorations");
const {
  confinedEducationalSvgPngPath,
  readPngInfo,
  validateSemanticEducationalSvgVisual,
} = require("../../shared/educational-svg-asset");

function pageSizeMm(orientation) {
  return orientation === "landscape"
    ? { width: 420, height: 297 }
    : { width: 297, height: 420 };
}

function prepareVocabularyVisual(card, cardIndex, baseDir, notices) {
  if (!card || card.type !== "vocabDefinition" || !card.visual) return;

  const checked = validateSemanticEducationalSvgVisual(
    card.visual,
    baseDir,
    `card ${cardIndex + 1} vocabDefinition`
  );
  if (!checked.applies) return;
  if (checked.error) {
    throw new Error(`VOCAB_EDUCATIONAL_SVG_INVALID: ${checked.error}`);
  }

  if (!card.visual.imagePath) {
    throw new Error(
      `VOCAB_EDUCATIONAL_SVG_UNRESOLVED: card ${cardIndex + 1} vocabDefinition: semantic Educational SVG visual must be resolved or the card removed before Working Wall build.`
    );
  }

  if (!checked.resolvedPath || !fs.existsSync(checked.resolvedPath)) {
    throw new Error(
      `VOCAB_EDUCATIONAL_SVG_MISSING: card ${cardIndex + 1} vocabDefinition: no readable local PNG at "${card.visual.imagePath}".`
    );
  }

  const info = readPngInfo(checked.resolvedPath);
  if (!info) {
    throw new Error(
      `VOCAB_EDUCATIONAL_SVG_UNREADABLE: card ${cardIndex + 1} vocabDefinition: "${card.visual.imagePath}" is not a readable PNG.`
    );
  }

  Object.defineProperty(card.visual, "_educationalSvgBuffer", {
    value: info.buffer,
    enumerable: false,
  });
  Object.defineProperty(card.visual, "_educationalSvgAspect", {
    value: info.width / info.height,
    enumerable: false,
  });
}

function prepareWorkingWallOptionalImages(cards, baseDir, marginMm) {
  const notices = [];
  const decorationPlans = new Map();

  cards.forEach((card, index) => {
    prepareVocabularyVisual(card, index, baseDir, notices);

    const supported = !!card && WALL_DECORATION_TYPES.includes(card.type);
    const checked = inspectDecorations(card && card.decorations, {
      surface: "working-wall",
      supported,
      baseDir,
      label: `card ${index + 1} ${card && card.type ? card.type : "unknown"}`,
    });
    notices.push(...checked.warnings);

    const plan = { low: [], high: [] };
    if (!card || !card.page || card.page.size !== "A3") {
      decorationPlans.set(index, plan);
      return;
    }

    const page = pageSizeMm(card.page.orientation);
    const physical = { x: 0, y: 0, width: page.width, height: page.height };
    const safe = {
      x: marginMm,
      y: marginMm,
      width: page.width - marginMm * 2,
      height: page.height - marginMm * 2,
    };

    for (const decoration of checked.decorations) {
      const here = `card ${index + 1} ${card.type}: decoration "${decoration.id}"`;
      if (!decoration.imagePath) {
        notices.push(
          `OPTIONAL_DECORATION_OMITTED: ${here} is unresolved; the page continues without it.`
        );
        continue;
      }

      const absolute = confinedEducationalSvgPngPath(baseDir, decoration);
      if (!absolute || !fs.existsSync(absolute)) {
        notices.push(
          `OPTIONAL_DECORATION_OMITTED: ${here} has no readable local PNG at "${decoration.imagePath}".`
        );
        continue;
      }

      const info = readPngInfo(absolute);
      if (!info) {
        notices.push(
          `OPTIONAL_DECORATION_OMITTED: ${here} is not a readable PNG.`
        );
        continue;
      }

      const fitted = fitContainedDecoration(
        decoration,
        page.width,
        page.height,
        info.width,
        info.height
      );
      if (!fitted || !rotatedRectIntersectsRect(fitted, physical)) {
        notices.push(
          `OPTIONAL_DECORATION_OMITTED: ${here} is completely outside the physical page after contain-fit and rotation.`
        );
        continue;
      }
      if (!rotatedRectIntersectsRect(fitted, safe)) {
        notices.push(
          `OPTIONAL_DECORATION_OMITTED: ${here} touches only the printer-edge margin and has no print-safe visible area.`
        );
        continue;
      }

      plan[decoration.layer].push({
        ...fitted,
        id: decoration.id,
        href: `data:image/png;base64,${info.buffer.toString("base64")}`,
      });
    }

    decorationPlans.set(index, plan);
  });

  return { decorationPlans, notices };
}

function escAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderWorkingWallDecorationLayers(plan) {
  const render = (layer) => {
    const images = ((plan && plan[layer]) || [])
      .map((decoration) => {
        const style = [
          `left:${decoration.x}mm`,
          `top:${decoration.y}mm`,
          `width:${decoration.width}mm`,
          `height:${decoration.height}mm`,
          `transform:rotate(${decoration.rotation}deg)`,
          `opacity:${opacityForTransparency(decoration.transparency)}`,
        ].join(";");
        return `<img class="decoration" data-decoration-id="${escAttr(
          decoration.id
        )}" src="${escAttr(
          decoration.href
        )}" alt="" aria-hidden="true" role="presentation" style="${style}">`;
      })
      .join("");

    return `<div class="decoration-layer decoration-layer--${layer}" data-decoration-layer="${layer}" aria-hidden="true">${images}</div>`;
  };

  return { low: render("low"), high: render("high") };
}

function wrapWorkingWallPage(
  orientationClass,
  pagePaddingMm,
  innerHtml,
  plan
) {
  const layers = renderWorkingWallDecorationLayers(plan);
  return (
    `<div class="page ${orientationClass}">` +
    layers.low +
    `<div class="page-core" style="padding:${pagePaddingMm}mm">${innerHtml}</div>` +
    layers.high +
    `</div>`
  );
}

module.exports = {
  prepareWorkingWallOptionalImages,
  renderWorkingWallDecorationLayers,
  wrapWorkingWallPage,
};
