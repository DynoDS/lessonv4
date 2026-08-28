'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { slideCheckpointState, checkpointMessage } = require('../src/slide-checkpoint');

test('an ordinary finished lesson has no checkpoint state', () => {
  assert.equal(
    slideCheckpointState({ slides: [{ template: 'title' }, { template: 'teach' }] }),
    null
  );
});

test('a root lesson.checkpoint on its own is enough to stop the build', () => {
  const state = slideCheckpointState({
    checkpoint: { status: 'SLIDE_CONTENT_GAP' },
    slides: [{ template: 'title' }],
  });

  assert.ok(state);
  assert.deepEqual(state.blockedSlides, []);
  assert.match(checkpointMessage(state), /SLIDE_CHECKPOINT_INCOMPLETE/);
  assert.match(checkpointMessage(state), /SLIDE_CONTENT_GAP/);
});

test('one blocked placeholder is reported with its exact slide number', () => {
  const state = slideCheckpointState({
    slides: [{ template: 'title' }, { checkpointBlocked: true }],
  });

  assert.equal(state.blockedSlides.length, 1);
  assert.equal(state.blockedSlides[0].slide, 2);
});

test('every blocked placeholder is reported, not just the first', () => {
  const state = slideCheckpointState({
    slides: [
      { checkpointBlocked: true },
      { template: 'teach' },
      { checkpointBlocked: true },
    ],
  });

  assert.deepEqual(
    state.blockedSlides.map((b) => b.slide),
    [1, 3]
  );
});

test('designBeat and need survive into the diagnostic', () => {
  const state = slideCheckpointState({
    slides: [
      {
        checkpointBlocked: true,
        designBeat: 'Starter',
        need: 'The map helper must shade Brazil.',
      },
    ],
  });

  const message = checkpointMessage(state);
  assert.match(message, /Starter/);
  assert.match(message, /shade Brazil/);
});

test('a root checkpoint and blocked slides are both reported together', () => {
  const state = slideCheckpointState({
    checkpoint: { status: 'SLIDE_CONTENT_GAP' },
    slides: [{ checkpointBlocked: true, designBeat: 'Starter' }],
  });

  const message = checkpointMessage(state);
  assert.match(message, /root lesson\.checkpoint/);
  assert.match(message, /slide 1 checkpointBlocked=true/);
});

test('a completed lesson passes once the markers have been removed', () => {
  // What resuming a checkpoint produces: the placeholders replaced by real
  // slides, the root checkpoint gone.
  assert.equal(
    slideCheckpointState({
      slides: [{ template: 'title' }, { template: 'teach', designBeat: 'Starter' }],
    }),
    null
  );
});

test('a nested field called checkpoint in ordinary content is not a marker', () => {
  // Only the two real markers count. Treating any nested "checkpoint" as one
  // would invent a third contract nobody writes to.
  assert.equal(
    slideCheckpointState({
      slides: [{ template: 'teach', content: { type: 'text', checkpoint: 'discuss here' } }],
    }),
    null
  );
});

test('checkpointBlocked must be exactly true, not merely truthy', () => {
  assert.equal(
    slideCheckpointState({ slides: [{ checkpointBlocked: 'no' }] }),
    null
  );
});
