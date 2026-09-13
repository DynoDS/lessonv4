#!/usr/bin/env node
'use strict';

// Standalone pre-build check of a lesson.json slide spec.
//
// This remains the fast standalone schema/spec check. The slide-designer's
// final gate is check-slide-design.js, which runs the full scratch build and
// reaches this same validation through build.js before reporting done. Use this
// command when only the JSON contract needs checking; build.js remains the
// backstop on every real or scratch build.
//
// Run: node builder/scripts/check-lesson.js <path>/lesson.json
// Exit 0 = spec OK (warnings, if any, are printed); exit 1 = problems listed.

const fs = require('fs');
const path = require('path');
const { validateLesson, friendlyParseError } = require('../src/validate');
const { expandTeachLayouts, TeachLayoutError } = require('../src/teach-layouts');

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node check-lesson.js <lesson.json>');
  process.exit(1);
}
const jsonPath = path.resolve(arg);
if (!fs.existsSync(jsonPath)) {
  console.error(`Not found: ${jsonPath}`);
  process.exit(1);
}

const source = fs.readFileSync(jsonPath, 'utf8');
let lesson;
try {
  lesson = JSON.parse(source);
} catch (err) {
  console.error(friendlyParseError(jsonPath, source, err));
  process.exit(1);
}

try {
  lesson = expandTeachLayouts(lesson);
} catch (err) {
  if (!(err instanceof TeachLayoutError)) throw err;
  console.error(`TEACH_LAYOUT_INVALID: ${err.message}`);
  process.exit(1);
}

const { errors, warnings } = validateLesson(lesson, path.dirname(jsonPath));
warnings.forEach((w) => console.log('  ! ' + w));
if (errors.length) {
  console.error(`\n${errors.length} problem(s) in ${path.basename(jsonPath)} — fix the spec before building:`);
  errors.forEach((e) => console.error('  ✗ ' + e));
  process.exit(1);
}
const count = Array.isArray(lesson.slides) ? lesson.slides.length : 0;
console.log(`Spec OK: ${count} slides, no blocking problems${warnings.length ? `, ${warnings.length} warning(s) above` : ''}.`);
