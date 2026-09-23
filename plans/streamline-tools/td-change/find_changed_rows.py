"""List ledger rows whose quotes are no longer word for word in their file."""
import re, sys
from pathlib import Path
REPO = Path(r"C:\Users\Daniel\Projects\lessonv4")
ROOT = REPO / "plugins" / "lesson-v4"
LEDGER = REPO / "plans" / sys.argv[1]
PREFIX = sys.argv[2]
Q = re.compile(r"«(.+?)»")
P = re.compile(r"`((?:agents|references|skills|commands|scripts|builder)/[^`]+)`")
norm = lambda t: " ".join(t.split())
cache = {}
def text(rel):
    if rel not in cache:
        cache[rel] = norm((ROOT / rel).read_text(encoding="utf-8"))
    return cache[rel]
n = 0
for raw in LEDGER.read_text(encoding="utf-8").splitlines():
    m = re.match(rf"^\| ({PREFIX}-[A-Z]\d{{2}}) \|", raw)
    if not m:
        continue
    p = P.search(Q.sub("", raw))
    if not p:
        continue
    n += 1
    missing = [q for q in Q.findall(raw) if norm(q) not in text(p.group(1))]
    if missing:
        print(m.group(1), p.group(1))
        for q in missing:
            print("    -", q[:150])
print("rows:", n)
