# Stratified Eval Test Set Construction

**One-line description:** Builds a versioned JSONL eval set from real traces and targeted hand-written cases, tags every item with strata from the failure taxonomy and input traits, removes exact and near duplicates, and splits dev from held-out test with group-aware stratification so no conversation or customer leaks across splits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `task_spec` (object, required): From `evh-task-rubric-spec`; supplies `input_fields` and `out_of_scope`.
- `failure_taxonomy` (object[], required): From `evh-trace-error-analysis`; each category becomes a stratum.
- `trace_source` (string, required): Path to exported production traces used as the item pool.
- `project_dir` (string, required): Repository root; files go under `evals/data/`.
- `target_items_per_stratum` (integer, optional): Items wanted per stratum. If absent, use what the pool supports and let `evh-sample-size-confidence-intervals` report the shortfall.

---

## Outputs

- `test_set` (string): Path to `evals/data/test.jsonl` (held out) with `evals/data/dev.jsonl` beside it. One item per line: `id`, `input` (object with the task input fields), `stratum`, `traits`, `group_id`, `source`, `split`.
- `strata_manifest` (object): `evals/data/strata_manifest.json`: per stratum the definition, item count in dev and test, and the source mix (production, hand-written, synthetic); plus the dataset sha256.

---

## Phase 1: Define Strata and Pull Candidates

### Entry Criteria
- `failure_taxonomy` and `trace_source` exist.

