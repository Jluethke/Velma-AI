# Fuzz Target Selection and Harness Contract

**One-line description:** Finds the code that consumes untrusted bytes or text (parsers, decoders, decompressors, deserializers, protocol handlers, template and path handling), ranks those entry points with an explicit decision table, and writes a harness contract for each one that is deterministic, in-process, stateless between inputs and free of exits, I/O and broad exception swallowing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_code` (string, required): Module, package or library to fuzz.
- `property_catalog` (object[], required): Rows flagged `fuzz_candidate` and their `expected_errors`.
- `stack` (string, required): `python`, `go`, `rust`, `cpp` or `jvm`.

---

## Outputs

- `fuzz_targets` (object[]): One row per target: entry function, input shape (raw bytes, string, structured), trust boundary, priority from the table, harness contract (setup, call, allowed errors, state reset), and the fuzzer the stack uses.

---

## Phase 1: Enumerate Input Entry Points

### Entry Criteria
- `target_code` exists.

### Actions
1. Search for functions that take bytes, strings, readers or streams. Search commands by stack:

| `stack` | Search |
|---|---|
| python | `grep -rnE "def \w+\(.*(bytes\|str\|BinaryIO\|IO\[)" <pkg>` and calls to `struct.unpack`, `json.loads`, `pickle.loads`, `re.compile` |
| go | `grep -rnE "func \w+\(.*(\[\]byte\|string\|io\.Reader)" --include=*.go <pkg>` |
| rust | `grep -rnE "fn \w+.*(&\[u8\]\|&str\|impl Read)" --include=*.rs src` |
| cpp | `grep -rnE "(const (uint8_t\|char\|unsigned char) ?\*\|std::string_view\|std::istream)" --include=*.{c,cc,cpp,h,hpp} src` |
| jvm | `grep -rnE "(byte\[\]\|String\|InputStream\|Reader) \w+\)" --include=*.java src/main` |

2. Add every catalog row flagged `fuzz_candidate`.
3. For each candidate, record where its input comes from: network, file upload, CLI argument, config file, database, internal only.

### Output
Candidate list with input sources.

### Quality Gate
- Every `fuzz_candidate` catalog row is in the list.
- Every candidate has an input source recorded.

---

## Phase 2: Rank With the Decision Table

### Entry Criteria
- Candidate list exists.

### Actions
1. Assign priority by the first matching row:

| Condition | Priority |
|---|---|
| Reachable from network or user-supplied files AND written in C, C++ or `unsafe` Rust | P1 |
| Reachable from network or user-supplied files AND parses a format (binary, text grammar, compression, image, archive) | P1 |
| Deserializes objects (Java `ObjectInputStream`, Python `pickle`, YAML full loaders) from any external source | P1 |
| Reachable from config files or CLI arguments | P2 |
| Internal-only, but has a round-trip property in the catalog | P3 |
| Internal-only, no property | not a fuzz target |

2. Within a priority, order by the number of distinct callers (count with grep); more callers first.

### Output
Ranked list.

### Quality Gate
- Every candidate has exactly one priority with the matching row quoted.

---

## Phase 3: Write the Harness Contract

### Entry Criteria
- Ranked list exists.

### Actions
1. For each P1 and P2 target, fill this contract:

| Field | Rule |
|---|---|
| Setup | Done once outside the per-input function (global init, `LLVMFuzzerInitialize`, `f.Add` seeds, class constructor). |
| Call | Exactly one entry function per harness. Split unrelated entry points into separate harnesses. |
| Input shape | Raw bytes when the real input is bytes. Structured (FuzzedDataProvider, `arbitrary`, typed `go test` fuzz args) only when the entry point takes several typed parameters. |
| Allowed errors | Only `expected_errors` from the catalog. Every other exception, panic or abort is a finding. |
| State | No state survives between inputs: no global caches, no static counters, no temp files left open. |
| Forbidden | `exit()`, `os.Exit`, `System.exit`, process-wide signal handlers, network, sleeping, reading the clock, unseeded randomness, writing files outside a temp dir. |
| Size | No size cap inside the harness unless the real API documents one; size is controlled with the fuzzer's own option (for example libFuzzer `-max_len`). |

2. Name the fuzzer per stack: go native fuzzing, cargo-fuzz, libFuzzer, Atheris, Jazzer.
3. Write a round-trip assertion into the contract when the catalog has one for the target; fuzzers find assertion failures as well as crashes.

### Output
`fuzz_targets`.

### Quality Gate
- Every P1 and P2 row has all contract fields filled.
- No contract lists `Exception`, `Throwable`, `recover()` of all panics or `catch (...)` as allowed.

---

## Worked Example

Illustrative. `target_code` = `libimg` (C), `stack` = `cpp`.

Phase 1 found `img_decode_png(const uint8_t*, size_t)`, `img_decode_gif(...)`, `img_load_config(const char* path)`. Inputs: uploaded files for the decoders, a local config for the loader.

Phase 2: both decoders are P1 (network-reachable, C, binary format); `img_load_config` is P2.

Phase 3 row:

```yaml
- entry: img_decode_png
  priority: P1 (network file upload, C, binary format)
  input_shape: raw bytes
  setup: img_init() in LLVMFuzzerInitialize
  allowed_errors: [return code IMG_EBADDATA]
  state: call img_free(result) on success; no globals touched
  fuzzer: libFuzzer
  extra_assertion: none (no catalog round-trip)
```

---

## Exit Criteria

DONE when every input entry point is listed, ranked by the table, and each P1 and P2 target has a complete harness contract naming its fuzzer.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No candidates found | **Return**: report the searches run; the module may not consume external input. |
| Phase 2 | Input source unknown | **Return**: ask the owner; rank as P2 until answered and mark it. |
| Phase 3 | Entry point calls `exit` on bad input | **Adjust**: target a lower-level function that returns an error, and record the exit as a finding. |
| Phase 3 | Entry point depends on global mutable state | **Adjust**: add an explicit reset in the contract; if impossible, record that the code needs a refactor before fuzzing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
