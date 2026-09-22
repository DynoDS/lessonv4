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
