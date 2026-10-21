# Independent Emergency Stop Chain Design (Normally Closed, Energize to Run)

**One-line description:** Designs a hardwired emergency stop chain for a drive-by-wire vehicle or mobile robot in which every stop source is a normally closed contact in a series loop, actuator power flows only while the loop is energized, a monitored safety relay with manual reset drives redundant contactors or Safe Torque Off inputs, software can open the loop but has no path to close or bypass it, and braking is never removed or delayed by the stop.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `item_definition` (object, required): Output of `fusa-item-definition`.
- `actuator_list` (object[], required): Every powered actuator: name, supply voltage and current, how it is disabled (power removal, enable pin, STO input), and what the actuator does when de-energized (free-wheel, holds position, spring-applies).
- `stop_category` (string, optional): `0` or `1` per IEC 60204-1. When absent, Phase 1 selects it from the decision table.

---

## Outputs

- `estop_design` (object): `stop_sources`, `loop_wiring` (ordered list of contacts with channel), `safety_relay` (role, required features, vendor manual reference), `power_switching` (contactors or STO per actuator), `feedback_loop`, `reset`, `software_interface`, `brake_behavior`, `stop_category`, `design_rule_checks`, `open_questions`.

---

## Phase 1: Stop Sources and Stop Category

### Entry Criteria
- `actuator_list` has an entry for every actuator in `item_definition.functions`.
- The design is for testing on a bench or a closed course; this flow does not design road-legal vehicle systems.

### Actions
1. List every stop source. At minimum: one latching emergency stop push button reachable by the safety driver, one on the vehicle exterior or robot body, and one wireless emergency stop transmitter held by the test supervisor whose receiver opens its output on button press AND on loss of radio link. Buttons must be devices made for the purpose (IEC 60947-5-5: direct opening action, latching, red on yellow).
2. Add a software stop request relay `K_SW` whose coil is driven by the main computer or a supervisory MCU. Its normally open contact is in series with the loop, so the software holds the loop closed only while it is healthy and actively energizing the coil.
3. Pick the stop category:

   | Condition | Category (IEC 60204-1) |
   |---|---|
   | Removing actuator power immediately leaves the platform in a safe condition (brakes spring-apply, low speed, no load drop) | 0 |
   | Immediate power removal would cause a hazard (for example a heavy load falls, or the drive must brake electrically first) | 1, with the delay timed by a time-delayed safety relay output, never by software |

   The category 1 delay value must come from the user's measured stopping time; otherwise it is an open question.

### Output
Stop source list and stop category.

### Quality Gate
- At least three independent physical stop sources are listed, one of them wireless with loss-of-link stop.
- `K_SW` contributes a contact in series only; the design text contains no contact of `K_SW` in parallel with any stop source.
- If category 1 is chosen, the delay is either a cited measurement or an open question.

---

## Phase 2: Loop, Safety Relay and Power Switching

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Wire the loop in series, two channels: each emergency stop button has two NC contacts, one per channel; the wireless receiver and `K_SW` contacts go in both channels or in the channel arrangement the safety relay manual specifies. Order: supply, button 1, button 2, wireless receiver, `K_SW`, safety relay input. The loop is energized to run: a broken wire, an unplugged connector or a dead supply opens the loop and stops the platform.
2. Select a dual-channel safety relay (or safety controller) with these features, read from its manual: cross-fault detection between channels, monitored manual reset, feedback loop input for external contactors. Terminal names vary by vendor; copy them from the manual into `loop_wiring`.
3. For each actuator, choose the power switching method:

   | Actuator disable means | Switching |
   |---|---|
   | Drive with Safe Torque Off inputs | safety relay outputs to both STO channels per drive manual |
   | Plain motor driver or actuator | two contactors in series (`K1`, `K2`) on the actuator supply, coils driven by safety relay outputs |
   | Actuator that holds position when unpowered and that position is unsafe | **Stop**: redesign or add a mechanical release; list as open question |

