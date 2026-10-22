# Design Review Checklist And Signoff

Execute a structured design review using a checklist tied to the specific design's requirements and the fabricator's capabilities.

## Inputs

- `dfm-violation-list`: DFM violations to clear
- `impedance-verification-report`: SI verification results
- `length-matching-report`: Length matching results
- `clearance-table`: Voltage clearance verification

## Outputs

- `review-checklist-completed`: Every checklist item marked pass, fail, or waived with justification
- `open-issues-list`: Any items that could not be resolved with owner and target date
- `release-authorization`: Sign-off that the design is ready for Gerber generation and fabricator release

## Process

1. Walk through the checklist in order: schematic review items first (net connectivity, component values, power rail voltage/current), then layout review items (placement, routing, clearance, impedance, DFM), then output file review items (Gerber layers correct, drill file correct, pick-and-place file correct).
2. For each failed item: determine if it is a blocker (must fix before release) or a known-acceptable deviation (document the engineering justification). A DFM warning about minimum spacing on one trace may be acceptable if it is a non-critical signal and the fabricator has confirmed they can produce it. A safety clearance violation is always a blocker.
3. Verify the output files independently: generate Gerbers and view them in a Gerber viewer (not the EDA tool, which may show what is intended rather than what is generated). Check that every layer aligns, drill holes land on pads, solder mask openings expose the correct pads, and silkscreen text is readable and does not overlap pads.
4. Issue the release authorization with the signatures of the reviewer and the designer. Include the version, date, and a list of all waived items with justifications. This document becomes part of the design history file and is required for safety certification audits.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
