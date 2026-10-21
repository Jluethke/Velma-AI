# TDD Behavior List From Requirements

**One-line description:** Turns a written requirement into an ordered list of single, observable behaviors with concrete input and expected output examples, using the ZOMBIES checklist, so each row becomes exactly one failing test later.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `requirements` (string, required): The requirement text: ticket body, user story with acceptance criteria, spec section, or bug report. Path or pasted text.
- `domain_glossary` (string, optional): Definitions of domain terms used in `requirements` (for example what "active customer" means). When absent, undefined terms go to `open_questions`.

---

## Outputs

- `behavior_list` (object[]): Ordered rows. Each row: `id` (B01, B02, ...), `behavior` (one sentence, one outcome), `given` (starting state), `when` (one action), `then` (one observable result), `example_input`, `expected_output`, `zombies_tag` (Z, O, M, B, I, E, or S), `source` (the quoted requirement line it came from), `status` ("todo").
- `open_questions` (string[]): Every ambiguity, missing rule, or undefined term found, each with the quoted requirement line. Empty when none.

---

## Phase 1: Extract Rules and Examples

### Entry Criteria
- `requirements` is present and is not empty.

### Actions
1. Copy `requirements` into a working list and split it into sentences. Number each sentence R1, R2, ...
2. For each sentence, mark it as one of: RULE (states what the system must do), EXAMPLE (gives concrete values), CONSTRAINT (limit, format, size, time), NOISE (background, motivation). Ignore NOISE from here on.
3. For every RULE, write at least one concrete example with real values. Use the exact values from an EXAMPLE sentence when one exists. When none exists, pick plain values that make the rule's outcome obvious (for "orders over the free-shipping threshold ship free", ask for the threshold; do not invent it).
4. For every CONSTRAINT, write one example exactly at the limit and one just past it, using the limit value given in the text.
5. Any term not defined in `requirements` or `domain_glossary`, any rule whose outcome is not stated, and any limit whose value is not given goes to `open_questions` with its R-number. Do NOT guess a value.

### Output
Numbered sentence list with RULE/EXAMPLE/CONSTRAINT tags and draft examples.

### Quality Gate
- Every RULE and CONSTRAINT sentence has at least one example row (count RULE+CONSTRAINT sentences, count rows that cite them, compare).
- Every number in an example either appears verbatim in `requirements` or `domain_glossary`, or is listed in `open_questions`.

---

## Phase 2: Expand With ZOMBIES

### Entry Criteria
- Draft examples exist.

### Actions
1. Walk the ZOMBIES checklist (James Grenning) for each unit named in the rules and add a row for every letter that applies:

| Letter | Ask | Example row to add |
|---|---|---|
| Z (Zero) | What happens with nothing: empty list, empty string, zero quantity, no user? | `total([])` returns 0 |
| O (One) | What happens with exactly one item? | `total([5])` returns 5 |
| M (Many) | What happens with several items? | `total([5, 7])` returns 12 |
| B (Boundaries) | What happens exactly at each stated limit and one step past it? | max length 64: 64 chars accepted, 65 rejected |
| I (Interface) | What does the caller pass and get back? Name and signature. | `total(items: list[int]) -> int` |
| E (Exceptions) | What happens with invalid input or a failing dependency? | negative quantity raises `ValueError` |
| S (Simple) | Which scenario is the simplest one to start with? | mark it as the first row |

2. A row with "and" in `then` describes two outcomes. Split it into two rows.
3. A row whose `then` cannot be observed from outside the unit (a private field, an internal counter) is rewritten as the externally visible effect (return value, raised error, stored record, emitted message, HTTP status).
4. Exception rows must name the error type or status code stated in `requirements`. When the text does not state it, add to `open_questions`.

### Output
Expanded rows with `zombies_tag`.

### Quality Gate
- No `then` field contains the word "and" joining two results (search the rows for " and ").
- Each row has a non-empty `example_input` and `expected_output`.

---

## Phase 3: Order and Emit

### Entry Criteria
- Expanded rows exist.

### Actions
1. Sort rows in this order: S first, then Z, O, M, B, I, E. Within a letter, keep requirement order (R1 before R2).
2. Assign ids B01, B02, ... in the sorted order. Set every `status` to "todo".
3. Remove exact duplicates (same `given`, `when`, `then`). Keep the lower id.
4. Emit `behavior_list` and `open_questions`.

### Output
`behavior_list`, `open_questions`.

### Quality Gate
- Ids are contiguous from B01 with no gaps.
- Every row has a `source` that quotes a sentence from `requirements`.
- `open_questions` is present (an empty list is valid).

---

## Worked Example

Illustrative only.

Input `requirements`: "Usernames must be 3 to 20 characters, letters, digits and underscore only. Return an error telling the user what is wrong."

Phase 1 produces R1 (CONSTRAINT: length 3 to 20), R1 (RULE: allowed characters), R2 (RULE: error message). Examples: "abc" valid, "ab" invalid, 20 chars valid, 21 chars invalid, "a-b" invalid.

Phase 2 adds Z: "" invalid; E: None/null input. The error text is not specified, so `open_questions` gets: "R2: exact error message text and whether one error or all errors are returned."

Phase 3 output (first rows):

| id | behavior | example_input | expected_output | zombies_tag |
|---|---|---|---|---|
| B01 | accepts a plain 3-letter name | "abc" | valid | S |
| B02 | rejects empty name | "" | invalid, reason too_short | Z |
| B03 | accepts exactly 20 characters | "a" * 20 | valid | B |
| B04 | rejects 21 characters | "a" * 21 | invalid, reason too_long | B |
| B05 | rejects a hyphen | "a-b" | invalid, reason bad_char | E |

---

## Exit Criteria

DONE when every RULE and CONSTRAINT sentence maps to at least one ordered, single-outcome behavior row with concrete values, and every gap is recorded in `open_questions` instead of guessed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `requirements` is empty or only motivation text | **Stop**: return an empty `behavior_list` and ask for acceptance criteria in `open_questions`. |
| Phase 1 | A limit or rule outcome is not stated | **Adjust**: add it to `open_questions`; do not invent a value. |
| Phase 2 | A row cannot be expressed as an observable result | **Adjust**: rewrite as the external effect, or move it to `open_questions`. |
| Phase 3 | Two rows contradict each other | **Return**: list both in `open_questions` and ask which rule wins. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
