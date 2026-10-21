# Root-Cause Note

**One-line description:** Writes the short, factual root-cause note for the pull request and issue: symptom, trigger, causal chain, defect location and class, when it was introduced, the fix, the test that guards it, the neighbor sweep result, and follow-ups, with every claim linked to a command output or commit.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `bug_brief` (object, required): Output of `repro-intake-checklist`.
- `env_snapshot` (object, required): Output of `repro-env-capture`.
- `root_cause` (object, required): Output of `repro-root-cause-confirm`.
- `first_bad_commit` (object, optional): Output of `repro-git-bisect-run`; empty when not a regression.
- `fix_diff` (object, required): Output of `repro-minimal-fix`.
- `revert_proof` (object, required): Output of `repro-fix-revert-proof`.
- `neighbor_report` (object, required): Output of `repro-neighbor-regression-sweep`.

---

## Outputs

- `root_cause_note` (string): Markdown text for the pull request description and issue comment, with the fixed section headings below, and a list of claims each paired with its evidence source.

---

## Phase 1: Gate the Inputs

### Entry Criteria
- All required inputs present.

### Actions
1. Check `revert_proof` verdict is `GUARDED` and `neighbor_report` verdict is `CLEAN`. If either is not, stop; the note must not describe an unproven fix.
2. Collect evidence references: commit SHAs (fix, first bad), test ID, command lines, and the signature line.

### Output
Evidence list.

### Quality Gate
- Both verdicts read `GUARDED` and `CLEAN` from their objects.

---

## Phase 2: Write the Note

### Entry Criteria
- Gate passed.

### Actions
1. Use exactly these headings in this order:
   1. `## Symptom`: the error signature verbatim and who saw it, in which version (`bug_brief.reported_version`).
   2. `## Trigger`: the minimal input property from the chain's first link; the minimal reproducer command.
   3. `## Root cause`: the causal chain as a numbered list with file:line; mark the defect link and quote the contract it violated; give the class from `root_cause`.
   4. `## Introduced`: `first_bad_commit` SHA and subject with one line on how it introduced or exposed the defect; or "Not a regression: present since <earliest checked version>" when empty; or "Not determined" if bisect was not run.
   5. `## Fix`: one sentence plus the fix commit SHA; what it deliberately does not change.
   6. `## Test`: test ID, the command, and the revert proof counts ("red N/N without the fix, green N/N with it").
   7. `## Verification`: the neighbor sweep counts on base and fix and the list of pre-existing failures (unchanged), so reviewers do not attribute them to this change.
   8. `## Environment`: only the `env_snapshot` fields that mattered (rows marked `could_affect_bug: yes`).
   9. `## Follow-ups`: other call sites with the same pattern found during the sweep (`git grep` results), missing tests, docs to update. Each item is one line and is a separate task, not part of this fix.
2. Writing rules: plain declarative sentences; no blame of people; no speculation words ("probably", "might") in Root cause, because it is confirmed by predictions; open questions go in Follow-ups.
3. Keep the note under one screen per section; link to logs rather than pasting them in full.

### Output
Draft note.

### Quality Gate
- All nine headings appear once, in order (`grep -n "^## " note.md`).
- Every file:line in Root cause appears in `root_cause` links.

---

## Phase 3: Check Claims Against Evidence

### Entry Criteria
- Draft written.

### Actions
1. For each factual sentence, attach its evidence source: a SHA (`git cat-file -t <sha>` returns `commit`), a test ID (present in the repo: `git grep -n "<test name>"`), or a quoted output line from an input object.
2. Delete or move to Follow-ups any sentence with no evidence.
3. Scan for secrets and personal data copied from logs or the report (tokens, emails, customer names); redact them.
4. Emit `root_cause_note` and the claim-to-evidence list.

### Output
`root_cause_note`.

### Quality Gate
- Every sentence in Symptom, Root cause, Introduced, Fix and Test has an evidence entry.
- `git cat-file -t` returns `commit` for every SHA in the note.

---

## Worked Example

Illustrative only (abbreviated).

```
## Symptom
`UnicodeDecodeError: 'utf-8' codec can't decode byte 0xff in position 0` in v2.4.1 when importing a CSV exported by Excel as "Unicode Text".
## Trigger
Input starts with the UTF-16 LE byte order mark FF FE. Repro: `python -m importer import tests/fixtures/utf16le.csv`.
## Root cause
1. `detect_encoding` (src/importer/encoding.py:19) checks only `codecs.BOM_UTF8` and returns 'utf-8'. DEFECT: docstring says it "detects UTF-8 and UTF-16 byte order marks".
2. `CsvReader.__init__` (csv_reader.py:64) stores 'utf-8'.
3. `read_rows` (csv_reader.py:88) decodes and raises.
Class: missing-case.
## Introduced
9be12f0 "importer: auto-detect encoding" added `detect_encoding` without the UTF-16 branches.
## Fix
c03a7e2: recognize UTF-16 LE and BE marks before the UTF-8 fallback. No change to files without a BOM.
## Test
tests/importer/test_csv_reader.py::test_read_rows_utf16_bom_decodes_header[le|be]; red 10/10 without the fix, green 10/10 with it.
## Verification
Base 1317 passed / 2 failed; fix 1318 passed / 2 failed; same two failures (network) on both.
## Environment
Not environment dependent (no `could_affect_bug: yes` rows).
## Follow-ups
- `json_reader.py:31` reads `detect_encoding` but has no UTF-16 test.
```

---

## Exit Criteria

DONE when `root_cause_note` has the nine headings, every factual claim is tied to evidence, and no secret or personal data remains.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `revert_proof` is `NOT GUARDED` | **Stop**: return to `repro-fix-revert-proof`; do not write a note for an unguarded fix. |
| Phase 1 | `neighbor_report` is `REGRESSED` | **Stop**: return to `repro-minimal-fix`. |
| Phase 2 | Bisect not run and regression claimed | **Adjust**: write "Not determined" under Introduced and add a follow-up to run `repro-git-bisect-run`. |
| Phase 3 | Weak model adds unverified explanations | **Retry**: remove every sentence without an evidence entry. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
