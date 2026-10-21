# Conflict Resolver

**One-line description:** Process assertiveness_score, conflict_description, conflict_summary to produce assertiveness_score, assumptions_and_caveats, communication_approach.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `assertiveness_score` (string, required): Input for assertiveness score.
- `conflict_description` (string, required): Input for conflict description.
- `conflict_summary` (string, required): Input for conflict summary.
- `cooperativeness_score` (string, required): Input for cooperativeness score.
- `implementation_guidance` (string, required): Input for implementation guidance.
- `power_dynamics_assessment` (string, required): Input for power dynamics assessment.
- `primary_mode` (string, required): Input for primary mode.
- `recommended_strategies` (string, required): Input for recommended strategies.
- `relationship_classification` (string, required): Input for relationship classification.
- `relationship_importance` (string, required): Input for relationship importance.
- `relationship_type` (string, required): Input for relationship type.
- `secondary_mode` (string, required): Input for secondary mode.
- `stakes_assessment` (string, required): Input for stakes assessment.
- `stakes_level` (string, required): Input for stakes level.
- `thomas_kilmann_analysis` (string, required): Input for thomas kilmann analysis.
- `urgency_classification` (string, required): Input for urgency classification.
- `your_assertiveness_preference` (string, required): Input for your assertiveness preference.

---

## Outputs

- `assertiveness_score` (object): Assertiveness Score.
- `assumptions_and_caveats` (object): Assumptions And Caveats.
- `communication_approach` (object): Communication Approach.
- `confidence_level` (object): Confidence Level.
- `conflict_summary` (object): Conflict Summary.
- `consistency_check` (object): Consistency Check.
- `contingencies` (object): Contingencies.
- `cooperativeness_score` (object): Cooperativeness Score.
- `cultural_context_note` (object): Cultural Context Note.
- `implementation_guidance` (object): Implementation Guidance.
- `mismatch_warnings` (object): Mismatch Warnings.
- `missing_inputs_plan` (object): Missing Inputs Plan.
- `mode_rationale` (object): Mode Rationale.
- `potential_obstacles` (object): Potential Obstacles.
- `power_dynamics_assessment` (object): Power Dynamics Assessment.
- `preflight_confirmation` (object): Preflight Confirmation.
- `preparation_steps` (object): Preparation Steps.
- `primary_mode` (object): Primary Mode.
- `recommended_strategies` (object): Recommended Strategies.
- `relationship_classification` (object): Relationship Classification.
- `secondary_mode` (object): Secondary Mode.
- `stakes_assessment` (object): Stakes Assessment.
- `success_indicators` (object): Success Indicators.
- `tension_summary` (object): Tension Summary.
- `thomas_kilmann_analysis` (object): Thomas Kilmann Analysis.
- `timing_recommendation` (object): Timing Recommendation.
- `urgency_classification` (object): Urgency Classification.

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

Return the structured result containing `assertiveness_score`, `assumptions_and_caveats`, `communication_approach`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
