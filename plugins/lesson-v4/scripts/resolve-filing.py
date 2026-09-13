"""Resolve where a built lesson's resources will be saved, and which lesson came before it.

This is the single filing resolver used by the make-lesson skill. Keeping the rule
here is deliberate: where a lesson lands (and especially the core-versus-foundation
difference below) stays in one place instead of being duplicated inside the
orchestrator.

Usage:
    python resolve-filing.py <year group> <subject> [--working <OUTPUT_DIR>/working]

Where resources go is the teacher's own choice, saved once in the plugin's
settings (scripts/plugin_settings.py), and the resolver prints which of three it is:

    DELIVERY=none     nothing chosen yet: resources stay where the run built them;
                      DELIVERY_OFFERED says whether the choice was offered before
    DELIVERY=folder   copied straight into SAVE_FOLDER
    DELIVERY=sorted   copied into SAVE_FOLDER sorted by school year, term, week,
                      subject and (for daily subjects) day, placed by the
                      school's term dates
    DELIVERY=letterbox a cloud run: pushed to LETTERBOX on LETTERBOX_BRANCH for
                      the teacher's computer to collect and save at login

Every mode prints, with --working:
    PREVIOUS_LESSON  the working folder of the lesson this run built last in the
                     same year and subject (empty when none), so the designer
                     can reuse its exact words

Sorted mode also prints:
    TERM_FOLDER   the half-term folder, e.g. "Summer 2"
    WEEK_NUM      the teaching week within that half-term, e.g. 1
    DAY           the weekday for core subjects (Maths/English/Reading/Writing);
                  empty for foundation subjects, which file with no day layer
    BUMPED        "yes" when the day was stepped forward past an already-filled
                  slot (core only), so the announcement can lead with the move
    IS_CORE       "yes" for core subjects, "no" for foundation; the caller passes
                  DAY to the delivery only when this is "yes"
    DRIVE_CHECKED "no" when the year folder was not found, so no slot was checked

Core subjects are taught daily and filed by day (Maths/Monday/). Foundation
subjects (Science, History, Geography, Art, DT, Music, PE, RE, PSHE, Computing,
and the rest) are taught once a week and file straight into the subject folder
with no day layer.

Week 1 is the first week of the term that starts on a Monday. A date in the
short opening week before it prints TERM_FOLDER, OPENING_WEEK=yes and an ERROR
line and exits 2; a date outside any teaching term prints a single ERROR line
and exits 1. Neither happens outside sorted mode, which has no calendar.

LESSON_RESOURCES_TODAY (YYYY-MM-DD) stands in for today, for tests.
"""
from __future__ import annotations

import glob
import json
import os
import re
import sys
from datetime import date, datetime, timedelta

import plugin_settings

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
TERM_ORDER = ["Autumn 1", "Autumn 2", "Spring 1", "Spring 2", "Summer 1", "Summer 2"]
# The delivery record a run writes; runs before 4.2.186 called it sharepoint.json.
RECORD_NAMES = ("delivery.json", "sharepoint.json")

# Core subjects are taught daily and filed by day (e.g. Maths/Monday/).
# Foundation subjects are taught once per week and go straight into the subject
# folder with no day layer (e.g. Geography/). Adding a day subfolder there would
# create a folder structure that doesn't match how the teacher actually files.
CORE_SUBJECTS = {"maths", "mathematics", "english", "reading", "writing", "literacy", "numeracy"}


def parse_args(argv):
    working_root = ""
    if "--working" in argv:
        i = argv.index("--working")
        working_root = argv[i + 1] if i + 1 < len(argv) else ""
        del argv[i:i + 2]
    # Callers pass the year the way the teacher wrote it ("Year 4", "Y4", "4").
    # Only the number finds the year folder; "Year 4" once missed it silently and
    # a full Monday was offered as free.
    year = re.sub(r"\D", "", argv[0]) if argv else ""
    subject = argv[1] if len(argv) > 1 else ""
    return year, subject, working_root


