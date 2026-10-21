# RAG Gold Question Set Labeling

**One-line description:** Builds a labeled retrieval test set where each question is tied to gold answer spans by character offsets in the normalized corpus, so relevance stays valid for any chunking, with drafted questions verified by a person and unanswerable questions included on purpose.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `clean_records` (string, required): Path to `clean/records.jsonl` from `rag-corpus-normalize-dedupe`.
- `seed_questions` (string, optional): Path to real user questions (one per line), for example from search logs or support tickets. Real questions are preferred over drafted ones.
- `work_dir` (string, required): Build folder; writes `work_dir/eval/`.

---

## Outputs

- `question_set` (string): Path to `work_dir/eval/questions.jsonl`: `qid`, `question`, `answerable` (bool), `reference_answer`, `source` (`log` | `drafted`), `filters` (object, empty if none), `split` (`dev` | `test`).
- `qrels_spans` (string): Path to `work_dir/eval/qrels_spans.jsonl`: `qid`, `doc_id`, `char_start`, `char_end`, `grade` (2 = directly answers, 1 = partially supports).

---

## Phase 1: Collect and Draft Questions

### Entry Criteria
- `clean_records` exists.

### Actions
1. If `seed_questions` is given, deduplicate them (lowercase, strip punctuation) and remove any containing personal data (names, emails, account numbers) before anything is stored in `work_dir`.
2. Sample documents for drafting with a fixed, logged random seed, stratified by `kind` and by folder so every part of the corpus is represented. Uniform sampling over records over-represents long documents.
3. For drafted questions, show the drafter (a person or a model) one passage and ask for a question a real user would type, without copying distinctive phrases from the passage. Drafted questions that reuse the passage wording inflate lexical retrieval scores.
4. Add unanswerable questions on purpose: plausible questions about topics the corpus does not cover. They test whether the system says "not found" instead of inventing an answer. Record `answerable=false`.
5. The total count is a user decision. Report the statistical consequence instead of choosing: with n questions, the standard error of a recall estimate p is sqrt(p(1-p)/n), so at p=0.5 and n=100 it is 0.05. Write this into the set README.

### Output
Candidate questions with their source passages.

### Quality Gate
- `questions.jsonl` has a `source` on every line.
- No question line matches an email regex `[\w.+-]+@[\w-]+\.[\w.]+`.

---

## Phase 2: Label Gold Spans

### Entry Criteria
- Candidate questions exist.

### Actions
1. For each answerable question, a person searches the corpus (grep over `clean/records.jsonl` and the source passage) and marks every span that answers it, not only the drafting passage. Questions often have answers in several documents; missing them makes good retrievers look bad.
2. Record each span as `doc_id`, `char_start`, `char_end` in normalized full-text offsets. Copy the exact substring and verify: `full_text[char_start:char_end]` must equal the copied text.
3. Grade each span: 2 if it alone answers the question, 1 if it is needed but insufficient.
4. Write a short `reference_answer` per answerable question from the spans only.
5. Labeling tool option: a spreadsheet with columns `qid, doc_id, quote` is enough; a script finds the quote with `full_text.find(quote)` and fails loudly if the quote occurs zero or several times (then the labeler adds more context to the quote).

### Output
Span labels per question.

### Quality Gate
- Every answerable question has at least one span; every unanswerable one has zero.
- The offset check in Action 2 passes for every span.

---

## Phase 3: Agreement Check and Split

### Entry Criteria
- Spans labeled.

### Actions
1. Have a second person label a random subset of questions (size is a user decision, seeded and logged) without seeing the first labels.
2. For each question in the subset, compare the documents chosen. Compute Cohen's kappa on per-(question, document) relevant/not-relevant decisions with `sklearn.metrics.cohen_kappa_score`. Report it; do not invent a pass mark. Resolve every disagreement by discussion and fix the labels.
3. Split into `dev` and `test` with a fixed seed. Use `dev` for every tuning decision in later flows; touch `test` only for the final report. Tuning on `test` inflates the final number.
4. Freeze the set: write `sha256sum questions.jsonl qrels_spans.jsonl > eval/SHA256SUMS`. Later flows check these hashes so the set does not change under them.

### Output
`question_set`, `qrels_spans`.

### Quality Gate
- `sha256sum -c eval/SHA256SUMS` passes.
- The README in `work_dir/eval/` reports n, the answerable count, kappa on the overlap subset, and the split sizes.

---

## Worked Example

Illustrative.

```
seed_questions: 412 lines from support tickets -> 187 after dedupe and PII removal
drafted: 60 (seed 11, stratified over 6 folders); unanswerable: 25
labels: 247 answerable questions, 391 spans (mean 1.6 spans per question)
second labeler on 40 questions: kappa=0.71, 9 disagreements resolved
split (seed 11): dev 136, test 136
$ sha256sum -c work/eval/SHA256SUMS
questions.jsonl: OK
qrels_spans.jsonl: OK
```

---

## Exit Criteria

DONE when every question has verified span labels (or is marked unanswerable), agreement is measured and reported, the set is split, and its hashes are frozen.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No real questions available | **Adjust**: draft all questions, mark `source=drafted`, and state in the README that scores may be inflated. |
| Phase 2 | Quote found zero times | **Adjust**: the labeler copied from the raw source; copy from the normalized text instead. |
| Phase 2 | Quote found several times | **Adjust**: extend the quote until it is unique. |
| Phase 3 | Agreement low on a question type | **Return**: write a labeling guideline for that type and relabel it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
