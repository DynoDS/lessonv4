"use strict";

// Giving a finished file its real name.
//
// A file is written under a private name and only given its real name once it
// is whole, so nothing ever reads half a deck or half a drawing. The usual way
// to do that last step is a rename (or, to claim a name nobody has yet, a hard
// link).
//
// Codex's Windows sandbox refuses both. Since its update of 7 October 2026 a
// worker may create, change and delete a file in its own temporary folder and
// in the lesson folder, but a rename there fails with EPERM and so does a hard
// link. Every slide preview therefore built, passed its checks and was lost at
// the last line, until the worker asked for more access and built it all
// again (three Codex lessons, 10 and 11 October 2026: about fourteen previews
// and five drawing saves).
//
// So when the sandbox refuses, the file is written under its real name the
// plain way, which is the same kind of write the sandbox allowed a moment
// earlier in the same folder. Anywhere a rename works, nothing changes.

const fs = require("node:fs");

const REFUSED = new Set(["EPERM", "EACCES"]);

function wasRefused(error) {
  return Boolean(error && REFUSED.has(error.code));
}

function saveRefused(to, cause) {
  const error = new Error(
    `This session was not allowed to save ${to} (${(cause && cause.code) || "refused"}).`
  );
  error.code = "SAVE_REFUSED";
  error.cause = cause;
  return error;
}

// Moves a finished file to its real name, replacing whatever is there.
// Returns "renamed" or "copied". Throws SAVE_REFUSED when neither is allowed;
// any other failure is thrown as it is.
function moveIntoPlace(from, to, fileSystem = fs) {
  try {
    fileSystem.renameSync(from, to);
    return "renamed";
  } catch (error) {
    if (!wasRefused(error)) throw error;
    try {
      fileSystem.writeFileSync(to, fileSystem.readFileSync(from));
    } catch (second) {
      if (wasRefused(second)) throw saveRefused(to, second);
      throw second;
    }
    try {
      fileSystem.unlinkSync(from);
    } catch (_) {
      // The real file is in place; a leftover under its private name is not
      // worth failing over.
    }
    return "copied";
  }
}

// Gives a finished file a name only if nobody has that name yet, and leaves
// the private copy for the caller to remove. Throws EEXIST when the name is
// taken, exactly as a hard link does, so two runs publishing at once still
// cannot overwrite each other.
function claimName(from, to, fileSystem = fs) {
  try {
    fileSystem.linkSync(from, to);
    return "linked";
  } catch (error) {
    if (!wasRefused(error)) throw error;
    try {
      fileSystem.writeFileSync(to, fileSystem.readFileSync(from), { flag: "wx" });
    } catch (second) {
      if (wasRefused(second)) throw saveRefused(to, second);
      throw second;
    }
    return "copied";
  }
}

module.exports = { moveIntoPlace, claimName, wasRefused };
