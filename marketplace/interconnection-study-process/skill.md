# Interconnection Study Process

Navigate the utility interconnection study process: feasibility, system impact, and facilities study, identifying upgrade costs and schedule risks at each stage.

## Inputs

- `project-parameters`: Generation type, nameplate capacity (MW), location, point of interconnection, requested interconnection service (energy resource or network resource)
- `utility-territory`: Utility or ISO/RTO, applicable interconnection procedures (FERC LGIP/SGIP or state equivalent), queue position if applicable

## Outputs

- `study-results-summary`: Feasibility findings, system impact study results (thermal, voltage, stability, short circuit), and facilities study cost estimate with network upgrade allocation
- `interconnection-risks`: Identified risks: queue position dependencies, cluster study cost allocation, upgrade cost exposure, and schedule to commercial operation

## Process

1. Submit the interconnection request with the required deposit and technical data. For FERC-jurisdictional queues, this enters the cluster study process. Provide accurate data: nameplate MW, power factor range, reactive power capability, fault current contribution, and proposed point of interconnection.
2. Feasibility study (30-45 days typical): screens for obvious thermal overloads and voltage violations at the POI. A pass here does not guarantee interconnection; it means no fatal flaw at the screening level. A fail identifies which facilities need reinforcement.
3. System impact study (6-12 months for cluster studies): models the project along with all other projects in the same cluster. Evaluates steady-state thermal loading, voltage regulation, transient stability, and short circuit duty. Network upgrades identified here are allocated across projects in the cluster based on the utility's methodology (often pro-rata by MW or by the 'but-for' test).
4. Facilities study (3-6 months): provides the detailed engineering scope and cost estimate for the interconnection facilities (gen-tie line, interconnection substation, utility metering, and allocated network upgrades). Review the cost estimate against the project's pro forma. Network upgrade costs that exceed the project's budget typically require renegotiation or withdrawal.
5. Execute the interconnection agreement. Key terms: milestone schedule (financial security, construction start, commercial operation), default and termination provisions, cost responsibility for upgrades, and operating requirements (reactive power, frequency response, ride-through obligations). Missing milestones can result in queue loss.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
