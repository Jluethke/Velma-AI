# Normative Requirements Table

**One-line description:** Turns every normative keyword sentence into one or more atomic, numbered requirements with a stable ID, the actor it binds, its trigger condition, the required behavior, and the spec location, filtered to the role you implement (client, server, sender, receiver, parser, generator).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `spec_bundle` (object, required): From `s2i-spec-acquire-pin`.
- `keyword_hits` (object[], required): From `s2i-bcp14-keyword-scan`.
- `keyword_convention` (string, required): From `s2i-bcp14-keyword-scan`.
- `errata_log` (object[], required): From `s2i-errata-check`.
- `implementation_role` (string, required): The role or roles you build, for example "client", "server", "client,server", "parser", "generator", "sender", "receiver", "intermediary".

---

## Outputs

- `requirements_table` (object[]): Rows `{ "id", "section", "keyword", "level", "actor", "condition", "behavior", "error_behavior", "source_text", "applies", "testability", "split_from" }`. Written to `spec/requirements.csv` and `spec/requirements.json`.

---

## Phase 1: Split into Atomic Requirements

### Entry Criteria
- `keyword_hits` has at least one row with `normative: true`.

### Actions
1. Work on one section at a time, in document order. Do not batch the whole spec in one pass.
2. For each normative hit, split the sentence so each row holds exactly one keyword and one testable behavior:
   - "X MUST do A and MUST NOT do B" becomes two rows.
   - "X MUST do A or B" stays one row (one obligation with two allowed ways); record both in `behavior`.
   - "If C, X MUST do A; otherwise X SHOULD do B" becomes two rows with opposite `condition` values.
   - A list after "MUST include the following:" becomes one row per list item.
3. Fill fields:
   - `keyword`: the exact keyword.
   - `level`: `MUST` for MUST/SHALL/REQUIRED; `MUST_NOT` for MUST NOT/SHALL NOT; `SHOULD` for SHOULD/RECOMMENDED; `SHOULD_NOT` for SHOULD NOT/NOT RECOMMENDED; `MAY` for MAY/OPTIONAL.
   - `actor`: who the sentence binds, exactly as named ("client", "server", "endpoint", "recipient", "sender", "intermediary"). "Endpoint" means both client and server.
   - `condition`: the trigger ("upon receiving a frame that is not masked"). Write "always" if there is none.
   - `behavior`: the required action in present tense.
   - `error_behavior`: what the spec says happens on violation, quoted; "unspecified" if the spec says nothing. Unspecified error behavior goes to the ambiguity log.
   - `source_text`: the full sentence, verbatim, or the erratum's corrected text with `split_from` naming the erratum.
4. Never paraphrase a requirement into something stronger or weaker. "SHOULD" never becomes "MUST".

### Output
Atomic requirement rows without IDs.

### Quality Gate
- Every normative hit maps to at least one row (count check: unique hit IDs referenced in `split_from` or source equals normative hit count).
- Zero rows contain two keywords in `behavior`.

---

## Phase 2: Assign Stable IDs

### Entry Criteria
- Atomic rows.

### Actions
1. ID format: `REQ-<section>-<nn>`, with `nn` two digits counting within the section in document order. Example: `REQ-5.1-01`, `REQ-5.1-02`. For non-section specs (WHATWG algorithm steps), use `REQ-<anchor>-<nn>` with the HTML anchor ID.
2. IDs are never reused or renumbered after first publication. If a requirement is later found to be two, keep the old ID on the first and add a new suffix `REQ-5.1-02a`.
3. Keep only ASCII letters, digits, `.`, `-` in IDs so they are valid inside test names after replacing `.` and `-` with `_` where a language needs it.

### Output
Rows with IDs.

### Quality Gate
- `cut -d, -f1 spec/requirements.csv | sort | uniq -d` prints nothing (no duplicate IDs).
- Every ID matches `^REQ-[A-Za-z0-9.]+-[0-9]{2}[a-z]?$`.

---

## Phase 3: Filter by Role and Rate Testability

### Entry Criteria
- Rows with IDs.

### Actions
1. Set `applies` with this table against `implementation_role`:

   | `actor` | Role you build | `applies` |
   |---|---|---|
   | matches your role | any | `yes` |
   | "endpoint" | client or server | `yes` |
   | "recipient" / "receiver" | anything that parses input | `yes` |
   | "sender" / "generator" | anything that emits output | `yes` |
   | the other role only | your role only | `no` (keep the row; your peer will violate it, and you test that you detect it) |
   | unclear | any | `unclear`, add to ambiguity log |

2. Set `testability`:
   - `black_box`: observable on the wire or in API output.
   - `white_box`: needs internal inspection (for example "MUST use a cryptographically strong random source").
   - `review_only`: only checkable by code review or documentation.
3. Write both files: CSV with header `id,section,keyword,level,actor,condition,behavior,error_behavior,applies,testability,source_text,split_from` and JSON.

### Output
`requirements_table`.

### Quality Gate
- `python -c "import csv;r=list(csv.DictReader(open('spec/requirements.csv')));print(len(r))"` equals the JSON array length.
- Every row has `applies` and `testability` set.

---

## Worked Example

Illustrative. RFC 6455, `implementation_role` = "server".

Phase 1: Section 5.1 sentence "The server MUST close the connection upon receiving a frame that is not masked." becomes one row. "A server MUST NOT mask any frames that it sends to the client." becomes another. "A client MUST mask all frames that it sends to the server" is a third.

Phase 2/3 output:
```
id,section,keyword,level,actor,condition,behavior,error_behavior,applies,testability,...
REQ-5.1-01,5.1,MUST,MUST,client,always,mask all frames sent to the server,"server MUST close the connection",no,black_box,...
REQ-5.1-02,5.1,MUST,MUST,server,upon receiving an unmasked frame,close the connection,"MAY send Close with status 1002",yes,black_box,...
REQ-5.1-03,5.1,MUST NOT,MUST_NOT,server,always,mask frames sent to the client,unspecified,yes,black_box,...
```
REQ-5.1-01 has `applies` no but still drives a server test: send an unmasked frame and expect closure (REQ-5.1-02).

---

## Exit Criteria

DONE when every normative keyword sentence is represented by atomic rows with unique stable IDs, role applicability, and testability, in both CSV and JSON.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sentence has a keyword but no clear behavior | **Adjust**: keep the row with `behavior` "unclear" and send it to the ambiguity log. |
| Phase 1 | Requirement defined only by an ABNF rule | **Adjust**: create one row "input MUST match rule <name>" and let the grammar flow cover it. |
| Phase 2 | ID collision after an erratum split | **Adjust**: use the letter suffix rule; never renumber. |
| Phase 3 | `implementation_role` not one of the spec's actors | **Stop**: ask the user to name the role using the spec's terms. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
