#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Where the library is, and whether there is one, is the shared module's
// question rather than this file's. Publishing only ever reads a drawing that
// is already on this machine - the search fetched it in order to show it - so
// the default here is worked out without touching the network.
const {
  cacheRoot,
  hasDrawings,
  LIBRARY_ID_RE,
  LOCAL_ROOT_VARIABLE,
  resolveLibrary,
} = require("../shared/educational-svg-library");

function libraryHome() {
  const configured = (process.env[LOCAL_ROOT_VARIABLE] || "").trim();
  if (configured) {
    const local = path.resolve(configured);
    if (hasDrawings(local)) return local;
  }
  return cacheRoot();
}

function isWithin(base, candidate) {
  const relative = path.relative(base, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

function inspectLibrarySvg(candidateSvgPath, libraryRoot) {
  if (!fs.existsSync(libraryRoot) || !fs.statSync(libraryRoot).isDirectory()) {
    throw new Error(`Educational SVG library is unavailable: ${libraryRoot}`);
  }

  // A named drawing that is not there is its own answer and deserves its own
  // sentence. While the library could only ever be the packaged one, a missing
  // drawing and a missing library were the same situation, so this went
  // unnoticed; now that a real library can be present while one drawing is not,
  // the caller would otherwise get a bare path error from realpath.
  if (!fs.existsSync(candidateSvgPath)) {
    throw new Error(`Educational SVG drawing does not exist: ${candidateSvgPath}`);
  }

  const libraryReal = fs.realpathSync(libraryRoot);
  const candidateReal = fs.realpathSync(candidateSvgPath);
  if (!isWithin(libraryReal, candidateReal)) {
    throw new Error("Candidate must come from the Educational SVG library.");
  }

  const libraryId = path.relative(libraryReal, candidateReal).split(path.sep).join("/");
  if (!LIBRARY_ID_RE.test(libraryId)) {
    throw new Error(`Candidate has an invalid Educational SVG library path: ${libraryId}`);
  }

  const candidate = fs.readFileSync(candidateReal);
  if (candidate.length > 2 * 1024 * 1024) {
    throw new Error(`Educational SVG candidate is too large: ${libraryId}`);
  }
  const source = candidate.toString("utf8");
  if (!/<svg\b/i.test(source) || !/\bviewBox\s*=/i.test(source)) {
    throw new Error(`Candidate is not a usable SVG: ${libraryId}`);
  }
  const unsafe = [
    [/<script\b/i, "script"],
    [/<foreignObject\b/i, "foreignObject"],
    [/<image\b/i, "embedded image"],
    [/\bon[a-z]+\s*=/i, "event handler"],
    [/(?:href|xlink:href)\s*=\s*["'](?:https?:|\/\/|data:)/i, "external reference"],
  ];
  for (const [pattern, label] of unsafe) {
    if (pattern.test(source)) {
      throw new Error(`Educational SVG candidate contains an unsafe ${label}: ${libraryId}`);
    }
  }
  return { candidate, candidateReal, libraryId };
}

function sameBytes(a, b) {
  return a.length === b.length && a.equals(b);
}

function defaultRasterize(sourcePath, outputPath) {
  const script = path.join(__dirname, "rasterize-educational-svg.js");
  execFileSync(process.execPath, [script, sourcePath, outputPath], {
    stdio: "inherit",
  });
}

function ensurePng(sourcePath, pngPath, rasterize) {
  if (fs.existsSync(pngPath)) return;

  const temporary = path.join(
    path.dirname(pngPath),
    `.${path.basename(pngPath)}.${process.pid}.${Date.now()}.tmp`
  );
  rasterize(sourcePath, temporary);

  try {
    fs.renameSync(temporary, pngPath);
  } catch (error) {
    if (error && (error.code === "EEXIST" || error.code === "EPERM")) {
      if (fs.existsSync(pngPath)) {
        try {
          fs.unlinkSync(temporary);
        } catch (_) {
          // Another identical publisher won the race; its PNG is canonical.
        }
        return;
      }
    }
    throw error;
  }
}

function publishEducationalSvgAsset(
  candidateSvgPath,
  workingDir,
  preferredSlug,
  options = {}
) {
  if (!SLUG_RE.test(preferredSlug)) {
    throw new Error(
      'Preferred slug must be lowercase kebab-case, for example "candle-lit".'
    );
  }

  const libraryRoot = path.resolve(
    options.libraryRoot || path.join(libraryHome(), "library")
  );
  const { candidate, libraryId } = inspectLibrarySvg(
    path.resolve(candidateSvgPath),
    libraryRoot
  );

  const sourceDir = path.join(workingDir, "icons", "source");
  const pngDir = path.join(workingDir, "icons");
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.mkdirSync(pngDir, { recursive: true });

  const rasterize = options.rasterize || defaultRasterize;

  for (let suffix = 1; suffix <= 999; suffix += 1) {
    const slug = suffix === 1 ? preferredSlug : `${preferredSlug}-${suffix}`;
    const sourcePath = path.join(sourceDir, `${slug}.svg`);
    const pngPath = path.join(pngDir, `${slug}.png`);

    if (fs.existsSync(sourcePath)) {
      const existing = fs.readFileSync(sourcePath);
      if (!sameBytes(existing, candidate)) continue;

      ensurePng(sourcePath, pngPath, rasterize);
      return {
        educationalSvgId: libraryId,
        educationalSvgSlug: slug,
        sourcePath: `icons/source/${slug}.svg`,
        imagePath: `icons/${slug}.png`,
        reused: true,
      };
    }

    const incoming = path.join(
      sourceDir,
      `.${slug}.${process.pid}.${Date.now()}.incoming.svg`
    );
    fs.writeFileSync(incoming, candidate);

    try {
      fs.linkSync(incoming, sourcePath);
      fs.unlinkSync(incoming);
      ensurePng(sourcePath, pngPath, rasterize);
      return {
        educationalSvgId: libraryId,
        educationalSvgSlug: slug,
        sourcePath: `icons/source/${slug}.svg`,
        imagePath: `icons/${slug}.png`,
        reused: false,
      };
    } catch (error) {
      try {
        fs.unlinkSync(incoming);
      } catch (_) {
        // The temporary claim file may already have been removed.
      }
      if (error && error.code === "EEXIST") {
        const existing = fs.readFileSync(sourcePath);
        if (!sameBytes(existing, candidate)) continue;
        ensurePng(sourcePath, pngPath, rasterize);
        return {
          educationalSvgId: libraryId,
          educationalSvgSlug: slug,
          sourcePath: `icons/source/${slug}.svg`,
          imagePath: `icons/${slug}.png`,
          reused: true,
        };
      }
      throw error;
    }
  }

  throw new Error(
    `Could not allocate a unique Educational SVG filename for preferred slug "${preferredSlug}".`
  );
}

async function main() {
  const [, , candidateArg, workingDirArg, preferredSlug] = process.argv;

  // Finding the library is the same question as publishing from it, so the file
  // that owns the location answers both. A caller that had to work the folder
  // out for itself is the caller that quietly looks in the wrong one.
  if (candidateArg === "--resolve-root") {
    const { root, label, notes } = await resolveLibrary({});
    if (!root) {
      console.log(`EDUCATIONAL_SVG_UNAVAILABLE: ${notes.join("; ")}`);
      return;
    }
    console.log(`EDUCATIONAL_SVG_ROOT=${root}`);
    console.log(`EDUCATIONAL_SVG_SOURCE: ${label}`);
    return;
  }

  if (!candidateArg || !workingDirArg || !preferredSlug) {
    console.error(
      "Usage: node publish-educational-svg.js <candidate.svg> <working-dir> <preferred-slug>"
    );
    process.exit(1);
  }

  const result = publishEducationalSvgAsset(
    path.resolve(candidateArg),
    path.resolve(workingDirArg),
    preferredSlug
  );
  console.log(`EDUCATIONAL_SVG_ASSET: ${JSON.stringify(result)}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
}

module.exports = { publishEducationalSvgAsset };
