"use strict";

// Codex's Windows sandbox lets a worker create, change and delete a file but
// refuses a rename and a hard link (EPERM), so every slide preview built,
// passed and was lost at its last step (three Codex lessons, 10 and 11
// October 2026). The file is then saved under its real name the plain way.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { moveIntoPlace, claimName } = require("../final-name");

function refusal(code = "EPERM") {
  return Object.assign(new Error(`${code}: operation not permitted`), { code });
}

// A file system that behaves like the sandbox: everything works except the
// calls named.
function sandbox(refused) {
  const fake = Object.create(fs);
  for (const name of refused) {
    fake[name] = () => {
      throw refusal();
    };
  }
  return fake;
}

function folder() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "final-name-"));
}

test("where a rename works, the file is renamed as before", () => {
  const dir = folder();
  const from = path.join(dir, ".deck.building.pptx");
  const to = path.join(dir, "deck.pptx");
  fs.writeFileSync(from, "new deck");
  assert.equal(moveIntoPlace(from, to), "renamed");
  assert.equal(fs.readFileSync(to, "utf8"), "new deck");
  assert.equal(fs.existsSync(from), false);
});

test("a refused rename still leaves the file under its real name", () => {
  for (const code of ["EPERM", "EACCES"]) {
    const dir = folder();
    const from = path.join(dir, ".deck.building.pptx");
    const to = path.join(dir, "deck.pptx");
    fs.writeFileSync(from, "new deck");
    fs.writeFileSync(to, "old deck");
    const fake = Object.create(fs);
    fake.renameSync = () => {
      throw refusal(code);
    };
    assert.equal(moveIntoPlace(from, to, fake), "copied");
    assert.equal(fs.readFileSync(to, "utf8"), "new deck");
    assert.equal(fs.existsSync(from), false, "the private copy is cleared away");
  }
});

test("a rename that fails for another reason is not papered over", () => {
  const dir = folder();
  const to = path.join(dir, "deck.pptx");
  assert.throws(
    () => moveIntoPlace(path.join(dir, "never-written.pptx"), to),
    (error) => error.code === "ENOENT"
  );
  assert.equal(fs.existsSync(to), false);
});

test("a save refused both ways says so under one name", () => {
  const dir = folder();
  const from = path.join(dir, ".deck.building.pptx");
  const to = path.join(dir, "deck.pptx");
  fs.writeFileSync(from, "new deck");
  assert.throws(
    () => moveIntoPlace(from, to, sandbox(["renameSync", "writeFileSync"])),
    (error) => error.code === "SAVE_REFUSED" && error.message.includes(to)
  );
  assert.equal(fs.readFileSync(from, "utf8"), "new deck", "the built file is not lost");
});

test("a refused hard link still claims a free name", () => {
  const dir = folder();
  const from = path.join(dir, ".leaf.incoming.svg");
  const to = path.join(dir, "leaf.svg");
  fs.writeFileSync(from, "<svg/>");
  assert.equal(claimName(from, to, sandbox(["linkSync"])), "copied");
  assert.equal(fs.readFileSync(to, "utf8"), "<svg/>");
});

test("a refused hard link never overwrites a name already taken", () => {
  const dir = folder();
  const from = path.join(dir, ".leaf.incoming.svg");
  const to = path.join(dir, "leaf.svg");
  fs.writeFileSync(from, "a different drawing");
  fs.writeFileSync(to, "the first drawing");
  assert.throws(
    () => claimName(from, to, sandbox(["linkSync"])),
    (error) => error.code === "EEXIST"
  );
  assert.equal(fs.readFileSync(to, "utf8"), "the first drawing");
});
