# Decision State Snapshot and Restore

**One-line description:** Serializes the complete decision state, including RNG internal state, canonically with a hash, restores it to resume replay mid-recording, and proves completeness by checking that replay from a snapshot at tick k matches full replay from tick 0 for every snapshot point.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `replay_harness` (object, required): Output of `detd-replay-harness-bitexact`.

---

## Outputs

- `snapshot_format` (object): Fields, encoding, version, hash rule, and the RNG state method used per stack.
- `snapshot_tests` (string[]): Test names proving snapshot completeness.

---

## Phase 1: Enumerate State

### Entry Criteria
- The harness replays at least one recording identically.

### Actions
1. List every member of the decision object and of objects it owns: Python `dataclasses.fields(obj)` or `vars(obj)`; C++ the class definitions; Go struct fields; Rust struct fields.
2. Include hidden state: RNG internal state, counters, filters' internal memory, debounce counters, caches. A cache that changes results is state; a cache that never changes results must be proven so by a test or included anyway.
3. RNG state methods:

| Stack | Save | Restore |
|---|---|---|
| Python `random.Random` | `rng.getstate()` | `rng.setstate(s)` |
| NumPy `Generator` | `rng.bit_generator.state` (a dict) | assign the dict back to `rng.bit_generator.state` |
| C++ `std::mt19937_64` | `os << engine` (text form defined by the standard) | `is >> engine` |
| Go `math/rand/v2` PCG | `pcg.MarshalBinary()` | `pcg.UnmarshalBinary(b)` |
| Rust `ChaCha8Rng` | serde with the crate's `serde1` feature, or `get_seed()` plus `get_word_pos()` | `from_seed()` plus `set_word_pos()` |

   Check each call against the library docs for your version.

### Output
State field list.

### Quality Gate
- The field list count equals the number of fields reported by the introspection command (Python), or by a reviewer reading the class definitions line by line (C++, Go, Rust), with file and line cited.

---

## Phase 2: Serialize Canonically and Guard New Fields

### Entry Criteria
- Field list complete.

### Actions
1. Serialize with the same canonical rules as the record schema (sorted keys, exact float form). Add `snapshot_version` and `sha256` of the canonical bytes.
2. Guard against fields added later without updating the serializer:
   - Python: a test asserting `{f.name for f in dataclasses.fields(State)} == SERIALIZED_FIELDS`.
   - C++: `static_assert(sizeof(State) == <current size>, "update snapshot serializer");` so any field change fails the build and forces a review of the serializer.
   - Go and Rust: a test comparing the reflected or listed field names to the serializer's list.
3. Restore builds a fresh object from the bytes; it must not depend on the old object.

### Output
Serializer and guard.

### Quality Gate
- Adding a dummy field in a scratch branch fails the guard (test or build). Delete the branch afterward.

---

## Phase 3: Prove Completeness by Resume Equivalence

### Entry Criteria
- Serializer and guard in place.

### Actions
1. In the harness, add a mode: replay from tick 0 to tick k, snapshot, destroy the object, restore from the snapshot, continue to the end.
2. For each recording in the test set, choose k values: every tick for short recordings; for long ones, every tick where the recording shows a mode change or limit crossing, plus the first and last tick. Record the selection rule.
3. Compare the resumed run's outputs from tick k to the end with the uninterrupted run, byte for byte.
4. Also check `snapshot(restore(snapshot(s))) == snapshot(s)` byte equality.

### Output
`snapshot_format`, `snapshot_tests`.

### Quality Gate
- All resume-equivalence comparisons are identical; the test log lists each recording and k.
- The double-snapshot round trip is identical.

---

## Worked Example

Illustrative only. Python decision with a `Debouncer` holding `count` that was missing from the first serializer. Resume at tick 212 diverged at tick 214 (`mode` recorded `hold`, resumed `go`). After adding `count`, all 38 k values on `drive_017` match.

---

## Exit Criteria

DONE when every state field including RNG state is serialized, the new-field guard is live, and resume from every chosen k matches uninterrupted replay.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | State includes an open file or socket | **Adjust**: those belong outside decision state; move them to the boundary. |
| Phase 2 | `sizeof` differs between platforms | **Adjust**: use one `static_assert` per target triple with a comment, or switch to a field-count test. |
| Phase 3 | Resume diverges | **Retry**: a field is missing; the first diverging output field names the area to inspect. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
