#!/usr/bin/env bash
# Wait until all fifteen runs have ended.
EVAL="/c/Users/Daniel/Projects/lessonv4/evaluations/worksheet-designer-three-runs-2026-10-04/round2"
until [ "$(ls "$EVAL/logs" | grep -c '\.end$')" -ge 15 ]; do sleep 30; done
echo "all fifteen ended"
