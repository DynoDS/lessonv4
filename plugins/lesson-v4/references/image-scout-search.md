# Image Scout Search

Read this reference only when the assignment contains real search or focused repair authorises one real search.

## The ladder

The compiled schedule is a ladder, cheapest rung first, and you stop at the
first faithful winner. Never run a rung the schedule has not compiled, and never
skip one to reach the rung below it.

| Rung | What it searches | Command |
| --- | --- | --- |
| `unsplash` | modern stock photography | `unsplash_fetch.py "<query>" --count N --round R --output <dir>` |
| `wikimedia` | Wikimedia Commons | `wikimedia_fetch.py "<query>" --count N --round R --output <dir>` |
| `openverse` | about a hundred collections at once - Flickr Commons, where archives and museums publish their photographs, the Science Museum Group, the Smithsonian, Europeana, university libraries | `openverse_fetch.py "<query>" --count N --round R --output <dir>` |
| `web` | the holding institution's own page, found by you | `web_fetch.py "<subject>" --candidates <file.json> --count N --round R --output <dir>` |

The first three take a query and return candidates. `openverse` is on every real
schedule because one free keyless call costs nothing once a winner has been
found above it, and it is where a real photograph of a real place at a real date
usually lives: a lesson wanting a British classroom around 1900 gets school
photographs from museum and city-archive collections there and from nowhere
else on this ladder.

## The open-web rung

`web` is compiled only for a picture whose contract says the lesson gets nothing
if the search fails. It exists because the evidence a history or geography
lesson needs is often held by exactly one institution and published on exactly
one of its own pages, indexed by nothing. Five such photographs, sitting on a
county record office's blog, cost a Year 4 lesson its slides, its worksheet and
its answer key.

This is the one rung where you do the finding. Search the web for the subject
the assignment names, open the page the holding institution publishes it on, and
write a candidates file:

```json
[
  {
    "page_url": "https://<the institution's own page>",
    "image_url": "https://<the image on that page>",
    "publisher": "Essex Record Office",
    "terms_note": "what that page actually says about reuse, or that it says nothing",
    "licence_name": "CC BY 4.0",
    "licence_url": "https://creativecommons.org/licenses/by/4.0/"
  }
]
```

`licence_name` and `licence_url` go in together or not at all. Give them when
the page states a licence, copied from what it says. Leave both out when it
states none, which is ordinary for an archive blog or a museum collection entry:
the fetcher then records the basis the picture is actually used on, which is
fair dealing for illustration for instruction with the source acknowledged. That
is why `publisher` is required - it is the credit that basis depends on, and the
deck prints it under the picture.

`--count` is the step's compiled `candidate_count`, not the number of
candidates you chose: the summary is checked against the schedule that compiled
it, so a good fetch of two candidates against a three-candidate step is thrown
out if it records two.

Go to the institution that holds the picture. The fetcher refuses a picture
library (Getty, Alamy, Shutterstock and their kind), because selling the licence
is their whole business and taking the preview is not fair dealing under any
reading; and it refuses an aggregator or social feed (Pinterest, Instagram, X
and their kind), because the poster is not the rights holder and provenance
pointing at a re-poster is worse than none. Prefer a museum, archive, record
office, library, university, national body or government page - they hold the
thing, they say who made it, and they are usually glad it is being taught from.

Judge an open-web candidate exactly as hard as any other. Nothing indexed it,
so nothing has checked the subject but you.

## Query design

Translate the checked subject and evidence into concise terms. Keep compound species names, proper nouns, and technical terms intact.

**Every word you add is another filter.** A source search matches all of the words, not the best of them, so the words that describe how a picture should look - `wide`, `landscape`, `ground view`, `standing in water`, `riverfront`, `buildings` - are what turns a subject with thousands of photographs into zero results. `Manaus Rio Negro riverfront` found nothing while `Manaus Rio Negro` has thousands; `Iquitos Peru Amazon river port boats buildings` found nothing while `Iquitos port` has thousands. Search for what the picture is OF, in two to four words, and judge how it looks when you look at the candidates: that judgement is yours to make from the images, not the search engine's to make from your adjectives. The fetcher retries a fruitless query with the descriptor words removed and records both queries, so a summary showing two `queries_run` is telling you the first one was too long.

**Read past the first three.** The summary's `considered` list holds every candidate the search returned, not only the ones downloaded, because relevance ranking puts richly described satellite and archive files above ordinary ground photographs: three satellite views of the Sahara came back while a usable Algerian Sahara photograph sat at rank eight. When the downloaded candidates are all the wrong kind, look down that list and search again by what you find there, rather than reporting the subject as unavailable.

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
