"use strict";

const fs = require("node:fs");
const { loadJSZip } = require("./fix-paragraph-props");

const DECORATIVE_URI = "{C183D7F6-B498-43B3-948B-1728B52AA6E4}";
const DECORATIVE_ELEMENT =
  `<a:ext uri="${DECORATIVE_URI}">` +
  `<adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" val="1"/>` +
  `</a:ext>`;

function isDecorationPicture(xml) {
  return /\bname="Decoration\/[^"]+"/.test(xml);
}

function hasDecorativeTrue(xml) {
  return /<adec:decorative\b[^>]*\bval="(?:1|true)"[^>]*\/>/.test(xml);
}

function markPictureXml(picXml) {
  if (!isDecorationPicture(picXml)) {
    return { xml: picXml, target: false, marked: false };
  }
  if (hasDecorativeTrue(picXml)) {
    return { xml: picXml, target: true, marked: true };
  }

  if (/<adec:decorative\b[^>]*\bval="(?:0|false)"[^>]*\/>/.test(picXml)) {
    const xml = picXml.replace(
      /(<adec:decorative\b[^>]*\bval=")(?:0|false)("[^>]*\/>)/,
      (_whole, before, after) => `${before}1${after}`
    );
    return { xml, target: true, marked: hasDecorativeTrue(xml) };
  }

  const selfClosing = /<p:cNvPr\b([^>]*\bname="Decoration\/[^"]+"[^>]*)\/>/;
  if (selfClosing.test(picXml)) {
    const xml = picXml.replace(
      selfClosing,
      (_whole, attributes) =>
        `<p:cNvPr${attributes}><a:extLst>${DECORATIVE_ELEMENT}</a:extLst></p:cNvPr>`
    );
    return { xml, target: true, marked: hasDecorativeTrue(xml) };
  }

  const paired = /<p:cNvPr\b([^>]*\bname="Decoration\/[^"]+"[^>]*)>([\s\S]*?)<\/p:cNvPr>/;
  const match = paired.exec(picXml);
  if (!match) return { xml: picXml, target: true, marked: false };

  const [whole, attributes, inner] = match;
  let replacement;
  if (/<a:extLst\b[^>]*>[\s\S]*<\/a:extLst>/.test(inner)) {
    replacement =
      `<p:cNvPr${attributes}>` +
      inner.replace(/<\/a:extLst>/, `${DECORATIVE_ELEMENT}</a:extLst>`) +
      `</p:cNvPr>`;
  } else {
    replacement =
      `<p:cNvPr${attributes}>${inner}` +
      `<a:extLst>${DECORATIVE_ELEMENT}</a:extLst>` +
      `</p:cNvPr>`;
  }

  const xml = picXml.replace(whole, replacement);
  return { xml, target: true, marked: hasDecorativeTrue(xml) };
}

function markSlideXml(xml) {
  let marked = 0;
  let removed = 0;

  const output = xml.replace(/<p:pic\b[\s\S]*?<\/p:pic>/g, (picture) => {
    const result = markPictureXml(picture);
    if (!result.target) return picture;
    if (!result.marked) {
      removed += 1;
      return "";
    }
    marked += 1;
    return result.xml;
  });

  const unmarked = (output.match(/<p:pic\b[\s\S]*?<\/p:pic>/g) || []).filter(
    (picture) => isDecorationPicture(picture) && !hasDecorativeTrue(picture)
  ).length;

  return { xml: output, marked, removed, unmarked };
}

async function markDecorativeImages(pptxPath, dependencies = {}) {
  const fileSystem = dependencies.fs || fs;
  const JSZip = dependencies.JSZip || loadJSZip();
  const zip = await JSZip.loadAsync(fileSystem.readFileSync(pptxPath));
  const parts = Object.keys(zip.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(name)
  );

  let marked = 0;
  let removed = 0;
  let touched = 0;
  let unmarked = 0;

  for (const name of parts) {
    const before = await zip.file(name).async("string");
    if (!before.includes('name="Decoration/')) continue;

    const result = markSlideXml(before);
    marked += result.marked;
    removed += result.removed;
    unmarked += result.unmarked;
    touched += 1;
    zip.file(name, result.xml, { compression: "DEFLATE" });
  }

  if (unmarked > 0) {
    throw new Error(
      `${unmarked} Decoration/* picture(s) remained without a verified Decorative marker.`
    );
  }

  if (touched > 0) {
    const output = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
    });
    fileSystem.writeFileSync(pptxPath, output);
  }

  return { marked, removed, parts: touched };
}

module.exports = {
  DECORATIVE_URI,
  markPictureXml,
  markSlideXml,
  markDecorativeImages,
};
