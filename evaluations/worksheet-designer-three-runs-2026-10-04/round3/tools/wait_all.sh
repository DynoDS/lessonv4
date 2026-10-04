#!/usr/bin/env bash
ROUND="/c/Users/Daniel/Projects/lessonv4/evaluations/worksheet-designer-three-runs-2026-10-04/round3"
until [ "$(ls "$ROUND/logs" | grep -c '\.done$')" -ge 5 ]; do sleep 30; done
echo "all five lessons done"
