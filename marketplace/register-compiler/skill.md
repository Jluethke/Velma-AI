# Register Compiler

**One-line description:** Process priority_summary, risks_with_ewis, scope_summary to produce gaps_and_refinements, register_markdown, risk_register.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `priority_summary` (string, required): Input for priority summary.
- `risks_with_ewis` (string, required): Input for risks with ewis.
- `scope_summary` (string, required): Input for scope summary.
- `watch_list` (string, required): Input for watch list.

---

## Outputs

- `gaps_and_refinements` (object): Gaps And Refinements.
- `register_markdown` (object): Register Markdown.
- `risk_register` (object): Risk Register.

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

Return the structured result containing `gaps_and_refinements`, `register_markdown`, `risk_register`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