def delivery_records(working_root):
    for name in RECORD_NAMES:
        yield from glob.glob(os.path.join(working_root, "*", "build-results", name))


def record_args(record):
    with open(record, encoding="utf-8") as fh:
        data = json.load(fh)
    if not data.get("ok"):
        return None
    cmd = data.get("command") or []
    return lambda flag: cmd[cmd.index(flag) + 1] if flag in cmd and cmd.index(flag) + 1 < len(cmd) else ""


def lesson_identity(folder):
    """Year and subject a working folder's design says it was, or None."""
    try:
        with open(os.path.join(folder, "lesson-design.json"), encoding="utf-8") as fh:
            lesson = json.load(fh).get("lesson") or {}
    except (OSError, ValueError, AttributeError):
        return None
    year = re.sub(r"\D", "", str(lesson.get("yearGroup", "")))
    return year, str(lesson.get("subject", "")).strip().lower()


def latest_lesson(working_root, year, subject):
    """Without a calendar there is no slot order, so the latest built lesson in
    the same year and subject is the one before this run's."""
    best = None
    for design in glob.glob(os.path.join(working_root, "*", "lesson-design.json")):
        folder = os.path.dirname(os.path.abspath(design))
        if lesson_identity(folder) != (year, subject.lower()):
            continue
        stamp = os.path.getmtime(design)
        if best is None or stamp > best[0]:
            best = (stamp, folder)
    return best[1] if best else ""


