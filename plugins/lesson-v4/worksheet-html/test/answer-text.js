"use strict";

// The teacher's answer sheet read back as lines, for tests that check what it
// says rather than how it looks: each level's heading in capitals, the
// stand-in sentence when there is one, then "(label) answer" and any notes,
// with a blank line after each level.
function answersText(html) {
  const plain = (s) =>
    s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
  const lines = [];
  const levels = html.match(/<section class="a-level">[\s\S]*?<\/section>/g) || [];
  for (const level of levels) {
    lines.push(plain(/<h2>([\s\S]*?)<\/h2>/.exec(level)[1]).toUpperCase());
    const standIn = /<p class="a-standin">([\s\S]*?)<\/p>/.exec(level);
    if (standIn) lines.push(plain(standIn[1]));
    for (const row of level.match(/<div class="a-row">[\s\S]*?<\/div><\/div>/g) || []) {
      const label = plain(/<span class="a-label">([\s\S]*?)<\/span>/.exec(row)[1]);
      const answer = plain(/<span class="a-answer[^"]*">([\s\S]*?)<\/span>/.exec(row)[1]);
      lines.push(`${label} ${answer}`);
      for (const note of row.match(/<span class="a-note">[\s\S]*?<\/span>/g) || []) lines.push(plain(note));
    }
    lines.push("");
  }
  return lines.join("\n");
}

module.exports = { answersText };
