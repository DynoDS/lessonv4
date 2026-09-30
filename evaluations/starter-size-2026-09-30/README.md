# Starter question size: before and after (handover item 3)

**The fault you spotted.** On history, science and RE starters, the question slide and its answer slide share one text size, so nothing jumps when the answers appear. The answer slide holds long answer sentences, so the size is picked to fit those, and the question slide inherits it. Result: small questions in big empty boxes. The current plugin now refuses the Shaftesbury starter for this (the questions fill 21% and 26% of their boxes).

**What the pictures show.**
- `before-shaftesbury-starter.png`: today's plugin. Small questions, lots of empty space.
- `after-shaftesbury-starter.png`: a trial where the question slide sizes its own text. The questions are large and fill the boxes. The answer slide is unchanged.

**The honest trade-off.** In the trial, when you click to the answer slide, the question text gets smaller to make room for the answers. The shared size was built to stop that jump.

**Not applied to the plugin.** The handover asked for you to judge this by eye first, so the real plugin is unchanged. The trial change is `prototype-change.diff` (one small change in how the question slide is measured). The two `.pptx` files let you click between the slides and see the jump for yourself.

**Another option, not built.** Put each answer in its own box under its question, so the questions keep the same place and size on both slides and only the answers appear. That needs more layout work; worth it only if the jump in the trial bothers you.
