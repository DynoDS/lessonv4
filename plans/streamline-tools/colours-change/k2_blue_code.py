"""The colours release, step 2: blue reaches the child's short task, in the code.

His answer (the preferences ledger, decision 11 and the change plan's question
1, 24 September 2026): blue means a question or a short task, the child's job
("Explain your answer.", "Write one reason."); a longer instruction about how to
go about it stays black. Whether a line is the job or advice on how to do it
cannot be counted in words (the first check found a five-word count refusing
41 saved job lines and passing how-to lines and statements), and the lesson
design holds no field that separates the two either: its `pupilInstruction`
holds both. So the slide says which, with a plain role the check reads: a new
`colorRole`, `task-blue`, drawn in house blue. The check refuses every other
blue line that asks nothing, as 4.2.289 did (a statement, an answer, an
instruction), and refuses a `task-blue` line by what the spec shows it to be
(the second check): one carrying the reveal mark `||`, a sticky fact (by its
sparkle, or by the lesson design naming it), the lesson's answer as the design
holds it, or any shape but one short task alone or after its question (a
statement before a question, a task before a question, two instructions). A
lone statement so marked passes that rule, which cannot read meaning, but never
counts as the slide's turn: a marked line counts by its words (a question in
it, or an opening task verb, whose list widens), never by its role. A
`task-blue` line may hold its question before its task: the mixed-block rule
reads only `focus-blue` and a blue hex, so it never judges one. The header's
small cue is unchanged: it says how to go about the task, and stays black.
"""
from _patch import assert_absent, replace_once

CHECK = "builder/scripts/check-slide-design.js"
PT = "builder/src/presentation-text.js"

# ── the role, drawn in house blue ────────────────────────────────────────────
replace_once(PT,
    "const COLOR_ROLES = new Set([\n"
    "  'default',\n"
    "  'focus-blue',\n",
    "const COLOR_ROLES = new Set([\n"
    "  'default',\n"
    "  'focus-blue',\n"
    "  'task-blue',\n")

replace_once(PT,
    "  if (role === 'focus-blue') return COLOURS.title;\n",
    "  if (role === 'focus-blue') return COLOURS.title;\n"
    "  // The child's short task, the job in a few words: blue, as a question is\n"
    "  // (the teacher's rule of 24 September 2026).\n"
    "  if (role === 'task-blue') return COLOURS.title;\n")

replace_once(PT,
    "    // Bold, in the line's own colour. House blue is the colour of a question\n"
    "    // to children and of nothing else on the board (teacher-slide-visual-profile\n"
    "    // -> Semantic colour), so an action verb painted blue reads as a question\n"
    "    // and spends the contrast that was lifting the real one.",
    "    // Bold, in the line's own colour. House blue is the colour of the child's\n"
    "    // job as a whole line, a question or a short task (teacher-slide-visual-\n"
    "    // profile -> Semantic colour), never of a verb on its own, so an action verb\n"
    "    // painted blue inside an instruction spends the contrast that was lifting\n"
    "    // the job.")

# ── the check ────────────────────────────────────────────────────────────────
replace_once(CHECK,
    "// A task list is the turn on a slide that instructs rather than asks. It used\n"
    "// to be recognised through its house blue, but instructions are black now (see\n"
    "// teacher-slide-visual-profile.md -> Semantic colour), so the list itself has to\n"
    "// count or every instructed turn would read as a reference-only slide.\n",
    "// A task list is the turn on a slide that instructs rather than asks. It used\n"
    "// to be recognised through its house blue, but an instruction is black unless\n"
    "// it is the child's own short task (see teacher-slide-visual-profile.md ->\n"
    "// Semantic colour), so the list itself has to count or every instructed turn\n"
    "// would read as a reference-only slide.\n")

replace_once(CHECK,
    "// task arrives as a text node - and because Semantic colour makes a task BLACK\n"
    "// (\"a task is black either way, because it is a task and not a question\",\n"
    "// flagged by Daniel 3 September 2026), nothing about that node said \"turn\".\n",
    "// task arrives as a text node - and because Semantic colour keeps an\n"
    "// instruction BLACK unless it is the child's own short task, marked `task-blue`\n"
    "// (the teacher's rule of 24 September 2026, narrowing his of 3 September),\n"
    "// nothing about a black node's colour says \"turn\".\n")

