"""Licence provenance must be read, never invented.

Wikimedia Commons names a licence for every file but does not always publish a
URL for it - a public-domain mark usually carries a name and nothing else. Every
stage downstream requires a URL, so a scout that found a perfectly usable
public-domain photograph had to supply one from somewhere, and the only place to
get it was its own memory. Typing a licence URL that was not in the metadata to
get past a provenance check is the failure this file guards: the record then says
a human-checkable thing that nobody checked.

The fix is that the fetcher fills the URL each named licence publishes for
itself, from a table, when Commons omits it - so the licence still comes from
Commons and only its address is supplied.

Run:
  python3 -m pytest scripts/tests/test_licence_provenance.py
"""
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


wikimedia = load("test_licence_wikimedia", "wikimedia_fetch.py")
validator = load("test_licence_validator", "validate-image-scout.py")


class LicenceNamesNormalise(unittest.TestCase):
    """A licence name has to survive normalisation to be recognisable at all."""

    def test_a_share_alike_licence_keeps_its_own_name(self):
        # The class used to match the letter s, so "CC BY-SA 4.0" became
        # "cc by a 4.0" and "ShareAlike" became "harealike". Nothing failed
        # loudly; the names simply stopped being lookupable.
        self.assertEqual(wikimedia._normalise_licence("CC BY-SA 4.0"), "cc by sa 4.0")
        self.assertEqual(
            wikimedia._normalise_licence("Attribution-ShareAlike 3.0"),
            "attribution sharealike 3.0",
        )

    def test_separators_are_all_one_thing(self):
        self.assertEqual(wikimedia._normalise_licence("PD_old-100"), "pd old 100")


class CanonicalLicenceUrls(unittest.TestCase):
    def test_a_public_domain_mark_gets_the_mark_its_own_url(self):
        self.assertEqual(
            wikimedia.canonical_licence_url("Public Domain"),
            "https://creativecommons.org/publicdomain/mark/1.0/",
        )

    def test_a_qualified_public_domain_tag_resolves_the_same_way(self):
        self.assertEqual(
            wikimedia.canonical_licence_url("PD-old-100"),
            "https://creativecommons.org/publicdomain/mark/1.0/",
        )

    def test_cc_zero_and_the_cc_family_resolve_to_their_own_deeds(self):
        self.assertEqual(
            wikimedia.canonical_licence_url("CC0"),
            "https://creativecommons.org/publicdomain/zero/1.0/",
        )
        self.assertEqual(
            wikimedia.canonical_licence_url("CC BY-SA 4.0"),
            "https://creativecommons.org/licenses/by-sa/4.0/",
        )

    def test_a_licence_with_no_recorded_url_returns_nothing_rather_than_a_guess(self):
        # Returning the nearest-looking URL would be exactly the invention this
        # whole mechanism exists to remove.
        self.assertEqual(wikimedia.canonical_licence_url("Some House Licence 1.0"), "")
        self.assertEqual(wikimedia.canonical_licence_url(""), "")

    def test_a_restrictive_licence_is_still_refused_outright(self):
        for name in ("CC BY-NC 4.0", "CC BY-ND 3.0", "CC BY-NC-SA 4.0"):
            self.assertFalse(wikimedia.is_allowed_licence(name), name)

    def test_the_usable_licences_are_still_allowed(self):
        for name in ("Public Domain", "PD-old-100", "CC0", "CC BY-SA 4.0", "Attribution 3.0"):
            self.assertTrue(wikimedia.is_allowed_licence(name), name)


class FilledUrlsSatisfyTheValidator(unittest.TestCase):
    """The point of the table is that the picture then passes without a rewrite."""

    def test_every_canonical_url_belongs_to_a_licence_the_validator_accepts(self):
        for name in wikimedia.CANONICAL_LICENCE_URLS:
            self.assertTrue(
                validator.wikimedia_licence_allowed(name),
                f"{name} has a canonical URL but is not an accepted licence",
            )
            self.assertTrue(wikimedia.canonical_licence_url(name).startswith("https://"), name)


if __name__ == "__main__":
    unittest.main()
