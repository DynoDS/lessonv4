#!/usr/bin/env bash
# Make a fresh cloud box able to build lessons.
#
# Point the cloud environment's setup command at this file, from the root of
# the cloned repository:
#
#   bash plugins/lesson-v4/scripts/cloud-setup.sh      (this repository)
#
# It finds everything from its own location, so the same file keeps working
# when the plugin moves to another repository under another folder name.
#
# A cloud run cannot reach the teacher's computer. To have its lessons saved
# there, attach the letterbox repository too and set the environment variable
# LESSON_RESOURCES_LETTERBOX=<owner>/<letterbox repository>; the run posts to its
# claude/lesson-outbox branch and the teacher's computer collects at login
# (scripts/letterbox_filer.py). The full walk-through is "Setting up a cloud
# environment" in references/computer-setup.md.
#
# A cloud box is a clean Linux computer every time. It has Node and usually
# Python, and none of the rest: the builders' libraries, the Python libraries,
# LibreOffice to turn slides into pictures, the fonts the pages are measured
# in, a browser to print worksheets, or the plugin itself registered with
# Claude Code. The same start-up check a lesson run uses (check-setup.js)
# installs the libraries and the browser; this file adds the parts only a
# Linux box needs and the check deliberately never does on a teacher's own
# computer, such as system packages.
#
# Every step is best effort and says what it could not do. A box that cannot
# get LibreOffice still builds every resource; it just cannot look at slides.
set -u

plugin_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
say() { printf '>> %s\n' "$*"; }
warn() { printf '   WARN: %s\n' "$*"; }

as_root() {
  if [ "$(id -u)" = "0" ]; then "$@"; elif command -v sudo >/dev/null 2>&1; then sudo "$@"; else return 1; fi
}

# --- Register the plugin with Claude Code, whatever folder the session starts in ---
# A cloud session with more than one repository attached starts in their
# parent folder, so a repository's own .claude/settings.json is never read and
# the plugin's skills never appear. User settings load from anywhere. The
# marketplace is registered as a directory source pointing at this clone, so
# nothing is cloned a second time and no GitHub sign-in is needed.
if command -v node >/dev/null 2>&1; then
  PLUGIN_ROOT="$plugin_root" node - <<'NODE' || warn "could not register the plugin with Claude Code"
const fs = require('fs');
const os = require('os');
const path = require('path');
const pluginRoot = process.env.PLUGIN_ROOT;
let dir = pluginRoot;
let marketplace = null;
for (let i = 0; i < 4 && !marketplace; i += 1) {
  const candidate = path.join(dir, '.claude-plugin', 'marketplace.json');
  if (fs.existsSync(candidate)) marketplace = { root: dir, file: candidate };
  dir = path.dirname(dir);
}
if (!marketplace) {
  console.log('   no Claude Code marketplace file above the plugin; skipping registration');
  process.exit(0);
}
const manifest = JSON.parse(fs.readFileSync(marketplace.file, 'utf8'));
const entry = (manifest.plugins || []).find(
  (p) => typeof p.source === 'string' && path.resolve(marketplace.root, p.source) === path.resolve(pluginRoot)
);
if (!entry) {
  console.log('   the marketplace file does not list this plugin; skipping registration');
  process.exit(0);
}
const settingsFile = path.join(os.homedir(), '.claude', 'settings.json');
let settings = {};
try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')); } catch (_) { settings = {}; }
settings.extraKnownMarketplaces = settings.extraKnownMarketplaces || {};
settings.extraKnownMarketplaces[manifest.name] = { source: { source: 'directory', path: marketplace.root } };
settings.enabledPlugins = settings.enabledPlugins || {};
settings.enabledPlugins[`${entry.name}@${manifest.name}`] = true;
fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n');
console.log(`>> registered ${entry.name}@${manifest.name} from ${marketplace.root}`);
NODE
else
  warn "no Node on this box; nothing in a lesson can be built without it"
fi

# --- System packages: Python's installer, LibreOffice, font tools ---
# LibreOffice is probed by converting a real file, not by looking for the
# program: some boxes ship its core without the filters, so the program exists
# and every conversion still fails.
lo_can_convert() {
  command -v soffice >/dev/null 2>&1 || return 1
  local probe; probe="$(mktemp -d)" || return 1
  printf 'x' > "$probe/probe.txt"
  soffice --headless --convert-to pdf --outdir "$probe" "$probe/probe.txt" >/dev/null 2>&1
  local ok=1; [ -f "$probe/probe.pdf" ] && ok=0
  rm -rf "$probe"
  return $ok
}

packages=()
command -v python3 >/dev/null 2>&1 || packages+=(python3)
python3 -m pip --version >/dev/null 2>&1 || packages+=(python3-pip)
lo_can_convert || packages+=(libreoffice-impress libreoffice-writer)
command -v fc-cache >/dev/null 2>&1 || packages+=(fontconfig)
if [ "${#packages[@]}" -gt 0 ]; then
  if command -v apt-get >/dev/null 2>&1; then
    say "installing ${packages[*]}"
    { as_root apt-get update -qq && as_root apt-get install -y --no-install-recommends "${packages[@]}"; } \
      || warn "could not install ${packages[*]}"
  else
    warn "no apt-get on this box; could not install ${packages[*]}"
  fi
fi

# --- Fonts: the pages are measured and printed in Comic Sans ---
# The browser that prints worksheets and walls, and LibreOffice when it turns
# slides into pictures, both look fonts up by name. The package carries the
# faces, so register them for this user.
fonts="$plugin_root/shared/fonts"
if [ -d "$fonts" ]; then
  mkdir -p "$HOME/.local/share/fonts"
  cp "$fonts"/*.ttf "$HOME/.local/share/fonts/" 2>/dev/null && say "registered the fonts in $fonts"
  command -v fc-cache >/dev/null 2>&1 && fc-cache -f "$HOME/.local/share/fonts" >/dev/null 2>&1 || true
fi

# --- Everything a lesson run checks: libraries, Python libraries, a browser ---
if command -v node >/dev/null 2>&1; then
  say "running the plugin's own setup check"
  node "$plugin_root/scripts/check-setup.js" --fix
  status=$?
  [ "$status" -eq 0 ] || warn "the setup check did not finish cleanly (exit $status); read the lines above"
fi

lo_can_convert || warn "LibreOffice cannot convert documents here, so slides will be built but not looked at"
if [ -z "${LESSON_RESOURCES_LETTERBOX:-}" ]; then
  warn "LESSON_RESOURCES_LETTERBOX is not set, so lessons built here stay on this box; see references/computer-setup.md"
fi
say "cloud setup complete"
