"use strict";

const fs = require("node:fs");
const path = require("node:path");

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EDUCATIONAL_SVG_ID_RE = /^(?:standard|cartoon|solid|inkbrush|blockprint)\/[a-z0-9]{1,2}\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/;
const SEMANTIC_KEYS = new Set([
  "type",
  "kind",
  "concept",
  "context",
  "avoid",
  "alt",
  "educationalSvgId",
  "educationalSvgSlug",
  "imagePath",
]);

function isWithin(base, candidate) {
  const relative = path.relative(base, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

function confinedEducationalSvgPngPath(baseDir, owner) {
  if (!baseDir || !owner || typeof owner !== "object" || Array.isArray(owner)) {
    return null;
  }

  const slug =
    typeof owner.educationalSvgSlug === "string" ? owner.educationalSvgSlug.trim() : "";
  const imagePath =
    typeof owner.imagePath === "string" ? owner.imagePath.trim() : "";

  if (!SLUG_RE.test(slug)) return null;
  if (imagePath !== `icons/${slug}.png`) return null;
  if (path.isAbsolute(imagePath)) return null;

  const baseAbsolute = path.resolve(baseDir);
  const candidate = path.resolve(baseAbsolute, imagePath);
  if (!isWithin(baseAbsolute, candidate)) return null;

  if (!fs.existsSync(candidate)) return candidate;

  try {
    const baseReal = fs.realpathSync(baseAbsolute);
    const candidateReal = fs.realpathSync(candidate);
    return isWithin(baseReal, candidateReal) ? candidateReal : null;
  } catch (_) {
    return null;
  }
}

function readPngInfo(filePath) {
  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (_) {
    return null;
  }

  if (buffer.length < 24) return null;
  if (buffer.readUInt32BE(0) !== 0x89504e47) return null;
  if (buffer.toString("ascii", 1, 4) !== "PNG") return null;

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (!(width > 0) || !(height > 0)) return null;

  return { buffer, width, height };
}

function validateStringArray(value, maxItems, maxLength) {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every(
      (entry) =>
        typeof entry === "string" &&
        entry.trim() !== "" &&
        entry.trim().length <= maxLength
    )
  );
}

function validateSemanticEducationalSvgVisual(visual, baseDir, label) {
  if (
    !visual ||
    typeof visual !== "object" ||
    Array.isArray(visual) ||
    visual.type !== "image" ||
    visual.kind !== "educational-svg"
  ) {
    return { applies: false, error: null, resolvedPath: null };
  }

  const prefix = label || "vocabulary visual";
  const unknown = Object.keys(visual).filter((key) => !SEMANTIC_KEYS.has(key));
  if (unknown.length) {
    return {
      applies: true,
      error: `${prefix}: semantic Educational SVG visual has unsupported field(s): ${unknown.join(
        ", "
      )}.`,
      resolvedPath: null,
    };
  }

  for (const field of ["concept", "context", "alt"]) {
    if (typeof visual[field] !== "string" || !visual[field].trim()) {
      return {
        applies: true,
        error: `${prefix}: semantic Educational SVG ${field} is required.`,
        resolvedPath: null,
      };
    }
  }

  if (visual.concept.trim().length > 120) {
    return {
      applies: true,
      error: `${prefix}: semantic Educational SVG concept must be at most 120 characters.`,
      resolvedPath: null,
    };
  }
  if (visual.context.trim().length > 400) {
    return {
      applies: true,
      error: `${prefix}: semantic Educational SVG context must be at most 400 characters.`,
      resolvedPath: null,
    };
  }
  if (visual.alt.trim().length > 160) {
    return {
      applies: true,
      error: `${prefix}: semantic Educational SVG alt must be at most 160 characters.`,
      resolvedPath: null,
    };
  }
  if (
    visual.avoid !== undefined &&
    !validateStringArray(visual.avoid, 8, 120)
  ) {
    return {
      applies: true,
      error: `${prefix}: semantic Educational SVG avoid must be an array of at most 8 non-empty strings, each at most 120 characters.`,
      resolvedPath: null,
    };
  }

  const hasId =
    typeof visual.educationalSvgId === "string" &&
    visual.educationalSvgId.trim() !== "";
  const hasSlug =
    typeof visual.educationalSvgSlug === "string" && visual.educationalSvgSlug.trim() !== "";
  const hasPath =
    typeof visual.imagePath === "string" && visual.imagePath.trim() !== "";

  if (new Set([hasId, hasSlug, hasPath]).size !== 1) {
    return {
      applies: true,
      error: `${prefix}: educationalSvgId, educationalSvgSlug and imagePath must either all be present or all be absent.`,
      resolvedPath: null,
    };
  }

  if (!hasId) {
    return { applies: true, error: null, resolvedPath: null };
  }

  if (!EDUCATIONAL_SVG_ID_RE.test(visual.educationalSvgId.trim())) {
    return {
      applies: true,
      error: `${prefix}: educationalSvgId must be a stable library path such as standard/ca/candle-lit.svg.`,
      resolvedPath: null,
    };
  }

  const resolvedPath = confinedEducationalSvgPngPath(baseDir, visual);
  if (!resolvedPath) {
    return {
      applies: true,
      error: `${prefix}: resolved Educational SVG path must be icons/<educationalSvgSlug>.png inside the lesson working directory.`,
      resolvedPath: null,
    };
  }

  return { applies: true, error: null, resolvedPath };
}

module.exports = {
  EDUCATIONAL_SVG_ID_RE,
  SLUG_RE,
  confinedEducationalSvgPngPath,
  readPngInfo,
  validateSemanticEducationalSvgVisual,
};
