"""Let this interpreter use the Python libraries the plugin installed for itself.

The build scripts need libraries a fresh computer does not have: python-pptx
and Pillow to build anything, PyMuPDF to turn a PDF page into a picture,
pywin32 to reach PowerPoint. `check-setup.js --fix` installs whichever are
missing into a folder of the plugin's own, outside the package, so they survive
every update and nothing else on the computer changes. Importing this module
puts that folder on the path.

The folder is appended, not prepended, so a library the interpreter already has
always wins and a computer that was working before is unaffected. The folder is
keyed by Python version and platform because compiled libraries only load into
the interpreter they were built for. `site.addsitedir` rather than a bare path
entry, because pywin32 only works once its own `.pth` file has run.

Every script that imports a third-party library imports this first. A test pins
that, because a script that forgets works on a computer set up by hand and
fails on a fresh one, which is exactly the case nobody tests by hand.
"""
from __future__ import annotations

import os
import site
import sys
import sysconfig
from pathlib import Path

HOME_VARIABLE = "LESSON_RESOURCES_HOME"


def plugin_home() -> Path:
    configured = os.environ.get(HOME_VARIABLE, "").strip()
    return Path(configured) if configured else Path.home() / ".lesson-resources"


def extras_dir() -> Path:
    tag = f"py{sys.version_info.major}{sys.version_info.minor}-{sysconfig.get_platform()}"
    return plugin_home() / "python" / tag


def activate() -> Path:
    folder = extras_dir()
    if folder.is_dir() and str(folder) not in sys.path:
        site.addsitedir(str(folder))
    return folder


activate()
