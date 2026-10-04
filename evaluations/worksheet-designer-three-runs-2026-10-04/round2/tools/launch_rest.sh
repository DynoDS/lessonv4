#!/usr/bin/env bash
EVAL="/c/Users/Daniel/Projects/lessonv4/evaluations/worksheet-designer-three-runs-2026-10-04/round2"
for n in subtract-b subtract-c renga-a renga-b renga-c divisibility-a divisibility-b divisibility-c leisure-a leisure-b leisure-c choices-a choices-b choices-c; do
  nohup bash "$EVAL/tools/launch_run.sh" "$n" > /dev/null 2>&1 &
  sleep 12
done
