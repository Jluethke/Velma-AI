# Difficult Conversation Preparation Phase 6

**One-line description:** Process anticipated_reactions, de_escalation_playbook, opening_script to produce confidence_assessment, preparation_checklist.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `anticipated_reactions` (string, required): Input for anticipated reactions.
- `de_escalation_playbook` (string, required): Input for de escalation playbook.
- `opening_script` (string, required): Input for opening script.
- `success_criteria` (string, required): Input for success criteria.

---

## Outputs

- `confidence_assessment` (object): Confidence Assessment.
- `preparation_checklist` (object): Preparation Checklist.

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

Return the structured result containing `confidence_assessment`, `preparation_checklist`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