# The role alone never makes a slide's turn: a statement marked `task-blue`
# must not pass for one (the second check). A marked line counts by its words,
# as a black one does: a question in it (the role draws that question blue), or
# an opening task verb. The verb list gains the openers saved decks use for a
# short task that it did not hold, so `Say why.` is still read as the turn.
replace_once(CHECK,
    "    else if (node.colorRole === 'focus-blue') found = true;\n",
    "    else if (node.colorRole === 'focus-blue') found = true;\n"
    "    // A `task-blue` line counts by what it says, never by its role: a\n"
    "    // statement so marked is not the turn. A question on it is (the role\n"
    "    // draws that question blue); a task verb has counted above already.\n"
    "    else if (node.colorRole === 'task-blue' && taskBlueAsks(node)) found = true;\n")

replace_once(CHECK,
    "function carriesItsTurn(slideData) {\n",
    "function taskBlueAsks(node) {\n"
    "  const whole = typeof node.value === 'string' ? node.value : node.text;\n"
    "  return typeof whole === 'string' && taskSentences(whole).some((sentence) => sentence.endsWith('?'));\n"
    "}\n"
    "\n"
    "function carriesItsTurn(slideData) {\n")

replace_once(CHECK,
    "    'add', 'answer', 'build', 'calculate', 'change', 'check', 'choose',\n"
    "    'circle', 'colour', 'compare', 'complete', 'continue', 'convert', 'copy',\n"
    "    'count', 'cross', 'decide', 'describe', 'design', 'discuss', 'divide',\n"
    "    'draw', 'estimate', 'explain', 'fill', 'find', 'finish', 'give', 'identify',\n"
    "    'join', 'label', 'list', 'look', 'make', 'mark', 'match', 'measure',\n"
    "    'multiply', 'name', 'order', 'partition', 'pick', 'plot', 'point', 'prove',\n"
    "    'read', 'record', 'round', 'shade', 'share', 'show', 'solve', 'sort',\n"
    "    'spot', 'subtract', 'tell', 'test', 'tick', 'try', 'underline', 'use',\n"
    "    'work out', 'write',\n",
    "    'add', 'answer', 'ask', 'build', 'calculate', 'change', 'check', 'choose',\n"
    "    'circle', 'colour', 'compare', 'complete', 'continue', 'convert', 'copy',\n"
    "    'count', 'cross', 'decide', 'describe', 'design', 'discuss', 'divide',\n"
    "    'draw', 'estimate', 'explain', 'fill', 'find', 'finish', 'give', 'identify',\n"
    "    'imagine', 'improve', 'join', 'justify', 'label', 'list', 'look', 'make',\n"
    "    'mark', 'match', 'measure', 'multiply', 'name', 'order', 'partition',\n"
    "    'pick', 'place(?! value)', 'plan', 'plot', 'point', 'prove', 'put', 'read',\n"
    "    'record', 'round', 'say', 'shade', 'share', 'show', 'solve', 'sort',\n"
    "    'spot', 'subtract', 'suggest', 'take', 'tell', 'test', 'tick', 'try',\n"
    "    'underline', 'use', 'work out', 'write',\n")

replace_once(CHECK,
    "        'label. The task stays BLACK: do not reach for house blue to satisfy this ' +\n"
    "        'line, because blue is the colour of a question and an imperative painted ' +\n"
    "        'blue is refused by BLUE_WITHOUT_A_QUESTION.'\n",
    "        'label. Colour does not make a line a task: a statement or an instruction ' +\n"
    "        'painted blue is refused by BLUE_WITHOUT_A_QUESTION, and `task-blue` is ' +\n"
    "        'only for the child\\'s own short task, the job itself (`Explain your ' +\n"
    "        'answer.`), never advice on how to go about it.'\n")

replace_once(CHECK,
    "          'keep the telling black and put the question on its own line in blue ' +\n"
    "          '(a `[[ ]]` span or a separate text object).'\n",
    "          'keep the telling black and put the question on its own line in blue ' +\n"
    "          '(a `[[ ]]` span or a separate text object). A short task that is the ' +\n"
    "          'child\\'s job may share its question\\'s line as `task-blue`.'\n")

replace_once(CHECK,
    "// House blue means one thing on the body of a slide: this is a question for\n"
    "// you. An instruction the class acts on is black, because it already reads as\n"
    "// part of the job the blue question set, and painting it blue too spends the\n"
    "// contrast that was lifting the question. A Year 4 history deck put \"Explain\n"
    "// your answer using the photograph.\", \"Point to the details that support your\n"
    "// comparison.\" and seven more task lines in house blue, and the board arrived\n"
    "// almost entirely blue (flagged by Daniel, 3 September 2026: \"can we make only\n"
    "// questions to children blue\").\n",
    "// House blue means one thing on the body of a slide: this is your job - a\n"
    "// question to answer, or a short task the designer has marked `task-blue`\n"
    "// (the teacher's rule of 24 September 2026, narrowing his of 3 September, when\n"
    "// a history deck's nine task lines arrived blue; the build log keeps it).\n"
    "// Anything else painted blue - a statement, an answer, an instruction about\n"
    "// how to go about the task - spends the contrast that was lifting the job, so\n"
    "// it is refused here. Whether a line is the job or advice is the designer's\n"
    "// judgement, which the role records; no count of words can make it.\n")

