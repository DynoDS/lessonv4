# Build review log

## 2026-09-14 A Do beat looks like its subject, and a quick match uses fresh cases (4.2.205)

Daniel asked for his deep-research report on Do beats (`deep-research-report(2).md`, Downloads) to be read against the plugin, with contradictions decided together. The report was written without seeing the plugin and assumes a screen-based app (drag and drop, click feedback), so part of it does not apply to a taught deck.

**Already here.** Thinking before activity (the report's central "cognitive action, then format" router is the `thinking` line), the kinds-of-chunk list, surface / work with / reason with, predict before reveal, example and non-example, spot the mistake, missing step, evidence to claim, no forced staircase, no untaught knowledge in a Do, PSHE safe distance, RE whose voice.

**Decided with Daniel.** (1) No coded registry or scoring formula with a variety bonus: activities stay chosen by judgement, consistent with his 10 September "judgement, never a number". (2) Immediate recall is not called retrieval practice: the report cites delayed-test studies for beats given seconds after teaching; `do-beats.md` §1 already reads that evidence correctly and is unchanged. (3) A quick match, sort or label straight after teaching is a real Do beat when its cards are cases the Teach did not show; matching the slide's own words is finding, not using.

**The change.** `preferences.md` rhythm gains `A quick match, sort or label is a real Do beat when the things on the cards are new` (with a spare card against elimination, and the recap limit), and points the Do choice at the subject file. History, geography, science, RE and PSHE each gain `What a Do beat looks like in [subject]`: starting points by the beat's thinking line, not a menu, which answers the 4.2.202 trace where the history file's sort guidance was never reached from the Do choice. `do-beats.md` gains 5.8 Put It in Order, 5.9 Causal Chain, 5.10 Same and Different and 8.8 Prove Sam Wrong; 5.4 carries the fresh-cases test; 8.2 no longer says a prediction has no wrong answer (it contradicted 10.3 and the science file); 6.3 four corners is marked not used beside Stand If. The content route and `How to pick` route to the subject section; the reviewer reads for a match over the slide's own words. Maths was left alone (its Your Turns and reasoning list already carry the report's maths moves); there is no English subject file, so the report's English section waits for one. Test `test_do_beats_look_like_the_subject.py` (7, failing on the old files). Python 1810 pass with the same 10 pre-existing failures (model and effort settings, component loading).

## 2026-09-14 A set of questions shares one alignment (4.2.204)

Daniel, on the Tudor starter as the plugin built it: "why is question one kind of centred and question two aligned left? That came from the original, so that must be something in the plugin." It was. `numbered-questions.js` chose alignment per card (4.2.156): centred when a question fits one line, left once it wraps, so a two-question starter with one short and one long question printed them differently. Each half of that rule had a good reason (centring shares the slack of a card sized to the widest question; a wrapped question centred strands its last words mid-card), and the fault was applying it card by card. The set now takes one alignment: centred unless any question wraps, then left throughout. Test `question-set-alignment.test.js` (one wrapped question sends both left; two one-line questions stay centred) fails on the old code. Builder 637 pass. The Tudor deck on the drive was rebuilt with it.

## 2026-09-14 Breaks between questions, centred categories, one long card, and captions once (4.2.203)

Four visual things from Daniel's read of the rebuilt Tudor deck. On slide 4 the cards printed at 19pt, under his 20, with short cards sitting in white space ("some things in these text boxes could have been made bigger"). Two questions in one place had no break between them ("they're still two questions, so they do need a break... paragraph breaks are more preferred; the slide designer can use line breaks if paragraph breaks don't fit as well"). Category cards (`Helped him straight away` / `Helped him when he grew up`) were left-aligned ("because these are category cards, they should be centred"). And every picture had a caption, including every Teach slide and every repeat ("if these were taken away, the pictures could have been bigger").

