# Personnel Protection And Interlock Design

Design the personnel protection system (PPS) with interlocks, access control, and beam permit to ensure no person can be exposed to prompt radiation.

## Inputs

- `shielding-design`: Shield layout and penetrations
- `dose-rate-map`: Dose rates in all areas
- `skyshine-analysis`: External dose contribution

## Outputs

- `pps-architecture`: Interlock chain, redundancy, and fail-safe logic
- `access-control-system`: Search procedure, key exchange, and warning systems
- `beam-permit-logic`: Conditions required for beam permit including all safety interlocks

## Process

1. Classify areas: exclusion zone (prompt dose rate > lethal, no access during beam), controlled area (occupational dose monitoring required), supervised area (occasional monitoring), public area (no restriction). Post signs per applicable regulations.
2. Design interlock chain: redundant (at least two independent channels), fail-safe (loss of signal = beam off), tamper-resistant. Key technologies: hardwired relay logic (highest reliability), PLC with safety rating (SIL-3), or hybrid. Beam stopper insertion verified by position switches.
3. Design access control: secured entry (door with interlock), search procedure (visual confirmation that all personnel have exited before beam enable), sweep (each person touches search buttons in sequence through the zone, confirming it is clear). Key exchange: personal key taken from entry panel prevents re-enabling beam while anyone is inside.
4. Warning systems: flashing lights and audible alarm before beam is enabled (minimum 30 second warning). Emergency stop buttons (crash buttons) throughout all controlled areas. Radiation monitors at critical locations with interlock capability to dump beam if dose rate exceeds threshold.
5. Beam permit conditions: all access points secured, all beam stoppers in correct position verified by redundant position switches, radiation monitors operational and reading below threshold, cryogenic systems nominal (for SRF), vacuum adequate (to prevent beam-gas interaction damage). Any fault in the chain immediately inhibits beam.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
