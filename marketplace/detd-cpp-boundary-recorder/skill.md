# C++ Boundary Recorder

**One-line description:** Implements a C++ recorder that copies each tick's sorted input batch, clock value and outputs into a preallocated single-producer single-consumer ring buffer, and a writer thread that encodes length-prefixed little-endian records with a CRC per record and a SHA-256 hash chain, never allocating or blocking on the control thread.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root with a CMake build.
- `record_schema` (object, required): Output of `detd-boundary-record-schema` with the binary encoding.

---

## Outputs

- `recorder_patch` (string): Path to the patch adding the recorder.
- `sample_recording` (string): Path to a recording that passes the checker.

---

## Phase 1: Ring Buffer and Encoder

### Entry Criteria
- Build and `ctest` pass; record the count.

### Actions
1. Use an existing SPSC queue rather than writing lock-free code: `boost::lockfree::spsc_queue` (fixed capacity via template or constructor), or `rigtorp::SPSCQueue`. Check the chosen header's API before use.
2. The element type holds a fixed-size array for the batch payload bytes, sized from the largest batch measured in testing plus the schema's maximum message size; record the derivation. No `std::vector`, `std::string` or `new` inside the element on the producer side.
3. Producer side (control thread): `if (!q.push(item)) { ++dropped_; }`. Never spin waiting for space.
4. Encoder (writer thread): write each field with fixed width, little-endian, explicitly (`std::uint64_t` via byte shifts, not `memcpy` of a struct, which embeds padding and host endianness). Doubles as `std::bit_cast<std::uint64_t>(x)` (C++20) written little-endian.
5. Frame: `[u32 length][payload][u32 crc32]`, CRC from zlib `crc32()`; the hash chain uses SHA-256 from OpenSSL `EVP_Digest` or another vetted library.
6. Write with a buffered `FILE*` or `std::ofstream` without `std::endl` (which flushes); call `fflush` then `fdatasync(fileno(f))` on segment close.

### Output
Recorder sources.

### Quality Gate
- `rg -n 'new |std::vector|std::string|push_back' src/recorder/producer*` returns nothing on producer code.
- Build exits 0.

---

## Phase 2: Wire and Sanitize

### Entry Criteria
- Recorder compiles.

### Actions
1. Call the producer in the loop function named by the ordering contract, after sorting and after `step` returns.
2. Build a ThreadSanitizer configuration: `cmake -S . -B build-tsan -DCMAKE_CXX_FLAGS="-fsanitize=thread -g -O1"` then `ctest --test-dir build-tsan`. TSan reports `WARNING: ThreadSanitizer: data race` on a race.
3. Build an AddressSanitizer configuration with `-fsanitize=address,undefined` and run the tests.
4. Keep the decision TUs on the pinned float flags; sanitizer builds are for the recorder, not for bit-exact comparison.

### Output
Recorder wired; sanitizer runs clean.

### Quality Gate
- TSan and ASan test runs exit 0 with no sanitizer report lines.
- Default build `ctest` passed count not lower than Entry.

---

## Phase 3: Verify a Real Recording

### Entry Criteria
- Sanitizer runs clean.

### Actions
1. Run a test scenario with recording on.
2. Run the checker (from the replay harness flow, or a small tool that validates length, CRC, tick index sequence and hash chain).
3. Overload test: slow the writer in a test build, confirm `dropped_` increases, gap records are written, and control loop tick timing is unchanged.
4. Inspect bytes: `xxd -l 64 recording.bin` and confirm the header magic and `schema_version` match the schema.
5. `git diff > detd_recorder.patch`.

### Output
`recorder_patch`, `sample_recording`.

### Quality Gate
- Checker reports zero CRC errors, zero chain breaks, consecutive tick indices.
- Overload run shows gap records and unchanged tick timing.

---

## Worked Example

Illustrative only. `xxd -l 16 run.bin` prints `00000000: 4454 4452 0300 0000 ...` (magic `DTDR`, schema version 3). Checker prints `ticks 6000, crc ok, chain ok, gaps 0`. TSan run prints `100% tests passed, 0 tests failed`.

---

## Exit Criteria

DONE when the control thread only does a non-blocking push into preallocated storage, sanitizer runs are clean, and a recording passes CRC and chain checks.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Largest batch exceeds element capacity | **Adjust**: write a gap record with reason `oversize`; resize from new measurements. |
| Phase 2 | TSan reports a race in the recorder | **Stop**: fix before field use; a racy recorder produces records that do not replay. |
| Phase 3 | CRC errors on disk | **Retry**: check endianness and length prefix logic; rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
