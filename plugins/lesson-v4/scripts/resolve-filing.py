"""Resolve where a built lesson, deck, or set of resources is filed on SharePoint.

This is the single filing resolver used by the make-lesson skill. Keeping the rule
here is deliberate: where a lesson lands (and especially the core-versus-foundation
difference below) stays in one place instead of being duplicated inside the
orchestrator.

Usage:
    python3 resolve-filing.py <Term.md path> <year group> <subject>

It prints five KEY=VALUE lines the caller stores:
    TERM_FOLDER   the half-term folder, e.g. "Summer 2"
    WEEK_NUM      the teaching week within that half-term, e.g. 1
    DAY           the weekday for core subjects (Maths/English/Reading/Writing);
                  empty for foundation subjects, which file with no day layer
    BUMPED        "yes" when the day was stepped forward past an already-filled
                  slot (core only), so the announcement can lead with the move
    IS_CORE       "yes" for core subjects, "no" for foundation; the caller passes
                  DAY to the sync only when this is "yes"
    DRIVE_CHECKED "no" when the year folder was not found, so no slot was checked

Core subjects are taught daily and filed by day (Maths/Monday/). Foundation
subjects (Science, History, Geography, Art, DT, Music, PE, RE, PSHE, Computing,
and the rest) are taught once a week and file straight into the subject folder
with no day layer, matching how the teacher actually organises the drive.

Week 1 is the first week of the term that starts on a Monday. A date in the
short opening week before it prints TERM_FOLDER, OPENING_WEEK=yes and an ERROR
line and exits 2; a date outside any teaching term prints a single ERROR line
and exits 1.
"""
import sys, re, os, glob
from datetime import date, timedelta, datetime

term_md = sys.argv[1]
# Callers pass the year the way the teacher wrote it ("Year 4", "Y4", "4").
# Only the number finds the drive folder; "Year 4" once missed it silently and
# a full Monday was offered as free.
year    = re.sub(r'\D', '', sys.argv[2]) if len(sys.argv) > 2 else ''
subject = sys.argv[3] if len(sys.argv) > 3 else ''

def parse_date(s):
    s = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', s.strip())
    for fmt in ('%A %d %B %Y', '%d %B %Y', '%d %b %Y'):
        try: return datetime.strptime(s, fmt).date()
        except ValueError: pass
    return None

rows = []
for line in open(term_md):
    if '|' not in line or '---' in line: continue
    parts = [p.strip() for p in line.strip().strip('|').split('|')]
    if len(parts) < 3 or parts[1] in ('Starts', ''): continue
    s, e = parse_date(parts[1]), parse_date(parts[2])
    if s and e: rows.append((parts[0], s, e))

TERM_MAP = {'Autumn, term 1':'Autumn 1','Autumn, term 2':'Autumn 2',
            'Spring, term 3':'Spring 1','Spring, term 4':'Spring 2',
            'Summer, term 5':'Summer 1','Summer, term 6':'Summer 2'}
DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']

# Core subjects are taught daily and filed by day (e.g. Maths/Monday/).
# Foundation subjects are taught once per week and go straight into the subject
# folder with no day layer (e.g. Geography/). Adding a day subfolder there would
# create a folder structure that doesn't match how the teacher actually files.
CORE_SUBJECTS = {'maths', 'mathematics', 'english', 'reading', 'writing', 'literacy', 'numeracy'}
is_core = subject.lower() in CORE_SUBJECTS

def term_of(d):                       # (term folder, term start) when d sits in a teaching term, else None
    for name, start, end in rows:
        if start == end: continue
        if start <= d <= end and name in TERM_MAP:
            return TERM_MAP[name], start
    return None

# Week 1 is the first week that begins on a Monday inside the term, because that
# is how the teacher numbers the drive. Counting from the term's first day
# instead put every Tuesday to Friday a week early whenever a term opened
# mid-week (Autumn 2026 opened on a Tuesday, so Tuesday 15 September came out
# as Week 3 when the drive calls it Week 2). Days before that first Monday are a
# short opening week with no week number: the teacher names that folder by hand.
def resolve(d):                       # (term, week) for a teaching weekday; week is None in a short opening week
    t = term_of(d)
    if not t: return None
    term, start = t
    week1 = start + timedelta(days=(7 - start.weekday()) % 7)
    if d < week1: return term, None
    return term, (d - week1).days // 7 + 1

