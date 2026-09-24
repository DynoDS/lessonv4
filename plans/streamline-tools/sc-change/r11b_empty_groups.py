"""r11 follow-up: a row or stack left empty once its criteria panels come off is
dropped too, so the preflight measures a real page (lesson 15's Greater Depth
sheet held two panels in one row)."""
from pathlib import Path

P = Path(r"C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\worksheet-html\src\worksheet.js")
raw = P.read_bytes().decode("utf-8")
crlf = "\r\n" in raw
t = raw.replace("\r\n", "\n")
old = ("function withoutPanels(node) {\n"
       "  if (Array.isArray(node)) {\n"
       "    return node\n"
       "      .filter((item) => !(item && NOT_ON_SHEETS.has(item.helper)))\n"
       "      .map(withoutPanels);\n"
       "  }\n")
new = ("function withoutPanels(node) {\n"
       "  if (Array.isArray(node)) {\n"
       "    return node\n"
       "      .filter((item) => !(item && NOT_ON_SHEETS.has(item.helper)))\n"
       "      .map(withoutPanels)\n"
       "      .filter((item) => !isEmptyGroup(item));\n"
       "  }\n")
assert t.count(old) == 1
t = t.replace(old, new)
old2 = "// The same worksheet with those panels taken off, so the preflight measures\n"
new2 = ("// A row or stack that held nothing but panels goes with them.\n"
        "function isEmptyGroup(item) {\n"
        "  return Boolean(item) && typeof item === \"object\" && !item.helper &&\n"
        "    [\"row\", \"stack\"].some((key) => Array.isArray(item[key]) && item[key].length === 0);\n"
        "}\n"
        "\n"
        "// The same worksheet with those panels taken off, so the preflight measures\n")
assert t.count(old2) == 1
t = t.replace(old2, new2)
if crlf:
    t = t.replace("\n", "\r\n")
P.write_bytes(t.encode("utf-8"))
print("ok")
