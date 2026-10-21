# Bit-Exact Replay Harness

**One-line description:** Builds a replay harness that verifies a recording's header and hash chain, reconstructs the decision with an injected fake clock and the recorded seeds, feeds each recorded batch in order, and compares canonical output bytes tick by tick, stopping at the first divergence with a field-level report, and proves it is live with a planted-mutation check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `record_schema` (object, required): Output of `detd-boundary-record-schema`.
- `recording_path` (string, required): A recording file or directory of recordings.
- `run_command` (string, required): How the harness is invoked in this repository (for example `python -m replay.harness` or `build/replay_harness`).

---

## Outputs

- `replay_harness` (object): Harness command, modes, exit code meanings, and the location of its source.
- `divergence_report` (object[]): Per recording: status (`identical`, `diverged`, `refused`), first diverging `tick_index`, field path, recorded and replayed values in exact form (hex floats), and header mismatches.

---

## Phase 1: Load and Verify

### Entry Criteria
- Clock and RNG seams exist (an injection flow passed) and the ordering contract is implemented.
- `recording_path` exists.

### Actions
1. Harness reads the header and checks it against the build:

| Header check | Mode `exact` | Mode `regression` |
|---|---|---|
| `code_commit` equals the build commit | required, else `refused` | not required; recorded outputs are the expectation |
| `config_sha256` equals the config loaded | required | required, unless the run explicitly passes a new config and states so in the report |
| `schema_version` supported | required | required |
| `float_policy_id` equals the build's | required | required |

2. Verify the hash chain and tick index sequence. A chain break or a `gap` record in the range to be replayed gives status `refused` with the tick index; never replay across a gap.

### Output
Verified recording or a `refused` row.

### Quality Gate
- A recording with one flipped byte is `refused` with the right tick index (run it once with a tampered copy outside the repo).

---

## Phase 2: Drive the Decision

### Entry Criteria
- Recording verified.

### Actions
1. Construct the decision object exactly as production does, but with `FakeClock(start_now_ns)` and RNG seeded from `header.seeds`, and environment values from `header.environment`.
2. For each tick in order: set the fake clock to `now_ns`, decode the batch payloads with the production decoder, call `step(state, batch, now_ns)`, serialize outputs with the same canonical serializer the recorder uses.
3. Compare canonical bytes of replayed outputs to recorded outputs with byte equality (Python `==` on `bytes`, C++ `std::memcmp` with equal lengths). Never compare floats with a tolerance, `pytest.approx`, `math.isclose` or `EXPECT_NEAR` in this harness.
4. On the first mismatch, decode both sides, walk the structure, and report the first differing field path with both values in exact form (`float.hex()` or `%a`).
5. Exit codes: 0 all identical, 1 any diverged, 2 any refused or harness error. Write `divergence_report` as JSON.

### Output
`divergence_report`.

### Quality Gate
- Running the harness twice on the same recording produces byte-identical reports (`cmp` exit 0).

---

## Phase 3: Prove the Harness Is Live

### Entry Criteria
- Harness runs end to end on a recording.

### Actions
1. Output mutation: copy a recording outside the repo, change one recorded output value (re-hash the chain so it passes Phase 1), and run the harness. It must exit 1 and name that tick and field.
2. Code mutation: on a scratch branch, change one comparison operator in decision code (for example `<` to `<=` on a limit hit in the recording), rebuild, run the harness, confirm exit 1, then delete the branch.
3. Input mutation: drop one message from a batch in a copy; confirm a divergence or a refused status.
4. If any mutation still yields exit 0, the harness is not comparing what you think. Fix before trusting any green result.

### Output
`replay_harness` with the mutation evidence.

### Quality Gate
- All three mutation runs exit non-zero, with the expected tick named; the log of each run is saved.
- The scratch branch is deleted and `git status --porcelain` is empty.

---

## Worked Example

Illustrative only. `python -m replay.harness --mode exact runs/drive_017.jsonl` prints `drive_017: identical, 1200 ticks`, exit 0. Output mutation copy prints `drive_017_mut: diverged at tick 431 outputs.speed_cap recorded=0x1.4p+3 replayed=0x1.2p+3`, exit 1. Tampered copy prints `refused: chain break at tick 77`, exit 2.

---

## Exit Criteria

DONE when the harness verifies headers and chains, compares output bytes exactly, reports the first divergence by field, and all three mutation checks fail as expected.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Commit mismatch in `exact` mode | **Adjust**: rerun in `regression` mode if the goal is regression; never relabel the header. |
| Phase 2 | Production constructor reads the real clock | **Stop**: the injection flow is incomplete; return to it. |
| Phase 2 | Divergence on every recording at tick 0 | **Adjust**: check serializer and header environment first; these are harness bugs more often than decision bugs. |
| Phase 3 | A mutation does not diverge | **Stop**: fix the comparison; a harness that cannot fail proves nothing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
