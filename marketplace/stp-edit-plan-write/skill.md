# Write the Exact Edit Plan (Old Text, New Text, Check)

**One-line description:** For every edit in the list, writes the exact old text copied from the file (proved unique with `rg -c -F`), the exact new text, the external names the new text calls, and the verify commands to run after it, so applying an edit becomes a mechanical string replacement with nothing left to improvise.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `edit_list` (object[], required): From `stp-decompose-small-edits`.
- `context_notes` (object[], required): From `stp-context-read-budget`.
- `verify_card` (object, required): From `stp-baseline-capture`.
- `scratch_log` (string, required): Path from `stp-scratch-log-start`.

---

## Outputs

- `edit_plan` (object[]): `[{ "id": str, "file": str, "anchor_line": int, "old_text": str, "new_text": str, "external_symbols": [str], "cli_flags": [str], "verify": [str], "expected_signal": str }]`.

---

## Phase 1: Copy the Old Text

### Entry Criteria
- `edit_list` is non-empty.

### Actions
1. For each edit, print the lines around the change with real line numbers (method from `stp-context-read-budget` Phase 2).
2. Copy `old_text` character for character, including indentation (spaces versus tabs) and trailing characters. For a pure insertion, `old_text` is the existing line just above (or below) the insertion point, and `new_text` repeats that line plus the new lines.
3. Prove uniqueness: `rg -c -F "<first line of old_text>" <file>` must print `1`. If it prints more, extend `old_text` by one line above or below until the multi-line block is unique (check multi-line blocks with `rg -c -U -F "<block>" <file>`; `-U` enables multiline matching).
4. Record `anchor_line` as the line number of the first line of `old_text`.
5. For a new file, `old_text` is empty and `new_text` is the full content; confirm the file does not exist with `test -e <file>` (exit 1) or `Test-Path <file>` (False).

### Output
`old_text` and `anchor_line` per edit.

### Quality Gate
- `rg -c -F` on each `old_text` first line prints exactly `1` (or the file is new and absent).

---

## Phase 2: Write the New Text

### Entry Criteria
- `old_text` recorded.

### Actions
1. Write `new_text` as the complete replacement for `old_text`. Keep the file's indentation style and quote style (read them from `old_text`).
2. Change only what the edit's purpose says. Do not rename variables, reorder imports, or fix unrelated style in the same edit.
3. List in `external_symbols` every name in `new_text` that is not defined in `new_text` itself and not quoted in `context_notes` (library functions, methods on library types, standard library calls, keyword arguments, enum members). Write them fully qualified: `unicodedata.normalize`, `str.encode(errors=)`, `Intl.NumberFormat`, `strings.CutPrefix`, `str::char_indices`, `java.text.Normalizer.normalize`.
4. List in `cli_flags` every command-line flag you plan to run that is not already on `verify_card` (for example a new `pytest -k` use).
5. Never write placeholders such as `...`, `TODO`, `pass  # implement`, `unimplemented!()` or `throw new UnsupportedOperationException()` in `new_text`. If you do not know the code, the edit is not ready; record an open question instead.

### Output
`new_text`, `external_symbols`, `cli_flags`.

### Quality Gate
- `new_text` contains none of: `...` on its own, `TODO`, `FIXME`, `unimplemented!`, `todo!()`, `NotImplementedError`, `UnsupportedOperationException`.
- Every identifier in `new_text` is defined in `new_text`, quoted in `context_notes`, or listed in `external_symbols`.

---

## Phase 3: Attach Checks and Write the Plan

### Entry Criteria
- Phases 1 and 2 done for every edit.

### Actions
1. Set `verify` for each edit from the card: always `L0_compile` and `L1_goal`; add each `L2_touched` command with `<file>` replaced by the edit's file.
2. Copy `expected_signal` from `edit_list`.
3. Append the full plan to `scratch_log` under `EDIT PLAN (draft)`, one block per edit:
```
### E2  slugkit/core.py  line 1
OLD:
<old_text>
NEW:
<new_text>
EXTERNAL: unicodedata.normalize
VERIFY: uv run python -m py_compile slugkit/core.py ; <L1> ; uv run ruff check slugkit/core.py
EXPECT: L0 passes, L1 unchanged
```

### Output
`edit_plan`.

### Quality Gate
- Every edit in `edit_list` has one plan block in `scratch_log` with OLD, NEW, EXTERNAL, VERIFY and EXPECT lines.

---

## Worked Example

Illustrative only.

E3 for `slugkit/core.py`:

```
$ rg -c -F 'text = re.sub(r"[^a-z0-9]+", sep, text)' slugkit/core.py
1
```

- `old_text`: `    text = re.sub(r"[^a-z0-9]+", sep, text)`
- `new_text`:
```
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", sep, text)
```
- `external_symbols`: [`unicodedata.normalize`, `str.encode`, `bytes.decode`].
- `verify`: [`uv run python -m py_compile slugkit/core.py`, `uv run pytest tests/test_slugify.py::test_strips_accents -q`, `uv run ruff check slugkit/core.py`, `uv run mypy slugkit/core.py`].
- `expected_signal`: "L1 passes: exit 0 and `1 passed`".

Note the order: `text.lower()` on line 15 runs before this, so the folded text is already lowercase.

---

## Exit Criteria

DONE when every edit has a unique `old_text`, a placeholder-free `new_text`, its external names listed, and its verify commands taken from the card.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rg -c -F` prints 0 | **Retry**: re-print the lines; the copy differs in whitespace or quotes. |
| Phase 1 | Block is not unique even when extended | **Adjust**: use the enclosing function signature line plus the block. |
| Phase 2 | You do not know how to write the change | **Stop**: record the open question for the report; never write a placeholder. |
| Phase 2 | New text needs an import not present | **Return**: to `stp-decompose-small-edits` to add an import edit. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
