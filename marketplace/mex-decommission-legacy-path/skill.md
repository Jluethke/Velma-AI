# Decommission the Legacy Path

**One-line description:** Removes what the extraction left behind, in a safe order: flag evaluations and the dead old code path, compatibility views and grants, temporary ignore and freeze entries in boundary rules, CDC connectors with their replication slots, and finally the old tables after a verified backup and a retention period the user sets, proving at each step that nothing still uses what is removed.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cutover_flag` (object, required): From `mex-flag-cutover`.
- `rollout_log` (object[], required): From `mex-flag-cutover`; must show reads and writes fully cut over.
- `schema_split_plan` (object, required): From `mex-schema-ownership-split`.
- `seam_map` (object, required): From `mex-seam-identification`.

---

## Outputs

- `decommission_record` (object): Per removed item: what was removed, the proof of non-use before removal (query, log search or graph output), the commit or migration, and the test result after removal; plus pending items with the date they become removable.

---

## Phase 1: Remove Flags and Dead Code

### Entry Criteria
- `rollout_log` shows the read and writer flips at 100 percent with passing rules for the user's dwell time.

### Actions
1. Confirm the flag has served only the new variant for the dwell period (provider's evaluation metrics or `variant` metric label).
2. Replace each flag evaluation with the new path, one evaluation site per commit. Run the full test suite and the contract suite after each.
3. Delete the old code path now unreachable. Prove unreachability first: search for every symbol you delete (`rg -n "\blegacy_get_invoice\b"`), and re-run the stack's graph flow to confirm nothing imports it. Delete one module or file per commit.
4. Delete characterization tests that targeted only the removed legacy functions, but keep those that target the public interface; they now guard the new implementation. Do not delete any other test.
5. Archive the flag in the provider after the code no longer references it.

### Output
Flag-free, dead-code-free codebase.

### Quality Gate
- `rg -n "billing-read-path-new|billing-write-path-new"` returns nothing in source.
- Full test suite passes with the same or higher pass count than the baseline, minus only deleted legacy-only tests, which are listed.

---

## Phase 2: Remove Temporary Data Plumbing

### Entry Criteria
- Phase 1 complete.

### Actions
1. Compatibility views: for each, prove no reads in a full business cycle the user names (PostgreSQL: `pg_stat_statements` contains no statement naming the view; MySQL: `performance_schema.events_statements_summary_by_digest` likewise), then drop in a migration: `DROP VIEW public.invoices;`.
2. Boundary rules: remove every `ignore_imports`, known-violation baseline entry, ArchUnit frozen entry or `nolint` added during the extraction; the rules must still pass.
3. CDC from old to new: delete the connector (`curl -X DELETE $CONNECT/connectors/<name>`), then drop its slot and publication (PostgreSQL `SELECT pg_drop_replication_slot('<slot>'); DROP PUBLICATION <pub>;`) or its user (MySQL). Confirm: `SELECT slot_name FROM pg_replication_slots;` no longer lists it.
4. Outbox relays or reverse sync that only fed the old tables: stop and remove, after confirming no consumer still reads their topics (consumer group lag listing: `kafka-consumer-groups.sh --bootstrap-server $BROKER --describe --all-groups` and filter by topic).
5. Proxy: replace the split with a plain route to the new service; remove the mirror location.

### Output
Temporary plumbing removed.

### Quality Gate
- Boundary rule checks pass with zero ignore, baseline or freeze entries tied to this extraction.
- No replication slot, connector or consumer group for the removed pipeline remains.

---

## Phase 3: Retire Old Tables

### Entry Criteria
- Phase 2 complete and the retention period set by the user has elapsed since the writer flip.

### Actions
1. Take and verify a backup of the old tables: PostgreSQL `pg_dump -Fc -t public.invoices -t public.invoice_lines -f invoices_old.dump "$DB"` then `pg_restore --list invoices_old.dump` lists the tables; MySQL `mysqldump app invoices invoice_lines > invoices_old.sql` then restore into a scratch database and count rows.
2. Rename first, drop later: `ALTER TABLE public.invoices RENAME TO invoices_retired;` (MySQL `RENAME TABLE app.invoices TO app.invoices_retired;`). Any forgotten reader fails loudly now and can be fixed by renaming back.
3. After a further wait the user sets, with no errors referencing the old name in application logs, drop the renamed tables in a migration.
4. Run the `goal_test` from the extraction brief and record the result.

### Output
`decommission_record`.

### Quality Gate
- Backup restore count equals the source row count.
- `goal_test` result is recorded as pass or fail with evidence.

---

## Worked Example

Illustrative.

```
$ rg -n "billing-read-path-new" src/ app/
$ pytest -q
1179 passed, 3 skipped in 139.12s   (17 legacy-only characterization tests deleted, listed)
$ lint-imports
Contracts: 2 kept, 0 broken.
=> SELECT pg_drop_replication_slot('dbz_billing');
=> SELECT slot_name FROM pg_replication_slots;
(0 rows)
```
Old tables renamed to `*_retired` on day 30 (user retention), dropped on day 44 after zero log errors. `goal_test`: a billing-only change deployed on a day the catalog release was frozen. Pass.

---

## Exit Criteria

DONE when no flag, dead code, compatibility view, temporary rule exception, CDC slot or old table from the extraction remains, each removal has a proof of non-use, and the `goal_test` result is recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Tests fail after removing a flag branch | **Retry**: revert that commit; a caller still depended on the old path. Find it with the graph flow. |
| Phase 2 | A view still has reads | **Stop**: find the caller from the statement text and route it through the facade first. |
| Phase 3 | Errors appear after the rename | **Return**: rename back immediately, fix the reader, restart the wait. |
| Phase 3 | `goal_test` fails | **Return**: report it to the user with evidence; the extraction did not meet its goal even if every step passed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
