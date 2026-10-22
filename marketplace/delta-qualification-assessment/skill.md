# Delta Qualification Assessment

Assess a design, material, or process change and define the minimum delta qualification needed to re-establish the qualification basis without repeating the full program.

## Inputs

- `change-definition`: The proposed design, material, process, or supplier change and its intent
- `qualification-plan`: The original qualification basis and the evidence that supports it

## Outputs

- `change-impact`: The assessment of which qualified requirements and environments the change affects and which remain covered by the original evidence
- `delta-qual-scope`: The minimum set of re-tests and re-analyses needed to re-qualify, with the rationale for everything not repeated

## Process

1. Map the change to the requirements and environments it touches. A change affects only some of the qualification basis; trace which requirements, load paths, and environments the change could influence and which it demonstrably cannot. The unaffected qualification evidence still stands and is not repeated.
2. Classify the change by its qualification impact. A change with no effect on form, fit, function, or the qualified environments may need only analysis or inspection; a change that alters a load path, a material, or a thermal path needs targeted re-test of the affected environments; a change that invalidates the architecture needs full re-qualification. State the class and its basis.
3. Scope the delta tests to the affected envelope with margin. Re-run only the environments the change affects, at the qualification levels, on an article built with the change; do not repeat environments the change cannot influence. Where the change could interact with an untested-together environment, add the combined case.
4. Preserve traceability from the original basis to the delta. Document which original evidence remains valid, which is superseded, and which new evidence replaces it, so the qualification basis stays a complete and auditable record after the change. A delta qualification that breaks the traceability chain leaves the product's qualification status ambiguous.
5. Decide re-qualification versus grandfathering against risk. For a change with large uncertainty or high consequence, favor re-test even when an analysis argument exists; for a low-risk change with strong analysis and heritage, a documented analysis-based delta is appropriate. Record the decision and its risk rationale so a later reviewer can follow the logic.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
