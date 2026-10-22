# Corrective Action And Reporting

Define corrective actions from the root cause, verify their effectiveness, document the complete failure analysis, and analyze field return trends for systemic issues.

## Inputs

- `failure-mechanism-determination`: Confirmed root cause with evidence
- `failure-report`: Original failure context for trend analysis

## Outputs

- `corrective-action-plan`: Specific corrective actions addressing the root cause: design change, process parameter adjustment, or component change, with owner and timeline
- `failure-analysis-report`: Complete FA report: failure description, analysis sequence, evidence at each step, root cause, corrective action, and lessons learned
- `trend-analysis`: Comparison of this failure mode to historical field returns and manufacturing fallout data, identifying if it is a new mode or a recurring pattern

## Process

1. Define corrective actions matched to the root cause category. For design root cause: modify the design (pad size, trace routing, thermal relief, component selection) and verify with analysis or prototype. For process root cause: adjust the process parameter (reflow profile, stencil aperture, placement force) and run a process validation (DOE or first-article inspection). For component root cause: escalate to the component supplier with evidence and qualification data.
2. Verify corrective action effectiveness. For design changes, run accelerated life testing on the modified design. For process changes, monitor the affected measurement on the next production lot. Define the success criteria: zero recurrence of this failure mode for N units, or parametric shift below a threshold.
3. Write the failure analysis report. Structure: executive summary (one paragraph with root cause and action), failure description and context, analysis sequence (each step with images and data), root cause determination (evidence chain), corrective action and verification plan, and lessons learned. Include all images at sufficient resolution for peer review.
4. Analyze the failure against the historical database. Is this failure mode new or recurring? If recurring, the prior corrective action was ineffective and needs escalation. Calculate the failure rate for this mode: failures per million units per year (or per thousand power-on-hours). Compare to the reliability prediction for this failure mode to assess whether the actual failure rate exceeds the predicted rate.
5. Feed the findings back to design and manufacturing. Add this failure mode to the FMEA for the product family. Update the incoming inspection criteria if the root cause was a component defect. Update the functional test limits if the test missed a precursor signature that could have caught this failure at production test.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
