# Stakeholder Comms Planner

**One-line description:** Process brand_guidelines, cultural_context, organizational_communication_norms to produce channel_matrix, communication_plan_document, communication_risk_assessment.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `brand_guidelines` (string, required): Input for brand guidelines.
- `cultural_context` (string, required): Input for cultural context.
- `organizational_communication_norms` (string, required): Input for organizational communication norms.
- `organizational_structure` (string, required): Input for organizational structure.
- `project_charter` (string, required): Input for project charter.
- `project_scope` (string, required): Input for project scope.
- `project_timeline` (string, required): Input for project timeline.
- `risk_register` (string, required): Input for risk register.

---

## Outputs

- `channel_matrix` (object): Channel Matrix.
- `communication_plan_document` (object): Communication Plan Document.
- `communication_risk_assessment` (object): Communication Risk Assessment.
- `communication_schedule` (object): Communication Schedule.
- `crisis_communication_protocol` (object): Crisis Communication Protocol.
- `engagement_tracking_dashboard_spec` (object): Engagement Tracking Dashboard Spec.
- `message_framework` (object): Message Framework.
- `stakeholder_analysis_matrix` (object): Stakeholder Analysis Matrix.
- `stakeholder_inventory` (object): Stakeholder Inventory.
- `template_library` (object): Template Library.

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

Return the structured result containing `channel_matrix`, `communication_plan_document`, `communication_risk_assessment`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
