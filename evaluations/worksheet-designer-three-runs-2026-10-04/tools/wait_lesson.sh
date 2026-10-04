#!/usr/bin/env bash
# Wait until all three runs of one lesson have ended. Usage: wait_lesson.sh <lesson-key>
EVAL="/c/Users/Daniel/Projects/lessonv4/evaluations/worksheet-designer-three-runs-2026-10-04"
until [ -f "$EVAL/logs/$1-a.end" ] && [ -f "$EVAL/logs/$1-b.end" ] && [ -f "$EVAL/logs/$1-c.end" ]; do
  sleep 20
done
for run in a b c; do
  s=$(cat "$EVAL/logs/$1-$run.start"); e=$(cat "$EVAL/logs/$1-$run.end")
  echo "$1-$run: $(( (e - s) / 60 )) min, worksheet.json $([ -f "$EVAL/runs/$1-$run/worksheet.json" ] && echo yes || echo NO)"
done
