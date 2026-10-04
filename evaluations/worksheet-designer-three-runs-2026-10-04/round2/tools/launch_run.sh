#!/usr/bin/env bash
# Launch one worksheet designer on Codex, with the model and effort the real
# lesson run uses (worker-launch.py spec --role worksheet-designer --host codex).
# Usage: launch_run.sh <lesson-key>-<a|b|c>
set -u
EVAL="/c/Users/Daniel/Projects/lessonv4/evaluations/worksheet-designer-three-runs-2026-10-04/round2"
name="$1"
mkdir -p "$EVAL/logs"
date +%s > "$EVAL/logs/$name.start"
# The desktop app's own Codex (0.160.0): the npm one (0.154.0) does not know Luna.
"/c/Users/Daniel/AppData/Local/OpenAI/Codex/bin/8aaf1547b825b104/codex.exe" exec \
  -m gpt-6-luna \
  -c model_reasoning_effort='"high"' \
  -s workspace-write \
  -C "$EVAL/runs/$name" \
  --json \
  -o "$EVAL/logs/$name.final.txt" \
  - < "$EVAL/launch/$name.txt" > "$EVAL/logs/$name.jsonl" 2> "$EVAL/logs/$name.stderr"
code=$?
date +%s > "$EVAL/logs/$name.end"
echo "$name finished with exit code $code"
