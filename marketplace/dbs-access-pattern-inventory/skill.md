# Access Pattern Inventory

**One-line description:** Captures every read and write the application will make against the schema as a numbered access-pattern table (entity, operation, filter columns, sort, expected cardinality, frequency source), plus the list of candidate entities, before any table is designed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `feature_spec` (string, required): Path to or text of the feature specification, user stories, or API contract (OpenAPI file, GraphQL SDL, ticket text) that the schema must serve.
- `repo_path` (string, optional): Path to an existing codebase. When given, existing queries are harvested from it.
- `query_log` (string, optional): Path to a query digest export from an existing database: `pg_stat_statements` CSV for PostgreSQL, or `performance_schema.events_statements_summary_by_digest` export or `pt-query-digest` report for MySQL.
- `stack` (string, optional): `python`, `node`, `java`, or `go`. Selects which code search commands in Phase 2 run first; when absent, run all of them.

---

## Outputs

- `access_patterns` (object[]): One row per access pattern: `ap_id` (AP01, AP02...), actor, operation (read, insert, update, delete, upsert), entity, equality filters, range filters, sort order, pagination style (none, offset, keyset), expected rows returned, frequency with its source, consistency need (must read own write: yes or no), and the spec line or code location it came from.
- `entity_list` (string[]): Candidate entity names (singular nouns) mentioned by at least one access pattern.

---

## Phase 1: Harvest Patterns From the Spec

### Entry Criteria
- `feature_spec` is readable.

### Actions
1. Read `feature_spec` end to end once before writing anything.
2. For every screen, endpoint, job, report, or message handler, write one row per database operation it needs. An endpoint "GET /orders?customer=X&status=open sorted newest first" is one read row: entity `order`, equality filters `customer_id, status`, sort `created_at DESC`.
3. For every write, record which columns it sets and whether it must be atomic with another write (for example "create order and its order lines together"). Record atomic groups as the same `ap_id` prefix (AP07a, AP07b).
4. Record the pagination style. If the spec says "page 3 of results", record `offset`. If it says "load more" or "infinite scroll", record `keyset`.
5. Record "expected rows returned" as stated in the spec. If the spec does not say, write `unknown` and add the pattern to an open-questions list. Do not guess a number.
6. Collect every noun that appears as an entity in a row into `entity_list`. Merge synonyms only when the spec states they are the same thing (for example "client" and "customer").

### Output
Draft `access_patterns` table and draft `entity_list` from the spec.

### Quality Gate
- Every endpoint, screen, or job named in `feature_spec` has at least one row (count them: names in spec minus names in table equals zero).
- Every row has a non-empty `entity`, `operation`, and source reference.
- Every `unknown` value is listed in the open-questions list.

---

## Phase 2: Harvest Patterns From Code and Logs

### Entry Criteria
- Phase 1 complete. Skip this phase and record "no existing system" when both `repo_path` and `query_log` are absent.

### Actions
1. If `repo_path` is given, search it for queries. Run the searches that match the stack and record every hit:
   - Raw SQL: `rg -n -i "select |insert into|update .* set|delete from" <repo_path>`
   - SQLAlchemy: `rg -n "session\.(query|execute)|select\(" <repo_path>`
   - Django ORM: `rg -n "\.objects\.|\.filter\(|\.order_by\(" <repo_path>`
   - Prisma: `rg -n "prisma\.\w+\.(find|create|update|delete|upsert|count|aggregate)" <repo_path>`
   - Hibernate or JPA: `rg -n "@Query|createQuery|findBy\w+" <repo_path>`
   - Go: `rg -n "QueryContext|ExecContext|QueryRowContext|\.Where\(" <repo_path>`
2. For each hit, add or update a row. Use the exact column names from the code.
3. If `query_log` is a `pg_stat_statements` export, sort by `calls` descending and by `total_exec_time` descending. Every normalized query in the export becomes a row with frequency source `pg_stat_statements.calls`.
4. If `query_log` is a MySQL digest, use `COUNT_STAR` as the frequency and `SUM_TIMER_WAIT` as total time, with frequency source named.
5. Mark rows that appear in the spec but not in code as `new`, and rows in code or logs but not in the spec as `existing-unspecified`. Do not delete either kind.

### Output
`access_patterns` merged from spec, code, and logs.

### Quality Gate
- The row count from each search command is recorded next to the command, so a reader can rerun it and compare.
- Every row with a numeric frequency names its source column (`calls` or `COUNT_STAR`). No frequency is typed in by hand.

---

## Phase 3: Classify and Freeze

### Entry Criteria
- Merged table exists.

### Actions
1. Sort rows by frequency where known, then by spec order.
2. Mark each read row as `hot` only if its frequency source shows it in the top rows by `calls` or the spec names it a latency-sensitive path. Otherwise mark `normal`. Do not invent a calls-per-second cutoff.
3. For each row, list the columns it touches. A column used by no row is a candidate for removal later; list those separately.
4. Emit `access_patterns` and `entity_list`.

### Output
Frozen `access_patterns` and `entity_list`.

### Quality Gate
- Every row has `ap_id`, entity, operation, filters, sort, pagination, rows returned (or `unknown`), and source.
- `entity_list` contains no entity that appears in zero rows.

---

## Common Mistakes To Avoid

- Do not start drawing tables in this flow. Access patterns come first; tables are designed from them in later flows.
- Do not invent frequencies or row counts. `unknown` plus an open question is correct; a made-up number is wrong.
- Do not drop "existing-unspecified" queries from the log. They are real traffic.
- Do not merge two patterns because they touch the same entity. Different filters or sorts are different rows.

---

## Worked Example

Illustrative only. Input `feature_spec`: "Customers see their open orders, newest first, 20 per page with Load more. Staff search orders by order number. Nightly job totals revenue per day."

Phase 1 output (excerpt):

| ap_id | operation | entity | equality | range | sort | pagination | rows | source |
|---|---|---|---|---|---|---|---|---|
| AP01 | read | order | customer_id, status | none | created_at DESC | keyset | 20 per page | spec line 1 |
| AP02 | read | order | order_number | none | none | none | 1 | spec line 2 |
| AP03 | read | order | none | created_at (one day) | none | none | unknown | spec line 3 |

Phase 2: `rg -n "\.objects\.filter" app/` returns 14 hits; one adds AP04 `read order_line by order_id`. `pg_stat_statements` shows AP01 at the top of `calls`.

Phase 3: AP01 marked `hot` (top by `calls`). `entity_list` = [customer, order, order_line]. Open question: AP03 rows per day unknown.

---

## Exit Criteria

DONE when `access_patterns` covers every operation in the spec, code, and query log, each row is fully populated or marked `unknown` with an open question, and `entity_list` is derived from the rows.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `feature_spec` is missing or empty | **Stop**: ask for the spec; a schema without access patterns is guesswork. |
| Phase 1 | Spec names a screen with no data description | **Adjust**: add a row with `unknown` fields and an open question naming the screen. |
| Phase 2 | `rg` not installed | **Adjust**: use `grep -rn -i -E` with the same patterns and record that grep was used. |
| Phase 2 | `query_log` format not recognized | **Return**: ask for a `pg_stat_statements` or digest export with column headers. |
| Phase 3 | Two rows contradict (spec says sort by name, code sorts by date) | **Return**: list both in open questions for the product owner; keep both rows. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
