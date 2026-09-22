# Plan: the Teach shape the teacher uses, and a voice eval that can score a real lesson

Written 22 September 2026 from the Week 4 History (Lord Shaftesbury) and Science (digestive system) runs on 4.2.276. Nothing below has been applied. Apply in the order given; each part names its check.

Acceptance statement: a Teach board more often than not reads as the teacher teaches (one takeaway sentence, a because or so, an example the class looks at, and what it does not mean), the reviewer notices when the "what it's not" or the because is only in the script, the slide designer keeps the takeaway in the strip when the design has one, and the Teacher Voice harness can score a fixture built from a real lesson. What must survive: a Teach beat may still keep its sentence for the end (the Tudor calibration), a beat with nothing to refuse carries no fourth step, and the voice sweep's preservation rate does not fall.

---

## Part A. The Teach shape, stated once, in the teacher's own order

Diagnosis: the plugin already holds the four parts, spread over three paragraphs written on different days (4.2.200 route, 4.2.223 headline-first, 4.2.223 "say what it does not mean"). Both lessons wrote the takeaway and the fact, put the because and the "it wasn't" in the script only, and the reviewer approved every Teach board with "can be taught with notes closed". This is a judgement gap plus consolidation: one owner paragraph in the content route, and the three places that repeat the route pointing at it in the same four words.

### plugins/lesson-v4/references/teaching-sequence-content-based.md

Find:

    "explanation": "the route to the landed sentence, in whole sentences the teacher could say: what the class already has, the new thing, the look at the thing on the board, the because; usually two to four sentences, in the order the class meets them, never null",

Replace it with:

    "explanation": "the route the teacher walks after the takeaway, in whole sentences the teacher could say: the because or so, the example the class looks at (written, or the picture or helper the key question points at), and what it does not mean when the sentence invites a wrong reading; usually two to four sentences, in the order the class meets them, never null",

Find:

`explanation` is the teaching, as the child reads it: the route from what the class already has to the sentence the slide lands. The fact is the destination; teaching is the route; the board carries the route (`preferences.md` → Slide Philosophy, `The fact is the destination`). A route usually has four steps, most of them one sentence: what the class already has (`Every home needs food, a fire and a roof, every single day.`), the new thing that changes it (`In Tudor times there were no shops, and no light switches on the walls. If you needed wood, it had to be fetched.`), the look at the thing on the board, which is normally the key question (`Look at her. She isn't being paid to do this. So how does carrying those sticks help her family?`), and the sentence that lands, which is the headline or the sticky fact (`Many Tudor children helped their households get food, fuel or money.`). Saying the same thing three ways is the fault above; walking the route is three or four different things and is the teaching itself. The script says the same route as spoken words, with the connective talk the board does not need; nothing that teaches in the script is missing from the board, and nothing on the board goes unsaid in the script.

Replace it with:

`explanation` is the teaching, as the child reads it: the route from the takeaway to the point where the class can use it. The fact is the destination; teaching is the route; the board carries the route (`preferences.md` → Slide Philosophy, `The fact is the destination`). **The shape this teacher teaches in, more often than not, is four parts in this order, and the board should read that way unless the beat has a reason not to.** (1) The takeaway, one sentence, which is the `headline` and usually the first thing on the board (`Lord Shaftesbury campaigned with others to protect children through laws.`). (2) The because or the so: the reason it is true or the thing it changes, said as a reason and not as another fact (`He wasn't a king who could order everyone to obey him, so he had to persuade Parliament to pass laws.`). A fact beside a fact is not this step: `He was a member of Parliament, known then as Lord Ashley.` names him and gives no reason. (3) The example, which is the thing the class looks at while you say it: sometimes written (`Look at the dates: the first law only covered children under nine in cloth factories.`), and often only the picture, source or helper on the board with the key question pointing at it (`Look at her. She isn't being paid to do this. So how does carrying those sticks help her family?`). When the example is the picture, the key question is the sentence that carries this step and the field does not repeat what the picture shows. (4) What it does not mean, when the sentence invites a wrong reading (the paragraph below). What the class already has may open the route when the takeaway needs it (`Every home needs food, a fire and a roof, every single day.` before the Tudor sentence); it is the way in, not a fifth part. The parts are one sentence each, most of the time, and a beat that honestly has no reason to give or nothing to refuse leaves that part out rather than filling it. Saying the same thing three ways is the fault above; walking the route is three or four different things and is the teaching itself. The script says the same route as spoken words, with the connective talk the board does not need; nothing that teaches in the script is missing from the board, and nothing on the board goes unsaid in the script. The tell that the route stayed in the script: a `because`, a `so` or a `That doesn't mean` / `It wasn't` sentence in the script with no counterpart on the board. Both Week 4 lessons (22 September 2026) did exactly this on every Teach beat: `He wasn't a king who could order everybody to obey him`, `It wasn't the ten-hour law`, `People sometimes call the whole front of their body their tummy, but the stomach is this one organ` and `'Small' is doing a rather misleading job in that name` were each said and never shown.

