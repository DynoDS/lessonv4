'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { validateLesson } = require('../src/validate');

function withPhotoContractTest(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-frozen-photo-'));
  const previousPath = process.env.PHOTO_REQUIREMENTS_PATH;

  try {
    run(root);
  } finally {
    if (previousPath === undefined) {
      delete process.env.PHOTO_REQUIREMENTS_PATH;
    } else {
      process.env.PHOTO_REQUIREMENTS_PATH = previousPath;
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function lessonWithPhoto(filename) {
  return {
    lessonName: 'Frozen photograph contract',
    slides: [
      {
        template: 'body-full',
        title: 'Evidence',
        imagePath: filename,
      },
    ],
  };
}

test('the exact frozen contract overrides a different sibling file', () => {
  withPhotoContractTest((root) => {
    const frozenPath = path.join(root, 'frozen-photo-requirements.json');
    fs.writeFileSync(
      path.join(root, 'photo-requirements.json'),
      JSON.stringify({ photos: [{ filename: 'wrong.jpg' }] })
    );
    fs.writeFileSync(
      frozenPath,
      JSON.stringify({ photos: [{ filename: 'right.jpg' }] })
    );

    process.env.PHOTO_REQUIREMENTS_PATH = frozenPath;
    const result = validateLesson(lessonWithPhoto('right.jpg'), root);

    assert.equal(result.errors.length, 0);
  });
});

test('a missing exact frozen contract blocks validation', () => {
  withPhotoContractTest((root) => {
    process.env.PHOTO_REQUIREMENTS_PATH = path.join(root, 'missing.json');
    const result = validateLesson(lessonWithPhoto('right.jpg'), root);

    assert.equal(
      result.errors.some((item) => item.startsWith('PHOTO_REQUIREMENTS_NOT_FOUND:')),
      true
    );
  });
});

test('an invalid exact frozen contract blocks validation', () => {
  withPhotoContractTest((root) => {
    const frozenPath = path.join(root, 'invalid.json');
    fs.writeFileSync(frozenPath, '{"photos": [}');
    process.env.PHOTO_REQUIREMENTS_PATH = frozenPath;
    const result = validateLesson(lessonWithPhoto('right.jpg'), root);

    assert.equal(
      result.errors.some((item) => item.startsWith('PHOTO_REQUIREMENTS_INVALID:')),
      true
    );
  });
});
