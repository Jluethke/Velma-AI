# Ticket Ambiguity Extraction

**One-line description:** Reads one ticket and splits every sentence into a stated fact, an ambiguity, or a missing requirement, then turns each ambiguity into a closed question the ticket owner can answer with one word or one value, so no code is written against a guess.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ticket_text` (string, required): The full ticket body, title, comments and linked attachments as plain text (Jira, Linear, GitHub Issue or GitLab Issue export).
- `ticket_id` (string, required): The tracker key, for example `PAY-412` or `#1873`.

---

## Outputs

- `ambiguity_list` (object[]): One row per unclear item: id (A1, A2...), quoted source sentence, ambiguity class (from the table in Phase 2), why it blocks code, and the closed question.
- `clarification_questions` (string): A ready-to-post comment for the ticket that lists every closed question, numbered, with a proposed default for each.
- `working_requirements` (object[]): Requirements that are explicit in the ticket, each with id (R1, R2...), the quoted source sentence, and status `stated` or `assumed-default` (assumed only when the owner accepted a proposed default).

---

## Phase 1: Sentence Inventory

### Entry Criteria
- `ticket_text` is non-empty.
- `ticket_id` is known.

### Actions
1. Copy `ticket_text` into a numbered list, one sentence or one bullet per line. Keep the original words. Do not paraphrase at this step.
2. Tag each line with exactly one label:
   - `FACT`: describes current behavior that can be checked in code or logs ("Export currently times out after the request limit").
   - `REQ`: a demand on new behavior ("Users must be able to export CSV").
   - `CONTEXT`: background, motivation, customer name, no behavior.
   - `NOISE`: greetings, signatures, duplicated text.
3. Pull every concrete value into a values table: numbers, units, field names, endpoint paths, error messages, version strings, user roles, dates. Record the line number each came from.
4. List every noun that names a thing in the system (screen, table, endpoint, job, config key). These are the search terms used later by `tkt-rg-call-trace`.

### Output
Numbered, labeled sentence list plus a values table and a noun list.

### Quality Gate
- Every line of `ticket_text` has exactly one label (count of labels equals count of lines).
- Every number in the ticket appears in the values table with its line number.

---

## Phase 2: Classify Ambiguity

### Entry Criteria
- Labeled sentence list exists.

### Actions
1. For every `REQ` line, test it against each row of this table. A line can match several rows; record each match as its own ambiguity.

| Class | Test (if the answer is "no", it is ambiguous) | Example of the gap |
|---|---|---|
| ACTOR | Does the line name which user role or system triggers it? | "Allow export" (admin only? any user? API client?) |
| TRIGGER | Does it say what event starts the behavior? | "Send a reminder" (on what event, at what time?) |
| INPUT-RANGE | Are valid inputs and their limits given? | "Accept a file" (types? max size?) |
| OUTPUT-SHAPE | Is the exact output format given (fields, order, encoding, status code)? | "Return the totals" (JSON keys? currency format?) |
| ERROR-PATH | Does it say what happens on bad input, timeout, missing permission? | No mention of what a 403 shows |
| VAGUE-WORD | Is it free of words with no test: fast, easy, intuitive, better, properly, handle, support, etc., should, appropriate? | "Handle large files properly" |
| SCOPE | Is it clear which screens, endpoints, platforms, tenants are in or out? | "Update the dashboard" (web only, or mobile too?) |
| COMPAT | Does it say what happens to existing data, old clients, saved settings? | Renaming a field with stored rows |
| CONFLICT | Is it consistent with every other line and with `FACT` lines? | Line 3 says "optional", line 9 says "required" |

2. For every value in the values table with no unit (ms or s? MB or MiB? UTC or local?), add an INPUT-RANGE or OUTPUT-SHAPE ambiguity.
3. Do NOT resolve an ambiguity by picking what seems sensible. Weak models commonly invent a limit ("max 10 MB") and then code it. Every ambiguity stays open until Phase 3 produces a question.

### Output
Draft `ambiguity_list` with class and quoted source line for each row.

### Quality Gate
- Every `REQ` line has been tested against all nine classes (record "pass" or an ambiguity id for each).
- Every row in the draft `ambiguity_list` quotes its source line verbatim.

