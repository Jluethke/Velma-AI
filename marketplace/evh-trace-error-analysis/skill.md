# Trace Error Analysis by Open and Axial Coding

**One-line description:** Reads a random sample of real production traces, writes one free-text note per failure (open coding), groups the notes into a counted failure taxonomy (axial coding), and stops at saturation, so the test set targets failures the system actually has instead of guessed ones.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `task_spec` (object, required): From `evh-task-rubric-spec`; supplies the pass definition and hard constraints used to judge each trace.
- `trace_source` (string, required): Path or query for exported traces (JSONL, CSV, or a tracing tool export) with at least the input, the full model output, and a request id per row.
- `sample_size` (integer, optional): Number of traces to read in the first batch. If absent, read in batches of the size the reviewer can finish in one sitting and continue until the saturation rule in Phase 3 fires.

---

## Outputs

- `failure_taxonomy` (object[]): Written to `evals/failure_taxonomy.json`: one entry per failure category with id, name, definition, count, share of reviewed traces, example request ids, and whether a programmatic check can detect it.

---

## Phase 1: Draw a Reproducible Random Sample

### Entry Criteria
- `trace_source` is readable and each row has a request id.

### Actions
1. Count rows: `wc -l traces.jsonl` (JSONL) or `python -c "import csv;print(sum(1 for _ in csv.reader(open('traces.csv')))-1)"` (CSV).
2. Draw a uniform random sample with a fixed seed so it can be redrawn:
   `python -c "import json,random;rows=[json.loads(l) for l in open('traces.jsonl')];random.seed(20261020);s=random.sample(rows,k=N);open('evals/analysis/sample_01.jsonl','w').write(''.join(json.dumps(r)+'\n' for r in s))"`
   Replace `N` with `sample_size` or the batch size. Record the seed in the file header notes.
3. Do NOT sample only thumbs-down or error-flagged traces. Those miss silent failures the user never reported. If flagged traces exist, read them as a separate second batch and label the batch `flagged`.
4. Strip secrets and personal data before sharing the sample with anyone: replace emails, phone numbers and account ids with placeholders (`re.sub(r"[\w.+-]+@[\w-]+\.[\w.]+", "<EMAIL>", text)`).

### Output
`evals/analysis/sample_01.jsonl` with the seed recorded.

### Quality Gate
- `wc -l evals/analysis/sample_01.jsonl` equals the requested N.
- Rerunning the command with the same seed produces a byte-identical file (`sha256sum` matches).

---

## Phase 2: Open Coding

### Entry Criteria
- Sample file exists.

### Actions
1. Create `evals/analysis/notes.csv` with columns `request_id,pass_fail,note`.
2. Read each trace in full: the input, any retrieved context or tool calls, and the complete output. Judge it against `task_spec.pass_definition` and `task_spec.hard_constraints`.
3. For each failing trace write ONE note describing the FIRST thing that went wrong, in plain words tied to the trace ("quoted the return window as 60 days; policy doc in context says 30"). Upstream errors cause downstream ones; recording only the first keeps counts honest.
4. Do not invent category names yet. Do not write "hallucination" or "bad answer"; write what is observable.
5. Passing traces get `pass` and an empty note.

### Output
`notes.csv` with one row per reviewed trace.

### Quality Gate
- Row count in `notes.csv` equals the sample size.
- Every `fail` row has a non-empty note that names a specific observable fact.

---

## Phase 3: Axial Coding and Saturation

### Entry Criteria
- Notes for at least one batch exist.

### Actions
1. Read all fail notes. Group notes that share a root cause into a category. Name each category with a short noun phrase and write a one-sentence definition that would let a stranger assign a new note to it.
2. Add a column `category` to `notes.csv` and assign every fail note to exactly one category. If a note fits none, create a new category; do not force it.
3. Count per category: `python -c "import csv,collections;c=collections.Counter(r['category'] for r in csv.DictReader(open('evals/analysis/notes.csv')) if r['pass_fail']=='fail');print(c.most_common())"`.
4. Saturation rule: draw the next batch (new seed) and code it. If the new batch produced zero new categories, stop. If it produced any new category, draw another batch. This is the theoretical saturation stopping rule from grounded theory (Glaser and Strauss, 1967).
5. For each category set `programmatic_detectable: true` when a regex, schema or code check can find it (wrong format, over length, missing citation marker), else `false`.
6. Write `evals/failure_taxonomy.json`.

### Output
`failure_taxonomy` with counts and example ids.

### Quality Gate
- Every fail row in `notes.csv` has a category: `python -c "import csv;print([r['request_id'] for r in csv.DictReader(open('evals/analysis/notes.csv')) if r['pass_fail']=='fail' and not r.get('category')])"` prints `[]`.
- The last coded batch added zero new categories (state the batch number in the taxonomy file).
- Every category lists at least one example request id that exists in the sample files.

---

## Worked Example

Illustrative only. A RAG support bot with 48,210 traces in `traces.jsonl`. `sample_size` = 40.

- Phase 1: seed 20261020, 40 rows written, sha256 stable across two runs.
- Phase 2: 13 of 40 traces fail. Notes include "answered with the 2023 price list; context had the 2025 list" and "cited doc id that was not in retrieved context".
- Phase 3, batch 1 categories: `stale_doc_used` (5), `citation_not_in_context` (4), `ignored_second_question` (3), `wrong_language_reply` (1). Batch 2 (seed 20261021, 40 rows) adds `refused_benign_request` (2). Batch 3 (seed 20261022) adds no new category, so coding stops. `citation_not_in_context` and `wrong_language_reply` are marked `programmatic_detectable: true`.

---

## Exit Criteria

DONE when `evals/failure_taxonomy.json` exists, every failing reviewed trace maps to one category, and the final batch produced no new category.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Traces lack the full output text (truncated logging) | **Stop**: fix logging to store full outputs; coding truncated outputs misses failures at the end. |
| Phase 1 | No production traffic yet | **Adjust**: run the feature on realistic inputs written by the product owner and code those; mark the taxonomy `pre_launch`. |
| Phase 2 | Reviewer cannot tell pass or fail without domain knowledge | **Return**: send those trace ids to a domain expert and code them after the answer. |
| Phase 3 | New categories keep appearing after many batches | **Adjust**: check whether categories are too narrow; merge categories that share a root cause, then continue batching. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
