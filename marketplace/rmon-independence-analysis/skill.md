# Monitor Independence Analysis

**One-line description:** Specifies how the runtime monitor is kept independent from the component it supervises at six levels (process, inputs, clock, power, compute hardware, development artifacts), and lists every shared resource as a common-cause item with its mitigation, following dependent failure analysis practice (ISO 26262-9 clause 7, IEC 61508-2 Annex E for on-chip redundancy, the beta-factor discussion in IEC 61508-6 Annex D).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `simplex_design` (object, required): Output of `rmon-simplex-architecture-design`.
- `monitor_scope` (object, required): Output of `rmon-scope-supervised-component`.

---

## Outputs

- `independence_plan` (object): `levels` (one row per level: required separation, current state, gap), `shared_resources` (list of common-cause items with mitigation or `accepted:<who>,<why>`), `required_separation_source` (the requirement or standard clause that sets the required level).

---

## Phase 1: Determine Required Separation

### Entry Criteria
- `simplex_design.decision_module` and `safety_controller` are defined.

### Actions
1. Read the integrity level assigned to the monitor in the safety requirements (ASIL per ISO 26262, SIL per IEC 61508, PL per ISO 13849-1, or a project-defined level). If none is assigned, record that as an open item; do not assume one.
2. Fill the required separation per level from the project requirements. Use this table as the checklist of levels; the "minimum" column is engineering practice, and stronger separation comes only from a cited requirement:

   | Level | Minimum practice | Stronger option |
   |---|---|---|
   | Process | Monitor runs in its own OS process, not a thread or composed node in the component's process | Separate partition (hypervisor or separate OS) |
   | Inputs | Monitor reads raw sensor data or a separate sensor, not the component's fused or filtered output | Diverse sensor technology |
   | Clock | Monitor uses its own monotonic clock source for timeouts | Separate oscillator on separate hardware |
   | Power | Monitor host survives the component host's power fault | Separate supply and regulator |
   | Compute | Shared CPU allowed only with process isolation | Separate processor or microcontroller |
   | Development | Monitor code reviewed and tested separately; no shared learned model | Separate team or diverse implementation |

### Output
Required separation per level with source.

### Quality Gate
- Each of the six levels has a `required` entry and a `source` (requirement ID, standard clause, or `open`).

---

## Phase 2: Find Shared Resources

### Entry Criteria
- Required separation filled.

### Actions
1. Inspect the actual deployment for each level. Run and record:
   - Process: `ps -eo pid,ppid,comm,args | rg -i "<component>|<monitor>"` (Linux). Two different PIDs are required.
   - ROS 2 composition: `ros2 component list` shows nodes loaded into one container; the monitor must not appear in the component's container.
   - Inputs: compare the topic, CAN ID or device path the monitor reads with the ones the component publishes (`monitor_scope.commands`). A monitor input that is a component output is a shared resource unless it is the command being checked.
   - Hardware: `lscpu`, `cat /proc/device-tree/model` (on boards that have it), and the wiring diagram for power rails.
2. Write each shared item as `{resource, levels_affected, failure_that_defeats_both, mitigation}`. Example: shared 12 V rail, both lose power, mitigation: hardware watchdog plus fail-safe de-energize (see `rmon-linux-hw-watchdog`).
3. A mitigation must be a design element or a test, not "unlikely".

### Output
`shared_resources` list.

### Quality Gate
- The two PIDs (or two hosts) are recorded with the command output that shows them.
- Every shared resource has a mitigation or an `accepted:` entry naming a person and reason.

---

## Phase 3: Record Gaps

### Entry Criteria
- Phase 2 complete.

### Actions
1. Compare required versus current per level; write `gap` where current is weaker.
2. Emit `independence_plan` JSON. Each gap feeds a fault injection case in `rmon-fault-injection-plan` (for example: kill the component process and confirm the monitor keeps running).

### Output
`independence_plan`.

### Quality Gate
- Every `gap` row has a matching planned test ID or an owner.
- The JSON file parses with `python -c "import json; json.load(open('independence_plan.json'))"`.

---

## Worked Example

Illustrative only.
```
$ ps -eo pid,ppid,comm | rg -i "policy|monitor"
 2114     1 policy_node
 2190     1 speed_monitor
$ ros2 component list
/ComponentManager
  1  /policy_node
```
Process level: separate PIDs, monitor not in the container. Inputs level gap: the monitor reads `/odom_filtered` produced by the same EKF the policy uses; mitigation: read raw wheel encoder ticks on `/wheel_ticks`. Power: shared 24 V bus, mitigation: hardware watchdog drops motor enable on monitor power loss.

---

## Exit Criteria

DONE when every level has required versus actual separation with evidence, every shared resource has a mitigation or named acceptance, and every gap maps to a test or owner.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No integrity level assigned | **Adjust**: record minimum practice and mark the level `open`. |
| Phase 2 | Cannot access the target to run `ps` | **Return**: request deployment access; a design document alone is not evidence. |
| Phase 2 | Monitor runs as a thread inside the component | **Stop**: move it to its own process before further testing. |

**Do not:** count two threads as two processes, accept "unlikely" as a mitigation, or have the monitor trust the component's own health flag.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
