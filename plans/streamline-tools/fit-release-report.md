# The long-criteria fit release (4.2.289): what was built, and the proof

Built from `fit-release-brief.md` on 24 September 2026, on the 4.2.288 tree
(`baabb1b3`), then repaired after the first check (`fit-release-check.md`).
At the lead's word after those repairs, the lesson check now measures exactly
the shapes the guidance names (see "The check and the guidance name the same
shapes" below). Then repaired again after the second check
(`fit-release-second-check.md`; see "The second check, and what was repaired"),
after the third (`fit-release-third-check.md`; see "The third check, and
what was repaired"), and after the fourth (`fit-release-fourth-check.md`; see
"The fourth check, and what was repaired"). Last, after the computer restarted,
a second agent took the release over (`fit-release-handover.md`), checked the
fourth round and built his ruling on the last resort (see "His ruling on the
last resort, and what was built"), then the lead's two last points, each
settled by his own earlier words (see "The criteria cue is a note, and a list
too long even at 16pt never stops the run"), then the fifth check's repairs
(see "The fifth check, and what was repaired"). Nothing is committed or
pushed. Every suite passes. No saved design changes, and
no saved slide that drew before changes. The six long lists in his style now
draw.

## In short

- **The step fitter measures truly.** The three measuring faults are mended.
  All 114 real lists now fit today's 4.60in practice panel at 18pt or more, and
  no list that fitted before changed size in any of fourteen shapes. After the
  check, a short list in a shallow band is also no longer refused a hair short.
- **The practice panel widens itself, for the list only.** The four live
  practice templates share one choice: the narrowest of 4.60, 5.50 and 6.35in
  that holds the whole list at 18pt or more. Only the list not fitting moves it
  to the next width. No real list and no saved slide in the repository widens.
  The six long lists take 5.50in (four) or 6.35in (two) on every template. A
  number-line slide draws with the line above the working space.
- **The lesson check catches a list that neither the practice panel nor the
  half-width split can hold,** before any slides are made, and asks the lesson
  designer to tighten the wording. It measures exactly the shapes the guidance
  sends the slide designer to: the practice panel at its three widths, and the
  half-width side (0.15in taller than the widest practice panel). So the check
  and the guidance name the same shapes. None of the 98 steps lists in the 90
  saved designs is refused.
- **The guidance says what the code now does,** in `slide-success-criteria.md`
  and `templates.md`. The half-width split stays named as the move when even the
  widest practice panel refuses.
- **A list the lesson designer cannot tighten never costs the deck, and is
  drawn a little smaller rather than left blank.** Only once tightening has
  failed, the designer marks the list itself too long
  (`"tooLongForPanels": true`) and tells the teacher why in a flag, in plain
  words. The check reads only the mark, never a flag's words, and lets a marked
  list through. When neither the practice panel at its widest nor the
  half-width split holds it at 18pt, the builder draws it at the largest size
  that fits, down to 16pt, on a finished slide it names for him to check (his
  ruling of 24 September 2026); a sticky line beside it stays at 18pt, and a
  mark left on a list that fits at 18pt changes nothing.
  A marked list too long even at 16pt passes too, with a plain note, because
  the deck is always made; the review page asks for it back to be tightened.
  Only a list that still fits nowhere on a slide, the rarest case, is a page
  to check.
- **The criteria cue is a note, never a refusal.** The slide designer's own
  check no longer refuses a list of six steps or 320 characters, so a long
  list that fits costs it no repair pass. The refusal, the design's
  contract, the lesson designer's own list, the review page and the slide
  guidance all say so, and the reviewer is asked whether the list could be
  tightened until it fits at 18pt.

## The first check, and what was repaired

`fit-release-check.md` found the release sound overall and four things to
repair. I checked each one myself before repairing it.

1. **The short-list mend still refused in shallow bands.** Confirmed: the
   one-step list `Round to the nearer ten.` was refused in the bottom 40% band,
   the 30% band, the `quad-v` strip and the `centre-big-v` strip. The card was
   0.31 to 0.34in against the 0.35in it needs. The mend sized the list with the
   small share's gap and badge, and both grow at the new height.
   **Repair:** the list is measured again at the height it is given until the
   need settles (at most eight passes; in practice two or three). 50 real-list
   results in the bottom bands and strips now draw, and none that drew before
   moved. **Test:** `fault 3 in a shallow band` in
   `criteria-fitter-mends.test.js`.
2. **The panel widened for any refusal inside it.** Confirmed: the plugin's own
   `test-lessons/eq-fractions` (and its copy under `output/`) has slides 5 and
   9 to 12 with the steps and a fraction wall in one criteria stack. These
   widened to 5.50in to make room for the wall. So the first report's "no saved
   slide widened" was true of the investigation's saved slides, which leave test
   lessons out, but untrue of the repository.
   **Repair:** only `STEP_TEXT_OVERLOAD` (the list not fitting at 18pt) tries
   the next width. Any other refusal is raised at the width where it happened.
   Slides 5 and 9 to 12, where the wall is what the panel refuses, are now
   refused at 4.60in, as they were before the release. (Slides 7 and 8 are
   different: see the second check's finding 2.) Across all 1,123 saved slides,
   no slide draws with a practice panel wider than 4.60in. **Test:** `only the
   list not fitting widens the panel` draws the fraction-wall slides.
3. **A photo's floor finding was reported twice on a widened slide.** Confirmed:
   the dry drawings silenced warnings but still wrote to the three finding
   stores (picture floor, figure underfilling its zone, missing picture).
   **Repair:** `withoutRecording` (it was `withoutWarnings`) now also stops
   those stores keeping anything; each store asks `recording()` first.
   **Test:** `a photo beside the working space stays beside it, and its findings
   are reported once`.
   **The photo case, said plainly:** a photograph always draws, so on a widened
   `maths-turn-sc` it stays beside the working space and gets smaller. Below its
   readable floor it is reported once, as it would be at 4.60in (a landscape
   photo beside the working space is already under the 3.0in floor at 4.60in).
   Moving it above would not rescue it, because above the working space it gets
   at most half the height. So the "picture above when side by side drops it
   below its minimum" rule moves a picture that cannot be drawn in its half (a
   number line). It does not move a photograph that merely shrinks. The build
   log and the code comment say this.
4. **The half-width split is roomier than the guidance and the check said.**
   Confirmed and widened: I listed every zone a free template gives a criteria
   panel (`scratch/fitb/zones.js`: 29 within half the slide). Three are beaten
   by no other on both width and height: the half-width side (6.3465 by 6.65in),
   the top 60% band of `split-v-60-40` (12.893 by 3.87in, 49.9% of the slide)
   and the centre of `central-callouts-4` (6.704 by 3.99in). The widest practice
   panel (6.35 by 6.50in) is a fourth.
   **Repair, first:** the check passed a list any of these held. **Then, at
   the lead's word,** it was narrowed to the shapes the guidance names: the
   practice panel at its three widths and the half-width side. It refuses a
   list none of those holds (see "The check and the guidance name the same
   shapes" below). Its message quotes the half-width side, the roomiest of them,
   and no longer says "no slide can give it more room". The guidance names the
   half-width split again as the move when even the widest practice panel
   refuses: "0.15in taller, so it holds a little more".
   **Tests:** below, with the named-shapes change.
5. **The refusal at the widest panel (you asked, and I had noted it).** It
   offered "a wider or taller `sc-panel` composition up to half the slide". Now,
   at the widest practice panel only, it says "The practice panel is already as
   wide as it goes. Give the list more room instead: the half-width split
   (`split-h-50-50`) with the criteria in an `sc-panel` down one whole side is a
   little taller and can hold what this panel cannot, never fewer criteria."
   Every other refusal is unchanged. It still keeps decisions 3 and 13: a layout
   change, never fewer criteria, no report back. **Test:** the "no width holds"
   test.
6. **The check's smaller point:** a picture above the working space takes at
   most half the height. The number-line test now holds that.

## The second check, and what was repaired

`fit-release-second-check.md` found the code sound and five things to repair. I
checked each one myself before repairing it.

1. **Most of the new `templates.md` paragraph was held by nothing.** Confirmed
   (the guidance test read only its first and last words). **Repair:** a new
   success-criteria row, SC-FIT-289-TPL, pins the paragraph whole and in the
   `maths-turn-sc` section, with its reason in the mapping builder. Taking out
   "never past half the slide", turning "There is nothing to set" into an
   instruction, or moving the paragraph to the end of the file now each fail
   the pin test (`scratch/fitb/undo-more.txt`).
2. **"Refused at 4.60 inches, never widened" and "65 refused the same way" were
   not true of every fraction-wall slide.** Confirmed: on slides 7 and 8 (and
   their copy under `output/`) the five steps share the criteria stack with the
   wall, and it is the steps that do not fit. So the panel tries 5.50 and
   6.35in, as for any list, and the slide is refused at 6.35in by the widest
   card's numbers. The delivered deck is the same (a "check this slide" page).
   **Repair:** the log and this report now say this. The whole-repository
   comparison now compares refusal words as well as signals: 60 slides are
   refused in the same words and 5 in other words (these four, and
   `childrens-lives-continuity-and-change` #14, whose short-list card is now
   measured a character narrower). The fraction-wall test names which slides it
   holds, and now also holds slides 7 and 8 to their refusal at the widest card.
3. **Two `templates.md` sentences said the bottom strips hold no criteria
   list.** Confirmed and measured: the `quad-v` strip (and the 30% band) now
   holds one step of up to two lines, and the `centre-big-v` strip one one-line
   step. Neither holds two steps. **Repair:** "which holds one criteria step of
   at most two lines at 18pt and never two steps" and "holds one one-line
   criteria step at 18pt and never two". The advice to keep a method's steps out
   of them stands. SC-K38 moved with its reason, and SC-K12's whole-paragraph
   pin follows its paragraph. (That paragraph writes its "0.4 to 0.5 inch" range with an en dash. It is
   from before this release and in the ledger's quote, so I left it.)
4. **A list the lesson designer cannot tighten ended the run blocked, with no
   deck, against decision 11.** Confirmed. The playbook's hand-back is: the
   designer's three passes, one focused repair, one fresh attempt, then
   `BLOCKED` "if that attempt also fails the validator". No program sits in
   that loop, and the playbook is at its byte cap.
   **Repair, in the validator only:** the refusal still asks the designer to
   tighten first. Then it offers a way out: keep the words and flag the list
   for the teacher in `flagsForTeacher`. A list flagged that way passes the
   check. At the build, every slide that shows it is refused at the widest
   panel, and the deck is written with those slides flagged, as for any list no
   shape holds. The designer and its focused repair read the refusal's lines,
   so the way out reaches them without new playbook words.
   **What the third check corrected:** as first written, the refusal said the
   flag costs "its slide", asked for a line beginning with the list's id, and
   matched that line to the character, and the builder test was named for one
   slide. What it says and does now is in "The third check, and what was
   repaired" below.
   **Tests:** now
   `test_a_list_it_cannot_tighten_never_costs_the_deck_and_the_refusal_says_what_it_does_cost`
   (the words and their cost; the order, tighten before the way out; a flag in
   plain words passes) and the builder test `a list no width holds costs every
   slide that shows it, never the deck: each of those is a page to check`,
   which builds a deck with `--deliver-flagged`, with the list on two slides,
   and checks that both are written flagged and the other slide drawn.
   **Honest limit:** the check cannot see whether a flagged list was tightened
   first. What holds it is the cost said in the refusal, the designer's own
   contract and the reviewer's question (the third check's item 2).
5. **Two small test gaps.** Both are now tested:
   - `no finding store keeps what a try raises` covers the zone-fill and
     missing-picture stores directly;
   - `at 4.60in nothing moves` uses a write-in place-value chart that cannot sit
     beside the working space. At 4.60in it is refused, as before; once the
     panel widens it goes above.

   Each of these, and each wording in 1 and 3, was undone in a copy of the plugin
   and caught (`scratch/fitb/undo-more.txt`). I did not add the other gaps it
   named (the check's own copy of the short-list rule and the allowances, which
   it says never change a verdict in the named shapes; the 17 September
   short-list rule for criteria panels only), which are from before this release
   or harmless weight.

## The third check, and what was repaired

After the fourth check, the flag these repairs read was replaced by a mark on
the list itself (see the next section). Items 3 and 4 below describe the flag
reading as it was built then; the rest still stands in substance, reworded for
the mark. The blank page these items give as the cost has since given way to his
ruling on the last resort: a marked list is drawn smaller, down to 16pt.

`fit-release-third-check.md` followed the way out end to end (a flagged design
passes, the slide check refuses its slides, the run's own build writes the deck)
and judged it the least invasive faithful way to keep decision 11. It found six
things to repair. I checked each one myself before repairing it.

1. **The way out said it costs one slide; it blanks every slide that shows the
   list.** Confirmed: a refused slide is not drawn with a flag, it is replaced
   by a page with only its title and "Check this slide before teaching". In the
   checker's build, six of 29 slides came out that way; in the saved decks a
   list is on a median of 3 slides, up to 11.
   **Repair:** the refusal now ends: "The check then lets it through, but it
   costs every slide that shows the list: each reaches the teacher as a blank
   page that says to check it before teaching, with its question, working
   space and criteria not drawn. So tighten it if any word can go." The build
   log and this report say the same, and the builder test is renamed (above).
   **Tests:** the Python test holds the cost sentence; the builder test puts the
   list on two slides and finds both blank and the third drawn.
2. **The designer's contract and the reviewer said nothing about the flag.**
   Confirmed: the flag channel's contract (`output-template.md`, "Put a concise
   string here only for:") and the lesson designer's own list ("Three things
   belong") named five and three kinds of flag, and not this one; the review
   page showed the flag only at the very end, with nothing beside the list.
   **Repair:**
   - `output-template.md` gains a last kind: "as a last resort, a
     success-criteria list the lesson check refuses as too long for every
     criteria panel, which you have tightened and still cannot fit ... It costs
     every slide that shows the list, each of which reaches the teacher as a
     blank page to check before teaching, so it is never a way round
     tightening."
   - `lesson-designer.md` gains "A fourth, only as a last resort", ending
     "Every slide that shows that list then reaches the teacher as a blank page
     to check before teaching, so tighten first."
   - The review page, beside a flagged list, now says: "Lesson check (read this
     one): no criteria panel a slide is built with holds this list at 18pt, and
     the lesson designer flagged it for the teacher instead of tightening it,
     so every slide that shows it will reach the teacher as a blank page to
     check before teaching. Could any step lose words without losing what it
     tells a stuck child to do? If so, return `REDESIGN REQUIRED` and name the
     tightening: the words are the lesson designer's to change." This follows
     his ruling today: a fix that changes what children read is the lesson
     designer's, with the reviewer naming it. `REDESIGN REQUIRED` is the
     reviewer's existing return to the lesson designer, and the reviewer's own
     file is untouched: the question sits on the page it reads, beside the list.
   **Tests:** `test_the_designer_contract_names_the_flag_and_its_cost` and
   `test_the_reviewer_is_asked_whether_a_flagged_list_could_be_tightened`.
3. **The flag had to match to the character, so a near miss ended the run with
   no deck.** Confirmed from the checker's table (backticks, `SC-001`, a
   leading space, "panel" for "panels", plain English: each refused).
   **Repair:** the check sets aside case, backticks, quote marks, other
   punctuation and spacing. A flag covers a list when it names the list (by its
   first four words, or by its id if the designer writes one) and says it does
   not fit ("too long", "does not fit", "cannot fit", "too big" and the like).
   A flag that says a criteria list is too long without naming which covers one
   list only. A flag that names the list but does not say it does not fit is
   pointed out in the refusal ("names this list but does not say it does not
   fit"), so the designer sees its near miss. **Tests:**
   `test_a_flag_is_matched_forgivingly_so_a_near_miss_never_costs_the_deck`
   (five near misses now pass, the backtick case among them) and
   `test_a_flag_must_say_the_list_does_not_fit_and_a_flag_for_another_list_lets_nothing_through`.
4. **The flag reached him with an internal id, and could outlive the problem.**
   Confirmed.
   **Repair:** the refusal no longer asks for an id. It asks for "plain words
   for the teacher, that names the list by its first words", and quotes those
   words ("Write the 3-digit number on top..."). A flag left on a list that
   fits is not refused (refusing it would send a reviewer's shortening down the
   fresh-attempt route, as the checker found). It is named as a note, in two
   places:
   - after the check's pass, on its own line:
     "LESSON_DESIGN_NOTE: flagsForTeacher[0] says the success criteria that
     begin "Partition each number." are too long for the criteria panels, but
     they fit now: take the flag out, so the teacher is not told something
     untrue. This is a note; the check passed." The pass line itself is
     unchanged, and the note goes to the error stream, so nothing that reads
     the pass reads it differently;
   - on the review page, beside the list: "a flag for the teacher calls this
     list too long for the criteria panels, but it fits; say so in your review,
     so the flag comes out".
   **Tests:** `test_a_flag_on_a_list_that_fits_is_a_note_not_a_refusal` and
   `test_the_note_reaches_whoever_runs_the_check_and_leaves_the_pass_exactly_as_it_was`
   (it runs the check as a program).
5. **The slide designer did not know a flagged list was coming.** Confirmed:
   the widest refusal told it the half-width split "can hold what this panel
   cannot", which the lesson check had already found untrue for that list.
   **Repair:** the guidance now says "One it could not tighten is flagged for
   the teacher in the design's `flagsForTeacher` as too long for the criteria
   panels: no panel holds it, so spend no repair pass looking for one, and each
   slide that shows it is delivered flagged." The widest refusal adds: "If the
   lesson design flags this list for the teacher as too long for the criteria
   panels, no panel holds it: leave the slide, which is delivered flagged for
   the teacher to check." SC-K06's whole-paragraph pin follows its paragraph;
   SC-DEC-11-FIT's sentence is unchanged. **Tests:** the guidance test and the
   builder's widest-refusal test.
6. **Three attacks passed every suite.** Each is now caught:
   - two lists too long, only the first named (V8), and a flag for one list
     letting every list through (V9):
     `test_two_lists_too_long_need_a_flag_each`. It names both lists by their
     first words, lets only the flagged one through, and needs a flag each (or
     one that says both);
   - a paragraph written after the pinned `templates.md` paragraph that undoes
     it: `test_nothing_offers_to_set_the_panel_width_and_the_widening_paragraph_ends_its_section`.
     There is no width setting anywhere a slide designer reads, and the
     widening paragraph is the last in its section;
   - the one-slide count: `transfer-discovery` slide 10 is refused under both
     builders only in the in-process drawing, because it prepared no parachute
     figure. A real build draws it the same under both, so the true figures are
     1,048 identical and 64 refused, as the second check found. The log and
     this report now say so.

Each repair was undone, one at a time, in a copy of the plugin, and a test
failed every time: twelve changes, twelve caught
(`scratch/fitb/undo-third.txt`). I left one thing as it was: the refusal asks
the designer to say why the list is too long, and the check does not hold the
"why". The flag is written for him to read, so it is his to judge.

## The fourth check, and what was repaired

After his ruling on the last resort (the next section), a marked list is drawn
smaller rather than delivered as a blank page. The items below describe the
blank page as it was built in this round; the wording quoted in them has since
followed the ruling.

`fit-release-fourth-check.md` found decision 11 held end to end and the cost
stated truly. Its findings 1, 2 and 5 all came from reading the flag's words,
and I checked each against the code before changing anything:

- a flag written for something else, such as "The plan's success criterion
  "I can multiply any 3-digit number" is too big for one lesson", let a
  too-long list through;
- a one-word first step, or two lists opening with the same four words, let
  one flag cover lists it did not name;
- the note could tell the designer to take out a flag that was needed;
- two plain-English flags were still refused.

At the lead's word, the matching was removed rather than tuned again.

1. **A mark on the list itself.** Each success-criteria object may carry
   `tooLongForPanels`, false or left out by default. When the lesson designer
   truly cannot tighten a list no panel holds, it sets it `true` on that list,
   and writes its reason in `flagsForTeacher` as for any other departure, in
   plain English naming the list by its words. The check reads only the mark:
   - a list too long and unmarked is refused (tighten first, and the true cost
     stated);
   - a list marked and too long passes;
   - a list marked but not too long draws a note, never a refusal.
   No flag's words are read anywhere, so none of the fourth check's flags can
   let a list through or be told to come out.
   **Where it is written:** `output-template.md` describes the mark beside
   `drawLive`: "`tooLongForPanels` is false (or left out) unless the lesson
   check refuses a steps list as too long for every criteria panel and you have
   tightened it and still cannot fit it ... The check reads the mark and lets
   the list through, but every slide that shows it reaches the teacher as a
   blank page to check before teaching, so it is never a way round
   tightening." Its flag list gains "as a last resort, why a success-criteria
   list you marked `tooLongForPanels` could not be tightened, naming the list
   in plain words by its words". `lesson-designer.md`'s fourth kind of flag
   now ends "Mark that list `tooLongForPanels: true` as well: the check reads
   the mark, not the flag." The scaffold writes the mark false on every list.
   **Tests:** `test_the_check_reads_the_mark_and_never_the_words_of_a_flag`
   (the fourth check's flags, and the refusal's own old wording, let nothing
   through; the mark needs no flag; the mark is true or false),
   `test_two_lists_too_long_need_a_mark_each` (including two lists that open
   alike), `test_a_mark_on_a_list_the_check_does_not_find_too_long_is_a_note_not_a_refusal`
   (and a flag that calls a plan's criterion "too big" draws no note), and
   `test_the_designer_contract_and_the_scaffold_carry_the_mark`.
2. **The review line (finding 3).** Confirmed: only the function that words it
   was tested, and it said the designer flagged the list "instead of tightening
   it". **Repair:** it now reads "the lesson designer has marked it too long for
   them after trying to tighten it, so every slide that shows it will reach the
   teacher as a blank page to check before teaching. Could the list be
   tightened until it fits, with every step still telling a stuck child what to
   do? If so, return `REDESIGN REQUIRED` and name the tightening: the words are
   the lesson designer's to change." **Test:**
   `test_the_review_page_asks_beside_a_marked_list_whether_it_could_be_tightened_to_fit`
   builds the whole review page and finds the line directly under its list,
   and nothing under an unmarked one.
3. **The slide designer (finding 4).** Confirmed: its own file says a
   composition fault must be repaired, so "leave the slide" in a composition
   refusal pulled against it, and only the practice panel's refusal said it.
   **Repair, in the build and not in `slide-designer.md`:** the build reads the
   mark from `lesson-design.json` beside the lesson file (the slide check
   already reads that file there). A slide whose criteria are a marked list,
   word for word, on any template, is refused as the design's
   (`faultClass: "content"`) with "This success-criteria list is marked too
   long in the design (`tooLongForPanels`): leave the slide flagged." The slide
   designer's file already says not to repair a content fault by changing
   success criteria, and to end with `BLOCKED_OUTSIDE_AUTHORITY` when only such
   faults remain, so no new words were needed there. A list nobody marked is
   still a composition fault with its roomier shape named. The practice panel's
   refusal lost its sentence about flagged lists, and the slide guidance now
   says "One it could not tighten is marked too long in the design
   (`tooLongForPanels`), and the build says so on each slide that shows it: no
   panel holds it, so leave those slides, which are delivered flagged."
   **Tests:** `marked-criteria.test.js` (a marked list is known by its words
   in a practice template and in a free layout's panel, with a sticky line and
   a line break added; part of it, other words, an unmarked list, a false mark
   or no design are not), and the flagged-deck test, which now builds a deck
   with one marked and one unmarked list and checks the first is reported as
   the design's and the second as a composition fault. I also ran the slide
   check itself on such a deck: it fails, as it should, carrying the content
   fault.
4. **Finding 5 ("a near miss never withholds the deck")** no longer applies:
   nothing is matched, so there is no near miss. The log's sentence is gone.
5. **Finding 6.** The test holes it named were in the matching (V7, V8, V11,
   V12, V16, V19), which is gone. T2 (the contract's line moved out of its
   list) is now held: the test reads the line inside "Put a concise string
   here only for:". T3 and T7 (a line written after or before a pinned
   paragraph that undoes it) are the pin limit the third check named; I left
   them. The report's account of the build ("every slide that shows it is
   refused at the widest panel") now says every slide that shows it is refused,
   whatever panel carries it.

Each repair was undone, one at a time, in a copy of the plugin, and a test
failed every time: sixteen changes, sixteen caught
(`scratch/fitb/undo-fourth.txt`, run by the agent that took over, on a
snapshot of this round's plugin, `scratch/fitb/snap-a`).

## His ruling on the last resort, and what was built

**What he said.** Told that a marked list reached every slide that showed it
as a blank page, he said of fixes in general: "i hardly want things broken so
then the agents just go oh well let's just report it and most of the time I get
a finished product with no finished product at all it should still try to fix
it try to repair it". Offered, for a list the lesson designer marked too long,
drawing it a little smaller (down to 16pt) on a finished, flagged slide, with
his class test stated (20pt the smallest everyone could read; 16pt "really
close to that limit"), he answered "agree." The 18pt floor stands for
everything else, unmarked lists included.

**The fourth round, checked first.** The stopped agent's last replay had run to
the end, and the tree was its output. Round A was complete: the mark on the
list, the check reading only the mark, the note for a stale mark, the review
line under its list, the build knowing a marked list. Its tests passed, and its
own attack script, run for the first time, caught all sixteen changes
(`scratch/fitb/undo-fourth.txt`). The only thing it had not done was bring this
report up to date (its `edit-report-fourth.py` was written but not run; I ran
it, then this section's edits). Its suite note, `suites-fourth.txt`, is empty:
the restart cut that run off.

**What the builder does now** (`c5c_marked_list_drawn_smaller.py`, and
`builder/src/marked-criteria.js`, placed by `c7`):
- The build reads the marked lists from the design beside the lesson into every
  slide's context.
- A criteria panel holding a marked list draws it at the largest floor from
  18pt down to 16pt at which it fits, found by drawing it onto a slide nobody
  sees. On a practice template it does this only at 6.35in: the panel widens
  first, as for any list, and goes smaller only at its widest.
- The step fitter takes that floor from its zone, in every measure and every
  refusal ("does not fit its card at the 16pt a list marked too long may be
  drawn at"). Every other list keeps 18pt, and every list that fits at 18pt
  draws exactly as before, marked or not.
- The list's lines are named for the final text fit, which lets those lines,
  and only those, go under 18pt, and never under 16pt
  (`builder/scripts/fit_text_postprocess.py`).
- The slide is finished, its question, working space and criteria all drawn,
  and named for the teacher: `CRITERIA_BELOW_READABLE_FLOOR`, `faultClass:
  "content"`, on the delivered deck's list of slides to check. It is not a
  finding the slide check refuses a candidate over, and it is found once
  however many tries chose the width and the size. The "set at 18 or 19pt"
  warning, which says a list is "within the 18pt floor", is not given for it.
- A marked list still refused on a slide is the slide designer's to move while
  the practice panel at its widest or the half-width split holds it at 16pt:
  the refusal names the half-width split (a list of eight two-line steps can
  need its extra 0.15in). Only when neither holds it, the rarest case (a sticky
  line or helper beside it took the last of the room), is it the design's:
  "This success-criteria list is marked too long in the design
  (`tooLongForPanels`), and no criteria panel holds it as this slide carries
  it, even at 16pt, the least a marked list is drawn at: neither the practice
  panel at its widest nor the half-width split. Leave the slide flagged: no
  repair pass will find room for it, and it is delivered as a page for the
  teacher to check before teaching. Nothing was shrunk further or cut."

**What the lesson check did in this round** (`c5c`; see the next section for
what it does now): a marked list passed only if it fitted at 16pt (or 17pt) in
the practice panel at its widest or the half-width side, as the builder draws
it; one too long even then was refused, marked or not, with the lines it takes at 16pt and "Tighten it here, where it is written,
keeping what each step tells a stuck child to do, at least until it fits at
16pt, and better until it fits at 18pt and needs no mark: a list no panel holds
even at 16pt cannot be drawn at all, and every slide that shows it would reach
the teacher as a blank page to check before teaching." An unmarked list too
long even at 16pt is told so ("Even at 16pt it does not fit, so marking it would
not let it through"). Both refusals are quoted whole in the next section.

**The true cost, where the old one was written** (`c5c`). These are this
round's words: since `c5d` a marked list too long even at 16pt passes with a
note, and the refusal, the contract and the designer's list say so, in the words
quoted in "The criteria cue is a note, and a list too long even at 16pt never
stops the run" and "The check and the guidance name the same shapes".
- the refusal: "It then lets the list through if it fits at 16pt, but it costs
  every slide that shows the list: each draws it smaller than the 18pt the
  board allows everything else, down to 16pt, close to the smallest a class can
  read from the back of the room, and is flagged for the teacher to check
  before teaching. So tighten it if any word can go.";
- `output-template.md`: "The check reads the mark and lets the list through if
  it fits at 16pt, and every slide that shows it then draws it smaller than the
  18pt floor, down to 16pt, flagged for the teacher to check before teaching,
  so it is never a way round tightening. A list too long even at 16pt is
  refused, marked or not: tighten it at least that far.";
- `lesson-designer.md`: "Every slide that shows that list then draws it smaller
  than the 18pt floor, down to 16pt, flagged for the teacher to check, and a
  list too long even at 16pt is still refused, so tighten first.";
- the review page, under a marked list: "... so every slide that shows it will
  draw the list smaller than the 18pt floor, down to 16pt, and be flagged for
  the teacher to check before teaching. Could the list be tightened until it
  fits at 18pt, with every step still telling a stuck child what to do? ...";
- `slide-success-criteria.md`: "One it could not tighten is marked too long in
  the design (`tooLongForPanels`): place it as any long list, and the builder
  draws it at the largest size that fits, down to 16pt, the one exception to
  the 18pt minimum, on a finished slide it flags for the teacher to check
  (`CRITERIA_BELOW_READABLE_FLOOR`, the design's to answer for, so leave it). A
  list that still fits nowhere (a sticky line or a helper beside a step can take
  the last of the room; the rarest case is a marked list no panel holds even at
  16pt) is delivered flagged for the teacher to check, never cut to fit.";
- the build log entry, this report, and the test names (below).

**Seen on the board.** A deck built with `--deliver-flagged`
(`scratch/fitb/smaller/e2e.js`, rendered by PowerPoint to
`scratch/fitb/smaller/png/`): the marked list on a practice slide came out at
6.35in and 16pt, with its question and working space, and a list only the
half-width split holds came out there at 16pt; nothing clipped, every line readable at board size.
The final text fit kept every marked line at 16pt. Only the two drawn-smaller
slides and the three still refused were named to check.

**Tests.**
- `marked-criteria.test.js`: a marked list is drawn in the practice panel at
  6.35in and 17pt (the largest size that fits, not 16pt), on a finished slide,
  its lines named for the final fit and its finding recorded once; the same
  words unmarked are refused at 18pt; a list that fits at 18pt draws exactly as
  before, marked or not, and one the widest panel holds at 18pt is drawn at
  18pt or more; the half-width split draws a marked list at 16pt that the
  practice panel refuses at 16pt, whose refusal then names the half-width split;
  where a marked list would fit, and the rarest case's message.
- `practice-panel-widens.test.js`: one delivered deck with the four kinds of
  list (marked and drawn at 17pt, finished and flagged as the design's, its
  lines between 16 and 18pt in the written deck; unmarked, a page naming its
  roomier shape; marked and only the half-width split holds it, the slide
  designer's to move; marked and no panel holds it at 16pt, the design's), and
  the slide check's scratch build passing a marked list drawn smaller.
- `test_a_criteria_list_fits_within_half_the_slide.py`: a marked list passes
  exactly where the builder draws it smaller (every made list beyond 18pt with
  at most one sticky line agreed, some of them held only by the half-width
  side, and a marked list drawn under 18pt only at 6.35in);
  `test_a_list_it_cannot_tighten_is_drawn_smaller_never_left_blank_and_the_refusal_says_what_that_costs`;
  `test_a_marked_list_too_long_even_at_16pt_is_refused_so_it_is_tightened_at_least_that_far`;
  `test_the_final_text_fit_lets_only_a_marked_lists_lines_under_18pt` (by its
  rule, and on a real box whose words fit at 16pt and not at 18pt); and the
  review line, the contract, the designer's list and the guidance sentence in
  their new words.

**Attacked.** Each piece of this round undone or bent, one at a time, in a copy
of the plugin with the ledger beside it, then the fit tests of both suites:
25 of 29 caught (`scratch/fitb/smaller/undo-b.py`, `undo-b.txt`). The four no test catches change
no verdict and nothing that reaches the teacher: the tries recording the
finding too (the store keeps one finding a slide, so a try's is the real
drawing's); the check measuring a marked list only in the half-width side, or
in every practice width as well (the half side holds whatever the widest
practice panel holds, and a narrower width never holds what the widest cannot,
so no list's verdict moves); and counting a marked list too long even at 16pt
among those the review page asks about (a design carrying one is refused
before any review page is made; letting it through is caught).

**Nothing else moved.** Every saved slide drawn with this round's builder
against the builder before it: 1,058 identical and 65 refused in the same
words, all 1,123 (`scratch/fitb/smaller/all-round-a.json`,
`all-final.json`). No saved design marks a list, so no saved deck meets the
smaller drawing. The saved designs give the same output as before.

## The criteria cue is a note, and a list too long even at 16pt never stops the run

The lead's two last points, each settled by his own earlier words
(`fit-change/c5d_never_a_refusal.py`, after `c5c`).

**1. The criteria cue is a note, never a refusal.** Six steps, or 320
characters, on one panel draws the cue "check the panel reads at the back of
the room beside the work" (`SUCCESS_CRITERIA_CAPACITY`). His success-criteria
decisions of 23 September 2026 made those numbers a cue to look, never a fault
("never fewer criteria"; the capacity warning "is a cue to look, not a limit";
"I don't think the slide designer reports back. There should be a way to make
it fit"), and his fit decisions agreed. The slide designer's own check,
`builder/scripts/check-slide-design.js`, refused on every capacity warning in
its spec-only stage (the `if (capacity.length)` branch, under
`const capacity = capacityWarnings(lesson);`), though 4.2.245 had taken the cue
out of the findings it refuses over. Now:
- the cue says it is one (`cue: true`, `builder/src/content/capacity.js`);
- the check refuses only a capacity warning that is not a cue
  (`const capacity = capacityAll.filter((warning) => !warning.cue);`), so a
  long fixed caption still refuses, and prints the cue as a note beside its
  result, pass or fail ("1 slide-design note(s), a cue to look and never a
  fault: note: slide 1 successCriteria: SUCCESS_CRITERIA_CAPACITY: 6 criteria
  on one panel ...");
- the build reports the cue with `faultClass: "note"`
  (`warning.cue ? 'note' : 'composition'` in `builder/build.js`), so a check that
  fails for something else never hands it to the slide designer as a
  composition fault to repair.
**Test:** `a long list that fits costs the slide designer no repair pass: the
criteria cue is a note in its own check` (`practice-panel-widens.test.js`)
runs the real slide check on a practice slide with the six-step compare list:
it passes, prints the note, and every build diagnostic for the cue is a note.
It also holds that both cues (by count and by total) say they are cues.

**2. A marked list too long even at 16pt never stops the run.** Decision 11:
"There is not a time where I want the PowerPoint slide deck to never be
produced because of an error." Now:
- the lesson check refuses only an unmarked list too long for every panel. A
  marked list too long even at 16pt passes, with a plain note printed first,
  before the pass line (`LESSON_DESIGN_NOTE: successCriteria[0] (sc-001), the
  list that begins "Write the 3-digit number on top...", is marked
  `tooLongForPanels`, but it is too long even at 16pt, the least a marked list
  is drawn at: its 8 steps take 24 lines ... in the roomiest criteria panel,
  the half-width side, which holds 16 lines of about 45 characters at 16pt for
  8 steps. Every slide that shows it will reach the teacher as a page to check
  before teaching, with its question, working space and criteria not drawn.
  Tighten it here, keeping what each step tells a stuck child to do, at least
  until it fits at 16pt, and better until it fits at 18pt and needs no mark;
  the design reviewer is asked to send it back to you. This is a note; the
  check passed, because the deck is always made.`);
- the review page, beside that list: "Lesson check (read this one): no criteria
  panel a slide is built with holds this list even at 16pt, the least a list
  marked too long is drawn at, so every slide that shows it will reach the
  teacher as a page to check before teaching, with its question, working space
  and criteria not drawn. Return `REDESIGN REQUIRED` and name the tightening
  that brings it to 16pt at least, and to 18pt if it can, with every step still
  telling a stuck child what to do: the words are the lesson designer's to
  change." (his ruling today: the fix is the designer's, the reviewer names
  it);
- if it still reaches the build, each slide that shows it is a page to check,
  the rarest case, and the deck is written (the build already did this);
- the refusal of an unmarked list says what marking would cost ("Even at 16pt
  it does not fit: marked, it would pass with a note, but every slide that
  shows it would reach the teacher as a page to check with nothing drawn on
  it, so tighten it at least until it fits at 16pt."), and its way out now
  reads "It then lets the list through, and it costs every slide that shows
  the list: each draws it smaller than the 18pt the board allows everything
  else, down to 16pt, ... and is flagged for the teacher to check before
  teaching; a list too long even at 16pt cannot be drawn at all, and each of
  its slides reaches the teacher as a page to check with nothing drawn on it.
  So tighten it if any word can go.";
- `output-template.md`: "The check reads the mark and lets the list through,
  and every slide that shows it then draws it smaller than the 18pt floor, down
  to 16pt, flagged for the teacher to check before teaching, so it is never a
  way round tightening. A marked list too long even at 16pt still passes, with a
  note, because the deck is always made, but every slide that shows it reaches
  the teacher as a page to check with nothing drawn: tighten it at least that
  far."; `lesson-designer.md`: "... and one too long even at 16pt reaches the
  teacher as pages to check with nothing drawn, so tighten first."
**Test:** `test_a_marked_list_too_long_even_at_16pt_passes_with_a_note_and_the_deck_is_still_made`
checks the design passes, the note's words and numbers, the program's output
(the pass line unchanged, the note first), and then builds a deck from a
lesson showing the list, with the design beside it: the deck is written, and
only that slide is flagged, as the design's. The review test holds the new line
beside the list.

**Attacked.** Each piece undone, one at a time, in a copy of the plugin, then
the fit tests of both suites and the slide check's own tests: 12 of 12
caught (`scratch/fitb/smaller/undo-c.py`, `undo-c.txt`).

**Nothing else moved.** The saved designs give byte-for-byte the output they
gave on 4.2.288, and none marks a list; every saved slide draws as it did
before this round (1,058 identical, 65 refused in the same words).

## The fifth check, and what was repaired

`fit-release-fifth-check.md` found decision 11 held end to end, the cue a note,
the 16pt drawing never clipped and the true cost stated everywhere in the
plugin. It found four things to repair, and I checked each myself first
(`fit-change/c5e_only_a_list_too_long_goes_smaller.py`, after `c5d`).

1. **A stale mark shrank a list.** Confirmed: a list the widest practice panel
   holds at 18pt, marked, drew at 17pt in a 30% column and a 40% side that
   refuse it unmarked, and a list only the half-width side holds at 18pt drew
   at 17pt on a practice template, each flagged "the lesson design marks the
   list too long for every criteria panel", which was untrue. **Repair:** a
   criteria panel lowers the floor only for a marked list that neither the
   practice panel at its widest nor the half-width split holds at 18pt
   (`markedListHeldAt18` in `marked-criteria.js`, measured on the list's own
   steps with no marks, and kept for the build); otherwise the list is drawn,
   or refused with its roomier shape named, exactly as unmarked. So the flag's
   words, and the log's "a list that fits at 18pt somewhere keeps exactly what
   it had, marked or not", are true. **Test:** `a stale mark changes nothing`
   (`marked-criteria.test.js`): in a 30% column and on a practice template,
   the marked list's refusal is word for word the unmarked one's, and nothing
   is flagged.
2. **A sticky line beside a marked list went under 18pt.** Confirmed (17pt on
   every slide). **Repair:** the step fitter keeps the readable floor for a
   sticky line in every measure and refusal (`floorFor`), and gives it its own
   size group in the final text fit, which now lowers the floor only on a line
   named `marked-step-text-`; the build measures a marked list's room without
   its sticky line, so a sticky line that does not fit is refused as it is
   beside any list ("carry the fact in its own on-slide treatment") and stays
   the slide designer's; the lesson check's copy of the fitter measures a
   sticky line at 18pt too, so the check and the builder still agree; and the
   slide guidance says "(a sticky line beside it stays at 18pt)" (SC-K06's
   whole-paragraph pin follows). **Tests:** `only the marked list goes under
   18pt` (a short sticky line at 18pt or more, in its own group, beside
   steps at 16 or 17pt; a long one refused at 18pt with room found for the list
   itself; a two-line one, which would fit only at the list's lower floor,
   refused beside the marked list, and beside a list whose own steps fit at
   18pt refused word for word as unmarked), and the final text fit test (a
   marked sticky line's name gets 18pt).
3. **Three places in this report quoted the round in which a marked list too
   long even at 16pt was refused.** Corrected: the refusal and the note in "The
   check and the guidance name the same shapes" are now today's words, and
   "What changed" and the test list say what it does now.
4. **Four attacks passed.** A mark left false counted as a mark, and the note
   printed after the pass line: both now tested
   (`test_a_mark_left_false_is_no_mark`, and the note checked before the pass
   line in one stream, unbuffered, in the passes-with-a-note test). The other
   two, a sentence written elsewhere that undoes a pinned one, are the known
   limit of phrase pins, named in "Noticed, not built".

The parity test for marked lists now measures the lists the mark applies to:
a made list whose own steps fit at 18pt beside a sticky line that does not is,
marked or not, the slide designer's to repair, and a design, which keeps its
sticky lines apart, never carries one.

**Attacked.** Each repair undone, one at a time, in a copy of the plugin, then
the fit tests of both suites: 7 of 9 caught
(`scratch/fitb/smaller/undo-d.py`, `undo-d.txt`). The two no test catches
change nothing that reaches a slide: the step fitter choosing a sticky line's
size against the lowered floor (its room is still measured at 18pt, so it
still draws at 18pt or more), and the lesson check measuring a sticky line at
the lowered floor (a design keeps its sticky lines apart, so the check never
meets one; the line matters only to the parity test's made lists). A tenth
change, measuring the stale test with the slide's marks still in its context,
makes the panel ask the stale test again from inside it without end; the
tests never finished, so it was stopped by hand and left out of the count.

**Nothing else moved.** Saved designs byte for byte as on 4.2.288; every
saved slide as before (none carries a mark, and a list the panel draws at 18pt
takes the same path).

## The check and the guidance name the same shapes

After the repairs above, the check passed a list any panel within half the
slide could hold, including the top 60% band and the callouts' centre, which
the guidance never sends a list to. Such a list (a few very long steps) would
have passed the check and then reached the deck flagged. The lead asked for the
teacher's agreement to be kept exactly: "a list too long even for the widest box
is caught by the lesson check before any slides are made, so the lesson designer
tightens it".

**Now:** the check measures exactly the shapes `slide-success-criteria.md` names,
which are the practice panel at 4.60, 5.50 and 6.35in and the half-width side.
It passes a list any of them holds and refuses a list none holds. The guidance
says so in the same words: "A list that neither the practice panel nor the
half-width split can hold is caught by the lesson check".

**The refusal now reads** (for the eight long steps in the test):

> successCriteria[0] (sc-001), the list that begins "Write the 3-digit number on top...", is too long for the criteria panels slides are built with: at 18pt, the smallest the board allows, its 8 steps take 24 lines (step by step: 3, 3, 3, 3, 3, 3, 3, 3) in the roomiest of them, the half-width side (6.35in wide and 6.65in tall), which holds 14 lines of about 40 characters for 8 steps, and the practice panel holds it at none of its three widths. Even at 16pt it does not fit: marked, it would pass with a note, but every slide that shows it would reach the teacher as a page to check with nothing drawn on it, so tighten it at least until it fits at 16pt. Tighten the wording here, where it is written, keeping what each step tells a stuck child to do, until the whole list fits: the slide designer has no roomier panel to give it, and nobody after you may reword a criterion. Only if you have tightened it and no step can lose a word without losing what it tells a stuck child to do, keep the words, mark the list `"tooLongForPanels": true`, and say why in `flagsForTeacher`, in plain words for the teacher that name the list by its words. The check reads only the mark. It then lets the list through, and it costs every slide that shows the list: each draws it smaller than the 18pt the board allows everything else, down to 16pt, close to the smallest a class can read from the back of the room, and is flagged for the teacher to check before teaching; a list too long even at 16pt cannot be drawn at all, and each of its slides reaches the teacher as a page to check with nothing drawn on it. So tighten it if any word can go.

For a list that fits at 16pt, the sentence "Even at 16pt it does not fit ..." is
not there. Marked, that same eight-step list passes, and the check prints this
note before its pass line:

> successCriteria[0] (sc-001), the list that begins "Write the 3-digit number on top...", is marked `tooLongForPanels`, but it is too long even at 16pt, the least a marked list is drawn at: its 8 steps take 24 lines (step by step: 3, 3, 3, 3, 3, 3, 3, 3) in the roomiest criteria panel, the half-width side, which holds 16 lines of about 45 characters at 16pt for 8 steps. Every slide that shows it will reach the teacher as a page to check before teaching, with its question, working space and criteria not drawn. Tighten it here, keeping what each step tells a stuck child to do, at least until it fits at 16pt, and better until it fits at 18pt and needs no mark; the design reviewer is asked to send it back to you. This is a note; the check passed, because the deck is always made.

The id stays at the front because the lesson designer reads it; nothing asks
for it in the flag, which is what reaches him.

**Tests:**
- `test_the_lesson_check_and_the_builder_give_the_same_verdict` holds the check
  to the builder's verdict on those four shapes, over 858 lists.
- `test_either_side_of_the_new_limit` covers three groups: 8 made lists the
  practice panel refuses and only the half-width side holds, which pass; 14 that
  only a wider band or the callouts' centre holds, which are refused; and 233
  that no named shape holds, which are refused.
- `test_the_check_measures_the_shapes_the_guidance_names_at_the_builders_sizes`
  holds the four sizes to the builder's and keeps the band and the centre out.

**Other runs:**
- 3,000 seeded random lists agreed with the builder on every one: 1,495 held by
  a practice width, 41 only by the half-width side, 73 only by a wider band or
  callout centre (now refused), and 1,391 by nothing.
- All 98 steps lists in the 90 saved designs pass. The most any takes in the
  half-width side is 9 lines.

Each repair was undone in a copy of the plugin and its test failed, and so
did adding a shape the guidance does not name to the check
(`scratch/fitb/undo-each-repair.txt`). On the 4.2.288 builder, with a stand-in
for the new helper, 12 of the 18 new builder tests fail. The 6 that pass are the
"nothing moves" and "still refused" ones (`scratch/fitb/new-tests-on-4.2.288.txt`).

## What changed, file by file

Change scripts, in `fit-change/`, to run in this order on a 4.2.288 tree:

1. `f1_fixture_from_before_run.py` (before any change; it reads
   `scratch/fitb/lists-before.json`).
2. `c1` to `c5`, then `c5b` (`c5b_where_the_mark_is_met.py`), then `c5c`
   (`c5c_marked_list_drawn_smaller.py`, his ruling on the last resort), then
   `c5d` (`c5d_never_a_refusal.py`, the lead's two last points).
3. `c6`, then `python -X utf8 plans/streamline-tools/sc-change/build_sc_mapping.py`.
4. `c7`, then `c8`.

Each replacement asserts its old text appears exactly once
(`fit-change/_patch.py`), and line endings are kept as found. Whole new files
are in `fit-change/new/`, and `c7` copies them in. After the repairs I replayed
every script on a clean 4.2.288 tree and ran the suites on the result.

**`builder/src/content/steps.js`** (`c1`, and `c2` for the widest refusal)
- `largestStepFont`: when no size fits, a card given exactly its lines' height
  at 18pt is accepted within `FLOOR_ROUNDING`, a millionth of an inch. Only the
  refusal gives way.
- The sticky-line pre-check adds each criterion's own height at 18pt
  (`stepFloorNeed`, moved up beside `referenceFloorNeed`).
- The short-list rule gives way when its share of four rows cannot hold the list
  at 18pt. It re-measures at the height it is given until the need settles, up
  to the whole panel, plus `FLOOR_ROUNDING`, and no more. The card geometry
  moved word for word into `cardRows`, and the floor-need arithmetic into
  `floorNeed`.
- `overloadMessage` takes `widestPracticePanel`. At the widest practice panel
  it names the half-width split instead of "a wider or taller composition".
- (`c5c`) The floor comes from the zone (`floorPt`, 18 unless a criteria panel
  holding a marked list lowers it), in `largestStepFont`, `floorNeed`,
  `budgetSentence`, `overloadMessage` and every measure in `drawSteps`. A list
  laid out under 18pt names its lines `marked-...` with its floor, records one
  finding (`recordCriteriaBelowFloor`), and does not give the "within the 18pt
  floor" warning. `TEXT_FONT_MIN` is exported for the panel.

**`builder/src/templates/maths-turn-sc.js`** (`c2`)
- `SC_WIDTHS = [SC_W, 5.50, 6.35]`, and `scPanelWidth(data, ctx)`: the
  narrowest width at which the shared panel draws, tried on a throwaway slide.
  Only `STEP_TEXT_OVERLOAD` moves on. Any refusal is raised before anything else
  on the slide is drawn, and at the widest it is marked `widestPracticePanel`.
- `panelWidening(panelW)`: the panel keeps its right edge, and each template
  takes the widening off its own widths, so at 4.60in every number is today's.
- On `maths-turn-sc` only: when the panel has widened, there is working space,
  and the picture cannot be drawn in its half (`drawsIn`), the picture goes
  above the working space. It takes the height it measures, at most half.
- `drawScPanel(..., panelW = SC_W)`: the retired `maths-mtotyt-sc` keeps
  4.60in.
- (`c5c`) The panel's zone says it is a practice panel (`practicePanel`), so a
  marked list goes under 18pt only at its widest.

**`maths-turn-ref-sc.js`, `maths-your-turn-sc.js`, `writing-turn-ref-sc.js`**
(`c2`): each calls `scPanelWidth` first and gives up `panelWidening` from its
own widths.

**`builder/src/warnings.js`, `builder/src/content/image.js`,
`builder/src/content/_zone-fill.js`** (`c2`): `withoutRecording(fn)` and
`recording()`. While a dry drawing runs, `warn` and `note` print and keep
nothing. The picture-floor, missing-picture and zone-fill stores keep nothing.

**`builder/src/success-criteria-panel.js`** (`c2`): passes
`widestPracticePanel` from the panel's zone to its content. (`c5c`) For a
marked list, on a free zone or a practice panel at its widest, it chooses the
floor with `markedListFloor`, drawing the list onto a slide nobody sees at 18,
then 17pt, and 16pt if neither holds it.

**`builder/scripts/fit_text_postprocess.py`** (`c5c`): `shape_floor` honours a
floor under the default only on a line named `marked-`, and never under
`MARKED_LIST_FLOOR_PT` (16). Every other box keeps 18pt, which its own floor
can only raise.

**`scripts/validate-lesson-design.py`** (`c3`)
- `NAMED_PANELS`: the practice panel at its three widths and the half-width
  side, the shapes the guidance names, at the builder's exact sizes.
- `panel_fit(steps, w, h)` measures a steps list in one panel the way the
  builder does: its geometry, the settling short-list rule, and wrapping at 18pt
  with the builder's bold Comic Sans widths read from
  `shared/text/comic-glyph-width.js`, colour marks taken off.
- `criteria_fit` passes a list any named panel holds.
- `validate_criteria_fit_a_named_panel` refuses every list none holds and the
  lesson designer has not marked, in one fault, in its own `faults.section()`,
  naming each list by its first words. Its words are quoted in "The check and
  the guidance name the same shapes" above.
- A success-criteria object may carry `tooLongForPanels`, true or false.
  `criteria_fit_status` sorts the lists: too long and unmarked, too long and
  marked, and marked but not too long. `criteria_marker_notes` words the note
  for the last kind, and the program prints it as `LESSON_DESIGN_NOTE` after
  its pass. No flag's words are read.
- (`c5c`) `panel_fit` takes a floor. `criteria_fit_smaller` measures a list no
  named panel holds at 17pt, then 16pt, in the practice panel at its widest and
  the half-width side (`SMALLER_PANELS`), as the builder draws a marked list.
  One it does not hold is sorted as `beyond_smaller`: in `c5c` it was refused
  with the 16pt measure; since `c5d` it passes, with the note quoted in "The
  check and the guidance name the same shapes" (`takes_lines` words the lines
  the refusal and the note quote). Since `c5e` a sticky line is measured at
  18pt beside a list measured smaller, as the builder draws it.

**`scripts/design-review-packet.py`** (`c5b`): under a marked list the check
finds too long, the reviewer's question; under a marked list it does not, a
line saying so. It reads both from the lesson check, so the two cannot
disagree. (`c5c`) The question now says the list will be drawn smaller and
flagged, and asks whether it could be tightened until it fits at 18pt.

**`references/output-template.md`, `agents/lesson-designer.md`,
`scripts/lesson-design-scaffold.py`** (`c5b`): the mark beside `drawLive`, the
reason's line in the flag list, the designer's fourth kind of flag, and the
mark written false on every scaffolded list, quoted in the fourth check's
item 1. (`c5c`) The contract's and the designer's cost sentences now state the
smaller drawing, quoted in "His ruling on the last resort".

**`builder/build.js`, `builder/src/content/capacity.js`, and the new
`builder/src/marked-criteria.js`** (`c5b`, and `c7` places the new file): the
build reads the marked lists from `lesson-design.json` beside the lesson file,
and a slide whose criteria are one of them, word for word, is refused as the
design's (`faultClass: "content"`) with the message quoted in the fourth
check's item 3. `capacity.js` shares the function that finds a slide's
criteria. (`c5c`) The marked lists go into every slide's context; a list drawn
smaller becomes a `CRITERIA_BELOW_READABLE_FLOOR` diagnostic (content, on the
flagged list); and a marked list still refused is the design's only when
`markedListRoom` finds neither the practice panel nor the half-width split
holds it at 16pt. `marked-criteria.js` also holds the 16pt floor, the floor
choice and the finding's store.

**`references/slide-success-criteria.md`** (`c4`): the "What holds a list
today" part now says:
- the panel widens itself: 4.60, 5.50, 6.35in, about 26, 33 and 39 characters a
  line, about 14 lines each;
- there is nothing to choose, and a list that fits 4.60in keeps it;
- "When even the widest refuses, or a slide needs a free layout, use the
  half-width split ... about 39 characters a line like the widest practice
  panel, and 0.15in taller, so it holds a little more";
- a list that neither the practice panel nor the half-width split can hold is
  caught by the lesson check, and one that still reaches a slide is delivered
  flagged, never cut;
- a list the lesson designer marked too long instead is placed like any long
  list and drawn at the largest size that fits, down to 16pt, the one exception
  to the 18pt minimum, on a finished slide the build flags (`c5c`); only a list
  that still fits nowhere is delivered as a page to check.

The rest of the paragraph is word for word.

**`references/templates.md`** (`c4`): one paragraph after `maths-turn-sc`'s
slots. The panel widens itself across the family, there is nothing to set, and
on `maths-turn-sc` a picture that cannot sit beside the working space goes above
it. The working-space bullet is untouched.

**`references/build-review-log.md`, both `plugin.json`** (`c8`): 4.2.289, and
an entry that includes every check, what happens now to a list that fits no
layout, and his ruling on the last resort.

**Tests** (`c5`, `c7`, `f1`)
- `builder/test/criteria-lists-keep-their-size.test.js` with
  `builder/test/fixtures/criteria-lists-4.2.288.json` (120 lists, 14 shapes,
  measured before any change).
- `builder/test/criteria-fitter-mends.test.js`: the real lists of the three
  faults, the eight-step list in the half side, a short list in the bottom
  bands, and a list that genuinely does not fit.
- `builder/test/practice-panel-widens.test.js`:
  - the long lists on all four templates, and a short list;
  - the number line above, at most half the height, and a number line at 4.60in
    staying beside the working space;
  - the refusal at the widest naming the half-width split;
  - the fraction-wall slides: 5 and 9 to 12 refused at 4.60in by the wall, 7
    and 8 refused at the widest card by their steps;
  - a picture that cannot sit beside the working space: refused at 4.60in,
    above once widened;
  - the photo's findings reported once, and no finding store keeping a try's;
  - in one delivered deck, a marked list drawn smaller on a finished, flagged
    slide, an unmarked one a page naming its roomier shape, a marked one only
    the half-width split holds left to the slide designer, and a marked one no
    panel holds even at 16pt the design's; and the slide check's scratch
    build passing a marked list drawn smaller;
  - the retired template, and one warning where there were several.
- `builder/test/marked-criteria.test.js`: the build knows a marked list by its
  words on any template, and nothing else; it draws it smaller only where it
  should and at the largest size that fits; and the rarest case's message.
- `scripts/tests/test_a_criteria_list_fits_within_half_the_slide.py` (it
  replaces the first build's `..._fits_the_widest_panel.py`):
  - parity with the builder on the named shapes, and either side of the new
    limit;
  - the four sizes are the builder's, and every real list passes;
  - the refusal's words, and why its numbers show the fault;
  - decision 11's way out (the mark) and its cost, that no flag's words let a
    list through, a mark each for two lists (two that open alike included),
    the note for a mark on a list the check does not find too long (in the
    program's own output), the review page's question under its list on the
    built page, and the mark in the contract, the designer's list and the
    scaffold;
  - a marked list passing exactly where the builder draws it smaller, one too
    long even at 16pt passing with a note printed before the pass line and
    still making a deck, a mark left false counting for nothing, and the final
    text fit's floor for a marked list's step lines (a sticky line keeps 18pt);
  - the letter widths, the guidance sentences, and that the widening paragraph
    ends its section.
- `scripts/tests/test_design_review_packet.py`: its minimal plugin copy also
  copies the letter-width file.

## Pins moved, and why

All in the success-criteria pins, by entries in `sc-change/build_sc_mapping.py`
with the reason written beside each (`fit-change/c6_move_the_pins.py`). The
rebuild printed `MAPPING_OK 467 pins; 80 changed rows mapped`. Four rows moved
and one was added.

1. **SC-DEC-11-FIT** held "What holds a list today: the practice templates'
   panel takes about 14 lines at 18pt, about 26 characters a line;". It now
   holds "What holds a list today: the practice templates' panel widens itself,
   only as far as the whole list needs to read at 18pt and never past half the
   slide:". Reason: the panel now widens itself, so the sentence says so.
2. **SC-K06**'s whole-paragraph pin is that paragraph, so the rebuild pinned the
   new paragraph, including the restored half-width-split move and (after the
   third and fourth checks and his ruling on the last resort) the sentences on
   a list marked too long. Its own sentence
   is unchanged, and so are its section, the ledger, the ids and the homes.
3. **SC-K38** held "the bottom strip, which holds no criteria list at 18pt". It
   now holds "which holds one criteria step of at most two lines at 18pt and
   never two steps". Reason: the settling short-list rule lets one step draw
   there (the second check's finding 3).
4. **SC-K12**'s whole-paragraph pin follows its paragraph, whose `centre-big-v`
   sentence now says "holds one one-line criteria step at 18pt and never two".
   Its own sentence ("Five one-line steps need about 3.25″ inside a criteria
   panel.") is unchanged.
5. **SC-FIT-289-TPL** (new) holds the new `templates.md` paragraph whole, in the
   `maths-turn-sc` section (the second check's finding 1).

The rebuild also rewrote the matching lines of
`plans/2026-09-23-success-criteria-mapping.md`. No pin in any other topic moved.
The third and fourth checks' repairs and his ruling moved no row (SC-K06's
whole-paragraph pin followed its paragraph each time, and in the last round it
was the only row whose pinned text changed); the final rebuild still prints
`MAPPING_OK 467 pins; 80 changed rows mapped`, and running it again changes
nothing.
The refusals' words and the other new guidance sentences are held by the new
tests.

## The suites

`bash plans/streamline-tools/run-all-suites.sh fit-final`, run on the final
tree (after the last replay). Every suite passes.

| Suite | 4.2.288 (`sc-after6`) | 4.2.289 (`fit-final`) |
|---|---|---|
| Python | 2180 passed, 1 skipped (71,510 subtests) | 2201 passed, 1 skipped (71,655 subtests) |
| Voice harness | 21 | 21 |
| Builder | 709 | 742 |
| Worksheet | 722 | 722 |
| Stick-in sheets | 70 | 70 |
| Working wall | 142 | 142 |
| Shared | 126 | 126 |
| Test | 46 | 46 |

## The saved designs

`fit-final-designs.json` against `sc-after6-designs.json`: identical, byte for
byte. 0 of 53 pass in both, for older faults, and there is no new refusal. The
check was also run on its own over every steps list in those designs: all 49 are
held. The same holds for all 98 steps lists in the 90 saved designs anywhere in
the repository, and none of those designs carries the mark, so none is let
through by it or named in a note.

## Which saved slides change, and how

**Every saved lesson in the repository** (`scratch/fitb/draw-all.js`,
`compare-all.js`): 91 `lesson.json` files, 1,123 slides, test lessons included,
each drawn by 4.2.288 and by this release with pictures as placeholders.
- 1,048 are identical in every object.
- 64 are refused under both builders:
  - 59 in the same words, including the ten fraction-wall slides 5 and 9 to 12
    (with their copy) and the five place-value slides;
  - 5 by the same fault in other words: fraction-wall slides 7 and 8 and their
    copy, now refused by the widest card's numbers, and
    `childrens-lives-continuity-and-change` #14, whose short-list card is now
    measured a character narrower.
- 11 that were refused now draw, each at the width it always had:
  - `round-to-the-nearest-10-and-100` #4, #5, #6, #8 (4.60in);
  - `partition-4-digit-numbers` #5, #6 (4.60in);
  - the September trials' history #16 twice and maths #15 (their speech-bubble
    zones);
  - `what-is-a-balanced-diet...` #7 (the 30% column);
  - `year-4-maths-lesson-2` #8 (the 40% side).
- **No slide draws with a practice panel wider than 4.60in.** The fraction-wall
  slides 7 and 8 try the wider widths and are still refused.
- The drawing itself prints 1,047 and 65 (60 in the same words): it counts
  `output/trial-2026-09-05/transfer-discovery` slide 10 as refused under both,
  only because it prepared no parachute figure. A real build draws that slide
  the same under both.

The checker notes that in whole builds two of the eleven (partition #6 and
balanced diet #7) are still flagged, for other content the old refusal had
hidden.

**The investigation's corpus of 307 saved panels** (`saved.js`,
`compare-saved.js`): 291 identical in every object, 5 refused by the same
place-value charts, 11 now drawn, the same eleven.

**The investigation's own scripts,** run before and after into `scratch/fitb/inv-*`:
- `real.js`: the practice panel refused 4 real lists before and refuses 0 now.
  The 30% column went from 12 to 6, and thirds from 7 to 2. The bottom 40% band
  went from 114 refused to 82, and the 30% band and both strips from 114 to 108.
  That is finding 1's repair.
- `saved-slides.js`: 16 step refusals before and 5 now. Its harness counts the
  five place-value slides as drawn, because it records the last panel drawn and
  the practice templates now draw one on a throwaway slide first. `harness-b.js`
  tells the two apart.

**The lists** (`lists-before.json`, `lists-after.json`, fourteen shapes): of the
real lists' results, 1,059 kept their size, 83 now draw and none moved. Of those
83, 50 are in the bottom bands and strips. Of the long lists', 26 now draw and 8
kept their size.

**A built and rendered deck** of fourteen practice slides drew every slide with
no fault or flag (`scratch/fitb/deck-after/png/`).

**After his ruling on the last resort,** every saved slide was drawn again with
the final builder: against 4.2.288 the figures above stand exactly (1,047, 60,
5 and 11 as the drawing counts them); against the builder before that round,
all 1,123 slides are identical or refused in the same words
(`scratch/fitb/smaller/all-round-a.json`, `all-final.json`). The first draw
showed four fraction-wall refusals in other words: a doubled "the" in the
step refusal that the round had introduced, now mended, and the redraw
confirmed it.

## Size before and after

Line endings evened out before counting. Figures are bytes.

| Group | Before | After | Change |
|---|---|---|---|
| Instruction files (`slide-success-criteria.md`, `templates.md`, `output-template.md`, `lesson-designer.md`) | 506,652 | 509,932 | +3,280 |
| of which the two the slide designer reads | 304,106 | 305,969 | +1,863 |
| of which the design's contract and the designer's list | 202,546 | 203,963 | +1,417 |
| Programs (fitter, four templates, panel, warnings, two finding stores, validator, review page, build, scaffold, final text fit, slide check) | 601,361 | 652,157 | +50,796 |
| of which the validator | 196,813 | 216,142 | +19,329 |
| of which `marked-criteria.js` (new) | 0 | 9,130 | +9,130 |
| of which `steps.js` | 34,819 | 41,413 | +6,594 |
| of which `maths-turn-sc.js` | 5,603 | 10,504 | +4,901 |
| of which the review page (`design-review-packet.py`) | 127,178 | 130,293 | +3,115 |
| of which `build.js` | 35,051 | 36,998 | +1,947 |
| of which the panel (`success-criteria-panel.js`) | 6,363 | 8,134 | +1,771 |
| of which the switch that keeps tries off the record (`warnings.js` and two stores) | 39,538 | 40,584 | +1,046 |
| of which the slide check (`check-slide-design.js`) | 62,619 | 63,518 | +899 |
| of which the final text fit (`fit_text_postprocess.py`) | 34,442 | 35,218 | +776 |
| of which the other three templates, the scaffold and `capacity.js` | 58,935 | 60,223 | +1,288 |
| Tests and pins | 542,839 | 707,310 | +164,471 (55,552 is the fixture) |
| Build log | 671,388 | 699,322 | +27,934 |

(`scratch/fitb/smaller/sizes.py` measures these: `sizes.py` with the final
text fit and the slide check added.)

## Decisions I made that he might want to know

1. **The rounding allowance applies at 18pt only.** Applied at every size, it
   would also lift three real lists with two sticky lines each by 1pt in some
   shapes. That would break the promise that no fitting list changes, so those
   three still draw 1pt smaller than they could.
2. **A short list that needs more height takes only what 18pt needs,** so the
   RE step draws at 18pt in a card a little taller than its share, not at poster
   size.
3. **Any refusal in the practice panel is raised before the rest of the slide is
   drawn.** On a slide where both the panel and something else are refused, the
   panel's fault is now named first. That includes the fraction wall.
4. **The picture goes above the working space only when it cannot be drawn in
   its half.** A photograph that merely shrinks stays beside (see finding 3).
5. **The lesson check is a Python copy of the builder's arithmetic,** held to
   the builder by tests that run it. It measures exactly the shapes the guidance
   names. A list of a few very long steps that only a wider band or a callout
   centre could hold is therefore refused and sent back to be tightened, rather
   than passed and delivered flagged.
6. **The check measures the list as the lesson designer wrote it**, not a sticky
   line or helper added later, and only steps lists.
7. **The validator now reads `shared/text/comic-glyph-width.js`,** which every
   full install has.
8. **Decision 11 is kept by a way out written into the refusal,** not by
   playbook words: a list the designer has tightened and still cannot fit is
   marked on the list itself (`tooLongForPanels`), its reason flagged for him in
   plain words, and passes. The check reads the mark, never a flag's words: the
   fourth check showed a flag's words cannot be read safely. The deck is always
   made, and since his ruling on the last resort every slide that shows that
   list draws it smaller, down to 16pt, flagged for him to check; the refusal,
   the designer's contract and the review page say so. On the edge between decision 11 and "the lesson designer tightens it",
   this chooses the deck, by decision 11's own words. The other ways I
   considered were bigger or less honest:
   - a playbook step, but it is at its byte cap;
   - a validator that remembers earlier refusals, but the same design would
     then get different verdicts;
   - a warning that does not refuse, but then the designer is never made to
     tighten.
9. **A marked list goes smaller only where the list is as roomy as it can be.**
   On a practice template the panel widens first and goes under 18pt only at
   6.35in; a free panel (the half-width split, say) goes under 18pt where the
   slide designer put it, and only for a list that neither the widest practice
   panel nor the half-width split holds at 18pt (since the fifth check). Within that, the largest floor that holds the whole
   list is used (17pt before 16pt), so every line of a marked list is drawn at
   one size, as for any list.
10. **A marked list still refused is the slide designer's while a named shape
    holds it.** The build asks whether the practice panel or the half-width
    split would hold the list, as the slide carries it, at 16pt, by drawing it
    there. If so, the refusal stays a composition fault naming the roomier
    shape, because his ruling is to repair rather than report; if not, it is
    the design's, and the slide designer leaves it.
11. **A marked list too long even at 16pt passes the lesson check with a
    note.** The handover first had the check refuse it; the lead then settled
    it by decision 11, so it passes, the note comes first, the review page
    asks for it back, and its slides are the rarest case.
12. **The finding says the size the builder laid the list out at.** The final
    text fit measures with the real font and may set it a point larger; it
    never sets it under 16pt.

## Noticed, not built

- **The top 60% band of `split-v-60-40` and the centre of `central-callouts-4`
  can hold some lists of a few very long steps that no named shape holds.** The
  check refuses those, because the guidance does not name those shapes. None of
  the real lists comes near it. Naming them would be a new composition
  recommendation, which is his call.
- `maths-turn-ref-sc` keeps its picture beside the working space when its panel
  widens, so a number line there would be refused. No saved slide widens.
- On the eight-step list at 6.35in, the number badges (0.54in) stand taller than
  the one-line cards (about 0.39in). That is existing behaviour at the floor.
- The lesson designer's guidance does not say how much room a list has. It
  learns the limit from the check's refusal, and the check cannot see whether a
  list marked too long was tightened first: the cost said in the refusal, the
  designer's contract and the reviewer's question are what hold it. Nor does it
  hold the reason: it reads only the mark, so a marked list with no line in
  `flagsForTeacher` passes, and the teacher would then meet slides drawn
  smaller with no reason given. Requiring a flag would mean reading one, which
  is what the mark replaced.
- **His call:** whether the design reviewer may take a mark and its flag out
  once the list fits. Today it may not reword `flagsForTeacher`, so the review
  page asks it to say so in its review, and the check prints a note.
- The build knows a marked list by its exact words (line breaks and a sticky
  line set aside). A slide showing only part of the list, or its words
  changed, is treated as unmarked: a composition fault, as before. Nobody
  after the lesson designer may reword a criterion, so this should not arise.
- **The slide designer's own check refused every long list on the capacity
  cue, from before this release;** found in this work and now mended (the
  section "The criteria cue is a note ..."). Seen before the mend: the slide
  check on one practice slide with the six-step compare list failed
  `SLIDE_DESIGN_CAPACITY` on this builder and on 4.2.288's
  (`scratch/fitb/smaller/capacity_probe.js`); after it, it passes.
- **A marked list too long even at 16pt** now reaches the deck as pages to
  check if the reviewer's send-back and the lesson designer's second try do not
  tighten it. At 16pt the half-width side holds about 16 lines of about 45
  characters; no saved list comes near (the longest takes 9 of its 14 lines at
  18pt).
- A sticky line the slide designer adds beside a marked list keeps 18pt, and
  one that does not fit is refused as it is beside any list, for the slide
  designer to carry in its own treatment (since the fifth check).
- **Two sentences written elsewhere can undo a pinned one** and pass every
  test (the fifth check's G2 and G6, the third and fourth checks' T3 and T7):
  for example "A list marked too long may be shortened by the slide designer
  until it fits at 18pt." written after the slide guidance paragraph. That is
  the known limit of phrase pins, which hold a sentence and not what is written
  beside it; nothing in this release was built to close it.
- The builder knows a marked list only as a list of steps in a criteria panel
  or `sc-panel`; a marked list inside a criteria stack keeps the 18pt floor, as
  any stacked list does.
- The refusal tells the lesson designer "nobody after you may reword a
  criterion", and the design reviewer, which comes after it, may correct a
  criterion's words. The review page's new question keeps to the refusal (the
  reviewer names the tightening, the lesson designer makes it), but the
  reviewer's own correction powers are unchanged. From before this release.
- A list inside a criteria stack (steps and a picture together) loses the
  criteria panel's marks, so its refusal says "Shorten the step to that", which
  decisions 12 and 13 forbid downstream. This is from before this release (the
  second check's note).
- `streamline-plan.md` is not updated, because the brief limited edits. The lead
  may want to record 4.2.289 there.
- The mapping rebuild writes `plans/2026-09-23-success-criteria-mapping.md`, and
  the mapping builder is in `sc-change/`. Both changed as the brief directs.

## Where the evidence is

- `plans/streamline-tools/fit-change/`: every change script, and the new files
  in `new/`.
- `plans/streamline-tools/fit-after-*.log` and `fit-after-designs.json`; the
  final run's `fit-final-*.log` and `fit-final-designs.json`.
- `plans/streamline-tools/scratch/fitb/`:
  - `zones.js` and `exact-zones.js`: the panels within half the slide;
  - `edit-c3-named-shapes.py`, `edit-py-test-named.py`, `edit-c8-named.py`: how
    the change scripts and test were narrowed to the named shapes;
  - `edit-c3-decision-11.py`, `edit-widen-test-2.py`, `edit-c8-second-check.py`,
    `edit-report-second.py`, and `undo-more.py` with `undo-more.txt`: the
    second check's repairs and the proof that each is caught;
  - `edit-marker-c2-c4.py`, `edit-marker-c3.py`, `edit-marker-builder-tests.py`,
    `edit-marker-py-tests.py`, `edit-marker-c8.py`, `edit-report-fourth.py`,
    `replay.py` (replays every change script on a clean 4.2.288 tree and names
    what changed), `designs-marker.py`, and `undo-fourth.py` with
    `undo-fourth.txt` (run on the snapshot `snap-a` by
    `undo-fourth-on-snapshot.py`): the fourth check's repairs and the proof that
    each is caught (`suites-fourth.txt` is empty: the restart cut that run off);
  - `smaller/`: his ruling on the last resort. `redo-c5c.py` (puts `c5c`'s
    files back from `snap-a` and runs it again), `edit_tool.py`,
    `edit-py-test.py` and `-2`, `edit-widen-test.py` and `-2`,
    `edit-c7-replay.py`, `edit-c8.py`, `edit-c8-size.py`, `edit-report-b.py`
    (how the new tests, `c7`, `c8`, the replay and this report were changed);
    `probe.js`, `sweep.js`, `check_probe.py`, `craft.py`, `craft2.py`,
    `box_probe.py` (finding the lists and the box the tests use); `e2e.js` with
    `e2e/` and `png/` (the delivered deck and its pages); `capacity_probe.js`
    (the slide check's capacity cue, on this builder and on 4.2.288's copy in
    `scratch/fitb/headcopy`); `all-round-a.json` and `all-final.json` (every
    saved slide before and after the round); `sizes.py`; `undo-b.py` with
    `undo-b.txt` and the snapshot `snap-b` (the attacks); `fit-b-pre-*.log`
    (a first run of every suite, before the report and log were final);
    and for the lead's two last points, `pre-c5d/` (the files `c5d` changes, as
    they were before it), `edit-round-c.py` and `-2`, `edit-c7-replay-c.py`,
    `edit-c8-c.py`, `edit-c8-size-c.py`, `edit-report-c.py`, and `undo-c.py`
    with `undo-c.txt` and the snapshot `snap-c`; and for the fifth check's
    repairs, `pre-c5e/` and `pre-d-new/` (the files as they were before
    them), `sweep18.js` and `craft18.js` (finding the list only the half side
    holds at 18pt), `dbg.js`, `edit-round-d.py` to `-4`,
    `edit-round-d-log.py`, `edit-c8-size-d.py`, `edit-report-d.py`, and
    `undo-d.py` with `undo-d.txt` and the snapshot `snap-d`;
  - `edit-c3-flags.py`, `edit-tests-third.py`, `edit-c8-third.py`,
    `edit-report-third.py`, `show-refusal.py` (the refusal and the note as they
    read), `sizes.py`, and `undo-third.py` with `undo-third.txt`: the third
    check's repairs and the proof that each is caught;
  - `draw-all.js`, `compare-all.js`, `all-before.json`, `all-after.json`;
  - `lists.js`, `saved.js`, `harness-b.js`, `compare-saved.js` and their
    results;
  - `inv-*`: the investigation's own scripts, before and after;
  - `fuzz-parity.py` and `fuzz-parity.txt`;
  - `undo-each-repair.py` and `.txt`, `each-mend-alone.py` and `.txt`,
    `new-tests-on-4.2.288.txt`;
  - `deck-after/`: the built deck, its build log and rendered pages.
