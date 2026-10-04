#!/usr/bin/env bash
ROUND="/c/Users/Daniel/Projects/lessonv4/evaluations/worksheet-designer-three-runs-2026-10-04/round4"
for k in subtract renga divisibility leisure choices; do
  nohup bash "$ROUND/tools/run_lesson.sh" "$k" > /dev/null 2>&1 &
  sleep 15
done
