# Stress Audit

**One-line description:** Process action_plan_detail_level, baseline_stress_rating, include_physical_health to produce action_plan, audit_summary, baseline_to_post_stress_rating.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `action_plan_detail_level` (string, required): Input for action plan detail level.
- `baseline_stress_rating` (string, required): Input for baseline stress rating.
- `include_physical_health` (string, required): Input for include physical health.
- `stressor_collection_method` (string, required): Input for stressor collection method.
- `user_context` (string, required): Input for user context.

---

## Outputs

- `action_plan` (object): Action Plan.
- `audit_summary` (object): Audit Summary.
- `baseline_to_post_stress_rating` (object): Baseline To Post Stress Rating.
- `next_review_date` (object): Next Review Date.
- `one_page_plan` (object): One Page Plan.
- `quick_wins` (object): Quick Wins.
- `stressor_list` (object): Stressor List.

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

Return the structured result containing `action_plan`, `audit_summary`, `baseline_to_post_stress_rating`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
