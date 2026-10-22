# Capa And Post Market Surveillance

Operate the CAPA system and post-market surveillance: complaint handling, adverse event reporting, trending, and corrective/preventive action to maintain product quality.

## Inputs

- `quality-manual`: Quality system procedures for complaint handling and CAPA
- `control-plan`: Manufacturing controls and inspection specifications

## Outputs

- `capa-system-records`: CAPA log with root cause analyses, corrective actions, effectiveness checks, and closure records
- `post-market-surveillance-report`: Trending of complaints, adverse events, and quality metrics with periodic management review

## Process

1. Complaint handling: log every complaint with date, device identification, complaint description, and reporter information. Evaluate each complaint for reportability: if the complaint involves death, serious injury, or malfunction that could cause either, file an MDR (Medical Device Report) with FDA within 30 days (5 days for events requiring remedial action).
2. For each complaint requiring investigation, perform root cause analysis: collect the device for analysis if possible, review production records for the device (lot history, inspection results, any process deviations), and determine whether the issue is a design problem, manufacturing problem, or use problem.
3. CAPA process: corrective action addresses an existing nonconformity and prevents recurrence. Preventive action addresses a potential nonconformity before it occurs. For each CAPA, document the problem description, investigation, root cause, action plan, implementation, and effectiveness verification.
4. Effectiveness verification: after implementing a corrective action, monitor the relevant metric for a defined period (typically 3-6 months or 3 production lots) to confirm the problem does not recur. If it does recur, the CAPA is ineffective and must be reopened with a different root cause or action.
5. Post-market surveillance trending: track complaint rate per units distributed, adverse event rate, return rate, and internal quality metrics (reject rate, CAPA count, audit findings). Report trends to management at defined intervals (quarterly or annually). Increasing trends trigger investigation before they become reportable events.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
