# Image Scout Search

Read this reference only when the assignment contains real search or focused repair authorises one real search.

## Query design

Translate the checked subject and evidence into concise terms. Keep compound species names, proper nouns, and technical terms intact.

For a named species, try its full common name first. If one word contaminates the results, use the scientific name, a faithful synonym, or a precise visible description in the next compiled step.

For a place outside the English-speaking world, include local-language terms before concluding that no real image is available. Do not add local-language terms to a generic object with no place identity.

Write each query under the entry's owned work folder. Use the exact source, round, candidate count, and output directory in the compiled schedule.

## Search order

For one filename:

1. Run only the next compiled schedule step.
2. Read its summary.
3. Discard candidates whose metadata clearly names another subject.
4. Compare the remaining candidates together.
5. Open a possible winner as an original.
6. Stop immediately when one faithful winner exists.
7. Run the next step only when no faithful winner exists.

Do not run two source steps for the same filename in parallel. Parallel calls are for different filenames.

## Completed and failed calls

A summary with `complete: true` proves that one compiled search step completed. An empty result list is valid completed evidence.

A non-zero call, `complete: false`, authentication failure, rate limit, transport failure, or unreadable summary proves nothing about source availability.

Retry one clearly transient transport failure once. Use a `retry-1` child directory inside that compiled step's output directory. The retry summary is `retry-1/<the same compiled summary filename>`. Never overwrite the first failed summary. Never retry authentication or rate limit as if it were a semantic search.

If a required compiled step remains unavailable after that one retry, the entry's own contract decides what happens next. When `fallback_action` is `ai`, the outage is not a terminal answer: the lesson has an authorised substitute, so continue to generation and let the generation outcome be the result. Otherwise report `real_source_unavailable`, because no substitute is authorised and a picture invented in place of an outage would be provenance the contract refused.

## Candidate inspection

Use candidate hashes to avoid opening identical downloads twice. Similar descriptions are not duplicates.

Inspect candidates in a grouped visual pass first. A grouped view can reject an obvious wrong subject, unsafe image, unusable crop, or irrelevant scene. It cannot be the only evidence for an accepted image.

Open every selected original. Open a rejected original when a small detail, exact species, count, text, identity, or crop cannot be settled in the grouped view.

Check:

- exact subject;
- lesson claim;
- period, place, and typicality;
- pedagogical constraint;
- use-size fit;
- readable English when authentic text is required;
- classroom suitability;
- every load-bearing evidence item.

For a word-bank image used at about 10 mm, require one instantly recognisable object, a plain or quiet background, a near-square usable crop, and a subject that remains clear at print size.

## Selecting a real image

Write only the exact summary path and candidate ID in the result. Do not copy source metadata or compose attribution.

Never copy a synthetic cached asset into a real route. Never use a cache record as search-exhaustion evidence.

## Focused repair

When the assignment names prior search summaries, inspect every unused candidate that could fix the exact review fault before making a new source call.

Use the one additional repair search only when prior candidates cannot fix the fault. Preserve the original history. Do not search siblings.
