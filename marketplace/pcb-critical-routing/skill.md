# PCB Critical Routing

**One-line description:** Routes the nets an autorouter handles poorly (high-current power paths, differential bus pairs, and emergency stop loops) by script at their required width, coupling, and directness, then locks them so autorouting cannot alter them.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `placed_board` (string, required): Selected placement from `pcb-placement-scoring`.
- `net_classes` (object[], required): Widths, clearances, and pair classes from `pcb-board-setup`.
- `critical_circuits` (object[], required): Identifies interlock and emergency stop nets.

---

## Outputs

- `critical_routed_board` (string): Path to the board with critical nets routed and locked.
- `locked_nets` (object[]): Each locked net with its class, routed width, length, via count, and the reason it was routed by script.

---

## Phase 1: Select the Critical Nets

### Entry Criteria
- `placed_board` exists.

### Actions
1. List every net in a power class carrying above 1 A.
2. List every differential pair class net pair.
3. List every net belonging to an interlock or emergency stop in `critical_circuits`.

### Output
Critical net list.

### Quality Gate
- Every net meeting the three criteria is listed.

---

## Phase 2: Route and Lock

### Entry Criteria
- Critical net list exists.

### Actions
1. Using the `pcbnew` Python module in a routing script in the user's project, route each power net at its class width along the shortest path, preferring wide polygons over thin traces where space allows, with no more vias than the layer change requires. For current above 3 A through a via, use at least enough vias in parallel that each carries under its rated current for the fab's drill and plating.
2. Route each differential pair as a coupled pair at the class width and gap, equal length within 1 mm, over unbroken ground, with the transceiver-to-connector stub short.
3. Route each emergency stop loop net short and direct, away from switching nodes.
4. Set every routed segment and via to locked.
5. Record each net's routed width, length, and via count in `locked_nets`.

### Output
`critical_routed_board`, `locked_nets`.

### Quality Gate
- Every power net's routed width is at least its class width.
- Every pair is length-matched within 1 mm.
- Every critical segment is locked.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Script-route high-current power paths, differential bus pairs, and emergency sto, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every critical net is routed to its class, recorded, and locked.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | No path at class width | **Adjust**: move parts within placement rules or use an inner layer; if neither works, return to `pcb-placement-scoring` with the blocked net. |
| Phase 2 | Pair cannot be length-matched | **Adjust**: add a serpentine on the short leg away from the connector. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
