'use strict';

// A success-criteria panel as a *content object*, so the success criteria reads
// AS the success criteria — green rounded box, green "✓ Success Criteria" label
// — in any zone, not only in the fixed right-hand panel of the `maths-turn-sc`
// family. Use it whenever the criteria has to sit somewhere a `*-sc` template's
// panel can't reach: a full-width bottom strip carrying a wide visual reference,
// a free-template zone, a Reflect slide. Inside a `*-sc` template's own criteria
// slot the panel is already drawn, so there put the bare criteria, not this.
//
// The geometry lives in ../success-criteria-panel: one panel identity (surface,
// label, compact white cards) shared by the template route and this one.
//
// Spec:
//   label/criteriaLabel    panel heading (default "✓ Success Criteria")
//   content/criteria       any content object — steps, a labelled row of
//                          diagrams, a table — rendered inside the box beneath
//                          the label. The same object may also arrive under the
//                          key `criteria`: that is the key the `*-sc` templates
//                          and the `success-criteria` template use for the
//                          identical thing, so a designer who has been writing
//                          `criteria` everywhere else reaches for it here too.
//                          Both keys are accepted so the panel fills either way.

const { drawSuccessCriteriaPanel } = require('../success-criteria-panel');

function drawScPanelContent(pptx, slide, zone, data, ctx) {
  drawSuccessCriteriaPanel(pptx, slide, zone, data, ctx);
}

// Two criteria panels one above the other are one set of criteria to a child,
// so they are drawn as one green box with one heading, each set in turn. Drawn
// apart, each paid for its own heading and edges: a Year 4 science slide with
// three steps and a four-row table of label meanings had no room for both
// boxes beside its task, and when the table drew nothing the second box showed
// as a stray "Success Criteria" bar (11 October 2026). The teacher, shown the
// slides: one shared box, steps then table. Panels side by side in a row are
// left as written (he did not want that one squashed into one), and so is a
// panel with its own heading or the flipchart easel, whose cue belongs to its
// own criterion.
function joinable(item) {
  return !!(item && item.type === 'sc-panel' && !item.flipchart &&
    !item.label && !item.criteriaLabel && (item.content || item.criteria));
}

const weightOf = (it) => (typeof it.weight === 'number' && it.weight > 0) ? it.weight : 1;

// Each set keeps the share of the box its own panel was given.
function setOf(panel) {
  return Object.assign({}, panel.content || panel.criteria, { weight: weightOf(panel) });
}

function joinStack(stack) {
  const items = [];
  for (const item of stack.items) {
    const last = items[items.length - 1];
    if (joinable(item) && last && last._joined) {
      last.content.items.push(setOf(item));
      last.weight += weightOf(item);
    } else if (joinable(item) && joinable(last)) {
      const joined = Object.assign({}, last, {
        content: { type: 'stack', criteriaSets: true, items: [setOf(last), setOf(item)] },
        weight: weightOf(last) + weightOf(item)
      });
      delete joined.criteria;
      Object.defineProperty(joined, '_joined', { value: true, enumerable: false });
      items[items.length - 1] = joined;
    } else {
      items.push(item);
    }
  }
  if (items.length === stack.items.length) return stack;
  // One panel left is the whole stack: it takes the stack's place and weight.
  if (items.length === 1) {
    const only = Object.assign({}, items[0]);
    if (typeof stack.weight === 'number') only.weight = stack.weight;
    else delete only.weight;
    return only;
  }
  return Object.assign({}, stack, { items });
}

function joinNode(node) {
  if (Array.isArray(node)) return node.map(joinNode);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const key of Object.keys(node)) out[key] = joinNode(node[key]);
  if (out.type === 'stack' && Array.isArray(out.items)) return joinStack(out);
  return out;
}

function joinStackedCriteriaPanels(lesson) {
  if (!lesson || !Array.isArray(lesson.slides)) return lesson;
  return Object.assign({}, lesson, { slides: lesson.slides.map(joinNode) });
}

module.exports = { drawScPanelContent, joinStackedCriteriaPanels };
