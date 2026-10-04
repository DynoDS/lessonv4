#!/usr/bin/env bash
# Start all fifteen, twenty-five seconds apart. Fifteen started in the same
# second hung in Codex's sandbox set-up for their new folders (4 October 2026).
EVAL="/c/Users/Daniel/Projects/lessonv4/evaluations/worksheet-designer-three-runs-2026-10-04/round2"
for k in subtract renga divisibility leisure choices; do
  for run in a b c; do
    nohup bash "$EVAL/tools/launch_run.sh" "$k-$run" > /dev/null 2>&1 &
    sleep 25
  done
done
echo "all started"
