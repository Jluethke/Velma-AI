# Mass Tracking And Growth Reporting

Track actual mass bottom-up against the budget with basis-of-estimate codes and report growth trends so overruns surface early.

## Inputs

- `mass-allocation`: The subsystem mass budgets with target and not-to-exceed values
- `component-masses`: The current component mass values with their source: estimated, calculated, or measured

## Outputs

- `mass-status`: The current rolled-up mass against budget at system and subsystem level, with margin remaining and trend
- `growth-trend`: The mass-versus-time history and the projected mass at delivery, flagging subsystems trending over their not-to-exceed limit

## Process

1. Roll mass up bottom-up from a controlled component list. Every component carries a mass value and a basis code: measured (weighed hardware), calculated (from the detailed model), estimated (parametric or analogy), or allocated (a placeholder holding the budget). The rollup against the allocation shows margin remaining at each level.
2. Weight the margin by the basis maturity. A subsystem mostly on measured masses needs little remaining margin; one mostly on estimates needs more because it will still grow. Report not just the current mass but the quality of the number, so the system owner knows how much growth is still coming.
3. Track mass versus time and project to delivery. Plot the rolled-up mass across the program; a steadily rising line projects to a delivery mass that can be extrapolated well before integration. The trend, not just the snapshot, is what gives time to act on an overrun.
4. Flag and escalate subsystems trending over their not-to-exceed value. The reporting exists to surface a problem while it is still cheap to fix; a subsystem whose projection crosses its not-to-exceed limit triggers escalation to a trade study, not a note in a report nobody acts on. Set the threshold that triggers action.
5. Keep the mass record under configuration control and reconcile it with measured hardware. As components are built and weighed, replace estimates with measured values and reconcile the model; a large gap between calculated and measured mass is itself a finding (a process or model error) worth investigating. Maintain one controlled source of truth for mass.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
