# Boundary Record Schema for Replay

**One-line description:** Defines the on-disk record that captures everything crossing the decision boundary (header with code commit, config hash, seeds, platform and float policy; per-tick clock value, sorted input batch and outputs) in a canonical encoding with a hash chain, so a replay can reproduce and verify every tick.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `decision_entrypoint` (string, required): The step function the record feeds.
- `ordering_contract` (object, required): Output of `detd-input-ordering-contract`.

---

## Outputs

- `record_schema` (object): Header fields, tick record fields, encoding choice, canonicalization rules, integrity rule, and schema version.

---

## Phase 1: Header Fields

### Entry Criteria
- `ordering_contract` names the step signature and sort key.

### Actions
1. Header carries, each with how to obtain it:

| Field | Source |
|---|---|
| `schema_version` | Integer, incremented on any field change |
| `code_commit` | `git rev-parse HEAD` at build time, embedded in the binary |
| `code_dirty` | `git status --porcelain` non-empty at build time |
| `config_sha256` | sha256 of the canonical config bytes the process loaded |
| `seeds` | Every RNG seed passed to the decision |
| `platform` | Target triple and compiler version, or Python and NumPy versions |
| `float_policy_id` | Identifier of the `float_policy` in force |
| `environment` | Values read once at startup (time zone, locale) per `nondeterminism_sources` fix `read_once_and_record` |
| `start_now_ns` | First injected clock value |

2. Never put wall clock time of recording into a field the harness compares; keep it in a separate `meta` object that comparison ignores.

### Output
Header definition.

### Quality Gate
- Every seed and every environment value read by the decision has a header field.

---

## Phase 2: Tick Record and Encoding

### Entry Criteria
- Header defined.

### Actions
1. Tick record fields: `tick_index` (consecutive integer, gaps forbidden), `now_ns`, `batch` (list, in contract sort order, each item `recv_ns`, `source_id`, `source_seq`, `payload` raw bytes), `outputs` (the step's outputs in canonical form), `prev_sha256`, `sha256`.
2. Store payloads as the raw bytes received, before decoding. Replay then exercises the decoder too.
3. Choose the encoding:

| Situation | Encoding |
|---|---|
| Python or mixed tooling, moderate rate | JSON Lines, one tick per line, canonical JSON (`sort_keys=True`, `separators=(",", ":")`, `ensure_ascii=True`, `allow_nan=False`), floats as `float.hex()` strings, payloads base64 |
| ROS 2 system | MCAP via `ros2 bag record -s mcap`; see `detd-ros2-bag-record-replay` |
| C++ at high rate | Length-prefixed little-endian binary with fixed-width integers and IEEE 754 bit patterns |
| Protocol Buffers already in use | Allowed, but protobuf encoding is not canonical across languages and versions (map entry order, unknown fields); enable deterministic serialization (`SerializeToString(deterministic=True)` in Python, `CodedOutputStream::SetSerializationDeterministic(true)` in C++) and hash the bytes you wrote, never re-serialize to compare |

4. Integrity: `sha256 = SHA-256(prev_sha256 || canonical tick bytes without the sha fields)`, with `prev_sha256` of tick 0 equal to SHA-256 of the canonical header. A missing, reordered or edited tick breaks the chain.
5. Gap marker: if the recorder drops data, it writes a `gap` record with the count dropped; a replay refuses to cross a gap.

### Output
Tick record definition and encoding choice.

### Quality Gate
- Canonical rules are stated precisely enough that two implementations produce identical bytes for the same tick (write one hand-computed example tick and its sha256 into the schema).

---

## Phase 3: Verify the Schema with a Round Trip

### Entry Criteria
- Schema written.

### Actions
1. Encode the example tick with the documented rules, write it, read it back, re-encode it, and compare with `cmp`.
2. Compute the hash with `sha256sum` on the canonical bytes and compare with the value in the schema.
3. Flip one byte in the written file with a hex editor or `printf` and `dd conv=notrunc`, and confirm the chain check reports a mismatch at that tick.

### Output
`record_schema` with the verified example.

### Quality Gate
- Round trip `cmp` exits 0.
- The flipped-byte check reports a mismatch at the expected tick.

---

## Worked Example

Illustrative only. Example tick in JSON Lines:
`{"batch":[{"payload":"AAECAw==","recv_ns":1000500,"source_id":1,"source_seq":17}],"now_ns":1001000,"outputs":{"mode":"hold","speed_cap":"0x1.4p+3"},"prev_sha256":"9f2c...","tick_index":0}`
`sha256sum tick0.canon` prints the value stored in the schema. After flipping byte 40, the checker prints `chain break at tick 0`.

---

## Exit Criteria

DONE when header and tick fields cover every input, seed and environment value, the encoding is canonical, and round trip and tamper checks pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Decision reads a value not in the header | **Adjust**: add the field; bump `schema_version`. |
| Phase 2 | Payload is too large to record at full rate | **Return**: report measured size and rate; do not silently subsample, which breaks replay. |
| Phase 3 | Round trip differs | **Retry**: a canonicalization rule is incomplete; fix and repeat. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
