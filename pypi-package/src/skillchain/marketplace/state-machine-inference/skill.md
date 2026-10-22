# State Machine Inference

Reconstruct a controller's internal state machine from transitions observed in its output signals. Use mode changes, fault events, and input-output correlations to infer states, transition conditions, and command acceptance logic without access to the firmware source.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Load controller I/O data, fault database
REASON  --> Cluster output patterns into states, identify transitions
PLAN    --> Map fault conditions, derive acceptance logic
ACT     --> Output state machine, acceptance logic, fault map
```

## Inputs

- `transmit_inventory`: list[object] -- Controller's output messages with decoded signal time-series
- `receive_inventory`: list[object] -- Messages the controller reads with correlation evidence
- `fault_database`: list[object] -- Diagnostic trouble codes (DTCs) the controller can set, with trigger condition descriptions

## Outputs

- `state_machine`: object -- Named states, transition conditions (exact signal values), output behavior in each state
- `acceptance_logic`: object -- For each command input: conditions under which the controller accepts vs rejects it
- `fault_map`: list[object] -- Each fault condition mapped to the state transition it triggers

---

## Execution

### OBSERVE: Load Behavioral Data

**Entry criteria:** Transmit inventory, receive inventory, and fault database are provided.

**Actions:**

1. **Build signal timeline.** Align all transmitted and received signal time-series on a common time base. Each point: timestamp, signal name, value.

2. **Identify discrete-valued signals.** Signals with a small number of distinct values (< 20) are state indicators. Examples: operating mode flags, status enumerations, on/off flags. Record every distinct value observed.

3. **Identify continuous signals.** Signals with many distinct values are measurement or control signals. Record their operating range partitions (e.g., zero region, linear region, saturation region).

4. **Extract the DTC catalog.** Parse the fault database for the target controller. Each DTC has: code, description, trigger condition (usually in natural language), severity, and response action.

**Output:** Signal timeline, discrete signal value sets, continuous signal range partitions, DTC catalog.

---

### REASON: Identify States and Transitions

**Entry criteria:** Signal timeline is ready.

**Actions:**

1. **Cluster output patterns into states.** A "state" is a period where the controller's discrete output signals hold a stable combination of values:
   - Group consecutive time regions where all discrete signals are constant
   - Each unique combination of discrete signal values defines a candidate state
   - Name each state by its dominant characteristic (e.g., "IDLE", "ACTIVE", "FAULT")

2. **Identify state transitions.** A transition occurs when one or more discrete output signals change value:
   - Record the exact timestamp of each transition
   - Record the state before and the state after
   - Record which discrete signal(s) changed

3. **Identify transition triggers.** For each transition, look at the input signals (receive inventory) in the window immediately before the transition:
   - Which input signal changed? (The trigger)
   - What value did it change to? (The guard condition)
   - How long before the output transition? (The latency)
   - If no input changed, the transition is internally timed (timeout or periodic)

4. **Map command acceptance.** For each command-type input (signals that the controller is supposed to act on):
   - Find all instances where the command was present AND the controller's output responded (command accepted)
   - Find all instances where the command was present AND the controller's output did NOT respond (command rejected)
   - The difference between the two sets defines the acceptance conditions

5. **Identify fault states.** States where the controller outputs a fault indicator:
   - What input conditions preceded the fault?
   - Does the controller recover automatically, or does it require a reset?
   - How long does the fault persist?

**Output:** State catalog, transition table, acceptance conditions, fault state characteristics.

---

### PLAN: Build the Formal Model

**Entry criteria:** States, transitions, and acceptance conditions are identified.

**Actions:**

1. **Build the state transition table.** For each transition:
   ```
   Current State | Trigger | Guard Condition | Next State | Latency
   IDLE          | CMD_IN  | speed > 3.8 m/s | ACTIVE     | 20 ms
   ACTIVE        | CMD_IN  | torque > 261     | FAULT      | 0 ms
   FAULT         | timeout | 200 frames       | COOLDOWN   | 4000 ms
   ```

2. **Map DTCs to transitions.** For each DTC in the fault database:
   - Match its trigger condition to an observed fault transition (or predict which transition it maps to if not yet observed)
   - Record: DTC code, trigger condition, resulting state, recovery path

3. **Define output behavior per state.** For each state, what does the controller output?
   - Which messages does it transmit? At what rate?
   - What signal values does it hold?
   - Does it accept commands in this state?

4. **Identify missing observations.** States or transitions that the DTC database implies but that were never observed in the captures:
   - These are "dark states" reachable only under conditions not present in the data
   - List each with the input condition that would reach it

**Output:** Formal state machine, DTC-to-transition map, per-state output specification, dark state list.

---

### ACT: Deliver the Model

**Entry criteria:** Formal model is complete.

**Actions:**

1. **Format the state machine.** Present as both a transition table and a state diagram (text-based):
   ```
   [INIT] --power_on--> [LISTENING] --cmd_valid--> [ACTIVE]
                                     --cmd_invalid-> [FAULT]
   [ACTIVE] --cmd_off--> [COOLDOWN] --timeout_4s--> [LISTENING]
   [FAULT]  --reset----> [INIT]
   ```

2. **Format the acceptance logic.** For each command type:
   ```
   COMMAND: steering torque overlay
   ACCEPTED WHEN:
     - Controller is in ACTIVE state
     - Vehicle speed > 3.8 m/s
     - Torque magnitude <= 261 counts
     - Torque rate of change <= 3 counts/frame
     - Counter is sequential (no gaps)
     - Checksum is valid
   REJECTED WHEN:
     - Any acceptance condition is violated
     - Controller is in FAULT or COOLDOWN state
   ```

3. **Format the fault map.** Table of DTCs with their state machine implications.

4. **List open questions.** Dark states and untested transitions.

**Output:** state_machine, acceptance_logic, fault_map.

## Exit Criteria

1. Every observed state is named and characterized
2. Every observed transition has a trigger and guard condition
3. Command acceptance logic is defined for all command inputs
4. DTCs are mapped to state transitions where evidence supports it
5. Unobserved states are listed as open questions

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No discrete signals found | All signals are continuous; state inference requires partitioning continuous ranges into regions |
| REASON | Single state observed | Captures lack operating condition variety; recommend captures under different modes |
| REASON | Transition trigger unclear | Multiple inputs changed simultaneously; recommend single-action captures to isolate |
| PLAN | DTC has no matching observation | List as predicted dark state with the trigger condition from the DTC description |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
