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

module.exports = { drawScPanelContent };
