'use strict';

const { itemText } = require('../content-picture');

function blocksIn(node, found, path = '', slideIndex = -1) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item, index) => blocksIn(item, found, `${path}[${index}]`, slideIndex));
    return;
  }
  if (node.revealPair) found.push({ block: node, path, slideIndex });
  Object.keys(node).forEach((key) => {
    if (key !== 'revealPair') blocksIn(node[key], found, `${path}.${key}`, slideIndex);
  });
}

// What a question slide and its answer slide may differ in besides the paired
// values: the header's own furniture. The pair exists so the board a child
// checks against does not move, and none of these moves it. The Do badge is
// added by the builder to the task slide alone, so comparing it refused every
// paired Do beat until the designer named the bolt on the answer slide too,
// which is the bolt the teacher then saw on answer slides (4 October 2026).
// The sign is a pencil on the question and a tick on the answer, and the cue
// beside it ("Answer on your own.") has no business on the answers.
// `settlePairedHeaders` keeps the two headers the same height.
const PAIR_HEADER_FURNITURE = ['title', 'heading', 'speakerNotes', 'notes', 'instruction', 'signal', 'doSign', 'pairedHeaderTwoLine'];

function staticSlide(node, root = false) {
  if (Array.isArray(node)) return node.map((item) => staticSlide(item));
  if (!node || typeof node !== 'object') return node;
  const out = {};
  Object.keys(node).sort().forEach((key) => {
    if (root && PAIR_HEADER_FURNITURE.includes(key)) return;
    if (node.revealPair) {
      if (key === 'revealPair') {
        out[key] = { id: node.revealPair.id, state: '[paired state]' };
        return;
      }
      if (key === 'questions' || (node.type === 'text' && ['value', 'text'].includes(key))) {
        out[key] = '[paired values]';
        return;
      }
    }
    out[key] = staticSlide(node[key]);
  });
  return out;
}

function pairedBlocks(data, ctx) {
  const declaration = data.revealPair;
  const id = declaration && declaration.id;
  const state = declaration && declaration.state;
  if (typeof id !== 'string' || !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(id) ||
      !['question', 'answer'].includes(state) || Object.keys(declaration).some((key) => !['id', 'state'].includes(key))) {
    throw new Error('REVEAL_PAIR_INVALID: revealPair needs only an alphanumeric id with optional internal hyphens and question/answer state.');
  }
  const blocks = [];
  const slides = ctx && ctx.lesson && ctx.lesson.slides;
  if (Array.isArray(slides)) slides.forEach((slide, index) => blocksIn(slide, blocks, '', index));
  const matches = blocks.filter((found) => found.block.revealPair.id === id);
  if (matches.length !== 2 || new Set(matches.map((found) => found.block.revealPair.state)).size !== 2) {
    throw new Error(`REVEAL_PAIR_INVALID: "${id}" needs exactly one question and one answer block.`);
  }
  const own = matches.find((found) => found.block === data);
  const counterpart = matches.find((found) => found.block.revealPair.state !== state);
  if (!own || !counterpart || own.slideIndex === counterpart.slideIndex || own.path !== counterpart.path ||
      JSON.stringify(staticSlide(slides[own.slideIndex], true)) !==
        JSON.stringify(staticSlide(slides[counterpart.slideIndex], true))) {
    throw new Error(`REVEAL_PAIR_LAYOUT: "${id}" needs the same template, content slot and static slide composition.`);
  }
  return { id, state, peer: counterpart.block, slides, matches };
}

function pairedText(data, ctx) {
  if (!data.revealPair) return null;
  const { id, state, peer } = pairedBlocks(data, ctx);
  if (data.type !== 'text' || peer.type !== 'text') {
    throw new Error(`REVEAL_PAIR_MISMATCH: "${id}" needs two text blocks in the same slot.`);
  }
  const field = Object.prototype.hasOwnProperty.call(data, 'value') ? 'value' : 'text';
  if (!Object.prototype.hasOwnProperty.call(peer, field) ||
      Object.prototype.hasOwnProperty.call(data, field === 'value' ? 'text' : 'value') ||
      Object.prototype.hasOwnProperty.call(peer, field === 'value' ? 'text' : 'value')) {
    throw new Error(`REVEAL_PAIR_MISMATCH: "${id}" needs the same value/text field shape.`);
  }
  const question = state === 'question' ? data[field] : peer[field];
  const answer = state === 'answer' ? data[field] : peer[field];
  if (typeof question !== 'string' || !question.trim() || typeof answer !== 'string' || !answer.trim() ||
      question.includes('||') || !answer.includes('||')) {
    throw new Error(`REVEAL_PAIR_MISMATCH: "${id}" needs nonempty question text and an authored || answer reveal.`);
  }
  return { id, question, answer };
}

