"""Release 7A (4.2.293), step 8d's tests (the second check's repairs 1, 2 and 4):

- the grid: titled "Your Turn" it passes the whole slide check, because its
  calculations are its turn; untitled under the starter header it passes too;
  titled "Your Turn" with no calculations it is still a turn with no task;
- the designer's own check never carries `--settled`: every slide-check command
  in an agent's page other than the decorator's, and the playbook's Track A
  check, are read, and one carrying the switch fails (the second check found
  adding it passed every suite);
- the wall: its refusal names the 72-character budget of the widest share, and
  the definition and sentence-stem cards let a drawing give way (the second
  check's two missed undo attacks)."""
from _patch import append, replace_once

GRID_TEST = "builder/test/grid-calc-title.test.js"
CHECK_TEST = "builder/test/slide-design-check.test.js"
WALL_TEST = "working-wall-html/test/doc-claims.test.js"

replace_once(GRID_TEST, """test('the build does not refuse an untitled grid, and draws no title for it', () => {""",
             """// The untitled grid's own message asks for "Your Turn", so the whole check
// must take that title: a grid's calculations are its turn. A grid under the
// starter header never prints a title, so it is not sent back for one (the
// second check, 26 September 2026).
test('a grid titled "Your Turn" carries its turn in its sums, and a starter grid needs no title', () => {
  const script = path.join(__dirname, '..', 'scripts', 'check-slide-design.js');
  const run = (lesson) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'grid-turn-'));
    try {
      const lessonPath = path.join(root, 'lesson.json.tmp.grid');
      fs.writeFileSync(lessonPath, JSON.stringify(lesson, null, 2));
      const result = spawnSync(process.execPath, [script, lessonPath], {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      });
      return { status: result.status, output: `${result.stdout || ''}${result.stderr || ''}` };
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
  for (const [name, lesson] of [
    ['a grid titled "Your Turn"', deck({ title: 'Your Turn' })],
    ['an untitled grid under the starter header', deck({ headerStyle: 'starter' })],
  ]) {
    const result = run(lesson);
    assert.equal(result.status, 0, `${name}: ${result.output}`);
    assert.match(result.output, /SLIDE_DESIGN_CHECK_OK: 1 slides/, name);
  }
  assert.deepEqual(presentationWarnings(deck({ headerStyle: 'starter' })), []);
  const empty = run(deck({ title: 'Your Turn', calculations: [] }));
  assert.equal(empty.status, 1, empty.output);
  assert.match(empty.output, /TURN_SLIDE_WITHOUT_ITS_TURN/, 'a "Your Turn" grid with no sums is still a turn with no task');
});

test('the build does not refuse an untitled grid, and draws no title for it', () => {""")

append(CHECK_TEST, """
// `--settled` turns every wording, title and colour fault into a note. On the
// slide designer's own check that would let them all through the one gate that
// sends them back, so only the decorator's check, on a settled deck, and the
// orchestrator's re-check after it carry it (the second check, 26 September
// 2026, found that adding it to the designer's check passed every suite).
test("the slide designer's own check never runs with --settled; only the decorator's does", () => {
  const plugin = path.join(__dirname, '..', '..');
  const read = (rel) => fs.readFileSync(path.join(plugin, rel), 'utf8').replace(/\\r\\n/g, '\\n');
  const commands = (text) =>
    text.split(/\\n\\s*\\n/).filter((block) => block.includes('builder/scripts/check-slide-design.js'));
  let designerCommands = 0;
  for (const name of fs.readdirSync(path.join(plugin, 'agents')).filter((file) => file.endsWith('.md'))) {
    for (const block of commands(read(path.join('agents', name)))) {
      if (name === 'slide-decorator.md') {
        assert.match(block, /--settled/, `${name}: ${block}`);
      } else {
        assert.doesNotMatch(block, /--settled/, `${name}: ${block}`);
        designerCommands += 1;
      }
    }
  }
  assert.ok(designerCommands >= 1, "the slide designer's check command was not found");
  const playbook = read(path.join('skills', 'make-lesson', 'playbook-lite.md'));
  const pass = playbook.indexOf('**The decoration pass.**');
  assert.ok(pass > 0, 'the playbook no longer marks the decoration pass');
  const trackA = commands(playbook.slice(0, pass));
  assert.ok(trackA.length >= 1, "the playbook's Track A check was not found");
  for (const block of trackA) assert.doesNotMatch(block, /--settled/, block);
  const decorator = commands(playbook.slice(pass));
  assert.ok(decorator.length >= 1, "the playbook's decorator check was not found");
  for (const block of decorator) assert.match(block, /--settled/, block);
});
""")

replace_once(WALL_TEST, """  assert.equal(panelFractionThatFits(0.6, () => false), 0.6, "past a little, the picture keeps its share and the build refuses");""",
             """  assert.equal(
    panelFractionThatFits(0.6, () => false),
    0.7,
    "a card that fits at no share is refused at the widest share tried, so its message names the budget it really has"
  );""")
replace_once(WALL_TEST, """      assert.match(message, /62 is the most that fits/, "the refusal must name the budget");""",
             """      // The budget at the widest share the picture gave way to, not the 62 of
      // the full share: a designer shortening aims at what the card holds.
      assert.match(message, /72 is the most that fits/, "the refusal must name the budget");""")
replace_once(WALL_TEST, """test("an over-long body item is refused by name, item and overage", async () => {""",
             """async function cardBuilds(dir, card) {
  const { build } = require("../build.js");
  const specPath = path.join(dir, "working-wall.json");
  fs.writeFileSync(specPath, JSON.stringify({ topic: "Give way", cards: [card] }));
  const warn = console.warn;
  const log = console.log;
  console.warn = () => {};
  console.log = () => {};
  try {
    await build(specPath, dir);
    return true;
  } catch (err) {
    return false;
  } finally {
    console.warn = warn;
    console.log = log;
  }
}

// The definition and the sentence-stem cards let a drawing give way as the
// sticky and worked-example cards do. Beside a drawing an item holds about 124
// characters at the full share (four lines at the floor), and about 144 at the
// widest share tried.
test("a definition or a sentence stem beside a drawing keeps it by letting it give way a little", async () => {
  const dir = wallDir("wall-give-way-");
  const drawing = { type: "line-pair", relationship: "perpendicular", form: "L", notation: "right-angle" };
  const page = { size: "A3", orientation: "landscape" };
  const words = (length) => "x ".repeat(120).slice(0, length).trim();
  const cards = {
    definition: (length) => ({ type: "vocabDefinition", page, title: "Perpendicular", definition: words(length), visual: drawing }),
    "sentence stem": (length) => ({ type: "sentenceStem", page, title: "How to explain it", items: [{ text: words(length) }], visual: drawing }),
  };
  for (const [name, card] of Object.entries(cards)) {
    assert.equal(await cardBuilds(dir, card(130)), true, `a 130-character ${name} should build with its drawing a little smaller`);
    assert.equal(await cardBuilds(dir, card(146)), false, `a 146-character ${name} is past what the drawing giving way allows`);
  }
});

test("an over-long body item is refused by name, item and overage", async () => {""")
print("the second check's tests written")
