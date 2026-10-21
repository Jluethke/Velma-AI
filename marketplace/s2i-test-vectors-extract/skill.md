# Spec Test Vector Extraction

**One-line description:** Finds every test vector, example message, and worked computation in the spec and its companion sources (appendices, Wycheproof for cryptography), transcribes them into one machine-readable JSON file with per-vector citations, and verifies the transcription with length and checksum checks before any test uses them.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `spec_bundle` (object, required): From `s2i-spec-acquire-pin`.
- `errata_log` (object[], required): From `s2i-errata-check`. Test vector errata exist (wrong hex in a published example) and must be applied.
- `requirements_table` (object[], required): From `s2i-requirements-table`; each vector is linked to the requirements it exercises.
- `project_dir` (string, required): Repository root; vectors go to `project_dir/testdata/vectors.json`.

---

## Outputs

- `test_vectors` (object): `{ "source_spec", "vectors": [{"id","source","section","req_ids","kind","input","expected","encoding","notes"}] }` written to `testdata/vectors.json`.

---

## Phase 1: Locate Vectors

### Entry Criteria
- Spec text available.

### Actions
1. Search the text: `grep -nEi 'test vector|example|appendix|figure' spec/rfcNNNN.txt`.
2. Check known locations for common specs (use the ones that apply):

   | Spec | Vectors |
   |---|---|
   | RFC 4648 (Base16/32/64) | Section 10 ("foobar" sequence) |
   | RFC 4231 (HMAC-SHA-2) | Section 4, Test Cases 1-7 |
   | RFC 6238 (TOTP) | Appendix B table (note: the SHA-256 and SHA-512 rows use longer seeds than the SHA-1 row) |
   | RFC 6455 (WebSocket) | Section 1.3 Sec-WebSocket-Key example and Section 5.7 frame examples |
   | RFC 7541 (HPACK) | Appendix C request and response examples, with and without Huffman |
   | RFC 3986 (URI) | Section 5.4 reference resolution examples |
   | RFC 8032 (EdDSA) | Section 7 test vectors |
   | RFC 7748 (X25519/X448) | Sections 5.2 and 6 |
   | RFC 8439 (ChaCha20-Poly1305) | Section 2 examples and Appendix A |
   | RFC 9001 (QUIC-TLS) | Appendix A sample packet protection |
   | Any cryptographic algorithm | Project Wycheproof JSON files at `https://github.com/C2SP/wycheproof` (`testvectors_v1/`) |

3. List each vector group with section and count before transcribing anything.

### Output
Inventory of vector groups.

### Quality Gate
- Every group has a section reference and an expected count.
- Every Wycheproof file used has its path and commit SHA recorded.

---

## Phase 2: Transcribe

### Entry Criteria
- Inventory.

### Actions
1. Copy by program, not by hand, wherever possible. Extract the lines with `sed -n '<start>,<end>p' spec/rfc4231.txt` and convert them with a short script that strips whitespace and line wraps from hex.
2. For each vector set `encoding` to how `input` and `expected` are stored: `hex` for binary, `utf8` for text, `ascii-escaped` for protocol text with `\r\n`. Never store binary as text.
3. Keep the spec's own field names in `notes` (for example "Key", "Data", "HMAC-SHA-256").
4. Apply `errata_log` rows with `action` `APPLY` that touch a vector section; cite the erratum ID in `notes`.
5. For Wycheproof, keep each test's `tcId`, `result` (`valid`, `invalid`, `acceptable`), and `flags`; map `acceptable` to an explicit decision in the ambiguity log, not to pass or fail by default.
6. Link `req_ids`: the requirement rows whose behavior the vector checks.

### Output
Draft `testdata/vectors.json`.

### Quality Gate
- Every vector has `source`, `section`, `encoding`, and at least one `req_ids` entry or the note "no single requirement".
- Number of vectors per group equals the inventory count.

---

## Phase 3: Verify the Transcription

### Entry Criteria
- Draft vectors.

### Actions
1. Length check: for hex fields, `len(hex) % 2 == 0` and decoded length equals any length the spec states (for example a SHA-256 MAC is 32 bytes; RFC 4231 Test Case 5 truncates to 128 bits).
2. Cross-check with an independent tool where one exists, without using your implementation:
   - Hash or HMAC vectors: `printf '%s' "<data>" | openssl dgst -sha256 -hmac "<key>"` for text keys, or `openssl mac -digest SHA256 -macopt hexkey:<hex> HMAC` with OpenSSL 3 (confirm with `openssl mac -help`).
   - Base64: `printf 'foobar' | base64` must print `Zm9vYmFy`.
   - WebSocket accept: `printf '%s' 'dGhlIHNhbXBsZSBub25jZQ==258EAFA5-E914-47DA-95CA-C5AB0DC85B11' | openssl dgst -sha1 -binary | base64` must print `s3pPLMBiTxaQ9kYGzzhZRbK+xOo=` (RFC 6455 Section 1.3).
3. A vector that the independent tool disagrees with is either a transcription error (fix it) or a spec error (check errata again, then log it).
4. Validate the file: `python -m json.tool testdata/vectors.json > /dev/null`.

### Output
`test_vectors`.

### Quality Gate
- Every independent cross-check command and its output is saved in `testdata/VERIFY.txt`.
- Zero vectors fail their length check.

---

## Worked Example

Illustrative. RFC 6455, server role.

Phase 1: Section 1.3 handshake example; Section 5.7 has frame examples: a single-frame unmasked text message "Hello" is `0x81 0x05 0x48 0x65 0x6c 0x6c 0x6f`.

Phase 2:
```
{"id":"V-5.7-01","source":"RFC 6455","section":"5.7","req_ids":["REQ-5.2-03"],
 "kind":"frame","input":"810548656c6c6f","expected":"text:Hello","encoding":"hex",
 "notes":"single-frame unmasked text message"}
```
Phase 3:
```
$ printf '%s' 'dGhlIHNhbXBsZSBub25jZQ==258EAFA5-E914-47DA-95CA-C5AB0DC85B11' | openssl dgst -sha1 -binary | base64
s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```
Matches the spec.

---

## Exit Criteria

DONE when every spec vector is in `testdata/vectors.json` with citation, encoding, and requirement links, errata are applied, and every vector has passed a length check and, where a tool exists, an independent cross-check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Spec has no vectors | **Adjust**: use Wycheproof (crypto) or a public suite (see `s2i-public-test-suite-run`); record that vectors are external. |
| Phase 2 | Hex wraps across page breaks | **Adjust**: strip page header and footer lines before joining. |
| Phase 3 | Independent tool disagrees | **Stop** using that vector until resolved; never adjust expected values to match your implementation. |
| Phase 3 | `openssl` lacks the algorithm | **Adjust**: use Python `hashlib`/`hmac` from the standard library as the independent tool. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
