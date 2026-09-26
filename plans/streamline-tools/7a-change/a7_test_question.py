"""Release 7A (4.2.293), step 7: practising a test question (SA settled item 2,
his "keep with small fix").

The rule in `preferences.md` -> Practising a Test Question is unchanged and is
the live rule for a real question from an upcoming test that he supplies in an
ordinary lesson. Its short copies carry both of its exceptions and nothing
wider: the reviewer's check here, and the contents line in a9. The exact held
item is used when he explicitly asks for it; a suitable real question that is
not being held for a later test may be used itself."""
from _patch import REV, replace_once

replace_once(REV,
             "- a named test question is practised at the same structure, scale, response form and demand, with fresh content.",
             "- a named test question is practised at the same structure, scale, response form and demand, with fresh content while the real item is held for a later test, unless the teacher explicitly asks for that exact item; a suitable real question that is not being held may be used itself.")
print("test question copies carry both exceptions")
