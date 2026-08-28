"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { loadJSZip } = require("../src/fix-paragraph-props");
const {
  DECORATIVE_URI,
  markPictureXml,
  markSlideXml,
  markDecorativeImages,
} = require("../src/mark-decorative-images");

function picture(name, cNvPr) {
  return `<p:pic><p:nvPicPr>${cNvPr || `<p:cNvPr id="1" name="${name}"/>`}<p:cNvPicPr/></p:nvPicPr><p:blipFill/><p:spPr/></p:pic>`;
}

test("non-decoration pictures are unchanged", () => {
  const xml = picture("Teaching photo");
  const result = markPictureXml(xml);
  assert.equal(result.target, false);
  assert.equal(result.xml, xml);
});

test("self-closing Decoration cNvPr gains one Decorative extension", () => {
  const xml = picture("Decoration/decoration-one");
  const result = markPictureXml(xml);
  assert.equal(result.marked, true);
  assert.equal((result.xml.match(new RegExp(DECORATIVE_URI, "g")) || []).length, 1);
  assert.match(result.xml, /adec:decorative[^>]*val="1"/);
});

test("existing extension list is preserved", () => {
  const cNvPr =
    '<p:cNvPr id="1" name="Decoration/decoration-one"><a:extLst><a:ext uri="existing"/></a:extLst></p:cNvPr>';
  const result = markPictureXml(picture("ignored", cNvPr));
  assert.match(result.xml, /uri="existing"/);
  assert.match(result.xml, /adec:decorative[^>]*val="1"/);
});

test("existing false marker becomes true without duplication", () => {
  const cNvPr =
    '<p:cNvPr id="1" name="Decoration/decoration-one"><a:extLst><a:ext uri="x"><adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" val="0"/></a:ext></a:extLst></p:cNvPr>';
  const result = markPictureXml(picture("ignored", cNvPr));
  assert.match(result.xml, /adec:decorative[^>]*val="1"/);
  assert.equal((result.xml.match(/adec:decorative/g) || []).length, 1);
});

test("already true marker is unchanged", () => {
  const cNvPr =
    '<p:cNvPr id="1" name="Decoration/decoration-one"><a:extLst><a:ext uri="x"><adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" val="1"/></a:ext></a:extLst></p:cNvPr>';
  const xml = picture("ignored", cNvPr);
  assert.equal(markPictureXml(xml).xml, xml);
});

test("an unmarkable individual P3 picture is removed while meaningful pictures remain", () => {
  const malformed =
    '<p:pic><p:nvPicPr><p:cNvPrBROKEN name="Decoration/decoration-one"/></p:nvPicPr></p:pic>';
  const meaningful = picture("Meaningful vocabulary image");
  const result = markSlideXml(`<p:sld>${malformed}${meaningful}</p:sld>`);
  assert.equal(result.removed, 1);
  assert.match(result.xml, /Meaningful vocabulary image/);
  assert.doesNotMatch(result.xml, /Decoration\/decoration-one/);
});

test("package-level pass marks only Decoration pictures", async () => {
  const JSZip = loadJSZip();
  const zip = new JSZip();
  zip.file(
    "ppt/slides/slide1.xml",
    `<p:sld>${picture("Decoration/decoration-one")}${picture(
      "Meaningful image"
    )}</p:sld>`
  );
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lr-decoration-ooxml-"));
  const file = path.join(root, "proof.pptx");
  fs.writeFileSync(
    file,
    await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
  );

  const result = await markDecorativeImages(file, { JSZip });
  assert.equal(result.marked, 1);
  assert.equal(result.removed, 0);

  const reopened = await JSZip.loadAsync(fs.readFileSync(file));
  const xml = await reopened.file("ppt/slides/slide1.xml").async("string");
  const pictures = xml.match(/<p:pic\b[\s\S]*?<\/p:pic>/g);
  assert.match(pictures[0], /adec:decorative[^>]*val="1"/);
  assert.doesNotMatch(pictures[1], /adec:decorative/);
});
