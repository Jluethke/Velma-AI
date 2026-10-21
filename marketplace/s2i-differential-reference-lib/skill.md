# Differential Test Against a Reference Library

**One-line description:** Runs the same inputs (spec vectors plus grammar-generated samples) through your implementation and a reference library in-process or by CLI, normalizes both outputs to one comparable form, and classifies every divergence with a fixed table as your bug, reference bug, spec ambiguity, or allowed implementation-defined difference.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `test_vectors` (object, required): From `s2i-test-vectors-extract`.
- `reference_impl` (string, required): The reference implementation and version, for example "Python rfc3986 2.0.0", "Go net/url (go1.22)", "OpenSSL 3.0 enc", "libcurl 8.x".
- `implementation_command` (string, required): CLI that runs your implementation on one input and prints a normalized result.
- `project_dir` (string, required): Repository root; outputs go under `project_dir/reports/diff/`.

---

## Outputs

- `divergence_log` (object[]): Rows `{ "input_id", "input", "ours", "reference", "class", "spec_section", "action" }`.

---

## Phase 1: Choose and Wrap the Reference

### Entry Criteria
- `reference_impl` named with a version.

### Actions
1. Check the reference implements the same spec version. Example traps: Go `net/url` and browsers follow different URL rules (RFC 3986 vs WHATWG URL); Python's `urllib.parse` predates and differs from RFC 3986 in places; many JSON libraries accept trailing commas or NaN by default. Read the reference's documentation for its stated spec; record it.
2. If the reference implements a different spec or version, choose another or treat every divergence on the differing feature as `IMPL_DEFINED` and say so.
3. Write a wrapper CLI for the reference that prints the same normalized format as `implementation_command`. Normalization rules: one line JSON, sorted keys, bytes as lowercase hex, errors as `{"error": true}` without the message text (messages differ legitimately).
4. Record the exact reference version: `python -c "import rfc3986; print(rfc3986.__version__)"`, `go version`, `openssl version`, as applicable.

### Output
Reference wrapper and version.

### Quality Gate
- Both CLIs print identical output for one trivial input both should accept (shown in the run notes).
- The reference's stated spec and version are recorded.

---

## Phase 2: Run Both and Compare

### Entry Criteria
- Wrappers ready.

### Actions
1. Inputs: every vector in `test_vectors` plus, if present, every file in `spec/gen/cover/` and `spec/gen/random/` from `s2i-abnfgen-grammar-coverage`.
2. Run each input through both and write `reports/diff/ours.jsonl` and `reports/diff/ref.jsonl`, one line per input, prefixed with the input ID.
3. Compare: `diff <(sort reports/diff/ours.jsonl) <(sort reports/diff/ref.jsonl) > reports/diff/raw.diff` (bash process substitution). An empty file means no divergence.
4. Count divergences: `grep -c '^<' reports/diff/raw.diff`.

### Output
Raw divergence list.

### Quality Gate
- Both JSONL files have the same number of lines (`wc -l`).
- `reports/diff/raw.diff` exists (empty or not).

---

## Phase 3: Classify Every Divergence

### Entry Criteria
- Raw divergence list.

### Actions
1. For each divergence, read the governing spec section and classify:

   | Finding | `class` | `action` |
   |---|---|---|
   | Spec text clearly supports the reference | `OUR_BUG` | fix our implementation, add a regression test with this input |
   | Spec text clearly supports us | `REF_BUG` | keep our behavior; optionally report upstream; add a test pinning our behavior |
   | Spec allows both (MAY, implementation-defined) | `IMPL_DEFINED` | record; no change |
   | Spec unclear | `AMBIGUOUS` | add to the ambiguity log; follow its decision |
   | Divergence is only in normalization (key order, case of hex) | `HARNESS` | fix the wrapper and rerun Phase 2 |

2. Never classify as `REF_BUG` without quoting the spec sentence that supports us.
3. Never change our output to match the reference without a spec quote (`OUR_BUG` needs one too).
4. Write `divergence_log` to `reports/diff/divergence_log.json`.

### Output
`divergence_log`.

### Quality Gate
- Every row has a `class` and a `spec_section` (except `HARNESS`).
- Zero `HARNESS` rows remain after the final rerun.

---

## Worked Example

Illustrative. Our RFC 3986 reference resolver vs Python `rfc3986` package.

Phase 1: The reference documents RFC 3986 conformance; version printed and recorded.

Phase 2: Inputs are the Section 5.4 examples with base `http://a/b/c/d;p?q` plus 300 generated samples.
```
$ grep -c '^<' reports/diff/raw.diff
2
```
Phase 3:
- Divergence 1: a generated sample differs only in percent-encoding hex case (`%3a` vs `%3A`). Class `HARNESS`; the wrapper now uppercases percent-encodings (RFC 3986 Section 2.1: producers SHOULD use uppercase hex). Rerun.
- Divergence 2: reference `./g/.` against the base. Ours `http://a/b/c/g/.`, reference `http://a/b/c/g/`. RFC 3986 Section 5.4.2 lists the expected result `http://a/b/c/g/` and Section 5.2.4 defines dot-segment removal. Class `OUR_BUG`; fix `remove_dot_segments` and add a regression test for this input.

---

## Exit Criteria

DONE when every input has been run through both implementations with identical normalization, and every divergence is classified with a spec citation and an action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No independent reference exists | **Return** an empty log with the note "no reference available"; rely on public suites and vectors. |
| Phase 1 | Reference version unknown | **Stop**: pin and record a version before comparing. |
| Phase 2 | Reference crashes on an input | **Adjust**: record `{"error":"crash"}` for that input and classify as `REF_BUG` only with a spec quote. |
| Phase 3 | Many divergences in one feature | **Adjust**: check the spec-version mismatch from Phase 1 first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
