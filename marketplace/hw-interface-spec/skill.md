# Hardware Interface Spec

**One-line description:** Specifies every external interface of a board electrically (standard, levels, data rate, connector, termination role, isolation decision) and fixes the environment transient profile the board must survive.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `board_ask` (string, required): What the board must do, in plain words.
- `environment` (string, optional): "bench", "consumer", "industrial_24v", or "automotive_12v". Default: inferred from the ask and stated as an assumption.
- `host_platform` (string, optional): What the board attaches to (a dev kit header, USB, a vehicle or machine harness, standalone). Default: standalone with USB power.

---

## Outputs

- `interface_table` (object[]): One row per interface: name, direction, far-end device, electrical standard, signal levels, data rate, connector family and pin count, locking/keying, termination role (terminates or mid-bus), isolation decision with reason, and source citation for every host-side claim.
- `environment_profile` (object): Environment name, input source and nominal voltage, transient list (reverse polarity, overvoltage, surge, ESD, load dump as applicable) with the governing standard for each, and operating temperature range.

---

## Phase 1: Enumerate Interfaces

### Entry Criteria
- `board_ask` is present.

### Actions
1. Write the board's job in one sentence.
2. List every external interface the job implies: power in, communication buses, digital and analog I/O, debug and programming, indicators and controls. Give each a direction and the device on the other end.
3. State how the board attaches to `host_platform`.
4. Infer the environment when not given: vehicle battery feed means `automotive_12v`; PLC or cabinet supply means `industrial_24v`; USB means `consumer` or `bench`. Label the inference as an assumption.

### Output
Draft interface list and environment name.

### Quality Gate
- Every interface named or implied by the ask appears in the list.
- The environment is stated, given or labeled as assumed.

---

## Phase 2: Specify Each Interface Electrically

### Entry Criteria
- Draft interface list exists.

### Actions
1. For each interface, state the electrical standard, signal levels, data rate, connector family, and pin count (example: CAN FD, 500 kbps nominal and 2 Mbps data phase, differential, CANH/CANL plus ground).
2. For each bus, state whether this board terminates it or sits mid-bus. A mid-bus node adds no terminator.
3. Decide galvanic isolation for each interface: required when this board and the far end can sit at different ground potentials (separately powered equipment, long cable runs, vehicle chassis versus a separately powered computer). Record the reason.
4. State mating cycles and whether the connector must lock and key. Vehicle and industrial connectors lock.
5. Confirm every host-side level and pin assignment against the host's own documentation and cite it. When documentation is unavailable, specify to the public standard and leave the pin mapping as an open item. Never invent a pinout.

### Output
`interface_table`.

### Quality Gate
- Every row has standard, level, rate, connector, termination role, and isolation decision.
- Every host-side claim cites a source document or is marked open.

---

## Phase 3: Fix the Environment Profile

### Entry Criteria
- `interface_table` complete.

### Actions
1. List the transients for the environment from the Reference Section, each with its governing standard.
2. Add ESD exposure for every connector pin that a person or cable can touch.
3. State the operating temperature range as the component temperature grade the environment requires, unless the ask states otherwise: bench and consumer use commercial grade (0 to 70 C); industrial uses industrial grade (-40 to 85 C); automotive uses the AEC-Q100 grade for the mounting location (Grade 3, -40 to 85 C, for cabin; Grade 1, -40 to 125 C, for under hood), cited from the AEC-Q100 grade definitions. Every part selected later must carry the stated grade or wider.

### Output
`environment_profile`.

### Quality Gate
- Each transient names its standard.
- Every exposed connector carries an ESD requirement.

---

## Exit Criteria

DONE when an engineer could choose transceivers, connectors, and protection from `interface_table` and `environment_profile` alone, with no host-side fact left uncited or unmarked.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Ask names no power source | **Adjust**: assume USB 5V, record the assumption. |
| Phase 2 | Host documentation unavailable | **Adjust**: specify to the public standard, mark the pin mapping open. |
| Phase 2 | Isolation need unclear | **Adjust**: choose isolation when grounds are separately sourced; record the reason. |
| Any | User rejects output | **Targeted revision**: rerun only the rows or phase in question. |

---

## Reference Section

### Environment Transient Profiles
- **automotive_12v:** reverse battery, jump start at 24V for minutes, load dump per ISO 16750-2 (centrally suppressed vehicles clamp near 35V), cold crank to about 6V, ESD per ISO 10605.
- **industrial_24v:** surge per IEC 61000-4-5, miswiring of 24V onto signal pins, long cable runs.
- **consumer:** USB hot plug, ESD per IEC 61000-4-2.
- **bench:** ESD per IEC 61000-4-2, reverse polarity from a bench supply.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
