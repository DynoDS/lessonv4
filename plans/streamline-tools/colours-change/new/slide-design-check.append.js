
// Blue is a question or the child's short task, and an instruction about how to
// go about the task stays black: the teacher's answer of 24 September 2026,
// narrowing his "can we make only questions to children blue" of 3 September.
// Which a line is cannot be counted in words, so the designer says, with
// `colorRole: "task-blue"`, and the check reads the role. These run the saved
// lines the colours release's checks named, both ways: the job lines pass when
// marked, and advice, statements and answers are refused in any blue the
// designer did not declare a task, and in the role itself wherever the spec
// shows what the line is.
function slideOf(items, title = 'Your Turn: round the numbers') {
  return {
    ...ordinaryLesson(),
    slides: [{ template: 'body-full', title, body: { type: 'stack', items } }]
  };
}

function checkSlide(items, title, design) {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const lessonPath = writeLesson(root, slideOf(items, title));
    if (design) fs.writeFileSync(path.join(root, 'lesson-design.json'), JSON.stringify(design));
    return runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// The messages a designer repairs from, read as plain text.
function messages(result) {
  return result.stdout
    .split('\n')
    .map((line) => {
      try {
        return JSON.parse(line.slice(line.indexOf('{')));
      } catch {
        return null;
      }
    })
    .filter((entry) => entry && typeof entry.message === 'string');
}

function messageFor(result, signal) {
  const found = messages(result).find((entry) => entry.signal === signal);
  assert.ok(found, `no ${signal} in ${result.stdout}`);
  return found.message;
}

test('a short task marked task-blue passes, alone and after its question, at any length the job takes', () => {
  const jobs = [
    'Round 346 to the nearest 10.',
    'Explain what happens to the digits.',
    'Write the greater number in each pair.',
    'Name a job a Victorian child did.',
    'Name a job, e.g. a chimney sweep.',
    'Explain what {{enamel}} does.',
    'Explain why your example matters to you.',
    'Say why.',
    'Justify your answer.',
    'Put these in order.',
    'Is Isla correct? Explain your answer.',
    'Is Dev right? Explain.',
    // A job with its how is the job (his answer of 25 September 2026: "y"):
    // saved lines that ask for the job and name what to use.
    'Explain your answer using the photograph.',
    'Describe each tooth using the pictures.',
    'Explain using the number line.',
    'Sort the examples using the 1842 rule.'
  ];
  const result = checkSlide(jobs.map((value) => ({ type: 'text', colorRole: 'task-blue', value })));
  assert.doesNotMatch(result.stdout, /BLUE_WITHOUT_A_QUESTION/);
  assert.doesNotMatch(result.stdout, /MIXED_BLOCK_WHOLE_BLUE/);
  assert.doesNotMatch(result.stdout, /TASK_BLUE_NOT_A_SHORT_TASK/);
  assert.doesNotMatch(result.stdout, /TURN_SLIDE_WITHOUT_ITS_TURN/);
});

test('advice, a statement or a label painted blue without the role is refused, as 4.2.289 refused it', () => {
  const lines = [
    // Saved lines that only say how to go about the job: black, and refused
    // in blue.
    'Use the shaded map.',
    'Use the two photographs.',
    'Use the number line to help you.',
    'Look at the shaded areas and the Equator.',
    'Read the question carefully.',
    'Look at the picture.',
    'Round numbers are easier.',
    'Change: the tools were different.',
    'Answer: 4,000.',
    'Round 346 to the nearest 10.'
  ];
  const items = lines.map((value) => ({ type: 'text', colorRole: 'focus-blue', value }));
  items.push({ type: 'steps', steps: ['[[Explain your answer.]]'] });
  items.push({ type: 'text', color: '0070C0', value: 'Write one reason.' });
  const result = checkSlide(items);
  assert.equal(result.ok, false);
  const hits = result.stdout.match(/"signal":"BLUE_WITHOUT_A_QUESTION"/g) || [];
  // Every line: a job line too, until the designer marks it a task, because a
  // span or a hex cannot say which it is.
  assert.equal(hits.length, lines.length + 2);
  // The whole of what the designer is told, not only its opening.
  const message = messageFor(result, 'BLUE_WITHOUT_A_QUESTION');
  assert.ok(message.includes(
    "Blue is for a question children answer, and for the child's own short task, the job itself " +
    '(`Explain your answer.`, `Write one reason.`), marked `colorRole: "task-blue"`; a statement, an ' +
    'answer or an instruction about how to go about the task is black, so drop the blue here (remove ' +
    'the `focus-blue` role, the house-blue `color` or the `[[ ]]` span) and leave it for the question ' +
    'or short task this belongs to.'
  ), message);
});

test('task-blue refuses what the spec shows is not a short task', () => {
  const design = {
    stickyKnowledge: [{ id: 'sk-1', text: 'Enamel cannot grow back.' }],
    teachingSequence: [{
      sourceUnitId: 'unit-1',
      answer: { kind: 'text', content: '346 rounds to 350', acceptanceCondition: null, delivery: 'reveal' }
    }]
  };
  const refused = [
    ['Round 3,462 to the nearest 1,000. ||3,000', /it carries the reveal mark `\|\|`/],
    ['✨ Enamel is the hardest material.', /it is a sticky fact, which is purple/],
    ['Enamel cannot grow back.', /it is a sticky fact, which is purple/],
    ['346 rounds to 350.', /it is the lesson's answer, which is green on an answer slide/],
    ['A kettle and a lamp are both appliances. What is electricity doing in each one?', /it tells before it asks/],
    ['Explain your answer. Is Isla correct?', /it tells before it asks/],
    ['Look at the picture. Read the question carefully. Use the word bank. Write one sentence.', /it holds 4 sentences that are not questions, and a short task is one/],
    ['Round numbers are easier. They are quicker to add.', /it holds 2 sentences that are not questions/]
  ];
  const result = checkSlide(
    refused.map(([value]) => ({ type: 'text', colorRole: 'task-blue', value })),
    undefined,
    design
  );
  assert.equal(result.ok, false);
  const found = messages(result).filter((entry) => entry.signal === 'TASK_BLUE_NOT_A_SHORT_TASK');
  assert.equal(found.length, refused.length, result.stdout);
  refused.forEach(([value, reason], index) => {
    assert.ok(found[index].message.startsWith(`"${value.slice(0, 60)}"`), found[index].message);
    assert.match(found[index].message, reason);
  });
  assert.ok(found[0].message.includes(
    "`task-blue` is for the child's own short task, the job in a few words (`Explain your answer.`), " +
    'alone or after its question on the same line. A statement, an answer, a sticky fact or an ' +
    'instruction about how to go about the task is not blue: take the role off, or give each short ' +
    'task its own line and each question its own line before it.'
  ), found[0].message);
});

test('a task-blue line that carries its own colour is refused, and its hex never makes the turn', () => {
  // The third check: a statement marked task-blue and given the house-blue hex
  // printed blue and counted as a My Turn's turn, because the turn reads a hex.
  const title = 'My Turn: column values';
  for (const value of ["A digit's place tells us its value.", 'Explain your answer.']) {
    const result = checkSlide([{ type: 'text', colorRole: 'task-blue', color: '0070C0', value }], title);
    assert.equal(result.ok, false, value);
    const message = messageFor(result, 'TASK_BLUE_NOT_A_SHORT_TASK');
    assert.ok(message.includes('is marked task-blue and also carries its own colour ("0070C0"). A short task takes ' +
      'its blue from the role alone, never a hex: take the `color` off and keep `colorRole: "task-blue"`.'), message);
    assert.ok(!message.includes('take the role off'), message);
  }
});

test('a question with its task in one focus-blue block is still a mixed block, and the message names task-blue', () => {
  const result = checkSlide([
    { type: 'text', colorRole: 'focus-blue', value: 'Is Isla correct? Explain your answer.' }
  ]);
  assert.match(result.stdout, /"signal":"MIXED_BLOCK_WHOLE_BLUE"/);
  assert.match(result.stdout, /may share its question's line as `task-blue`/);
});

test('the role never makes a turn: a statement marked task-blue is still no turn', () => {
  const title = 'My Turn: column values';
  const statement = checkSlide([{ type: 'text', value: "A digit's place tells us its value." }], title);
  assert.match(statement.stdout, /"signal":"TURN_SLIDE_WITHOUT_ITS_TURN"/);
  const message = messageFor(statement, 'TURN_SLIDE_WITHOUT_ITS_TURN');
  assert.ok(message.includes(
    'Colour does not make a line a task: a statement or an instruction painted blue is refused by ' +
    "BLUE_WITHOUT_A_QUESTION, and `task-blue` is only for the child's own short task, the job itself " +
    '(`Explain your answer.`), never advice on how to go about it.'
  ), message);
  assert.doesNotMatch(statement.stdout, /The task stays BLACK/);
  const marked = checkSlide(
    [{ type: 'text', colorRole: 'task-blue', value: "A digit's place tells us its value." }],
    title
  );
  assert.match(marked.stdout, /"signal":"TURN_SLIDE_WITHOUT_ITS_TURN"/);
  // A marked short task is the turn by its words: a task verb, the saved
  // decks' own openers among them, or a question it carries.
  for (const value of ['Write the value of each digit.', 'Say why.', 'Is Isla correct? Explain.']) {
    const turn = checkSlide([{ type: 'text', colorRole: 'task-blue', value }], title);
    assert.doesNotMatch(turn.stdout, /TURN_SLIDE_WITHOUT_ITS_TURN/, value);
  }
  // `Place value` opens a statement, not a task.
  const placeValue = checkSlide([{ type: 'text', value: 'Place value tells us what a digit is worth.' }], title);
  assert.match(placeValue.stdout, /"signal":"TURN_SLIDE_WITHOUT_ITS_TURN"/);
});

test('a starter of task-blue lines is all blue, as one of focus-blue lines is', () => {
  const root = makeRoot();
  try {
    const fakeBuilder = writeFakeBuilder(root, `'use strict';\n`);
    const lessonPath = writeLesson(root, {
      ...ordinaryLesson(),
      slides: [{
        template: 'body-full',
        title: 'Starter',
        headerStyle: 'starter',
        body: {
          type: 'numbered-questions',
          questions: [
            { text: 'Round 346 to the nearest 10.', colorRole: 'task-blue' },
            { text: 'Round 351 to the nearest 10.', colorRole: 'task-blue' }
          ]
        }
      }]
    });
    const result = runSlideDesignCheck(lessonPath, { buildPath: fakeBuilder });
    assert.match(result.stdout, /"signal":"STARTER_QUESTIONS_ALL_BLUE"/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