def first_teaching_day(d, limit=70):  # first weekday on/after d that sits in a teaching term
    for _ in range(limit):
        if d.weekday() < 5 and term_of(d): return d
        d += timedelta(days=1)
    return None

# The academic-year prefix on the year folder changes each year, so match on the "Year N" suffix.
# Try the Windows drive form first (this script runs under Windows Python, where "/e/..." won't resolve).
def find_year_dir(y):
    if not y: return None
    override = os.environ.get('SP_BASE')
    bases = [override] if override else ["E:/Felmore Primary School", "/e/Felmore Primary School"]
    for base in bases:
        hits = sorted(glob.glob("%s/* - Year %s" % (base, y)))
        if hits: return hits[-1]
    return None
year_dir = find_year_dir(year)

def _has_content(p):
    # A day (or subject) folder is "taken" if it holds ANY real file: an
    # auto-built lesson, or the teacher's own material (an assessment .pdf, a
    # hand-made deck). This both stops a lesson back-filling onto it and stops
    # one ever landing on top of the teacher's own work. Office lock files
    # (~$...) and dotfiles are not real content.
    if not os.path.isdir(p): return False
    return any(not f.startswith('~$') and not f.startswith('.') for f in os.listdir(p))

def occupied(d):
    if not (year_dir and subject): return False
    r = resolve(d)
    if not r or r[1] is None: return False
    term, week = r
    if is_core:
        p = os.path.join(year_dir, term, "Week %d" % week, subject, DAYS[d.weekday()])
    else:
        p = os.path.join(year_dir, term, "Week %d" % week, subject)
    return _has_content(p)

# Resolve today's starting target, rolling Fri/weekend forward to the next teaching day.
today_env = os.environ.get('SP_TODAY')
today = datetime.strptime(today_env, '%Y-%m-%d').date() if today_env else date.today()
target = first_teaching_day(today + timedelta(days={4:3,5:2,6:1}.get(today.weekday(),0)))

bumped = False
if target:
    d = target
    if is_core:
        # Place by sequence, never back-fill an earlier gap. Scan this teaching
        # week Mon..Fri for the LAST day already holding content, then place on
        # the first free day after it (but never earlier than today's target). A
        # lesson sequence only moves forward, so an empty day that sits before a
        # filled one is not a valid slot.
        week_monday = target - timedelta(days=target.weekday())
        last_occ = None
        for i in range(5):
            wd = week_monday + timedelta(days=i)
            if wd.weekday() < 5 and resolve(wd) and occupied(wd):
                last_occ = wd
        if last_occ is not None:
            nd = first_teaching_day(last_occ + timedelta(days=1), limit=15)
            if nd and nd > d: d = nd
        # Step past any day that is itself still filled: a first-day-of-week that
        # already holds content, or a slot just filled earlier in this same login
        # run. Spills into the following week when a week is full.
        for _ in range(15):
            if not occupied(d): break
            nd = first_teaching_day(d + timedelta(days=1), limit=15)
            if not nd: break
            d = nd
        bumped = (d != target)
    # Foundation subjects: no day layer, no bumping. The week slot resolves once
    # and the teacher redirects if it already holds content.
    res = resolve(d)
    if res and res[1] is None:
        # Exit 2, distinct from "out of term", so the caller asks the teacher
        # which folder they made for the opening days instead of guessing one.
        print(f"TERM_FOLDER={res[0]}\nOPENING_WEEK=yes\nERROR: {DAYS[d.weekday()]} {d:%d %B} falls before Week 1 of {res[0]}")
        sys.exit(2)
    if res:
        term, week = res
        day_out = DAYS[d.weekday()] if is_core else ''
        print(f"TERM_FOLDER={term}\nWEEK_NUM={week}\nDAY={day_out}\nBUMPED={'yes' if bumped else 'no'}\nIS_CORE={'yes' if is_core else 'no'}")
        # Without the year folder nothing was checked, so the slot is only the
        # calendar's guess and must not be announced as free.
        print(f"DRIVE_CHECKED={'yes' if year_dir else 'no'}")
    else:
        # Exit non-zero so the caller can tell an unresolved destination
        # from a resolved one instead of parsing stdout for the ERROR line.
        print("ERROR: target date not in any term period")
        sys.exit(1)
else:
    print("ERROR: target date not in any term period")
    sys.exit(1)