4. Feedback: wire the mirror contacts (normally closed auxiliary contacts mechanically linked to the main contacts, IEC 60947-4-1 Annex F) of `K1` and `K2` in series into the safety relay feedback loop, so a welded contactor prevents reset.
5. Braking: confirm for every brake that the stop leaves braking available or applies it:
   - Base vehicle hydraulic brake operated by the safety driver: the stop chain never touches it.
   - Added brake actuator: it must apply on loss of power (spring-applied, power to release), or its power must not be switched by the stop chain.
   - Electric drive braking: only with category 1 and a hardware timer.
   No software step may gate, delay or veto a stop or a brake application.

### Output
`loop_wiring`, `safety_relay`, `power_switching`, `feedback_loop`, `brake_behavior`.

### Quality Gate
- Every actuator in `actuator_list` appears in `power_switching`.
- Every contactor-switched actuator has two contactors with mirror contacts in the feedback loop.
- `brake_behavior` states for every brake whether it is untouched or spring-applied on stop; none is "released on stop".

---

## Phase 3: Reset, Software Interface and Design Rule Check

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Reset: a physical reset button wired to the safety relay's monitored reset input, located where the operator can see the hazard zone. Releasing an emergency stop button alone must not restart anything (ISO 13850). After reset, actuators are powered but motion starts only after a separate, deliberate command.
2. Software interface: software may (a) de-energize `K_SW` to request a stop and (b) read the loop state through an optically isolated input from a spare safety relay auxiliary contact. Software has no output that can energize the loop, operate reset, or bypass a contact.
3. Run this design rule check and record each result in `design_rule_checks`:

   | Rule | Check |
   |---|---|
   | Every button and receiver contact is NC, `K_SW` uses a contact that is open when its coil is de-energized, and all are in series | trace each source in `loop_wiring` |
   | Loss of supply stops the platform | remove supply in the drawing; all actuator power paths open |
   | Single wire break stops the platform | cut each loop segment in the drawing |
   | Welded contactor detected | feedback loop prevents reset with one contactor closed |
   | Software cannot close the loop | no software output drives a coil whose contact is in parallel with a stop source or on the reset input |
   | Braking available after stop | `brake_behavior` row per brake |
   | Wireless link loss stops | receiver output opens on link loss per its manual |

4. Hand the design to `fusa-estop-bench-verification`, which proves each rule on hardware.

### Output
`estop_design`.

### Quality Gate
- All seven design rules have a recorded pass with the drawing reference.
- `software_interface` lists only stop request and status read.

---

## Worked Example

Illustrative only. Cart with traction motor controller (has an enable input, no STO), steering motor driver, and a spring-applied parking brake released by a 12 V solenoid.

- Phase 1: sources ES1 (dash), ES2 (rear bumper), RF1 (wireless receiver, opens on link loss), `K_SW` (driven by supervisory MCU GPIO through a transistor). Category 0: the parking brake spring-applies on power loss and test speeds are low.
- Phase 2: loop two-channel through ES1, ES2, RF1, `K_SW` to the safety relay. Outputs drive `K1` and `K2` in series on the 48 V traction and steering supplies; brake solenoid supply also through `K1`/`K2`, so the brake applies on stop. Mirror contacts of `K1`, `K2` in the feedback loop.
- Phase 3: rule check "software cannot close the loop": the MCU has one output, to `K_SW` coil; `K_SW` contact is in series. Pass.

---

## Exit Criteria

DONE when the design lists every stop source as an NC series contact, every actuator power path switched by the safety relay with feedback, braking available or applied after a stop, manual reset, a software interface limited to stop requests and status, and all design rules pass on the drawing.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Team proposes a software-only stop (a topic or CAN message) | **Stop**: a software message may request a stop through `K_SW` but is never the emergency stop. |
| Phase 1 | Wireless unit does not stop on link loss | **Stop**: choose a unit that does; read its manual. |
| Phase 2 | Actuator holds an unsafe position when unpowered | **Return**: redesign the actuator or add a mechanical release. |
| Phase 2 | Stop removes braking | **Stop**: redesign brake behavior first. |
| Phase 3 | Any design rule fails | **Adjust**: fix the drawing and rerun all seven checks. |

**Do not:** place any relay, transistor or PLC output in parallel with an emergency stop contact, use normally open stop buttons, add a software delay before power removal, or let releasing a button restart motion.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
