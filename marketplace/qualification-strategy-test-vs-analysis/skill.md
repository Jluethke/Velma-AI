# Qualification Strategy Test Vs Analysis

Decide, requirement by requirement, whether qualification is by test, by analysis, by inspection, or by similarity, and plan the evidence accordingly.

## Inputs

- `requirements-set`: The product requirements to be qualified, each with its verification need and consequence of failure
- `program-constraints`: Schedule, article availability, facility access, and the heritage of similar qualified hardware

## Outputs

- `verification-matrix`: Each requirement mapped to its verification method (test, analysis, inspection, or similarity) with the rationale
- `qualification-plan`: The order of qualification activities, the articles required, and the evidence each produces

## Process

1. Assign a verification method to every requirement and record why. Test is the default for anything that governs safety, has significant uncertainty, or cannot be predicted confidently; analysis suits well-understood physics anchored to test data; inspection suits dimensional and workmanship requirements; similarity suits features identical to previously qualified hardware under equal or more severe conditions.
2. Qualify by analysis only where the model is validated. Analysis-based qualification is acceptable when the method is anchored to test data on representative hardware and the margins are large; it is not acceptable to stand in for a test of a novel, high-consequence, or poorly-modeled behavior. State the validation basis for each analysis-qualified requirement.
3. Claim similarity only with a documented comparison. Qualification by similarity requires showing the new item is the same design, material, and process as a qualified item, used in an equal or less severe environment, with the deltas assessed. An undocumented 'it is basically the same' claim is not a qualification basis.
4. Order the qualification to find problems early and cheaply. Sequence inexpensive, high-information tests (functional, modal survey, proof) before the expensive, destructive, long-duration ones, so a basic flaw is caught before the program commits a qualification article to a month-long environmental run.
5. Plan the articles and their configuration. Qualification articles must represent the production design, material, and process; a qualification run on a hand-built article that differs from production does not qualify production. Identify how many articles each test needs and whether an article can be reused across non-destructive tests before a destructive one.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