class SortedFiling:
    """The school calendar and the sorted folder tree, for DELIVERY=sorted."""

    def __init__(self, folder, term_dates, year, subject, working_root):
        self.rows = plugin_settings.read_term_dates(term_dates)
        self.year = year
        self.subject = subject
        self.working_root = working_root
        self.is_core = subject.lower() in CORE_SUBJECTS
        self.year_dir = self.find_year_dir(folder)

    def term_of(self, d):
        """(term folder, term start) when d sits in a teaching term, else None."""
        for name, start, end in self.rows:
            if start <= d <= end:
                return name, start
        return None

    # Week 1 is the first week that begins on a Monday inside the term, because
    # that is how the teacher numbers the drive. Counting from the term's first
    # day instead put every Tuesday to Friday a week early whenever a term opened
    # mid-week (Autumn 2026 opened on a Tuesday, so Tuesday 15 September came out
    # as Week 3 when the drive calls it Week 2). Days before that first Monday are
    # a short opening week with no week number: the teacher names that folder by
    # hand.
    def resolve(self, d):
        """(term, week) for a teaching weekday; week is None in a short opening week."""
        t = self.term_of(d)
        if not t:
            return None
        term, start = t
        week1 = start + timedelta(days=(7 - start.weekday()) % 7)
        if d < week1:
            return term, None
        return term, (d - week1).days // 7 + 1

    def first_teaching_day(self, d, limit=70):
        for _ in range(limit):
            if d.weekday() < 5 and self.term_of(d):
                return d
            d += timedelta(days=1)
        return None

    # The school-year prefix on the year folder changes each year, so match on
    # the "Year N" suffix.
    def find_year_dir(self, folder):
        if not (self.year and folder):
            return None
        hits = sorted(glob.glob(os.path.join(glob.escape(folder), f"* - Year {self.year}")))
        return hits[-1] if hits else None

    @staticmethod
    def has_content(p):
        # A day (or subject) folder is "taken" if it holds ANY real file: an
        # auto-built lesson, or the teacher's own material (an assessment .pdf, a
        # hand-made deck). This both stops a lesson back-filling onto it and stops
        # one ever landing on top of the teacher's own work. Office lock files
        # (~$...) and dotfiles are not real content.
        if not os.path.isdir(p):
            return False
        return any(not f.startswith("~$") and not f.startswith(".") for f in os.listdir(p))

    def occupied(self, d):
        if not (self.year_dir and self.subject):
            return False
        r = self.resolve(d)
        if not r or r[1] is None:
            return False
        term, week = r
        if self.is_core:
            p = os.path.join(self.year_dir, term, "Week %d" % week, self.subject, DAYS[d.weekday()])
        else:
            p = os.path.join(self.year_dir, term, "Week %d" % week, self.subject)
        return self.has_content(p)

    # The lesson children had last in this subject. Children read a reworded
    # success criterion as a new rule, so the designer copies yesterday's words,
    # and the plan only says what yesterday covered, never how the slides put it.
    # Each run's delivery record already names the slot it filed to, so the latest
    # slot before this one is found without guessing from folder names. Records
    # from before this school year are ignored, or last September's Week 1 would
    # pass for this one's.
    def slot_key(self, term, week, day):
        return (TERM_ORDER.index(term), int(week), DAYS.index(day) if day in DAYS else -1)

    def previous_lesson(self, term, week, day):
        target = self.slot_key(term, week, day if self.is_core else "")
        year_start = min((s for _, s, _ in self.rows), default=date.min) - timedelta(days=42)
        best = None
        for record in delivery_records(self.working_root):
            try:
                if date.fromtimestamp(os.path.getmtime(record)) < year_start:
                    continue
                arg = record_args(record)
                if arg is None:
                    continue
                if arg("--year") != self.year or arg("--subject").lower() != self.subject.lower():
                    continue
                key = self.slot_key(arg("--term-folder"), arg("--week"), arg("--day") if self.is_core else "")
            except (OSError, ValueError, IndexError):
                continue
            if key >= target:
                continue
            folder = os.path.dirname(os.path.dirname(os.path.abspath(record)))
            if not os.path.isfile(os.path.join(folder, "lesson-design.json")):
                continue
            rank = (key, os.path.getmtime(record))
            if best is None or rank > best[0]:
                best = (rank, folder)
        return best[1] if best else ""

    def place(self, today):
        """The slot for a lesson built on `today`, as a dict, or an error dict.

        Shared by this script and the login filer, which places lessons built
        in the cloud when the teacher's computer can see the drive.
        """
        # Resolve today's starting target, rolling Fri/weekend forward to the next teaching day.
        target = self.first_teaching_day(today + timedelta(days={4: 3, 5: 2, 6: 1}.get(today.weekday(), 0)))
        if not target:
            return {"error": "target date not in any term period", "code": 1}
        d = target
        bumped = False
        if self.is_core:
            # Place by sequence, never back-fill an earlier gap. Scan this teaching
            # week Mon..Fri for the LAST day already holding content, then place on
            # the first free day after it (but never earlier than today's target). A
            # lesson sequence only moves forward, so an empty day that sits before a
            # filled one is not a valid slot.
            week_monday = target - timedelta(days=target.weekday())
            last_occ = None
            for i in range(5):
                wd = week_monday + timedelta(days=i)
                if wd.weekday() < 5 and self.resolve(wd) and self.occupied(wd):
                    last_occ = wd
            if last_occ is not None:
                nd = self.first_teaching_day(last_occ + timedelta(days=1), limit=15)
                if nd and nd > d:
                    d = nd
            # Step past any day that is itself still filled: a first-day-of-week that
            # already holds content, or a slot just filled earlier in this same login
            # run. Spills into the following week when a week is full.
            for _ in range(15):
                if not self.occupied(d):
                    break
                nd = self.first_teaching_day(d + timedelta(days=1), limit=15)
                if not nd:
                    break
                d = nd
            bumped = d != target
        # Foundation subjects: no day layer, no bumping. The week slot resolves once
        # and the teacher redirects if it already holds content.
        res = self.resolve(d)
        if res and res[1] is None:
            # Code 2, distinct from "out of term", so the caller asks the teacher
            # which folder they made for the opening days instead of guessing one.
            return {
                "error": f"{DAYS[d.weekday()]} {d:%d %B} falls before Week 1 of {res[0]}",
                "code": 2,
                "term": res[0],
            }
        if not res:
            return {"error": "target date not in any term period", "code": 1}
        term, week = res
        return {
            "term": term,
            "week": week,
            "day": DAYS[d.weekday()] if self.is_core else "",
            "bumped": bumped,
            "checked": bool(self.year_dir),
        }

    def run(self, today):
        slot = self.place(today)
        if slot.get("code") == 2:
            print(f"TERM_FOLDER={slot['term']}\nOPENING_WEEK=yes\nERROR: {slot['error']}")
            return 2
        if "error" in slot:
            # Exit non-zero so the caller can tell an unresolved destination
            # from a resolved one instead of parsing stdout for the ERROR line.
            print(f"ERROR: {slot['error']}")
            return 1
        print(
            f"TERM_FOLDER={slot['term']}\nWEEK_NUM={slot['week']}\nDAY={slot['day']}\n"
            f"BUMPED={'yes' if slot['bumped'] else 'no'}\nIS_CORE={'yes' if self.is_core else 'no'}"
        )
        # Without the year folder nothing was checked, so the slot is only the
        # calendar's guess and must not be announced as free.
        print(f"DRIVE_CHECKED={'yes' if slot['checked'] else 'no'}")
        if self.working_root:
            print(f"PREVIOUS_LESSON={self.previous_lesson(slot['term'], slot['week'], slot['day'])}")
        return 0


