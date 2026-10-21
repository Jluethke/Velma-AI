# PCB Autoroute

**One-line description:** Routes every remaining net with the open-source Freerouting autorouter through a Specctra DSN round trip, pours and fills ground zones, and confirms locked critical nets came back unchanged with zero unrouted connections.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `critical_routed_board` (string, required): Board with critical nets routed and locked.
- `locked_nets` (object[], required): Locked nets with their recorded width, length, and via count.

---

## Outputs

- `routed_board` (string): Path to the fully routed, zone-filled board.
- `route_log` (object): Freerouting version, passes run, unrouted count, total via count, and the locked-net comparison result.

---

## Phase 1: Export and Route

### Entry Criteria
- `critical_routed_board` exists; Java runtime and Freerouting jar present (if missing, list install steps and stop for user approval).

### Actions
1. Export the board to Specctra DSN with `pcbnew.ExportSpecctraDSN(board, dsn_path)`.
2. Run Freerouting headless, e.g. `java -jar freerouting.jar -de board.dsn -do board.ses -mp 20`, with the GUI disabled per the installed version's options.
3. Record the version, passes, and reported unrouted count.

### Output
SES session file and router output.

### Quality Gate
- Freerouting reports zero unrouted connections.

---

## Phase 2: Import, Pour, and Verify

### Entry Criteria
- SES file exists.

### Actions
1. Import with `pcbnew.ImportSpecctraSES(board, ses_path)`.
2. Add ground pours on outer layers (and the inner ground plane on boards with 4 or more layers), stitched with vias near layer transitions and around board edges.
3. Fill all zones with `pcbnew.ZONE_FILLER(board).Fill(board.Zones())` and save as `routed_board`.
4. Compare each locked net's width, length, and via count against `locked_nets`. Any change is a failure.
5. Record total via count and the comparison in `route_log`.

### Output
`routed_board`, `route_log`.

### Quality Gate
- Every locked net matches its recorded width, length, and via count.
- Zero unrouted connections after import.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Route remaining nets with Freerouting through a Specctra DSN round trip, pour an, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every net is routed, zones are filled, and locked critical nets are unchanged.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unrouted connections remain | **Adjust**: rerun with more passes; if still unrouted, route the remainder by script or return to placement with the congested region. |
| Phase 2 | Locked net altered on import | **Stop**: restore from `critical_routed_board`, lock again, rerun. |
| Phase 1 | Freerouting missing | **Stop**: list install steps, wait for approval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
