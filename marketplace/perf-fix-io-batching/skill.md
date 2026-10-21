# I/O Batching Fix Candidates

**One-line description:** For hotspots classified as I/O, counts round trips (database queries, HTTP calls, system calls) per unit of work, detects N+1 queries, unbuffered writes and per-item remote calls with stack-specific tools, and proposes batched or buffered replacements whose success is measured as a lower round-trip count.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `classified_hotspots` (object[], required): From `perf-hotspot-classify`; only `io` entries are used.
- `stack` (string, required): `python`, `node`, `go`, `rust`, `jvm`, `c` or `cpp`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `io_candidates` (object[]): Ranked candidates, each with `id`, `location`, `io_kind` (database, http, file, syscall), `round_trips_before` per unit of work with the counting command, `technique`, `replacement` sketch, `batch_size_source` (user input or documented limit), `semantic_risks`. Written to `perf/candidates_io.json`. Nothing is applied here.

---

## Phase 1: Count Round Trips

### Entry Criteria
- At least one hotspot has class `io`.

### Actions
1. Pick one unit of work (one request, one batch of rows from `workload_spec`). Count round trips for it with the matching tool:

   | I/O kind | Stack | How to count |
   |---|---|---|
   | database | Python Django | in a test: `from django.test.utils import CaptureQueriesContext; from django.db import connection; with CaptureQueriesContext(connection) as ctx: run_unit(); print(len(ctx.captured_queries))` |
   | database | Python SQLAlchemy | `create_engine(url, echo=True)` in a measurement script and count `SELECT` lines, or an `event.listen(engine, "before_cursor_execute", counter)` hook |
   | database | JVM Hibernate/JPA | set `hibernate.generate_statistics=true` and read `Statistics.getPrepareStatementCount()`, or enable SQL logging (`spring.jpa.show-sql=true`) and count statements |
   | database | Go `database/sql` | wrap the driver or count calls with a test hook; or read the database's own statement log for the test run |
   | database | Node (Prisma, Knex, pg) | enable the library's query log (for example Prisma `log: ['query']`, Knex `debug: true`) and count queries |
   | database | any | PostgreSQL: `pg_stat_statements` `calls` column before and after the unit of work |
   | HTTP | any | count outbound requests in the client's debug log or with a local proxy (for example mitmproxy) |
   | file or syscall | Linux | `strace -f -c -e trace=read,write,openat,fsync,sendto,recvfrom -- <command>`; the summary table counts calls per syscall |

2. Record round trips per unit of work and how they scale with the input size (run the count at two sizes). A count that grows with the number of items is the N+1 signature.
3. Record the per-call latency if the tool shows it (strace `-T`, query log timings, `pg_stat_statements.mean_exec_time`).

### Output
Round-trip counts at two sizes with commands.

### Quality Gate
- Each I/O hotspot has a count at two sizes, with the exact counting command recorded.

---

## Phase 2: Match a Batching Technique

### Entry Criteria
- Counts recorded.

### Actions
1. Choose the technique from this table:

   | Pattern | Technique by stack |
   |---|---|
   | N+1 read: one query per parent to load children | Django `select_related` (foreign key, one-to-one) or `prefetch_related` (many); SQLAlchemy `selectinload`/`joinedload`; JPA `JOIN FETCH` or `@BatchSize`; Go one `WHERE id = ANY($1)` (PostgreSQL) or `IN (...)` query then group in a map; Node Prisma `include` or one `where: { id: { in: ids } }` |
   | One INSERT or UPDATE per row | Python DB-API `executemany`, psycopg `copy`, SQLAlchemy bulk `insert()` with a list; JDBC `addBatch`/`executeBatch`; Go `pgx.Batch` or `CopyFrom`; Node multi-row insert in the query builder |
   | One HTTP call per item | the API's batch endpoint if documented; else bounded concurrency with a reused client (Python `requests.Session` or `httpx.Client`, Node keep-alive `Agent`, Go one shared `http.Client`) |
   | Many small `write` syscalls | buffered writer: Python file objects are buffered by default (check you are not calling `flush()` per line); Go `bufio.NewWriter` plus `Flush()`; Rust `BufWriter`; Java `BufferedOutputStream`/`BufferedWriter`; C `fwrite` with stdio buffering instead of `write` per item |
   | `fsync` per record | group commits: one `fsync` per batch, only if the durability requirement allows it |
   | Repeated reads of the same file or remote value | read once and keep in memory for the unit of work |

2. Batch size: take it from the user or from a documented limit (for example the database's maximum parameters per statement, an API's documented maximum batch size). If neither exists, record batch size as an open question; do not invent one.
3. List semantic risks: transaction boundaries change (one failure can now fail the whole batch), ordering of side effects, memory growth from unbounded batches, missing `Flush()`/`close()` loses data, partial failure handling for batch APIs, and lazy-loading code paths elsewhere that still trigger queries.

### Output
Candidates with technique, batch size source and risks.

### Quality Gate
- Every candidate cites one table row and states its expected round trips per unit of work after the change (for example "1 + 1 queries instead of 1 + n").
- `batch_size_source` is a user value, a cited documented limit, or "open question".

---

## Phase 3: Rank and Save

### Entry Criteria
- Candidates exist.

### Actions
1. Rank by round trips removed per unit of work multiplied by measured per-call latency when available, else by round trips removed.
2. Write `perf/candidates_io.json`; validate with `python -m json.tool`.
3. Do not edit source files here.

### Output
`io_candidates`.

### Quality Gate
- `perf/candidates_io.json` parses with exit code 0.
- `git -C <repo_path> status --porcelain` lists no modified source files.

---

## Worked Example

Illustrative. Django view `/orders/` listing 50 orders with customer names.

- Phase 1: `CaptureQueriesContext` count: 51 queries at 50 orders, 101 at 100 orders: one query for orders plus one per order for `order.customer`.
- Phase 2: technique "N+1 read", Django `Order.objects.select_related("customer")`. Expected 1 query at any page size. Risk: none for ordering; check template code for other lazy relations (`order.items.all` would need `prefetch_related`).
- Phase 3: candidate I1 saved with `round_trips_before: 51`, expected after: 1.

---

## Exit Criteria

DONE when every I/O hotspot has a round-trip count at two sizes, a technique with expected counts after, a sourced or open batch size, and risks, with no source file modified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot see queries in production | **Adjust**: reproduce one unit of work in a test with the counting hook. |
| Phase 1 | `strace` not permitted | **Adjust**: run under `sudo` or count at the application level; record it. |
| Phase 2 | No batch endpoint and concurrency limit unknown | **Return**: ask the user for the remote service's rate limit; do not guess. |
| Phase 2 | Durability rules forbid grouped `fsync` | **Stop**: do not propose it; record the constraint. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