### Actions
1. Create one stratum per taxonomy category plus one `nominal` stratum for ordinary inputs plus one `out_of_scope` stratum per entry in `task_spec.out_of_scope`.
2. Define input traits that cut across strata and that the product cares about, read from the trace data, never guessed: language, input length bucket (bucket edges from the product's UI limits), customer tier, channel. Record each trait and its allowed values.
3. Pull candidates per stratum: for categories with example request ids, pull those traces plus other traces with the same root cause found by search (`grep -i` on a distinguishing phrase, or a SQL `WHERE` on the trait). For the `nominal` stratum draw a seeded random sample from all traces.
4. For strata with too few real items, hand-write items that reproduce the failure's trigger. Mark them `source: handwritten`. If you generate items with an LLM, mark them `source: synthetic` and read every one before keeping it; drop any that are not realistic for this product.
5. Set `group_id` to the conversation id, customer id, or source document id, whichever repeats across traces. Items with the same `group_id` must land in the same split.

### Output
`evals/data/candidates.jsonl` with stratum, traits, group_id and source on every row.

### Quality Gate
- `python -c "import json;rows=[json.loads(l) for l in open('evals/data/candidates.jsonl')];print([r['id'] for r in rows if not all(k in r for k in ('stratum','traits','group_id','source'))])"` prints `[]`.
- Every stratum in the manifest draft has at least one candidate, or is listed as an open question.

---

## Phase 2: Deduplicate

### Entry Criteria
- Candidates file exists.

### Actions
1. Exact duplicates: create `evals/tools/dedup.py` that normalizes each input (Unicode NFKC, lowercase, collapse whitespace) and hashes it, then run `python evals/tools/dedup.py`:
   ```python
   import hashlib, json, re, unicodedata
   seen = set()
   with open("evals/data/candidates.jsonl") as src, open("evals/data/dedup.jsonl", "w") as out:
       for line in src:
           row = json.loads(line)
           text = unicodedata.normalize("NFKC", json.dumps(row["input"], sort_keys=True)).lower()
           key = hashlib.sha256(re.sub(r"\s+", " ", text).encode()).hexdigest()
           if key not in seen:
               seen.add(key)
               out.write(line)
   ```
2. Near duplicates: with `pip install datasketch`, build `MinHash(num_perm=128)` per item over word 3-shingles and query `MinHashLSH(threshold=T, num_perm=128)`. `T` is a user input; if none is given, print the top 20 most similar pairs with their Jaccard estimate and let the user choose the cut by reading them. Do not pick a threshold silently.
3. Keep one item per near-duplicate cluster, preferring `source: production`.
4. Check overlap with any data used to write or tune the prompt (few-shot examples inside the prompt file). Remove any eval item whose input matches a few-shot example: `grep -F` the example text against the candidates.

### Output
`evals/data/dedup.jsonl` and a log of removed ids with the reason.

### Quality Gate
- Rerunning the exact-hash step on `dedup.jsonl` removes zero rows.
- `grep -c` of each few-shot example's distinctive sentence in `dedup.jsonl` returns 0.

---

## Phase 3: Group-Aware Stratified Split and Freeze

### Entry Criteria
- Deduplicated pool exists.

### Actions
1. Split with scikit-learn so strata are balanced and groups do not leak:
   `from sklearn.model_selection import StratifiedGroupKFold`; `sgkf = StratifiedGroupKFold(n_splits=K, shuffle=True, random_state=20261020)`; take the first fold's test indices as `test`, the rest as `dev`. `K` sets the test share (K=5 gives about one fifth); choose K from the user's dev-test ratio, or ask.
2. If a stratum has fewer items than `K`, scikit-learn warns that the least populated class has too few members. Do not ignore it: either add items to that stratum or put the whole stratum in `test` and record that in the manifest.
3. Write `dev.jsonl` (used for prompt iteration and judge calibration) and `test.jsonl` (held out). Rule: nobody edits prompts while looking at `test.jsonl` results item by item. Once a test item has been used to fix a prompt, move it to dev and replace it.
4. Write `strata_manifest.json` with per-stratum counts and `sha256` of both files (`sha256sum evals/data/dev.jsonl evals/data/test.jsonl`).
5. Commit: `git add evals/data && git commit -m "evals: dataset v1"`. Small JSONL files go in git; large ones go in Git LFS (`git lfs track "evals/data/*.jsonl"`) or a dataset registry with the hash in the manifest.

### Output
`test_set` path, dev file, and `strata_manifest`.

### Quality Gate
- `python -c "import json;d={json.loads(l)['group_id'] for l in open('evals/data/dev.jsonl')};t={json.loads(l)['group_id'] for l in open('evals/data/test.jsonl')};print(len(d&t))"` prints `0`.
- Every stratum appears in `test.jsonl` or is listed in the manifest with a reason.
- The sha256 values in the manifest match `sha256sum` output.

---

## Worked Example

Illustrative only. Taxonomy from the support bot: `stale_doc_used`, `citation_not_in_context`, `ignored_second_question`, `refused_benign_request`, plus `nominal` and `out_of_scope:legal_advice`.

- Phase 1: 1,214 candidates. `refused_benign_request` had 6 real traces; 30 handwritten items added. `group_id` = conversation id.
- Phase 2: exact hash removed 88; MinHash top pairs showed near-identical "where is my order" messages, user chose T=0.9 after reading the list, removing 142 more. Two items matched few-shot examples in `prompts/reply_drafter.txt` and were dropped.
- Phase 3: `StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=20261020)` gives dev 785, test 197. Group overlap check prints `0`. Manifest records `test.jsonl sha256 9f2c...`.

---

## Exit Criteria

DONE when `dev.jsonl` and `test.jsonl` exist, share no group, contain no exact duplicates or few-shot leaks, and the manifest with hashes is committed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A stratum has zero real or handwritten items | **Adjust**: write items reproducing the trigger; if impossible, list it in `open_questions` and exclude it from claims. |
| Phase 1 | Traces contain personal data | **Stop**: redact before writing any file into the repository. |
| Phase 2 | `datasketch` not installable | **Adjust**: compute pairwise Jaccard on 3-shingles with plain Python for pools small enough to compare all pairs. |
| Phase 3 | StratifiedGroupKFold warns about small classes | **Adjust**: add items or assign the stratum wholly to test, and record it. |
| Phase 3 | Someone tuned the prompt on test items | **Return**: move those items to dev and draw replacements for test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
