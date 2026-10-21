# Spec Ambiguity Log

**One-line description:** Records every place where the spec is silent, contradictory, or open to two readings, classifies each by a fixed category, resolves it from a ranked list of evidence sources (updating RFCs, verified errata, working group archives, reference implementation behavior), and states the decision the code will follow so it can be tested and disclosed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `requirements_table` (object[], required): From `s2i-requirements-table`.
- `spec_bundle` (object, required): From `s2i-spec-acquire-pin`.
- `errata_log` (object[], required): From `s2i-errata-check`.

---

## Outputs

- `ambiguity_log` (object[]): Rows `{ "amb_id", "category", "req_ids", "section", "question", "readings": [], "evidence": [{"source","rank","finding"}], "decision", "decision_basis", "status" }`. Written to `spec/ambiguity_log.md` and `.json`.

---

## Phase 1: Collect Candidates

### Entry Criteria
- `requirements_table` exists.

### Actions
1. Add one candidate for each of these mechanical triggers. Each is a query you can run on the table or the text:

   | Trigger | How to find it | `category` |
   |---|---|---|
   | `error_behavior` = "unspecified" | filter the table | `MISSING_ERROR_BEHAVIOR` |
   | `behavior` = "unclear" or `applies` = "unclear" | filter the table | `UNCLEAR_REQUIREMENT` |
   | Lowercase keyword hits flagged under `RFC2119_ONLY` | from `s2i-bcp14-keyword-scan` notes | `LOWERCASE_KEYWORD` |
   | Term used in a requirement but never defined | for each noun in `behavior`, `grep -n "<term>"` in the Terminology/Definitions section; no hit means undefined | `UNDEFINED_TERM` |
   | Two rows with the same condition and incompatible behavior | sort by `condition`, compare | `CONTRADICTION` |
   | A limit with no number ("reasonable", "large", "sufficient time") | `grep -nE 'reasonable|sufficient|appropriate|large|small' spec/*.txt` | `UNBOUNDED_LIMIT` |
   | Order of operations not stated (two MUSTs triggered by one event) | rows sharing a `condition` | `UNSPECIFIED_ORDER` |
   | Normative reference that is obsoleted | `spec_bundle.normative_refs` flagged obsoleted | `STALE_REFERENCE` |
   | Erratum with `action` `APPLY_AND_LOG` or Technical `LOG_ONLY` | filter `errata_log` | `PENDING_ERRATUM` |
   | "implementation-defined", "implementation-specific", "local policy" | grep for these phrases | `IMPLEMENTATION_DEFINED` |

2. Give each candidate an ID `AMB-<nnn>` and the list of affected `req_ids`.
3. Write each `question` as one sentence ending with "?" that has a concrete answer, for example "What close status code does the server send when a Close frame has a 1-byte payload?".

### Output
Candidate list.

### Quality Gate
- Every row of the trigger table was run; record the count found per trigger, including zero.
- Every candidate has one `question` ending in "?".

---

## Phase 2: Gather Evidence

### Entry Criteria
- Candidate list.

### Actions
1. For each candidate, search sources in this rank order and stop at the first source that answers it. Record every source checked.

   | Rank | Source | How to check |
   |---|---|---|
   | 1 | Updating RFC or later spec version | text of documents in `spec_bundle.updated_by` |
   | 2 | Verified erratum | `errata_log` rows with `action` `APPLY` |
   | 3 | Normative text elsewhere in the same spec | grep the term across all sections |
   | 4 | Working group mailing list or issue tracker | `https://mailarchive.ietf.org/arch/browse/<wg>/` search; W3C/WHATWG GitHub issues |
   | 5 | Public conformance suite expectation | the suite's test case for the situation (for example an Autobahn, h2spec, or JSONTestSuite case) |
   | 6 | Behavior of two or more independent widely deployed implementations | run them (see `s2i-interop-reference-impl`) or read their source |
   | 7 | Postel's law default: be strict in what you send, and for input, fail closed on anything that affects security or framing | stated as the basis |

2. Quote each finding with a URL or section reference. Never cite memory or "commonly known".
3. If ranks 5 and 6 disagree with each other, record both and use rank 5.

### Output
Evidence per candidate.

### Quality Gate
- Every candidate lists at least one source with rank and a URL or section.
- No decision is based on a rank lower than an available higher-rank answer.

---

## Phase 3: Decide and Publish

### Entry Criteria
- Evidence per candidate.

### Actions
1. Write `decision` as testable behavior ("Server sends Close with 1002 and closes the TCP connection").
2. Set `decision_basis` to the winning rank and source.
3. Set `status`: `RESOLVED` (rank 1-3), `RESOLVED_BY_PRACTICE` (rank 4-6), `OPEN_DEFAULT` (rank 7 only), `NEEDS_USER` (security-relevant and rank 7 only).
4. For `NEEDS_USER`, **Return** the question to the user before code is written for it.
5. Write `spec/ambiguity_log.md` as a table and `spec/ambiguity_log.json`. Every decision needs a conformance test later; the test plan reads this file.

### Output
`ambiguity_log`.

### Quality Gate
- Every row has `decision`, `decision_basis`, and `status`.
- Zero rows with `status` `NEEDS_USER` remain unanswered before implementation starts.

---

## Worked Example

Illustrative. RFC 6455, server role.

Phase 1: Trigger "error_behavior unspecified" finds the Close frame body rule in Section 5.5.1. AMB-004, `MISSING_ERROR_BEHAVIOR`: "What does the server do when a Close frame has a payload of exactly 1 byte?" (a status code needs 2 bytes).

Phase 2: Rank 1 (RFC 7936, 8307, 8441): nothing. Rank 2: no erratum. Rank 3: Section 7.1.7 defines "Fail the WebSocket Connection". Rank 5: Autobahn|Testsuite case 7.3.2 ("Close frame with payload length 1") expects the connection to be failed.

Phase 3: `decision`: "Fail the WebSocket Connection (Section 7.1.7), sending Close 1002 if a Close has not been sent." `status`: `RESOLVED_BY_PRACTICE`, basis rank 5.

---

## Exit Criteria

DONE when every trigger has been run, every candidate has a recorded evidence trail and a testable decision, and no security-relevant question is left without a user answer.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Hundreds of `UNDEFINED_TERM` hits | **Adjust**: check normative references first; most terms are defined there (for example "URI" in RFC 3986). |
| Phase 2 | Mailing list search returns nothing | **Adjust**: continue down the rank list; record the search terms used. |
| Phase 2 | Implementations disagree and no suite case exists | **Return** as `OPEN_DEFAULT` or `NEEDS_USER` per the security rule. |
| Phase 3 | User does not answer a `NEEDS_USER` question | **Stop** implementation of the affected requirements; continue others. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