// Only an explicitly authored pair participates. Unpaired decks retain their
// existing sizing, and no answer is derived from a question by the builder.
function pairedEntries(data, ctx) {
  if (!data.revealPair) return null;
  const { id, state, peer } = pairedBlocks(data, ctx);
  if (data.type === 'question-cards' && (data.startAt != null || peer.startAt != null)) {
    throw new Error(`REVEAL_PAIR_MISMATCH: "${id}" question-cards has fixed 1-based badges; use numbered-questions for continued numbering.`);
  }
  if (peer.type !== data.type || !Array.isArray(data.questions) || !Array.isArray(peer.questions) ||
      data.questions.length !== peer.questions.length ||
      Number(data.startAt || 1) !== Number(peer.startAt || 1) ||
      !!data.answerBoxes !== !!peer.answerBoxes) {
    throw new Error(`REVEAL_PAIR_MISMATCH: "${id}" needs the same helper, count, numbering and answer-box mode.`);
  }
  const pair = data.questions.map((entry, index) => {
    const other = peer.questions[index];
    const ownId = entry && typeof entry === 'object' ? entry.id : undefined;
    const peerId = other && typeof other === 'object' ? other.id : undefined;
    if ((ownId !== undefined || peerId !== undefined) && ownId !== peerId) {
      throw new Error(`REVEAL_PAIR_MISMATCH: "${id}" item ${index + 1} has different ids.`);
    }
    const staticEntry = (value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
      const copy = {};
      Object.keys(value).sort().forEach((key) => {
        if (key !== 'text') copy[key] = value[key];
      });
      return copy;
    };
    if (JSON.stringify(staticEntry(entry)) !== JSON.stringify(staticEntry(other))) {
      throw new Error(`REVEAL_PAIR_MISMATCH: "${id}" item ${index + 1} changed non-text content.`);
    }
    const ownText = itemText(entry);
    const otherText = itemText(other);
    if (!String(ownText).trim() || !String(otherText).trim()) {
      throw new Error(`REVEAL_PAIR_MISMATCH: "${id}" item ${index + 1} is empty.`);
    }
    if ([ownText, otherText].some((text) => /^\(\s*(?:[a-z]|\d+)\s*\)\s*/i.test(String(text)))) {
      throw new Error(`REVEAL_PAIR_MISMATCH: "${id}" item ${index + 1} must use generated numbering, not typed labels.`);
    }
    const answerText = state === 'answer' ? ownText : otherText;
    const questionText = state === 'question' ? ownText : otherText;
    if (String(questionText).includes('||')) {
      throw new Error(`REVEAL_PAIR_MISMATCH: "${id}" question item ${index + 1} already contains an answer reveal.`);
    }
    if (!String(answerText).includes('||')) {
      throw new Error(`REVEAL_PAIR_MISMATCH: "${id}" answer item ${index + 1} needs an authored || reveal.`);
    }
    return [ownText, otherText];
  });
  const ids = data.questions.map((entry) => entry && typeof entry === 'object' ? entry.id : undefined)
    .filter((value) => value !== undefined);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`REVEAL_PAIR_MISMATCH: "${id}" has duplicate item ids.`);
  }
  pair.pairId = id;
  return pair;
}

// A header cue too long for one line takes two, and the body starts lower on
// that slide. A pair's two slides may carry different cues and signs, so when
// either needs the taller header both take it: the body below sits at one
// height on the question and on its answers.
function settlePairedHeaders(lesson) {
  const slides = lesson && lesson.slides;
  if (!Array.isArray(slides)) return lesson;
  const { instructionNeedsTwoLines } = require('../layout');
  const blocks = [];
  slides.forEach((slide, index) => blocksIn(slide, blocks, '', index));
  const slidesOf = new Map();
  blocks.forEach((found) => {
    const id = found.block.revealPair && found.block.revealPair.id;
    if (typeof id !== 'string') return;
    if (!slidesOf.has(id)) slidesOf.set(id, new Set());
    slidesOf.get(id).add(found.slideIndex);
  });
  slidesOf.forEach((indexes) => {
    const pair = [...indexes].map((index) => slides[index])
      .filter((slide) => slide && typeof slide === 'object' && slide.headerStyle !== 'starter');
    if (indexes.size !== 2 || pair.length !== 2) return;
    if (pair.some((slide) => instructionNeedsTwoLines(slide))) {
      pair.forEach((slide) => { slide.pairedHeaderTwoLine = true; });
    }
  });
  return lesson;
}

const PAIRED_LAYOUT = Symbol('paired reveal layout');
module.exports = { pairedEntries, pairedText, PAIRED_LAYOUT, settlePairedHeaders };
