"use strict";

const fs = require("node:fs");

const { pageSize, DEFAULT_MARGIN_MM } = require("./page");
const { embedImage } = require("./images");
const {
  inspectDecorations,
  fitContainedDecoration,
  rotatedRectIntersectsRect,
  opacityForTransparency,
} = require("../../shared/decorations");
const { confinedEducationalSvgPngPath } = require("../../shared/educational-svg-asset");

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function prepareCollection(raw, orientation, baseDir, label, warnings) {
  const checked = inspectDecorations(raw, {
    surface: "worksheet",
    supported: true,
    baseDir,
    label,
  });
  warnings.push(...checked.warnings);

  const page = pageSize(orientation || "portrait");
  const physical = {
    x: 0,
    y: 0,
    width: page.widthMm,
    height: page.heightMm,
  };
  const safe = {
    x: DEFAULT_MARGIN_MM,
    y: DEFAULT_MARGIN_MM,
    width: page.widthMm - DEFAULT_MARGIN_MM * 2,
    height: page.heightMm - DEFAULT_MARGIN_MM * 2,
  };
  const prepared = [];

  for (const decoration of checked.decorations) {
    const here = `${label}: decoration "${decoration.id}"`;
    if (!decoration.imagePath) {
      warnings.push(
        `OPTIONAL_DECORATION_OMITTED: ${here} is unresolved; the page continues without it.`
      );
      continue;
    }

    const absolute = confinedEducationalSvgPngPath(baseDir, decoration);
    if (!absolute || !fs.existsSync(absolute)) {
      warnings.push(
        `OPTIONAL_DECORATION_OMITTED: ${here} has no readable local PNG at "${decoration.imagePath}".`
      );
      continue;
    }

    let image;
    try {
      image = embedImage(absolute);
    } catch (error) {
      warnings.push(
        `OPTIONAL_DECORATION_OMITTED: ${here} could not be embedded (${error.message}).`
      );
      continue;
    }

    const fitted = fitContainedDecoration(
      decoration,
      page.widthMm,
      page.heightMm,
      image.width,
      image.height
    );
    if (!fitted || !rotatedRectIntersectsRect(fitted, physical)) {
      warnings.push(
        `OPTIONAL_DECORATION_OMITTED: ${here} is completely outside the physical page after contain-fit and rotation.`
      );
      continue;
    }
    if (!rotatedRectIntersectsRect(fitted, safe)) {
      warnings.push(
        `OPTIONAL_DECORATION_OMITTED: ${here} touches only the printer-edge margin and has no print-safe visible area.`
      );
      continue;
    }

    prepared.push({
      ...decoration,
      imageHref: image.href,
      imageWidth: image.width,
      imageHeight: image.height,
    });
  }

  return prepared;
}

function prepareWorksheetDecorations(worksheet, baseDir) {
  const output = cloneJson(worksheet);
  const warnings = [];

  for (const [key, sheet] of Object.entries(output.sheets || {})) {
    if (!sheet || typeof sheet !== "object" || Array.isArray(sheet)) continue;

    if (Array.isArray(sheet.pages)) {
      if (Object.prototype.hasOwnProperty.call(sheet, "decorations")) {
        warnings.push(
          `OPTIONAL_DECORATION_OMITTED: ${key}: two-page sheets put decorations on the individual page objects, not beside the pages array; sheet-level decorations were omitted.`
        );
        delete sheet.decorations;
      }

      sheet.pages.forEach((page, index) => {
        if (!page || typeof page !== "object" || Array.isArray(page)) return;
        page.decorations = prepareCollection(
          page.decorations,
          page.orientation || "portrait",
          baseDir,
          `${key} page ${index + 1}`,
          warnings
        );
      });
    } else {
      sheet.decorations = prepareCollection(
        sheet.decorations,
        sheet.orientation || "portrait",
        baseDir,
        `${key} page 1`,
        warnings
      );
    }
  }

  return { worksheet: output, warnings };
}

function escAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderDecorationLayers(decorations, page) {
  const grouped = { low: [], high: [] };

  for (const decoration of Array.isArray(decorations) ? decorations : []) {
    if (
      !decoration.imageHref ||
      !decoration.imageWidth ||
      !decoration.imageHeight
    ) {
      continue;
    }

    const fitted = fitContainedDecoration(
      decoration,
      page.widthMm,
      page.heightMm,
      decoration.imageWidth,
      decoration.imageHeight
    );
    if (!fitted) continue;

    const style = [
      `left:${fitted.x}mm`,
      `top:${fitted.y}mm`,
      `width:${fitted.width}mm`,
      `height:${fitted.height}mm`,
      `transform:rotate(${fitted.rotation}deg)`,
      `opacity:${opacityForTransparency(fitted.transparency)}`,
    ].join(";");

    grouped[decoration.layer].push(
      `<img class="decoration" data-decoration-id="${escAttr(
        decoration.id
      )}" src="${escAttr(
        decoration.imageHref
      )}" alt="" aria-hidden="true" role="presentation" style="${style}">`
    );
  }

  const wrap = (layer) =>
    `<div class="decoration-layer decoration-layer--${layer}" data-decoration-layer="${layer}" aria-hidden="true">${grouped[
      layer
    ].join("")}</div>`;

  return { low: wrap("low"), high: wrap("high") };
}

module.exports = {
  prepareWorksheetDecorations,
  renderDecorationLayers,
};
