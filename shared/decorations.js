"use strict";

const {
  EDUCATIONAL_SVG_ID_RE,
  confinedEducationalSvgPngPath,
} = require("./educational-svg-asset");

const DEFAULT_TRANSPARENCY = Object.freeze({
  slide: 50,
  worksheet: 20,
  "working-wall": 20,
});

const WALL_DECORATION_TYPES = Object.freeze([
  "stickyKnowledge",
  "workedExample",
  "sentenceStem",
  "misconception",
  "referenceTable",
  "equivalenceGrid",
]);

const ID_RE = /^decoration-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_KEYS = new Set([
  "id",
  "kind",
  "concept",
  "context",
  "avoid",
  "frame",
  "layer",
  "rotation",
  "transparency",
  "educationalSvgId",
  "educationalSvgSlug",
  "imagePath",
]);
const FRAME_KEYS = new Set(["x", "y", "width", "height"]);

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function withoutDecorations(value) {
  if (Array.isArray(value)) return value.map(withoutDecorations);
  if (!isPlainObject(value)) return value;

  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "decorations") continue;
    out[key] = withoutDecorations(child);
  }
  return out;
}

function omission(label, message) {
  return `OPTIONAL_DECORATION_OMITTED: ${label}: ${message}`;
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validAvoid(value) {
  return (
    Array.isArray(value) &&
    value.length <= 8 &&
    value.every(
      (entry) =>
        typeof entry === "string" &&
        entry.trim() !== "" &&
        entry.trim().length <= 120
    )
  );
}

function inspectDecorations(raw, options = {}) {
  const surface = options.surface || "slide";
  const supported = options.supported !== false;
  const label = options.label || surface;
  const baseDir = options.baseDir || null;
  const warnings = [];
  const decorations = [];

  if (raw === undefined) return { decorations, warnings };
  if (!supported) {
    warnings.push(
      omission(
        label,
        "`decorations` is not supported on this surface; the collection is omitted."
      )
    );
    return { decorations, warnings };
  }
  if (!Array.isArray(raw)) {
    warnings.push(
      omission(label, "`decorations` must be an array; the collection is omitted.")
    );
    return { decorations, warnings };
  }

  const counts = new Map();
  for (const item of raw) {
    if (!isPlainObject(item) || typeof item.id !== "string") continue;
    const id = item.id.trim();
    counts.set(id, (counts.get(id) || 0) + 1);
  }

  raw.forEach((item, index) => {
    const here = `${label} decorations[${index}]`;
    if (!isPlainObject(item)) {
      warnings.push(omission(here, "expected a JSON object."));
      return;
    }

    const id = typeof item.id === "string" ? item.id.trim() : "";
    if (!ID_RE.test(id) || id.length > 80) {
      warnings.push(
        omission(
          here,
          'id must match "decoration-<lowercase-kebab-case>" and be at most 80 characters.'
        )
      );
      return;
    }
    if ((counts.get(id) || 0) > 1) {
      warnings.push(
        omission(
          here,
          `id "${id}" is duplicated on this physical surface; every object with that id is omitted.`
        )
      );
      return;
    }

    const unknown = Object.keys(item).filter((key) => !ALLOWED_KEYS.has(key));
    if (unknown.length) {
      warnings.push(
        omission(here, `unsupported field(s): ${unknown.join(", ")}.`)
      );
      return;
    }
    if (item.kind !== "educational-svg") {
      warnings.push(
        omission(
          here,
          'kind must be exactly "educational-svg"; Priority 3 has no emoji, photo or AI route.'
        )
      );
      return;
    }

    const concept = typeof item.concept === "string" ? item.concept.trim() : "";
    const context = typeof item.context === "string" ? item.context.trim() : "";
    if (!concept || concept.length > 120) {
      warnings.push(
        omission(here, "concept is required and must be at most 120 characters.")
      );
      return;
    }
    if (!context || context.length > 400) {
      warnings.push(
        omission(here, "context is required and must be at most 400 characters.")
      );
      return;
    }

    let avoid = [];
    if (item.avoid !== undefined) {
      if (!validAvoid(item.avoid)) {
        warnings.push(
          omission(
            here,
            "avoid must be an array of at most 8 non-empty strings, each at most 120 characters."
          )
        );
        return;
      }
      avoid = item.avoid.map((entry) => entry.trim());
    }

    if (!isPlainObject(item.frame)) {
      warnings.push(
        omission(here, "frame must be an object with x, y, width and height.")
      );
      return;
    }
    const frameUnknown = Object.keys(item.frame).filter(
      (key) => !FRAME_KEYS.has(key)
    );
    if (frameUnknown.length || Object.keys(item.frame).length !== 4) {
      warnings.push(
        omission(here, "frame must contain exactly x, y, width and height.")
      );
      return;
    }

    const frame = {
      x: item.frame.x,
      y: item.frame.y,
      width: item.frame.width,
      height: item.frame.height,
    };
    if (![frame.x, frame.y, frame.width, frame.height].every(finiteNumber)) {
      warnings.push(
        omission(here, "frame coordinates and dimensions must be JSON numbers.")
      );
      return;
    }
    if (
      frame.x < -1.5 ||
      frame.x > 1.5 ||
      frame.y < -1.5 ||
      frame.y > 1.5
    ) {
      warnings.push(
        omission(here, "frame x and y must each be between -1.5 and 1.5 page units.")
      );
      return;
    }
    if (
      frame.width <= 0 ||
      frame.height <= 0 ||
      frame.width > 1.5 ||
      frame.height > 1.5
    ) {
      warnings.push(
        omission(
          here,
          "frame width and height must be greater than 0 and no greater than 1.5 page units."
        )
      );
      return;
    }

    if (item.layer !== "low" && item.layer !== "high") {
      warnings.push(omission(here, 'layer must be exactly "low" or "high".'));
      return;
    }

    const rotation = item.rotation === undefined ? 0 : item.rotation;
    if (!finiteNumber(rotation) || rotation < -180 || rotation > 180) {
      warnings.push(
        omission(
          here,
          "rotation must be a JSON number from -180 to 180 clockwise degrees."
        )
      );
      return;
    }

    const defaultTransparency = DEFAULT_TRANSPARENCY[surface];
    const transparency =
      item.transparency === undefined ? defaultTransparency : item.transparency;
    if (!finiteNumber(transparency) || transparency < 0 || transparency > 90) {
      warnings.push(
        omission(
          here,
          "transparency must be a JSON number from 0 to 90, where 0 is opaque."
        )
      );
      return;
    }

    const hasId =
      typeof item.educationalSvgId === "string" &&
      item.educationalSvgId.trim() !== "";
    const hasSlug =
      typeof item.educationalSvgSlug === "string" && item.educationalSvgSlug.trim() !== "";
    const hasPath =
      typeof item.imagePath === "string" && item.imagePath.trim() !== "";
    if (new Set([hasId, hasSlug, hasPath]).size !== 1) {
      warnings.push(
        omission(
          here,
          "educationalSvgId, educationalSvgSlug and imagePath must either all be present or all be absent."
        )
      );
      return;
    }
    if (hasId && !EDUCATIONAL_SVG_ID_RE.test(item.educationalSvgId.trim())) {
      warnings.push(
        omission(
          here,
          "educationalSvgId must be a stable library path such as standard/ca/candle-lit.svg."
        )
      );
      return;
    }
    if (hasId && !confinedEducationalSvgPngPath(baseDir, item)) {
      warnings.push(
        omission(
          here,
          "resolved source must be icons/<educationalSvgSlug>.png inside the lesson working directory."
        )
      );
      return;
    }

    decorations.push({
      ...item,
      id,
      concept,
      context,
      avoid,
      frame,
      rotation,
      transparency,
    });
  });

  return { decorations, warnings };
}

function fitContainedDecoration(
  decoration,
  pageWidth,
  pageHeight,
  naturalWidth,
  naturalHeight
) {
  if (
    ![pageWidth, pageHeight, naturalWidth, naturalHeight].every(
      (value) => finiteNumber(value) && value > 0
    )
  ) {
    return null;
  }

  const box = {
    x: decoration.frame.x * pageWidth,
    y: decoration.frame.y * pageHeight,
    width: decoration.frame.width * pageWidth,
    height: decoration.frame.height * pageHeight,
  };
  const scale = Math.min(
    box.width / naturalWidth,
    box.height / naturalHeight
  );
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;

  return {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
    rotation: decoration.rotation,
    transparency: decoration.transparency,
  };
}

function rotatedCorners(rect) {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const radians = ((rect.rotation || 0) * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);

  return [
    [-rect.width / 2, -rect.height / 2],
    [rect.width / 2, -rect.height / 2],
    [rect.width / 2, rect.height / 2],
    [-rect.width / 2, rect.height / 2],
  ].map(([dx, dy]) => ({
    x: cx + dx * cosine - dy * sine,
    y: cy + dx * sine + dy * cosine,
  }));
}

function rectCorners(rect) {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
}

function axesFor(polygon) {
  return polygon.map((point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    const dx = next.x - point.x;
    const dy = next.y - point.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: -dy / length, y: dx / length };
  });
}

function projection(polygon, axis) {
  const values = polygon.map(
    (point) => point.x * axis.x + point.y * axis.y
  );
  return { min: Math.min(...values), max: Math.max(...values) };
}

function polygonsIntersect(a, b) {
  for (const axis of [...axesFor(a), ...axesFor(b)]) {
    const projectionA = projection(a, axis);
    const projectionB = projection(b, axis);
    if (
      projectionA.max < projectionB.min ||
      projectionB.max < projectionA.min
    ) {
      return false;
    }
  }
  return true;
}

function rotatedRectIntersectsRect(rect, bounds) {
  return polygonsIntersect(rotatedCorners(rect), rectCorners(bounds));
}

function opacityForTransparency(transparency) {
  return (100 - transparency) / 100;
}

module.exports = {
  DEFAULT_TRANSPARENCY,
  WALL_DECORATION_TYPES,
  withoutDecorations,
  inspectDecorations,
  fitContainedDecoration,
  rotatedRectIntersectsRect,
  opacityForTransparency,
};
