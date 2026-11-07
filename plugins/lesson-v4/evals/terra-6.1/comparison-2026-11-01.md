# Lesson v4: GPT-6.1 Terra comparison

The comparison was interrupted by the Codex usage limit. It is complete for diagram-anchor, incomplete for image-scout, and not started for slide-decorator. The decision is to use the previous models for all three roles until adequate comparisons can be completed. The launcher still supports GPT-6.1 Terra.

| Role | Decision | Evidence |
| --- | --- | --- |
| Diagram anchor | Return to GPT-6.1 Sol, medium | Six paired runs across three cases. Both models generally placed the inspected labels sensibly; Sol produced all six required reports. Terra claimed completion in one run after a command failed and did not create the required report. |
| Image scout | Return to GPT-6 Luna, medium, pending further testing | One paired assignment completed. Both returned validated source-unavailable results. The next run hit the usage limit; later launches were blocked. There is insufficient evidence about comparative sourcing or image selection. |
| Slide decorator | Return to GPT-6 Luna, medium, pending testing | Three varied saved decks were prepared and passed rendering preflight. No model comparison runs started before the usage limit. |

The latter two decisions are precautions due to missing evidence; they do not show that Luna is better than Terra.

## Diagram-anchor detail

The cases were a digestive-system lesson with multiple labelled images, a history lesson with two historical diagrams, and a geography lesson with no labelled diagrams. Each model ran each case twice with medium thinking and reversed run order on the second repeat. They worked in separate copies of the same saved files, without existing anchor sidecars. The original lessons were not changed.

All 12 completed runs preserved fields outside the permitted diagram changes. All six Sol runs and five of six Terra runs produced the requested report with the required headings. In the other Terra run, the command intended to create the report exited unsuccessfully; the agent nevertheless returned COMPLETE and named a report that did not exist. The comparable Sol run produced the report. This is a hand-off failure, not proof that Terra's visual placement is worse. The test environment denied the supplied system Python executable; both models had to work around that restriction, which may have affected the failure rate.

The visual placements inspected on the digestive illustration and historical plan were broadly plausible. This small sample is not a measure of general reliability, and the saved input diagrams were already substantially anchored.

## Image-scout detail

The first paired case asked for an unlabelled digestive-route illustration. Both Luna and Terra produced a result that passed the existing validator and reported that real sources were unavailable. Wikimedia returned certificate errors and Openverse timed out; another source returned candidates that did not settle the assignment. A previous single-image judgement probe produced different decisions: Luna accepted an illustration and Terra rejected it due to unclear connections. That probe did not exercise full image sourcing and does not establish which model is better.

The second Terra attempt encountered the account usage limit during the run. The remaining attempts could not start. The isolated tests specified image generation as unavailable, so generated-image handling was not tested.

## Slide-decorator detail

Saved maths, sound-science and history decks passed the current renderer's preflight, but no paired model runs took place. An earlier single-slide visual probe found that both models identified the existing decorations and advised against adding more. It did not test the whole-deck workflow, rendering, placement, or validation and cannot support a model choice.

## Remaining work

When Codex usage is available again, run the unfinished image-scout cases and the three paired slide-decorator cases twice per model. Use fresh isolated copies and record source availability, actual accepted images, validators, rendered pages, failed attempts and elapsed time. Evaluate visual defects independently of model labels where possible. Resume a Terra trial only when the relevant role has adequate evidence against its previous model.
