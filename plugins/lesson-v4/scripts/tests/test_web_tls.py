"""Picture downloads check certificates against certifi's bundle.

Inside Codex's sandbox the Windows store holds an expired root, so the
default check refused Wikimedia on 3 and 4 November 2026 and lessons fell
back to generated pictures; certifi's bundle worked in the same sandbox.
"""
import re
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[1]
FETCHERS = ("wikimedia_fetch.py", "openverse_fetch.py", "unsplash_fetch.py", "web_fetch.py")


class EveryDownloadUsesTheSharedContext(unittest.TestCase):
    def test_every_urlopen_passes_the_shared_context(self) -> None:
        for name in FETCHERS:
            text = (SCRIPTS / name).read_text(encoding="utf-8")
            calls = re.findall(r"urllib\.request\.urlopen\([^\n]*", text)
            self.assertTrue(calls, name)
            for call in calls:
                with self.subTest(fetcher=name, call=call):
                    self.assertIn("context=web_tls.CONTEXT", call)

    def test_the_context_prefers_certifi(self) -> None:
        text = (SCRIPTS / "web_tls.py").read_text(encoding="utf-8")
        self.assertIn("cafile=certifi.where()", text)


if __name__ == "__main__":
    unittest.main()
