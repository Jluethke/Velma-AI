# Dual Write, Outbox or Change Data Capture Decision

**One-line description:** Chooses how data stays consistent between the monolith and the extracted module while both exist (none, transactional outbox, log-based change data capture, or application dual write with reconciliation) from a decision table built on the failure modes of each, and records which direction data flows and who is the single writer at each migration stage.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `schema_split_plan` (object, required): From `mex-schema-ownership-split`; supplies `target_location`.
- `database_engine` (string, required): `postgres`, `mysql` or `other`.
- `deployment_decision` (string, required): `in_process` or `service`.

---

## Outputs

- `sync_strategy` (string): `none`, `outbox`, `cdc` or `dual_write_reconciled`.
- Additional fields recorded alongside `sync_strategy` in the same result: `direction` (old to new, new to old, or both by stage), `single_writer_by_stage`, `consumers`, `ordering_key`, and `rationale` citing the decision table rows.

---

## Phase 1: State the Data Movement Problem

### Entry Criteria
- `schema_split_plan.target_location` is known.

### Actions
1. If `target_location` is `same_server_schema` and both sides only use the owner's facade, there is nothing to sync: `sync_strategy = none`. Skip to Phase 3.
2. Otherwise write the stages explicitly. A typical stage list for moving data to a new server:

   | Stage | Single writer | Readers | Data must flow |
   |---|---|---|---|
   | S1 Copy | monolith tables | monolith | old to new (backfill plus ongoing) |
   | S2 Shadow read | monolith tables | monolith, new service compares | old to new |
   | S3 Flip writer | new service | both | new to old (legacy readers still on old tables) |
   | S4 Retire | new service | new service only | none |

3. Rule: at every stage exactly one side writes a given row. Two writers for the same row at the same time is never a valid stage.
4. List consumers that need the data and whether they need row changes (replicated table) or business events (`InvoiceIssued`).

### Output
Stage table and consumer list.

### Quality Gate
- Every stage has exactly one writer.

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Stages written.

### Actions
1. Failure modes to weigh (these are properties of the patterns, not opinions):
   - Application dual write (write to store A, then to store B or a broker, without a shared transaction): a crash or error between the two writes leaves them inconsistent, and concurrent requests can apply writes in different orders on each side. It needs a reconciliation job to detect and repair drift.
   - Transactional outbox: the business row and an event row commit in one local transaction; a relay publishes the event later. Delivery is at least once, so consumers must be idempotent. Requires code changes in the writer.
   - Log-based CDC (Debezium reading the PostgreSQL WAL or MySQL binlog): captures every committed row change including ones from scripts and other apps, without writer code changes. Emits row-level changes, not business intent; consumers depend on table shape. Needs database configuration (logical replication or row-based binlog) and operational care (replication slots, binlog retention).
2. Decide, top row first, first match wins:

   | # | Condition | `sync_strategy` |
   |---|---|---|
   | 1 | `target_location` is `same_server_schema` and no consumer needs a copy | `none` |
   | 2 | Consumers need business events with intent, and you control the writer code | `outbox` |
   | 3 | Need a replica of tables on the other side, writes come from code you cannot change or from many places (scripts, admin tools, other apps) | `cdc` |
   | 4 | Need a replica, and you control all writers | `outbox` if consumers can accept events; else `cdc` |
   | 5 | Engine is `other` and has no supported Debezium connector, and no outbox is possible | `dual_write_reconciled` (only with a reconciliation job from `mex-backfill-and-reconcile` running on a schedule) |

3. For `cdc`, confirm a Debezium connector exists for the engine (PostgreSQL and MySQL are covered by `mex-cdc-debezium-postgres` and `mex-cdc-debezium-mysql`; for others, check the Debezium connector list in its docs).
4. Pick the ordering key: the aggregate ID (for example `invoice_id`). Events for one aggregate must be processed in order; with Kafka, use it as the message key so they land in one partition.

### Output
`sync_strategy` with rationale.

### Quality Gate
- The chosen row number is recorded and its condition is shown true with evidence.
- If `dual_write_reconciled` is chosen, a reconciliation schedule is named.

---

## Phase 3: Record Responsibilities

### Entry Criteria
- Strategy chosen.

### Actions
1. For each stage, write who writes, how data flows, how consumers deduplicate (event ID or source LSN/binlog position stored in a processed-events table), and the rollback for that stage (for example: S3 rollback = flip writer flag back to monolith; new service stops writing; CDC from monolith resumes).
2. Hand off to the next flow: `outbox` to `mex-transactional-outbox`; `cdc` with `postgres` to `mex-cdc-debezium-postgres`; `cdc` with `mysql` to `mex-cdc-debezium-mysql`; every non-`none` strategy then to `mex-backfill-and-reconcile`.

### Output
`sync_strategy` with stage responsibilities.

### Quality Gate
- Every stage has a rollback entry.

---

## Worked Example

Illustrative. `target_location = separate_server`, PostgreSQL. Consumers: the new billing service needs `invoices`, `invoice_lines`, `payments` (row replica during S1 and S2); the monolith reporting needs invoice data after S3. A nightly finance SQL script and the Django admin also write `payments`.

Row 3 matches (writes come from places we will not change during S1 and S2): `sync_strategy = cdc`, direction old to new for S1 and S2. For S3, the billing service becomes the writer and publishes `InvoiceIssued` and `PaymentRecorded` through an outbox so monolith reporting gets intent-level events; recorded as a second strategy for that stage. Ordering key `invoice_id`.

---

## Exit Criteria

DONE when each migration stage has one writer, a data flow direction, a deduplication method and a rollback, and the strategy follows from a cited table row.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Stage plan has two writers for the same rows | **Stop**: split the stage; never run two concurrent writers. |
| Phase 2 | User asks for dual write because it is quickest | **Adjust**: show the failure modes; allow it only as row 5 with reconciliation scheduled. |
| Phase 2 | Logical replication or binlog cannot be enabled (managed database restrictions) | **Adjust**: check the provider's docs for CDC support; if unavailable, choose `outbox`. |
| Phase 3 | Consumers cannot be made idempotent | **Return**: report it; at-least-once delivery makes this a blocker for both outbox and CDC. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
