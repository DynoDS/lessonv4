# Image Scout Generation

Read this reference immediately before the first legal generation action.

## Authority

Generation is legal only when the assignment entry has a prompt file and hash, and either:

- `initial_route` is `ai`; or
- `initial_route` is `real` and every compiled search step completed without an operational failure or faithful winner.

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

Save the returned local file or returned media payload under the entry's AI folder in `WORK_ROOT`.

Immediately call `record-generated`. A staged output remains `generated_unreviewed` until visual review completes.

If the call returns neither a readable path nor a savable payload, complete the attempt as rejected with exact fault `imagegen_output_unavailable`. Report that terminal reason. Do not use a second call to recreate missing output.

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

Complete every first-pass ledger result before a correction call.

## Second call

A second call is legal only for:

- one precise near-miss;
- provider misdirection;
- an interrupted reserved call with one call left;
- a final-review rejection judged correctable.

Prefer an edit when the first image is a good base. Otherwise write one correction prompt under `WORK_ROOT`. Preserve every successful requirement. Hash and reserve that prompt.

Review authorised correction outputs together when there is more than one. There is never a third call.

Do not spend a second call after a fundamental miss merely because one remains.

## Capability unavailable

When the built-in capability is unavailable, do not reserve an attempt. Report `omitted` only when the checked fallback permits omission. Otherwise report `unsatisfied` with `imagegen_capability_unavailable`.
