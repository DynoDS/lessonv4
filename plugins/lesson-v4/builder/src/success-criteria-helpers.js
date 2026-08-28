'use strict';

// Pre-render and place Success Criteria Helpers. Requested shared SVGs are
// rasterised once before the slide loop, then placed by true aspect. `helper`
// is the preferred lesson-JSON field; `figure` remains a compatibility alias
// so every existing lesson continues to build unchanged.

const requireGlobal = require('./require-global');
const { warn } = require('./warnings');
const {
  isSuccessCriteriaHelperKey,
  buildSuccessCriteriaInline
} = require('../../shared/visuals/success-criteria-helper-catalogue');

const RENDER_PX = 240;

function helperKeyForStep(step) {
  if (!step || typeof step !== 'object' || Array.isArray(step)) return '';
  if (typeof step.helper === 'string') return step.helper;
  if (typeof step.figure === 'string') return step.figure;
  return '';
}

function requestedSuccessCriteriaHelpers(lesson) {
  const names = new Set();

  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node.type === 'steps' && Array.isArray(node.steps)) {
      node.steps.forEach(function (step) {
        const key = helperKeyForStep(step);
        if (key) names.add(key);
      });
    }
    // `teach-steps` keeps its steps at slide level rather than inside a content
    // object. Accept the identical item shape there too.
    if (node.template === 'teach-steps' && Array.isArray(node.steps)) {
      node.steps.forEach(function (step) {
        const key = helperKeyForStep(step);
        if (key) names.add(key);
      });
    }
    Object.keys(node).forEach(function (key) { walk(node[key]); });
  }

  walk(lesson);
  return Array.from(names);
}

async function preRenderSuccessCriteriaHelpers(lesson) {
  let sharp;
  try { sharp = requireGlobal('sharp'); } catch (err) { return {}; }

  const images = {};
  const names = requestedSuccessCriteriaHelpers(lesson);
  for (const name of names) {
    if (!isSuccessCriteriaHelperKey(name)) continue;
    const built = buildSuccessCriteriaInline(name);
    if (!built) continue;
    const resize = built.aspect >= 1 ? { width: RENDER_PX } : { height: RENDER_PX };
    try {
      const png = await sharp(Buffer.from(built.svg), { density: 192 }).resize(resize).png().toBuffer();
      images[name] = { png, aspect: built.aspect };
    } catch (err) {
      // drawSuccessCriteriaHelper reports the missing cue against its slide.
    }
  }
  return images;
}

function drawSuccessCriteriaHelper(slide, name, box, ctx) {
  const entry = ctx.successCriteriaHelperImages && ctx.successCriteriaHelperImages[name];
  if (!entry || !entry.png || !entry.aspect) {
    warn(ctx.slideIndex, `Success Criteria Helper "${name}" could not be rendered - the step text remains, but its visual cue is missing`);
    return false;
  }

  let w = box.w;
  let h = w / entry.aspect;
  if (h > box.h) {
    h = box.h;
    w = h * entry.aspect;
  }
  slide.addImage({
    data: 'image/png;base64,' + entry.png.toString('base64'),
    x: box.x + (box.w - w) / 2,
    y: box.y + (box.h - h) / 2,
    w,
    h
  });
  return true;
}

module.exports = {
  drawSuccessCriteriaHelper,
  helperKeyForStep,
  preRenderSuccessCriteriaHelpers,
  requestedSuccessCriteriaHelpers
};
