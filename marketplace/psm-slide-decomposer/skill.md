# Psm Slide Decomposer

Decompose the content into slides, one idea per slide. Each slide carries a single idea, a single visual, and a single spoken explanation. The most common failure is a slide that holds three ideas, which forces the audience to read instead of listen and splits their attention from you.

## Inputs

- `supporting-arguments`: The arguments that become slide ideas
- `evidence-map`: The evidence that becomes the visual on each slide

## Outputs

- `slide-outline`: One slide per idea, each with its single visual and the spoken point it carries
- `slide-idea-count`: A count confirming no slide holds more than one idea, with overloaded slides split

## Process

1. Give each argument one lead slide, and give each strong piece of evidence its own slide if it needs room to land.
2. Write the one idea for each slide as a short sentence, and make it the slide's title. The title is the point, not a label like 'Results.'
3. Choose one visual per slide that shows the idea. If the visual needs a second visual to be understood, the slide holds two ideas.
4. Count ideas per slide. Any slide with more than one idea gets split, even if that grows the deck. More slides with one idea beat fewer slides with three.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
