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

The host writes every generated image to a file of its own, and the call's result says where. Stage the picture by copying that file into the entry's AI folder in `WORK_ROOT`. On Codex the result's `output_hint` names the file, inside `~/.codex/generated_images/<this session's id>/`.

The same result also carries the picture as text, about a million characters of it. Keep that text out of your output and out of every command: printing it gets it cut short, and Windows refuses any command longer than about 32,000 characters, so a command built round it never runs. Print the result's field names and its `output_hint`, never the result whole. A Year 4 digestion lesson (6 October 2026) lost three finished pictures this way: the first calls printed a cut-off result, the recovery calls put the picture on a command line, and all three files were sitting in the host's folder throughout.

So when a call's result has gone, or named no path, look in the host's generated-images folder for files written since you reserved the call before deciding nothing came back. Several calls made together leave several files there: open each one and match it to its entry by what it shows. A file found there is that call's output and costs no further call.

Immediately call `record-generated`. A staged output remains `generated_unreviewed` until your own batch review below has looked at it. Nothing downstream reviews it for you, so a staged image you never opened reaches the lesson exactly as it came back.

If the result names no file and the host's folder holds nothing new, the call returned no image: `interrupt-open` the attempt, which consumes it and leaves the recovery call. Where that was the second call, report the entry `unsatisfied` with reason `attempt_budget_exhausted`. `rejected` is never the record for a call that returned nothing: the ledger refuses it, as the batch review below explains.

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
