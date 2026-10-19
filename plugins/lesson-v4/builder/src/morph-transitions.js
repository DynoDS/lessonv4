"use strict";

// PowerPoint's Morph transition onto the slides of a run that shows something
// happening (src/happening-runs.js).
//
// Morph moves every shape that has the same name on two neighbouring slides from
// where it was to where it is, and fades in or out what is only on one. The
// pieces of an exchange keep one name for the whole run, so a click slides the
// ten across into the ones and breaks it into ten ones instead of swapping one
// picture for another. pptxgenjs cannot write a transition, so it is added to
// the saved package here, as the hand-made test deck the teacher approved had
// it (18 October 2026): a fade for a PowerPoint too old for Morph, whose slides
// still teach on their own because each one shows where a piece came from.

const fs = require("node:fs");
const { loadJSZip } = require("./fix-paragraph-props");

const MORPH =
  '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">' +
  '<mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159">' +
  '<p:transition xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" spd="slow" p14:dur="1600">' +
  '<p159:morph option="byObject"/></p:transition></mc:Choice>' +
  '<mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback>' +
  "</mc:AlternateContent>";

function addMorph(xml) {
  if (xml.includes("p159:morph")) return { xml, added: false };
  // A transition sits straight after the colour map, before any timing.
  const at = xml.indexOf("</p:clrMapOvr>");
  if (at === -1) return { xml, added: false };
  const end = at + "</p:clrMapOvr>".length;
  // Any transition pptxgenjs might one day write gives way to this one.
  const rest = xml.slice(end).replace(/<p:transition\b[\s\S]*?<\/p:transition>|<p:transition\b[^>]*\/>/, "");
  return { xml: xml.slice(0, end) + MORPH + rest, added: true };
}

// `slides`: the built slide numbers (1-based) that open with Morph.
async function addMorphTransitions(pptxPath, slides, dependencies = {}) {
  const list = [...new Set((slides || []).filter((n) => Number.isInteger(n) && n > 1))];
  if (!list.length) return { added: 0 };
  const fileSystem = dependencies.fs || fs;
  const JSZip = dependencies.JSZip || loadJSZip();
  const zip = await JSZip.loadAsync(fileSystem.readFileSync(pptxPath));
  let added = 0;
  for (const n of list) {
    const name = `ppt/slides/slide${n}.xml`;
    const file = zip.file(name);
    if (!file) continue;
    const result = addMorph(await file.async("string"));
    if (result.added) {
      zip.file(name, result.xml, { compression: "DEFLATE" });
      added += 1;
    }
  }
  if (added) {
    fileSystem.writeFileSync(pptxPath, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  }
  return { added };
}

module.exports = { MORPH, addMorph, addMorphTransitions };
