# Mass Budget And Allocation

Set the total mass target and allocate it top-down to subsystems with maturity-based margins and not-to-exceed limits.

## Inputs

- `mass-requirement`: The system-level mass target or limit (for example maximum launch mass, payload capacity) and its source
- `system-architecture`: The subsystem breakdown the mass must be allocated across

## Outputs

- `mass-allocation`: The mass budget allocated to each subsystem, with a not-to-exceed value and a target value for each
- `margin-plan`: The mass growth allowance and management reserve held at each level and how they shrink as the design matures

## Process

1. Start from the hard system limit and work down. Identify the physical limit (launch vehicle capacity, structural rating, range requirement) and set the system mass target below it with a management reserve. Allocate the remainder to subsystems by function and by historical mass fraction for similar systems, so the allocation is grounded in data, not wishful splitting.
2. Hold a mass growth allowance sized to the design maturity. Early-stage estimates grow; carry a growth allowance that is large at concept (often 20 to 30% at the system level for a new design) and shrinks as mass moves from estimated to calculated to measured. The allowance is a planned reserve to be consumed deliberately, not slack to be spent silently.
3. Give each subsystem both a target and a not-to-exceed value. The target is what the subsystem designs to; the not-to-exceed is the allocation it may not cross without a system-level trade. The gap between them is the margin the system holds against that subsystem's growth.
4. Allocate to the controlling party and make it accountable. Each subsystem allocation has an owner who manages to it; a budget with no owner is not managed. Set the reporting cadence and the escalation path for an allocation that is trending over its not-to-exceed value.
5. Hold system-level management reserve separate from subsystem margins. Keep a reserve at the system level that only the system owner can release, so a subsystem overrun that cannot be recovered locally has a controlled path to resolution rather than silently eating the system margin. Document the reserve and the rules for drawing it down.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
