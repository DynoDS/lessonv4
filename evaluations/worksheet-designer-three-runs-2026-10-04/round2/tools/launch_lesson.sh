#!/usr/bin/env bash
# Start the three worksheet designers of one lesson, detached, so they outlive
# the shell that started them. Usage: launch_lesson.sh <lesson-key>
EVAL="/c/Users/Daniel/Projects/lessonv4/evaluations/worksheet-designer-three-runs-2026-10-04/round2"
for run in a b c; do
  nohup bash "$EVAL/tools/launch_run.sh" "$1-$run" > /dev/null 2>&1 &
done
echo "started $1 a b c"