replace_once(CHECK,
    "function nodeIsBlue(node) {\n"
    "  return (\n"
    "    node.colorRole === 'focus-blue' ||\n",
    "function nodeIsBlue(node) {\n"
    "  return (\n"
    "    node.colorRole === 'focus-blue' ||\n"
    "    node.colorRole === 'task-blue' ||\n")

replace_once(CHECK,
    "  if (nodeIsBlue(node) && typeof whole === 'string') runs.push(whole);\n",
    "  // A `task-blue` line has said what it is; TASK_BLUE_NOT_A_SHORT_TASK judges it.\n"
    "  if (nodeIsBlue(node) && node.colorRole !== 'task-blue' && typeof whole === 'string') {\n"
    "    runs.push(whole);\n"
    "  }\n")

replace_once(CHECK,
    "            `\"${text.slice(0, 60)}\" is in house blue but asks the class ` +\n"
    "            'nothing. Blue is the colour of a question children answer; an ' +\n"
    "            'instruction they act on is black, so drop the blue here (remove ' +\n"
    "            'the `focus-blue` role, the house-blue `color` or the `[[ ]]` ' +\n"
    "            'span) and leave the blue for the question this task belongs to.'\n",
    "            `\"${text.slice(0, 60)}\" is in house blue but asks the class ` +\n"
    "            'nothing. Blue is for a question children answer, and for the ' +\n"
    "            'child\\'s own short task, the job itself (`Explain your answer.`, ' +\n"
    "            '`Write one reason.`), marked `colorRole: \"task-blue\"`; a statement, ' +\n"
    "            'an answer or an instruction about how to go about the task is ' +\n"
    "            'black, so drop the blue here (remove the `focus-blue` role, the ' +\n"
    "            'house-blue `color` or the `[[ ]]` span) and leave it for the ' +\n"
    "            'question or short task this belongs to.'\n")