Find:

**When the sentence invites a wrong reading, the route has one more step: say what it does not mean, on the same board.**

Replace it with:

**The fourth part: when the sentence invites a wrong reading, say what it does not mean, on the same board.**

### plugins/lesson-v4/references/preferences.md

Find:

So a Teach slide carries the route, in whole sentences a teacher could say: what the class already has, the new thing, the look at the thing on the board, the sentence that lands.

Replace it with:

So a Teach slide carries the route, in whole sentences a teacher could say, and more often than not in the order this teacher teaches: the takeaway, the because or so, the example the class looks at, and what it does not mean (`teaching-sequence-content-based.md` → `explanation` owns the four parts and their exceptions).

Find:

Read the route in board 1 and 2 together: what the class already has (every home needs food, a fire, a roof), the new thing (no shops, no switches), the look at the picture (she isn't paid; what are the sticks for?), the sentence that lands (the star fact).

Replace it with:

Read the route in board 1 and 2 together against the four parts: the takeaway kept for the end (the star fact, because here the class reaches it themselves), the because (no shops, no switches, so somebody had to fetch it), the example on the picture (she isn't paid; what are the sticks for?), and the way in that opened it (every home needs food, a fire, a roof). The order is the teacher's exception, not the default: a beat whose takeaway can lead does lead with it.

### plugins/lesson-v4/agents/lesson-designer.md

Find:

a Teach is the route in whole sentences (what the class already has, the new thing, the look at the thing on the board, the sentence you land) beside the actual object, text, diagram or working they look at,

Replace it with:

a Teach is the route in whole sentences (the takeaway, the because or so, the example the class looks at, and what it does not mean, in the order and with the exceptions `teaching-sequence-content-based.md` → `explanation` gives) beside the actual object, text, diagram or working they look at,

### plugins/lesson-v4/agents/design-reviewer.md

Find:

A board that is a headline, a fact or two, a question and the star fact has the destination on it and the route in the notes.

Replace it with:

A board that is a headline, a fact or two, a question and the star fact has the destination on it and the route in the notes. Read each Teach board for the four parts the teacher teaches in (`teaching-sequence-content-based.md` → `explanation`): the takeaway, the because or so, the example the class looks at, and what it does not mean. A board can honestly lack a part; what it cannot do is lack a part the script then supplies. So when you uncover the script, the sentences to look for first are its `because`, its `so`, and its `That doesn't mean` or `It wasn't`: each one with no counterpart on the board is the finding, quoted. On 22 September 2026 two lessons in a row were approved with `each Teach board can be taught with notes closed` while every Teach script carried a reason or a refusal the board did not (`He wasn't a king who could order everybody to obey him`; `People sometimes call the whole front of their body their tummy, but the stomach is this one organ`). A board of three facts in the same shape with no reason among them (`He was a member of Parliament, known then as Lord Ashley. Some owners opposed shorter hours because they feared losing money. Parliament made changes in stages.`) fails this read as a route and fails the voice sweep as rhythm; name it once, here, as the route fault.

### Check for Part A

Run:

    cd C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\scripts
    python -m pytest tests/test_the_board_carries_the_route.py tests/test_the_lesson_is_written_as_a_lesson.py tests/test_planning_consolidation.py -q

Expected: pass. If `test_planning_consolidation.py` asserts the old four-step wording (`what the class already has, the new thing`), update that assertion to the new wording `the takeaway, the because or so, the example the class looks at, and what it does not mean` and nothing else in that test.

---

## Part B. The slide keeps the takeaway in the strip, and a card may not repeat the title

Diagnosis, three mechanisms:

1. History Teach 1 had its headline and its sticky fact as the same sentence via `stickyKnowledgeRefs` with `takeaway: null`. The "lands its sentence once" validator reads only a `takeaway` sticky, so the duplicate passed, the reviewer's view printed the sentence twice, and the slide designer resolved it by dropping the headline from the strip and keeping the star.
2. The playbook allows the question band on any slide that "opens on a question", so two boards (history free schools, science stomach) put the question in the strip and the takeaway at the foot although the design gave a headline.
3. The focused repair moved history slide 4 to `lead-picture-lines`, which needs at least one line, and filled the line with the slide's own title. The split check counts a line and does not read it.

### plugins/lesson-v4/scripts/validate-lesson-design.py

Find:

            elif takeaway.get("kind") == "sticky":
                sticky = sticky_by_id.get(takeaway.get("ref")) or {}
                if isinstance(sticky.get("text"), str):
                    lines.append(("takeaway (sticky fact)", sticky["text"]))
        if isinstance(content.get("explanation"), str):

Replace it with:

            elif takeaway.get("kind") == "sticky":
                sticky = sticky_by_id.get(takeaway.get("ref")) or {}
                if isinstance(sticky.get("text"), str):
                    lines.append(("takeaway (sticky fact)", sticky["text"]))
        takeaway_ref = takeaway.get("ref") if isinstance(takeaway, dict) else None
        for ref in unit.get("stickyKnowledgeRefs") or []:
            if ref == takeaway_ref:
                continue
            sticky = sticky_by_id.get(ref) or {}
            if isinstance(sticky.get("text"), str):
                lines.append(("sticky fact (stickyKnowledgeRefs)", sticky["text"]))
        if isinstance(content.get("explanation"), str):

### plugins/lesson-v4/scripts/tests/test_the_lesson_is_written_as_a_lesson.py

Find:

def test_a_headline_that_names_the_thing_beside_a_sticky_fact_is_allowed():

Insert directly before it:

def test_a_referenced_sticky_fact_that_repeats_the_headline_is_refused_without_a_takeaway():
    # Week 4 history (22 September 2026): the headline and the sticky fact were
    # one sentence, the unit had takeaway null, and the slide showed it twice.
    design, photos = valid_content_contract()
    teach = first_teach(design)
    sticky = design["stickyKnowledge"][0]
    sticky["text"] = "Lord Shaftesbury campaigned with others to protect children through laws."
    teach["content"]["headline"] = "Lord Shaftesbury campaigned with others to protect children through laws."
    teach["content"]["explanation"] = "He wasn't a king who could order everyone to obey him, so he had to persuade Parliament to pass laws."
    teach["content"]["takeaway"] = None
    if sticky["id"] not in teach["stickyKnowledgeRefs"]:
        teach["stickyKnowledgeRefs"] = list(teach["stickyKnowledgeRefs"]) + [sticky["id"]]
    assert_invalid_contract(design, photos, "lands its sentence once")


### plugins/lesson-v4/references/slide-composition-playbook.md

Find:

A teaching slide keeps the teaching object visible. A content Teach unit's `explanation` is child-facing teaching text, and the landed sentence (the headline, or the sticky takeaway when the design carries one) is the slide's one prominent line.

Replace it with:

A teaching slide keeps the teaching object visible. A content Teach unit's `explanation` is child-facing teaching text, and the landed sentence is the slide's one prominent line. When the unit has a `headline`, that sentence is the `lead` across the top of the unit's first slide, because the teacher lands the takeaway first and then walks the because, the example and the "not this" beneath it. A `question` opens a slide only when the unit's landed sentence is a `takeaway` kept for the end (the class reaches it, as on the Tudor sticks board), or on the later half of a split whose first half already carried the headline. On 22 September 2026 two decks put the question in the band and the headline in the star at the foot on slides whose design had led with the headline; the child read the question before the sentence it was meant to be about.

Find:

and a slide that opens on a question puts it first (`question-lines-picture`, `question-picture-answer`).

Replace it with:

and a slide that opens on a question puts it first (`question-lines-picture`, `question-picture-answer`), which is a slide whose unit keeps its sentence for the end or the later half of a split, never the first slide of a unit that has a `headline`.

### plugins/lesson-v4/references/templates.md

Find:

| `question-lines-picture` | `question`, `pictures`, `lines` 1 to 3, `sticky` optional | The question in a band across the top, then the explanation beside the picture that answers it. Cards in total: 1 to 4. |

Replace it with:

| `question-lines-picture` | `question`, `pictures`, `lines` 1 to 3, `sticky` optional | The question in a band across the top, then the explanation beside the picture that answers it. For a unit whose sentence is kept for the end, or the later half of a split; a unit's first slide with a `headline` uses a `lead` layout. Cards in total: 1 to 4. |

### plugins/lesson-v4/builder/scripts/check-slide-design.js

Find:

          !carriesTeaching(slideData)) {
        warnings.push({
          slide: index + 1,
          field: 'layout',
          signal: 'TEACH_SPLIT_LEAVES_A_LABEL',

Insert directly before it the following, so that the new check runs inside the same `slides.forEach` loop before the split check (that is, insert this block directly before the line `      if (slideData.template === 'teach-layout' && slidesByUnit.get(unit).length > 1 &&`):

      if (slideData.template === 'teach-layout') {
        const titleWords = wordsOf(slideData.title);
        ['lead', 'lines', 'question'].forEach((slot) => {
          const items = Array.isArray(slideData[slot]) ? slideData[slot] : [slideData[slot]];
          items.forEach((item, position) => {
            const text = item && typeof item === 'object' ? item.value : item;
            if (typeof text !== 'string' || !titleWords || wordsOf(text) !== titleWords) return;
            warnings.push({
              slide: index + 1,
              field: Array.isArray(slideData[slot]) ? `${slot}[${position}]` : slot,
              signal: 'TEACH_LINE_REPEATS_TITLE',
              message:
                `this card says the slide's own title again ("${text}"). A title is a heading, not teaching, ` +
                'and a layout that needs a line is not filled by repeating it: on 22 September 2026 a repair moved ' +
                'a portrait slide to lead-picture-lines and put the title in the line, so the class read the question ' +
                'twice and no teaching. Put a sentence of the unit\'s explanation here, or choose a layout that ' +
                'does not need this slot.'
            });
          });
        });
      }

Find:

function carriesTeaching(slideData) {

Insert directly before it:

function wordsOf(text) {
  if (typeof text !== 'string') return '';
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

Find (inside `carriesTeaching`):

    const value = slideData[slot];
    if (Array.isArray(value)) return value.length > 0;

Replace it with:

    const value = slideData[slot];
    if (Array.isArray(value)) {
      const titleWords = wordsOf(slideData.title);
      return value.some((item) => {
        const text = item && typeof item === 'object' ? item.value : item;
        return typeof text !== 'string' || !titleWords || wordsOf(text) !== titleWords;
      });
    }

### plugins/lesson-v4/builder/test/teach-layouts.test.js

Find:

test('a Teach beat on one slide may be a picture with one statement', (t) => {

Insert directly before it:

test('a Teach card that repeats the slide title is refused', (t) => {
  // 22 September 2026: a repair moved history slide 4 to lead-picture-lines and
  // filled its one line with the title, and the split check counted it as teaching.
  const dir = tmpDir(t, 'teach-layouts-title-repeat-');
  const specPath = writeLesson(dir, [
    teachSlide('lead-picture-lines', { designUnitId: 'lesson-section/teaching-sequence/unit-001',
      title: 'Could Parliament shorten the working day?',
      lines: ['Could Parliament shorten the working day?'] }),
    teachSlide('four-cards', { designUnitId: 'lesson-section/teaching-sequence/unit-001' })
  ]);
  designFor(dir, TEACH_WITH_SCRIPT);
  const result = runSlideDesignCheck(specPath);
  assert.equal(result.ok, false);
  assert.match(result.stdout, /TEACH_LINE_REPEATS_TITLE/);
  assert.match(result.stdout, /TEACH_SPLIT_LEAVES_A_LABEL/);
  assert.match(result.stdout, /"slide":1/);
});

test('a Teach line that shares words with the title but says more is allowed', (t) => {
  const dir = tmpDir(t, 'teach-layouts-title-near-');
  const specPath = writeLesson(dir, [
    teachSlide('lead-picture-lines', { designUnitId: 'lesson-section/teaching-sequence/unit-001',
      title: 'Could Parliament shorten the working day?',
      lines: ['Parliament could shorten the working day, but only by passing a law and checking it.'] })
  ]);
  designFor(dir, TEACH_WITH_SCRIPT);
  const result = runSlideDesignCheck(specPath);
  assert.doesNotMatch(result.stdout || '', /TEACH_LINE_REPEATS_TITLE/);
});

### Check for Part B

Run:

    cd C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\builder
    node --test test/teach-layouts.test.js
    cd C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\scripts
    python -m pytest tests/test_the_lesson_is_written_as_a_lesson.py -q
    python validate-lesson-design.py ..\..\..\working\year-4-history-lesson-4\lesson-design.json

Expected: the two node tests pass with the rest of the file; the pytest file passes; the history design is refused on `teachingSequence[0].content` and `teachingSequence[4].content` with `lands its sentence once` (those are the two real faults). Then run:

    cd C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\scripts
    python -m pytest -q

Expected: every saved design fixture still passes; if a fixture fails only on the new sticky read, that fixture carries the Week 4 fault and its sticky reference or headline is corrected in the fixture, not the validator.

---

## Part C. The Teacher Voice harness can score a real lesson, and has a way to run

Diagnosis: the harness is sound as a scorer but has two holes that stop it doing the job the teacher wants (measure voice against real lessons so it one-shots). First, the fixture builder writes `beat` and no `surface_type`, and the scorer refuses any case without `surface_type`, so a fixture built from a real lesson cannot be scored (verified 22 September 2026 on the history lesson: `case held-001 is missing: surface_type`). Second, nothing in the directory produces a predictions file; the recorded 27/32 was produced by hand. The harness did not run in either Week 4 build and could not have; it measures the reviewer's sweep, not the designer's writing.

### plugins/lesson-v4/evals/teacher-voice/score.py

Find:

INPUT_FIELDS = frozenset({"id", "year_group", "subject", "surface_type", "wording"})

Replace it with:

INPUT_FIELDS = frozenset({"id", "year_group", "subject", "wording"})
OPTIONAL_INPUT_FIELDS = frozenset({"surface_type", "beat"})

Find:

        if case["surface_type"] not in SURFACE_LABELS:

Replace it with:

        if "surface_type" in case and case["surface_type"] not in SURFACE_LABELS:

Find:

        surface_metrics = by_surface[case["surface_type"]]
        surface_metrics["total"] += 1
        surface_metrics["correct"] += int(is_correct)

Replace it with:

        surface = case.get("surface_type")
        if surface in by_surface:
            surface_metrics = by_surface[surface]
            surface_metrics["total"] += 1
            surface_metrics["correct"] += int(is_correct)

### plugins/lesson-v4/evals/teacher-voice/test_score.py

Find:

class TeacherVoiceFixtureTests(unittest.TestCase):

Insert directly before it:

class ClassViewFixtureScoringTests(unittest.TestCase):
    def test_a_fixture_without_surface_labels_scores_overall_only(self) -> None:
        # A fixture built by class_view_fixture.py carries `beat` and no
        # surface_type, because production hands the reviewer no surface label.
        # It must still score; per-surface accuracy stays n/a for it.
        inputs = [
            {"id": "h-1", "year_group": 4, "subject": "History", "beat": "Teach one",
             "wording": "He was a member of Parliament. Some owners opposed it. Parliament made changes."},
            {"id": "h-2", "year_group": 4, "subject": "History", "beat": "Teach one",
             "wording": "He wasn't a king, so he had to persuade Parliament."},
        ]
        gold = [
            {"id": "h-1", "expected": "REPAIR", "rationale": "three flat facts in one shape"},
            {"id": "h-2", "expected": "KEEP", "rationale": "a reason said plainly"},
        ]
        report = score(inputs, gold, {"h-1": "REPAIR", "h-2": "KEEP"})
        self.assertEqual(report["overall_accuracy"], 1.0)
        self.assertIsNone(report["teach_explanation_accuracy"])


Then run the file once; if `report["overall_accuracy"]` is not the key the scorer uses for the overall figure, change the assertion's key to the key `score()` returns for overall accuracy and nothing else.

### plugins/lesson-v4/evals/teacher-voice/README.md

Find:

The input and gold files share case IDs. Gold is never read from an input
case, and the scorer rejects input files that contain `expected`, `rationale`,
or prediction fields.

Replace it with:

The input and gold files share case IDs. Gold is never read from an input
case, and the scorer rejects input files that contain `expected`, `rationale`,
or prediction fields. `surface_type` is optional on an input case: the hand-built
calibration sets carry it so the report can break accuracy down by surface, and a
fixture built from a real lesson does not, because production hands the reviewer no
surface label. A case without it counts in the overall, catch and preservation
figures and in no per-surface figure.

Find:

## Scoring

Insert directly before it:

## Producing predictions

`sweep-runner.md` is the prompt that turns an input file into a predictions file.
Give it to a fresh agent with the input file path and an output path; it reads the
production voice-sweep instructions and the Teacher Voice guide, decides KEEP or
REPAIR for every case, and writes `{"predictions": [...]}`. It never sees a gold
file. Run it three times per candidate and score each run; the spread between runs
is part of the result.

### plugins/lesson-v4/evals/teacher-voice/sweep-runner.md (new file, exact content)

# Teacher Voice sweep runner

You are producing predictions for the Teacher Voice regression harness. You are given an input file and an output path. Do not open any file whose name contains `gold`.

Read, in this order:

1. `plugins/lesson-v4/references/teacher-voice.md`, whole.
2. The paragraph in `plugins/lesson-v4/agents/design-reviewer.md` that begins `**Then sweep the voice, string by string.**`, and the paragraph before it that begins `A child-facing or spoken string in the wrong register is not polish.` These are the production sweep instructions; apply them and nothing stricter.
3. The input file. Each case has `id`, `year_group`, `subject`, `wording`, and may have `beat`. A string starting `Teacher says:` is a spoken script; every other string is read by a child of that year group. There is no surface label; decide what each string is from its wording, as the production reviewer does.

For every case, decide one of:

- `KEEP`: the wording can ship as written for what it is. A string can be short, plain, or carry a fact you would teach differently and still be KEEP; the question is register and child access, not whether you would have written it.
- `REPAIR`: the wording has a material voice or child-access problem that would merit a bounded rewording in a real review: planning language where a child needs the thing, a full form where speech contracts, a compressed label with no verb doing the work, several adjacent sentences in one shape and length, a question a child of this year cannot answer without first working out what it refers to, or a spoken script you cannot hear the teacher saying.

Do not repair for structure: a Teach explanation that lacks a reason or a "what it's not" is a route fault for the design reviewer's Teach-board read, not a voice REPAIR, unless its wording also fails a test above.

Write the output file as:

    {"predictions": [{"id": "<case id>", "decision": "KEEP"}, ...]}

with one entry per input case, in input order, and nothing else. Do not write rationales into the output file. Report, in your reply, the count of KEEP and REPAIR and the three strings you came nearest to repairing and let stand.

### plugins/lesson-v4/evals/teacher-voice/held-out-input.json

Replace the whole file with the fixtures built on 22 September 2026 from the two Week 4 lessons, so the next labelling session has real strings to label. Build them with the production builder and merge, keeping the file's own structure:

    cd C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\evals\teacher-voice
    python class_view_fixture.py ..\..\..\..\working\year-4-history-lesson-4\lesson-design.json held-hist.json held-hist
    python class_view_fixture.py ..\..\..\..\working\year-4-science-name-parts-of-digestive-system\lesson-design.json held-sci.json held-sci

Then write `held-out-input.json` as:

    {
      "version": 1,
      "set": "held-out",
      "purpose": "Fresh lesson strings for later human labelling. Build these with class_view_fixture.py so they match the strings and boundaries the production review view prints, and keep them out of evaluator design and tuning until the labels are recorded separately.",
      "cases": [ ...every case from held-hist.json in order, then every case from held-sci.json in order... ]
    }

and delete `held-hist.json` and `held-sci.json`. The cases keep their `beat` field and gain no `surface_type`.

### The labels only the teacher can give

The harness measures nothing until these strings carry his KEEP or REPAIR. Proposed labels for the Teach strings, for him to confirm or overturn before they are written into a gold file (`held-out-gold.json`, same shape as `calibration-gold.json`, one entry per case he labels; unlabelled cases stay out of the gold file and out of the score):

| id | string (start) | proposed | rationale |
| --- | --- | --- | --- |
| held-hist-007 | He was a member of Parliament, known then as Lord Ashley. Some owners opposed shorter hours because... Parliament made changes in stages. | REPAIR | three facts in one shape and length; reads as a caption set, not a teacher |
| held-hist-019 | Reports described children working below ground. Shaftesbury helped bring the problem... Boys aged ten and over could still work underground. | KEEP | varied length, the limit said plainly |
| held-hist-032 | A shorter working day didn't give a family money for school. Volunteer teachers ran free lessons, and... | KEEP | contraction, reason inside it, natural rhythm |
| held-hist-040 | Shaftesbury died in 1885. The memorial opened in London in 1893, after his death. We judge someone historically significant by... | REPAIR | two date captions then a definition; `after his death` repeats the dates; not something a teacher says |
| held-hist-011 | Teacher says: This is the man we call Lord Shaftesbury. He wasn't a king... | KEEP | you can hear it |
| held-sci-007 | Teeth break food into smaller pieces. Saliva wets it, and the oesophagus pushes swallowed food towards the stomach. | REPAIR | two organs and a fluid compressed into one line; `wets it` with the referent two clauses back |
| held-sci-013 | The oesophagus ends in this stretchy bag. Food stays here for a while before moving into the intestine. | KEEP | plain, pointing at the picture |
| held-sci-021 | The narrow coils take useful nutrients into the blood. The wider tube absorbs water from what is left. | KEEP | the reviewer's own closest call; stands |
| held-sci-028 | The rectum is at the end of the large intestine. The anus is the opening out of the body. | KEEP | two definitions, each doing a job |
| held-sci-024 | Teacher says: The stomach opens into the small intestine... 'Small' is doing a rather misleading job in that name! | KEEP | a light line from the content, headteacher-safe |

### Check for Part C

Run:

    cd C:\Users\Daniel\Projects\lessonv4\plugins\lesson-v4\evals\teacher-voice
    python -m pytest -q
    python score.py --cases existing-10-input.json --cases calibration-input.json --gold existing-10-gold.json --gold calibration-gold.json --predictions <a predictions file produced by sweep-runner.md> --format markdown

Expected: tests pass; the score command runs on the calibration set as before. Then produce three prediction runs with `sweep-runner.md` on the unchanged guide and record their overall, catch and preservation figures in the README's `Status` section as the baseline for the Part D measurement.

---

## Part D. A calibrated Teach explanation in the voice guide, adopted only if the harness says so

The teacher asked whether the shape belongs in the voice guide. The shape does not (Part A puts it where the route is owned). What the guide can carry is one calibrated pair, so the sweep has a worked contrast for the flat-facts fault it missed. The README records that a Teach-explanation *rule* in the guide did not improve agreement; this is an example, not a rule, and it is adopted only on measurement.

### plugins/lesson-v4/references/teacher-voice.md

Find:

## B. Light personality on a slide

Insert directly before it:

## A2. A Teach explanation that walks, beside one that lists

> He wasn't a king who could order everyone to obey him, so he had to persuade Parliament to pass a law. Look at the dates: the first law only covered children under nine in cloth factories. That doesn't mean the problem was solved; some owners broke the rules, so inspectors were sent to check.

Why it fits:
- one takeaway, then a reason, then the thing the class looks at, then what it does not mean;
- contractions where speech contracts;
- three sentences of different shapes.

Against:

> He was a member of Parliament, known then as Lord Ashley. Some owners opposed shorter hours because they feared losing money. Parliament made changes in stages.

Why it fails:
- three facts in one shape and one length, which reads as a caption set however true each one is;
- no sentence gives the reason the first fact matters, so the route stays in the script.

---

### Check for Part D

Produce three prediction runs with `sweep-runner.md` after this insertion and score them against the same calibration and baseline sets as the Part C baseline. Adopt the insertion only if catch rate rises or holds and preservation rate holds across the three runs; otherwise revert this one insertion and record the figures in the README's `Status` section either way.

---

## Order and version

Apply A, B, C, then D. Bump `plugins/lesson-v4/.claude-plugin/plugin.json` and `plugins/lesson-v4/.codex-plugin/plugin.json` from `4.2.276` to `4.2.277` once, and add one entry to `plugins/lesson-v4/references/build-review-log.md` under a heading `## 2026-09-22 - Teach shape, strip placement, and a voice harness that scores real lessons (4.2.277)` listing Parts A to D in one line each with their check results. Commit on `main` and push.
