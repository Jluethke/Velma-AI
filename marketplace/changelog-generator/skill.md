# Changelog Generator

**One-line description:** Process fixes_applied, improved_skill, original_skill to produce before_after_comparison, detailed_changelog.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fixes_applied` (string, required): Input for fixes applied.
- `improved_skill` (string, required): Input for improved skill.
- `original_skill` (string, required): Input for original skill.

---

## Outputs

- `before_after_comparison` (object): Before After Comparison.
- `detailed_changelog` (object): Detailed Changelog.

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

Return the structured result containing `before_after_comparison`, `detailed_changelog`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
