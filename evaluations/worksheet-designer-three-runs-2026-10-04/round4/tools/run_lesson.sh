#!/usr/bin/env bash
# One lesson: adaptation designer (Sol, high), the provisional picture contract,
# then the worksheet designer (Luna, high). Models from worker-launch.py spec.
ROUND="/c/Users/Daniel/Projects/lessonv4/evaluations/worksheet-designer-three-runs-2026-10-04/round4"
PLUGIN="/c/Users/Daniel/Projects/lessonv4/plugins/lesson-v4"
PY="/c/Users/Daniel/AppData/Local/Programs/Python/Python313/python.exe"
CX="/c/Users/Daniel/AppData/Local/OpenAI/Codex/bin/8aaf1547b825b104/codex.exe"
k="$1"; W="$ROUND/runs/$k"
date +%s > "$ROUND/logs/$k-adaptation.start"
"$CX" exec -m gpt-6.1-sol -c model_reasoning_effort='"high"' -s workspace-write -C "$W" --json -o "$ROUND/logs/$k-adaptation.final.txt" - < "$ROUND/launch/$k-adaptation.txt" > "$ROUND/logs/$k-adaptation.jsonl" 2> "$ROUND/logs/$k-adaptation.stderr"
date +%s > "$ROUND/logs/$k-adaptation.end"
contract="phase2-initial-photo-requirements.json"
if [ -f "$W/adaptation.md" ]; then
  mkdir -p "$W/orchestration-receipts"
  if "$PY" "$PLUGIN/scripts/photo-contract.py" build-provisional --initial "$W/phase2-initial-photo-requirements.json" --adaptation "$W/adaptation.md" --output "$W/adaptation-photo-provisional.json" --lesson-design "$W/lesson-design.json" --requirements-snapshot "$W/photo-requirements-a-1.json" --receipt "$W/orchestration-receipts/adaptation-photo-provisional.json" > "$ROUND/logs/$k-provisional.txt" 2>&1; then
    contract="adaptation-photo-provisional.json"
  fi
  sed "s|__CONTRACT__|$contract|" "$ROUND/launch/$k-worksheet.txt" > "$ROUND/launch/$k-worksheet.final.txt"
  date +%s > "$ROUND/logs/$k-worksheet.start"
  "$CX" exec -m gpt-6-luna -c model_reasoning_effort='"high"' -s workspace-write -C "$W" --json -o "$ROUND/logs/$k-worksheet.final.txt" - < "$ROUND/launch/$k-worksheet.final.txt" > "$ROUND/logs/$k-worksheet.jsonl" 2> "$ROUND/logs/$k-worksheet.stderr"
  date +%s > "$ROUND/logs/$k-worksheet.end"
fi
date +%s > "$ROUND/logs/$k.done"
