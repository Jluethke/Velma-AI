# Read rustc, Clippy and cargo test Output Correctly

**One-line description:** Reads a failing Rust run by its structure (`error[E0xxx]` header, `-->` location, numbered source gutter, `help:` and `note:` lines, `---- test stdout ----` panic blocks with `left`/`right`), uses `rustc --explain` for the code, maps it to a cause class with a fixed table, and names the single next action.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `verify_result` (object, required): From `stp-run-verify-capture`, with `all_passed` false.
- `applied_edit` (object, required): From `stp-apply-one-edit`.

---

## Outputs

- `rust_error_diagnosis` (object): `{ "kind": "compile"|"clippy"|"test_panic"|"fmt", "code": str, "message": str, "location": "file:line:col", "in_edited_hunk": bool, "help": str, "cause_class": "EDIT_TEXT_WRONG"|"API_WRONG"|"PLAN_WRONG"|"TEST_SELECTOR_WRONG"|"ENVIRONMENT"|"EXPECTED_INTERMEDIATE", "evidence_lines": [str], "next_action": str }`.

---

## Phase 1: Parse the First Diagnostic

### Entry Criteria
- At least one run in `verify_result.runs` has a non-zero exit code, or L1 printed `running 0 tests` with no other binary passing.

### Actions
1. Open the log of the first failing run. Ignore `warning:` blocks unless the run is clippy with `-D warnings` (then warnings are errors, printed as `error: <lint text>` with a `#[deny(...)]` or `-D clippy::<lint>` note).
2. A compile diagnostic has this shape; read every part:
```
error[E0599]: no method named `nfkd` found for reference `&str` in the current scope
  --> slugrs/src/lib.rs:12:22
   |
12 |     let folded = text.nfkd().filter(|c| c.is_ascii()).collect::<String>();
   |                       ^^^^ method not found in `&str`
   |
   = help: items from traits can only be used if the trait is in scope
help: trait `UnicodeNormalization` which provides `nfkd` is implemented but not in scope; perhaps you want to import it
   |
1  + use unicode_normalization::UnicodeNormalization;
```
   - `code`: `E0599`; `message`: the header text; `location`: from the `-->` line.
   - `^^^^` marks the exact span; `help:` lines are the compiler's suggestion.
3. For an unfamiliar code, run `rustc --explain E0599` and read the first paragraph.
4. Test failure shape:
```
---- tests::strips_accents stdout ----
thread 'tests::strips_accents' panicked at slugrs/src/lib.rs:40:9:
assertion `left == right` failed
  left: "crme-brle"
 right: "creme-brulee"
```
   `left` is the first argument of `assert_eq!`, `right` the second. Read the assert line in the source to know which is actual and which is expected. (Rust 1.73 and later print this format; older toolchains print `assertion failed: (left == right)` with `left: ..., right: ...` on one line.)
5. `error: could not compile` and `test result: FAILED` are summaries; never use them as the message.
6. Set `in_edited_hunk` (file is `applied_edit.file`, line inside the new-line range of the `@@` header).

### Output
`kind`, `code`, `message`, `location`, `help`, `in_edited_hunk`.

### Quality Gate
- `message` and `location` come from one diagnostic block found by `rg -n -F`.
- `code` matches `E[0-9]{4}` for compile errors, or is a clippy lint name (`clippy::...`), or `panic` for tests.

---

## Phase 2: Classify the Cause

### Entry Criteria
- Phase 1 done.

### Actions
1. Apply the first matching row:

| Signal | `cause_class` | `next_action` |
|---|---|---|
| `expected one of ...`, `unclosed delimiter`, `mismatched closing delimiter` | EDIT_TEXT_WRONG | revert; fix syntax at the span |
| E0425 cannot find value / E0412 cannot find type / E0433 failed to resolve (local name or path) | EDIT_TEXT_WRONG or PLAN_WRONG | revert; add the `use` or declaration edit |
| E0599 no method named `x` with a `help: trait ... is implemented but not in scope` | EDIT_TEXT_WRONG | revert; the plan needs the trait `use` line the API evidence recorded |
| E0599 with no trait help, or E0432 unresolved import of an external path | API_WRONG | revert; send to `stp-rust-api-exists-check` |
| E0061 wrong number of arguments / E0308 mismatched types at a call to an external fn | API_WRONG | revert; re-check the signature |
| E0308 mismatched types inside your own code | PLAN_WRONG | revert; re-read the expected and found types in the note |
| E0382 use of moved value / E0499 or E0502 borrow conflicts / E0505 / E0597 does not live long enough | PLAN_WRONG | revert; restructure ownership in the plan (clone, borrow, or reorder) after reading `rustc --explain` |
| E0277 trait bound not satisfied | API_WRONG if the bound is on a library fn, else PLAN_WRONG | revert |
| clippy lint on a line you added | EDIT_TEXT_WRONG | revert; apply the lint's `help:` text |
| `cargo fmt --check` diff on your lines | EDIT_TEXT_WRONG | revert; format only the edited lines to match the diff |
| `running 0 tests` everywhere | TEST_SELECTOR_WRONG | fix the filter path or `--test` target on the card |
| panic with left/right predicted by `expected_signal` | EXPECTED_INTERMEDIATE | keep |
| panic not predicted | PLAN_WRONG | revert; re-read the code at the panic location |
| `failed to select a version`, `no matching package named` | ENVIRONMENT | revert; dependency changes are out of scope |

2. Follow a `help:` suggestion only if it changes lines inside the edited hunk or adds a `use` line, and only after the API evidence supports it. Never apply a suggestion such as adding `#[allow(...)]`.
3. Copy two to five proving lines into `evidence_lines`.

### Output
`rust_error_diagnosis`.

### Quality Gate
- `cause_class` is one table value and the row's signal text is in `evidence_lines`.
- `next_action` contains none of `#[allow`, `#[ignore]`, `unsafe`, `unwrap()` added only to silence a type error.

---

## Worked Example

Illustrative only.

E3 on `slugrs/src/lib.rs` used `text.nfkd()` without the trait import. L0 log is the E0599 block shown in Phase 1.

- Phase 1: `code` E0599, `location` `slugrs/src/lib.rs:12:22`, inside the hunk; `help` says to add `use unicode_normalization::UnicodeNormalization;`.
- Phase 2: EDIT_TEXT_WRONG (trait not in scope); `next_action` "revert E3; insert an edit before E3 that adds the `use` line recorded in `rust_api_evidence`; re-lock".

---

## Exit Criteria

DONE when the diagnosis names the error code or panic, its location, the compiler's help text, whether it is in the edited hunk, one table cause class with evidence, and one next action.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Output is a long cascade of errors | **Adjust**: read only the first `error[` block; later ones usually follow from it. |
| Phase 1 | Panic without location | **Retry**: re-run L1 once with `RUST_BACKTRACE=1` and read the first frame in the crate. |
| Phase 2 | No row matches | **Return**: `PLAN_WRONG` with the header line. |
| Phase 2 | Error in a file the edit did not touch | **Return**: `in_edited_hunk` false; baseline comparison happens next. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
