# Difficult Conversation Preparation Phase 3

**One-line description:** Process anticipated_reactions, core_issue_statement, other_person_profile to produce opening_script.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `anticipated_reactions` (string, required): Input for anticipated reactions.
- `core_issue_statement` (string, required): Input for core issue statement.
- `other_person_profile` (string, required): Input for other person profile.

---

## Outputs

- `opening_script` (object): Opening Script.

---

## Worked Example

### Entry Criteria

All required inputs are provided and validated.

### Actions

## Phase 1: Analyze

Examine the provided inputs and extract key information.

### Quality Gate

All inputs parsed. No missing required fields.

### Actions

## Phase 2: Process

Apply domain logic to transform inputs into structured outputs.

### Quality Gate

All outputs populated. No empty required fields.

### Output

Return the structured result containing `opening_script`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