def today():
    configured = os.environ.get("LESSON_RESOURCES_TODAY", "").strip()
    return datetime.strptime(configured, "%Y-%m-%d").date() if configured else date.today()


def main(argv=None):
    args = list(sys.argv[1:] if argv is None else argv)
    if "--letterbox" in args:
        # A cloud box with no environment settings (ChatGPT Work) names its
        # letterbox on the command line instead.
        i = args.index("--letterbox")
        if i + 1 < len(args):
            os.environ[plugin_settings.LETTERBOX_VARIABLE] = args[i + 1]
        del args[i:i + 2]
    year, subject, working_root = parse_args(args)
    chosen = plugin_settings.delivery()
    route = ""
    if chosen["mode"] == "letterbox":
        route = "git"
        if not chosen["folder"]:
            # Nothing attached the letterbox (Codex's cloud attaches one
            # repository), so fetch it now, before any design work, while a
            # missing key or a blocked address can still be fixed.
            prepared = plugin_settings.prepare_letterbox() or {}
            chosen = {**chosen, "folder": prepared.get("clone", "")}
            if not chosen["folder"]:
                # No git sign-in here. The host's own GitHub tools may still
                # post it (ChatGPT Work), so this is a route, not a failure.
                route = "connector"
                chosen["reason"] = prepared.get("error", "")
    print(f"DELIVERY={chosen['mode']}")
    if chosen["mode"] == "letterbox":
        # A cloud run. The teacher's computer places the lesson when it collects
        # it, so there is no slot to announce here, only where it is going.
        print(f"LETTERBOX_ROUTE={route}")
        print(f"LETTERBOX_BRANCH={chosen['branch']}")
        if route == "git":
            print(f"LETTERBOX={chosen['folder']}")
        else:
            print(f"LETTERBOX_REPO={chosen.get('missing', '')}")
            print(f"LETTERBOX_NOTE=git could not reach the letterbox ({chosen.get('reason', '')}); post it with this host's GitHub tools")
    elif chosen["mode"] == "none":
        # Whether the teacher has already been offered the choice, so the
        # offer is made once rather than at the end of every lesson.
        print(f"DELIVERY_OFFERED={'yes' if chosen['offered'] else 'no'}")
    else:
        print(f"SAVE_FOLDER={chosen['folder']}")
    if chosen["mode"] == "sorted":
        try:
            filing = SortedFiling(chosen["folder"], chosen["termDates"], year, subject, working_root)
        except OSError as exc:
            print(f"ERROR: the saved term dates could not be read ({exc})")
            return 1
        return filing.run(today())
    if working_root:
        print(f"PREVIOUS_LESSON={latest_lesson(working_root, year, subject)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
