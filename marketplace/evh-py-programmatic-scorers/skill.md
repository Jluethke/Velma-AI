# Python Programmatic Scorers

**One-line description:** Implements deterministic Python scorers for an LLM eval (normalized exact match, SQuAD-style token F1, anchored regex, JSON Schema validation with jsonschema, numeric tolerance with math.isclose, length and forbidden-string checks), each returning a structured result with a reason, and unit tests every scorer with pytest on hand-built pass and fail outputs before any model is scored.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `task_spec` (object, required): From `evh-task-rubric-spec`; `output_type` and `hard_constraints` decide which scorers are needed.
- `golden_set` (string, required): Path to `evals/data/golden.jsonl`; supplies targets and `target_kind`.
- `project_dir` (string, required): Repository root with a Python environment.

---

## Outputs

- `scorer_module` (string): Path to `evals/scorers.py` exposing one function per scorer with signature `score_<name>(output: str, item: dict) -> dict` returning `{"name", "passed", "value", "reason"}`.
- `scorer_tests` (string): Path to `evals/tests/test_scorers.py`.

---

## Phase 1: Pick Scorers from the Rubric

### Entry Criteria
- `rubric.yaml` criteria with `method: programmatic` or `target_kind` in (`exact_reference`, `schema_plus_fields`, `tests`).

### Actions
1. Map each criterion to one scorer with this table:

| Need | Scorer | Library call |
|---|---|---|
| One label or short string | `exact_normalized` | `unicodedata.normalize("NFKC", s).strip().casefold()` then `==` |
| Short answer with wording variance | `token_f1` | SQuAD v1.1 normalization (lowercase, strip punctuation, remove articles a/an/the, collapse whitespace), then token overlap F1 |
| Required pattern | `regex_full` | `re.fullmatch(pattern, s)` for whole-output formats; `re.search` only for "contains" |
| JSON output | `json_schema` | `json.loads` then `jsonschema.Draft202012Validator(schema).iter_errors(obj)` |
| Number | `numeric_tol` | `math.isclose(a, b, rel_tol=R, abs_tol=A)` with R and A from `task_spec` |
| Length limit | `max_words` / `max_chars` | `len(s.split())` / `len(s)` against the product limit |
| Forbidden content | `forbidden_strings` | any of a fixed list present, case-folded |
| Canary leak | `no_canary` | canary from `evh-adversarial-safety-cases` absent |

2. Never use `re.match` for a full-format check: it anchors only at the start. Use `re.fullmatch`.
3. If the model wraps JSON in a markdown code fence, decide explicitly: either the task spec allows fences (strip `^```(json)?\n` and `\n```$` before parsing) or it does not (score fail). Write the decision in the scorer docstring.
4. Tolerances, limits and forbidden lists come from `task_spec`; if a value is missing, stop and ask. Do not choose one.

### Output
List of scorers to implement, one per criterion.

### Quality Gate
- Every programmatic criterion maps to exactly one scorer name.
- Every tolerance and limit used is quoted from `task_spec`.

---

## Phase 2: Write Tests First

### Entry Criteria
- Scorer list exists. `pip install pytest jsonschema` done.

### Actions
1. Create `evals/tests/test_scorers.py`. For each scorer write at least one passing and one failing case using hand-written outputs, and the edge cases from this list that apply: empty string, whitespace only, trailing newline, different Unicode form of the same text (`"café"` vs `"café"`), JSON inside a code fence, number with thousands separator, number in scientific notation.
2. Use `pytest.mark.parametrize` with `ids=` so a failing case is named in the output.
3. Run `pytest evals/tests/test_scorers.py -q`. Every test must fail now with `ImportError` or `AttributeError` because the scorers do not exist yet. That proves the tests run.

### Output
`scorer_tests` file, failing for the right reason.

### Quality Gate
- `pytest evals/tests/test_scorers.py -q` output shows errors that name the missing scorer functions, not syntax errors in the test file.

---

## Phase 3: Implement and Verify

### Entry Criteria
- Failing tests exist.

### Actions
1. Implement scorers in `evals/scorers.py`, one function at a time, rerunning `pytest evals/tests/test_scorers.py -q -k <scorer_name>` after each. Do not write all scorers and then run once.
2. Every scorer returns `{"name": ..., "passed": bool, "value": float, "reason": str}`. `reason` must say what was compared ("expected 'refund', got 'refunds'"). Scorers never raise on bad model output: catch `json.JSONDecodeError` and return `passed: False` with the error message as the reason.
3. Scorers must not call any model or network. If a check needs a model, it belongs in the judge, not here.
4. Run the full file: `pytest evals/tests/test_scorers.py -q`. Then mutation-check one scorer by hand: change `fullmatch` to `search` in `regex_full`, rerun, confirm at least one test fails, revert.
5. Run the scorers over the golden set with the golden targets as outputs (a perfect system). Every item must pass; any failure is a scorer or target bug.

### Output
`scorer_module` with all tests green.

### Quality Gate
- `pytest evals/tests/test_scorers.py -q` prints `N passed` with zero failures and zero skips.
- The mutation in step 4 made at least one test fail before the revert.
- Scoring the golden targets against themselves gives 100 percent pass.

---

## Worked Example

Illustrative only. Ticket classifier, `output_type: structured`, schema requires `{"category": enum, "priority": 1..4}`; product limit: reason field at most 40 words.

- Phase 1: `json_schema` (schema from task spec), `exact_normalized` on `category`, `max_words` (40) on `reason`.
- Phase 2: 14 parametrized cases, including ```` ```json\n{...}\n``` ```` (task spec says fences not allowed, so expected fail) and `{"category":"Billing "}` (normalized match passes). First run: `14 errors ... ImportError: cannot import name 'score_json_schema'`.
- Phase 3: after implementing, `pytest evals/tests/test_scorers.py -q` prints `14 passed in 0.21s`. Mutation `fullmatch` to `search` made `test_regex_full[trailing_text]` fail; reverted. Golden self-score: 197/197 pass.

---

## Exit Criteria

DONE when every programmatic criterion has a tested scorer, all scorer tests pass, the mutation check failed as expected, and golden targets score 100 percent.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tolerance or limit missing from the task spec | **Stop**: ask the product owner; do not pick a number. |
| Phase 2 | Tests pass before the scorer exists | **Stop**: the tests are not importing the module; fix the import path. |
| Phase 3 | A scorer test fails | **Adjust**: fix the scorer; never edit the expected value unless the test case itself was wrong, and note why. |
| Phase 3 | Golden target fails its own scorer | **Return**: fix the target in `golden.jsonl` or the normalization, then rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