**Whose.** The two uncentred category cards and the two-questions-in-one-band were my hand edit, but nothing in the plugin would have prevented either: the playbook asked for "one alignment" across peers and never said which, and the density rule said to break at turns of meaning without saying that two questions are always two or which break to prefer. The 19pt group is the builder working as designed (4.2.194's `sizeGroup` puts cards that belong together on one size) meeting a card twice as long as its neighbours; no guidance said that the longest card sets the size. The captions came from the design: every Teach unit's teacher information said `Caption the picture 'Reconstruction of ...'`, following the history file's honest-labelling rule, and nothing said to label once.

**The change.** Preferences' density rule: two questions are always two moves; prefer a paragraph break, use a line break when the gap would cost the words their size in a fixed band (measured on this deck: the same two questions at 21pt with a paragraph break in the question band, 32pt with a line break). Playbook: category and destination cards are centred; cards that share a size are only as big as the longest, so split or rebalance the card setting a group near the floor (slide 4 went from 19pt to 23pt by splitting one card into two); a caption costs the picture its height, so none on a Teach slide whose words already say what the picture is, none on a repeat, and an honest reconstruction label said once. History file: say it once. Four tests. Python 1803 pass with the same pre-existing failures.

**Deck.** Saved to the drive with slide 4's card split, both question bands on a line break, slide 9's two questions on a paragraph break, the category cards centred on slides 10 and 14, and captions only on each picture's first non-Teach appearance.

## 2026-09-14 A carded word is used, a question says what it means, and a why lesson does more than explain (4.2.202)

Three more from Daniel's read of the hand-rebuilt Tudor deck. **Vocabulary:** `working conditions` had its own slide "then nowhere in the next slide or future slides does it say about them. Vocab is for when the next slide needs that, uses that, asks children to use that." **Questions:** `Which part helped apprentices like Tom straight away?` "What does this question mean?", `what did an apprentice get out of it?` "out of what?"; "only my smarter children will answer, because SEND, EAL, low children still need to get it", and a second question that guides them ("How could making clothes help Sam in the future?") is how he gets them there; the wording "would be great for college kids to discuss" and is too abstract for primary. **Do beats:** "situation, question, situation, question. What do children actually do, practise, sort? It's just listen to teacher, class discussion over and over again. Is this you're doing or something original plugin missed?" And on the fixes: "Hate stand if things. Never those! True or false are fine, but can be cheap."

**Traced.** Vocabulary: the Lesson Designer's rule "give every card at least one natural landing" existed and nothing checked it; the design's placement put the card after unit 4 and no later beat, board or script used the term. Questions: the design wrote `Which part helps the apprentice now, and which part could help later?`; my hand edits made two worse (`apprentices like Tom straight away`, `get out of it`). Nothing in the voice guide named either repair. Do beats: every Do in the design carried `format: spoken explanation`. The session log shows the designer opened do-beats.md at its intro, `How to pick` and §10 only, because the content route's Do paragraph says most Teach beats explain a cause and "`do-beats.md` §10 holds the formats"; that sentence became the route for every beat. The history file's "Sort when relationships matter" existed and was never reached from the Do choice. So this was the original plugin, not the rebuild.

**The change.** `validate-lesson-design.py` gains `validate_vocabulary_is_used`: every word in `vocabularyIntroductions` appears, in a plain form (plural, hyphen, either half of a paired card, `equal` for `equal to`), in the board, task or script of a beat after its anchor. Run against all 18 saved designs it refuses exactly one: this lesson's `working conditions`. `teacher-voice.md` §6 gains `Say what you mean, and give a second question that leads to the first` (name the actual things in the question; add a smaller concrete question that walks to the first without handing over the answer; the limit is recall, an already-concrete question and a deliberate puzzle). The content route's Do paragraph now says §10 is one section, not the route, and asks for §5 or §6 on at least one beat when three Do formats in a row are explanation. `subject-history.md` gains `A why lesson is not only explaining, over and over`, with what the rebuilt lesson did (match jobs to what they gave the family; sort what an apprentice got by now and later; sort working conditions against reasons, then decide which mattered more). `do-beats.md` marks Stand If as not used by the user, and bounds true or false. The reviewer reads the class view for questions that name nothing concrete and for a lesson whose Do beats share one channel. Tests: `test_words_questions_and_do_beats.py` (11), and the content-contract fixture's vocabulary word changed from `exchange` to `road`, because a rainforest-road lesson never used it. Python 1799 pass with the same pre-existing failures; builder 635 pass.

**The deck.** Rebuilt to 21 slides and saved to the drive: a matching task after the farm teaching, a sort of what Tom got (with a check slide), the working conditions sort straight after its card with the word used on the board and in the question, a second guiding question on Sam and on each of the three written stories, and questions rewritten to name the things. Honest limits seen in the render: slides 4, 9 and 13 carry two questions in one band, and their card text is small; the three written-story slides are dense; the worksheets have not had the guiding questions added.

## 2026-09-14 An invented case teaches the group, and history is told in the past (4.2.201)

Daniel asked for the Tudor deck to be edited by hand for teaching the next day rather than rerun. The first pass changed only the Teach slides; he said everything should have been sorted in his voice, and the second pass rewrote every slide, the notes, the worksheets, the answer key and the wall. That pass gave the invented cases names (Tom, Sam, Mary, Will) in the present tense. His reading of the result: the deck needed line and paragraph breaks, the wording was still summarised in places (`Tom is an apprentice to a Tudor baker. The baker teaches him to make bread, and gives him his meals and a bed.`), and the whole lesson was "situational": "here's the situation, question; here's the situation, question... it feels like that particular child, rather than Tudor children in general. Some children will just think THAT child experienced it, rather than this was a different time in history and many children experienced this." He then corrected my first reading of it: the names were right, because the plugin already asks for invented people to be named so a child pictures a person; the fault was that every question could only be answered about the one child and family.

**Traced.** The design itself wrote the cases as `Imagined Tudor case: a Tudor child helps carry cut wheat...` and asked `Why might the family need the child's help today?`, so the question was already about one family; naming the child made it visible. `preferences.md` → Source and Scenario Integrity had the neighbouring rule, `One case is not the group` (4.2.142), which covers the opposite direction: a group's members differ, so one case must not stand for all of them. Nothing said that an invented case in a knowledge lesson exists to teach something about the group, so its question should be about the group. And nothing in the history file said to tell the past in the past tense; the deck used "Tudor" in two titles out of eighteen.

**The change.** Preferences gains `An invented case is evidence about the group, so the question asks about the group`, beside the rule it completes: open the case on what was true for many (`At harvest time, every pair of hands on a Tudor farm mattered.`) with a line break before the story, ask about the group through the named person (`Why did Tudor families like Mary's need their children at harvest time?`), and answer the general reason before the story's detail; the limit is a person who really is the subject (a real figure, a believer whose own view is the learning) and a maths or English scenario that only carries numbers or a sentence. The Lesson Designer's placeholder-names rule points there at the moment it names a person. `subject-history.md` gains `Tell the past in the past tense, and keep the period in view` (stories, questions, answers and scripts in the past; titles name the period; the limit is the teacher speaking about now). The design reviewer reads a practice run whose every question is about one invented child as the same REVISE as a Teach board with its route in the notes. The Tudor calibration in preferences and `references/examples/tudor-teach-slides.lesson.json` now carry the deck he taught: past tense, the period in each title, and the telling kept out of the blue question band (the build's mixed-block check refused `Look at her. She isn't being paid to do this. So how does...` as one blue block). Five tests added to `test_the_board_carries_the_route.py`, two pins moved. Python 1788 pass with the same pre-existing failures; builder 635 pass.

**What the hand edit taught about amount, not changed in the engine.** Adding the group sentence and past-tense stories to the three practice slides overflowed their 50:50 split beside the success criteria; the fix that kept every word was the stories on the wide side and the picture on the narrow side, with the criteria panel given less height. Line breaks inside narrow cards shrank a whole card group's text, because the cards share one size, so on narrow cards whole sentences without forced breaks read larger. Both are composition judgements for the Slide Designer and are recorded here as evidence, not as rules. Not done: a run on this version.

## 2026-09-14 The board carries the route, and a Teach has a thought in it (4.2.200)

Daniel rejected the Year 4 History deck "Why did Tudor children work" (built that afternoon on 4.2.199) at slide 3: a reconstruction photograph, the label `A Tudor farm household`, and nothing to teach from. "What am I exactly meant to do with that? The scene hasn't been set. There's nothing on the slide to guide me to know what to say... I had to read the speaker notes to even get the slightest hint what I had to do." Then, of the deck as a whole: "A lot of the slides are just facts, questions, and sticky knowledge things... That's not teaching. There's telling. There's informing. There's asking, but there's no teaching."

**What the trace showed.** Every word on the board and in the notes is the Lesson Designer's; the Slide Designer copies exactly and cuts nothing. It wrote about 37 board words and 112 script words per Teach beat, with the scene-setting entirely in the script, and the reviewer approved it. It had read the rules: the Codex session log shows the agent file, the history file, the content route with its "teacher who does not already know this content" test, Pride Lessons, his Teach-slide calibration and the voice guide, roughly 100,000 words, and then the whole lesson written in 1 minute 50 seconds with three recorded thoughts. So this is not missing guidance; it is prose that a one-pass model satisfies in form. Four things in the plugin pointed it there. The Pride Lessons anchor ("the slides were minimal: the question, the tool, the SC; the teacher's voice filled the rest") was written from maths and science practice slides he taught knowing the content, and it was the reviewer's only User-fit calibration, so the reviewer could detect too much and never too thin. The Teach beat's contract allowed `thinking: null` because "the teacher acts and children watch", so the one beat with no thought in it was the teaching, and 28 of 28 saved Teach beats had written null. `explanation` was nullable "when the board already says it". And when the text-overload check fired, the focused repair split the beat at the page boundary: the picture and its label on slide 3 with all the notes, every word on slide 4 with no picture and none. Also found on the way: his own sketch of a Victorian schooling lesson (added 4 September, 4.2.99) had been deleted on 6 September by commit 68d554b8, whose message said it changed no teaching; and 13 of the designer's 23 reference reads came back truncated by Codex's output limit (the key rules still arrived this run; a standing risk, not this fault).

**What teaching is, settled with him.** Deliberately moving a child's thinking from where it is to something they can do without the teacher: connect to what they already have, direct attention to the thing that matters, make the relationship visible, give them part of the thinking to do, check what they took. The fact is the destination; teaching is the route; the slide carries the route. His standard, in his words: "something I or a completely new teacher on their first day can look at and go from and actually teach and make a difference. In both speaker notes and on slides. But never one and definitely not the other. The only difference is speaker notes are more conversational, like an actual script a teacher will say; the slides help the teacher with what to say though, just not too much stuff visually that's cramped."

**Tested before trusted.** The three Tudor Teach beats were hand-rewritten and built with the real engine four ways. He chose v3: five slides, his own sentences, each beat split once where the teaching turns (the scene set, then the look and the landed sentence), pictures large, sentences that belong together in one card. He rejected clipped fragments (`No shops, no switches.`: "quick, punchy and summarised, it doesn't sound warm, it doesn't sound human"), his sentences squeezed onto three slides (the engine shrank the text: "text heavy"), and one sentence per card across six slides with a text-only slide (over-fragmented). v3 ships as `references/examples/tudor-teach-slides.lesson.json` and is written out in preferences as the calibration.

**The change.** Contract: a content Teach's `explanation` is required and is the route (what the class already has, the new thing, the look at the thing on the board, the because, in whole sentences the teacher could say), and `thinking` is required on teach, teach-why and teach-needed; a new `TEACHER_PRESENTS_KINDS` keeps the idea-instances rule refusing an idea met only on Teach beats, because "has a thought" and "is used" are different questions. Guidance, each at its owner: Slide Philosophy opens with the definition, the notes-closed test and its limit; Pride Lessons gains `What a Teach slide holds: the Tudor calibration` (the five boards, one script, the four rejections and why); Written Voice and voice guide §2 say tighter is fewer sentences, never clipped ones; the content route's Teach block is rewritten around the route and the thought; the designer's walk-through bullet and thinking rule no longer excuse a Teach; the reviewer reads each Teach board with the `Teacher says:` line covered, as the other half of User-fit, and names a sentence that teaches in the script and is missing from the board; the playbook and the focused repair split a Teach beat where its teaching turns, the picture on both halves and the script cut with the slides; Daniel's history sketch is restored to `subject-history.md`. Checks, in `check-slide-design.js`: `TEACH_SPLIT_LEAVES_A_LABEL` (a half of a split Teach beat that is only a picture and a lead line) and `TEACH_SLIDE_WITHOUT_ITS_SCRIPT` (a Teach slide with empty notes while the design has a script), both read from `lesson-design.json` beside `lesson.json` and silent without one, so a hand-built spec still builds. Tests: four builder tests (the label, the one-statement slide that is allowed, the missing script, the design with no script), a Python file of twelve, three test fixtures given routes, four wording pins moved to the new wording. Builder 635 pass; Python 1782 pass with the same four failures as before this work (model and effort settings, untouched).

**Not yet done, and named.** No lesson has run through this version; the validation is a fresh Tudor run, untouched by hand, read by him at slide 3. Left alone on purpose: a My Turn keeps `thinking: null`; the nine slide moves from his ChatGPT thread (anchor, attention, problem, model, connection, contrast, misconception, handover, check) stay a vocabulary in memory and are not fields, because nine fields filled in 110 seconds would be nine kinds of telling. The caption box on the `picture-top-cards` layout holds 29 characters and on `banner-picture-sidebar` 44, which forced `reconstructed` into a caption he wanted to read `as it might have looked`; noted, not fixed.

## 2026-09-14 A file broken while being posted is never saved (4.2.199)

The RE lesson Symbols and their meanings, posted to the letterbox through ChatGPT Work's GitHub tools on 13 September (commit c9bb1ee), would not open on the drive: PowerPoint offered to repair it. The saved deck was 786,444 bytes and not a readable zip. Re-encoded as base64 it matched the real 842,142-byte deck (the host's download copy in Downloads) for exactly 524,288 characters, then read `474280bytesomitted`, then the deck's last 524,280 characters: the host had read the whole file as base64, its output limit replaced the middle with an omission note, and that text was decoded and committed. The filer copied faithfully; nothing between the build and the drive compared the file with what was built. The drive copy was replaced with the Downloads copy (all 77 parts read, 13 slides).

The instruction to read in pieces (4.2.197) came after this run, but an instruction alone cannot catch a read that looks complete. `lesson.json` now records each file's bytes and SHA-256 as built (`checks`), cloud-delivery.md asks the host to match them before posting and on read-back, and letterbox_filer.py refuses any file that does not match, leaving the lesson in the letterbox with an "arrived damaged" line in the log. Lessons posted before this have no checks and file as before. Nine failures in the full suite (agent launch-setting contracts) were present before the change and are untouched.

## 2026-09-14 A too-tall wall card says everything at once, and may be split to fit (4.2.198)

The 14 September scheduled cloud run lost its working wall. Its one worked-example card had eight steps; the build refused step 8 at 108 characters against a 106 budget, the one focused repair shortened it, and the rebuild then reported the panel 3.0in over (10.9in needed, 7.8in available). A card rebuilt from the report reproduced those exact numbers. Three engine faults, no agent fault: fitLinearBodySize's diagnose returned at the first over-budget item and never measured the panel; its remedies (cut, remove an item) were all rewording the focused repair may not do, and it never named the layout move that keeps every word; and check-repair-scope.py recorded a card's items as one ordered sequence, so the same steps split over two cards read as the whole list deleted, although its own contract allows splitting content across containers. Portrait was checked and does not help: narrower lines wrap each step further.

diagnose now names every over-budget item and the panel total together, names splitting the items in order over a second card as the remedy that keeps every word, and says an item over its own budget fits only reworded, which is the wall designer's decision. check-repair-scope.py rejoins a sequence split over consecutive containers under the same key when the pieces concatenate exactly; reordered, dropped or added values still fail, and a number sentence's summand order is still protected. The focused repair role now names the split for a panel overrun and routes an item over its own budget back as a wording decision; the designer's validate-only instruction names the split too. Tests: overrun-named-in-full.test.js (fails without the layout change) and four split cases in test_repair_scope.py (the allowed split failed before). Residual: a card with both an over-budget item and a panel overrun, as on this run, still cannot be fully repaired in the focused round, because the item needs rewording; the designer now sees both at its own validate-only check, where condensing is its to do.

## 2026-09-14 The first scheduled cloud lesson, and three cloud tidy-ups (4.2.197)

The first scheduled ChatGPT Work Cloud run (after a scheduled task created outside Work Cloud had no internet and no subagent tool) built year4-maths lesson 8, Estimate positions on a number line, with the teacher's computer off: review sent it back once for a guided check a child could pass with the halve-the-last-number misconception, then approved; slides and worksheets built; the lesson was posted through the GitHub connector and the plan's built counter moved to 8. At 10:40 the teacher's login helper saved it to Week 2 > Maths > Wednesday and moved filed to 8. The working wall failed and is under investigation separately.

Three cloud frictions from that run are repaired in the owning text. The setup fix told Codex to ask for escalated permissions, and Work's approval policy refuses any escalation request; the skill now asks only where the host grants it and runs the command as it is on a cloud box that already has the network. The orchestrator ran plan-tracker open on the connector route's copied plan files, which are not a clone; lesson-from-plan.md now says open and publish never apply there. Posting the 1,219,844-byte deck through the connector truncated a whole base64 read at about a million characters and wasted a blob before a 13-chunk re-read; cloud-delivery.md now says to read any file over 700 KB in pieces of at most 900,000 characters from the start and check the joined length.

## 2026-09-13 A plan document that cannot be opened says so (4.2.196)

Importing this year's plans into the real letterbox, the maths document named earlier the same day (Maths Long Term Plan - numbered.docx) had been removed from the drive, and python-docx's PackageNotFoundError came out as a traceback. plan-tracker.py now reports PLAN_ERROR: could not open ... as a Word document. The remaining Maths Long Term Plan.docx (edited 12 September, 186 lessons, lesson 7 Find the scale on a number line) was imported with next lesson 8; History next 2; Geography next 1. All three published to claude/lesson-outbox and read back.

## 2026-09-13 A scheduled run makes the next lesson of any subject's plan (4.2.195)

The July teaching-plugins routine knew which maths lesson came next: the Long Term Plan docx was imported into the letterbox repository as lessons.json, and a progress.json of built_up_to, filed_up_to and a buffer let each nightly run build the next row and stop when far enough ahead. The tracker (maths-plan-tracker.py) had come across to lesson-v4 unused; its saved copy was last year's plan, finished at 189 of 189, and its filed counter was advanced only by the retired login script. The user wants the same for every subject.

scripts/plan-tracker.py replaces it for any subject. It reads any plan table with a Lesson Objective column of LO: rows, keeping every other column under its own heading, handling both a Unit column (maths) and unit titles merged across the row (the Kapow geography and history plans); this year's three Year 4 plans read as 189, 18 and 18 lessons with the maths numbering matching the document. Each plan lives at plans/<plan>/ on the letterbox branch as plan.json, lessons.json, built.json and filed.json, the last two separate because a cloud run and the teacher's computer write them. next returns the lesson or a skip reason and writes the plan row as a lesson brief; advance accepts only the next lesson; set-filed never goes backwards; move handles drift; open and publish fetch and push the plan folder. deliver_files.py records plan and planIndex in lesson.json, and letterbox_filer.py moves that plan's filed counter on when it saves the lesson, in the same commit. references/lesson-from-plan.md carries the run steps for both git and connector routes, reached from one sentence in the setup slice. Default buffers are 5 lessons for daily subjects and 2 for weekly ones.

Checked: 11 tracker tests including a plan published from one clone, advanced from another and read back; a letterbox journey where saving lesson 12 moves filed.json from 11 to 12 on the remote. Not yet done: importing this year's plans into the real letterbox (which maths document, and where each subject is up to, are the teacher's answers), and a scheduled run from a plan.

## 2026-09-13 Teach slides are built from named layouts (4.2.194)

Daniel, on the first cloud-built RE deck (Symbols and their meanings): "did we talk about teach text being seperated instead of one text box and all on one side etc?? its still doing that? visually the slide isnt great". Then, after I had rebuilt his teeth deck and said the plugin was fixed: "i expected all future ones to be like that one. so what happened."

**What happened.** 4.2.148 answered "the teaching is one black block" with a paragraph in the composition playbook naming three good shapes, the first of them "separate cards down one side". The teeth and PSHE decks looked right because a repair agent hand-composed every slide with his mock-ups in front of it. The plugin got the paragraph, and the tests checked that the paragraph existed. Nobody ran a fresh lesson. The next unsupervised deck (4.2.193, cloud) put a picture on one half and a column of equal cards on the other on Teach slide after Teach slide, and repeated its one drawn cross into the empty half of three more. Two things made that arrangement win, and neither is guidance: it is the cheapest thing to assemble from the free zone templates, and it is the arrangement the picture-size floor (3 inches on the short side for a sole picture) lets through most easily. Building the sample layouts by hand hit that floor on most first attempts.

**What he asked for, and approved from samples first.** Lots of different teach layouts, "uniform, things are aligned, it doesnt feel random ... align centre is our friend, we align centre with elements too, we make sure things are spaced same width and height in different elements too", and layouts with no pictures. Twenty-nine samples were built with the real builder and his real RE, teeth and PSHE content, reviewed in PowerPoint, trimmed and rebuilt to that standard before anything reached the plugin.

**The change is a mechanism, not a paragraph.**

- `builder/src/teach-layouts.js`: `template: "teach-layout"` with a named `layout` and semantic slots (`lead`, `lines`, `question`, `sticky`, `pictures`, `captions`, `sides`, `speakers`, `steps`, `columns`, `answers`, `extract`). Twenty-seven layouts, seventeen with pictures and ten without. The builder expands each into the existing templates and content objects before validation, so every existing check, picture floor and fit pass still sees ordinary slides. The expansion owns alignment and sizing: text centred (a passage read closely keeps its left edge), cards that belong together fill equal slices, and sizing knobs on a slot are refused rather than silently overridden. A slot the chosen layout cannot place is refused with the names of the layouts that can, so nothing a designer writes is ever dropped from the board. Orange stays one explanation line, never a question, a sticky or a line carrying a taught word.
- `sizeGroup` on `text`: every text item on a slide sharing one settles on one size, wherever it sits. A row could already do this for its own members; a column of cards beside a picture, and captions under a row of pictures, could not, which is why a short line came out huge beside a long one on the hand-built samples.
- `check-slide-design.js`: `TEACH_SLIDE_NEEDS_TEACH_LAYOUT` refuses a Teach, teach-why or teach-needed unit's slide built from free zones (read from `lesson-design.json` beside `lesson.json`, silent without one), and `TEACH_LAYOUT_REPEATED` refuses consecutive Teach slides sharing a layout unless they carry the same unit. Do slides and everything else are untouched.
- Guidance: the playbook's three-shapes paragraph is replaced by the route to `teach-layout` and how to choose (count what the slide holds, then place each line by what it is about, then vary along the run); `templates.md` carries the catalogue, generated from the code, plus the design-field mapping; the slide designer's compose step routes Teach units there; the visual profile's orange mechanics name the slot.

**Tests read the built deck.** 42 new builder tests: a deck using every layout builds; the column of cards beside a picture and the captions under three pictures come out centred and settle on one text size, read from the slide XML after the fit pass (switching `sizeGroup` off makes both fail); every supplied word reaches the expanded slide for every layout; the refusals; the gate refuses a free-zone Teach unit and leaves a free-zone Do slide alone; a repeated layout is refused and one unit over two slides is not; the `templates.md` catalogue lists exactly the layouts the builder has. One Python test pinned the old three-shapes wording and now asserts the route. JavaScript 631 pass, 0 fail; Python 1753 pass with the nine known failures unchanged.

**Not yet proven.** Tests prove the layouts build and the gate refuses; they cannot prove the designer chooses well. That is the promise made to Daniel: two fresh lessons run through the plugin with no hand-building, every Teach slide shown to him, and the word "fixed" only after he has seen them.

## 2026-09-13 Picture paths and year groups no longer depend on how a run wrote them (4.2.193)

The first complete ChatGPT Work cloud lesson (Year 4 RE, Symbols and their meanings) reached the letterbox with a real PowerPoint and PDFs, every worker at its requested model and effort, and a review that sent the design back once before approving. It was PARTIAL for one engine fault: a Wikimedia candidate was recorded as output/working/..., a path relative to where the scout ran; validate-image-scout.py resolves it from another folder, found no file, and rejected the whole two-picture batch (PICTURE_RESULT_INVALID: candidate path is not a regular file under WORK_ROOT), so the slides first built with five SLIDE_PICTURE_MISSING diagnostics and provenance receipts were never written. All four fetchers (unsplash, wikimedia, openverse, web) recorded str(path) from --output as given; each now makes --output absolute before anything is written. A test runs the Wikimedia fetcher from one folder with a relative --output and resolves the recorded path from another; it fails without the fix.

The same run's delivery was refused with run-fixed-resource.py: argument --year: invalid int value: Year 4, because resolve-filing.py takes the teacher's wording and the wrapper required an integer. The wrapper now accepts 4, Y4 or Year 4, pinned by a test. Not changed: the run also showed several commands first called with missing required arguments and recovered; those are orchestrator slips with clear errors, not engine faults.

## 2026-09-13 A run keeps going where a finished worker does not wake it (4.2.192)

The first full lesson in ChatGPT Work's cloud spawned the Lesson Designer, then went quiet when it finished; it continued only when the user typed, spawned the reviewer, and went quiet again. Its turn was ending with a worker running, and Work's cloud does not start a new turn when a worker finishes, so an unattended run would stop there. It also started only the slide designer after review, not the worksheet branch beside it. The playbook's rule was "wait for it through the host's ordinary worker-wait mechanism", which on Claude Code and Codex on the teacher's computer is true without extra work.

The make-lesson skill now has one short scoped section, When a finished worker does not wake you: on such a host (or when a finished worker visibly did not wake the run) never end the turn while a worker runs or a step remains, launch every worker due at that moment before waiting, wait on them with the host's tool (wait_agent in Work) and service each as it returns. It states that hosts which do wake the orchestrator are unchanged, and a static test pins both the rule and that scope. A nudge sent mid-run with the older wording (wait on each worker straight away) would itself have serialised the branches; the corrected wording launches first, then waits. Not yet checked: a Work cloud run that finishes without being prompted.

## 2026-09-13 ChatGPT Work's cloud can build a lesson and post it through its own GitHub tools (4.2.191)

A real Year 4 Science lesson sent to a Codex cloud task stopped at the Lesson Designer: the orchestrator launched it as a nested codex exec, which the network proxy refused (HTTP CONNECT 403 to api.openai.com), and a follow-up probe showed Codex cloud tasks expose no spawn_agent tool at all. The same probe in ChatGPT Work with Cloud selected listed collaboration.spawn_agent, spawned workers at gpt-6-astra and gpt-5.6-sol medium, reached npm, PyPI, Wikimedia and api.github.com, committed a test file to DynoDS/teaching-outputs through its GitHub connector (checked from this PC and deleted), and offered a file for download. It had no environment settings and no git sign-in, so it could not clone the then-private plugin; the user made DynoDS/lessonv4 public, after a history scan found no credentials.

So a letterbox git cannot reach is now a route, not a failure: resolve-filing.py prints LETTERBOX_ROUTE=git or connector, and deliver_files.py in the connector route lays the lesson out as lessons/<name>/ plus lesson.json under OUTPUT_DIR/letterbox-staging and prints STATUS=STAGED, which run-fixed-resource.py accepts. Both take --letterbox <owner/name> for a box with no environment settings. What the orchestrator does with that lives in the new references/cloud-delivery.md, read only on cloud runs, because putting it in the playbook took the delivery slice past its 7 KiB budget. computer-setup.md now says Codex cloud tasks cannot build lessons, and carries a ChatGPT Work cloud prompt to test by hand before scheduling. Not yet checked: a full lesson in ChatGPT Work's cloud.

## 2026-09-13 Codex's cloud can post to the letterbox too (4.2.190)

4.2.189 said Codex's cloud could not use the letterbox; two probes run from this PC with codex cloud exec proved it can, once configured. With default settings both internet and a GitHub sign-in were missing (CONNECT tunnel failed, response 403; no credential). With a fine-grained token limited to DynoDS/teaching-outputs as the environment variable GITHUB_TOKEN, agent internet On, allowlist None, All methods, the probe still failed until the additional domains were entered as github.com, api.github.com on one line: on separate lines they were read as one address. Then Codex cloud cloned the letterbox, committed and pushed a test branch, which was checked and deleted from this PC.

Codex attaches one repository, so plugin_settings.prepare_letterbox fetches a named letterbox into the plugin folder when nothing attached it, at filing time so a missing key or blocked address surfaces before design; delivery does the same if needed. github_auth_args passes GITHUB_TOKEN as a per-command header, so the token is never written into the clone or git's messages. Rehearsed from this PC against the real repository on a separate test branch (fetched, posted with lesson.json, deleted). computer-setup.md now carries the proven Codex environment settings. Not yet checked: a full lesson built in Codex's cloud, whose picture sources also need allowing.

## 2026-09-13 Codex schedules lessons on the teacher's computer, not in its cloud (4.2.189)

The cloud setup steps assumed the letterbox would work from Codex's cloud too. OpenAI's documentation says otherwise: Codex cloud agents have no internet by default, return a diff or pull request instead of pushing, and lose secrets before the agent phase; Codex scheduled tasks run in the Codex app on the user's computer with approval_policy never and the default sandbox. references/computer-setup.md now says so, and that an unattended local task saves to the drive and checks slides only with full access, which is the teacher's call. The old TeachingOutputsAutoFile logon task was removed on this PC at the user's request; the new letterbox filer is installed.

## 2026-09-13 A new computer has one page to follow (4.2.188)

Step 5 of the fresh-computer work. The README's install section described manifests and package roots, and said nothing a teacher setting up a computer needs. It now opens with Before you start: the two things the plugin cannot install for itself (Node.js; Git and a GitHub sign-in while the repository is private), the exact add-plugin commands for Claude Code and Codex, what the first lesson does on its own, and the optional offers, each pointing at references/computer-setup.md. It is written to be pasted to Claude Code or Codex with "set this up for me". The repository root gains a short README pointing at it, because GitHub shows the root one. The old section is kept as How the package finds itself.

## 2026-09-13 A lesson built in the cloud reaches the teacher's drive by itself (4.2.187)

Steps 3 and 4 of the fresh-computer work. A cloud run cannot reach the teacher's computer. In July the teaching-plugins routines solved this with a letterbox (the private `DynoDS/teaching-outputs` repository, branch `claude/outbox`) and a login script on this PC, `teaching-outputs-sync/autofile.ps1`, run by the task `TeachingOutputsAutoFile`. That script is not in any repository, points at teaching-plugins, and has this PC's paths written into it, so a new PC would lose it and Lesson v4 cloud runs were never filed.

**The cloud half.** A cloud environment sets `LESSON_RESOURCES_LETTERBOX` to the letterbox repository's `owner/name` (or a clone's folder). `plugin_settings.letterbox_writer` finds the attached clone beside the working folder or the plugin's repository, because how cloud sessions lay out several repositories is not documented. `resolve-filing.py` then prints `DELIVERY=letterbox`, and `deliver_files.py` commits the teaching resources (never run records) into `lessons/<time> <lesson>/` with a `lesson.json` naming year and subject, and pushes to `claude/lesson-outbox`, retrying through a rebase when another run pushed first. The branch is new on purpose: Claude Code's documentation says cloud sessions may always push to `claude/` branches, and a separate branch cannot collide with the old script, which files everything on `claude/outbox` by path.

**The computer half.** `scripts/letterbox_filer.py install --repo <owner/name>` clones the letterbox into the plugin's folder, copies itself and the three scripts it uses into `filer/` (a login task pointing into the package would break at the next update), and registers a logon task for the user, falling back to the Startup folder. `run` places each waiting lesson with this computer's own settings: sorted lessons get the next free day exactly as a local run would, through `SortedFiling.place`, now shared by the resolver and the filer. A lesson leaves the letterbox only after every file is confirmed; a different file already at the destination is never overwritten; a ledger stops a lesson whose clear failed from being saved a second time into the next free day. `check-setup.js` refreshes the `filer/` copy when an update changes those files.

**Checked.** `test_letterbox.py` runs the whole journey against a local bare repository: next free day and clearing, two lessons in one login taking two days, a plain folder, no overwrite, no double save, drive unplugged. On this PC the logon task was registered without administrator rights, started once, and removed; the first start showed an installed copy reading the default plugin folder instead of the one it was installed into, because a task inherits none of the installer's environment, so the copy now takes its folder from where it sits, re-proved the same way. Tests: builder 589, Python 1772 passed.

**Also fixed.** 4.2.186 went out with one runtime-slice test failing: it pinned the sentence "Append genuine findings to the shared build review log", which the developer-mode change reworded. The 4.2.186 note wrongly said only the known four tests failed; its summary counted failing tests and missed a failing subtest. The test now pins the developer-mode wording. The remaining failures are the four model-setting tests and five lesson-designer component subtests that fail identically on 4.2.184.

**Not yet checked.** No real cloud run has posted to the letterbox, and the filer is not installed on this PC. The old `TeachingOutputsAutoFile` task is untouched and still files `claude/outbox`.

## 2026-09-13 Where lessons are saved is the teacher's choice, and only the developer's computer edits the plugin (4.2.186)

Step 2 of the fresh-computer work (4.2.185). The plugin saved every lesson to one school's mapped drive, read that school's term dates from inside the package, and found a writable copy of itself by guessing a folder name, so on another teacher's computer a run could start editing their plugin.

**Saving.** `resolve-filing.py` no longer takes a term dates path; it reads the computer's settings and prints `DELIVERY=none|folder|sorted`. With nothing chosen the resources stay in `OUTPUT_DIR` and the first report offers the choice once (`DELIVERY_OFFERED`). A plain folder gets the files directly. Sorted keeps the existing layout and placement rules unchanged; on this PC the new resolver gave the identical slot for Maths, English, Science, Geography and History, and a dry-run delivery named the identical folder. `sharepoint_sync.py` is now `deliver_files.py` and the wrapper kind `sharepoint` is now `deliver`, recording `build-results/delivery.json`; the previous-lesson lookup still reads older `sharepoint.json` records. Without sorting, the previous lesson is the latest working folder whose design has the same year and subject. Term dates accept "Autumn, term 1", "Autumn 1" or "Spring term 3" and are copied into the plugin's folder when sorting is turned on. The unused `agents/sharepoint-sync.md` and `Knowledge/term/Term.md` are removed; this PC's settings were saved first (E:\ drive, sorting on, the same term dates, developer mode on).

**Settings.** `scripts/lesson-settings.py` (show, save-folder, sorting on/off, offered, developer on/off) checks what it is given before saving, into `~/.lesson-resources/settings.json` through `plugin_settings.py`. The walk-throughs are in `references/computer-setup.md`.

**Developer mode.** `verify-plugin-root.py --find-source` accepts only `LESSON_RESOURCES_SOURCE_ROOT` or the developer setting; the running-package and `Projects/lessonv4` guesses are gone, as is `LESSON_V4_SOURCE_ROOT`. The build review log is written only in developer mode (otherwise the report's shared log is `NOT REQUIRED`), so another teacher gets no engine log on their Desktop. `/install-helper`, `/edit-templates`, `/add-test-questions` and `make-subject-file` now use developer mode and the start-up check instead of an environment value that named teaching-plugins, and no longer call `python3`.

**Guards.** `scripts/conftest.py` gives every test an empty plugin folder, so a developer's real settings cannot change a result. `test_nothing_a_run_reads_depends_on_one_computer` fails on any runtime file naming a mapped E: path, a user folder or this checkout; it caught the old delivery script when put back. Tests: builder 589, worksheet 688, wall 132, stick-in 50, Python 1762 passed; the same 4 unrelated model-setting failures as 4.2.184. Inside `codex sandbox` the resolver read the settings and the source lookup found the checkout.

**Not yet checked.** No lesson has run end to end on this version. A teacher with no settings has not been through the first-report offer in a real run.

## 2026-09-13 A fresh computer finds out in the first second, and sets itself up (4.2.185)

The user asked whether the plugin would work the same if this PC died and he installed it on a new one, in Codex or Claude Code. It would not. The builders' Node libraries are not in the repository (Codex's local marketplace had copied them from this checkout), no Python or Python library was ever installed by the plugin, the drive was hard-coded to `E:\Felmore Primary School`, the source copy was guessed from a folder name, the Unsplash key and drawings sign-in were silent, and `.claude/cloud-setup.sh` was referenced but only ever existed in teaching-plugins. Claude Code could not install this repository at all: it had no marketplace file. Seven decisions were settled with him one at a time (memory: fresh-install-portability-plan); this release is the first of five steps.

**Start-of-run check.** `scripts/check-setup.js` runs before anything else in `make-lesson` and `make-subject-file`, in about 0.3 seconds when all is well. Needed things (the four engines' libraries, a Python that loads python-pptx and Pillow, PyMuPDF, fontTools, python-docx, pywin32 when PowerPoint is installed, a browser for worksheets) produce `SETUP_NEEDS_FIX` and a `SETUP_FIX_COMMAND` that installs them. No Python at all is `SETUP_NEEDS_PYTHON`, installed only on the teacher's yes. PowerPoint/LibreOffice, the Unsplash key and drawings access are `SETUP_NOTE` lines that never stop a run and go into the report's Teacher flags; the Unsplash note can be declined once for good. Walk-throughs for each live in `references/computer-setup.md`, read only when taken up.

**Python libraries live outside the package.** They install with `pip --target` into `~/.lesson-resources/python/<python version and platform>`, and `scripts/python_extras.py` appends that folder to the path; every script that imports a library imports it first, pinned by `test_fresh_computer_setup.py`. Appended, so a library the computer already has always wins. `find-python.js` now reports `PYTHON_NEEDS_LIBRARIES` for a Python that starts but lacks them, instead of treating it as no Python. The hand-down variable is renamed `LESSON_RESOURCES_PYTHON`, because the plugin will move back to teaching-plugins.

**Two Codex faults found by testing, not by reading.** (1) The fix runs with escalated access and would find the teacher's own Python, report it complete, and leave the sandbox's Python bare, so every run would ask again: the check now names its Python in the fix command. (2) pip builds in a private temporary folder and moves files into place, and on Windows a moved file keeps that folder's permissions, so the sandbox saw each library as an empty folder: the fix resets permissions afterwards, and the probe treats a library with no readable origin as missing. Also: `render-pages.py` crashed inside the sandbox listing the teacher's Python folder; it now skips a folder it may not read. PyMuPDF is imported by its own name, which stops a deprecation warning on every page render.

**Installing.** The repository root now has `.claude-plugin/marketplace.json`, so Claude Code can add it as a marketplace; checked by installing into a throwaway Claude Code config. `scripts/cloud-setup.sh` registers the plugin in user settings from wherever the session starts, installs python3-pip, LibreOffice and fontconfig with apt, registers the bundled fonts and runs the check's fix. `.gitattributes` keeps shell scripts in Linux line endings.

**Checked.** A clean copy of the package (no libraries, empty plugin folder, only Codex's Python): check reported every gap, fix took 15 seconds, second check 0.26 seconds; that copy then built a deck with text fitting passed, a working wall, worksheet HTML through the browser, and rendered page pictures from a PDF (PyMuPDF) and a deck (PowerPoint through the installed pywin32). A 13-slide geography lesson gave identical build signals from the clean copy and the real checkout. On this PC, inside `codex sandbox`: check asked for the three missing libraries, fix installed them in 9 seconds, sandboxed check then `SETUP_OK`, and a PDF rendered to pages inside the sandbox. Tests: builder 589, worksheet 688, Python 1752 passed; the 4 failing Python tests (model and effort settings for image-scout, slide-decorator, slide-designer) fail identically on 4.2.184 and are not this change.

**Not yet checked.** `cloud-setup.sh` has not run on a Linux box; the first cloud run is its test. Inside Codex's sandbox PowerPoint cannot be reached at all ("A specified logon session does not exist"), so slide pictures there still need the render step to run with permission; that predates this change. After each version update Codex and Claude Code hold a fresh package copy, so the first run after an update reinstalls the engines' libraries (seconds, from npm's cache); the Python libraries survive updates.

## 2026-09-13 Charts print at their size on paper, and every stick-in piece prints in ink (4.2.184)

The two things 4.2.180 left open, each done by its own agent in a worktree and merged one at a time.

**Charts on the sheet and the wall.** The worksheet and the wall had kept placing the bar chart and line graph by scaling a board-sized drawing, so numerals shrank with the zone. Both now go through their adapters like every other picture: the sheet through `atPrintedWidth` (the chart fills its zone's width, plot height about 0.62 of that width, words allowed to grow up to 1.6 times the sheet floor), the wall through `sharedAtWidth` at 300mm with anchors. The old one-argument chart call is removed. A first attempt capped sheet charts at 130mm and left them small with dead space beside them; it was sent back. Catalogue minimums are now 80 x 60mm (bar) and 80 x 61mm (line). Honest note: on a narrow sheet zone a chart is a little shorter than before, because its height follows its width rather than the zone's height. Tests: `charts-at-printed-width.test.js`, `charts-on-the-wall.test.js`.

**Stick-in pieces in ink.** Older drawings placed on the stick-in pack (angle arc, Venn, Carroll, triangle and square, mirror line, translated shape, river) printed in the board's colours. They now go through `scaledPiece`, which reads the stick-in palette, with a grey-tones helper in `surface-profiles.js`: the mirror line is dashed, the translated shape paler and dashed, the river a grey ribbon. Bar and line charts are recoloured to greys by `inkChart` in the stick-in registry; that belongs in the chart drawings themselves and should move there. Test: `pieces-print-in-ink.test.js`.

**Seen but not changed.** Coin pictures on a stick-in piece are still colour photographs. A tally chart copied from an answer slide carries the revealed total onto the child's copy.

**Checked.** `sharing-status.js` 52 of 52. Tests: builder 577, worksheet 688, wall 132, stick-in 50, shared 118, all passing.

## 2026-09-13 A success criterion says what to do, not which stage you are at (4.2.183)

The user was still unhappy with criteria wording on slides, worksheets and walls, and brought an outside evidence page (Notion, "Success Criteria Testing"): five real lists, verbatim, each rewritten with them and approved. Two of the five are the Year 4 number-line lessons of 12 and 13 September (`Read the step size.`, `Divide by that many spaces.`); the others are ordering and comparing 4-digit numbers and a history source comparison. Every rewrite came out longer and plainer, and the page's working principle is `Use as few words as possible without making the child work out what you mean.`

**Why it kept happening.** The runtime told every writer the opposite in five places. `teacher-voice.md` §10, `preferences.md` → Success Criteria, the skill route's Writing the Success Criteria, the lesson designer and the design reviewer all asked for "short, memorable cues the class can repeat and call back", "2-5 words", and the route's own examples modelled the miss: `Ten ones? Exchange for one ten.` as a question-fragment condition, `Compare school with school.` as the history shape, and "black-box actions are fine" with `Work out the minute hand.` as the good example. 4.2.146 added the weakest-child test but stacked it on top of the word target instead of replacing it, so a designer could satisfy both with a tidy list of short, plain-looking stages. The review packet's only automatic cue fired on steps over eight words and asked for "a short, repeatable action cue", so the one mechanical nudge pointed at compression. Both lessons' design reviews approved the lists as "the familiar five counting cues".

**What changed.** The owning text now leads with the user's principle and says both halves bind. §10 carries two of the approved rewrites and the moves they show (name the action and what it acts on, give the rule that decides a choice, write a condition as an `If...` sentence, name what a pronoun stands for, show the arithmetic when the step is a calculation, follow the real thinking order outside maths, use as many steps as the method has), then the other boundary: a step is one sentence, explanation the teaching already gave stays out, and a step that is already clear is finished. `Default style: short` and every word target are gone; the question-fragment exemplars became sentences. The route's section now names two failure directions (too short to run, too long to use) and replaces "black-box actions are fine" with: say how, unless the class can already do it without thinking. The designer and reviewer lines point at the same test, working a fresh example from the steps' words alone. The voice guide's pre-flight item 2 now also asks whether words the child needed were removed. In the packet, the long-step cue moved from 8 to 16 words and asks about explanation, not shortness; two new cues ask about a question-fragment condition and a second sentence inside a step. Tests that pinned the old wording now pin the new; one new reviewer behaviour case covers short-but-vague criteria.

**Checked.** A fresh agent wrote criteria for five held-out Year 4 lessons (rounding, 1,000 more or less, series circuit, a setting description, locating a country) with the old guidance, with a first draft of this change, and with the final text. The first draft overcorrected: two-sentence steps, a definition inside a step, and the setting-description criteria grew examples. The one-sentence limit and "a step that is already clear is finished" were added from that result; the final run gave one sentence per step, stated decision rules, and left the writing criteria short. One run per version is evidence, not proof. Python suite: 9 failures, all present before this change (one earlier failure in the criteria test file now passes).

**The two lessons.** Monday's and Tuesday's slides, walls and Tuesday's worksheets on the drive were rebuilt with the approved wording, each with the engine commit that originally built it so nothing else moved. Monday's vocabulary slide could not be reproduced from any commit, so the drive's own slide 3 was kept byte for byte. Tuesday's worksheet steps panel was widened (row parts 1.3:1 to 1:1.4) because the clearer steps ran it 3mm over the page. Monday's criteria now sit at 18-19pt in the fixed panel, down from 23-27pt; a wider panel was tried and shrank the question and number lines more than it helped, so the layout was kept.

## 2026-09-13 The reviewer's fit judgement is User-fit, and the instructions say "the user" (4.2.182)

The user asked for their name to come out of the instructions the agents read. The design reviewer's second judgement is now `User-fit` (the report line, the packet check and the routing card all use it), and every agent and reference file that named them now says "the user". Code comments, test provenance and this log still carry dated history; no model reads those at runtime. Nothing about what is judged changed.

## 2026-09-13 The design reviewer reads each thing once, and a small repair stays small (4.2.181)

Daniel had an outside assistant audit the design reviewer for wasted work at 4.2.175 and asked for its changes to be made. Each finding was checked against 4.2.180 before anything changed; all eight held. Nothing in what the reviewer judges was removed.

**The reading pack printed the lesson twice.** `design-review-view.md` opened with every child-facing and spoken string (`As the class meets it`) and then printed the same scripts, prompts, answers and worksheet strings again inside the structured sections. The structured sections now mark a field `(in the class view)` instead of repeating its words, keep everything the words do not show (kinds, references, unlocks, thinking, teacher-only notes, answer delivery, a model the class never sees), and print a drawing's required features once when every configuration shares them. Checked on 40 saved lessons: the class view is byte-identical, no line the old view carried is missing, and the view is 4 to 21 per cent smaller (about 12 on average).

**A later review was held to the first design's picture budget.** The packet already switched its validator to the later-review form after the verified Phase 2 freeze but always ran the photo cap at 16, so a later review with a helper's or an adaptation's 17th picture failed preparation. Both commands now come from one reading of the freeze; after it the cap runs `--stage run` (24). The launch prompt takes the preflight's `validator.command` instead of spelling out the initial-only command.

**The reviewer was sent to reading that is not its own.** The routing card now has a reading contract: `Always read` (Pride Lessons, What a Lesson Is For, whose old trigger was the finding itself, and the voice guide's Final pre-flight check), then conditional sections, and a line that reading notes addressed to other agents do not widen it. A maths subject file is read by an exact `read-reference.py` command that skips `Greater Depth in maths`, which is the Adaptation Designer's. `preferences.md` → Worksheets is split, paragraphs moved but not reworded, into `What the sheet is for` and `The printed page`; the reviewer's trigger opens the first only, and every other reader still gets the whole section by its old name. The contents line saying Written Voice was for everyone every run, which contradicted the paragraph above it, now matches it.

**Checks it could not run at that point.** The maths worksheet check asked the reviewer to judge Below and Greater Depth sheets, which are made after the review. It now judges the base sheet against the same tier rule; the Adaptation Designer, which reads that rule in `subject-maths.md`, owns the other two.

**Route-specific checks for all five routes sat in every review.** They moved verbatim to `design-review-route-checks.md`, and the card prints the command for the lesson's own route.

**Wording repaired before the design was settled.** The voice sweep still hears every string first. The repairs now wait until the checks have decided which beats survive: a string in a beat returned for redesign has its miss named inside that redesign item instead of being polished and then replaced.

**Order of reading.** The class's own words are now read before the walk-through, so the designer's why lines are tested against the lesson rather than framing it. This changes 4.2.138's order (walk-through first); what that release protected is kept: the walk-through is still read as the lesson, before the structured view, and its closing decisions still wait for the drift check.

**A one-sentence repair loaded the whole reviewer.** When the review's own correction fails the validator, the hand-back now launches `design-reviewer-focused-repair` (under 5 KB against 58 KB): it changes only the fields the validator names, keeps the correction's meaning inside the limit, never touches the Result or judgements, and restores the found wording with a teacher flag when the meaning will not fit.

**Also.** The repeated "work a representative answer" instruction has one home in the Pedagogy judgement, and the route, practice and worksheet checks reuse that worked answer. The consolidation report's stale line about the reviewer reading all of `preferences.md` is corrected. The calibration examples in the reviewer (the history, RE and science cases) were kept: each marks a boundary a bare rule missed.

**Not done, and named.** No lesson has been run through this release; the claims are measured on saved designs and the test suite, not on a live review. The older job-spec options in `design-review-packet.py` are unused by the launch but kept, because no caller was proven absent. Tests: 13 new; the Python suite has the same 10 failures as before this release, none in the reviewer's path.

## 2026-09-13 Every picture is one shared drawing on every surface (4.2.180)

Daniel: "Make everything shared, I know its a big job ... consistency is good, and it stops anything having to be built because 'it can't use that one'". 4.2.179 built the guard and moved the number line; this release moves everything else. `node builder/scripts/sharing-status.js` now reports 52 of 52 pictures drawn from one shared module on the board, the worksheet, the working wall and the stick-in pack, and `SHARING_BACKLOG` is empty, so the guard refuses any picture that is not.

**How it was done.** Six agents each took a family in its own worktree, with the number line as the worked example and the four adapters as the only way a surface may place a drawing; the branches were merged one at a time with every suite run after each merge.
- Charts and reach: the board's bar chart and line graph now use the shared charts (board numerals 24pt, never under 18pt, where the board had printed 11pt); the circuit symbol key, labelled diagram, blank surface, parachute, line pair, bar model, tally chart, pictogram, food plate and circuit reach the surfaces that could not draw them.
- Geometry and time: clock, turn diagram, triangle-square, polygon (sheet `shape`), translation grid, area grid, and one comparison ring (board `comparison-slot`, sheet `comparison-target`, wall `comparisonSymbol`); the wall's angle fan is the shared angle with its opening filled.
- Place value: the chart (board tables and the sheet's CSS grid replaced), the vocabulary miniature, base-ten blocks, counter groups, the part-whole model (sheet `part-whole` and `part-whole-money`), pyramid and multiplication grid.
- Fractions and money: one shaded fraction (bar, grid, circle or stack; the sheet's `fraction-bar` and the wall's `fractionBar` and `fractionCircle` still draw it), the fraction wall, and money placing the real coin pictures everywhere (prepared 500px copies in `builder/assets/money/placed/`); the part-whole model's coins come from the same `coinImage`.
- Measures and diagrams: ruler, dial scale, measuring jug, timeline, process chain, classification key, concept map, fishbone, continuum line, source pathway, number network.
- Map: one `map-svg.js` composing the map assets and annotations; the wall draws maps for the first time, and the Brazil fill and globe-to-flat now draw on paper too.

Every older field spelling a designer used still draws, and each surface's dated comments moved into the shared module. Typed layout stays each surface's own and is listed: the geographical description frame, the draw-box row and the diamond nine joined it (words and writing space in an arrangement; a teacher drags the nine cells).

**Shared plumbing repaired on the way.** The board placer gained an editable PowerPoint caption under a picture (`caption` on a FIGURES row), a zone-fill check and a card measure; the sheet adapter pins a drawing to its printed width (the sheet's CSS was stretching any drawing narrower than its zone) and measures a too-narrow zone at the minimum so a refusal is named; a stick-in piece prints at the width its drawing chose, is not shrunk to pay for its label band, and a drawing that refuses is skipped with its reason rather than stopping the pack. The worksheet's unused cartoon coin code is removed.

**Checked against real lessons.** Every deck, sheet, wall and pack in `lesson-resources-output/working/` was built with 4.2.178 and with this release. One deck got worse: the Year 4 number-lines vocabulary card's 20-part strip was refused, because the shaded fraction held a part's width and a bar's depth to the 18pt text floor although neither carries words. Both now answer to a smaller floor (0.9 of the text floor, never under 11pt), and the deck builds and matches its old render slide for slide. Every other refusal is one the old version gave too.

**Behaviour that changed on purpose.** Board pictures are placed as one picture (captions stay editable text), so a teacher cannot type into a chart cell or retype a diagram's words on the slide. Worksheet shapes, part-whole circles, place value colours and the comparison ring now look like the board's. Map labels print at each surface's floor, so a small map crowded with country names is refused and asks for more room. Stick-in pieces print at a readable size, so some packs take more pages (one old pack 11 to 16).

**Also fixed.** The wall's two document-claims tests had failed for weeks because a Windows checkout gives the reference files CRLF endings and the test searched with a bare newline; it now normalises them.

**Not yet done.** The sheet and the wall still place the older chart modules at a scaled size rather than the printed-size layout the board uses. The translation grid is kept but translation-shape is the better picture. The stick-in angle piece still prints its arc in colour. Tests: builder 577, worksheet 683, wall 130, stick-in 46, shared 117, all passing; the Python suite has the same 10 failures as before this work.

## 2026-09-13 One drawing per picture, on every surface: the guard, and the number line (4.2.179)

Daniel saw that the wall's number line looked nothing like the slides and asked why everything is not shared. Then: "Make everything shared ... consistency is good, and it stops anything having to be built because 'it can't use that one'".

**Why it was not.** The four surfaces were built at different times, and the parity guard only asked whether each surface could draw a picture, never whether it drew the same one. `geometrySource` was optional and never checked against the code, and `false` on a surface was accepted as a teaching decision. Of 61 pictures, 10 came from one shared drawing on all four surfaces; the number line was drawn four separate ways (board shapes, the sheet's SVG, the wall's bold Arial with a red dot, the stick-in piece with its own field names), so the 4.2.169 label gap and the 4.2.176 Scale box reached the sheet and nothing else.

**The guard now reads the code.** `builder/scripts/sharing-status.js` works out, for every picture and surface, whether the surface draws it from the picture's shared module, with its own code, or not at all. `SHARING_BACKLOG` in `shared/visual-parity.js` lists what is not shared yet and `npm run check` refuses any difference, so it only shrinks and nothing new can join it. Every worksheet helper is now a picture in the manifest or listed as typed layout (questions, writing space, word banks, tables of words), which stay each surface's own text. Five worksheet-only pictures joined the manifest (base-ten blocks, counters, ruler, process chain, classification key), and success-criteria cues keep their own `successCriteriaSource`.

**How a shared drawing reaches each surface.** `shared/visuals/surface-profiles.js` gives each surface only what really differs: how big words print to be read there, whether the board may grow into spare room, and ink for the photocopied stick-in pack. A drawing lays itself out at its printed size, in points. The board places any shared drawing through one file, `builder/src/content/shared-figure.js`: the preflight asks for each drawing at its exact zone, the pictures are made between the two passes, and the real pass places them. The Comic Sans width table moved to `shared/text/comic-glyph-width.js` so shared drawings measure words the way the slides do.

**The number line is one drawing** (`shared/visuals/number-line-svg.js`), carrying the board's layout rules (one size per axis, the 18pt floor, refusing a zone too shallow, stacks of up to three named A, B, C), the sheet's boxes, arrows with answer boxes, caption slot, unit and object, the wall's marks as answer dots, the stick-in write band and given labels, and the shared jumps and highlight. It reads the wall's `from/to/step/marks` and the stick-in `intervals/tickLabels` spellings so existing specs still draw, and the wall and stick-in references now tell designers to copy the slide's object. The board's own `numberline.js` was deleted; its tests were ported to the shared drawing. Rendered: this lesson's deck (every line now a placed picture, looking as before), both worksheet pages (97% and 88% full, the Scale boxes under the lines), and the wall card, which now shows the board's line in Comic Sans with a green answer dot.

**Guidance.** `helper-authoring.md` replaces "decide which renderers" with "One drawing, on every surface" (reach is everywhere; use is the designers' call; typed layout is the boundary; lay out at printed size), and the helper builder's first and fifth steps say the same.

**Not yet done.** 51 pictures remain on the backlog; `node builder/scripts/sharing-status.js` prints them. The older shared figures still pre-render at one size in `build.js` and could move to the one placer. Tests: builder 621, worksheet 684, stick-in 43, shared 8 pass; the wall has the same two failing document-claims tests it had before this change, and the Python suite the same 10.

## 2026-09-13 The Scale box goes back under the line (4.2.178)

Daniel: "scale is now above numberline, it was fine where it was, just needed seperation and now that grey line underneath would do that". A caption's answer box is now always centred under the axis numbers, where the caption always was. The above-the-line placement was only there to save height. To pay for the row, the gap above a new question is 6mm rather than 8mm, since the grey line now does most of the separating. This lesson's Expected sheet still ran about 20mm over with the steps panel across the top, so on this sheet it moved into a row beside question 4's writing lines (the worksheet designer's rule 14 already allows this); it now fits at 97%. The rebuilt sheet replaced the copy on the drive. Worksheet engine 684 tests pass.

Open, and put to Daniel: why the four surfaces draw many pictures with separate code (the wall's number line is Arial, bold, with a red dot and an "A = 1,800" readout, unlike the slides), and whether worksheets should follow the slides' colour meanings more fully (slides print a question in blue and a taught word like "scale" in green; worksheets print both in black).

## 2026-09-13 A thin grey line between questions (4.2.177)

Daniel, shown the comparison: "no harm in a thin grey line if it doesnt force anything to move". A hairline in the rule grey is drawn across the middle of the 8mm gap above a new question (not above a section heading, which marks itself, and not between Parts of one question). It is positioned inside the gap, so no measurement changes: this run's sheets stayed at 100% and 90% full. The repaired scale worksheet and answer key were rebuilt and copied to the Tuesday Maths folder on the drive, replacing the earlier copies; the originals are kept in the run's `before-4.2.176` folder. Worksheet engine 684 tests pass.

## 2026-09-13 Questions stand apart, a scale is a box, one ask per answer, letters run on (4.2.176)

Daniel, on the "Find the scale on a number line" worksheets: the questions felt "too together", "Scale: ___" did not look like something to write on and sat too close to question 2, the Greater Depth prompts fused separate asks ("Find the scale on each line. Why are the scales different...?" over the lines, with unheaded writing lines beneath) and used words children would not follow ("Change just one printed number"), and every figure in the deck and on the sheet said "A".

**The page gave the gap between two questions the same 4mm as the gaps inside one.** Named and deferred in 4.2.169. A stack now puts the section step (8mm) above anything that opens a new question (a plain number, a first Part "1a", a numbered set) and above a section label; a later Part keeps the ordinary gap. This run's Expected went from 94% to 100% full; the older specs that still build gained 1 to 3% and none stopped fitting. A thin dividing line was built and compared, and added in 4.2.177 at Daniel's say-so.

**A caption's blank printed as three underscores in axis-number type.** A caption containing a blank is now a write-in slot: the words, then an answer box with the same stroke as the boxes at the ticks. It sits above the line level with those boxes when one end of that band is clear, which costs no height, and under the numbers otherwise. `maths.md` now says a value about the whole line is a caption with a blank, because the GD designer had used an `instruction` with an underline instead.

**The fused asks and the production words came from the adaptation brief, and nothing upstream named either.** `teacher-voice.md` §6 gains `One ask, then the place to answer it` (two asks answered in two places are two Parts; a follow-up that pushes further is its own Part; `Is Sam correct? Explain your answer.` stays whole), and `The planning nouns stay in the plan` now covers the words a resource is built in (`printed`, `given`, `blank`), which leak from the designer's own visual brief. The adaptation designer's routing names the new part. The worksheet designer gains a composition habit: a settled prompt that reaches it fused is split at its sentence boundary so each sentence sits over its answer, words unchanged.

**No rule said what letter an unknown takes.** `preferences.md` → Question Labelling now says a letter marking an unknown moves on with each new figure through the deck (A, B, C), keeps its letter when the same figure returns, and restarts at A on each worksheet, adaptation sheet and stick-in. The lesson designer's labelling line points there. Not enforced in the validator: letters sit in free text and visual descriptions, where a check would misfire.

Rebuilt this run's worksheet from its own spec (both pages fit) and a preview spec written the way the repaired guidance asks. Worksheet engine 683 tests pass; the Python suite has the same 10 failures before and after (agent model and effort settings, untouched here).

**Not changed.** The stick-in and wall number lines (the shared SVG) still print a caption's blank as text; no stick-in carried one. The Your Turn slides printing "(1) (2)" in the question box beside unnumbered lines was seen and not touched.

## 2026-09-13 The finished files are no longer reviewed

Daniel: "I dont think we need these reviews", and, on hearing what they caught, "If there's anything like that, I can just tell you to investigate so those things dont happen again".

Across the ten run folders holding a `final-resource-reviews.json`, about 35 final reviews ran (each a fresh launch of the resource's designer, 4 to 9 minutes, plus page rendering) and 3 raised a finding: a worksheet title overlapping its header rule, a second worksheet page fault on the Christmas lesson, and a vocabulary slide without the highlighted interval. The rest passed. It was a second judgement net after the design reviewer, which his 10 September ruling ("lesson design reviewer catches anything. Once it's downstream, it's being made") had already said not to have.

**Removed:** Phase 3.6's review of each built resource, the render-route probe and merge that served it, and `references/final-resource-review.md`; the `FINAL RESOURCE REVIEW` entry lines in the slide, worksheet and stick-in designers and the review route in the slide focused repair; review findings as a source for Phase 3.5; the review receipt checks in `validate-run-report.py` (a COMPLETE report no longer needs `final-resource-reviews.json`, and the "delivered, not withheld" check that read its REVISE entries). **Kept:** the design reviewer, every build check and its focused repair, picture provenance, the wall's page check (`PAGE_FIT_UNVERIFIED`), and the rule that a resource which built and passed its own check is delivered, now stated in Phase 4. The page-quality rules the review restated (boxes bigger than their answers, greyscale, furniture standing in for a task) still live in `worksheet-visual-profile.md`, which the worksheet designer reads.

**Checked:** Python suite 10 failing before and after, the same tests; builder and worksheet JS 1303 pass; the wall and stick-in JS suites carry the same two failures as before. No version bump, at Daniel's request.

## 2026-09-13 The designer reads the lesson children had yesterday

Asked whether the designer still looks at earlier and later lessons when given a plan, the Find the scale run showed it does read the plan's neighbours (its starter retrieves Lesson 6, and it leaves estimating to Lesson 8), but not the lesson already built for Lesson 6. Its "interval" definition drifted from Monday's ("between two neighbouring marks" became "between neighbouring marks"). The designer's rule for reading a prior lesson's files fired only when a brief named that lesson, and nothing told it where the files were. Daniel said yes to passing them.

`resolve-filing.py --working [OUTPUT_DIR]/working` now also prints `PREVIOUS_LESSON=`: the working folder whose sync record names the latest slot before this one in the same year and subject (a weekly subject takes an earlier week), ignoring records from before this school year and folders with no `lesson-design.json`. For tonight it names `read-and-complete-number-lines`. The setup slice runs it just before the designer launch and passes the folder as `PREVIOUS_LESSON_DIR`; the designer reads that design first and reuses its steps, definitions, sticky knowledge and representation word for word where today continues it, and only for the starter where today moves on. Three new resolver tests. No version bump, at Daniel's request.

## 2026-09-13 "Year 4" finds the drive too (4.2.175)

The first Codex run on 4.2.174 told Daniel "filed to Autumn 1 > Week 2 > Maths > Monday", and Monday already held a lesson. The session log shows the orchestrator passed the year as `Year 4`; the resolver looked for a folder ending ` - Year Year 4`, found none, checked nothing and offered the calendar's first day as free. The same call with `4` gives Tuesday, and so does the Codex sandbox, so the drive itself was readable. The resolver now keeps only the digits of the year, and prints `DRIVE_CHECKED=no` when the year folder is missing so the message says the day is unchecked rather than announcing it as free. That run's `filing.txt` had already been corrected to Tuesday before its sync. Two new resolver tests.

## 2026-09-13 The lesson says where it will be filed, and Tuesdays stay in their week (4.2.174)

Daniel: the master plugin used to look through his drive when he asked for a lesson, find the next free day for a daily subject or this week's folder for a weekly one, and say "filing to term > week > maths > Wednesday, tell me if you'd like it somewhere else". lessonv4 was not doing it, and he asked whether it could run alongside the lesson designer rather than adding time.

**The resolver survived; its instructions did not.** `resolve-filing.py` is master's script almost unchanged, and Phase 5 was still filing to the drive. The setup slice had shrunk to one line when `filing-destination.md` and the old playbook were retired on 28 August: no wording for the message, no reason for a moved day, and a pointer to a subject lookup that no longer exists. The setup slice now carries the message with one example, runs the resolver in the same step as the Lesson Designer launch (it takes a second and nothing waits on it or on the teacher's reply), and writes the answer to `filing.txt` so Phase 5 files to the week the teacher was shown, or to the day or week they named instead.

**Weeks were counted from the term's first day.** Autumn 2026 opened on Tuesday 1 September, so every Tuesday to Friday came out a week early: with Monday 14 September filled, the next maths lesson resolved to Week 3 Tuesday. It worked last year because that term opened on a Monday. Daniel's drive calls Monday 7 September Week 1 and keeps 3 and 4 September in a folder he named by hand ("a one off, not to say it won't happen again"). Week 1 is now the first week of the term that starts on a Monday; a date before it prints `OPENING_WEEK=yes` and exits 2, and the orchestrator asks which week. Against the real drive tonight, maths now resolves to Week 2 Tuesday. Four new resolver tests; the playbook's size check passes without raising its budget.

**Not changed.** The sync still files only into `Week N` folders, so a lesson for a hand-named opening-week folder stays on the computer.

## 2026-09-13 Each number-line question reads as its own question (4.2.169)

Daniel said the Monday worksheet's questions were not clear: not enough space and no visual mark for each one, with "Each interval is worth..." too close to the question underneath.

**The line's numbers floated below it.** The worksheet number line put its axis numbers a full tick-height under the ticks (26px against the slide's fifth of a tick). The caption hangs off those numbers, so the space inside one question (line to numbers to caption) was as big as the 4mm step between two questions, and each caption read as the heading of the line below. The numbers now sit a fifth of a tick under the marks, so a line, its numbers and its caption close up into one block and the step between questions is clearly the biggest space. The Expected page went from 99% to 93% full.

**The Reasoning line had no number.** The designer grouped the number line and its one question in a stack and put `question: true` on the question, so (5) printed under the line and the line looked like the end of question 4. The numbering pass now moves the flag up to the stack when it holds exactly one single question after unnumbered material and no section title. Two questions in a stack, a source with a set of questions, and a heading in front are left as written. The answer key is unchanged.

Rebuilt the run's worksheet from its own spec and looked at both pages. Worksheet 681 pass.

**Not changed.** The 4mm step between questions everywhere else. Widening it would separate questions further but costs height on every dense sheet; left for Daniel to decide.

## 2026-09-13 The answer key goes to the drive too (4.2.173)

Asked whether the plain-text answer key belonged with the resources, Daniel said "yes answer key too". `sharepoint_sync.py` now copies a file ending ` - Answers.txt` alongside `.pptx`, `.pdf`, `.docx` and `.xlsx`, and still skips any other text file, the run report and the walk-through. Phase 5, the `sharepoint-sync` agent and the filing test say the same.

## 2026-09-13 The teacher's drive gets the teaching resources only (4.2.172)

Daniel: "When I ask for outputs to go on my drive, I only need the lesson outputs, ppt, working wall, worksheet, stick in sheets, no run reports, no walkthroughs etc".

The number-lines run's filing step copied six files into the Monday folder: the worksheets, the plain-text answer key, the wall, the stick-in sheets, the walk-through and the run report. Phase 5 built its list from "exact delivered paths", and the walk-through is listed among the delivered resources, so the records went too; the walk-through and run report were then deleted from the folder by hand. The rule now lives in `sharepoint_sync.py`, which every caller passes through: it copies `.pptx`, `.pdf`, `.docx` and `.xlsx` only, prints `SKIPPED=` for anything else a caller hands it, and leaves those files in the output folder. Phase 5 and the `sharepoint-sync` agent say the same, and a test files a run's full set and checks only the four resources arrive.

## 2026-09-13 One Python for the whole run, and a true message for two Our Turns (4.2.171)

Daniel: "look into the python thing because I see this all the time. I also see the two our turn examples thing all the time", and, on hearing the cause, that the fix must work for anyone who downloads the plugin rather than for his computer.

**The Python friction was one cause, not many.** Python trouble appears in 22 of 39 recorded runs' friction files. The Codex session logs for the number-lines run show every worker running under a `read-only` sandbox policy, and on Windows that sandbox runs commands as the restricted `CodexSandboxOffline` user. Reproduced with `codex sandbox`: `python3`, `python` and `py` are not found (the teacher's PATH entries and Store aliases are per-user), the teacher's own Python install is refused with Access is denied (its folder grants only the teacher, SYSTEM and Administrators), and Codex's own runtime Python starts. Every instruction in the package said `python3`, so each worker discovered this for itself, many asking for elevated access. Granting permissions by hand was tested on a copy and does not work: Codex's sandbox also checks per-root capability identities it creates itself, so that route would chase Codex internals and is specific to one machine.

**The fix finds the interpreter instead of naming one.** `scripts/find-python.js` (Node, because it must run before any Python is known, and the package already needs Node) runs each candidate here, unelevated: `LESSON_V4_PYTHON` if set, then `python`/`py -3`/`python3` (or `python3`/`python` off Windows), then Codex's runtime Python, and prints the first that starts and can import python-pptx and Pillow. It picks the teacher's Python outside a sandbox and Codex's inside both sandbox modes. `make-lesson` and `make-subject-file` run it at start-up, every worker prompt carries a `PYTHON:` line beside `PLUGIN_ROOT:`, and all 69 `python3` commands in agents, skills and references now read `"[PYTHON]"` (with `&` in PowerShell). The build wrapper hands its own interpreter to the Node builders as `LESSON_V4_PYTHON`, and slide text fitting no longer stops at the first refused name: it asks the finder. The same slide build inside Codex's workspace-write sandbox failed with `AUTOFIT_DEPENDENCY_MISSING` on 4.2.170 and wrote the deck with no warnings on this version.

**Checked that Codex's Python is not a lesser Python for this.** It lacks fontTools and PyMuPDF; the fit pass's fontTools line-height function is unused (line height is a fixed 1.2), and fitting an oversized copy of Monday's deck produced byte-identical slides with the teacher's Python outside the sandbox and Codex's inside it (28 boxes shrunk each). Five scripts need modules Codex's Python lacks (render-pages' PyMuPDF route, powerpoint-to-pdf, question_crop, the visual overview); the finder does not change how those choose their route.

**Two Our Turns.** Four runs' friction: two Skill-based designs asked for two Our Turn units in a row, two Content-based designs asked for two Practise units. A cycle has always held one Our Turn unit carrying any number of guided examples ("include several fresh guided attempts rather than defaulting to one"); the single unit is left over from the original exactly-one slot made optional on 31 August, not a teaching limit. The fault was the message: a second Our Turn fell through to "has a my-turn cycle with no your-turn after it" when a Your Turn followed it. The scaffold and the validator now name two Our Turn units in a row and say to put the examples in one, and the route file says so at Our Turn. The Content-based single Practise is a route rule and is unchanged.

Budgets: the playbook budget rises from 72 to 73 KiB for the longer placeholder and the PYTHON lines; the worksheet-render slice and the slide focused-repair entry point were trimmed to stay inside theirs. Builder 624 pass (6 new); Python 1700 pass (2 new) with the same known failures.

## 2026-09-13 Five pictures nobody could draw, and why nobody noticed (4.2.170)

Daniel asked to fix the pictures the vocabulary review found broken on every slide, and why they had never been found.

**Why they were never found.** On 10 September (4.2.128) the projection floor rose from 10pt to 18pt, so text reads from the back of a classroom. `fishbone`, `continuum-line` and `concept-map` were written on 28 August with fixed label boxes sized for small type (cause boxes 1.75in x 0.60in, end labels 1.80in at 16pt, relationship labels 1.55in at 13pt), and from that day none of them could draw a realistic label; their own fixture, `builder/test-lessons/foundation-helpers`, has not built since. Nothing noticed because nothing builds the catalogue: `check-catalogue.js` only checks each type is named in `templates.md`, the fixture decks under `test-lessons/` are built by hand, and the pictures are rare (fishbone and continuum line appear in no real lesson; grid map in none). The `timeline` and `row` examples in `templates.md` carried labels no slide could hold, and designers copy the examples.

**The prevention.** `builder/test/guide-examples-build.test.js` builds the first matching JSON example of every content type in `templates.md` on a full-body slide through the real build script, fit pass included, on every `npm run check` (61 examples; photo-dependent ones skipped). It was proved by breaking the concept map on purpose: the test failed and named the picture. `helper-authoring.md` now says the example is built.

**The five.** Fishbone: effect and cause boxes measured from their words, cause boxes as wide as the ribs leave room for, and a named refusal (`FISHBONE_ZONE_TOO_SMALL`) instead of overflow. Continuum line: labels take up to 45% of the line at 22pt (floor 18) and are as tall as their wrapped lines. Concept map: nodes and relationship labels measured from their words, spokes on an ellipse that uses the zone's width, named refusals. Timeline: floors raised to the 18pt the fit pass actually enforces (a label measured as fitting at 11pt failed at the end of the build), and close dates drop to a second or third row on a longer tick, trying each arrangement so a label never prints across another date's tick; the example's "Port Sunlight classroom April 1897" became "Port Sunlight 1897", and two contradictions in its section (a `note` sentence and a "not to scale" caption) were removed. Row: the example's 42-character caption under a quarter-width photo became "Maya". A shared `wrappedLineCount` joins `glyph-width.js`. The fixture's header instruction was longer than the header's short-cue rule allows and was shortened.

**Vocabulary cards, follow-up.** The picture inside a vocabulary panel no longer wears the deck's white card inside the grey panel (a second inset), and beside a full-width picture a word without a picture hugs its text. All five pictures build on one-word vocabulary slides and four of five on two-word slides; a four-cause fishbone beside another word needs 1.89in and gets 1.82in, and says so by name.

Rendered and read: fishbone, continuum line, concept map and timeline on full slides, a 23-slide two-picture vocabulary deck (no regressions), and Monday's number-lines deck (vocabulary slide unchanged). Builder 618 pass; worksheet 681; stick-in 43; wall 125 with the same 2 failures; Python unchanged.

## 2026-09-13 A vocabulary card refuses nothing the deck can draw (4.2.169)

Daniel asked why the vocabulary card refused number lines and what else it refused, then ruled: "they shouldnt refuse anything, sort them!"

**Why it refused.** `resolveVocabVisual` accepted a fixed list of fourteen types and dropped every other picture from the card with a warning, text-only. `templates.md` justified it by the 2.2" panel. The list had not grown since the plugin was packaged on 28 August, and `helper-authoring.md` itself called the vocab gate "the easiest place to forget": most pictures were never refused on purpose, nobody added them. 53 of the 67 content types were refused, among them clock, fraction wall, shaded fraction, bar model, part-whole model, coordinate grid, measuring jug, dial, circuit symbols, timeline, tally chart and map.

**Now.** The gate accepts every type the dispatcher knows and anything without a bespoke small-card treatment draws through the ordinary dispatcher. The card sizes the picture to itself: the picture is drawn once into a throwaway slide at the card's height and the widest panel allowed (7.4"), and the panel keeps the width its ink used, so a clock stays compact and a number line takes its length, and a new helper is sized the day it is registered with nothing to wire. Picture cards share the slide's spare height. A picture made of words and parts (table, chart, question set, sort board, timeline and similar, the one list, `STACKED_VISUALS`) goes under the word at full card width, because beside the text its own labels fell under the readable floor.

**Checked by looking, every type.** A harness built one vocabulary slide per content type from the examples in `templates.md`, on three-word, two-word and one-word slides, and the renders were read. The first design (fixed icon/wide/large panels) put square figures with captions in a short full-width strip and they came out tiny; replaced by measuring the ink. Two stacked pictures on one slide ran the second card off the bottom; now their picture room is shared, and when it would fall under 1.9" the build stops with `VOCAB_PICTURES_TOO_BIG_FOR_ONE_SLIDE` naming the words rather than drawing anything unreadable. A bar chart squeezed below its plot area had been drawing nothing at all and saying nothing, on any slide; it now refuses by name (`BAR_CHART_ZONE_TOO_SMALL`).

**Found on the way, any slide.** The layout preflight read every `type` field as a content object, so a grid map's features (`"type": "physical"`) refused every grid map on every slide; inside a content object a `type` outside a content slot is now that helper's data. And the guide's own examples for `continuum-line`, `fishbone`, `concept-map`, `timeline` and `row` fail on an ordinary full slide (fixed label boxes, or example data that cannot fit); not changed here, they fail the same everywhere.

Updated `templates.md` (the visual field), `helper-authoring.md` step 6 (nothing to wire), and replaced the fixed-2.2" doc-claim guard with one that `templates.md` never again tells the designer a vocabulary card refuses a picture. Builder 617 pass (4 new); worksheet 681; stick-in 43; shared 8; wall 125 with the same 2 failures; Python unchanged.

## 2026-09-13 The rest of the number-lines run: the blue line, the vocabulary slide, the stick-ins and the wall (4.2.168)

Daniel asked what the blue line on the Monday worksheet was, why the vocabulary slide did not look like the vocabulary slide, and to fix whatever else the run showed. Every resource from the run was looked at again, and each fault traced to the engine rather than to a one-off choice.

**The blue line was a sentence with nowhere to go.** Every representation said "Visible caption: Each interval is worth 1,000." and the worksheet `number-line` had no caption. The designer used `unit`, the "cm" at the end of a ruler, which clipped it to "Each in". The focused repair moved it to `object`, the bracket a ruler measures, which drew a blue bar the full length of every line with the sentence running through the answer boxes. The second final review passed it. The line now has `caption` (under the numbers, their size, tight enough that five captioned lines still fit one side), `unit` refuses a sentence and `object` refuses to share the band with `boxes`, both by name. Guidance in `worksheet-helpers/maths.md`.

**The vocabulary slide was hand-built because the vocabulary card refused a number line.** `key-vocabulary` accepted a fixed list of card visuals and `numberline` was not on it (2.2in panel), so the slide designer composed the slide from free stacks, which is why it looked nothing like the house slide. The card now takes a number line, with its highlight and jumps, in a 4.6in panel given to every card on that slide so the pictures line up.

**The stick-in pieces printed different numbers from the slide.** The piece hid every interior label in question state, because an unmarked label might be an answer, and could not leave an endpoint blank. So Line A lost the 5,000 it was given, and Line C printed the 10,000 the child had to find in place of the 9,800 it was given. Its reviewer passed all 11 pages. A tick label marked `given: true` now prints, an unmarked one still never does, `endBlank`/`startBlank` leave a target end empty, and `caption` carries the scale. The class set grows from 11 to 16 pages because each piece is one line taller.

**The wall's number line floated in a square.** It was drawn on the square canvas, so a wide thin figure printed as a strip across an empty square. It is now cropped to its own ink and placed full width.

**A wrong number can sit at a mark.** A label may be `{ at, text }` on the board and the sheet, so "Has this line been completed correctly?" shows the mistake on the line. The run's worksheet task had been rewritten and slide 8 used a row of cards because this did not exist.

**Supporting pictures may list what they must show.** A non-load-bearing configuration had to carry `requiredFeatures: []`, so "the space between 0 and 10 highlighted" lived only in a description and the helper check marked it covered with nothing to test. Supporting configurations may now list features; the rule against copying one configuration's requirements onto every use stays.

**Codex was running an old copy.** The run's build commands ran from `.codex/plugins/cache/lessonv4/lesson-v4/4.2.165`, and `codex plugin list` still showed 4.2.165 after 4.2.167 was pushed, so the working-tree marketplace does not make a commit the installed plugin on its own.

Rebuilt Monday's deck, worksheet, stick-in sheets and wall from the run's own specifications with only the changes above, and looked at every page. Helper delivery checks pass on the rebuilt deck and worksheet. Builder 613 pass; worksheet 677 pass; stick-in 43 pass; shared 8 pass; wall 125 pass with the same 2 document-claim failures; Python unchanged apart from the retired empty-features test and its replacement.

**Not changed.** Both final reviewers passed pages with visible faults (text through boxes; pieces missing given numbers). The faults are now refused or impossible at build, so no reviewer rule was added; if a reviewer passes a visible collision again, that is the evidence for one.

## 2026-09-12 A number line can show a jump and a space (4.2.167)

Follow-up to 4.2.166, on Daniel's go. The Year 4 "Read and complete number lines" vocabulary slide asked for the space between 0 and 10 highlighted and a +10 jump over one interval. No engine could draw either, on any surface, so the repair produced a shaded strip floating above the line and an arrow pointing at the 10 tick: a mark, on the slide teaching that an interval is the space between marks.

**One meaning, four drawings.** `shared/visuals/number-line-jumps.js` owns what a jump and a highlight are: both ends on marks (refused by name otherwise, never drawn nearby), counting back allowed, overlapping jumps climbing a tier while touching hops share one, a highlight over the whole line refused because it points at nothing, and the arc and arrowhead geometry. The board (`builder/src/content/numberline.js`), the sheet (`worksheet-html` `number-line`), the wall (`numberLine`) and the stick-in piece (`number-line`, by tick index) each draw from it. Jumps take the focus blue, the stick-in keeps ink; the highlighted space takes the shared highlight orange from `figure-highlight.js` as a bar over the axis and a pale wash between its two marks (grey on the stick-in). A jump label is its size, up to eight characters, or `box: true` for a blank the child writes the size in.

**What a line will not carry.** Jumps share the band above the line with an arrow, an answer dot, worksheet boxes, an object bracket and wall marks, so a line with jumps refuses those by name (`NUMBERLINE_JUMPS_CROWDED`); a second line in the same visual carries the other. Labels that cannot sit over narrow spaces at a readable size are refused (`NUMBERLINE_JUMP_LABELS_CROWDED`) rather than shrunk. On the board a starved stack keeps an arrowhead of at least 0.14in and an arc of at least 2.25pt, because below that the jump stops saying which way it went.

**Where designers learn it.** `templates.md` (with when not to use it: where placing the jump is the child's work, per `subject-maths.md`, or on a line the teacher draws onto live), the worksheet helper example and purpose line (the example now shows jumps and highlight, since the purpose line has to name boxes, arrows and bracket in 220 characters), `working-wall-card-contracts.md` and `stick-in-sheets-pedagogy.md`. Regenerating the worksheet catalogue also brought in two purpose lines 4.2.158 and 4.2.159 had changed in code without regenerating.

**Checked by looking.** Rebuilt the rejected vocabulary slide from the real run's `lesson.json` with `highlight` and `jumps` in place of the strip and arrow: the Interval card shades 0 to 10 on the line, the Scale card shows a +10 arc landing on the 10 mark. Rendered samples on the sheet, wall and stick-in piece too, including counting back, a run of hops, overlapping jumps and a blank jump box.

Builder 611 pass (7 new); worksheet 675 pass; stick-in 43 pass; wall 124 pass with the same 2 document-claim failures as before the change; Python 1700 pass with the same known failures; parity guard OK.

**Still open.** Number-line labels still sit at their own value, so a deliberately wrong completion ("2,500, 2,700, 2,700") cannot be printed at a tick; that run's slide 8 used a separate row of cards and its worksheet task was rewritten. And a non-load-bearing representation still cannot list `requiredFeatures`, so the helper check cannot test a feature that lives only in a description.

## 2026-09-12 One slide's finding flags the deck, it never withholds it (4.2.166)

A Year 4 maths run ("Read and complete number lines") came back `BLOCKED` with no deck. Eight of nine slides passed final review. Slide 3, the vocabulary slide, did not: the design asked for the space between 0 and 10 highlighted and a +10 jump over one interval, and the slide `numberline` helper draws neither. The focused repair improvised a detached shaded strip and an arrow pointing at the 10 tick, the second review still said REVISE, and with the one repair round spent the orchestrator excluded the whole deck. Daniel: "it shouldnt fail because one slide couldnt accurately show something for vocab".

**The gate was being read as a withholding rule, and the playbook half-said it was.** `validate-run-report.py` only demands PASS reviews when a package claims COMPLETE, and Phase 4 already said `BLOCKED labels the record, not the delivery`. But "a blocked package still hands over every resource that built and passed its own checks" left "its own checks" open to including the final review, and Phase 3.6 said only "keep unresolved faults visible". The orchestrator read the two together as exclusion. The repair settles it in Phase 3.6: a finding that survives its repair round is flagged (page, fault, the change to make by hand, first in the report and in Teacher flags) and the resource is delivered; exclusion is for a resource that never built or failed its deterministic check. Such a package is PARTIAL, not BLOCKED.

**Enforced, not only worded.** The validator now refuses a report that lists a resource as NOT DELIVERED when that resource's file exists and its final review is REVISE, and says what to do instead. Run against the failed run's own report it fails with exactly that line. A resource whose file never built can still be excluded.

**Found, not changed this round.** (1) The engine cannot draw a jump or a highlighted interval on a number line on any surface, slides, worksheets, wall or stick-in, though counting on and reading intervals are everyday KS2 maths. The same run's worksheet also needed a lesson redesign because number-line labels sit at their value, so a deliberately wrong completion cannot be printed at a tick, and slide 8 worked round it with a separate row of cards. That is a helper build, awaiting Daniel's go. (2) The helper check marked both vocabulary pictures `covered` with no feature checks. A non-load-bearing configuration must carry `requiredFeatures: []`, so the highlight and the jump lived only in the description, which nothing tests. (3) The first slide review reported slide 6's 9,800 as detached from tick 4; the render shows it under tick 4. A single misread, recorded, no change.

Python run-report tests 55 pass; full script suite shows the same five pre-existing failures as before the change, nothing new.

## 2026-09-12 A picture has to be about the same thing the words are (4.2.165)

Two faults from the working-wall review, both traced to a rule that existed and did not reach far enough. Neither was a missing rule in the sense of nobody having thought about it.

**A card explained 5,346 beside a part-whole picture of 2,340.** Both numbers are genuinely the lesson's: slide 3 introduces partitioning with a part-whole model of 2,340, slide 4 models 5,346 in a place-value chart. `Match the lesson's visual supports` told the designer to reproduce the lesson's support in the same form, and it did: partitioning, part-whole model, correct. What no rule said is WHICH drawing of that shape, so the card took the concept picture from the slide before the one it was working. The rule now says same form is not the same case, with the boundary that an anchor card stacking several numbers for a unit is doing a different job and its numbers are its content. Placed in the section that already owns which picture a card takes, which the packet cuts into every wall run.

**A card reading "You can pass without giving a reason" was illustrated with the media player's skip button.** The designer chose that emoji itself; there was no upstream fallback in that run. `A Picture Beside a Word` in `preferences.md` already catches it precisely: a picture passes when it IS the thing and fails when it gestures at the area. Its scope was the problem. It said it was about a picture carrying a word's meaning, and a card whose picture illustrates a whole statement sat outside that. Its scope is now meaning a child cannot yet read for themselves, which reaches a sentence as well as a word, with the discrimination case named: a photograph of children playing in a 1900 street beside a sentence about street play is still the thing itself. What fails is a symbol standing in for an idea, and an interface control fails twice because the child has to know the software before the metaphor starts.

**The rule that needed no change.** The title repeated as a table's first column heading is not a fault: `Same columns as the lesson` says the wall copies the lesson's columns and not to drop any, which is right. Only the title is the wall designer's, and one duplicated word does not earn a rule.

**And one that guidance cannot fix.** A Year 4 science wall gave four tooth names with no meanings, every one paired with a photograph. `Vocab chip cards` already says chips are for words children half-know or whose meaning is obvious in context, and says not to pair every chip because a wall of stock photos reads as clip-art. Incisors, canines, premolars and molars are none of those, on a lesson called describe teeth and their uses. That is guidance being read and not followed, so the repair is not another sentence; it is left as a live question rather than answered with a rule that was already there.

Both changes are extensions of existing rules at their existing owners, and the new text was read back out of a regenerated designer packet rather than assumed to route. JavaScript 125 wall, 0 fail; Python 1698 pass, the ten known failures unchanged.

## 2026-09-12 The wall is built and checked like everything else (4.2.164)

Daniel asked for a review of every working wall the engine had ever built: 36 documents, 47 A3 sheets, across many versions. Correct, premium, helpful. The answer to the second was mostly no, and five of the causes were one engine fault each.

**Text was being driven to its floor size on three quarters of every sheet ever printed.** Twenty of 47 sat exactly on 36pt against an 80pt ceiling. `stackedBodyOpts` raised the per-item line cap to 4 only for a card carrying a `visual`, so a card carrying a `photo` kept the default cap of 2 in a panel narrowed to 60% of the sheet. In a column that narrow, 2 lines is reached long before the page runs out of height, so the cap and not the page decided the type size and `fitLinearBodySize` walked all the way to the floor. Same card, same space: cap 2 returns 36pt, cap 4 returns 72pt. The cap is now one number for every card, high enough that height binds, and the content budget that decides which cards are refused is split out and left exactly where it was, so nothing that used to build now fails.

**The same two sentences were set at 44pt beside a photograph and 68pt beside a drawing.** Which kind of picture sits next to the text was changing the size of the text. That is the clearest statement of the fault and it is now a test.

**A drawing was rasterised once at 600px whatever size it would print.** A place-value chart placed 31.6cm wide on A3 came off that render at about 41 dots per inch, with visible staircase edges on its digits. The design canvas stays at 600 because stroke widths inside the primitives are absolute against it and scaling it would thin every line; only the raster grows, by four. The widest placement is now about 163 dpi.

**The title bar reserve was a guess and the guess was short.** The panel renderers reserved a flat 1.6in while an A3 bar draws at about 2.19in, because nothing set a line-height and Comic Sans' own line box is nearer 1.4 than the 1.25 the constant assumes. A card fitted against six tenths of an inch it did not have overran, and one shipped with "times the place to its right." alone on a second A3 sheet. `render-grids` had solved this for reference tables long ago: pin the line-height in the CSS, then reserve exactly that. The panel family now does both. Seven cards drop one size step, which is the room they never had.

**A number line wrote its ticks "2500" beside a card that said "2,500",** on the lesson where telling those apart is the point, and two mark labels 500 apart printed as "3,000A = 3,500" because nothing checked whether they met. Both fixed. The separator rule now exists in three engines independently, which is its own finding.

**A vocabulary chip sized its photograph from the word's font size,** giving 1.2cm whatever the page had spare. Four tooth photographs too small to tell an incisor from a molar, with the bottom half of the sheet blank. Sized from row height now: 6.6cm on that card.

**Then Daniel asked why the wall is the only printable with a builder agent.** It was. Slides, worksheets and stick-ins all go through `run-fixed-resource.py`; the wall spawned a model on every run to execute a fixed script and then inspect what it had just made. That builder's own instructions told it to reject a blank page, a picture too small for a wall, unreadable text and overlaps. Every fault above is on that list and it caught none of them. Worse, the playbook let the wall's final review reuse the builder's earlier inspection, making it the one resource signed off by the agent that produced it, on notes written before the final pictures landed.

**So the wall joins the others.** `run-fixed-resource.py` gains a `wall` kind and the wall gets the same collision archiving, marker discovery, hashing and summary envelope; the build script already printed `Built:` and `PDF_SKIPPED`, so it needed no new protocol. The physical-page check moves into the build script, where it runs on every build and cannot be reused from an earlier look: a wall whose PDF holds more sheets than its cards laid out is refused by name. The judgement about a finished sheet goes to `working-wall-designer` at FINAL RESOURCE REVIEW, which is where every other resource's owner already reviews its own, and the reuse clause is gone.

**The builder agent file stays packaged.** `slide-builder`, `worksheet-builder` and `stick-in-sheets-builder` all exist and are not spawned by `make-lesson` either; deleting the wall's would have made it inconsistent in the other direction. Its header now says it is out of the route and why. The revise-in-place route still spawns builders, which is where a worksheet builder had been seen.

**One error caught by the size budget.** The first draft put the reasoning in `playbook-lite.md` and pushed it 232 bytes past its 72 KiB limit. The playbook carries the instruction; the reasoning belongs here and in the agent file, where it costs nothing on every run.

Nineteen new tests, pinning outcomes rather than markup: the old `page-fill.test.js` asserts the CSS that lets a panel grow and passes whether the text landing in it fills the page or sits at the floor in the middle of it. Full run: Python 1698 pass, the ten known failures unchanged; JavaScript 604 slides, 674 worksheet, 125 wall, 43 stick-in, 0 fail.

## 2026-09-12 The board asks what the child does too (4.2.163)

Daniel, reading back 4.2.162 from the worksheet work: "is this the exact change we did to slides?" It was not. The slides had one rule about starters, which lists other retrieval forms and says to reach for a list of written questions only when the recall genuinely is a list of questions. Past the starter there was nothing. A Do beat's `format` is free text, a Your Turn carries a core action inside `activityArchitecture`, and a deck whose every task beat is a numbered list answered in books breaks no rule at all.

**So the question generalises, and only the question.** Every beat where children produce something now asks what the worksheet side asks of every question: if this child were showing you the answer with the work in front of them, would they point at it, move it, group it, order it, fix it, or tell you. The answer is named in the field the beat already has, in the worksheet's own words for it, so one lesson's two surfaces describe the child's action in one vocabulary rather than two.

**What does not cross over is the closed list, and the reason is not caution.** A worksheet IS the child's response surface, so its form settles what the child does and an enum belongs there. A slide is the board: the same beat can be answered on a whiteboard, in a book, aloud or at the front, and that is the teacher's decision, which `subject-maths.md` has protected since long before this. What the board owes is a form that makes the intended action possible and obvious, not a recording method. Stated as the reason rather than as a hedge, because the obvious next tidy-up is to close the gap by adding the enum here, and that would have the board telling teachers how children record.

**And the list of questions is defended, not merely permitted.** Where the thinking genuinely is the words, or where the skill being practised is answering written questions of that kind, which is most maths fluency, a list is the right answer. The fault is the list that was never chosen.

**One error caught by writing the test.** The first draft told the designer to name the action in the beat's `format`, and Your Turn, Apply and Use Learning have no `format` field. The rule now names the field each beat actually carries, and a test reads those key sets out of the validator so the pointer cannot rot.

Nine new tests. Full run: 1695 pass, the nine known failures unchanged; JavaScript 604 pass, 0 fail.

## 2026-09-12 The child's action is chosen, not defaulted to (4.2.162)

Daniel, on the sheets the plugin has been building: "there's mainly always text
and children write on line instead of - label a diagram - draw arrows / connect
pairs - sort cards into boxes - circle / tick / cross - complete part of a table
- highlight evidence - annotate a picture - sequence items - complete a model -
correct something directly on an example - draw or construct an answer ... And
then use answer lines only where explaining something in words is genuinely the
best task."

**Counted before anything was written.** Eleven worksheet specs built between 5
and 12 September were read by what they actually draw. Ruled writing lines and a
plain printed instruction are the two commonest things on every one of them.
Across all eleven, label-a-diagram, match-up, sort-grid, sequencing and
correct-an-example appear zero times. The engine draws every one of those, and
has for weeks.

**The cause is upstream of the page, which is why the September page work did
not touch it.** `response` was free text. A designer writing `two handwriting
lines` had settled the form, the worksheet designer is required not to change a
settled response, and so the page had no way to be anything else. The clearest
casualty is the Year 4 teeth sheet: objective *name the layers of teeth*, three
names asked for on three ruled lines, under a labelled diagram the sheet never
lets a child write on, half the page empty. Its final review passed it with
"every sheet provides three separate naming targets", which was true.

**So the form is now named where it is chosen.** `responseForm` is required on
every question block, every question-group part and every stimulus-set prompt,
from a thirteen-value vocabulary that is Daniel's list: label the visual, mark on
a visual, match or join, sort into groups, put in order, choose from options,
complete the table, complete the model, correct the example, draw or construct,
complete the sentence, short answer, written explanation. `response` keeps its
job and sizes that action's target.

**`written-explanation` is the one value that carries a reason**, because it is
the default the list exists to interrupt rather than because it is second best.
`responseFormReason` says what the words evidence that no other form would, and
the validator refuses it on any other form so it cannot become a general
commentary field. Where writing at length IS the objective, the block kind is
`frame`, which needs no form at all - the frame is the form.

**Five places, one decision each.** The lesson designer and adaptation designer
choose it as they write the question (the adaptation designer's line is where
the `Getting the answer down` dial is actually turned, and the tier does not
decide it alone). The validator enforces the vocabulary. `shared.md` maps every
value onto the helpers that draw it, and its old "start from what the child
does" table was rewritten rather than duplicated. The worksheet designer
realises the named form and returns a gap rather than substituting. The design
reviewer reads the forms across a sheet against the objective's own verb, and
is given both failures by name: all-lines, and forms rotated for variety across
an objective none of them fit.

**Two things this does not do.** It cannot make the chosen form the right one -
that is judgement, and it is why each agent gets the reason and the boundary
rather than just the list. And it is a breaking schema change: a design saved
before today fails the gate until its blocks carry the field, which is what the
teeth and being-active designs now do.

Twenty new Python tests, plus the engine's guide-name guard now reading the
vocabulary from the validator so a value can never be enforced with no helper
route. Python 1686 pass, the nine known failures unchanged. JavaScript 674 pass,
0 fail.

## 2026-09-12 The line reads the way its question reads (4.2.161)

Found while rebuilding the Monday rounding sheet with the current engine, not
reported. "Round to the nearest 10." over 6,734, and under it a number line
whose ends printed 6730 and 6740. Two conventions for one number on the sheet
practising the convention.

The slide engine made this repair on 8 September (4.2.113, the builder's
`formatValue`); the paper engine had kept `String(v)`. The worksheet number
line now formats a whole number of a thousand or more with the comma, by hand
rather than through the machine's locale, and leaves decimals, values under a
thousand and authored string labels exactly as written. The stick-in engine's
shared line takes its labels as authored strings, so it is not touched.

Three new tests. JavaScript 674 pass, 0 fail.

## 2026-09-12 The code sits on the line the work starts from (4.2.160)

Daniel: "I think the gd,e,b thing should be in line now actually. When trimming,
I wouldnt have to trim top off sheet because it already starts good but feel like
now I have to every day trim top. Line them up."

The code was pinned 6mm from the top of the paper, which put it 5mm clear of
everything else on the page and reading as a stray mark above the sheet rather
than part of it. It now sits with its BOTTOM edge on the 15mm line the work
starts from, so the two share a top edge. It still costs the page nothing: it is
inside the printer margin, in its own layer, which is the Word-header behaviour
he asked about and was already true.

**Level WITH the first heading was measured and is a different question.** To
print beside "Fluency" the code has to be inside the work area, and the corner it
would occupy is not reliably empty: across every saved worksheet spec rebuilt
with this engine, 8 of 36 pupil pages carry ink in the 12mm by 6mm top-right
corner, three of them more than half full. Reserving a band above the work does
not fix that either - a reserved band puts the code in its own strip, which is
where it already is, just lower.

What reserving WOULD cost is now known rather than guessed: 5.5mm off every
sheet, and of 61 saved sheet pages only 2 have less than that to spare. The
median page has 60mm. So it is affordable and it is a decision about the page,
not a placement, and it is his to make.

Two new tests, one of them asserting the band still takes nothing off the
content area. JavaScript 671 pass, 0 fail.

## 2026-09-12 A space a child cannot see is not a space (4.2.159)

Daniel, reading the rebuilt Greater Depth rounding sheet: "whats the gap between
2 and 3". There was no gap. It was 43mm of working room belonging to question 2,
asked for as bare paper with no border and no words, and it read as the end of
the sheet.

He settled what to do about it in one line: "dont want bare paper, if it is a
question it truly thinks needs working space (that they couldnt just do in book)
then it should have a box but thats rare."

**So `frame: "none"` is gone, and refused by name rather than corrected.** A
drawing or working surface is always a box. This is the callout argument in a
different helper, and the engine already makes it twice: paper left blank because
that is the task and paper left blank because nothing was put there look
identical on a page, so something has to tell them apart. A border costs nothing
and does it. The refusal message names the other half as well, because it is the
half a designer has to act on: most questions do not earn a box.

**The rarity rule is the part that generalises, and its test is the child's
book.** A sheet setting aside room for jottings is competing with the exercise
book already open beside it, and the book is bigger, always there and not being
printed. So the question is not whether room would help, which it always would,
but whether the working could be done in the book. Room earns paper when the
working has to sit with something printed: annotating a supplied diagram, drawing
on a given number line, a design the sheet collects in. It is in the helper
guide, in the helper's own one-line purpose, and in the designer's preflight.

**Also measured and NOT a fault, because he asked.** The sheet code in the
corner does not push the first heading down: built with and without it, the work
starts at 15mm either way. The code sits at 6mm to 10.3mm, inside the printer
margin, which is why the two do not line up and why the code costs the page
nothing. Aligning them would mean dropping the code into the work area, where on
a sheet that opens with a full-width table it would print on top of it.

Monday's Greater Depth sheet has had that space taken off and is rebuilt; it now
ends 23mm short at the foot, which is a trim rather than a hole. One new test.
JavaScript 670 pass, 0 fail; Python 1665 pass, the ten known failures unchanged.

## 2026-09-12 The page is the work, not the furniture round it (4.2.158)

Daniel read three built packs together - the Monday rounding sheets, a Year 4
teeth sheet and a PSHE activity sheet - and everything he named was one kind of
fault. Not the questions, which he did not object to once. The furniture the page
puts round them.

**The question label was the clearest case.** It printed as a tinted chip with a
heavy navy rule down its left edge, and "(1a)" measures 8mm at body weight in a
column the page had reserved 9mm for, so the sheet came out `|(1a)6,734` with the
bracket touching the number being rounded. His instruction: "just be (1a), no
background, just blue text. then space, then question in black."

The chip is gone and the label is blue. The space needed more care than it looks.
Widening the column is not free - the approved partitioning page fits with about
3mm of spare width in the whole sheet, and a pair of four-part models side by side
has less than 4mm, so a 14mm gutter broke both and shrank every photograph on
every picture-led sheet (a picture is scaled by its width, so a narrower zone
makes it smaller, and three write-on photographs started fitting a page where two
is the honest ceiling). So the label is set one step smaller instead, at 10pt
against 12pt body, and the gutter moves 9mm to 10mm. Measured in Chrome: "(1)"
now leaves 5.3mm clear, "(1a)" 3.3mm, and "(10a)", the widest a real sheet
reaches, 1.2mm. The size is also right on its own terms, and the deck settled the
same point from the other end yesterday when it capped a slide's question number
under its question.

**One number, one colour, one size, everywhere.** Five classes print their own
label and all five moved together: the engine's own mark, a question set's
numbers, the comparing helpers, a method frame's id, a storyboard cell. The test
that holds them now checks the size too, which is what stops a label drifting
back to body size and filling its column again.

**Nothing is titled on a sheet any more.** The learning objective went on 8
September for three reasons and the lesson name had stayed behind with all three
still true: it is a heading a child holding the sheet in that lesson does not
need, it costs the top of the page, and it is teacher-written text of
unpredictable length in a band of fixed height. "How can being active help my
mind and body" wrapped onto a second line, ran out of the band and printed
straight through question 1 of the sheet below it. The first thing on the page is
now "Fluency".

**And the code is the level's own initials.** "Sheet A" in a bordered blue badge
became "B", "E" and "GD" in small grey text. A, B and C are an alphabet laid over
three levels, so the teacher had to remember which pile was which, and the paper
shared no vocabulary with the adaptation document that decides them. What a child
can read off it is unchanged, which was always the point of a code.

**Section headings stop at the end of their word.** "Fluency" was a tinted band
ruled to the right-hand margin - a stripe across the sheet announcing one word,
and three of them on a page reading as the page's main structure. The size was
already what he asked for, two points above the question text; the height was
padding, so it takes the cell step now rather than the card step.

**The lesson's method is a panel, and it had nowhere to be.** "Use these steps to
help you" plus six steps printed as a grey paragraph at the foot of the rounding
sheet because no worksheet helper drew criteria - the designer reached for
`instruction` and put newlines in it. There is a `steps` helper now, and it is the
deck's success-criteria panel to the hex: the pale green ground, the green rule,
the green tick heading, numbered green badges, one white card per step. A child
who followed those steps off the board finds the same object on their paper.

That is a producing fault as well as a missing helper, so the producing fault is
closed too. Across every saved spec, forty-four instructions carried more than one
line and not one of them was an instruction: they were criteria, or they were
questions with no number and nowhere to answer. An instruction of three lines or
more is now refused, with a message naming `steps` for the first case and
`questions`/`written-answers` for the second. Two lines is left alone, because a
direction genuinely in two parts reads as one direction. The approved partitioning
fixture carried one of these and has been converted rather than exempted.

The panel is not free and the guidance says so: six criteria stand about 55mm
against about 40mm as prose. The Monday Expected sheet is 10mm over with it, which
is the engine telling the truth - fewer criteria on the paper is a real answer,
because the board has all of them.

**A picture that fills a quarter of its box no longer draws the other three
quarters.** A card carrying nothing but a photograph is now as wide as the
photograph. A card with a title, caption, write line, tick box or join dot keeps
its column, because a row of artefacts a child compares has to line up. The room
that frees is the designer's to use, and the visual profile now says to put the
question in it: deadspace is earned only where the child writes in it.

**A word bank is one bank.** `chip-bank` could not carry a meaning, so a designer
with one word to gloss split the bank in two - `muscles` in a titled green bank,
`oxygen` alone in an untitled blue one floating higher up the page, one of the
two defined. A chip may now be written `{ word, meaning }` and the meaning prints
inside the chip under its word, at note size.

**The teeth sheet is the one repair that is not in the engine.** Daniel: the
letters "are now causing children to match and locate and look in different
places etc." The sheet lettered a tooth cutaway A, B and C and asked for the names
in a list underneath, on a page whose bottom half was empty. `label-diagram`
already draws a write-on line at the end of a leader, and `shared.md` already
chose between the two forms - but only on page cost, never on what each costs the
child. Writing on the picture is one place to look; a letter and a list is three
hops, and for the child who needs the sheet most that is where the task is lost.
So the default is now that the name goes on the picture when naming is the work.

It has an upstream half as well. That photograph arrived with `A`, `B` and `C`
generated into it, from a picture contract the lesson designer wrote, which left
`card-row` and a list as the only thing the sheet could do with it. A worksheet
picture a child labels is now requested plain: the callouts are the engine's to
draw. That rule is in the lesson-designer's own worksheet guidance and in the
visual profile beside "draw it, never generate a picture of it", which it always
followed from.

Fifteen new tests in one file, `page-furniture.test.js`, which is the place a
later change that puts any of this back fails. JavaScript: 669 pass, 0 fail.
Python: 1665 pass, the ten known failures unchanged.

## 2026-09-12 A maths sheet is the lesson continued (4.2.157)

Daniel gave the context rather than a fault: in his maths lessons the worksheet is not a nice-to-have extra, it is what children do at their tables straight after the teaching. He was explicit that this must not enter the plugin as his routine ("i just didn't want 'Daniel does X so do Y'"), and equally explicit that the deck must still carry the whole lesson on its own.

**Traced before writing anything, and there is a real case.** Four built maths sheets, three faithful to their decks, one not. "Find 10 and 100 more or less" modelled the move by shifting counters on a place-value chart and guided the class on the same chart; its sheet had no chart anywhere and opened with circle-the-answer, a data table and an inequality with boxes. The slide half of that same fault was repaired days ago, in `preferences.md` under `Independent work means the child does the thinking`; the worksheet half was never covered. The three good sheets were good by the designer's judgement: the nearest rule, in the generated-worksheet component, is a general one about changing instances rather than the medium.

**The obvious repair was wrong and he said so.** Put to him as "the sheet should meet children in the same terms", the answer was: "that could also be fine, maybe not for below children, but expected might have example from the board, then move on to different context, or greater depth might start straight form different context". Translation cost is a real demand, not a defect. It belongs where the method is secure.

So the rule is graded by tier rather than absolute. Below opens and stays in the board's form. Expected opens there and then moves into a fresh context. Greater Depth may open straight into one, because for a secure child recognising the same maths somewhere unfamiliar IS the extra demand and making them work the board's version first spends the sheet.

**It is written from WHEN the sheet is worked, not from where anyone sits.** That is what makes it general: a maths sheet is worked minutes after the teaching by a child still holding one method, one representation and one set of criteria, in any classroom. The section names no surface and no seating, `subject-maths.md`'s existing position that grouping and response surfaces belong to the teacher is untouched, and the paragraph opens by restating that the deck teaches the lesson alone and printing nothing loses none of it. A test asserts all three.

**And the fault has a second repair, which is the one he actually wanted.** On that deck: "I wish it showed that 100 more less table as an apply thing in the slides or something." The table was a good idea in the wrong place. So the rule runs both ways: where a sheet moves into a form the lesson never used, ask whether the lesson should have met it once first, as a practise or apply beat after the cycles. That beat only became placeable in 4.2.155, two commits ago.

The reviewer's check was one line, `worksheet methods against lesson methods`, and it passed the chartless sheet. It now says to read the opening questions of each tier against the board, and to say when the lesson is the thing that should change.

Ten new tests. Full run: 1666 pass, the nine known failures unchanged; JavaScript 604 pass, 0 fail.

## 2026-09-12 The question number is a marker, not part of the question (4.2.156)

Daniel, reading the rebuilt rounding deck: "Is it possible to make numbered questions font size 24, aligned left, which means more space for question/ answer text box and answer centred aligned."

**The number used to grow with the question.** On a two-question check filling a whole zone that meant "(1)" printed at 40pt beside a 40pt "67", the number as loud as the thing being rounded. Worse, the label column is priced from the label, so the wider the number the less width the words had: the number was taking room from the question it was only there to label.

It is now set once at 24pt and pinned to the card's left edge. The one bound is that it never exceeds the question's own font, because a long set in a tight zone drives the question below 24 and a number bigger than its question reads as the point of the card.

**And the width that frees goes to the words.** The question and its revealed answer now sit centred in the box that is left, rather than pooling against the left edge of a card sized to the longest question in the set.

**The limit, found in the render rather than in argument.** Centring shares a card's spare width, and a question that wraps has already spent it: `2,649 rounds to 2,650 to the nearest / 10.` came out with the tail of the sentence stranded in the middle of the card. So a question that wraps keeps its left edge, and only a question that fits on one line is centred.

Seven new tests. JavaScript suite: 604 pass, 0 fail. The Monday maths deck is rebuilt and back on the school drive.

## 2026-09-12 The lesson is not limited to its cycles (4.2.155)

Asked whether every maths lesson would now be my turn, our turn, your turn and nothing else, Daniel answered: "i still want good pedgagogical designs, like what weve been doing, i dont want to limit it to starter, answers, key vocab, mtotyt cycles. If it thinks teach in a place do it, if it thinks seperate key vocab do it. if it thinks apply now, or problem solving now do it, etc."

**He was reading the change correctly.** 4.2.154 tightened the Skill-based sequence into cycles and left no room for anything else: the route had four beat kinds, and the check walked the whole sequence as cycles, so a Teach beat in a maths lesson had nowhere to stand and a problem-solving beat had nowhere to stand either. Reasoning and problem solving had to arrive inside the last Your Turn's task or as the earned Apply ending. That is also why a maths lesson could finish with neither and still look complete: nothing in the plan ever made the designer decide about them.

**The route now carries `teach` and `practise` as well.** They are the knowledge route's own kinds with the same fields, so the slide designer, the templates and the script requirement already handle them, and each sits where this lesson earns it rather than at a fixed point, as many times as the lesson needs. Vocabulary was already free in this way, since `vocabularyIntroductions` names the unit each word follows.

**What stays fixed is the cycle, and only the cycle.** Between a My Turn and its Your Turn nothing intervenes, because a class modelled to and then taken somewhere else arrives at its check having lost the thread. Everything else is placement. A concept's cycles still run together and in the declared order, and coming back to a concept after moving on is refused with a message pointing at the practise beat, which is what mixing two taught concepts actually is.

**Two boundaries were needed, or the new kinds eat the old ones.** A Teach beat carries knowledge the method leans on and does not perform, what a kilogram is, that unlabelled ticks are worth the same, why anyone rounds; the moment a beat shows how the method is carried out it is a My Turn and owes the rest of its cycle, and the test is whether a child could attempt a question from having watched. Between `prepare` and `teach`, ask whether anything has to survive the lesson: a preparation beat is spent once the model it set up has run, which is why it has no takeaway field and a Teach beat does.

**And the decision he asked for.** The completion pass now has to write one line in the closing decisions naming the reasoning or problem-solving shape the lesson designed and where it sits, or why the objective does not carry one. Same reasoning as the playful-opportunity line added this morning: a question only asked at the end is a formality, because everything is written and changing nothing is free; a line that has to be written is a decision. `subject-maths.md` names which beat each of the three demands lives in, and records both failure directions, the wing bolted on at the end and the one skipped because the cycles filled the time.

Seventeen new tests. Full run: 1656 pass, the nine known failures unchanged; JavaScript 597 pass, 0 fail.

## 2026-09-12 Every cycle ends with its own Your Turn (4.2.154)

Daniel, reading the rounding deck: "Ive noticed that maths slides like this one are a different sequence to what Im used to ... It used to be my turn, one or two examples, our turn, one example mainly but could be 2, your turn, quick fire practise 1-4 questions. Then next concept my turn, our turn, your turn same thing." The deck he was holding models rounding to 10 on two numbers, guides one, then moves to hundreds, then to thousands, and the first answer a child writes alone comes near the end on a mixed set.

**The route file had authorised it in so many words.** A Skill-based concept ran "one or more My Turn plus Our Turn cycles, then exactly one Your Turn", so three cycles and one block of practice at the end was a legal shape, and the validator enforced exactly that. `preferences.md` said the opposite in the same repository, that skill lessons carry practice as "the guided and independent practice that follows each modelled move, never as one block of practice at the end of several models", and the two had sat side by side long enough that the code, which is the half that actually decides, won every time.

**The cost is not tidiness.** The first move goes from one demonstration and one guided question straight into independent work twenty minutes and two more moves later, and nobody finds out whether the class could do it until the evidence is mixed with two other things. The Your Turn is the cheapest check in the lesson and it was being spent once.

So the grammar now reads: a concept runs one or more cycles, and a cycle is My Turn, an optional Our Turn, then its own Your Turn. Both gates enforce it, `validate-lesson-design.py` and `lesson-design-scaffold.py`, and the guard against two My Turn units in a row is unchanged, so the deck's original fault is still refused with its own message rather than swallowed by this one.

**The bit that needed his answer, and got it.** The risk in the change is a bridging cycle: the small-number way in that `subject-maths.md` asks for, 43 and 45 before 3,462, which exists to be left behind. Requiring a Your Turn there could put four token questions on 2-digit numbers into a lesson about 4-digit ones. He settled it: "Even small scale, if we're startring small then scaling, can still do it, maybe your turn just has less questions etc." So the rule ships with its own sizing, in the route file and in the validator's error text: the check is sized to the cycle, a bridging cycle earns two questions rather than none, and the substantial independent practice is still the last cycle's Your Turn, which is where the blocked-then-mixed rule already landed.

**The derived shortcut finally has a home.** The rounding deck's "Why is it always the digit to the right?" beat was written as a My Turn, which is what made it look like a fourth cycle. Nothing is modelled there: the class looks back at cycles they have already run. It is now a `prepare` unit with `mode: pattern-investigation`, named in `subject-maths.md` beside the paragraph that asks for the beat, and a preparation unit may sit between cycles or close a concept.

**Also fixed while in the builder.** A slide whose script is written under `notes` now stops the build and names `speakerNotes`. The maths deck shipped with every teaching script absent because of that one key, the same fault as 6 September, and it had never been made impossible. The message says the text itself is fine, so the repair is a rename rather than a rewrite of good teaching.

Sixteen new tests across the two suites, and the fixtures that encoded the old shape now build two full cycles. Full run: 1639 pass, the nine known failures unchanged; the JavaScript suite is 597 pass, 0 fail, which includes a doc claim that had drifted from a preferences sentence I reworded earlier today.

## 2026-09-12 One beat holding two tasks (4.2.153)

Daniel, on slide 9 of the rounding deck: "id want things on slide 9 to be their own thing, why did this happen?" He was right that it is two things. The slide carries a claim to judge (`3,448 rounds to 3,500 to the nearest 100 because its ones digit is 8. Is this correct? Explain using the line.`) on one number line, and a separate rounding question (`Round 3,996 to the nearest 100.`) on a second. Two tasks, two lines, two different bits of thinking: spotting a wrong rule, and rounding across a thousand. It is also the busiest board in the deck.

**It happened in the design, and every downstream rule behaved correctly.** The Lesson Designer wrote both tasks into one Our Turn beat's `example` field, separated by a blank line. The Slide Designer then did exactly what it must: copy source-authored wording exactly, one beat to one slide. It may not decide that half of a source string is a different beat, because that is a pedagogical decision and is not its to make. So nothing between the design and the class could have repaired it.

**Nothing caught it either, and the tell was sitting in the design's own fields.** That beat's `unlocks` reads `They can reject the wrong-column rule and cross a thousand`, which is two gains joined by an `and`. Its `thinking` reads `Which neighbouring hundred is closer to the original number?`, which covers the rounding question and not the claim at all. Both are countable and neither is read for this. The 4.2.145 repair covers the neighbouring case, a bundled pair of values acted on the same way (`Round 43 and 45`), and does not reach two different tasks in one beat.

So the completion pass gains the inverse of the `Same job twice` check added earlier today, and it hides better, because a beat holding two tasks looks full rather than wrong. Read each beat's `unlocks` and count the gains; read its `thinking` and ask whether one thought covers everything the beat asks. Two gains, or a thought that fits only half, is two beats, and they are split at the design with a `thinking` and an `unlocks` each. The limit is a genuine single task with parts, a claim and the explanation of that same claim, a calculation and the sentence about it, which stays one beat: the question is whether the second thing is another way into the same thought or a different thought.

**Also from the same read, and his own edit rather than the engine's.** He had changed step 5 of the success criteria to `Round to the nearest ten.` and then found it was riding on the nearest-100 slides too, where it names the wrong place value and contradicts step 1 of its own panel (`Read the question: 10s or 100s?`). Both that and the slide 9 split are being made directly in the file on his school drive, since he has hand-edited it since it was built and that copy is the authority.

Four new tests. Full run: 1626 pass, the nine known failures unchanged.

## 2026-09-12 A light line competes for the board (4.2.152)

Daniel: "humour can go on slides too yaknow, it doesnt have to live in speaker notes, is that in plugin?" It was, in three places: §4 says a light line has no fixed home and may sit on the slide where children read it themselves, the designer's completion pass says the same, and §16B is a worked example of one on a board. Nothing needed adding there.

**What was wrong is that two rules cancelled each other.** The Teach-slide ceiling recorded in 4.2.150 is stated in pieces, so a board already holding four things has no room for a fifth, and a light line arriving last goes to the script by default. That is what happened on the science deck: the line went into the pulp script because I had told the worker page 9 was at its ceiling, and neither of us noticed it had been demoted for a reason that has nothing to do with where it belonged. The calibration now says a light line competes here like anything else: if it belongs on the board it is one of the four, and something else moves to the script or to its own slide to make room. It does not lose automatically because it arrived last.

**And the appetite has changed, while the bar has not.** "now slides are simple and better, a bit of humour would make me like them more but has to be funny". Both halves are instructions and the second is the one a model drops, so §4 carries them together. A lean board has room a crowded one never had, and a light line lands differently on it: on a wall of text it is one more thing to read, and on a slide holding four things it is the one a child reads twice. So go back to the material and through the six routes properly. But the bar does not move with the appetite, because what he wants more of is the line with a turn in it, and a flat line is not a smaller version of that. Looking harder and accepting less are the same instruction: go through the routes, and if none hands you a moment that does something unexpected, write none and mean it.

Four new tests. Full run: 1622 pass, the nine known failures unchanged. The three decks are not rebuilt for this: the science lesson's material honestly offered nothing once the one candidate was refused for landing in the `did that hurt` register, and PSHE and maths are deliberately straight.

## 2026-09-12 Teaching that will not fit gets a slide, and a light line has a turn in it (4.2.151)

Two repairs from Daniel's reading of what I did with his last two notes. Both are corrections to guidance I wrote earlier the same day.

**Over-full slides: I offered one repair when there are two.** 4.2.150 recorded his Teach-slide calibration and ended "the repair is to move the weakest into the script rather than to shorten all of them". He asked the obvious question back: "they were too much sure, if theyre important could they have gone to more slides?" `Slide Philosophy` has said so all along, that a slide carrying two distinct teaching points is two slides wearing one and spending the extra slide is the right trade, and I did not reach for it. The repair now names both and the test between them: elaboration, an example of something already stated, a caveat the teacher gives in a breath, goes to the script; **teaching** gets its own slide. And the hard case, because it is the one I got wrong: a line the final task needs is teaching, always, and may never go to the script. A PSHE slide was trimmed by cutting `When you rest, it all settles down again` while that lesson's own closing answer is `After resting, the muscles need less extra oxygen, so breathing can ease again`, so the only place the idea was taught came off the board to make room. Reach for the second slide first: the deck is allowed to be longer and the board is not. That slide is being restored as its own beat.

**A light line has a turn in it.** §4 is good on where opportunities come from and had nothing on how to tell a found one from a plain fact delivered wryly, which is the commonest failure and is what happened. A teeth deck got `The softest part of the tooth is the one part that never does any of the biting. It sits in the middle while enamel and dentine do all the hard work.` Daniel: "you call that humour?" Set beside the line he did like, from the same subject, `Thankfully, your teeth have divided up the jobs rather than all applying for the same one`, the difference is exact: teeth applying for jobs is a small absurd picture that arrives and is gone, and `thankfully` is a real person reacting, where the second states an arrangement and leaves the wryness to the reader's tone. The test is now in §4 and it is sayable: read it aloud and find the moment where the sentence does something you did not expect. No such moment means you have written a sentence about the content, which is fine, and it is not a light line. The added line is being removed, and none is the expected answer for that lesson.

**What the three decks got right on humour, so it is not read as a general absence.** PSHE and maths were left straight and Daniel has confirmed both: "i also wasnt humour in pshe slides too, never maths". The material in the PSHE lesson is children's own bodies and their mental health, which is the last place a line should land. So of the three decks the honest count is one candidate, in one script, now withdrawn as not good enough. 4.2.150's repair stands and is unaffected: the decision is written down in the closing decisions either way, and `none` written down is the answer this rule expects most of the time.

Seven new tests. Full run: 1618 pass, the nine known failures unchanged.

## 2026-09-12 How much a Teach slide holds, and the joke that was never refused (4.2.150)

Daniel read the three rebuilt decks. The science and PSHE teaching is now right; what came back is calibration, one ordering fault and one absence.

**The amount a Teach slide holds now has an anchor.** The Pride Lessons are a maths My Turn and a science practice slide, both of them a question and a tool, and a Teach slide is the other case with nothing to measure against, which is how a deck ends up either a slogan or a wall. His verdicts on real boards are now in `preferences.md` beside the Pride Lessons: two science slides carrying a picture, a landed sentence, two short lines and the sticky fact are **right, and one more thing would be too much**; a PSHE slide with a lead, a definition, two side-by-side cards, a closing line and two drawings is **slightly over and might be fine**; a PSHE slide with a picture, two teaching lines, an honesty pair, a safety line and the sticky is **over**. So the working ceiling is about four pieces of text beside the picture, five is the top of the range and wants a reason, six is over however true each line is, and the repair is to move the weakest into the script rather than shorten all of them. Recorded with the thing it is not: the slide he called right carries one long sentence across its full width and the slide he called over carries seven short ones, so this is not a word count.

**The sentence about the thing on the board comes first.** The chip slide read `Teeth do get chipped: a fall in the playground, or biting down on something hard.` and then `This tooth has lost a piece of enamel.` His order is the reverse, and the reason is that the class is looking at the tooth, so the first line they read should be about the tooth. General-first makes a child hold an abstract sentence for a beat before finding out what it is about, which is the one-slide version of a deck that defines before it shows. Now in `teacher-voice.md`, bounded against the slide whose general statement is the teaching and whose example illustrates it, where the statement rightly leads.

**No light moment anywhere in three decks, and the routing is why.** §4 is well written and asks the right question of the lesson's own material. It is asked at the completion pass, which is correct in principle, because asked of each sentence while writing the answer is always no. But the completion pass is where everything is already written and the cheapest answer is to change nothing, so `none` had become a default that never had to be defended: it won three times running, including on a teeth lesson whose tooth types Daniel had himself said hand a line over. The repair is not a new rule or a quota. The answer is now written down, one line, in the walk-through's closing decisions, naming what the material offered and what was done with it. A line you have to write is a decision; a question you only have to ask is a formality. `None` stays common and stays right; it is now an answer rather than a silence.

**Two faults that were mine rather than the plugin's**, recorded so the next reader does not go hunting for a rule. `Draw this table in your book` was written by a repair agent I briefed, not by the engine: `preferences.md` already says generated material states the learning action without naming a recording surface, and the composition playbook says the same to the Slide Designer. And the maths deck was unchanged because its repair predates 4.2.145; the bundled My Turn pair and the teacher's guiding questions on the board are both fixed in the engine and that deck simply had not been rebuilt since.

Nine new tests. Full run: 1614 pass, the nine known failures unchanged.

## 2026-09-12 The teaching is pieces, not a block (4.2.148)

Follow-on to 4.2.146, which put the teaching back on the Teach board and left it looking like a wall. Daniel, on the rebuilt science deck: "I see the teaching finally. It's fine, I just need it visually better. Look at slide 3, teaching is all together in one box as one big black text ... teaching doesnt have to be all together grouped all black. paragraph breaks, different places, different colours etc."

He built three mock-ups of the same slide, and two of them use no colour at all. One lifts the first line to a full-width statement across the top and puts the rest beside the picture. One places each line against what it is about: one above the figure, one in a card beside it, one underneath it. The third keeps the current arrangement and gives the three lines real space inside their card. So the repair is composition, and it goes to the composition playbook: the explanation's lines are composed as separate pieces, never concatenated into one black card because they arrived in one field, with the three shapes named and the choice made by what each line is about. A line describing the whole thing goes above or across, a line about one part sits next to that part, a line about what happens next sits under.

**The colour half was settled the same hour.** Daniel: "Orange was fine to break up black teach, we should do that." Orange turns out to be free on a Teach slide: its existing text job, `<<supplied-orange>>`, tints a value a question hands the child to work from, which belongs to a slide that asks something, and a Teach slide is not asking, so the two never meet. One line of an explanation may take it, and the test is which line you would say louder. Three bounds carry more weight than the permission: one line per slide, or the colour separates nothing and the wall is in two shades; not on every Teach slide, because the same line going orange every time is a tic rather than a voice, and on a slide whose first line has already been lifted to full width the colour would be a second device doing one job; and never the sticky line, which is purple because it is the one to keep, nor a question, which is blue. Layout stays the first reach and the colour is what you add when layout has not done it. A fourth bound arrived from the first deck built under the rule: orange never goes on a line carrying a taught vocabulary term. A PSHE slide put a whole explanation line in orange around the green word `Oxygen`, and the term stopped reading as the word children were taught and read as one more colour in a scheme. Vocabulary green marks every occurrence of a term wherever a child reads it, so the term wins and the line loses: choose another line, or leave them all black when every line carries one. Outside that one case the profile's existing line is unchanged: prominence on a black explanatory line is size, position and spacing.

**What the original reasoning was, kept because it is why the bounds exist.** His mock-ups put one teaching line in orange, and the semantic grammar has no colour free for it: blue is a question to children and nothing else, green is answers and taught vocabulary, purple is sticky knowledge, red is a failed state or a safety warning, and orange already tints a supplied value the question hands the child. `teacher-slide-visual-profile.md` also carries its own line that size, position and spacing rather than colour do this job for a black explanatory line, and the grammar it belongs to was built over several rounds of his own feedback, including the deck where four verbs went out in question blue and left the actual question with nothing to lift it. Spending a colour is his call and it is with him. Until then the separation is layout.

Four new tests. Full run: 1605 pass, the nine known failures unchanged. The three decks are being recomposed against this rule as resource repairs.

## 2026-09-12 The class is inside the lesson (4.2.147)

The rest of Daniel's 12 September notes on the first three decks, after the four repaired in 4.2.146. Six repairs. What they have in common is that the lesson is correct and the child is standing outside it.

**A case arrives with the context that makes it make sense.** The teeth deck taught enamel, dentine and pulp, then showed a chipped tooth and asked which layer was uncovered, having never said that teeth chip, why they chip, or that this happens to real people. His words: "abstract, random or sudden ... there should have been context about teeth chipping, or why it happens, or that it can happen and how." The beat is right and the cost is not confusion, because the question is answerable either way; it is that the child has nothing to attach it to, so the answer is a guess about a diagram rather than a thought about a tooth. One sentence before the case is usually the whole repair. The test: could a child say why they are being shown this, before they are asked the question about it?

**Put the child inside the situation, then ask them.** `It's a wet break indoors. Suggest a safe way to be active.` is a statement of fact about nobody followed by a directive about a task. His version: `Imagine it's wet break time.` / `What could you do to still be active?` / `Which parts of your body would move and how?` The word doing the work is `Imagine`, which is an invitation rather than a report, and the second line is a question to the child rather than an instruction about a task. The two colours follow from the two jobs and the existing rule already owns them. The same holds for an invented person or class: `A class already dances most days` is a fact about strangers, and his alternatives are all somebody a child can picture being. The test is whether a child could be in it.

**Say what to do, and where the way in is.** `Name A, B and C.` is three words, exact, and leaves a stuck child nothing to start on. His version names the action, what goes in it and where to get it: `Label each letter with the name of that layer. Use the word bank to help you.` So when an instruction is the only thing between a child and a blank page, name the thing they write and the support that is on the slide. Bounded against the prompt whose difficulty is the point, where pointing at a word bank would hand it over.

**When children write onto or beside a figure, the instruction goes on top and the figure sits centred below.** His layout note, and the reason is the writing room: a diagram squeezed into half the width has its labels running to the edge of their column, and the space a child needs is the space the instruction is standing in. Across the top, full width beneath, centred, and the margins either side become the answer space. Scoped to slides where they write on or beside the figure, not every slide with a picture on it.

**A word the teaching leans on is taught, or the teacher teaches it instead.** The vocabulary selection test asks whether a word earns a card. This runs the other way: read the finished teaching and find the words a child must already hold for a sentence to land. `Balancing and controlled movement practise balance and coordination` beside `helps heart and lung fitness and strengthens muscles and bones` leaves a child with nothing, and the teacher spends the beat explaining vocabulary rather than landing the teaching. Three repairs in order: plainer words the class already has, then teaching the word in that beat, then a card, because the set is capped at five and a card is the expensive answer.

**Two beats doing the same job.** `From the inside out` asked the class to say the three layers in order; `Name the layers` asked them to name the three layers on a diagram. Different headings, one demand, twice. The completion pass now names what each beat asks a child to do in its own words rather than by its label, and two that come out the same sentence are one beat and a repeat. Held apart from 4.2.132's second instance of an idea, which is right and wanted when the evidence changes.

**And one existing rule that was missed rather than absent.** A slide of four true black sentences: "its all black too. Could have used little images or the sticky knowledge star thing if they are sticky knowledge." The no-flat-colour rule was already there and the available repair was not, so it now names it: mark a sticky fact as one and it takes the star treatment, or give a line a small image; the wall is the sameness, not the length.

**And a bound added the same hour, on Daniel's question.** "Am I going to see `imagine` all the time now." A fair worry: it is the obvious opener, it works, and a model reaches for the concrete word it was shown. The test is whether a child could be in it, not the word, and the bound borrows §4's own framing for a light line: a deck that opens the same door every time has stopped having a voice and started having a habit, which children hear coming. Four other routes are named so there is somewhere else to go, and the limit at the other end is that a real event, place or person is stated plainly, because `Imagine` would be a lie about it.

Sixteen new tests. Full run: 1600 pass; the five pre-existing CRLF subtest failures and the four from 4.2.144's model and effort changes, both unchanged by this work.

## 2026-09-12 The board teaches again, and a criterion is an instruction (4.2.146)

Daniel read the first three decks Codex built on the new structure: `Round to the nearest 10 and 100`, `Name the layers of teeth` and `How can being active help my mind and body`. His verdict on the structure was that it worked. The journeys are real and specific, the headings name moves, the as-and-when vocabulary lands where it should (the teeth deck teaches enamel on the cutaway, cards enamel, then asks which arrow points to it, three times over), and both maths rules from 4.2.141 fired on their first run: the lesson opens on 43 and 45, and slide 10 is `Why does the next digit help?`, the shortcut derived after the lines have done the work. Four faults in what reached the board.

**The Teach board stopped teaching, and that one is mine.** Every Teach beat in the teeth deck wrote `explanation: null`, so a teach slide was a picture, a heading and one sticky sentence. Daniel: "if the teacher wasn't confident what enamel was, but didn't use the speaker notes, they'd find it hard to actually teach the children anything apart from 'this is where the enamel is on the tooth'. Especially when children won't know this, they need to learn what enamel is, why it's there, how it relates to them." He likes the simplicity and wants one more thing on it that actually teaches. The cause is 4.2.138: repairing a slide that said one sentence three ways, I flipped this field's default from write-it-unless to null-when, and wrote that null is "the shape of the pride lessons". Saying one thing three ways and saying what it is, why it is there and what it does are different things, and the repair took the second with the first. The default is to write it again, `null` is now the exception a designer defends, and the test is stated as his: a teacher who does not already know this content, with the notes closed, has to be able to teach from the board. The same failure from the other end, the PSHE slide that put `You can pass without giving a reason` up and left what pass means in the script, is kept beside it.

**And no Teach slide in any deck asked the class anything.** `keyQuestions: []` in all four decks built this week, every beat. The route file told the designer to "account for the Do that already follows before adding another response demand", and a Do always follows, so the field was dead on arrival. A key question is not a response demand competing with the Do; it is what makes children look at the thing while the teaching is happening rather than wait for it to end. Most Teach beats earn one.

**A criterion has to be runnable by the weakest child in the room.** `Find the neighbouring multiples.` is four words, imperative, specific and actionable, and passes every rule in §10. Daniel: "doesn't help dumb kids." His own version of the same step is `Find the 10s or 100s each side of your number.`, longer and plainer. So §10 gains the test that the existing rules do not make: short, imperative and actionable is the shape of a step, not the test of one, and the test is reading it as an instruction to the child who is stuck, in words they already hold. Separately, `Already a multiple? Keep it and stop.` is not part of running the method, so as step 2 of six it stops every child on every question to rule out a case most of them do not have; his answer was a star note under the steps, and that is now the rule, with every-time conditions keeping their existing inline home.

**The panel rode on the answer slides.** Thirteen of sixteen slides in the maths deck carried the same six-step panel, including all four checks, where it takes a third of the board beside answers nobody is checking it against. Corrected to that boundary only: on teaching and practice slides the panel is right and is what the criteria are for, which is Daniel's own reading and narrower than my first claim.

**Question labels: the starter keeps them everywhere, and after that they are maths only.** Corrected within the hour on Daniel's own reading: "I didnt mean starters, starters should still have them." A starter is the matching case in every lesson, whatever the subject: several short questions answered in books and checked together off one answer slide, where `number three` has to mean one thing to twenty-eight children. After the starter the subjects part, and the original finding stands.

**The rest of the labels are maths only on slides, from today.** The science deck numbered its three starter questions and printed `(1) Name A, B and C.` on a slide holding one instruction. Daniel: "with question numbers, lets just leave that for maths. We didnt need question numbers anywhere here (this is a change in my teaching from the github master version days)." Slides outside maths now carry none; worksheets, stick-ins and adaptation sheets keep theirs in every subject, because the answer key is a separate sheet and has to match, which is my boundary rather than his and is the line to move if it is wrong.

Not repaired here, and named for the next pass: the chipped tooth arrives with no context about teeth chipping at all; `From the inside out` and `Name the layers` are close to the same beat twice; `Name A, B and C` should be `Label each letter with the name of that layer` with a word bank, and that slide wants the instruction on top with the picture centred below so there is room to write beside each label; the PSHE deck's task framing (`It's a wet break indoors. Suggest a safe way to be active.`) is not §6 wording; its slide 9 is an all-black text block that could carry the sticky star or small images; its `A class already dances most days` needs to be someone a child can imagine being (`Imagine a class that danced most days`); and words like balancing, coordination and fitness are doing vocabulary work without being vocabulary. Thirteen new tests. Full run: 1584 pass; the five pre-existing CRLF subtest failures, and four more from 4.2.144's model and effort changes that were left failing in that commit.

## 2026-09-12 The board shows the question, not the questions the teacher asks (4.2.145)

Three flags from Daniel on the Year 4 maths deck `Round to the nearest 10 and 100`, built that morning and read before teaching.

**The deck printed the day it was built.** Slide 1 carried `Saturday 12 September 2026` in the instruction box, directly under the starter header's own empty `Date` label, and `lesson.json` carried the same string as a top-level `date` field the builder has never read. It was in five earlier decks too, every one of them maths or science. Nothing asked for it: the header mode is documented as a `Date placeholder` and the builder writes the literal word `Date` for a class to copy the day beside. What the Slide Designer had to go on was `carries date + LO header` in one file and `Date placeholder` in another, and it filled the blank. A deck is built days before it is taught and taught again the year after, so a real date in a spec is wrong on the board on the day, which makes this an invariant rather than a preference. `templates.md` section 1.4 now states it in full, the Lesson Designer's two mentions say `a blank Date label`, and the build refuses any spec carrying the build date anywhere in it. Only the day the build runs is matched, so a year on a timeline, a date in a source and a date inside a word problem are untouched: a historical date cannot collide with today.

**The Our Turn slides printed the questions the teacher was going to ask.** Slide 7 showed `Which multiples sit beside 3,498?`, `Which is nearer?` and `How far is 3,400 from itself?` across the board, and slide 9 added `Where is halfway?` and `Which distance is smaller?` beside the task. Daniel wanted the label, the question, the success criteria and the number line, and nothing else. The path was exact. `content.guidedQuestions` was defined as `the exact first question the teacher asks`, which is teacher talk, and `design-review-packet.py` listed it in `CHILD_FACING_CONTENT_KEYS`, so the Slide Designer received it as content it may not remove and put it on the board. The Lesson Designer file already said the Our Turn script is the guided questions, and in this run every one of them was in the script word for word, so the field was a second home for something the script already carried, and the second home leaked. The field is retired: the guiding questions live in `speakerNotes.script`, the validator refuses `guidedQuestions` and now also refuses an Our Turn script that asks the class nothing, so the obligation that the beat guides is still enforced rather than left to prose. The boundary is in the Our Turn section: `Which is nearer?` over a number line is the teacher's next question and is spoken, while `Is this correct? Explain using the line.` is the work itself and belongs in `example` beside the claim it judges. That is Daniel's own line through slide 9, where he kept the first and refused the other two.

**The My Turn slides bundled two roundings into one sentence.** `Round 43 and 45 to the nearest 10.`, then `Round 3,462 and 3,465 to the nearest 10.`, then `Round 3,462 and 3,450 to the nearest 100.`, on all three My Turn beats, while the Our Turn beats in the same lesson wrote theirs on separate lines (`Round to the nearest 10:` then `3,498` then `3,400`). Nothing in the package chose between the two shapes; the rule that several examples of one move share a unit says nothing about how they are written down. It does now: each case is its own question on its own line, under a shared instruction line where they share one. The exception is a pair genuinely acted on together, where the two values are the question (`Put 4,090 and 4,009 in order.`), and the test is whether each value has an answer of its own.

**Acceptance limits.** The date is deterministic and tested against the failing deck, a cleaned deck, a historical date and the same day a year ago. The retired field is deterministic and tested. The residual path on the prompts is the Lesson Designer writing them into `content.example` instead, which is judgement and guidance only; the one-case-per-line rule is judgement throughout, because no check can tell `Round 43 and 45` from `Put 4,090 and 4,009 in order` without reading the maths. `content.keyQuestions` on Teach beats is the same field class and was deliberately left alone: it was not flagged, and a key question on the board is often a content beat's focus. No lesson has been rebuilt against any of this. The rerun to do first is this same lesson, checking slide 1 for a date, slides 5, 7 and 9 for spoken prompts, and slides 6 and 8 for two roundings on one line.


## 2026-09-11 Vocabulary goes back to as-and-when, and the teeth fault keeps its real repair (4.2.143)

Reverting my own change from 4.2.138. Daniel asked what had happened to vocabulary and then said it plainly: "I like it when lesson designer decides which slides it is before, so vocab is taught when children need it, not at start and have to wait ages before they need it, even if it splits vocab up."

**The misreading.** 4.2.138 collapsed vocabulary to one slide holding every word, on the memory of his 30 August position and the evidence of the teeth deck. His 30 August position was against **a run of single-word slides at the open of a lesson**, which is a different thing from grouped introductions placed at their points of need, and `vocabularyIntroductions` was built on 5 September precisely to tell those two apart. The composition playbook had said so in as many words the whole time ("that is a reason to question a design that plans four separate introductions before anything has happened, not a reason to override one that introduces two words at the point they are used"), and I read past it. Restored: one entry per moment, as many as the lesson needs, the count a teaching decision with no default, in `preferences.md`, the Lesson Designer, the Slide Designer, the composition playbook, the output template, the scaffold reference and the validator, which no longer caps the count.

**What was actually wrong with the teeth deck, which is not about count.** It showed two teeth, asked what was different about their biting edges, and then went straight to a vocabulary slide defining incisors as the front teeth with thin edges that cut, before anybody had answered. That fault survives at any number of vocabulary slides and is now a third boundary beside the two the section already had (not after a word's last use; not handing over what an exploration exists to discover): a card must not answer the question the very next beat is about to ask, so each introduction is read against the beat that follows it as well as the beat that needs the word. The Lesson Designer carries the same test.

**Kept from the two releases in between.** Every entry still requires its own `script` (4.2.140), which is the repair for a class meeting `belief` and `nativity` with the teacher holding nothing, and it is per slide rather than per lesson because each entry is a slide a teacher stands in front of. The RE deck's real vocabulary faults were the empty notes and the placement, not the number of slides.

Four tests changed to match, one added for a second entry's script, and the restored placement suite keeps the timings a lesson has to be able to express. Full run: 1575 pass, the same five pre-existing CRLF subtest failures.

## 2026-09-11 The class builds the set, and one case is not the group (4.2.142)

The geography half of the comparison, and the first trial run from a real long-term-plan row rather than a bare objective. `To describe how Indigenous peoples use the Amazon rainforest`, lesson 3 of the Year 4 rainforest unit, designed from Daniel's own Kapow plan row and read against the same row written up by an assistant knowing only the voice guide.

**The plugin's was the better lesson, and it did the thing the role file asks of a supplied plan.** It judged the row rather than reproducing it: dropped Kapow's mind map (`a mind map records what confident children have already said out loud; it is not a beat where every child thinks`), dropped the building-guessing opener for a photograph of a real community and a vote every child commits to, and left the 2012/2019 deforestation maps to lesson 4 with a flag to the teacher rather than silently. It caught a factual error in the plan itself, that Indigenous peoples use `mineral rich soil` for crops, which is backwards for most of the Amazon, and turned the correction into teaching: the garden is beside the river because the flood leaves fresh mud, which is also the second reason the houses sit in a line. Its best beat is the strongest in any trial so far: every child holds a printed map of the basin with no roads on it and tries to draw a route from village A to village B, and slide 5 only has to name what they failed to find. Its ending is the first unprompted use of the transfer rule from 4.2.139 (take the trees away, go down your own three sentences, which of them still works), and it opens lesson 4 without spending it.

**Two things the other lesson had.**

*It has the class build the set before the lesson fills it.* `Imagine this is your home. What would you need every day?` produces water, food, shelter, transport, medicine, and every chunk after it answers the class's own list. The plugin settled its own two categories (the river, then the forest) and handed them over, which is a teacher going through their own list however well each chunk is taught. Nothing in the plugin said a set could be built this way; the nearest thing, the history file's speculation rule, is about the opening of a history lesson rather than the categories a content lesson supplies. Now in the rhythm section, with the limit that decides whether it fires at all: it works when the set comes from being a person (needs, uses, reasons, the jobs a familiar thing does) and fails when the set is the knowledge itself, where asking for it is guessing dressed as elicitation and the wrong list is what the class remembers. No child generates the four layers of a rainforest. The test is to answer your own question as a nine-year-old who has not met the topic.

*It says `Different Indigenous communities live in different ways`, out loud.* The plugin's lesson teaches one riverside community well and never says it, so a child leaves holding thatched houses and canoes as the life of all 350 groups. This is not a new principle and was not written as one: `subject-history.md` already holds it for a past society, twice, and `subject-re.md` for a tradition. It was missing only for people alive now, so one paragraph goes to the general owner (Source and Scenario Integrity) and names the two subject files rather than repeating them into geography and PSHE. The rule is kept from inverting into a tour of six examples: one well-chosen case is still the right shape, and the repair is one sentence in the children's hearing, or a second case where the lesson can afford it.

Not repaired: the plugin's lesson still has thirteen slides against a 45-minute clock, and the beat that gets cut when it overruns is the ending, which is the best one. That is the lesson's problem rather than a rule's. Ten new tests. Full run: 1574 pass, the same five pre-existing CRLF subtest failures.

## 2026-09-11 Secure it small, derive the shortcut, block before mixing (4.2.141)

The maths half of the comparison. `Round to 10, 100 or 1,000` was designed on 4.2.139 and read against the same objective written by an assistant knowing only the voice guide, and then against a third model's analysis of the pair.

**The plugin's was the better taught lesson, and the walk-through change is why.** One invariant five-step method held word for word across all three places; 3,462 rounded three times to make the point that the question decides the answer; rounding given a purpose (a crowd of 3,962 reported as "about 4,000") before it has a method; halfway told honestly as an agreement rather than a fact about nearness; a wrong answer on the board for the class to overturn with the line; 145 words of script on the first model; and slide 5 arriving at exactly the Pride Lesson shape, the question, the tool, the criteria and nothing else. Every number in it and on its worksheet checks out. Two structural notes from the run: its second Our Turn teaches the halfway agreement rather than practising the My Turn before it, which the designer flagged itself, and it moved the vocabulary slide one later to stop the `round` card answering the opening question, which found the `unless a word would pre-empt an exploration` wording too narrow for an opening hook.

**One finding that was not the point of the trial.** The design ran before 4.2.140 and its scripts are already the right length, with the vocabulary slide carrying words before the schema had a field for them. The walk-through asks `what happens: what you say, in the words you will say it` on every slide, so writing the lesson as a lesson produced most of the speaker-notes repair on its own. That is evidence for 4.2.138 and does not retire 4.2.140, which is what makes it survive into the built deck.

**Three things the other lesson had, now in `subject-maths.md`, none of which were anywhere in the plugin.**

*It secures the idea on numbers small enough to see.* 43 between 40 and 50, then 47, then 45 for halfway, and only then the four-digit numbers. The plugin's first model is 3,462, so a child meets the new idea and four-digit place value at once and the place value is the part that fails. The plugin half-knew this: its vocabulary cards draw a 20 to 30 line, the right instinct in the wrong place. The rule generalises past rounding and carries two limits: the small case is two or three minutes and the objective's own numbers carry all the practice and assessment, and where the difficulty genuinely is the size of the number it does not apply.

*It derives the digit shortcut instead of refusing it, and this was Daniel's call.* The plugin deferred the shortcut entirely, on the ground that a child holding it can produce every right answer without knowing what rounding means, which is true and is exactly what its own Cara error shows. But withheld entirely it leaves a Year 4 class drawing a number line for every question, and the next lesson has to reopen the meaning to attach the shortcut to anything. Daniel's decision: "It would do both I think, if easy." Both, and the design of it is what makes it easy: the shortcut is not a second method offered alongside, it is a question asked about the work the line has already done (`why is it always the digit to the right?` because that digit tells you which side of halfway you are on), at the end, once the representation has done its work. That gate is checkable rather than felt: children have used the line to overturn a wrong answer and have met the case the shortcut alone gets wrong. A convention with nothing underneath it (halfway rounds up) is still stated as an agreement, not derived.

*It blocks the cases before mixing them.* A few on the nearest 10, then 100, then 1,000, then the mixed ones. The plugin's five questions mix from the first item, which asks a child to work out which case they are in and then run a method they learned twenty minutes ago. The mixing is not dropped, because choosing the case is where the learning shows; it comes second in the same session, and the same-number-three-ways item belongs there. The third model's analysis reached the same recommendation independently.

**Where that analysis was wrong, recorded so it is not taken as settled.** It called the other lesson's shortcut teaching "shifting rules" and "fragmented", when that lesson explicitly unifies it in one slide; the criticism is of a lesson it did not write. It dismissed starting small as feeling gentle while creating confusion later, which is the one point where the other lesson is plainly right on cognitive load. And it missed two things: the wrong-place-value misconception (`4,362 to the nearest 100 = 4,000`), which the other lesson catches and the plugin's does not touch at all, and the second Our Turn join the designer had already flagged. Its flattery is not evidence.

Not repaired here: the wrong-place-value misconception is a lesson-level gap rather than a rule, since the plugin's misconception guidance already asks for the error the class will actually make. Nine new tests. Full run: 1568 pass, the same five pre-existing CRLF subtest failures.

## 2026-09-11 Speaker notes a teacher can teach from (4.2.140)

Daniel taught the Year 4 RE Christmas deck and said the speaker notes were rubbish: "Wasn't enough there, not my natural voice, felt like I was reading, confused reading!" He named the predecessor plugin (`teaching-plugins/lesson-resources`, the fork this one grew out of) as much better at this, and asked what the difference was. He is right on all three counts, and they are three different faults.

**Measured first.** That deck carries 300 words of script across twelve slides, with five carrying no script at all and four carrying nothing in the notes whatsoever. The predecessor's single worked example, for one My Turn slide, runs about 150 words. One slide there carried half of what the whole RE lesson carried.

**The calibration was lost in the move.** The predecessor's Speaker Notes Voice section opened with what a script IS (`write what the teacher would actually say to the class. Not a summary of the explanation, not bullet points of teaching objectives: the words`), then a paragraph describing the register with Daniel's own phrases in it (`really tricky`, `this catches a lot of people out`), then four complete worked scripts. lessonv4 has a denser and in places better section, and what it kept is mostly prohibitions: three tells of drift, no praise lines, no stage directions, don't restate the slide, don't leak the answer. The voice became `Natural, direct, warm, confident` plus a pointer to `teacher-voice.md`, which is a far richer file than the predecessor had and contains no example of a speaker note at all: every one of its calibrated examples, A to G, is a single sentence, because every one is a string that goes on a page. A writer calibrated on fragments writes fragments, and a writer given a list of things to avoid writes less. Restored, at the point the script is written: the positive definition, the voice paragraph, and a new `teacher-voice.md` §16H holding two full scripts at the real length, one the predecessor's money My Turn and one the failed nativity slide rewritten as it should have been. §16H is routed as required reading before the first script of a lesson rather than as an optional last resort, and a test asserts both examples stay over 100 words, because a short example would teach the fault it exists to repair.

**Some slides had nowhere for words to live.** This half is structural and no amount of voice guidance would have reached it. The vocabulary slide has no `speakerNotes` anywhere in the schema, so the class met `belief` and `nativity` with the teacher holding nothing; `vocabularyIntroductions` now carries a required `script`. `practise` and `do-task` were not in `SCRIPT_REQUIRED_KINDS`, so `Get ready to explain`, the slide that launches the lesson's main task, shipped empty; both are now required. And a unit that becomes several slides left its whole script on the first, which is why slide 7 of that deck had teacher information and no words; the Slide Designer now cuts the script where the slides cut, with the limit that a genuine reveal keeps empty notes and says so.

**Caveats were written into the read-aloud, and that is the "confused reading".** The nativity script ran `These are imagined children, not the people in the photo` between two sentences of teaching, and the staging instruction `Begin with the singing photograph, then replace them` sat in the same note as the words to say. Both are real and both belong in the teacher line; welded into the script they stop the delivery dead, because the teacher is mid-sentence to thirty children and suddenly reading a note to themselves. The rule now names its test (who is the sentence addressed to) and its exception: a caveat genuinely for the children (`you can choose to pass`) is not moved to the teacher line either, it is taught in its own beat.

Not repaired: the deck. Eleven new tests. Full run: 1559 pass, the same five pre-existing CRLF subtest failures.

## 2026-09-11 Five repairs from putting the two Shaftesbury lessons side by side (4.2.139)

The first trial design on 4.2.138 (Year 4 History, `To evaluate Lord Shaftesbury's significance to children's lives`) was read beside the same objective written by an assistant that knows only Daniel's voice guide. The plugin's was the better lesson, and the comparison was still worth doing, because what the other one had was specific.

**Where the plugin's won, and it is not close.** Children commit in writing four times (sort three children, one sentence, three answers, the judgement); the other lesson is whole-class discussion from slide 4 to slide 8, so the weakest child is silent for twenty-five minutes and the first thing they write is the hardest thing in the lesson. The criteria are modelled on the mines, guided on the mines again, done alone on one case, then across three; the other lesson never models a judgement and shows its model answer after the writing. The complication is discovered (the class decides the mines law worked, then meets the one inspector who came only after a death, and re-judges it) rather than told. Its three cases each do a different job; the other lesson's three are parallel. And it fits: 41 minutes of beats against an hour or more.

**Five things the other lesson had. Three were rules already here that were missed, so each repair gives the rule a method rather than a second warning.**

*Significance collapsed into impact.* `subject-history.md` warned about exactly this slip, in one clause with no method attached, while change and continuity beside it had a full one (goes in `concepts`, met on more than one pair). The design's criteria were `how many children / what changed for them / how do you know`, which is impact three times, and the Shaftesbury Memorial fountain, the one piece of ascribed significance in the room, was spent as a vocabulary hook. Significance now gets the same treatment as continuity: an idea in `concepts`, met on more than one case, with the criteria carrying three things (how much changed, how many people, and how long it lasted or who decided afterwards that it mattered). The third is where significance actually lives, it is the one that gets dropped, and it is usually already in the lesson as a statue or a street name. Limit stated: an objective may honestly ask about impact alone; what it may not do is say significance and teach impact.

*The character distinction never reached the children.* The designer correctly refused `was Shaftesbury a good man` in its planning, under the existing today-question rule. But a rule about what a lesson asks is not a rule about what the class is told, and a nine-year-old asked how significant somebody was answers whether they were kind. One sentence now goes to the class at the point the criteria arrive, in the words they hear, and it reaches any lesson that weighs a real person.

*The ending was refused on a true reading of a rule that was too narrow.* The design said an ending would be "the same question asked again at the same demand", which is right about asking it again and wrong about `Imagine he had never campaigned. Would children's lives still have changed? So can he still be significant?` Both Apply rules framed the judgement as synthesis; transfer sat in the designer's examples and never in the test. The preference now names transfer as a second kind of ending, and the designer carries the two shapes: the idea on a case the lesson never showed (which is 4.2.132's machinery, previously reaching only the Practise), and the lesson's own question turned round.

**Two were genuine gaps.**

*Nothing said that a tidy structure can be the harder one.* The other lesson reads more cleanly as an enquiry (criteria, then three evidence beats, then two complications, then judge) and that tidiness is a property of the plan, which no child sees. Sorted-into-categories front-loads an abstraction a child holds for half an hour (three significance criteria at minute eight, one of them `their impact lasted beyond their lifetime`) and removes the reason each part follows the last. `preferences.md` → What a Lesson Is For now asks for the order where each beat answers a question the class is already asking, with two tells (an abstract tool taught before any case needs it; a beat that could swap with its neighbour) and the limit that a tool genuinely needed to start still goes first.

*The support rules price only one failure.* Everything in Support, Checking and Release guards against support that supplies the thinking. Nothing asked whether the weakest child can begin, and that child writes nothing and says nothing, so the beat looks fine from the front. The plugin's own lesson proves the gap: it modelled its judgement twice and scaffolded its final writing with stems, then left its pivot beat, the re-judging of the mines law, as `Write one sentence` on a blank line, with a look-for that expected `that's not fair`. The section now asks what the weakest child puts on the page in the first thirty seconds, hardest on the beat the lesson turns on, with ways in that are not the answer and the existing oversupport rule kept intact.

Not repaired, and not this release's business: the trial design's unverified claim that the single mines inspector would visit only where a child had died, which slide 8 rests on entirely; a wording slip (`Write out or still down` for `Write "out" or "still down"`); and the deck, which has not been built, since a resource request is not an engine request. Nineteen new tests. Full run: 1548 pass, the same five pre-existing CRLF subtest failures, reproduced on the untouched tree.

## 2026-09-11 The lesson is written as a lesson before it is written as a contract (4.2.138)

Daniel compared the plugin's decks with lessons an assistant wrote for him from the same objectives (electrical appliances, teeth, Tudor children's work, Christmas), knowing only his voice guide and nothing of the plugin's preferences. Those lessons were "so much better", and his own account of why: "It's not just wording, it's not just what's on slide, it's also the journey it designed for the lesson." He asked what the difference was, and to be sure before anything changed.

**The pedagogy was not the difference.** Every move in the assistant's lessons is already a rule here: the boundary case after the definition (a cordless vacuum; `A distinction children could blur needs discriminating`), three Tudor children under one question (`the evidence changes while the idea holds still`, 4.2.132), teach only what the class could not establish (`teach content through the sources that make it intelligible`), `Source tells me / This suggests` (`Scaffold the barrier, not the answer`), a source question the picture cannot answer (4.2.125). The difference was the form. The assistant wrote a lesson: a journey in one line, then each slide as what is on the board, what is asked, what is landed and why it is there. The plugin wrote a list of reasons (`design-decisions.md`, a "compact semantic quality lock") and a form (`lesson-design.json`), and nobody at any stage read the lesson as a lesson.

**Tested before trusted.** This morning's RE design was rewritten in the assistant's form using only what the design already held. It read like the assistant's, and the form showed four faults in ten minutes that the reviewer had approved: a Teach slide with no question, a Do answerable from the previous slide, a starter never returned to, and the lesson's central distinction only ever shown on the launch slide. Then 34 built lessons were traced, design headings against deck titles, slide counts, text per slide and vocabulary slide positions, with the teeth and history decks read page by page. The designs mostly had a story in their headings. The decks lost it four ways, in every content lesson: a vocabulary slide at each point of need (the teeth deck defined incisors and canines, with their jobs, on the slide after `What is different about the biting edges of these two teeth?` and before anyone had answered); each Teach slide saying its sentence three ways (headline, explanation, star line); heavy beats paginated into two to four same-titled slides, six or seven beats becoming fourteen to twenty; and no surface anyone reads saying why a slide is there. A fifth, headings rewritten into slot names (`Talk it through`, `Your practice`, `Write it`), held in about half the decks, and its cause was a contradiction inside one section: a table of warm slot titles above the sentence saying the titles read in order should tell the story. The 10 September history lesson is excluded from the form diagnosis: its design's story was the wrong one (one plate, then an age sum), which is the repair that shipped as 4.2.132, and form only made it worse.

**The repair, at each owner.** The Lesson Designer writes the lesson first: `design-decisions.md` opens with the journey in one line (the story, read with the objective covered; a line that fits any lesson on the topic is the route, not this lesson), then every slide as heading, board, what happens, what is landed and why it is here, then the read-back sentence and the decisions the walk-through does not show. Writing the board out is where the amount is judged, with no number attached. The arrows retired on 2 September were asked to carry the spine; these carry the story, and the spine stays slide by slide in the why line, which is the `unlocks` line in a teacher's words. The Design Reviewer reads the walk-through first, as the lesson, leaving its closing decisions until the drift check so the designer's reasons do not stand in for its own reading; the view is what the engine will build, and disagreement between the two is a finding. The playbook delivers the walk-through beside the deck. One vocabulary slide: the teacher's settled position from 30 August, superseded on 5 September by one slide per introduction in a consolidation commit; the point-of-need reasoning is kept and moved into the beat, where the Teach's own landed sentence says the word in green on the thing the class has just seen, and the validator refuses a second entry. A Teach slide lands its sentence once: `takeaway` may be null (the headline is the sentence) or the sticky fact this slide lands (the headline then names the thing), the explanation carries only what the board cannot show, and the validator refuses a headline, explanation line and takeaway that repeat each other (a near-copy by content words, with a floor of four). The design's label is the slide's title; the warm-title table is the fallback for an internal slot name only.

**Not done, and named.** No lesson has been run through the changed files; the claim is a reliability improvement in what the designer writes and the reviewer reads, and the next run is the test. The first objective to run is the electrical appliances one, because the assistant's outline exists to read the walk-through against. The criteria panel repeating on seven of eighteen slides in the history deck and the pagination of heavy beats are downstream of a design that is now judged for amount as it is written; whether they recede is to be read from that run. The `Is [Name] right?` speech-bubble Do appears in thirteen of the 34 decks; noted, not changed. The Lesson Designer's total reading (several thousand lines across a dozen files with an eight-level precedence) is a separate job. A word that must not pre-empt an exploration is handled by placing the one slide after that exploration; if the 5 September behaviour is wanted back, the validator's one-entry refusal is the line to remove.

Twenty-one new tests. Full run: 1534 pass, the same five pre-existing CRLF failures in the component-extraction subtests, reproduced on the untouched tree and unchanged by this work.

## 2026-09-11 An invented person is shown, and the spoken question reaches the board (4.2.137)

Daniel read the Year 4 RE deck built that morning on 4.2.136 ("What Christmas celebrations or holidays mean to me") and named three things. Slide 4 framed a task with `A visitor asks why this scene matters to Christians`: "A visitor? Okay? Why is there a visitor? ... it's a bit lazy and abstract and easy to just say 'a visitor asks' when the exact same thing could have been shown a bit more creatively." Slide 7 quoted two children's reasons for singing carols as two text cards with no faces and no photograph: "Children find it harder to imagine Grace and Nadia. It makes it sound like these aren't actually people, it's just what teacher wrote down to pretend." Slide 8 asked `What do their reasons share?`: "not my teacher voice at all, and it's an abstract worded question. Be direct."

All three were authored in `lesson-design.json`, so nothing downstream could have repaired them; the Slide Designer copies source-authored wording exactly. The design review approved the deck, read 38 child-facing strings, repaired 0, and its teacher-fit line assessed slide 7 by name.

**The first two are one fault.** The plugin already had speech bubbles, portraits and a reference for them, and the whole of `slide-speech-and-characters.md` was written around judging: claims, misconceptions, disagreements, verdicts. Slide 7 is a modelling beat where nobody is right or wrong, so the file's own trigger fired on "a speaking character" and the reader found nine paragraphs about contests and fell back to text. Slide 4's visitor failed a level earlier: the naming rule in the role file is scoped to a claim (`Write a claim as [Name] says: "..."`), and a person invented to give a task an audience is not a claim, so nothing made it get a name, let alone a face. Underneath both, `preferences.md` → Lesson Designer visual-need boundary asks `does this name something that exists in the world?`, and an invented child answers no. That is backwards, and it is the hole: a made-up person needs showing more than a real one, because showing them is the only thing that stops a child reading the words as an exercise. The carve-out beside it ("here is what we noticed about the two children on the slide before") then read as positive licence for the empty slide.

A fourth cause is mechanical and probably did most of the damage. The three bundled portraits are keyed `mr-sear`, `miss-brooker` and `bailey`, and every file that lists them for an agent lists them by those names. The art is a boy, a girl and the class dog. A designer reading the list concludes it has two teachers and an animal, decides it cannot draw two Year 4 children, and writes text cards. Both references now say what the pictures actually show.

The repair: the speech reference covers anyone who says what they think, gives a reason or asks a question, not only anyone being judged; an invented person gets a name and a face, or is not invented, with the teacher's order kept (show first, because explaining to someone who does not already know is a real job; cut second, when the person only held a question); the visual-need boundary names its own hole and bounds the carve-out to a person present in the beat rather than referred back to; and the reviewer checks for the missing face. A recurring character now keeps one portrait as well as one name.

**The third is a voice reversal with a checkable tell.** `What do their reasons share?` is not a near miss: §12 of the voice guide already carries Daniel's wording for it, and the plain version was already written, by the same agent, in that same slide's script ("Tell your partner what is the same and what is different"). The board got the compression. That is §2's asymmetry running backwards, and it is detectable without judgement: where a beat's script and its visible wording ask the same question in different words, the script's is the teacher's. The check is now in §2, in the designer's completion pass and in the reviewer's voice sweep, each with the limit stated, because a script that frames or explains while the slide asks is the ordinary split and must not be caught. §6 gains the specific fault: one common word carrying an adult sense, where `share` means hold-in-common to an adult and give-someone-half to a nine-year-old.

**Why the voice rule was available and still missed, which Daniel asked to be looked at directly.** Three commits on 10 September thinned the Lesson Designer's reading, each saying in its own message that teaching guidance was unchanged. Two changes were to voice. `be864e3` moved the one-thing-at-a-time rule for pupil prompts out of the always-read role file into a component fetched only when a generated worksheet is designed, which reaches slide wording never. `0cd35e0` deleted from the voice guide the note recording the two prompts that reached real sheets because §6 was never opened (`Choose a job.`, answered `Fireman`; the Greater Depth judgement question). Both are restored: the prompt rule to the role file with a pointer left in the component so it cannot drift into two copies, and the provenance note extended with this deck's §12 case. Voice sections are still routed by the kind of string being written, which is right, but the routing card now says what happens when the writer does not stop to name the kind, because that is the failure all three cases share.

Not repaired here: the deck itself. Daniel's standing instruction is that a resource request is not an engine request, and he has not asked for a rerun. Whether a modelling beat now reliably reaches the speech-bubble templates is an empirical question for the next RE or PSHE lesson, as it is most times a judgement rule changes rather than a mechanical one.

Eleven new tests pin the three repairs and the two restorations, the restorations deliberately so that the next consolidation pass has to argue with a test rather than quietly win. Full run: 1512 pass, the same six pre-existing environment failures (CRLF in the component-extraction subtests, a cp1252 read of `preferences.md` in the criteria test), unchanged by this work.

## 2026-09-10 The designer holds the pride lessons while it writes, not only after (4.2.134)

Follow-on to 4.2.133, which gave the design reviewer a calibration for how much a beat carries and made it a purposeful design defect returned to the designer. That leaves the designer as the only place the lesson can still be written too heavy, because it read Pride Lessons "only when a real calibration example is needed" and had no self-check for amount before handing off.

Two changes, both to `agents/lesson-designer.md`. Pride Lessons moves into the reading done at the start of every run, beside the rhythm section, with its two tests stated there: what the class must take in before they can act, and, each time the same evidence returns, what is new to work out. The stale "only when needed" bullet at the decision point is removed rather than left beside it, since the two could not both stand. The completion pass gains a new **Amount** check, the same two questions run on the finished lesson, so a beat that has grown too heavy or a source that has returned with nothing new is caught and fixed here, at the decision, rather than only being sent back by the reviewer.

Neither change adds a cap. Both ask the same judgement 4.2.133 gave the reviewer, held by the party actually writing the beat.

Not validated by a fresh generation trial: the abandoned history lesson's saved teacher brief holds only a pointer to an attached plan document, not its content, so a fresh design run from it would invent different material and not be a comparable test of this change. The validation that exists is the paired reviewer trial from 4.2.133, run against a design this file's old reading order actually produced, and the guard tests added here, which check the wording landed and the contradiction is gone rather than that a generated lesson is lighter. Future consistency remains an empirical question, as this log says most times a judgement rule changes rather than a mechanical one.

Seven tests now guard both the reviewer and the designer sides of this rule together; full suite not rerun this entry.

## 2026-09-10 The reviewer holds the pride lessons before it judges fit (4.2.133)

An audit of the whole plugin against Daniel's stated aim (invisible intelligence: a simple, calm, teachable surface carrying the pedagogy underneath) found the aim already written down, word for word, in `preferences.md` → Pride Lessons: "The slides were minimal: the question, the tool, the SC. The teacher's voice filled the rest." The designer reads it "only when a real calibration example is needed" and the reviewer's routing card sent it "only when a difficult quality boundary remains unresolved". No review ever found one. Daniel's architecture for this is one net: the design is made right, the design reviewer catches what is not, and everything downstream is mechanical. So the reviewer is repaired first and the designer's reading order next.

The evidence was this morning's history run (the lesson recorded under 4.2.132). The reviewer approved it with six voice repairs, `Pedagogy: PASS`, `Daniel-fit: PASS`, and a teacher-fit line that listed features present: "both comparison objects available and live model space retained". Its own file already said a concrete opening, live-model space and an answerable task "do not by themselves establish teacher fit", and already asked for a comparison with a simpler route; the report shape asked only for "concrete delivery/wording evidence", so the rule lost to the form. The same shape was recorded on 6 September: "the review amplified them by accepting broad structural features as evidence of teacher fit". The 4 September history run (the "can't prove" question on 7 of 19 slides) and the 2 September one (nine abstractions in forty-five minutes) are the same family: too much, and nothing allowed to say so, because the defect boundary admits only what materially weakens a listed outcome and "Do not produce minor improvement suggestions" sits under it.

Gap: a judgement with no criterion, and the calibration that supplies the criterion routed away. Not a cap. Daniel's instruction stands that hard constraints make lessons worse, so nothing here counts beats, slides, sources or words.

The repair, in the reviewer's own Daniel-fit paragraph so it has one owner: the reviewer holds Pride Lessons before it judges fit, and asks two things of the class-facing view. Per beat, what does the class look at while the teacher talks and how much must they read before they can act; a beat that hands Year 4 two sources, a scenario, three questions and a criteria panel at once is too much whatever its wording. Across the lesson, each time the same object or text returns, what is new to work out; a second instance of an idea on new evidence and deliberate practice are right, the same evidence met again with nothing new to notice is not. Either is REVISE on Daniel-fit and a purposeful design defect, because thinning a beat is task architecture and the designer's to do. The report's Teacher fit line now has to name the heaviest beat and what the class looks at there, then the simpler route compared and why this one earned its extra; a line listing features present has not made the judgement. The per-moment "manageable load" bullet is folded into that judgement rather than kept as a second check. The routing card's Pride Lessons trigger becomes "read every review, before the Daniel-fit judgement".

Behavioural trial, four fresh-context reviews with the changed file over saved packets, run on this session's model rather than the configured Astra/high reviewer, so this is a reliability signal and not a result about the production worker. The abandoned history design, reviewed twice: `REDESIGN REQUIRED` both times, with the same three findings in a different order, and the first or second of them in each run is the practice beat carrying all four sources, a heading, the play question, three bullets, the evidence question and the criteria panel at once, named as the shape abandoned in the room; the second is the plate pair returning on the vocabulary slides, the Omar beat, the practice and the worksheet with nothing new to notice, and `concepts` empty (the design predates 4.2.132). The maths control (order 4-digit numbers): `APPROVED`, with a fit line that names the heaviest beat, the simpler route compared, and reads the returning chart and criteria as the tool held still while the numbers change; it also caught a `lookFor` naming the wrong column in 7,081, which the production review had passed. The PSHE control (the RSE agreement) did not stay clean: `REDESIGN REQUIRED` on the task-centred route's existing rule that an enabling unit carrying two ideas before any pupil action is a defect (the adult-help exception is told in one paragraph and used by no child until the optional sheet), with the new fit judgement reaching the same unit. That is a real finding under a rule that was already there, missed by the production review, and it means the reviewer will return more designs than before; whether that is the right amount is for Daniel to judge from the next runs.

Not repaired here, and the next step: a `REDESIGN REQUIRED` goes back to a designer that still reads Pride Lessons last, so the designer's reading order is the following change. Five new tests guard the wording, the two questions, the report line and the routing card against a later consolidation pass; 1429 pass, the same four pre-existing failures.

## 2026-09-10 A knowledge lesson can name the idea it teaches (4.2.132)

Daniel taught the Year 4 history lesson "How have children's lives changed?" (continuity and change, using sources), built that morning with 4.2.121 to 4.2.125 all live, and abandoned it partway. He used the starter and the two plate photographs, then taught it himself "because I could not see where it was going": the same toy plate on nine of eighteen slides, then a switch to apprenticeships that felt like a different lesson bolted on, and too much text to take in at a glance. He asked whether this was the lesson the week's changes were meant to produce, and to be told straight if they caused it.

They did, in two of the three ways he named. The run log shows the reviewer blocked the first design because "the assessed comparison can be completed by assembling comparisons already supplied", which is the 4.2.122 test, and the designer's repair was a hypothetical 17-year-old and two minimum ages (14 in Tudor London, 16 today) so the answer could not be read off the board. The reviewer approved. Every test added this week is a "not" test: not copyable, not guessable, not tidy, not a move unpractised. A designer passes all four by taking a fact and adding a calculation to it, and the 4.2.125 history line about source questions being comprehension questions was routed around the same way: is 15 old enough under 14 and 16 is not on the board, and it is not history. The plate repetition came from "each move is practised first on the lesson's own material" (4.2.124) read as repeat: the decisions file says the play comparison "deliberately consolidates" the earlier one. The text is a consequence of both.

**The cause is upstream of all of them.** The lesson file had slots for facts (sticky knowledge), words (vocabulary) and methods (`concepts`, which the validator locked to the skill route: `conceptRef must be null for Content-based`). Continuity and change is none of those. It is an idea, a way of seeing that transfers to sources the lesson never showed. A designer handed an idea-shaped objective put it into fact-shaped slots (`Tiny pewter plates were made for play around Tudor times`; `London apprentices agreed to years of work while they learned a trade`), and every rule then told it to make those facts needed. Daniel's own observation that `concepts` was empty and every `conceptRef` null was the clue. The lesson he would have taught, two images side by side, what is the same and what is different, then a new pair, then another, is the shape of learning an idea: the idea holds still and the evidence changes. The plugin held the discrimination half of that (a contrast changes one thing only) and not the generalisation half.

The repair opens the slot. In any route, `concepts` may name the idea the lesson teaches, with `successCriteriaRefs` allowed to be empty; any beat that is an instance of it (and the ending beat) carries its `conceptRef`; the starter and the skill route's prepare stay null; skill-route rules are unchanged. The validator refuses a named idea with fewer than two instances, or with no instance where every child acts, because an idea shown on one case is a fact about that case. The scaffold accepts `conceptIndex` on any unit and `successCriteriaIndexes: []` outside skill. The review view lists each instance with its pictures and warns when every instance uses the same pictures, so the reviewer starts from the design's own evidence. `preferences.md` → What a Lesson Is For gains the positive rule the week's four tests lacked: when the learning is an idea, name it, and the evidence changes while the idea holds still, with the limit stated as the kind of learning rather than a quota (a fact lesson keeps one well-developed case and nothing changes for it). The designer says which kind of thing today's learning is, a fact, a method or an idea, before working back from it, and records the instances in its decisions; the reviewer treats an idea-shaped objective with empty `concepts` as a finding and reads the instances for unchanging evidence. Every route says what an instance is on its beats (content pairs; discovery's Use the learning on evidence the exploration did not use; a second dialogic Stimulus as a new case; a task as the second instance of an enabling idea), and every knowledge subject file names its ideas in one line (history, geography, science, RE, PSHE; maths already used the slot).

Daniel's question with the instruction: was it the lesson type or the history file, and are wrong lessons down to choosing a fixed template? Answer recorded here for the next reader: neither the route nor the subject file, and not the template as such. The routes are shapes of activity (teach then do; model then practise); none of them can say what kind of thing is being learned, so a facts lesson and an ideas lesson looked identical to the checker. The fix is one slot the routes read from, not five rewritten templates.

Not repaired here: the visual review returned REVISE on slide 5 and the deck shipped with the fault, because Codex's run launched no repair round after the block; that is an orchestration fault in that host's run, recorded in the friction file.

Nineteen new tests. Full run: 1424 pass, the same four pre-existing failures.

## 2026-09-09 Would a child have needed this lesson to say it? (4.2.125)

Daniel showed a Year 4 history deck (continuity and change in children's lives, using sources) built that evening on 4.2.123, with the `thinking` field filled on every beat and the plugin's reviewer returning APPROVED. It was thin, and he put the finding plainly: "if you think it's weak, something in your fix didn't really help, maybe just helped that specific thing." He was right. The three questions were all answered; nothing judged the answers.

What the design said. Sticky facts: `Babies had rattles in Tudor times, and babies still have rattles today` and `Apprentices learned skills through work in Tudor times, and they still do today`. Both are sentences a Year 4 could say before the lesson, both were handed over on the Teach slides, and both were the sentences the final task expected (`write one continuity`). Thinking lines: `What is different about these two toys even though they have the same job?` (answered from the picture by a child who knows no history) and `What changed about when children could begin an apprenticeship?` (over a slide printing `before sixteen` and `at least sixteen`). The opening decision sentence named the learning as `children in Tudor England played and learned useful skills, as children do now`. The history file's own test, that a source becomes evidence only when a child has to work out something it does not say outright, sat in the designer's hands throughout, and the per-beat line was never read against it.

The cause is general, so the repair is. `preferences.md` → What a Lesson Is For gains the fourth test, run on the answers to the other three: for each named fact and the opening sentence's `because`, could a child in this class have said it before the lesson; for each thinking line, could a child answer it from the board or from what they knew walking in; and every subject has a doing the objective names that passes for thinking (using sources, using a map, recording results, calculating), so the line is read against the subject file's test too. The limit is stated: retrieval starters, deliberate recaps and fluency practice are meant to repeat what is known. The designer applies it to sticky facts (a fact that is the final task's expected sentence has made the task recall), to the thinking line, and to the quality-lock read-back. The reviewer applies it and names the two lines it approved. The catalogue's How to pick and the field contract carry the walking-in clause.

Daniel asked that this reach every subject and lesson type, not history. Each subject file already held its own doing-versus-thinking test at the level of the lesson; each now ties the per-beat line to it in one sentence: history (what the source does not say outright), geography (interrogating a map, not looking at it), maths (the decision inside the method, never `complete the calculations`), science (the explanation or prediction the recording is for), PSHE (the taught reason or boundary the child applies), with RE's version already in place from 4.2.122. Each lesson type's response beat says what its line names: skill-based Our Turn and Your Turn (the decision, and a Your Turn the class could do before the My Turn practised nothing), dialogic Talk (the position and the grounding it rests on), discovery Use the learning (what the pattern lets a child predict), task-centred Do the task (the decisions inside the task); the content route already asked for the line before the catalogue.

Seventeen new tests. Full run: 1405 pass, the same four pre-existing failures.

## 2026-09-09 Needed is not tidy, and a final task's moves are practised first (4.2.124)

The same headteacher reviewed the rerun built on 4.2.123 (design only; Daniel stopped the run before the plugin's own reviewer ran, so this is a review of an unreviewed design). Verdict: "stronger structurally ... the final task now draws on the RE content", and "not an improvement in every respect". Daniel's instruction on the repair: "it's not to just fix this lesson, it's to fix all future lessons."

Two ways the 4.2.122 rule over-fired when followed hard, and both are now bounded beside the rule that produced them:

**The examples were sharpened into a sort.** To make the final task visibly need the teaching, the designer contrasted Christians (Jesus) with everyone else (family, the tune), one meaning per person. That makes the dependency obvious and teaches a false rule, and the first version's line that one person can value both was lost. The existing designer rule "a contrast that teaches a category changes one thing only" is right for categories and is exactly what produces the sort when the learning is that one thing carries more than one meaning or cannot be read from another. `preferences.md` → What a Lesson Is For gains **Needed is not tidy**; the designer's misconception section gains the limit beside the contrast rule (one case holds both, and the retest asks the inference the wrong rule gets wrong, not a comparison of two stated meanings); the reviewer checks for a sort and for the retest's shape; the RE file drops like-or-unlike as a two-way choice.

**The final task gained a move nobody practised.** The writing ended with a comparison; the star beat's `unlocks` claimed to feed it, and producing two meanings is not comparing your own with someone else's. A prepared model paragraph showed the product and did not have the class make the move. `preferences.md` gains **Read the final task backwards as moves, not facts**; the `unlocks` guidance in the designer and the field contract gain the proof test (could a child who did this beat now do that step without being shown a further move); the content-based route asks for a supported attempt at a new move as the last Do before Practise; the reviewer reads the final task as moves.

The Ava worksheet prompt was pre-authorised for removal because "the last section asks a version of the same question", the same slip in miniature; the designer's fit-priority rule and the field contract now refuse that ground.

Also from the review, carried into the files that own them because they are general rather than this lesson's: the RE subject file now says a festival's date marks a commemoration, not a known date, that a belief names who or what and not merely that an event happened, and that belief is defined for children as something a person accepts as true; and that the protective choices (school, friends or home; little or mixed meaning; a spoken answer) live in the words children hear, not a teacher flag. The voice guide's model-answer section names the clever likeness a comparison model must not reach for.

Not repaired here and worth noting: nothing carries a previous run's strengths forward on a rerun of the same lesson, so the second design dropped care the first had. Each run is a fresh roll.

Fourteen new tests. Full run: 1389 pass, the same four pre-existing failures.

## 2026-09-09 The thought is written before the activity is chosen (4.2.123)

Follow-on from 4.2.122, from a conversation with Daniel about what learning is as opposed to doing. He rejected an ending-check framing outright ("The slides are not tests. The slides are learning.") and then put the rule in his own words: when the plugin plans a bit of a lesson it should ask three things in this order. What do I want the kids to get out of this bit? What do they need to be thinking about, to get that? What activity makes them think about it? "Right now it starts at number 3."

He was right about where it started, and the reason is instructive. The designer already said "choose the thinking first", but "thinking" resolved to a category on a list: a fact needs surfacing, an explanation needs using as an explanation, complete the because. The actual thought a child has in this beat was never written anywhere. So the Year 4 RE design chose "complete the because" for a Do whose slide already stated the because, and the thought every child had was where to copy the words from. The same operation sat under "Help Zara explain": her speech supplied the reason, the stem asked for it after "because", and the residue of that minute was nothing about meaning. A category can be right and the thought still be copying, and nothing could see it because nothing had written it down.

The repair is a `thinking` line on every beat, alongside the `unlocks` line 4.2.111 added. `unlocks` is Daniel's first question; `thinking` is his second; the activity is the third, chosen last to force that thought. The validator refuses null anywhere every child acts and allows it only where the teacher acts and children watch (a Teach, a My Turn, a stimulus, the setting of a task); it caps the line at 200 characters so it stays a thought and not a plan. The scaffold leaves the placeholder; the review view prints the line beside each beat's content so the reviewer reads it against what the slide shows. `preferences.md` → What a Lesson Is For carries the three questions in his order with the Zara case worked both ways; the selector paragraph says settling the kind is not yet settling the thought; the designer writes the line before opening the catalogue; the catalogue's How to pick and the content-based route ask for it first; the reviewer treats a line completable by reading the board, or a line that names an activity instead of a thought, as a finding with the repair the designer's.

The limit is stated where it matters: the doing is not the lesser layer, because without it the thinking stays in the heads of the four children who always answer. All three questions stay; the change is which is settled first and which is chosen last.

Sixteen new tests. Full run: 1378 pass, the same four pre-existing failures as before. Every lesson-design built before this release lacks the field and will not revalidate; that is the same trade 4.2.111 made and the reason to rebuild rather than patch.

## 2026-09-09 The learning is named before the task, and the task draws on it (4.2.122)

A headteacher of forty years reviewed the Year 4 RE deck "What Christmas celebrations or the holidays mean to me" (built on 4.2.120) from the PowerPoint and notes alone. Their central line: "the lesson is clearer about how children should construct their final explanation than it is about how their understanding will develop, and how the teacher will know that it has developed." A child could write "the holidays mean time to relax; I enjoy drawing because I can spend longer on my pictures" and meet the objective without the Christian meaning of Christmas, the same-song-different-meanings idea, or the warning against inferring belief from activity. Daniel agreed and put it his own way: "I want them to LEARN, not learn to do a task ... The final task then is there to draw together what they've built, not to check if they were listening."

The lesson file backed every specific claim. Two sticky facts were named and nothing later needed either. The decision record opened `because the lesson gives them the Christian meaning of Christmas ... evidenced by an individual explanation of what the holidays mean to them`, and no read-back noticed that the evidence could not catch a child who lacked the because. The ending was omitted because "the personal explanation is the synthesis and final evidence". The starter collected each child's own example and reason and never returned to it. Grace's question-writing beat ended with the question; its `unlocks` line named a recognition rather than something a later stage used. "Why read the birth story?" asked for a because the previous slide had already stated in almost the same words. The reviewer approved all of it.

**The cause was not a missing rule but a shared frame.** Every decision in the chain was performance-shaped. Sticky knowledge was "what children need to succeed at the LO". The ending was dropped "when practice already demonstrates the intended learning", with intended learning read as the performance. The reviewer's learning-contract test was "read the end performance and ask what a child who does it well now knows". The cumulative trace worked backwards from the final performance, so learning the performance did not need was invisible to it. In history, geography and most PSHE the final task cannot be done without the taught knowledge, and the frame holds: the other recent lessons that skipped their ending were checked and their final tasks genuinely draw on their sticky facts. It breaks when the objective is itself a product a child can make from their own life, which is exactly the "what X means to me" RE and PSHE objective.

The repair puts the principle where the frame lives. `preferences.md` gains **What a Lesson Is For**, read by everyone who designs or reviews a lesson: durable learning is named before the task and separately from a product-shaped objective; every stage earns its place because the next needs what it leaves behind; the final task draws together what was built, and the test that separates that from a listening check is whether a child who missed every Teach could still do it well; a child answering from what was said a minute ago has shown attention, not learning. The limit is stated: vocabulary, routines, safeguarding and setup sit beside the spine, and interesting subject knowledge can earn a minute without being assessed. The rhythm section now calls itself the shape this principle takes rather than the principle.

The same test then reaches each decision that had been answering the wrong question. Sticky knowledge in both the preferences and the designer is what children still hold next week, and naming one is a claim the lesson makes good on by a later stage needing it and the final task drawing on it, with the skill-lesson test kept and its limit named. The designer names the learning first in "Before You Design Anything", adds it as the first line of the learning chain, reads the quality-lock sentence a second time from the evidence end, and judges the ending against the named learning with the repairs in order: reshape the practice, earn an ending, or withdraw the claim. The reviewer's learning contract asks which later stage would fail without each named piece; its cross-section sweep checks sticky knowledge against the final task as well as the teaching. The RE and PSHE files say what a reflection draws on when the objective names a product. `do-beats.md` §10.1 gains the boundary the birth-story beat crossed: a because already on the board is read back, not used.

One artefact rather than prose: the review packet now prints, under each sticky fact, the units that reference it and whether any final work does, with the note that a reference is availability rather than use, so the reviewer starts from the design's own claim instead of from memory. The routing card gains the new section.

Two faults from the same deck are mechanical and belong to the slide designer, not this repair: a teaching unit split across two slides had its whole script copied onto both, so slide 9's notes discussed Jamal's sentences before slide 10 showed them; and that split put the abstract definition before the concrete example the designer's own script led with. Both are recorded here for the next release.

Eleven new tests guard the reach of the rule and the packet's new lines. The full run passes with the same four failures the untouched tree already had (a builder parity guard, a stale runtime choreography assertion, a stale reviewer effort assertion, and a voice-guide name assertion), none of them touched by this change.

## 2026-09-08 Part-whole circles sized from their numbers (4.2.115)

Daniel: "whats up with the part whole model, that didnt work, too small". It printed "3,000" inside a circle as "3,00" over "0" - a four-digit number broken across two lines, on a slide teaching four-digit numbers.

The circle was sized from the zone alone, the label size was then guessed from the diameter and tapered by `3 / charCount`, and the result was clamped up to a 10pt "minimum" that was never checked against the circle it had to sit in. So the minimum did not mean "small but legible", it meant "overflow quietly": at 10pt "3,000" is wider than the 0.39in circle it was placed in, and PowerPoint wrapped it. The taper was also wrong on its own terms, pricing a comma as a digit.

The zone was the underlying fault: 7.75in wide and 1.27in tall. An upright model cuts its circles out of the HEIGHT, so nearly eight inches of width sat unused while the circles were starved. Nothing caught it because nothing measured the label.

The label is now measured with the shared glyph-width table, the font is the largest that genuinely fits the circle's inscribed width, and a zone that cannot seat a readable label is refused by name with the size it needs - the contract place-value-chart and table already keep. The documented flat floor of 1.4in square was itself wrong and now says what it depends on: single digits are happy at 1.4in, four-digit labels need about 2.4 x 2.5in upright or 2.4 x 1.9in on their side.

The reported deck's slide 4 was repaired against the new refusal: the model was laid on its side, which needs about 0.6in less height, and the stack rebalanced 1.2/0.7 to 0.95/1.2. Two of the five new regressions discriminate against the old renderer; the other three are invariants a roomy zone already satisfied.

## 2026-09-08 Number lines fill the card, and stacked lines say which they are (4.2.114)

Follow-up to 4.2.113, decided by Daniel against a mock deck showing both options side by side. He picked the fuller of the two.

A number line is a thin thing: one line and its numerals need about half an inch, and a My Turn card is often seven times that. Capping the drawing at its natural size banked all of that as white space and left the numerals smaller than the card could afford, on exactly the slides with the most room. The drawing may now grow up to 1.6x. The zone still binds first, so a crowded card is unaffected and only genuine surplus is given back, and room is kept above and below the axis because a My Turn line gets written on.

Stacked lines are now named A, B, C down their left edge by default. The reported deck asked "Line B: what number does Q show?" over three unnamed lines, so a child had to work out which line was B before starting the maths. Naming is the default rather than a field a designer sets, because forgetting it is invisible in the spec and only shows up in front of a class; `lineLabel` renames one and `lineLabels: false` turns them off.

One test had to change rather than pass: it compared a stacked arrow against a single-line arrow as a ratio, and a lone line may now grow, so the ratio moved for reasons unrelated to the stack. It measures the stacked arrow absolutely instead - 0.141in when this was reported, 0.180in now.

## 2026-09-08 Number line numerals that can actually be read (4.2.113)

Daniel reported that the arrows, axis numbers, the red marker and the green answers on a number line all looked too small. They were: on one axis a "0" printed at full size next to a "10000" at well under half of it, and the words in the question box beside them were roughly twice the height of either.

Two independent causes, which is why a previous repair that raised the font ceiling from 14pt to 24pt changed almost nothing. Every axis label was drawn in one fixed 0.55in box, so a numeral's rendered size tracked its DIGIT COUNT and the fit pass silently shrank whatever overflowed; on a Year 4 four-digit deck that is every number on every line. Separately, a stacked line claimed a flat 2.00in of height whether or not it carried an arrow or an answer, so a pair of bare endpoint lines "needed" 4in and three arrowed lines were scaled to 54% - numerals, arrowheads, dots and ticks together.

The renderer now measures every label with the existing shared glyph-width table, insets the axis so the end labels sit inside the zone at full size, charges a line only for the bands it carries, and holds the numerals to a 14pt floor by taking a deep stack's room out of the arrows and ticks instead. Spare vertical room goes between stacked lines rather than being banked below them. A crowded axis shrinks WHOLE - one size for every numeral on the visual - because letting each label take the size its own digits allow is the original fault in miniature. Eight of the reported deck's eleven lines now draw at the full 24pt.

Three further changes came out of reviewing a mock deck with Daniel. Axis numerals print with thousands separators, because the question said "Mark 3,000" over an axis reading 3000 and Year 4 is where that convention is taught. Ticks are taller and slightly heavier, since counting the equal intervals is the step of the method actually performed on them. And **three stacked lines is now a hard maximum**, refused by name: the guidance said "clearest at around three rather than five" and a run built five, at which size no other repair helps.

The printable `number-line-svg` helper already measured honestly and inset its axis, so the fault was confined to the slide renderer. Eleven focused regressions pin both original causes, the floor, the separators, the line cap, and the one case that should still shrink a numeral.

Also found: the render probe reporting no PPTX route was a false negative. Re-probing the same machine found PowerPoint immediately, and the run had already rendered all fifteen slide pages ten minutes before the final review declared them unrenderable - it read `render-route.json` and stopped while a current page manifest sat beside it. A deck shipped UNVERIFIED with its own evidence on disk.

## 2026-09-08 Memorable criteria without arbitrary ceilings (4.2.112)

Daniel clarified the purpose: "short and sweet, easy to remember, easy to repeat and call back." Neither eight words nor five steps is an absolute limit, provided the complete method can be displayed usefully. A simple condition may stay inline. This supersedes the numerical ceilings recorded below, not the preference for concise cues.

The design validator still checks structure and nonempty content, but no longer rejects a necessary action solely by word or row count. The existing review view exposes long wording/list cues and both true and false `drawLive` decisions. The designer, voice guide and reviewer now judge familiar, runnable callbacks; count cues are neither automatic failures nor excuses for verbose prose. Contradictory examples and the assertion that every condition needs a table were reconciled.

The existing fixed and free success-criteria panels already render six or seven short steps, so no second layout engine was added. Their real fitting gap was later: the steps helper calculated an 18pt initial floor but did not transmit it to final autofit. It now does. The placement guidance protects the complete method, question and working space, and routes genuine capacity failures instead of cutting steps or inventing a second concept.

The live-drawing check now binds each cue to its own source via optional `criteriaRef`, validates the displayed content and the supported flag location, and rejects an invented cue even when another criterion is legitimately marked. Unambiguous older panels infer their source from content. It deliberately does not decide pedagogically whether a method should be marked; that decision is now visible to the reviewer.

The cumulative-learning instructions already contained a substantial forward transition check. The focused addition distinguishes carrying learning from merely reusing a resource or a callback phrase, tracing a representative final performance backwards and then forwards. Parallel cases contributing to a later comparison remain valid. The concurrent 4.2.111 release and its existing `unlocks` field are preserved; this repair uses that line and the actual teaching rather than adding a second per-beat report, an extra agent or an automatic Apply slide. The new behavioural calibration cases are examples for review, not evidence that a model has passed a classroom evaluation.

Verification before integration with concurrent 4.2.111: 205 targeted Python tests passed, including the complete design-review packet and lesson-design contract tests; 11 focused steps/panel tests passed. The two-slide `criteria-callbacks-smoke.json` built without warnings, passed the cue handoff, and was rendered and visually inspected with Comic Sans MS loaded: all six/seven steps, the task, number line and modelling space remain usable. This is a layout fixture, not a generated-lesson effectiveness trial. The broader local builder check also exposed existing picture-guard failures and two stale documentation assertions; each was reproduced on the untouched starting snapshot. They are not silently treated as a clean whole-repository pass and are outside this criteria/progression repair. The full Node test run passed 526 of 528 tests, with only those same two baseline assertions failing. The full Python run passed 1,290 tests and 1,641 subtests; of four failures, three were reproduced on the untouched snapshot (picture guard, an old reviewer effort assertion, and an old voice-guide name assertion). The fourth expected the long criteria example replaced here; its expectation now follows the short callback, and that entire 18-test file passes.

## 2026-09-08 The research read, and the eight things it was still owed (4.2.111)

A deep research report on dependency-based instructional coherence was read against the plugin, point by point, and every claim traced to the file that owns it.

**Most of it was already here, and was left alone.** Working back from the final performance, supplying a missing referent before relying on it, each major beat changing the state of the lesson and the next building from it, semantic completeness in place of a rule against two Teach slides in a row, the pairing test, all-pupil commitment, diagnostic checks that resist surface cues, guided versus unguided discovery, demand that climbs without a staircase, variation theory in skill practice, variety not counting as a justification, vocabulary at its point of need, and the reviewer's beat-by-beat dependency read. Several of these had been repaired in 4.2.109 and the first draft of this analysis was written against a stale copy of the plugin that still lacked them.

**The selector was the real gap, and it explains the complaint.** Every place that told the designer how to choose a Do beat carried the same four-way map: a fact suits recall or a sort, a process labelling or sketching, a concept writing or generating, a value ranking or talk. A taught explanation, meaning a cause, a mechanism, a reason or a relationship, is the commonest chunk in a content lesson and has no entry in that map. It falls to "concept", and "concept" routes to writing a sentence about it, which is the one response a child can produce without using the explanation at all. The catalogue could not rescue the choice: a count of all sixty entries found no because-sentence, no prediction the taught idea decides, no words-to-diagram or diagram-to-words, no inference from evidence and no connection back to earlier learning. `preferences.md` now says what each kind of chunk needs, including explanation, evidence and a new idea joining an old one, with the boundary that a deliberate short recap is still right when the design says why; `do-beats.md` gains section 10 with those ten formats.

**The spine is now recorded, not only judged.** The principle that a beat changes the state of the lesson lived in guidance and in the reviewer's head, and nothing in `lesson-design.json` held it, so it was never visible to the teacher and never checkable. Every source unit now carries `unlocks`: one line of at most 200 characters naming what children can now do that a later part needs, written forward, with `null` a real answer for a beat beside the spine. The validator refuses a missing field, a blank line, a paragraph, and a sequence where every beat unlocks nothing. The reviewer's view prints the line even when it is absent, because a field that only renders when filled hides the case the reviewer is looking for.

**Five smaller repairs, each a point the research made and the plugin missed or contradicted.** A check that gates the next part now names what the likely wrong answers mean and the move that answers each, while the teacher keeps ownership of how responses are gathered. Ending the lesson successfully is separated from having learned it, so the design may name what has to come back without inventing results, thresholds or tomorrow's lesson. A recall beat thirty seconds after the answer was given is no longer sold as durable retrieval; its honest value is the processing and the read on the class. A repetition now has to change something (fluency, a moved feature, a discrimination, retrieval, a connected representation, less support, a new case), and that reaches content lessons rather than only maths. Partner talk gives each child a moment to settle their own answer first where the beat is the lesson's evidence, and goes straight into the pair where the talk is there to generate. A manipulative earns its place by having its objects and actions connected to the idea and by being planned to leave. A word gets the investment its job needs rather than the same middling treatment, and a card set is not sold as vocabulary growth. And the modelling section's blanket ban on "have a go first" now names the unstructured version only, keeping modelling first as the default while permitting the designed problem-first opening the plugin's own bounded-observation and flawed-example routes already used.

**What is established and what is not.** 1,344 tests pass, including 56 new ones that check the rules reach every agent that could break them and that the validator actually refuses each violation at its enforcement point. Two tests were already failing before this work and still are. No live lesson was run. Eleven recent designs were scanned for the summary-shaped pupil task the research predicts and none was found, so the selector repair closes a gap in the available choices rather than a defect visible in every lesson. The next real content lesson is the check, and the first thing to read in it is whether the `unlocks` lines are written forward or filled in afterwards.

## 2026-09-08 Criteria wording, and the draw-live cue that never fired (4.2.110)

Two things the teacher raised after reading the four decks, traced before changing anything.

**The flipchart cue had never once reached a lesson.** The easel drawing is in the builder, the green panel draws it whenever a slide's criteria carries `flipchart: true`, the working wall already reproduces a flagged reference, and a test lesson proves the render. Across 31 distinct designs between 25 August and 8 September, `drawLive: true` appears in none of them. Three reasons stacked: the rule reserved the marking for a labelled category set and said in as many words to leave procedure steps unmarked, so the exchange method the teacher writes up by hand was excluded by definition; the slide-designer role never mentioned the flag, so a design that had set it would have lost it at the handoff anyway; and the design reviewer's compact view does not print the decision, so nobody downstream could miss it. The first two were repaired in 4.2.109. This release adds the check that would have caught the third: `check-drawlive-handoff.py` compares the design with the built slide specification at the slide gate, names the slides that should have carried a marked criteria's cue, and refuses a cue on a lesson whose design marked nothing.

**Criteria steps had drifted long, and the drift is datable.** Across 113 recent steps the median is 5 words, but 47% run past 5 and 12% past 8; August averaged 5.0 words a step and September 6.1, with the circuits lesson at 10 to 14. The panel fits about five words to a line at the size it is read from the back, so a longer step wraps and reads as a sentence. The cause is in the guidance. The old plugin said "2 to 5 words, under 8 at the absolute outside" and "no explanation or reasoning, that belongs in speaker notes"; when this file was created on 28 August both lines were lost, and on 1 September the circuits repair added a validator cap of 12, which lets a step run to twice the aim and pass. Every one of the 14 steps over 8 words in that sample carried one of three things that belong elsewhere: the reason (taught on the Teach slide), an alternative (`the lamp or buzzer`, four times down one list, when the teacher can say which the class is using), or a condition (`Subtracting with no thousands?`, which is a branch and belongs in a lookup row beside the steps). The ceiling is 8 again, the validator refuses past it and names those three tells, and the mechanics carry the contrastive pairs back. The voice guide's own worked example was a 13-word criterion offered as good practice; it now shows the short form beside it.

## 2026-09-08 Four decks traced against the teacher's preferences (4.2.109)

The balanced diet, children's lives, 1,000 more/less and number line decks (Codex, 4.2.107/108) were traced through their runs against the preferences analysis. The record is `output/lesson-v4-preferences-analysis-2026-09-04/deck-investigation-2026-09-08.md`. What 4.2.109 changes:

- Action verbs were painted question blue. `core-action` and `task-action` rendered in house blue, while the visual profile said instructions stay black; a PSHE task sentence went out in four alternating blue and black chunks. Both roles now render bold in the line's own colour. Rebuilding the diet deck put slides 5, 8, 11 and 17 back in black with the one real question still blue.
- A practice question shrank to 10pt beside a 23pt criteria table because its fit name carried no floor. Numbered-question text now names its 14pt floor, so the history deck's slides 13 and 14 stop the build with `TEXT_OVERLOAD` instead of shipping.
- A two-paragraph model answer was half green: the `||` reveal is per line. A block that opens with the marker and carries no other is now green throughout.
- A green vocabulary word after a line break split its paragraph, because emphasis runs were not cut at newlines the way marker runs are. They are now.
- Success criteria authored as a sentence table (history) or six conditional steps (1,000) drove the panel taking half of every slide, the nutrient table wearing the criteria label (diet) and the Your Turn fragmenting into one-calculation slides. The design validator now refuses a sixth step and a table cell past eight words; the preferences say criteria are what the child does or what good work shows, a table of facts the task uses is a representation, and a branch is a lookup row. The design reviewer reads the object, not its id.
- The draw-live cue was reserved for labelled category sets and never reached the slide designer as a field. It now covers a method children run across a sequence of lessons too (the exchange steps the teacher wrote up by hand), the slide designer maps `drawLive` to `flipchart`, and the wall reproduces either.
- The timeline helper printed a "not to scale" note its documentation example taught. The teacher wants none: the note is refused by name and the catalogue shows how to place marks in proportion to real dates.
- The PowerPoint render probe asked only the interpreter running the script; Codex's bundled Python has no `win32com`, so three runs recorded no route on a machine that could render. The probe now tries every interpreter it can find, records the one that answered for the conversion, and names a missing module instead of reading it as absence.
- Preferences recorded from the teacher's answers: slides are written as if the notes are never opened, so a later check's answer must have been visible; every vocabulary card carries a visual; two questions never share a paragraph; a decoration may take a genuinely clear area at the same fade, and is judged at its placed size.

## 2026-09-06 Partition 4-digit numbers

- Final slide review found that slide specifications using the key `notes` produced a deck with empty speaker-note bodies because the fixed builder reads `speakerNotes`. Renaming only the slide-level key on all 15 slides preserved the note text and produced a reviewed PASS after rebuilding.

## 2026-09-01 - Year 4 Geography Lesson 1 (rebuilt deck, read)

- Maps came out a fraction of the size their cards had room for, and nothing measured it.
  *Addressed 1 Sep 2026. The opening map filled 46% of its card and the
  world-to-continent zoom 33% of its, with the rest white. The containment is
  right - stretching a map draws countries the wrong shape - but when the slot's
  proportions are far from the picture's, containing it leaves the remainder
  empty and nobody was looking at that number. Worse, the optional-picture pass
  then decorated the space, because to that pass empty space is an opportunity
  rather than a symptom: slide 9 got a grey map pin in the room its map should
  have been using. `FIGURE_ZONE_UNDERFILLED` now reports any contained figure
  covering under 60% of its slot, names the axis being given away and both
  shapes, and says plainly that stretching is not the repair. Advisory like the
  capacity checks beside it, because a better-shaped slot is a composition
  decision. Replaying the deck raises it on seven figures across six slides and
  stays silent on the rainforest slide, whose card already fits its map.*
- The starter's answer slide named three things and left the map marking one.
  *Addressed 1 Sep 2026 in the Slide Designer. The question marked one continent
  and asked for it, the ocean to its east and the continent to its north-west;
  leaving the other two unmarked on the QUESTION slide is correct, because
  finding them by direction is the geography. The answer slide then printed all
  three in green over the same single mark, so a child who guessed wrongly had
  nothing to check against and the one place the answer was visible stayed
  silent. An answer asked on a figure is now shown on that figure.*
- The one continent that was marked was hard to see.
  *Addressed 1 Sep 2026 in templates.md. A thin dashed outline round South
  America on a map at half its card's width is a line a class has to hunt for,
  and a starter whose first job is finding the thing being asked about has failed
  before the question starts. Where the mark is what the question turns on,
  shade it: shading survives being small, an outline does not.*

## 2026-09-01 - Marking a figure, package-wide

- Only six of 57 figures could be pointed at, and each of the six had invented its own word for it.
  *Addressed 1 Sep 2026, after Daniel asked what else the engine should learn to
  draw. A survey of every figure found marking on the map (`annotations`), the
  grid map (`highlightSquare`), the rainforest layers (`highlight`), the
  place-value chart, the geoboard (`emphasiseVertices`) and a labelled photo -
  one idea, six spellings, and fifty figures a teacher could not point at at all.
  Nothing in `helper-authoring.md` mentioned marking, which is why a new helper
  kept arriving without it.*
- The survey turned up a distinction worth writing down: there are two kinds of marking and confusing them would be silently wrong.
  *POSITIONAL marking belongs to a picture that is fixed and real - a map, a
  photograph - where a mark sits at a position and the position means something.
  SEMANTIC marking belongs to a figure the engine draws from the lesson's own
  data, where the layout moves whenever the data does, so a mark must NAME a part
  and let the figure find it. A ring placed 40% across a bar chart survives every
  check and ends up round the wrong bar the moment a value changes. The six
  existing implementations had all got this right by instinct; none of them had
  said so. `shared/visuals/figure-highlight.js` now owns the semantic half: one
  colour, one fade, one word (`highlight`), an unknown part name refused by name
  rather than ignored, and highlighting every part refused because it points at
  nothing. Wired into venn, carroll, tally-chart and pictogram, which between
  them reach the board, the sheet, the wall and the child's book from one change
  each.*
- The map could draw a route but not which way anything went.
  *Added 1 Sep 2026. `arrow: true` on a line puts a head at its end and
  `arrow: "both"` at each end, on the board, the printed sheet and the world map
  presentation. Movement is half of what a primary map is asked to show - a
  migration, a river's flow, a trade route, an invasion - and a line without a
  head draws the path while omitting the teaching. Only a line takes one: an area
  is a place rather than a journey and a point has no direction.*
- Still to do: bar chart and line graph.
  *Recorded 1 Sep 2026 rather than rushed. They are the two most-used figures of
  the set and they want highlighting most, but each has three separate
  implementations (a PowerPoint-native slide renderer, a worksheet renderer and
  the shared SVG the wall draws), so wiring them is a different size of job from
  the four done here and deserves its own pass.*

## 2026-09-01 - Year 4 Geography Lesson 1 (rebuild)

- The rainforest distribution map came back `unsatisfied` after two searches, and the run was about to build slides 6, 7 and 8 without it. Slide 6 is called "Spot the rainforest pattern".
  *Addressed 1 Sep 2026. Daniel's objection was the right one: the deleted
  schematic map produced a good teaching picture, and the only thing wrong with
  it was the fake coastlines. Everything else - shaded rainforest belts, a key,
  the Tropics, continent names - was correct and wanted. So the picture moved
  onto the real map rather than being lost with the helper that drew it badly.
  Three things were missing and all three were omissions rather than limits. The
  seven-continent world presentation ignored `annotations` outright and said
  nothing, so a lesson could hand it rainforests and get a bare world back; it
  now draws them. An `area` could only be outlined, which says "somewhere in
  here" where the lesson means "this whole area is the thing"; `shaded: true`
  now hatches it, hatched rather than solid so the coastlines and borders
  underneath survive a grey photocopy. And there was no key, so nothing could
  say what a shading meant; `key` adds a band under the map using the same
  hatch. The plain slide map draws PowerPoint shapes and cannot fill, so it
  refuses shading by name rather than quietly returning an outline.*
- Positions on the world map can now be given in real degrees, and should be.
  *Added 1 Sep 2026, because "how trustworthy is this?" is the right question to
  ask of a region placed by eye and the honest answer was "not very". A picture
  fraction is a guess only a render can check; a first attempt at the Amazon in
  fractions landed in the Pacific. Degrees are a fact this kind of author knows
  well, and `world-with-antarctica` is a full equirectangular world, so the
  conversion is exact arithmetic. Verified by rendering London, Cairo, Manaus and
  Sydney from their real coordinates: all four land on the right place. Degrees
  are refused by name on every other shipped map, because those are crops whose
  edges nobody recorded, and a degree converted against numbers we do not have is
  worse than a fraction since it looks precise.*
- The fallback ladder gave up several rungs early: a dead picture went almost straight to words.
  *Addressed 1 Sep 2026. The Slide Designer's degradation route had two rungs, a
  faithful helper then the slide's own words, and the missing middle rung is the
  one that matters most: a real base the package already holds, marked up. A
  lesson usually needs a visual showing where or what something is rather than a
  picture of it, and marks are what do that. The ladder now names that rung
  explicitly and says words are last. The helper check's `gap` decision carries
  the same test in four lines, because "no published picture exists" was being
  read as "this cannot be shown".*

## 2026-09-01 - Year 4 Geography Lesson 1 (deck review)

- Slides 1, 2, 6, 7, 8 and the practice slides drew a schematic world map instead of a real one, and it looked good enough that nobody questioned it until the finished deck was read.
  *Addressed 1 Sep 2026, and the fault was not the routing. `world-geography-map`
  drew its continents from longitude/latitude pairs typed to look about right,
  which is the one thing `map-annotations.js` says the package will never do. It
  shipped anyway because the parity guard accepted `projection:<name>` as a
  source and the helper declared `projection:equirectangular-lonlat` - a
  genuinely real projection over invented coordinates. No allowlist of
  projection names could have caught that: the name was already correct. A
  projection is how coordinates are transformed, never where they came from, so
  the prefix is now refused outright and the only sources are `data` and
  `asset:<folder>` - something on disk. The helper is deleted from every
  registry. Its three configurations go to the routes that can be right about
  the world: continent retrieval to the real write-on world map (now also the
  stick-in piece, so the map in a child's book is the one on the board), the
  Equator and both Tropics to `seven-continent-world` where they are computed
  from the asset's own equirectangular geometry, and biome or rainforest
  distribution to the picture route as a real thematic map, which the
  `substitute` check added earlier the same day now holds to a contract
  filename. Regression tests in `map-annotations.test.js`,
  `map-slide-world.test.js` and `render-visual.test.js`.*
- Slide 15's South America map was unreadable: ten label pills printed on top of one another across the map they were naming.
  *Addressed 1 Sep 2026. The marks were fine and a lower ceiling would have been
  the wrong fix - eight countries plus two overlays is a reasonable thing to
  want. The map simply had half a body row, so South America's proportions fitted
  it about 2.4in wide, and a board label pill is 0.82 to 1.62in because it has to
  read from the back of the room. The layout searched for clear positions,
  failed, and fell back to the preferred spot for every one it could not place -
  silently. It now marks what it could not place and the renderer refuses with
  `MAP_LABELS_DO_NOT_FIT`, naming the labels and the three ways out. The same
  spec given the whole body still draws, which is the point: the fault was the
  room, so the check is about the room.*
- The picture route was confirmed working as Daniel wants it and was left alone: a real source is preferred, `ordinary-real` falls back to generation, and a failed picture stage degrades to `PICTURE_STAGE: unavailable` and designs the deck without it rather than stopping the lesson.
  *No change, 1 Sep 2026.*

## 2026-09-01 - Year 4 Geography Lesson 1

- The installed package changed from 4.2.56 to 4.2.57 during the run; canonical outputs survived and the newer verified package completed the deterministic checks.
  *No engine fault, 1 Sep 2026: the package was reinstalled by hand mid-run. The run's own recovery was correct.*
- A promised substitute map route was recorded in helper coverage but no corresponding map filenames appeared in the photo contract, so slides fell back to the nearest live map compositions.
  *Addressed 1 Sep 2026, and the cause was two faults in one place. The verdict
  check that would have caught it lived only in `references/helper-route.md`,
  which is read only when a decision says `build`; this run's decisions were all
  `covered` and `substitute`, so the check never ran. And even when it did run,
  `substitute` needed only a reason, so a reason asserting "the approved picture
  contract supplies the exact teaching map" passed while the contract held
  nothing. The check's closing step now sits on the path every run takes
  (playbook Phase 1.5, "Close the check"), `substitute` names its contract
  filename in `picture` and the check resolves it against
  `photo-requirements.json`, and a new `gap` decision gives the genuine dead end
  somewhere to go that does not promise a picture nobody will source. Replaying
  this run's own `helper-check.json` against its contract now fails on both map
  decisions, before the freeze. Regression tests in `test_helper_coverage.py`.*
- One authentic worksheet riverfront photograph remained unsatisfied; focused repair successfully converted only that evidence card to text while preserving the confirmed aerial photograph and the intended reasoning task.
  *No change, 1 Sep 2026: working as designed. A documented Manaus riverfront is
  exactly the picture that must not be generated, `fallback_action: unsatisfied`
  said so, and the reconciliation route re-authored the one question. The route
  cost one focused repair and kept the sheet.*
- The Below worksheet exposed a 13-pixel rendered overflow not caught by JSON preflight; merging two adjacent instruction helpers fixed it without changing pupil-facing content.
  *No change, 1 Sep 2026: preflight measures the modelled page and the build
  measures the browser-rendered one, and 13 px of real-render overflow is only
  visible to the second. Moving a Chrome render into preflight would charge every
  design attempt for a fault one focused repair closed. Revisit if rendered
  overflow becomes a repeat finding rather than a single 13 px miss.*
- The run opened its branches in parallel and then serviced them one at a time. Five sourced photographs sat unpublished for 14 minutes and adaptation's provisional contract unbuilt for 12, both then running in seconds the moment an unrelated Slide Designer returned.
  *Addressed 1 Sep 2026, and the dependency graph was never the problem. The
  runtime's `phase3` slice - the one carrying "service each branch as it lands"
  - was named by no NEXT block, and `finalize` sits only behind it, so by the
  routing's own rule (a branch no NEXT block names has ended) the run ended when
  its last track did. A host with a large context inferred the tail and finished
  anyway, which is why this read as a slow run rather than a missing report. The
  three track-end slices now name `phase3`, and the servicing rule has moved
  forward into `phase2-core`, where it arrives before the first track opens
  rather than after the last one closes. Regression tests
  `test_no_slice_is_stranded_behind_a_door_nothing_opens` and
  `test_the_tracks_are_serviced_as_they_land_not_read_end_to_end`. Worth
  measuring on the next run: the worksheet branch is the run's longest pole and
  was held about 12 minutes of a 57 minute run.*
- The run report's picture stage read `attempting 2 pictures` for a contract of five.
  *Addressed 1 Sep 2026: `PICTURE_ASSIGNMENTS_OK` printed only the assignment
  count, and coherent pictures pack into one assignment, so the only number in
  front of the orchestrator was the wrong one - and that line goes verbatim into
  four designers' prompts. The marker now prints both counts and the playbook
  names which one the state line takes.*

Lesson runs append genuine engine findings here when a writable source
checkout resolves; the improvement pass reads them, fixes the engine, and
records what became of each entry. A run that cannot reach this file writes a
`pending-build-review-log.md` beside its run report instead, and the next
improvement pass folds those in.

## 2026-08-30 — Year 4 Maths: 4-digit ± 3-digit numbers

- Worksheet `column-method-grid` ignores both `showHeadings: true` and explicit
  `columns` arrays in rendered output; place-value headings remain absent
  although the spec requests them.
  *Addressed 30 Aug 2026: `showHeadings` is now rendered and measured
  (`worksheet-html/src/helpers/forms.js`), with the letters derived from the
  numbers' own width; regression test `column-method-headings.test.js`.*
- Working-wall no-photo cards retain the photo-column width, producing a
  substantial blank right-side band; the retained builder has no output-only
  override.
  *Investigated 30 Aug 2026: does not reproduce - the renderer reserves no
  photo column on a no-photo card, and the rebuilt page uses the full panel
  width. The band was the ragged right edge of left-set steps; the reviewer's
  dead-space standard now names that rag as not-a-fault
  (`agents/visual-reviewer.md`).*
- Working-wall ordinary spaces can collapse at particular line joins;
  non-breaking spaces restored canonical visible wording.
  *Investigated 30 Aug 2026: does not reproduce - the same spec with ordinary
  spaces renders correct spacing, and NBSP has the same printed width as a
  space, so the "fix" could not have changed the page. The likelier fault was
  pixel transcription at review DPI; wording-drift findings now require
  text-layer or 300 DPI confirmation (`agents/visual-consistency-reviewer.md`).*

## 2026-08-30 — Pending helpers from the batch

- The `map` growth (seven-continent world with Antarctica, globe-to-flat,
  continents-and-oceans worksheet form) was installed and proven on
  30 Aug 2026: the shipped `world.png` genuinely omits Antarctica, which had
  blocked the whole continents lesson.
- The `column-method-grid` drop-in was reviewed and NOT installed: its
  worksheet half hard-codes four Th/H/T/O columns, which would regress the
  2-digit grids the engine's own helper (now with `showHeadings`) derives
  correctly, and its slide half needs the same width-derivation before it is
  safe. Rework the drop-in before installing.
- The `water-cycle-diagram` drop-in remains waiting in its run folder; the
  substitute-picture route delivered that lesson, so installation stays a
  deliberate choice via `/install-helper`.

## 2026-08-30 — Year 4 PSHE: The importance of boundaries in friendships

(Folded in from the run's pending log entry.)

- Deck slide 6 still had overlapping pathway outcome boxes after the permitted
  owner repair and confirmation round (`DECK-001`).
- Printable Chrome packages were unavailable, so differentiated worksheet HTML
  and the answer key were delivered without a PDF or page-fit verification.
  *Addressed 30 Aug 2026: the preflight was passed as `ready` on a guess; the
  playbook now names the exact preflight command and output-to-state mapping
  (`skills/make-lesson/playbook-lite.md`).*

## 2026-08-31 — Year 4 PSHE: What is a balanced diet and why does having one matter?

- The working-wall nutrient reference table could not fit its required body-job wording within the builder's fixed two-line A3 table-cell cap. The permitted focused repair found no in-scope JSON change; the wall was excluded while the deck and differentiated worksheets passed review.
  *Addressed 1 Sep 2026 with the 1 Sep working-wall entry below: this is the
  same fault in the table renderer. The refusal now names the offending cell,
  its length and its column's character budget, so a repair aims at a number
  instead of guessing (`working-wall-html/src/layout.js`).*
- The Below worksheet's first build overflowed two zones; changing only that sheet to a landscape four-quarter layout resolved the clipping. Visual review then replaced one short response rule with a full-width handwriting line and confirmed all three pupil sheets and the separate answer key.
  *No engine change 1 Sep 2026: the run's own repair budget resolved this and
  the sheets shipped. Nothing to fix upstream.*
- Deck slide 6 initially merged setup and pupil-task colour semantics; a focused repair separated black setup text from the house-blue task, and confirmation found no regression.
  *No engine change 1 Sep 2026: repaired in-run and confirmed.*

## 2026-09-01 — Year 4 PSHE: What is a balanced diet and why does having one matter?

- Compiling an adaptation-only supplemental picture manifest from the merged requirements snapshot succeeded, but `validate-image-scout.py manifest` rejected it because it compares against the full deterministic partition and has no expected-filename filter. The Below sheet was therefore omitted; the Expected worksheet and answer key still built.
  *Addressed 1 Sep 2026: this was not a one-lesson accident. The compile side
  could narrow a snapshot to the filenames a wave owns and the validator could
  not, so every supplemental wave was unvalidatable and every adaptation
  picture in every lesson was promised to a worksheet and never sourced. Both
  sides now share one selector (`select_expected` in
  `scripts/compile-picture-assignments.py`), the manifest subcommand takes the
  same `--expected-filename` list, and the playbook spells out the command
  rather than leaving its arguments to be guessed. Regression:
  `scripts/tests/test_supplemental_wave_manifest.py`.*
- A subsequent zero-photo `promote-used` receipt did not remove the now-unused adaptation photos from the canonical contract. Provenance succeeded against the immutable initial contract, which exactly matched the four published pictures.
  *Investigated 1 Sep 2026: not a fault, and it was downstream of the entry
  above. Retention is the safe rule: a promoted filename can already have been
  published, and dropping it from canonical would orphan a picture's
  provenance. The worksheet only stopped referencing those two photographs
  because the wave that should have sourced them could not run.*
- The working-wall A3 layout again failed its 36pt/two-line cap after the single permitted focused repair, so no wall PDF was delivered.
  *Addressed 1 Sep 2026: the refusal said only that something at the floor size
  was too long. It named no card, no item and no target, so the one permitted
  repair was a guess, and it guessed wrong twice. Reproduced from the run's own
  `working-wall.json`: the sticky card was three characters over budget. The
  autofit refusal now names the card, the item, its length and the exact
  character budget, and the designer is given the budgets up front
  (62 characters on a card with a picture, 106 without) rather than only the
  36pt floor. `working-wall-html/src/layout.js`, `agents/working-wall-designer.md`,
  `references/working-wall-preferences.md`; the numbers are pinned to the
  renderer by `working-wall-html/test/doc-claims.test.js`.*
- Stick-in support could not reproduce the photograph-plus-three-response lunch-review frame and was omitted rather than weakened.
  *Open 1 Sep 2026: confirmed genuine - the stick-in renderer carries a
  photograph only inside a `labelDiagram`, so a photograph above plain response
  lines has no piece to be. The designer's refusal to weaken the task was the
  right call. Adding that piece is a helper-builder job, not a repair, and is
  left as a deliberate choice rather than folded into this pass.*

## 2026-09-01 — Year 4 Maths: the helper-gap picture route was closed to maths

- A maths run stopped at the design gate with `LESSON_DESIGN_INVALID: Maths
  lesson-design may not define initial photo-### requirements`. The helper check
  had found a visual the engine could not draw; its documented rescue is the
  picture route, which adds a `controlled-ai` picture and re-runs the design
  validator. The validator refused it and pointed at "the helper check's
  substitute route" as the alternative - which is that same picture route. The
  lesson could neither add the picture nor pass the gate, and every maths lesson
  meeting a drawing gap would have stopped identically.
  *Addressed 1 Sep 2026: the ban is removed from `validate-lesson-design.py` and
  `lesson-design-scaffold.py`, and from the two references that stated it as
  fact. The teacher settled the question: maths can have photographs. What the
  ban was protecting is real and is kept, moved to where it can actually be
  seen: no subject photographs a tool the engine draws, stated in
  `lesson-designer.md` with the two legitimate maths cases named (a real-world
  referent, and a picture the rescue route produced), and checked in
  `design-reviewer.md`. The subject-name rule ("Maths", not "Mathematics")
  stays on its own account, for filing and routing. Regression:
  `scripts/tests/test_maths_helper_gap_has_an_exit.py`.*

## 2026-09-01 — Year 4 PSHE balanced diet: teacher review of the finished outputs

- Three `speech-bubbles-1` slides put the judging question in the left column
  with the claim it asks about in the bubble on the right, so a child met the
  question before its own subject.
  *Addressed 1 Sep 2026: the template hard-coded the statement to the left and
  offered no side at all, so no designer could have fixed it. `statementSide`
  (`left` default, `right` available) now exists on the whole speech-bubble
  family; `slide-speech-and-characters.md` says which shape takes which side,
  and `preferences.md` carries the general reading-order preference, stated as a
  preference rather than a rule because the teacher named cases where the other
  order is right. Regressions: `builder/test/statement-side.test.js` and
  `scripts/tests/test_reading_order_left_to_right.py`.*
  *Corrected same day, twice. The first wording said "the thing they read first
  goes left, and the question about it goes right", which the teacher rejected on
  reading it back: he did not want every question pushed right on every slide.
  The second wording fixed the mandate but still anchored the rule to columns.
  He then gave the principle himself: the rhythm is claim or teaching first,
  question second, and that "doesnt neccessarily mean left and right. It could
  be top then bottom" - the left-right habit is downstream of children accessing
  a slide from the top left, which is also why he puts success criteria on the
  right. The preference now names the scan path, says the order is what matters
  rather than the sides, and derives the success-criteria habit from it instead
  of stating it as a second convention.*
- The Expected worksheet put its three steps in a 30% left column, pushing the
  photograph and all three questions into the 70% beside them and leaving a tall
  empty band under four short lines.
  *Addressed 1 Sep 2026: `side-70-30` already existed, so this was guidance, not
  mechanism. The settled column rules said where a stimulus goes and what the
  other column is for, and never covered support material. `preferences.md`
  (Worksheets) and the worksheet designer now place steps, success criteria,
  word banks and reminders after the work in the reading order, with the
  discriminating exception for a step list a child works through before
  answering. First written as "the right-hand column, never the left"; softened
  at the teacher's request into the split that actually matches the evidence -
  the side is latitude (right, or a band below), while the top-left corner
  belonging to whatever the questions read from is not, because taking that
  corner is what broke the sheet.*
- `rep-001/body-jobs` was recorded as covered by `concept-map` and the deck
  shipped a hand-built lookalike; only the orchestrator's post-build delivery
  check caught it, costing a repair worker and a rebuild.
  *Addressed 1 Sep 2026: the check reads the specification only and never needed
  the build. `helper-check.json` is now an authoritative input to both the slide
  and worksheet designers, each runs the delivery check at its own gate, and each
  is told that a hand-built lookalike is not delivery and that a promised helper
  takes its layout before the rest of the slide. The orchestrator's check stays
  as the independent backstop. Regression:
  `scripts/tests/test_helper_delivery_at_the_designer_gate.py`.*

## 2026-09-01 — Year 4 Maths: reverse-boundary modelling before independence

- The first design required pupils to find 10 or 100 less across a thousand in independent work without first modelling the distinct reverse-exchange case.
  *Addressed in the lesson design: the non-boundary model was retained, while the boundary model now uses 2,005 to teach reverse exchange and placeholder zeros before related guided and independent questions. The independent design review then approved the sequence.*

## 2026-09-01 — Year 4 Maths: live place-value counters and exchanges

- The slide `place-value-chart` helper could label place-value rows but could not show grouped counters, live add/remove moves, or exchanges through empty columns while preserving zero placeholders and unsolved inverse equations.
  *The lesson used three controlled-AI picture substitutes and completed unharmed. A tested slide-only extension is waiting at `pending-helper/place-value-chart/` in the lesson working folder for visual review and `/install-helper`; it is not installed in the package.*

## 2026-09-01 — Year 4 Geography: terminal pictures and working-wall tile validation

- Four real-only photographs used by two `photoMapOverview` wall cards finished `unsatisfied`. The focused wall repair followed its documented exception and removed only those unavailable `photo` fields; `working-wall.json` still passed its design validation and repair-scope check, but the builder then failed because every tile of this card type requires a readable photo. The repair route therefore spent its only round on a state the validator accepted but the builder cannot render. The focused role and validator need the same per-card-type requirement as the builder, or the repair must replace/drop the complete affected tile rather than its photo field alone.
- The installed package root updated from 4.2.64 to 4.2.65 after the shared Chrome preflight. The new root had no local PDF packages, so the first worksheet build returned `PAGE_FIT_UNVERIFIED` despite the earlier `CHROME:` state. Running the new root's own preflight installed its dependencies and the one infrastructure retry passed. A root refresh should invalidate or repeat the printable preflight automatically.

## 2026-09-02 — Teacher review of the Year 4 maths and geography runs (4.2.65)

Both decks, both worksheets and the maths wall were rendered and read page by
page against the teacher's own list. What follows is what the evidence showed
and where each repair was made; every one has a regression test.

- A calculation split across two lines in a narrow card, so `2,648 + 10 =`
  reached a class as a stacked sum whose digits did not line up. The fit pass
  sizes text by total height and refuses a size only for a single over-wide
  word, so two lines were always the bigger font. *Calculations now join with
  no-break spaces and the measurer respects them, so a sum shrinks rather than
  wraps; ordinary words around it still wrap.*
- The `✓ Success Criteria` heading wrapped to two lines in a sidebar panel.
  *Same mechanism, same fix: the heading is one unbreakable line.*
- The board objective was rewritten rather than shortened: a plan's `To describe
  and give examples of a biome and find the location and some features of the
  Amazon rainforest` reached the class as `To describe and give examples of
  biomes, and locate and describe the Amazon rainforest`. The preference asked
  for "the shortest form that preserves the learning", which reads as licence to
  reword. *`displayedLo` must now be `lo` word for word or its opening with a
  tacked-on tail cut at a natural join, enforced by the design validator.*
- Every judged claim was wrong, and the child making it was called Dev in run
  after run: the designer's own rule named Dev, and every reference example used
  him. *The scaffold draws four plain first names at random per run, and the
  designer weighs a claim's truth by what the lesson needs children to reason
  about; at least one judged claim in a lesson is right.*
- Success-criteria steps were true statements about the method rather than the
  method in the order a child performs it. *The step-writing mechanics now say
  to carry out the worked example with the steps and check each one can be done
  when it appears.*
- Map annotation labels and clue markers were around 8pt on the board, markers
  were drawn on top of the answer labels, and a shaded region was a dense hatch
  that hid the country under it. *Labels and markers are sized to be read from
  the back of the room, a name label at a marker's own point replaces the letter
  instead of covering it, the label layout keeps clear of markers, and shading
  is a soft translucent wash.*
- Sticky knowledge rendered black, indistinguishable from teacher talk. *It
  takes the objective's purple, in both places it is drawn.*
- A whole card was painted house blue where it first told and then asked, hiding
  the question inside the instruction. *The slide-design check refuses a
  whole-blue block that both tells and asks, before the build runs.*
- Taught vocabulary was green only on its own card. *A term this lesson teaches
  is vocabulary green wherever a child reads it.*
- Photograph captions wrote out the evidence the child was meant to find, under
  a task that asked them to find it. *The picture-repair roles may re-point a
  dead reference at a published picture, never replace it with a sentence saying
  what it showed.*
- A map sat above an inch of background with the task above it at 14pt. *A stack
  now hands back the height its hugged items do not use, and the picture grows
  into it.*
- A stack item weighted 0.55 landed 0.055in under the card threshold and lost
  its white card while every other line on the slide had one. *A text block that
  measures shorter than its zone keeps its card at any height.*
- The worksheet's place-value counters wrapped two per row and spilled into the
  question: the column allowed half a millimetre for a border that costs 0.8mm.
  *The border is paid for in both the width and the measured height.*
- The worked example row of a recording table came out five times the height of
  the rows below it, because it was the only row without an explicit height in a
  table that stretches. *The height goes on every row. `number` is now a real
  writing size and an unknown one is refused rather than silently sized as a
  word.*
- The maths working wall was a sheet of words while three photographs of the
  very counters its worked example described sat published. The "every card
  carries a visual" rule was there, but its success-criteria exception and a
  "most maths cards should have photo: null" line let it through, and nothing
  deterministic checked. *`working-wall-packet.py check` refuses a wall whose
  cards carry no picture while the lesson holds one; the exception is narrowed
  to a lesson with no picture at all; the maths line is rewritten.*
- The geography wall's repair removed four unavailable tile photographs, passed
  its own checks, and then could not build. *The build checks every required
  photograph first and names each empty slot; the repair role now distinguishes
  a picture that supports words from one that is the content.*
- Six Wikimedia photographs finished `unsatisfied` while Commons held thousands
  of each. Commons matches all of a query's words, so five-to-nine-word queries
  returned zero, and only the top three of a ranked list were ever downloaded,
  which for a landscape query is three satellite images. *A fruitless query is
  retried with its descriptor words removed, the search looks at thirty
  candidates, and every candidate is recorded whether downloaded or not. Two
  biome archetypes were also contracted as `authentic-real`, which is for a
  place named as evidence; the designer's rule now separates the two.*
- The optional-drawing pass declined twelve slides as `full` with no measurement
  behind it, because the designer produced no `slide-room.json`. *The decorator
  renders the deck for its own pass, so it measures those pages itself.*
- A SharePoint sync failed with `WinError 32` on a run built directly in the
  destination folder. *A file already at its destination is left in place.*

Not repaired this pass, and worth knowing: a photograph sitting alone in a tall
template zone still leaves the space under it (the zone-fill advisory sees it,
nothing acts on it), and the pending `place-value-chart` and `map` helper
extensions are still waiting for `/install-helper`.

## 2026-09-02 — Year 4 Our PSHE rules
Run: output/working/year-4-pshe-our-pshe-rules.
Design review APPROVED after two bounded voice corrections: pupil -> child in starter; Be respectful matters -> Being respectful matters in spoken script.
Wall packet check accepted a 75-character reference-table cell, while the fixed A3 landscape build limited it to 74. Focused repair removed the final period; wall check and physical Visual QA then passed. Investigate parity between packet validation and fixed build capacity.
Full tagged obstacles: output/working/year-4-pshe-our-pshe-rules/friction.md.

## 2026-09-02 - Year 4 Maths Lesson 2: Represent 4-digit numbers

- Worksheet place-value-counter-chart hardcodes valued, differently coloured counters while this lesson requires identical plain circles. Initial helper coverage was incorrect. Five verified picture assets rescued Expected and Below. Pending extension: C:\Users\Daniel\Projects\lessonv4\output\working\year-4-maths-represent-4-digit-numbers\pending-helper\place-value-counter-chart (not installed; installation tests unproven).
- blank-surface offers number lines and bars, not a free drawing box; sort-grid supplied chart-drawing space and coverage was corrected.
- Opening-model slide exhausted three local layout passes. Focused repair moved sticky knowledge below wider success criteria, preserving full-width charts. Rendered inspection caught a wrapped 1,000 after deterministic fit had passed. Final 20-slide deck passed.
- A3 landscape workedExample wall overflowed by 0.1in at 36pt minimum. Portrait orientation preserved all content and passed physical-page QA.
- Automatic worker audit selected another task record; explicit current-session audit corrected it. Policy blocked transient cleanup, so evidence and previews remain.
- Full run evidence: C:\Users\Daniel\Projects\lessonv4\output\working\year-4-maths-represent-4-digit-numbers\run-report.md and friction.md.

### Repaired in 4.2.73

Four of the findings above were traced to their cause and closed, so a later run
does not re-diagnose them:

- The Your Turn questions shipping at 12pt were not a fit-pass failure. Question
  cards were sized from an average character width deliberately set *under* the
  real one, so the text box came out narrower than its own words and the fit pass
  shrank the question into it. Cards are now measured against the real Comic Sans
  advance widths (`builder/src/glyph-width.js`), and a short set in a wide,
  shallow zone lays out in full rows so the type takes the width as well as the
  height.
- The reference-only "My Turn" slide came from a split made without the splitting
  rules: a capacity finding routes the focused repair to sizing, and nothing sent
  it to the rule that forbids a reference-only interlude. The trigger now fires on
  the repair as well as the finding, and `TURN_SLIDE_WITHOUT_ITS_TURN` refuses a
  turn-labelled slide carrying no question, task or answer.
- The wall capacity mismatch this log asked about is not a parity bug: a card's
  budget depends on page, orientation, column widths and the readable floor, so
  it only exists once the pages are drawn. `working-wall-html/build.js
  --validate-only` runs those checks without writing a PDF, and both wall
  designers now run it before returning.
- The blocked transient cleanup is gone from the two design roles, which had no
  reason to be tidying a directory the run keeps anyway. The picture-work cleanup
  stays (a rainforest lesson's picture work ran to 330MB) and a policy refusal of
  it is no longer reported as friction.

## 2026-09-02 - Year 4 PSHE - Our PSHE Lessons

- Design review corrected two worksheet model answers: a made-up story using classmates' names should be explained as making classmates feel picked on, not assumed to disclose a true private story.
- Design review required separate pupil use of fictional stories, general questions and safety help. One redesign split the combined input into three checked steps while preserving the 45-minute lesson and 15-minute class-agreement task. Second review approved the result.


### Resource findings from the same PSHE run
- Slide Designer: colour checking treated Read and Do you agree as explanatory prose; unchanged sentences were separated into individually blue task objects.
- Slide Designer: the full-width lower zone rejected a success-criteria table through E-narrow classification; a full-body stack with equivalent proportions passed.
- Working Wall Designer: the checker rejected an empty wall allowed by the role, so it retained a right-to-pass reminder with an emoji. A no-required-picture lesson had acquired optional slide illustrations during the concurrent decoration pass.

## 2026-09-02 - Three slide faults from the PSHE deck, repaired in the engine

Reported by Daniel against `Our PSHE lessons.pptx`. All three are fixed at
source, so a future run does not need to re-diagnose them:

- **The word "Starter" disappeared from slide 1.** The starter header filled its
  heading slot from `heading`, then `title`, and only fell back to "Starter"
  when a deck offered neither - so a starter titled with a question lost the
  label and shrank the question into a four-inch bar. The heading is now always
  "Starter", drawn by the builder, and the slide's own prompt reads underneath it
  full width at slide-title size.
- **A text-heavy deck got no optional drawings at all.** `measure-slide-room.py`
  counted a card, its outline and its shadow as content, so three white cards
  reaching the margins measured as no room anywhere and the pass wrote `full`
  down the whole record. Occupied now means ink - words, figures, photographs -
  and the blank inside and between cards is room, which is exactly where a
  drawing belongs on a wall of text.
- **The one sticky-knowledge fact rendered red.** A `safety-warning` emphasis
  covering the whole statement painted over the purple the builder gives a
  sticky line. A whole-line emphasis on a sticky line is now refused by name;
  a span inside one still works.

Telling coloured blue also stands as a live risk rather than a fixed fault: the
mixed-block check only sees a blue block that both tells and asks, so splitting
the block into two blue objects gets past it. The discrimination now lives in
the visual profile's Semantic colour - blue is about what a child does *now, on
this slide*, and a rule of conduct phrased as an imperative is still telling.

## 2026-09-02 - Year 4 PSHE agreement
Run: C:/Users/Daniel/Projects/lessonv4/lesson-output/working/to-create-our-rse-and-pshe-agreement
Design review approved without corrections.
AGENT: lesson-designer | FRICTION: The guidance requested separately presentable actions, but the Task-Centred scaffold allowed only one task and one conclusion unit; I preserved the stages as explicit sequences for separate physical slides - run unharmed
AGENT: slide-designer | FRICTION: Expected inline blue spans to cross paragraph breaks, but they printed literally; separate spans per paragraph rendered correctly - run unharmed
AGENT: working-wall-designer | FRICTION: Expected both settled safety reminders to fit as wall cards; the help-seeking reminder exceeded the readable two-line limit, so it remains on the slides - run harmed: it is not on the working wall.

AGENT: delivery | FRICTION: The report parser split unquoted paths at spaces and the sync wrapper required a term-file argument alongside the resolved term; I quoted the report paths and supplied the term file, then both checks passed - run unharmed

### Addressed 2 September 2026

- **A blue span could not cross a paragraph break, and nothing caught it.**
  *Fixed in `answer-text.js`. The builder split text into lines first and only
  then looked for markers inside each line, so a span opening on one line and
  closing on the next matched nothing and printed its own `[[` and `]]` at the
  class. Markers are now scanned across the whole string, with each newline kept
  as its own base-colour run; `||` stays per line, because a field list must
  start each line back in the base colour. The safety net had the matching hole:
  a line break starts a new `<a:p>`, so the two halves reached the XML as
  separate runs, each holding one unpaired half, and unpaired is documented as
  deliberately literal. `verify-markers.js` now rejoins the runs within a shape
  before looking. A sort board carrying the split span built clean and said "No
  warnings" before this; it is now refused by name.*
- **A safety reminder was dropped from the wall for being eight characters too
  long.** *Fixed in the Working Wall Designer and its preferences. "Tell a
  trusted adult if you're worried about yourself or someone else." is 70
  characters against a 62-character card. Every route out was closed at once:
  sticky knowledge was "verbatim, everything else", only worked examples could
  be condensed, and the budget section's other escape - drop the card's picture
  for the wider 106-character width - is forbidden by the visual gate, which
  keeps a picture-less card off the wall entirely. Dropping the card was the
  only legal move left, so the agent was right and the rules were wrong. The
  verbatim rule now protects what a child checks board against wall (success
  criteria steps, reference columns, a misconception's Don't/Do pair) and
  releases free-standing prose nobody matches word for word - a modelled
  sentence, a sticky fact, a definition - to be condensed with its meaning and
  protections intact. Condensing is named as the first move when an item
  overruns, dropping the card as the last, and dropping the picture is struck off
  the list as the dead end it always was. The preferences table's "≤ 100
  characters" for a sticky item was the no-picture width and was quietly telling
  designers 70 was fine; it now reads 62. "Tell a trusted adult if you're worried
  about anyone." carries the same instruction and both reminders now fit.*
- **The report's path check named a fragment and not the fault.** *Fixed in
  `validate-run-report.py`. An unquoted path was split at its spaces, so the
  failure read `path does not exist: .../To` while the file sat there. It now
  says to wrap the path in backticks and why, when the bullet had no backticked
  path. The playbook says "each path in backticks" and `--term-file` in the sync
  call; the reasoning lives in the failure messages rather than in text every run
  loads, which kept the playbook under its size budget with more headroom than it
  started with.*
- **The task-centred stages were a route, not an obstacle.** *Noted in
  `teaching-sequence-task-centred.md`. Propose → combine → agree belongs in
  `launch.steps`, and the slide designer gives a stage that needs the board its
  own slide, which is what happened here on slides 12 to 14. The single
  `do-task` is deliberate - it keeps the doing reading as the centrepiece rather
  than fragmenting into short practice beats - so the scaffold is unchanged and
  the file now says this is the intended route.*

## 2026-09-02 - Year 4 History: continuities and changes in children's lives (4.2.82)

- **The Teach taught primary and secondary sources; the Do practised something
  else entirely.** *Fixed in `preferences.md` for every route. The lesson's
  first two pairs were strong - observation and deduction taught, then a fresh
  Roman carving to deduce from; continuity, change and comparing the same part
  of life taught, then a Tudor schoolroom to compare with the class's own room.
  The third pair broke. Its explanation defined a primary source, defined a
  secondary source, and said a later explanation helps interpret an older one;
  its Do asked whether one boy's portrait shows what he wore and what every
  Tudor child wore. That is a real, committed, whole-class task about the scope
  of a single source, and scope was never taught. Primary and secondary were
  never used. Every existing check passed it, because `Questioning is not doing`
  and the reviewer's bullet both ask whether the beat is a use at all, and this
  one was. The rhythm section now carries the pairing test as its own rule
  beside them - is it a use of `this`? - with the boundary that a Do may still
  carry earlier learning forward, and the reviewer's routing card opens the
  section for a mismatched pair rather than only for two teacher beats in a
  row.*
- **A Teach block's heading named one move while its teaching taught two
  others.** *Fixed in the same section. `headline`, `explanation` and the
  following Do are three fields, each true on its own, and nothing read them
  against each other, so `Ask what the source helps us find out` could sit above
  a definition of primary and secondary sources and look complete. The
  `One concept per Teach block` rule now says the three surfaces have to agree
  about what the one thing is, and to read them back to back.*
- **Nine new abstractions in forty-five minutes, and the vocabulary cap did not
  see them.** *Fixed in `How Much Fits in One Lesson`. Source, observation,
  deduction, continuity, change, primary, secondary and what one source cannot
  prove all arrived before the Roman, Tudor and Victorian content did. The set
  stayed inside five cards only because terms were paired onto them, which is
  the cap's own permitted move being used to hide the load. The section covered
  only the knowledge-plus-product kind of overload; it now names too many new
  ideas as the second kind, gives the measure as how many abstractions a child
  holds at once, and names both tells.*
- **The objective said children's lives; the lesson taught children's learning.**
  *Noted in the Lesson Designer's `Date + LO`. One thread taught properly is
  usually the better lesson and the objective is the teacher's to keep, so the
  answer is not to edit either. The designer now names in `flagsForTeacher`
  which strand the lesson covers and what the others would need, because the
  teacher assesses against the objective line and cannot see the narrowing from
  it.*

## 2026-09-02 - Year 4 History: no humour anywhere in the lesson (4.2.83)

- **Not one light line in the whole lesson, and nothing was ever asked to look
  for one.** *Fixed in `teacher-voice.md` §4, the Lesson Designer and the Design
  Reviewer. The teacher's report: "was any humour used in this lesson? could it
  have been? i havent seen one yet." The starter, seven scripts, the models and
  the ending were all correct and completely flat, while the material had handed
  over easy lines it walked past - a Tudor prince painted at about a year old in
  cloth of gold, and a Roman school carving. Two causes. §4 was never routed to
  the designer at all: the guide's numbered sections are routed by the kind of
  string being written (§5 a definition, §§1 and 3 a script, §8 a model answer),
  and a playful opportunity is not a kind of string, so it had no entry. And the
  one place the question did reach the designer was the ten-point pre-flight,
  run "over the same strings" - nine of those questions can be answered from one
  string and this one cannot, so asked sentence by sentence at the end of a long
  run it can only ever be answered no. The reviewer carried the same question
  inside the same per-string sweep. It is now asked once, of the lesson's
  material, at the completion pass, by both. Placement is left open: slide,
  script or both.*
- **The guidance would have made every lesson joke about the misconception.**
  *Fixed in the same section, before it shipped. §4 named the lesson's own
  misconception as the easiest opportunity and gave it the worked example, so the
  one route available in every lesson was also the most prominent, and routing
  the designer there would have produced a wry remark about the wrong answer in
  every deck. The teacher named it first: "dont always want it in
  misconceptions?" The section now leads with six routes and the misconception is
  last - the source or object in front of the class, a genuinely daft real fact,
  a person in a scenario, doing the thing wrong on purpose, lowering the stakes
  on something children over-polish, then the wrong idea. Each carries an example
  in the teacher's voice; the four he had already endorsed are kept and two are
  new. A new part says plainly that sameness across lessons is the failure while
  silence is not, and that a lesson handing over nothing keeps its straight face.
  The earlier repair that put the misconception route there in the first place is
  preserved intact, wording and all - it exists so that a lesson with dull
  content is not read as a lesson with no opportunities, and that is still true.*

## 2026-09-03 - Teacher review of the Year 4 maths run (4.2.84)

The teacher taught `Find 10 and 100 more or less` and abandoned the lesson on
its second slide of modelling, bringing out his own place-value chart instead.
Two of the three faults he named were already repaired by the rebuild of the
same lesson a version earlier; the third was the route's own settled shape.

- The modelling slide carried two questions and an AI-generated photograph of a
  chart with the first question's number already made, so nothing could be
  modelled on it and the picture served one of the two questions.
  *Already repaired before this review: the run had declared no representation
  at all, and the `place-value-chart` helper could not yet show counters or
  exchanges, so three controlled-AI substitutes stood in. The helper now carries
  counters, row labels and exchange cues, and the rebuild of this lesson selected
  `Live-complete helper` with the answer rows left blank and no photograph in the
  modelling at all.*
- The first thing modelled was crossing a hundred, with no plain case first.
  *Already repaired before this review by the design reviewer, which caught the
  missing non-boundary model and approved the corrected sequence. The rule it
  enforced ("the first example is a minimum-viable case") was present all along;
  what was missing was anything checking it.*
- The deck went My Turn (cross a hundred), My Turn (cross a thousand), one Our
  Turn, Your Turn. Children watched two different moves before practising
  either, and the plain case was modelled once and then met again only in
  independent work. Every check passed it, because the route authorised it
  outright: "one or more My Turn source units ... followed by at most one Our
  Turn". The general rhythm in `preferences.md` says the opposite in the same
  breath ("every My Turn ... is followed immediately by a beat that requires
  every child to use what they have just been told"), and skill-based lessons
  were reading their own line as a block-level exemption.
  *Addressed by restoring the previous plugin's shape, which handled extra cases
  as extra examples inside one My Turn rather than as extra My Turn slides. Three
  repairs: the rep-count default is back ("two for quick instances and one for
  lengthy ones", with the Our Turn answering the same number, and its limit named
  so it cannot become a quota); a concept now runs one or more My Turn plus Our
  Turn cycles before its single Your Turn, so a genuinely different move earns a
  cycle rather than a second My Turn beside the first; and the skill-based clause
  in the rhythm section now reads "the guided and independent practice that
  follows each modelled move, never as one block of practice at the end of several
  models". `validate-lesson-design.py` refuses two My Turn units in a row for the
  same concept, and its message names the fix. The coverage rule keeps its
  requirement that every distinct case is modelled and now says how to reach an
  unmodelled one.*
  *One control was not sufficient on its own. Moving examples inside a unit opens
  a second route to the same board: a unit whose examples cannot share one visual
  will not fit one slide, and the composition rules then split it into two
  consecutive My Turn slides, which is the fault again with the design check
  passing. The slide check now refuses a second consecutive My Turn slide
  (`MODELLING_RUNS_WITHOUT_A_TURN_FOR_THE_CLASS`) before the builder runs, and
  the split rule in `slide-composition-playbook.md` names a My Turn as the one
  beat a split may not reach, sending the repair back to the teaching sequence
  rather than to another layout attempt. An answer or reveal slide after a My
  Turn is excluded, and a My Turn followed by its Our Turn is the discrimination
  case both suites test. Regressions:
  `scripts/tests/test_a_my_turn_is_used_before_the_next_is_taught.py` and three
  cases in `builder/test/slide-design-check.test.js`.*
- The two modelled examples were an inverse pair: `1,390 + 10 =` then
  `1,400 - 10 =`, so the second question asked the class to find 1,390, already
  printed above it as the first question's starting number. The pair looked like
  two worked examples and demonstrated one instance run forwards then backwards,
  and nothing in the route covered it: the spoiler audit existed only for a
  bounded attempt.
  *Addressed beside the rule that owns example choice, where holding the starting
  number still already prevents it, rather than as a rule of its own. The
  paragraph now names the failure, generalises it past arithmetic to any
  reversible move, and carries its limit: a deliberate inverse demonstration
  (counting back returns the number you started with, checking by the inverse
  operation) is legitimate and the script says so. No deterministic check was
  added: the only slide type where the fault appeared is the one where the
  reversal can be the teaching point, so a check would have to misfire on the
  legitimate case to catch the reported one. Regression: four assertions in
  `scripts/tests/test_a_my_turn_is_used_before_the_next_is_taught.py`.*
- Not changed, deliberately: the splitting-axis rules already refuse a concept
  split on the directional fork, so `+10`, `-10`, `+100`, `-100` cannot become
  four rounds of their own; and the reviewer gains no new clause, because the
  structural half is now a deterministic check and the judgement half (whether a
  quick move got its second example) belongs to the one rule that owns it.

## 2026-09-03 - Year 4 History Lesson 1: childhood continuity and change

- Design review approved the lesson after correcting child-facing date punctuation and a stale design-decisions line so the paired comparison matches the canonical tutor-and-class task.
- The selected official museum/archive sources have exact URLs, but the compiled picture route searches Wikimedia and has returned five of six requirements unsatisfied. Authentic evidence selected in pedagogy is therefore unavailable to resource builds; no synthetic substitute was authorised.
- Adaptation reused existing photograph filenames with new adaptation IDs, and build-provisional rejected the duplicate filename identities. The required fallback preserves the Expected sheet but omits the supported version.
- Run evidence: C:/Users/Daniel/Projects/lessonv4/output/working/childrens-lives-continuity-and-change/friction.md.
- Final result: one validated A3 wall PDF delivered and synced. Slide and worksheet owner repairs could not preserve the tasks with only the portrait available. The run is BLOCKED; nine slides lack evidence and no worksheet/answer key was built. The slide wrapper also misdecoded the curly apostrophe in the output name.

## 2026-09-03 - Year 4 Maths Lesson 2: represent 4-digit numbers

- The installed worksheet `place-value-counter-chart` renders coloured, value-labelled counters, while the approved lesson required identical plain counters whose value comes only from position. A pending helper drop-in now adds the missing slide modes, but worksheet parity still needs a compact plain-counter variant.
- The original Expected worksheet contract exceeded one A4 portrait page by 76 mm. The content-gap rescue preserved the four two-way build/read performances and removed only the eight-counter extension task; that reasoning remains in the lesson's final comparison task and is flagged for the teacher.
- Two initial controlled-AI slide visuals ended unsatisfied. Focused slide repair replaced both with exact live counter-chart compositions and preserved all 13 slides; two other generated slide visuals published successfully.
- The first wall build exposed overlapping long column headings. A focused repair changed only the wall chart labels to Th/H/T/O, and the one-card A3 rebuild passed visual QA.
- Run evidence: C:/Users/Daniel/Projects/lessonv4/output/working/year-4-maths-lesson-2/friction.md.
- Final result: 13-slide PowerPoint, three-level worksheet PDF with separate answer key, and one-page working wall built. Stick-in sheets were not needed.

## 2026-09-04 - Year 4 Maths Lesson 3: partition 4-digit numbers

- The installed slide `part-whole-model` helper supports only two or three linked parts, while the lesson required exactly four ordered place-value parts. A controlled generated teaching diagram supplied this run, and a tested pending helper growth is waiting under the run's `pending-helper/part-whole-model` folder for later installation.
- The worksheet builder corrected a 2 mm browser-measured zone difference on the Below sheet without changing its content; both worksheet pages then passed the fixed build.
- Run evidence: C:/Users/Daniel/Projects/lessonv4/lesson-output/working/year-4-maths-lesson-3/friction.md.
- Final result: 10-slide PowerPoint, Below and Expected worksheet PDF with separate answer key, and one-page working wall built. Stick-in sheets were not needed.

## 2026-09-04 - Year 4 History Lesson 1: source evidence and continuity/change

- The British Museum horn-book endpoint failed TLS verification twice, so the authentic object ended terminally unsatisfied. A focused content-gap design revision removed that dependency and preserved the objective through four published Victorian archive sources; synthetic historical evidence was not used.
- The first slide specification exhausted its three self-repair passes on six layout and compatibility diagnostics. Focused repair cleared all six, and the post-revision slide design passed with 19 slides.
- Picture provenance could not use the revised four-picture contract because the surviving terminal receipts were tied to the immutable five-picture Phase 2 snapshot. Provenance completed against that snapshot, retaining the unused unsatisfied receipt and proving all four published sources.
- Run evidence: C:/Users/Daniel/Projects/lessonv4/output/working/to-identify-the-continuities-and-changes-to-children-s-lives-using-a-range-of-sources/friction.md.
- Final result: 19-slide PowerPoint, three-level worksheet PDF with separate answer key, and two-page working wall built. Stick-in sheets were not needed.

## 2026-09-04 - Teacher review of the Year 4 History run (4.2.95): "I will 100% NOT BE USING THIS LESSON"

The third run of the same objective in three days, and the teacher refused
the deck by slide 9: the voice was "Year 10, not Year 4", the lesson was "a
teacher talking nonsense" about sources, the timeline was "what is that
table!", and a photograph children were told to look closely at was two
inches wide beside five inches of empty slide. The teacher then described the
lesson he would build (the 1897 classroom first and "what do you notice?",
the words continuity and change given after the noticing and attached to it,
a second source adding real knowledge, the limit of one source arriving as a
question the class can now answer, an adapted Bridget Kelpin extract, a
two-column task, "has school completely changed?"), and that sketch is now the
history file's calibration. What follows is what the evidence showed.

- **The lesson was built around a rule about sources, not around Victorian
  children.** The decisions record opened "because the lesson helps them stop
  treating one source as a complete picture", every Teach headline was a
  method rule (`Put each source in time`, `One source is one piece`, `Compare
  the same part of life`), the "can't prove" question sat on 7 of 19 slides
  and its sticky fact on 5, and no slide told the class what a school of
  industry or a workhouse school was. The 2 September review had logged the
  same family (nine abstractions, lives versus learning) and the rules added
  then were obeyed in letter. *The shape, not another rule, is changed:
  `subject-history.md` opens with what the lesson feels like to the child and
  owns the spine for history (a chunk is a piece of the past; the historian's
  move is taught inside the beat that needs it, once, where the knowledge
  makes it mean something); the content-based sequence file and the rhythm
  section in `preferences.md` say a chunk is knowledge and hand the
  definition of "the one thing" to the subject file; the Lesson Designer's
  sticking-point bullet and decisions-record opening sentence no longer force
  a misconception spine on a knowledge subject; the reviewer's learning
  contract reads the Teach headlines in order as the subject file's own test.*
- **The vocabulary came before the meaning.** *`vocabularyPlacement` (null, or
  `after` a unit) lets the single vocabulary slide follow the first noticing
  beat; the validator, scaffold, review view, slide designer and composition
  playbook carry it; `preferences.md` → Vocabulary and the designer's
  placement paragraph say why.* **Superseded 5 September 2026** by
  `vocabularyIntroductions`: one slide holding every word could only ever be in
  one place, and a lesson needs a prerequisite word before an instruction AND a
  contrasting pair after the noticing, in the same lesson.*
- **Nobody heard the words as a child.** `What does one visible detail suggest
  about this class?`, `Which parts of the timetable support the claim about
  this school's week?`: grammatical, contracted, and planning nouns all the
  way through. The reviewer returned in three minutes with `Corrections made:
  None.`, reading every string inside JSON braces beside its field name.
  *The review view now opens with `As the class meets it`, every child-facing
  and spoken string as plain text in lesson order with its count; the
  reviewer reads that first as the year group's child, the planning-noun miss
  leads its list of misses, and the report carries a `## Voice sweep` line
  whose count the packet verify checks against the view, so a skipped sweep
  no longer looks like a clean one.*
- **The delivered lesson was never reviewed.** The reviewer approved a
  hornbook-plus-Victorian design; the hornbook picture failed, a content-gap
  revision removed the Tudor strand and rewrote the model and Do beats, and
  the route sent it straight to the slide designer. The ordering beat it left
  behind had two dates from one period printed in order. *The content-gap
  wave now briefs the revision to find another sound route rather than the
  smallest deletion, to re-judge every beat that leaned on the lost source,
  and to go back through Phase 1.25 before anything is built.*
- **The timeline was a table.** No slide helper drew one; the helper check
  recorded `covered` by `table`, and `not to scale` became a column heading
  three times. *A `timeline` slide helper now exists (eras as bands, marks at
  designer-set fractions, optional note and caption, parity declared with the
  worksheet's), `check-helper-coverage.py verdict` refuses a lookalike key for
  a named figure, and the playbook's `covered` bullet says so.*
- **The photograph children were told to look closely at was the smallest
  thing on its slide.** Three causes. The picture floor was 1.6" on the cell's
  short side, so a two-inch photo passed; the slide designer was told to give
  a promised helper layout priority, so an empty four-column table took the
  width on five slides; and the file itself was a 400 by 332 pixel preview
  the scout recorded and accepted. *The floor is tiered by how many pictures
  children work from share the slide (3.0" alone, 2.2" for two, 1.6" for
  three or more), the helper-priority clause stops at the source a frame
  records from, the scout judges resolution against the job and searches
  past a viewer's preview, the finaliser prints `PICTURE_LOW_RESOLUTION:` and
  the playbook carries it to the teacher as a flag.*
- **Unreadable evidence had nowhere to go.** The design asked the picture
  stage for "a readable transcript", which the scout cannot supply, and a
  page of Victorian handwriting reached the board with "find a detail".
  *The history file says the adapted extract is content the designer writes
  (`teachingText` or the worksheet stimulus) with the original small beside
  it; a **read-from moment** (detail the board cannot show large enough)
  earns a printed `source-copy` stick-in piece, defined in
  `stick-in-sheets-pedagogy.md` and the designer's Printed extras, and the
  stick-in engine now prints one.*
- **An empty four-question frame was the "live-complete helper".** The
  headings were the method's steps, the completed row lived only in the
  notes, and a PowerPoint table cannot be typed into during a show.
  *`modelling-formats.md` says a frame is built from the class's own
  questions with its first row filled, and the completed state reaches the
  board (an `answer-slide` drawn into the frame) where it cannot be drawn
  live.*
- **Both ordering tasks were printed in answer order, and the starter's title
  was a question.** *`validate-lesson-design.py` refuses a datable option
  bank or starter list printed in ascending or descending order (years,
  "years ago", named British periods); the designer's naming rule says a
  starter label names what is remembered, never a question.*
- Not changed, deliberately: the rhythm, the sticking-point machinery and the
  reviewer's material-defect boundary all stay, because they are right for
  maths and the fault was that nothing let the subject file override the
  shape; and the reviewer stays on the same model for now, because the
  teacher's own accurate reviewer is a chat thread that holds his correction
  history, and the closest thing this pipeline can do is put the plain words
  in front of the reviewer and make it prove the sweep happened.
# 5 September 2026 — supervised completion after independent audit

Evidence: `output/codex-completion-2026-09-05/STATUS.md`, delivery index, per-package run reports, actual page renders and final test logs. This entry supplements the historical trial reports; it does not erase failed attempts.

- The maths general answer rule was incomplete: zero tens alone admits 5,004, whose subtraction changes three digits. The repaired rule also requires nonzero hundreds; all 9,000 four-digit inputs were checked. Review and adaptation guidance now require the complete acceptance condition, not just a successful example.
- The history legal claim and photograph interpretations, and the diet nutrient/group conflation, survived prior reviews. Existing review now explicitly checks the factual premise against the stimulus. Owning designs and affected answers/resources were repaired and independently re-reviewed.
- A material Expected maths support omission had been acknowledged in notes but not resolved. The playbook now routes such gaps to the existing owner before marking a branch complete. The Expected working chart is delivered.
- The chart's narrowest-width minimum height disagreed with its actual wide rendering. Actual allocated width now reaches measurement through the helper registry and nested composition; narrow and insufficient-height rejection remain tested.
- Discovery exhausted its two allowed image calls without satisfying comparison geometry. The owner replaced the teaching representation with a shared precise native visual and obtained review. The terminal failed photograph remains in the immutable history. Post-freeze review validates the frozen receipt and current references; reporting distinguishes a reviewed retired picture from a still-required missing picture. Missing history and stale-review cases still fail.
- The balanced diet plate already existed but lacked wall wiring. It now uses the same shared visual there, with parity tests. The final reference-table PDF exposed a separate measurement/render mismatch: the checker reserved a 1.4-inch title but the 96pt title and padding needed 2 inches. Shared line-height/padding measurement now rejects the clipped landscape layout and supports measured portrait cells at the 36pt floor. The exact slide lookup table also contradicted a blanket picture requirement: the guard now recognises an exact matching teaching table as its own visual support; altered/invented tables do not gain that exception. Focused regressions cover both mechanisms.
- Actual final slide reading caught a cramped diagram, a starter-box overflow, a false statement under an ambiguous heading, and decorative wind images reinforcing the misconception. Bounded slide-owner repairs preserved teaching content. Existing would-mislead guidance already covers the decoration failure; no duplicate rule was added. A reported diet worksheet header fault did not reproduce in the final PDF, so no speculative renderer change was made.
- Acceptance limit: these are supervised repairs, not clean unattended repeat passes. Tests and worker completion markers alone did not establish teachability. Deep free-writing stick-in cells and standalone piece preview remain deferred; the delivered short-response slips do not require those features.

# 5 September 2026 - Partition 4-digit numbers lesson review

- The independent design review replaced the formal instruction `Then check whether each place in the whole number is still accounted for.` with the clearer Year 4 teacher wording `Then check you haven't missed a column.` The mathematical check was preserved and the revised design revalidated.

# 6 September 2026 - Describe teeth and their uses lesson review

- The supplied supporting statement that premolars guide food to molars was corrected to the more accurate Year 4 explanation that premolars crush and begin grinding food.
- The final square-ish tooth images exposed a slide-readable-floor failure that was invisible before publication; a focused layout repair enlarged the canine image without changing lesson content.
- The designed four-image evidence-card task earns a write-on aid pedagogically, but the current stick-in renderer cannot reproduce its repeated picture-plus-two-response-field structure. The sheet was honestly omitted instead of substituted with a misleading layout.

# 6 September 2026 - Children's lives continuity and change lesson review

- The initial authentic museum toy choice had no verified reusable image route. Independent review caught it before rendering; redesign selected London Museum toy jug 98.2/163 under CC BY-NC 4.0 and revised the visible comparison to its surviving body, open mouth and missing handle.
- Clearing four slide height diagnostics exposed a separate `TEXT_OVERLOAD` on an earlier slide. A distinct focused repair preserved all teaching content and reached `SLIDE_DESIGN_CHECK_OK: 19 slides`, showing that deterministic slide checks can reveal faults sequentially after layout changes.
- The expected worksheet remained 20px too tall after its one permitted focused repair (`lines: 5 → 4`); the h-stack allocation grew with the change and the same overlap persisted. The worksheet was excluded rather than released with overlapping print content. This is evidence that reducing a nested response-line count is not a reliable fit lever for that h-stack layout.

# 8 September 2026 - Represent and estimate on a number line lesson review

- The stick-in surface had no live number-line helper, although slides and worksheets did. The run used three exact controlled printable figures and left a complete `number-line` stick-in extension in the run's `pending-helper` folder for later installation and visual regression testing.
- The local render probe found PDF rendering but no PPTX route despite a successful fixed deck build. Worksheets, stick-ins and the working wall passed page-level review; the deck remained explicitly unverified rather than inheriting a visual pass from its JSON and build checks.
- The axis numerals on the board came out at roughly half the size of the words beside them, from two independent causes. Every axis label was drawn in one fixed 0.55in box, so a numeral's rendered size tracked its DIGIT COUNT: "0" printed full size and "10,000" was shrunk by the fit pass to fit a box it overhung. On a Year 4 four-digit deck that is every number on every line. Separately, a stacked line claimed a flat 2.00in of height whether or not it carried an arrow or an answer, so three lines "needed" 6in and everything in a 3.3in zone was scaled to 54% together - numerals, arrowheads, dots and ticks. A previous repair had raised the font ceiling from 14pt to 24pt and changed almost nothing, because the ceiling was never the binding constraint. The slide renderer now measures each label with the existing shared glyph-width table, insets the axis so the end labels sit inside the zone at full size, charges a line only for the bands it actually carries, and holds the numerals to a 14pt floor by taking a deep stack's room out of the arrows and ticks instead. Eight of the deck's eleven lines now draw at the full 24pt; the worst three-line stack draws at 15.9pt against an effective 11-13pt before. The printable `number-line-svg` helper already measured honestly and insets its axis, so the fault was confined to the slide renderer. Seven focused regressions pin both causes, the floor, and the one case that should still shrink a numeral - a genuinely crowded axis.
- The render probe that reported no PPTX route was a false negative, not a machine limitation: re-probing the same machine found a working PowerPoint route immediately, and the run had in fact already rendered all fifteen slide pages ten minutes before the final review declared them unrenderable. The reviewer read `render-route.json` and stopped, while a current page manifest sat beside it. A deck therefore shipped UNVERIFIED with its evidence already on disk.

# 9 September 2026 - Compare 4-digit numbers lesson review

- Three successive Slide Designer launches were reported as infrastructure stalls and killed. None of them had stalled. Each was iterating on a complete 13-slide candidate in `lesson.json.tmp.[ATTEMPT_ID]`, exactly where its role file says a candidate lives; the orchestrator judged liveness from `lesson.json` and `slide-room.json`, which the same role file writes only at the final promote. An untouched owned output is what a healthy Slide Designer run looks like for almost its whole length, so a working worker and a dead one were indistinguishable by the evidence being read. The playbook now says to judge a worker by any recent change anywhere in `[WORKING_DIR]`, temporary and attempt-suffixed files included, and carries the earlier stale-route-file case as the same class of mistake. This is the second logged run lost to reading a stale file while the current one sat beside it.
- The fault the workers were actually stuck on was a single `STEP_TEXT_OVERLOAD` on slide 6. The design authored five success-criteria steps plus one sticky fact, and `slide-success-criteria.md` makes folding the sticky fact into the criteria panel the default, so the panel carried six items. `steps.js` shared the panel height equally by item COUNT: the sticky sentence wrapped to three lines and needed 0.96in inside the 0.83in an equal share gave it, while each one-line imperative step sat in the same 0.83in needing 0.32in. The refusal was correct and the room was there all along, just allocated to the items that did not need it. Rows are now equal whenever equal rows fit, so every panel that built before builds identically; only when an item cannot hold its equal share does a reference take the height its sentence needs and the numbered steps share the rest, staying one set at one size. Slide 6 draws five 22pt steps and the sticky line at 18pt where it previously refused the whole deck.
- The refusal also named the wrong thing. It reported "step 6" on a panel that visibly numbers five steps and marks the sixth item with a star, sending the reader after a step that is not on the slide. Worse, it prescribed the one repair the Slide Designer is forbidden to make: a sticky fact is source-authored wording nobody downstream may shorten, so the worker was told to do the one thing its own authority rules refuse. The message now distinguishes a reference line from a step and points at the repairs its owner can actually make.
- Acceptance limit: the run's remaining slack was not chased. Slides 10 and 11 carry a blank single-row place-value grid the design asked for as `blank-reference`, and slide 10 has visible empty room the optional-drawings pass would normally fill. That pass was not run, and the deck ships without it rather than with a fabricated visual.

# 9 September 2026 - Compare 4-digit numbers, second look

- The teacher looked at the delivered deck and said the comparison slides were too small and horrible. He was right, and the deck had reached him without ever being looked at: the Slide Designer's composition pass, which renders the pages and repairs the layout before promoting, never ran, because its workers were killed. The candidate was promoted straight from its attempt file. Deterministic checks all passed, which is exactly the gap - they measure whether content fits, not whether the page is worth showing a class.
- Every place value chart in the deck drew at exactly 1.07in whatever it was given: 1.41in, 2.17in and 2.66in zones all produced the same chart. The scale was bounded by `regColW / 0.45`, pricing the chart against a fixed reference column rather than against what its digits actually need. On a four-column chart in a 2.6in zone that held 18pt digits inside 0.44in columns that could carry three times that, and the chart used 49% of the height its template had deliberately set aside. The bound is now measured with the shared glyph table, the same move the number-line repair made in 4.2.114. The same charts now draw at 1.74in, and the slide-7 pair fills its zone completely.
- The row label was the hidden second cause. A label is a whole numeral in a column priced at 1.55 digits, so it is always the widest text in the chart; letting it ride the chart's scale meant the longest label decided how big the DIGITS were. Labels now fit their own column, floored so they stay readable, exactly as the column headings already did.
- The comparison ring between two charts was a `○` typed into a text item at a hand-picked 44pt. That inherits a text item's full-height card, so the ring sat in a tall white pill aligned with nothing, and once the charts grew it looked worse still. Added `comparison-slot`: a round slot sized from the room it is given, painting its own surface, with an optional `answer` that prints inside the same ring so a reveal reads as the question plus one thing. Documented in templates.md §5 and §4 so designs reach for it instead of typing a circle.
- Acceptance limit: the optional-drawings pass still has not run on this deck, and slides 10 and 11 keep the blank single-row reference grid the design asked for. Two doc-claims tests were already failing before this work and are untouched.

# 9 September 2026 - Compare 4-digit numbers, third look

- The teacher rebuilt slide 4 by hand and saved it over the deck, as the standard to match. His version differed in exactly three ways: the task printed at 48pt in a 1.91in box rather than 19pt in a 0.70in one, the Th/H/T/O key moved from directly under the task to the foot of the slide, and everything else stayed where it was. The charts and the ring he left alone, which is the useful signal: the 4.2.117 helper work was right, and what remained wrong was the SPACE around it.
- The task printed at 19pt because `measureQuestionsHeight` counted wrapped characters and never split on the line breaks the question was written with. A comparison task written as a heading and two pairs is three short lines and about thirty characters, so the measure said one line, the box was built one line tall, and the fit pass then shrank 28pt type to force three lines into it. Every multi-line question on every maths slide was being sized for a single line and then squeezed, and the longer the task the smaller it printed. The steps helper had counted breaks correctly all along; the question measure now does the same. Single-line tasks measure to the same 0.698in as before, so slides that were already right do not move.
- That still left a band of empty board. Handing the question's spare height DOWN to the visual was already implemented and is half the story: every visual stops growing somewhere, so when the diagram is smaller than the room below it the difference just sits there. The missing half was that a layout container could not say how much of its zone it wanted - `MEASURE` covered leaf helpers only, so a row inside a stack always kept its full weighted share however little it held. Added `measureCompositionExtent`, which answers for `stack` and `row` by recursion, and `maths-turn-sc` now spends what the visual will not use on the task, which is the one thing on the slide read from the back of the room. A composition holding anything unmeasurable declines to answer, so nothing moves where the engine cannot see.
- Deliberately kept separate from `measureContentExtent`. That one answers the narrower "should this card hug its content?", and the card look and the stack reflow are both tuned against its current answers: teaching it about containers broke a real guard where a fill text keeps its whole zone precisely BECAUSE its stack partner cannot be measured. Same question, two audiences, two functions.
- Result on the rebuilt deck: slides 4 and 8 print their tasks at 48pt because their visuals leave room; 5, 6, 7, 9, 10 and 11 keep the ordinary 28pt because theirs do not. Content decides, not a rule about comparison slides. Slide 4 now matches the teacher's hand-built version at 48pt in a 1.91in box.
- The key's position was the one thing not fixed in code, because it is a composition decision rather than a measurement: guidance now says a key, legend or units line explains the thing beside it and belongs after it, small, since whatever sits directly under the task is what a child looks at next.
- Acceptance limit: the teacher's hand-built file is kept beside the deck as `Compare 4-digit numbers (Daniel's edit).pptx`. The optional-drawings pass still has not run. Two doc-claims tests were already failing before any of this work.

# 9 September 2026 - Compare 4-digit numbers, fourth look

- The teacher's next note was that the gap between each place-value chart and the comparison ring was too wide, and that closing it would let the charts print bigger. Same fault as the two before it, one dimension over: a row shares its width by COUNTING items. The ring took a third of the row and drew at well under half of it, so the charts either side were held to two thirds of the width they could have had, and the digits a class reads from the carpet came out smaller to leave a gap around a ring that never wanted the room.
- A row now shares width the way a stack already shared height: helpers that genuinely stop growing declare a maximum useful width, the row narrows them to it, and the released width goes to the items that keep taking whatever they are given. `comparison-slot` is the first and so far only declaration; everything else returns null and behaves exactly as before, and a row with nothing to give the width to is left untouched rather than turning a gap between items into a gap at the edge. The row's own measure shares width the same way, so a card still hugs the box its content actually drew in.
- Chart zones on the comparison deck went from 2.60in to 3.19in, a 23% gain taken entirely from space nothing was using.
- Three faults, three days apart in the same deck, all the same shape: room handed out by counting things rather than by what those things can use. Height in a success-criteria panel (4.2.116), height in a chart against its zone (4.2.117), height in a stack whose container could not report its appetite (4.2.118), and now width in a row. Worth treating "shared out by count" as a smell in its own right when the next layout complaint arrives.
- Acceptance limit: the chart's own scale ceiling of 1.7 is now what binds on the roomiest slides rather than the space available, so a chart in a very large zone still stops short of filling it. Left alone deliberately: nothing in this deck needed it, and raising a ceiling that every chart in every lesson shares wants its own evidence.

- Follow-up to the four looks above: the mechanism was in the code but nowhere in the guidance, so the next helper would have been built without it and the next designer would have hand-tuned a font to work around it. `helper-authoring.md` now carries "Say how much room you can use" beside the existing no-deadspace principle - the two are the same idea at different scales, one about the ink inside the box and one about the box - naming the measure and the maximum-useful-width declarations and warning that a wrong cap is worse than no cap, since it shrinks a figure that wanted the room and nothing downstream can tell. `slide-visual-sizing.md` now tells the Slide Designer that room is shared by appetite rather than by count, that hand-picking a font size to compensate for a layout opts the element out of every one of those mechanisms, and that a band of nothing on a slide is the signal to go looking for room shared out by counting. Both files are already required reading for the agents that need them.

## 2026-09-09 - Year 4 RE: To explain what the Christmas celebrations or holidays mean to me

*Built by lesson-v4 4.2.120.*


- The Working Wall Designer contract permits cards: [], while its required packet checker rejects an empty card set; align the checker with the documented valid no-wall outcome.

# 9 September 2026 - Slides with nothing to look at

- The teacher opened the Year 4 RE Christmas deck and said the teaching slides had no visuals: nothing to point at while he talked, nothing for children to relate to or ask about. Slide 3 taught that Christmas has a Christian meaning with no nativity, no church, no Bible, no carol service on the board. The deck's picture contract was an empty `photos` array: not a search that failed, a request never made.
- Measured across the eleven most recent decks (176 slides): 64 slides carry a photograph, 55 an engine-drawn visual, 11 a cartoon character, 15 only a faded corner drawing, and 31 nothing at all. The concentration is subject-shaped - geography, history and maths decks lose one or two slides each, while RE and PSHE lose four to six out of twelve or thirteen - but the cause is not the subject, and the teacher was right to reject that framing. Geography escapes by luck: its content happens to be things a camera can point at, so an evidence-shaped test says yes. RE and PSHE fail the same test with the same rule because their content is belief, feeling, rule and relationship.
- The rule was the wrong test rather than a missing one. Every picture instruction in the package is evidence-shaped (`load_bearing_evidence`, `teaching_requirement`, "the visible feature that carries the learning"), so the question being asked was whether a child could work the learning out from the picture. The RE design wrote its own refusal down in `slideDesignNotes`: "personal meaning and belief cannot be inferred from the appearance of a celebration". That is true, and it holds the picture to a standard the sentence beside it never sits - "Christians believe Jesus is God's Son" is told to a class, not deduced by them, and the photograph would have been told to them the same way. `Lesson Designer visual-need boundary` now leads with the referent test (does this slide name something that exists in the world?) and states its own limit, so a task slide, a criteria slide and a slide about the previous slide are all still right to carry nothing. The three limits that already worked are named as still winning: answer-giving pictures refused, engine-drawn tools drawn rather than photographed, text as the teaching object where text is what children study.
- The vocabulary card is the one slide that was bare in all eleven decks, every subject included. The 8 September rule that every card carries a visual had exactly one deck built after it and lost 3-0: `belief`, `celebration` and `tradition` all went out as `kind: none`. `belief` was right; a family round a table is a celebration and singing the same carol each year is a tradition. The tell is a whole set answered `none` together, which is the set being judged as a group, and the Vocabulary rule now says to decide one word at a time by naming what a camera could point at.
- Nothing checked any of this. The Design Reviewer's routing card carried twenty preference sections and `Lesson Designer visual-need boundary` was not among them, so the one rule naming RE and PSHE by name was never read by a reviewer. `A Picture Beside a Word` was routed but its trigger - "when a vocabulary image may not carry the intended meaning" - cannot fire on absence, which is the failure that actually happens; the file's own comment about triggers needing to be visible before the judgement had already caught this shape once. Both triggers now fire on what the view shows on its face. The final resource review passed all thirteen slides with no findings because it asks whether text is readable, whether the task has its referent and whether there is room to write, never whether the page is worth looking at.
- The picture-contract section of the Lesson Designer was the residual path: it is where the picture list is actually settled, it routes to nothing about whether a picture is wanted, and its own fields imply the evidence test. It now reads the boundary section at that point and flags an empty `photos` array as the result to check hardest.
- `subject-re.md` gains a depiction boundary, which was safe to omit only while RE never asked for pictures. Christian art depicts Jesus freely; Islam does not depict Muhammad, and no lesson may request such a picture. Where a tradition's rule is unclear, request the place, object, text or practice rather than the figure.
- Acceptance limit: no lesson has been rebuilt against these changes. The claim is a reliability improvement in a judgement, not a guarantee - none of it is enforced deterministically, and a designer can still answer the referent test with "nothing" on a slide that names a church. The rerun to do first is the same Year 4 RE Christmas lesson, checking slides 3, 4 and 6 and all three vocabulary words.

## 2026-09-09 - Year 4 Maths: Order 4-digit numbers

*Built by lesson-v4 4.2.124.*


- Lesson Designer guidance places orientation before the starter script, while validate-lesson-design requires the starter script to begin with Say to children; the run preserved orientation in teacherOrientation.

## 2026-09-14 - Year 4 History: To explain why Tudor children worked

*Built by lesson-v4 4.2.199.*


- The slide designer exhausted its self-repair budget when exact labelled success-criteria statements were placed beside practice photographs; the focused repair succeeded by widening or heightening those criteria zones and splitting one dense teaching unit across consecutive slides.
