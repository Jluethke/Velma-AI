# Safety Case Constructor

Build a structured safety case using Goal Structuring Notation linking claims to evidence through a documented argument.

## Inputs

- `safety-function-architecture`: Safety function designs with architecture choices
- `pfd-calculation`: PFD/PFH compliance calculations

## Outputs

- `safety-case-structure`: GSN diagram with goals, strategies, contexts, solutions (evidence), and assumptions
- `evidence-gap-register`: Evidence items required but not yet available, with plan to obtain

## Process

1. Define the top-level goal: 'System is acceptably safe for operation in [context].' Decompose using strategies: 'Argument over identified hazards' (each hazard gets a sub-goal), 'Argument over safety functions' (each function gets a sub-goal), 'Argument over lifecycle management' (process compliance).
2. For each hazard sub-goal, the argument links to: hazard analysis evidence (STPA results), risk assessment (SIL determination), mitigation design (safety function architecture), and verification (test results showing the function works as designed).
3. For each evidence item (solution node in GSN), assess its status: complete (evidence exists and is reviewed), in progress (evidence generation underway), or gap (not yet started). Enter gaps into the evidence gap register with a plan and due date.
4. Review the safety case for argument defeaters: assumptions that, if violated, break the argument. Each assumption must be stated explicitly. Common implicit assumptions: failure independence (requires common cause analysis), constant failure rate (requires wearout analysis), representative test conditions (requires test coverage argument).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
