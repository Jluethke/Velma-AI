# Resource Loading And Leveling

Assign resources (labor, equipment, materials) to activities and level resource demands to feasible rates.

## Inputs

- `baseline-schedule`: CPM schedule with dates and float
- `project-scope`: Quantity takeoff and crew compositions for each work type

## Outputs

- `resource-loaded-schedule`: Schedule with labor, equipment, and material curves showing peak demands
- `resource-plan`: Crew mobilization plan, equipment procurement schedule, and material delivery schedule

## Process

1. Assign labor resources. Define crew compositions for each activity type (e.g., concrete pour: 1 foreman, 6 laborers, 2 finishers, 1 pump operator). Calculate daily labor demand from overlapping activities. Plot total labor histogram. Identify peaks that exceed available or practical workforce.
2. Level resources. Shift non-critical activities within their float to reduce peak demand. Priority: delay activities with most float first (preserve near-critical paths). If leveling within float is insufficient, accept the peak (with overtime/additional crews) or extend the schedule (if float is available on overall project). Target smooth S-curve for cumulative labor: rapid ramp-up is expensive (mobilization, training), so aim for gradual buildup.
3. Plan equipment. Long-lead equipment: tower cranes (procurement 12 to 16 weeks), specialized formwork systems, TBMs. Schedule crane availability to match structural erection. Plan crane locations, reach, and capacity for lifting requirements. Earthmoving fleet: match fleet size to daily production rate needed for schedule.
4. Plan material deliveries. Long-lead materials: structural steel (fabrication 8 to 16 weeks after approval), precast concrete (8 to 12 weeks), custom mechanical equipment. Just-in-time delivery for high-volume materials (concrete, rebar, drywall) to minimize site storage. Procurement schedule: back-calculate from need date minus fabrication time minus approval time minus shop drawing preparation.
5. Generate cash flow projection. Distribute cost to activities (cost-loaded schedule). Plot cumulative cost curve (S-curve). Monthly billing projection from work completed. Early cash flow for mobilization, late peak for MEP and finishes. Use this for project financing (draw schedule against construction loan).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
