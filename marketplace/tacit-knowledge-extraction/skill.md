# Tacit Knowledge Extraction

Extract the tacit knowledge from the case narratives: the cues, patterns, and heuristics the expert uses but cannot articulate in the abstract.

## Inputs

- `case-narratives`: The 3-5 detailed case stories
- `decision-points`: The moments where the expert diverged from the obvious choice

## Outputs

- `cue-catalog`: The specific cues the expert noticed across cases (what they pay attention to that novices miss)
- `heuristic-library`: The rules of thumb the expert uses, stated as 'when I see X, it usually means Y, so I do Z'

## Process

1. Across all cases, list every cue the expert mentioned noticing. A cue is a specific observable thing: a number, a pattern, a behavior, a tone, an absence. Novices do not notice these because they have not learned which signals matter.
2. For each cue, record what it meant to the expert. The same cue can mean different things to a novice and an expert. A slight hesitation in a patient's voice might mean nothing to a novice but signal hidden symptoms to an experienced clinician.
3. Extract the heuristics: the expert's rules of thumb. These are usually in the form 'when I see [cue pattern], it usually means [interpretation], so I [action].' The expert may not state them this cleanly; you may need to reconstruct them from the cases.
4. Verify each heuristic by checking whether it appears in more than one case. A heuristic used in 3 of 5 cases is a core part of the expert's toolkit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
