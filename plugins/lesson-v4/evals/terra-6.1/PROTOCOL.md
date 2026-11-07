# Visual worker model trial

Status: trial configured; no comparative results recorded yet.

Compare image-scout and slide-decorator against GPT-6 Luna/medium, and
diagram-anchor against GPT-6.1 Sol/medium. The candidate is GPT-6.1
Terra/medium for all three. Keep the same role instructions, inputs, tools,
constraints and checks. Run each model independently in separate copies of
the same saved state; do not feed either model the other's result.

Before examining results, select at least three genuinely different saved
cases per role, including one difficult case and one where the correct action
is to decline or leave something unchanged. Repeat each case twice per model,
alternating run order. Freeze the cases, acceptance criteria and run budget.
Record unavailable cases and failed launches; do not substitute a different
case after seeing an outcome.

Judge outputs without model labels where practical, using the original inputs
and rendered resources. Record each defect, its severity, time and retries:

- Image scout: required subject and features actually visible, factual and
  age appropriateness, source and licence requirements, correct rejection of
  unsuitable images, and whether each result is usable in the lesson.
- Slide decorator: no overlaps with words or instructional content; decoration
  fits the lesson and library rules; inappropriate opportunities are skipped.
  Inspect the rendered slides at presentation size.
- Diagram anchor: each point lands on the named visible feature, absent or
  ambiguous features are handled correctly, and no unrelated content changes.
  Inspect the actual annotated image at use size.

Report all outcomes per role, including faults, failed or incomplete runs,
elapsed time, retries and usage when available. A severe factual, visual or
instructional defect cannot be traded away for speed. Continue a role's trial
only if Terra has no more serious defects than its baseline and performs at
least as well on the role's core criteria; otherwise restore the baseline for
that role and investigate. Six paired runs per role are exploratory evidence,
not proof of reliability. A definitive adoption decision needs more cases and
teacher judgement, especially if results are mixed.
