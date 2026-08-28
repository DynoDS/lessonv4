'use strict';

// Success Criteria Helper view of the shared visual catalogue.
//
// The ownership metadata lives on the logical drawing entries in
// shared/visual-parity.js. This module is only a read-only projection for the
// builder: it flattens those entries, loads the owning shared SVG module, and
// builds the requested inline treatment. Keeping the helper keys beside their
// full-size primitive prevents a second catalogue from drifting into a separate
// library of lookalike Success Criteria drawings.

const path = require('path');
const { PRIMITIVES, SUCCESS_CRITERIA_AUDIT } = require('../visual-parity');

const VALID_MODES = new Set(['both', 'SC-inline']);
const VALID_TREATMENTS = new Set(['reuse', 'simplified']);
const VALID_AUDIT_CLASSIFICATIONS = new Set(['both', 'SC-inline', 'full-size', 'unsuitable']);

function freezeCopy(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freezeCopy));
  return Object.freeze(Object.fromEntries(
    Object.entries(value).map(function (entry) { return [entry[0], freezeCopy(entry[1])]; })
  ));
}

function geometryModuleFor(source) {
  const prefix = 'shared/visuals/';
  if (typeof source !== 'string' || !source.startsWith(prefix)) {
    throw new Error('Success Criteria Helper geometry must live in shared/visuals/: ' + source);
  }
  const localName = source.slice(prefix.length);
  if (path.basename(localName) !== localName || !localName.endsWith('.js')) {
    throw new Error('Invalid shared geometry source: ' + source);
  }
  return require('./' + localName);
}

function buildInlineFromMetadata(primitive, helper) {
  const module = geometryModuleFor(primitive.geometrySource);
  const inline = helper.inline || {};
  const method = inline.method || 'tightSvg';
  if (typeof module[method] !== 'function') {
    throw new Error(`${primitive.geometrySource} does not export ${method} for Success Criteria Helper "${helper.key}"`);
  }
  const built = module[method](Object.assign({}, inline.spec || {}));
  const valid = built && typeof built.svg === 'string' && built.svg.includes('<svg') &&
    Number.isFinite(built.aspect) && built.aspect > 0 &&
    Number.isFinite(built.w) && built.w > 0 &&
    Number.isFinite(built.h) && built.h > 0;
  if (!valid) {
    throw new Error(`${primitive.geometrySource}.${method} did not return measured SVG geometry for Success Criteria Helper "${helper.key}"`);
  }
  const measuredAspect = built.w / built.h;
  if (Math.abs(measuredAspect - built.aspect) > 0.01) {
    throw new Error(`${primitive.geometrySource}.${method} returned inconsistent dimensions for Success Criteria Helper "${helper.key}"`);
  }
  return built;
}

const primitiveIds = new Set(PRIMITIVES.map(function (primitive) { return primitive.id; }));
Object.keys(SUCCESS_CRITERIA_AUDIT).forEach(function (id) {
  if (!primitiveIds.has(id)) throw new Error(`Success Criteria audit names unknown visual primitive "${id}"`);
});
PRIMITIVES.forEach(function (primitive) {
  const audit = SUCCESS_CRITERIA_AUDIT[primitive.id];
  if (!audit || !VALID_AUDIT_CLASSIFICATIONS.has(audit.classification) || typeof audit.reason !== 'string' || !audit.reason.trim()) {
    throw new Error(`Visual primitive "${primitive.id}" has no complete Success Criteria audit decision`);
  }
  const helpers = Array.isArray(primitive.successCriteriaHelpers) ? primitive.successCriteriaHelpers : [];
  if (audit.classification === 'full-size' || audit.classification === 'unsuitable') {
    if (helpers.length) throw new Error(`Visual primitive "${primitive.id}" is ${audit.classification} but declares Success Criteria Helpers`);
  } else {
    if (!helpers.length) throw new Error(`Visual primitive "${primitive.id}" is ${audit.classification} but declares no Success Criteria Helpers`);
    if (helpers.some(function (helper) { return helper.mode !== audit.classification; })) {
      throw new Error(`Visual primitive "${primitive.id}" audit classification does not match its helper modes`);
    }
  }
});

const seenKeys = new Set();
const ENTRIES = Object.freeze(PRIMITIVES.flatMap(function (primitive) {
  const helpers = Array.isArray(primitive.successCriteriaHelpers)
    ? primitive.successCriteriaHelpers : [];
  return helpers.map(function (helper) {
    const key = typeof helper.key === 'string' ? helper.key.trim() : '';
    if (!key) throw new Error(`Success Criteria Helper on "${primitive.id}" has no key`);
    if (seenKeys.has(key)) throw new Error(`Duplicate Success Criteria Helper key "${key}" in shared visual catalogue`);
    seenKeys.add(key);
    if (!VALID_MODES.has(helper.mode)) {
      throw new Error(`Success Criteria Helper "${key}" must be classified as "both" or "SC-inline"`);
    }
    if (helper.mode === 'both' && (!helper.fullSize || typeof helper.fullSize.type !== 'string')) {
      throw new Error(`Success Criteria Helper "${key}" is "both" but has no full-size content specification`);
    }
    if (helper.mode === 'SC-inline' && helper.fullSize != null) {
      throw new Error(`Success Criteria Helper "${key}" is SC-inline-only but declares a full-size content specification`);
    }
    if (!helper.inline || !VALID_TREATMENTS.has(helper.inline.treatment)) {
      throw new Error(`Success Criteria Helper "${key}" must declare an inline treatment of "reuse" or "simplified"`);
    }
    // Resolve the module now so a catalogue entry cannot point at a missing or
    // non-shared drawing and fail only when a lesson happens to request it.
    geometryModuleFor(primitive.geometrySource);
    const entry = {
      key,
      mode: helper.mode,
      geometry: primitive.id,
      geometrySource: primitive.geometrySource,
      fullSize: freezeCopy(helper.fullSize),
      inlineTreatment: helper.inline && helper.inline.treatment,
      inlineSpec: freezeCopy(helper.inline && helper.inline.spec),
      inline: function () { return buildInlineFromMetadata(primitive, helper); }
    };
    return Object.freeze(entry);
  });
}));

const BY_KEY = new Map(ENTRIES.map(function (entry) { return [entry.key, entry]; }));
const SUCCESS_CRITERIA_HELPER_KEYS = Object.freeze(ENTRIES.map(function (entry) { return entry.key; }));

function getSuccessCriteriaHelper(key) {
  return BY_KEY.get(String(key || '')) || null;
}

function isSuccessCriteriaHelperKey(key) {
  return BY_KEY.has(String(key || ''));
}

function buildSuccessCriteriaInline(key) {
  const entry = getSuccessCriteriaHelper(key);
  return entry && entry.inline ? entry.inline() : null;
}

function fullSizeContentFor(key, overrides) {
  const entry = getSuccessCriteriaHelper(key);
  if (!entry || !entry.fullSize) return null;
  return Object.assign({}, entry.fullSize, overrides || {});
}

module.exports = {
  SUCCESS_CRITERIA_HELPERS: ENTRIES,
  SUCCESS_CRITERIA_HELPER_KEYS,
  getSuccessCriteriaHelper,
  isSuccessCriteriaHelperKey,
  buildSuccessCriteriaInline,
  fullSizeContentFor
};
