# Acceptance Criteria in Given/When/Then

**One-line description:** Converts the working requirements of one ticket into Gherkin-style Given/When/Then scenarios, one observable behavior per scenario, each with concrete example values, so every criterion maps to exactly one automated test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `working_requirements` (object[], required): Output of `tkt-ticket-ambiguity-extract`: requirements with id, quoted source and status.
- `ambiguity_list` (object[], required): Output of `tkt-ticket-ambiguity-extract`, including answers received from the ticket owner.

---

## Outputs

- `acceptance_criteria` (object[]): One row per scenario: id (AC1, AC2...), requirement id it covers, scenario title, Given lines, When line, Then lines, example values table (if a Scenario Outline), and test hint (the observable to assert: return value, HTTP status, DB row, log line, UI text).

---

## Phase 1: Map Requirements to Behaviors

### Entry Criteria
- `working_requirements` is non-empty.
- No row in `ambiguity_list` is still unanswered with "Proposed default: none, answer needed". If one is, stop (see Error Handling).

### Actions
1. For each requirement Rn, list every distinct observable behavior it implies. Use this split rule: if the requirement has "and" joining two outcomes, it is two behaviors. If it names a happy path, add the error paths answered in `ambiguity_list` (ERROR-PATH rows) as separate behaviors.
2. For each behavior, name the observable that a test can read. Allowed observables: function return value, raised exception type, HTTP status plus response body field, database row state, emitted event or message, log line text, rendered UI text or ARIA role. "User is happy" or "works correctly" is not an observable.
3. Record requirement id to behavior ids as a coverage map.

### Output
Coverage map: Rn to list of behaviors with their observable.

### Quality Gate
- Every requirement id appears in the coverage map with at least one behavior.
- Every behavior names one observable from the allowed list in Action 2.

---

## Phase 2: Write Scenarios

### Entry Criteria
- Coverage map exists.

### Actions
1. Write one scenario per behavior using this exact shape:
```
Scenario: <behavior in plain words>
  Given <state of the system before the action, with concrete values>
  And <more state, optional>
  When <exactly one action by one actor>
  Then <observable outcome with a concrete value>
  And <more outcomes about the same action, optional>
```
2. Apply these rules. Each is a common weak-model failure:
   - Exactly one `When` per scenario. Two actions means two scenarios.
   - `Given` describes state, never an action in progress ("Given the user clicks" is wrong; "Given an invoice dated 2026-01-31 exists" is right).
   - `Then` names a value the test asserts ("Then the response status is 403"), never an adjective ("Then it fails gracefully").
   - Use the domain's real names from the ticket and the code (field names, roles), not invented ones.
   - No implementation detail in the scenario (no SQL, no class names) unless the ticket is about that interface.
3. When three or more scenarios differ only in data, collapse them into a `Scenario Outline` with an `Examples:` table. Include boundary rows: the minimum valid value, the maximum valid value, and one value just outside each limit, using limits answered in `ambiguity_list`. If no limit was answered, do not invent one; leave the boundary rows out and add a note.
4. Number scenarios AC1, AC2, and record the requirement id on each.

### Output
Draft `acceptance_criteria` with scenarios text.

### Quality Gate
- Running `grep -c "^  When " <scenarios file>` returns the same number as the count of `Scenario:` plus `Scenario Outline:` headings (one When each).
- Every `Then` line contains a literal value (number, quoted string, status code, or named state).

---

## Phase 3: Review Against the Ticket

### Entry Criteria
- Draft scenarios exist.

### Actions
1. Walk the coverage map in reverse: for each scenario, name the requirement and quoted ticket sentence it comes from. Any scenario with no source is scope creep: delete it or turn it into a question.
2. Add a `test hint` to each scenario using the observable from Phase 1: for example `assert response.status_code == 403` style, or "query invoices_export table row count".
3. Post the scenarios to the ticket as a comment titled `Acceptance criteria for <ticket id>` and ask the owner to confirm. Record the confirmation text or the edits they request.

### Output
`acceptance_criteria`.

### Quality Gate
- Every scenario cites a requirement id that exists in `working_requirements`.
- The owner's confirmation text is recorded, or the output is marked UNCONFIRMED.

---

## Worked Example

Illustrative only. Requirement R1 from PAY-412: "Users can export the filtered invoices list as CSV, ISO 8601 UTC dates, currency in its own column" (owner answered A1 to A5; limit for synchronous export answered as 5000 rows by the owner).

Phase 1 coverage map:
```
R1 -> B1 export returns CSV file (observable: HTTP 200, Content-Type text/csv)
R1 -> B2 header row and column order (observable: first line of body)
R1 -> B3 filter respected (observable: row count)
R1 -> B4 role without invoice access is rejected (observable: HTTP 403)
R1 -> B5 above owner limit goes to background job (observable: HTTP 202 + job id)
```

Phase 2 scenarios (excerpt):
```
Scenario: Export respects the active status filter
  Given 3 invoices with status "paid" and 2 with status "open" for account 77
  And the invoices list filter is status = "paid"
  When a billing_admin requests GET /accounts/77/invoices/export?status=paid
  Then the response status is 200
  And the body has 4 lines (1 header + 3 rows)

Scenario Outline: Synchronous limit
  Given account 77 has <rows> invoices
  When a billing_admin requests the export
  Then the response status is <status>
  Examples:
    | rows | status |
    | 5000 | 200    |
    | 5001 | 202    |
```

Phase 3: AC1 to AC5 each cite R1 and the owner confirmed in a ticket comment.

---

## Exit Criteria

DONE when every working requirement is covered by at least one scenario, every scenario has exactly one When and a literal value in each Then, and the owner's confirmation is recorded or the output is marked UNCONFIRMED.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | An ambiguity is still unanswered | **Stop**: return to `tkt-ticket-ambiguity-extract`; scenarios built on guesses become wrong tests. |
| Phase 1 | Behavior has no observable a test can read | **Adjust**: ask the owner what would prove it works; record as a new ambiguity. |
| Phase 2 | Scenario needs two When lines | **Adjust**: split into two scenarios. |
| Phase 2 | Boundary values unknown | **Adjust**: omit boundary rows and record an open question; never invent the limit. |
| Phase 3 | Owner rejects scenarios | **Retry**: apply the edits and rerun Phase 3. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
