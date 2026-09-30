#!/usr/bin/env bash
# Run every lesson-v4 test suite and print one summary line per suite.
# Usage: run-all-suites.sh <label>   (writes <label>-*.log beside this script)
#
# Since 30 September 2026 the plugin carries its own runner,
# plugins/lesson-v4/scripts/tests/run_all_checks.py, which runs every group
# side by side in about a minute. Use that directly. This script hands over to
# it whenever the copy it sits in has it, and keeps its old one-by-one run only
# for older copies (replays of a release made before the runner existed).
LABEL="${1:-run}"
OUT="$(cd "$(dirname "$0")" && pwd)"
# The plugin in the copy this script sits in (main checkout or a worktree).
ROOT="$(cd "$OUT/../.." && pwd)/plugins/lesson-v4"
cd "$ROOT" || exit 1

if [ -f "$ROOT/scripts/tests/run_all_checks.py" ]; then
  python -X utf8 "$ROOT/scripts/tests/run_all_checks.py" --logs "$OUT/$LABEL-logs" | tee "$OUT/$LABEL-summary.log"
  exit "${PIPESTATUS[0]}"
fi

summary() { grep -aE '^(ℹ|#) (pass|fail) ' "$1" | tr '\n' ' '; }

python -X utf8 -m pytest scripts/tests -q -p no:cacheprovider > "$OUT/$LABEL-python.log" 2>&1
echo "python: $(tail -1 "$OUT/$LABEL-python.log")"

python -X utf8 -m pytest evals/teacher-voice -q -p no:cacheprovider > "$OUT/$LABEL-voice.log" 2>&1
echo "voice harness: $(tail -1 "$OUT/$LABEL-voice.log")"

(cd "$ROOT/builder" && node --test "test/*.test.js" > "$OUT/$LABEL-builder.log" 2>&1)
echo "builder: $(summary "$OUT/$LABEL-builder.log")"

for dir in worksheet-html stick-in-sheets-html working-wall-html; do
  (cd "$ROOT/$dir" && node --test > "$OUT/$LABEL-$dir.log" 2>&1)
  echo "$dir: $(summary "$OUT/$LABEL-$dir.log")"
done

node --test "shared/test/*.test.js" "shared/text/*.test.js" > "$OUT/$LABEL-shared.log" 2>&1
echo "shared: $(summary "$OUT/$LABEL-shared.log")"

node --test "test/*.test.js" > "$OUT/$LABEL-test.log" 2>&1
echo "test: $(summary "$OUT/$LABEL-test.log")"
