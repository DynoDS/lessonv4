'use strict';

// An intentionally unfinished slide file must not become a deck.
//
// The slide-designer sometimes has to stop: a beat needs a photograph that has
// not arrived, or a helper that cannot show what the lesson needs. Rather than
// invent something to fill the gap, it saves its work in progress privately and
// marks what is blocked. That is the right behaviour - and it means a file
// exists on disk that LOOKS like a finished lesson and is not one.
//
// Two markers say so, and they are the two the slide-designer actually writes:
//
//   lesson.checkpoint              at the root, describing why work stopped
//   slide.checkpointBlocked === true   on each placeholder standing in for a
//                                  beat that could not be finished
//
// Both are removed by the designer when the work is completed. So finding
// either at build time means the checkpoint was never resumed, and the deck
// would ship with placeholders in it.
//
// This reports the state and stops. It does not delete the markers (that would
// publish the placeholders) and it does not try to fill the gap (that would be
// the builder writing the lesson).

function slideCheckpointState(lesson) {
  if (!lesson || typeof lesson !== 'object') return null;

  const rootCheckpoint = lesson.checkpoint || null;

  const blockedSlides = Array.isArray(lesson.slides)
    ? lesson.slides
        .map((slide, index) => {
          // Strictly `true`. A nested field called `checkpoint` somewhere inside
          // ordinary slide content is not a marker, and treating it as one would
          // invent a third contract nobody writes to.
          if (!slide || slide.checkpointBlocked !== true) return null;

          return {
            slide: index + 1,
            designBeat:
              slide.designBeat == null ? null : String(slide.designBeat),
            need: slide.need == null ? null : String(slide.need),
          };
        })
        .filter(Boolean)
    : [];

  if (!rootCheckpoint && blockedSlides.length === 0) return null;

  return { rootCheckpoint, blockedSlides };
}

function checkpointMessage(state) {
  const parts = [];

  if (state.rootCheckpoint) {
    const status =
      state.rootCheckpoint &&
      typeof state.rootCheckpoint === 'object' &&
      state.rootCheckpoint.status
        ? String(state.rootCheckpoint.status)
        : 'present';

    parts.push(`root lesson.checkpoint (${status})`);
  }

  for (const blocked of state.blockedSlides) {
    let detail = `slide ${blocked.slide} checkpointBlocked=true`;
    if (blocked.designBeat) detail += `, designBeat=${JSON.stringify(blocked.designBeat)}`;
    if (blocked.need) detail += `, need=${JSON.stringify(blocked.need)}`;
    parts.push(detail);
  }

  return (
    'SLIDE_CHECKPOINT_INCOMPLETE: unfinished private slide checkpoint detected: ' +
    parts.join('; ') +
    '. Complete the blocked work and remove lesson.checkpoint and all ' +
    'checkpointBlocked placeholders before the final deck is built.'
  );
}

module.exports = {
  slideCheckpointState,
  checkpointMessage,
};