---

## Phase 3: Closed Questions and Working Requirements

### Entry Criteria
- Draft `ambiguity_list` exists.

### Actions
1. Rewrite each ambiguity as a closed question: yes/no, pick-one-of-listed-options, or "give the value". Template: `A<n> (<class>): <question>? Proposed default: <option>. If no answer, we will <default>.`
2. The proposed default must come from one of: existing behavior in the code (a `FACT` line), an existing convention in the same product, or a named standard (for example RFC 4180 for CSV, ISO 8601 for timestamps). If none applies, write `Proposed default: none, answer needed`.
3. Rank questions: CONFLICT and ERROR-PATH first (they change code shape), VAGUE-WORD last.
4. Write `clarification_questions` as one comment headed `Questions before implementation of <ticket_id>`, numbered, each on one line.
5. Build `working_requirements` from `REQ` lines with no open ambiguity (status `stated`). Add a requirement with status `assumed-default` only after the ticket owner has replied accepting that default; quote the reply.
6. If any question has no proposed default and no answer, mark the ticket BLOCKED in the output and do not pass it on to coding.

### Output
`ambiguity_list`, `clarification_questions`, `working_requirements`.

### Quality Gate
- Every question in `clarification_questions` can be answered with yes/no, one listed option, or one value (no open "what do you think" questions).
- Every `working_requirements` row with status `assumed-default` quotes the owner's acceptance text.

---

## Worked Example

Illustrative only.

Input `ticket_id`: `PAY-412`. Input `ticket_text`:
```
1. Title: Add CSV export to the invoices page
2. Customers keep asking for this.
3. Users should be able to export invoices as CSV.
4. Export should be fast even for big accounts.
5. Include amount and date.
```

Phase 1 labels: line 1 REQ, line 2 CONTEXT, line 3 REQ, line 4 REQ, line 5 REQ. Values table: none numeric. Nouns: invoices page, invoice, amount, date, CSV.

Phase 2 `ambiguity_list` (excerpt):
```
A1 ACTOR       line 3 "Users should be able to export"   which roles?
A2 VAGUE-WORD  line 4 "fast"                              no measurable target
A3 INPUT-RANGE line 4 "big accounts"                      row count unknown; sync or background job?
A4 OUTPUT-SHAPE line 5 "amount and date"                  currency column? date format? timezone?
A5 SCOPE       line 3 "invoices"                          filtered view or all invoices?
```

Phase 3 `clarification_questions` (excerpt):
```
Questions before implementation of PAY-412
1. A4: Date format ISO 8601 (2026-10-20) in UTC? Proposed default: yes, ISO 8601 UTC.
2. A4: Separate currency column next to amount? Proposed default: yes.
3. A5: Export only the rows matching the current filter? Proposed default: yes, same as the PDF export (existing behavior).
4. A1: Roles allowed: billing_admin only, or every role that can view invoices? Proposed default: every role that can view the invoices page.
5. A3/A2: Largest account row count to support synchronously? Proposed default: none, answer needed.
```

`working_requirements`: R1 "CSV export button on invoices page" (stated). Question 5 has no default, so the output is marked BLOCKED until the owner answers.

---

## Exit Criteria

DONE when every `REQ` line is either a `working_requirements` row or an `ambiguity_list` row with a closed question, and the ticket is marked READY (all blocking questions answered) or BLOCKED (with the list of unanswered question numbers).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ticket_text` is only a title | **Stop**: post one question asking for the expected behavior and an example; do not start orientation. |
| Phase 1 | Ticket references an attachment you cannot open | **Adjust**: add an ambiguity "attachment X unreadable" and ask for it as text. |
| Phase 2 | Two lines contradict each other | **Adjust**: record a CONFLICT ambiguity quoting both lines; never pick one silently. |
| Phase 3 | Owner does not reply | **Return**: hand back BLOCKED with the unanswered question numbers; do not substitute defaults that were never accepted. |
| Phase 3 | Owner reply adds new scope | **Retry**: run Phase 1 again on the reply text and merge the new rows. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
