# Image Scout Generation

Read this reference immediately before the first legal generation action.

## Authority

Generation is legal only when the assignment entry has a prompt file and hash, and either:

- `initial_route` is `ai`; or
- `initial_route` is `real`, no compiled search step found a faithful winner, and every step either completed or, with `fallback_action: ai`, stayed operationally unavailable through its one authorised retry (or hit `rate_limit`). An outage does not withdraw an authorised fallback; record it, search any `standby_only` step it makes owed, and generate.

Do not generate authentic evidence. Do not rewrite the checked initial prompt.

## Before each call

1. Confirm the host's built-in image generation capability is available.
2. Run the per-filename ledger status command.
3. Read the recovery reference when history exists.
4. Hash the exact prompt file and require the assignment hash.
5. Reserve the call with `image-scout-attempts.py reserve` and `--prompt-file`.
6. Make the generation or edit call only after reservation succeeds.

Use the host's built-in OpenAI image generation route. Do not use an API key, CLI, Pollinations, another provider, or a web-search substitute.

The per-filename lifetime is at most two ImageGen calls. An interrupted call or returned-without-output call remains consumed. Never reset the ledger.

## Stage returned media

The host saves every generated image as a file of its own, and `record-generated` stages it for you: run it for the attempt with `--work-root` set to `WORK_ROOT`, and it copies that file into the entry's AI folder and records it. Where the call's result names the saved file (on Codex, its `output_hint`), add `--host-file` with that path.

The same result also carries the picture as text, about a million characters of it. Keep that text out of your output and out of every command: printed, it is cut short, and Windows refuses a command that long. Print the result's field names and the path, never the result whole. Seven finished pictures in one Year 4 lesson were recorded as never arriving this way while every file sat in the host's folder.

The command's answer is your next step. One new file: it is recorded, and costs no further call. Several, because calls were made together: it lists them and records none, since only looking can tell which is which, so open each and name this entry's own with `--host-file`. A host with no such folder: it says so and leaves the attempt open, so stage the file the result names yourself and pass `--staging-path`.

A staged output remains `generated_unreviewed` until your own batch review below has looked at it. Nothing downstream reviews it for you, so a staged image you never opened reaches the lesson exactly as it came back.

A call returned no image only once it has finished and the command finds no new file. Then `interrupt-open` the attempt, which consumes it and leaves the recovery call. Where that was the second call, report the entry `unsatisfied` with reason `attempt_budget_exhausted`. `rejected` is never the record for a call that returned nothing: the ledger refuses it, as the batch review below explains.

## Batch review

Generate and record every ready first-pass output before reviewing the set together. Use original files together where the host supports it. A contact sheet can support the overview but cannot replace originals.

Check every item independently for:

- exact subject;
- every evidence item;
- counts;
- geometry, joins, hands, and components;
- physical state;
- background and setting;
- text rule;
- crop and clutter;
- classroom suitability;
- watermark or signature.

Classify each output:

- `accepted`: it teaches the right thing and contains nothing that misteaches;
- `near_miss`: one concrete and correctable fault in an otherwise good image;
- `provider_misdirection`: an unrelated subject, not a bad attempt at the right subject;
- `rejected`: wrong concept, several structural faults, or a fundamental miss.

A call that returns no image has nothing to classify. Interrupt the attempt instead: that consumes it and leaves the recovery call. `rejected` is a verdict on a picture and authorises no further call, so reaching for it when nothing arrived ends the picture rather than recording what happened to it.

Complete every first-pass ledger result before a correction call.

## Second call

A second call is legal only for:

- one precise near-miss;
- provider misdirection;
- an interrupted reserved call with one call left;
- a final-review rejection judged correctable.

Prefer an edit when the first image is a good base. Otherwise write one correction prompt under `WORK_ROOT`. Preserve every successful requirement. Hash and reserve that prompt.

**A good base is an image whose fault is not in the taught object.** Framing, background, clutter, an extra item, a crop, lighting, a stray reflection: an edit corrects those while holding everything the first image already got right, which is exactly what an edit is for. A fault in the identity, structure or connection points of the thing the picture exists to teach is not a base: the edit is asked to keep that object and change it in the same breath, and it keeps it. A classroom buzzer drawn with no two distinct terminals came back from its edit with two terminals added and the lead still clipped to the wrong part of the body; that was the last call, and a Year 4 worksheet lost its picture. When the fault is in the taught object, spend the call on a fresh prompt that names that object's parts and connection points explicitly, not on an edit of the image that got it wrong.

Review authorised correction outputs together when there is more than one. There is never a third call.

Do not spend a second call after a fundamental miss merely because one remains.

## Capability unavailable

When the built-in capability is unavailable, do not reserve an attempt. Report `omitted` only when the checked fallback permits omission. Otherwise report `unsatisfied` with `imagegen_capability_unavailable`.