replace_once(CHECK,
    "// A starter is questions all the way down, so blue there marks nothing a child\n",
    "// A short task is the child's job said in a few words - `Explain your answer.`,\n"
    "// `Write one reason.`, `Round 346 to the nearest 10.` - and it is blue, as a\n"
    "// question is. Whether a line is the job or advice on how to go about it (`Use\n"
    "// the shaded map.`) is the designer's call, recorded by the role. What the\n"
    "// spec shows about the line, the check refuses: the reveal mark `||` (an\n"
    "// answer is green on an answer slide); a line the lesson design holds as a\n"
    "// sticky fact or as this lesson's answer; a sticky line's sparkle; and any\n"
    "// shape but one short task, alone or after its question - a statement or a\n"
    "// task before a question is a tell-then-ask block, and two instructions are\n"
    "// the all-blue board of 3 September arriving one short line at a time. A lone\n"
    "// statement marked `task-blue` that the design does not name passes this\n"
    "// rule, which cannot read meaning; it never counts as the slide's turn,\n"
    "// because carriesItsTurn reads a marked line's words, not its role.\n"
    "const TASK_BLUE_REVEAL = /\\|\\|/;\n"
    "const TASK_BLUE_MARKS = /\\|\\||\\*\\*|\\[\\[|\\]\\]|\\{\\{|\\}\\}|<<|>>|\u2728/g;\n"
    "\n"
    "// The words, without marks, spacing, case or a closing full stop, so a line\n"
    "// is matched to the design's own words however it was typed onto the slide.\n"
    "function plainLine(text) {\n"
    "  return String(text).replace(TASK_BLUE_MARKS, '').replace(/\\s+/g, ' ').trim()\n"
    "    .replace(/[.!]+$/, '').toLowerCase();\n"
    "}\n"
    "\n"
    "// What the lesson design beside the deck says is a sticky fact or an answer,\n"
    "// in plain words, so a marked line is refused by what it is, not by its shape.\n"
    "function designFacts(jsonPath) {\n"
    "  const facts = { sticky: new Set(), answers: new Set() };\n"
    "  if (!jsonPath) return facts;\n"
    "  const designPath = path.join(path.dirname(jsonPath), 'lesson-design.json');\n"
    "  if (!fs.existsSync(designPath)) return facts;\n"
    "  let design;\n"
    "  try {\n"
    "    design = JSON.parse(fs.readFileSync(designPath, 'utf8'));\n"
    "  } catch {\n"
    "    return facts;\n"
    "  }\n"
    "  (Array.isArray(design.stickyKnowledge) ? design.stickyKnowledge : []).forEach((fact) => {\n"
    "    if (fact && typeof fact.text === 'string' && fact.text.trim()) facts.sticky.add(plainLine(fact.text));\n"
    "  });\n"
    "  const visit = (node) => {\n"
    "    if (Array.isArray(node)) return node.forEach(visit);\n"
    "    if (!node || typeof node !== 'object') return;\n"
    "    // A unit, block, part or prompt holds its answer as `answer.content`.\n"
    "    const answer = node.answer;\n"
    "    if (answer && typeof answer.content === 'string' && answer.content.trim()) {\n"
    "      facts.answers.add(plainLine(answer.content));\n"
    "    }\n"
    "    Object.keys(node).forEach((key) => visit(node[key]));\n"
    "  };\n"
    "  visit(design);\n"
    "  return facts;\n"
    "}\n"
    "\n"
    "// Sentences, as a reader meets them: `e.g.` and `i.e.` do not end one.\n"
    "function taskSentences(whole) {\n"
    "  return splitSentences(String(whole).replace(/\\b(e\\.g|i\\.e)\\.(?=\\s)/gi, (m) => m.replace(/\\./g, '\u2024')));\n"
    "}\n"
    "\n"
    "function taskBlueFault(whole, facts) {\n"
    "  if (TASK_BLUE_REVEAL.test(whole)) {\n"
    "    return 'it carries the reveal mark `||`, and an answer is green on an answer slide, never blue';\n"
    "  }\n"
    "  if (whole.trim().startsWith('\u2728') || facts.sticky.has(plainLine(whole))) {\n"
    "    return 'it is a sticky fact, which is purple';\n"
    "  }\n"
    "  if (facts.answers.has(plainLine(whole))) {\n"
    "    return 'it is the lesson\\'s answer, which is green on an answer slide, never blue';\n"
    "  }\n"
    "  const sentences = taskSentences(whole);\n"
    "  const tasks = sentences.filter((sentence) => !sentence.endsWith('?'));\n"
    "  if (tasks.length > 1) {\n"
    "    return `it holds ${tasks.length} sentences that are not questions, and a short task is one`;\n"
    "  }\n"
    "  if (tasks.length === 1 && sentences[sentences.length - 1].endsWith('?')) {\n"
    "    return 'it tells before it asks, and a line that tells or instructs and then asks is two things, not one short task';\n"
    "  }\n"
    "  return null;\n"
    "}\n"
    "\n"
    "function taskBlueWarnings(lesson, jsonPath) {\n"
    "  const slides = Array.isArray(lesson && lesson.slides) ? lesson.slides : [];\n"
    "  const facts = designFacts(jsonPath);\n"
    "  const warnings = [];\n"
    "  slides.forEach((slideData, index) => {\n"
    "    walkContent(slideData, (node) => {\n"
    "      if (node.colorRole !== 'task-blue') return;\n"
    "      const whole = typeof node.value === 'string' ? node.value : node.text;\n"
    "      if (typeof whole !== 'string' || !whole.trim()) return;\n"
    "      const fault = taskBlueFault(whole, facts);\n"
    "      if (!fault) return;\n"
    "      warnings.push({\n"
    "        signal: 'TASK_BLUE_NOT_A_SHORT_TASK',\n"
    "        slide: index + 1,\n"
    "        field: 'text',\n"
    "        message:\n"
    "          `\"${whole.trim().slice(0, 60)}\" is marked task-blue, but ${fault}. ` +\n"
    "          '`task-blue` is for the child\\'s own short task, the job in a few ' +\n"
    "          'words (`Explain your answer.`), alone or after its question on the ' +\n"
    "          'same line. A statement, an answer, a sticky fact or an instruction ' +\n"
    "          'about how to go about the task is not blue: take the role off, or ' +\n"
    "          'give each short task its own line and each question its own line ' +\n"
    "          'before it.'\n"
    "      });\n"
    "    });\n"
    "  });\n"
    "  return warnings;\n"
    "}\n"
    "\n"
    "// A starter is questions all the way down, so blue there marks nothing a child\n")

replace_once(CHECK,
    "    .concat(blueStatementWarnings(lesson))\n",
    "    .concat(blueStatementWarnings(lesson))\n"
    "    .concat(taskBlueWarnings(lesson, jsonPath))\n")

assert_absent(CHECK, "a task is black either way")
assert_absent(CHECK, "can we make only")
assert_absent(CHECK, "The task stays BLACK")
print("blue code done")
