# Database Patterns

Analyze database schemas, queries, indexes, and migrations to identify anti-patterns, performance issues, and normalization problems, then produce prioritized fix recommendations.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Read schema, queries, indexes, migration history
REASON  --> Identify anti-patterns, missing indexes, normalization issues
PLAN    --> Prioritize fixes by impact (query perf > schema > migrations)
ACT     --> Generate fix recommendations, migration scripts, index additions
     \                                                              /
      +--- Act may reveal new data --- loop back to OBSERVE -------+
```

## Inputs

- `schema_files`: string -- DDL statements, ORM models, or database schema dumps
- `slow_queries`: string -- Query logs, EXPLAIN output, or known slow queries
- `migration_history`: string -- Existing migration files or schema change history
- `task_description`: string -- Specific problem to solve or general audit request

## Outputs

- `anti_pattern_report`: object -- List of identified anti-patterns with severity, location, and explanation
- `index_recommendations`: object -- Missing or suboptimal indexes with CREATE INDEX statements
- `migration_scripts`: string -- Safe, zero-downtime migration SQL for recommended fixes
- `optimization_plan`: object -- Prioritized list of changes ordered by performance impact

---

## Execution

### OBSERVE: Read Schema, Queries, Indexes, Migration History

**Entry criteria:** At least one input is provided (schema, queries, or task description).

**Actions:**
1. Read and parse schema definitions -- tables, columns, types, constraints, foreign keys
2. Identify existing indexes -- which columns are indexed, index types (B-tree, GIN, hash, partial)
3. Read EXPLAIN plans for any provided slow queries (see Reference: Reading EXPLAIN Plans)
4. Review migration history for patterns (expand-and-contract, dangerous operations, missing rollbacks)
5. Inventory foreign key relationships and check if FK columns have indexes
6. Note table sizes, row counts, and data types used for primary keys
7. Check for timestamp columns (created_at, updated_at) on each table

**Output:** A structured inventory of the database state: tables, columns, indexes, constraints, FK relationships, and query patterns.

**Quality gate:** Inventory covers all provided tables. Every table has its indexes listed. Every provided query has been parsed.

---

### REASON: Identify Anti-Patterns, Missing Indexes, Normalization Issues

**Entry criteria:** Database inventory is complete.

**Actions:**
1. Check normalization level for each table (see Reference: Schema Design: Normalization)
   - 1NF: Are there array or comma-separated columns?
   - 2NF: For composite keys, do all non-key columns depend on the full key?
   - 3NF: Are there transitive dependencies?
2. Identify common anti-patterns (see Reference: Common Anti-Patterns)
   - SELECT * in production queries
   - Missing FK indexes
   - String PKs where integer would suffice
   - OFFSET for deep pagination
   - EAV tables
   - Money stored as FLOAT
   - Missing timestamp columns
3. Analyze query plans for performance issues (see Reference: Query Optimization)
   - Sequential scans on large tables (missing index)
   - Nested loops on large inner tables
   - Sort spilling to disk
   - Wildly inaccurate row estimates
4. Check for N+1 query patterns in ORM code (see Reference: N+1 Query Detection)
5. Check index strategy (see Reference: Index Strategy)
   - Composite index column order (equality first, range last)
   - Missing covering indexes for frequent queries
   - Redundant indexes (one index is a prefix of another)
6. Check transaction and isolation level usage (see Reference: Transactions and Isolation Levels)
7. Check connection pool sizing (see Reference: Connection Pooling)
8. Evaluate caching strategy if applicable (see Reference: Caching Layers)

**Output:** A categorized list of findings: anti-patterns, missing indexes, normalization issues, query performance issues, and configuration problems. Each finding includes severity (critical/high/medium/low) and evidence.

**Quality gate:** Every finding has a severity level, a specific location (table/column/query), and evidence (why it's a problem). No vague findings like "schema could be better."

---

### PLAN: Prioritize Fixes by Impact

**Entry criteria:** Findings list is complete with severities.

**Actions:**
1. Group findings by category: query performance, schema design, migrations, configuration
2. Order by impact:
   - **Critical**: Data correctness issues (money as FLOAT, missing constraints)
   - **High**: Query performance (missing indexes on high-traffic queries, N+1 patterns)
   - **Medium**: Schema improvements (normalization, missing timestamps)
   - **Low**: Configuration tuning (pool sizing, cache strategy)
3. For each fix, assess:
   - Risk of the change (will it lock the table? require downtime? break existing queries?)
   - Effort to implement (one-line index vs. multi-step migration)
   - Dependencies (does fix B require fix A first?)
4. Create an ordered execution plan with dependencies

**Output:** A prioritized fix plan with execution order, risk assessment, and effort estimates.

**Quality gate:** Every finding from REASON has a corresponding fix in the plan (or a documented reason for deferral). No high-risk changes without a rollback strategy.

---

### ACT: Generate Fix Recommendations, Migration Scripts, Index Additions

**Entry criteria:** Prioritized fix plan is approved.

**Actions:**
1. Generate CREATE INDEX statements for missing indexes (see Reference: Index Strategy)
   - Use appropriate index type (B-tree, GIN, hash, partial)
   - Use CONCURRENTLY for production indexes to avoid locking
2. Generate migration scripts using zero-downtime patterns (see Reference: Migration Patterns)
   - Column additions: nullable with default
   - Column renames: expand-and-contract pattern
   - Column removals: stop reading first, then drop
   - Data backfills: batched updates with commit and sleep
3. Generate query rewrites for slow queries (see Reference: Slow Query Patterns)
   - Replace function calls on indexed columns with expression indexes
   - Replace OFFSET pagination with cursor/keyset pagination
   - Replace SELECT * with specific column lists
4. Generate ORM fixes for N+1 patterns (eager loading, subquery loading)
5. Generate partitioning recommendations if applicable (see Reference: Partitioning)
6. Produce a summary checklist for verification

**Output:** Concrete, executable SQL and code changes for each fix. Migration scripts with UP and DOWN methods. A verification checklist.

**Quality gate:** Every generated SQL statement is syntactically valid. Every migration has a rollback. Index additions use CONCURRENTLY. Backfills are batched.

---

**Loop condition:** After ACT, if new queries or schema details are discovered (e.g., the fix reveals a dependent table that also needs changes), loop back to OBSERVE with the new context.

## Exit Criteria

The skill is DONE when:
- All identified anti-patterns have either a fix recommendation or a documented deferral reason
- All missing indexes have CREATE INDEX statements
- All migration scripts follow zero-downtime patterns
- The verification checklist is complete
- No critical or high severity findings remain unaddressed

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Schema is too large to fully parse | **Adjust** -- focus on tables mentioned in slow queries or task description |
| OBSERVE | No EXPLAIN output available | **Skip** -- note that query analysis is limited without EXPLAIN data |
| REASON | Ambiguous schema design (can't tell if denormalization is intentional) | **Escalate** -- ask user for context on design intent |
| PLAN | Conflicting fixes (fix A makes fix B unnecessary) | **Adjust** -- reorder plan, note the dependency |
| ACT | Generated migration is too risky for production | **Adjust** -- break into smaller steps, add more safety checks |
| ACT | Cannot determine correct index type without query patterns | **Escalate** -- ask user for representative queries |
| ACT | User rejects final output | **Targeted revision** -- ask which schema pattern, index recommendation, or migration script fell short and rerun only that section. Do not regenerate the full database analysis. |

## State Persistence

Between runs, this skill saves:
- **Schema inventory**: table/column/index snapshot for comparison on next run
- **Previous findings**: what was found last time (to detect new vs recurring issues)
- **Applied fixes**: which recommendations were implemented (to avoid re-suggesting)
- **Query baseline**: EXPLAIN output for comparison after changes

---

## Reference

### Schema Design: Normalization

#### First Normal Form (1NF)
Every column holds atomic (single) values. No arrays, no comma-separated lists.

```sql
-- BAD: violates 1NF
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  phone_numbers TEXT  -- "555-1234,555-5678"
);

-- GOOD: 1NF
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT
);
CREATE TABLE phone_numbers (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  phone TEXT
);
```

#### Second Normal Form (2NF)
Every non-key column depends on the ENTIRE primary key (relevant for composite keys).

```sql
-- BAD: student_name depends only on student_id, not on (student_id, course_id)
CREATE TABLE enrollments (
  student_id INT,
  course_id INT,
  student_name TEXT,   -- partial dependency
  grade CHAR(1),
  PRIMARY KEY (student_id, course_id)
);

-- GOOD: 2NF — move student_name to its own table
```

#### Third Normal Form (3NF)
No transitive dependencies. Every non-key column depends on the key, the whole key, and nothing but the key.

```sql
-- BAD: city depends on zip_code, not directly on user_id
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  zip_code TEXT,
  city TEXT  -- city depends on zip_code, not on id
);

-- GOOD: 3NF
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  zip_code TEXT REFERENCES zip_codes(code)
);
CREATE TABLE zip_codes (
  code TEXT PRIMARY KEY,
  city TEXT
);
```

#### When to Denormalize
Denormalize when:
- Read queries dominate and JOIN performance is a bottleneck
- You need a materialized aggregate (e.g., `order_total` stored on the order)
- Data is append-only (event logs, audit trails)
- You're using a document store (MongoDB) where embedding is idiomatic

Always denormalize **knowingly**: add a comment, keep the canonical source, and update the denormalized copy via triggers or application logic.

---

### Index Strategy

#### B-Tree Index (default, use for most things)
```sql
-- Single column: speeds up WHERE, ORDER BY, GROUP BY
CREATE INDEX idx_users_email ON users(email);

-- Composite: column ORDER MATTERS. Follows leftmost-prefix rule.
-- This index covers: (status), (status, created_at), (status, created_at, priority)
-- It does NOT cover: (created_at) alone or (priority) alone
CREATE INDEX idx_orders_status_created ON orders(status, created_at, priority);
```

#### Composite Index Column Order Rules
1. **Equality columns first**: columns in `WHERE col = ?`
2. **Range column last**: columns in `WHERE col > ?` or `ORDER BY col`
3. **High-selectivity columns first** among equals

```sql
-- Query: WHERE status = 'active' AND created_at > '2026-01-01' ORDER BY created_at
-- Optimal index:
CREATE INDEX idx_orders_lookup ON orders(status, created_at);
-- status (equality) first, created_at (range + sort) second
```

#### Covering Index
Includes all columns needed by a query, so the DB never touches the table (index-only scan):
```sql
-- Query: SELECT email, name FROM users WHERE status = 'active'
CREATE INDEX idx_users_covering ON users(status) INCLUDE (email, name);
```

#### Partial Index
Index only the rows you care about. Smaller, faster.
```sql
-- Only index active users (if 90% of queries filter for active)
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';
```

#### Hash Index (PostgreSQL)
Equality-only lookups. Slightly faster than B-tree for `=`, but no range queries or sorting.
```sql
CREATE INDEX idx_users_email_hash ON users USING hash(email);
```

#### GIN Index (for JSONB, arrays, full-text search)
```sql
-- Index JSONB fields
CREATE INDEX idx_meta ON products USING gin(metadata);
-- Enables: WHERE metadata @> '{"color": "red"}'

-- Full-text search
CREATE INDEX idx_fts ON articles USING gin(to_tsvector('english', body));
```

#### When NOT to Index
- Columns with very low selectivity (e.g., boolean `is_active` on a table where 99% are true)
- Tables with < 1000 rows (sequential scan is faster)
- Write-heavy tables where index maintenance cost exceeds read benefit
- Columns you never filter, sort, or join on

#### Foreign Key Indexes
**Always index foreign keys.** PostgreSQL does NOT auto-create indexes on foreign key columns. Without them, DELETE on the parent table scans the entire child table.

```sql
-- CRITICAL: index the FK column
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

---

### Query Optimization

#### Reading EXPLAIN Plans
```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123 AND status = 'shipped';
```

Key things to look for:
| What You See | What It Means | Action |
|---|---|---|
| Seq Scan | Full table scan | Add an index |
| Index Scan | Using index, then fetching rows | Good |
| Index Only Scan | All data from index | Best |
| Bitmap Index Scan | Index scan + heap scan (for low selectivity) | Acceptable |
| Nested Loop | O(n*m) join | Fine for small inner table; consider hash join |
| Hash Join | Builds hash table from smaller side | Good for medium tables |
| Merge Join | Both sides sorted, merge | Good for large pre-sorted data |
| Sort (external) | Spilling to disk | Increase `work_mem` or add index |
| Rows (estimated vs actual) | If wildly different | Run ANALYZE to update statistics |

#### N+1 Query Detection
The #1 performance killer in ORMs:
```python
# BAD: N+1 — 1 query for users, then 1 query per user for orders
users = User.query.all()  # SELECT * FROM users
for user in users:
    print(user.orders)    # SELECT * FROM orders WHERE user_id = ?  (N times!)

# GOOD: Eager load
users = User.query.options(joinedload(User.orders)).all()
# SELECT * FROM users JOIN orders ON ...  (1 query)

# GOOD: Subquery load (for large result sets)
users = User.query.options(subqueryload(User.orders)).all()
# SELECT * FROM users; SELECT * FROM orders WHERE user_id IN (...)  (2 queries)
```

#### Slow Query Patterns
```sql
-- BAD: Function on indexed column prevents index use
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';
-- FIX: Expression index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- BAD: Leading wildcard prevents index use
SELECT * FROM users WHERE email LIKE '%@gmail.com';
-- FIX: Use full-text search or reverse index
CREATE INDEX idx_users_email_rev ON users(REVERSE(email));

-- BAD: Implicit cast
SELECT * FROM orders WHERE id = '123';  -- id is INT, '123' is TEXT
-- FIX: Use correct types

-- BAD: SELECT * fetches all columns including BLOBs
SELECT * FROM products;
-- FIX: Select only needed columns
SELECT id, name, price FROM products;

-- BAD: OFFSET for deep pagination
SELECT * FROM orders ORDER BY id OFFSET 1000000 LIMIT 10;
-- FIX: Cursor/keyset pagination
SELECT * FROM orders WHERE id > 1000000 ORDER BY id LIMIT 10;
```

---

### Migration Patterns

#### Zero-Downtime Column Addition
```sql
-- SAFE: Adding a nullable column with no default is instant (metadata-only)
ALTER TABLE users ADD COLUMN bio TEXT;

-- SAFE in PostgreSQL 11+: Adding column with DEFAULT is instant
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member';

-- DANGEROUS: Adding NOT NULL without default locks table and rewrites all rows
ALTER TABLE users ADD COLUMN role TEXT NOT NULL;  -- LOCKS TABLE!
```

#### Zero-Downtime Column Rename
Never rename in one step. Use expand-and-contract:
1. Add new column
2. Deploy code that writes to BOTH old and new columns
3. Backfill new column: `UPDATE users SET new_name = old_name WHERE new_name IS NULL`
4. Deploy code that reads from new column only
5. Drop old column

#### Zero-Downtime Column Removal
1. Deploy code that no longer reads from the column
2. Deploy code that no longer writes to the column
3. `ALTER TABLE users DROP COLUMN old_col;`

#### Data Backfills
```sql
-- BAD: Single UPDATE locks millions of rows
UPDATE orders SET new_col = compute(old_col);

-- GOOD: Batch updates
DO $$
DECLARE
  batch_size INT := 10000;
  rows_updated INT;
BEGIN
  LOOP
    UPDATE orders SET new_col = compute(old_col)
    WHERE id IN (
      SELECT id FROM orders WHERE new_col IS NULL LIMIT batch_size
    );
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    EXIT WHEN rows_updated = 0;
    COMMIT;
    PERFORM pg_sleep(0.1);  -- breathe between batches
  END LOOP;
END $$;
```

---

### Connection Pooling

#### Pool Sizing Formula
```
connections = (core_count * 2) + effective_spindle_count
```
- For SSD: `effective_spindle_count = 1`
- For 4-core machine with SSD: `(4 * 2) + 1 = 9` connections
- This is the DATABASE-SIDE max. Your application pool should match.

#### Application Pool Settings
```yaml
# Typical settings for a web app
pool:
  min_size: 5           # Keep 5 connections warm
  max_size: 20          # Never exceed 20
  max_idle_time: 300    # Close idle connections after 5 min
  connection_timeout: 5 # Fail fast if pool exhausted
  statement_timeout: 30 # Kill queries running > 30s
```

#### PgBouncer (External Pooler)
Use transaction-mode pooling for short-lived queries:
```ini
[pgbouncer]
pool_mode = transaction    # Release connection after each transaction
max_client_conn = 1000     # Accept many app connections
default_pool_size = 20     # Multiplex to 20 real DB connections
```

---

### Transactions and Isolation Levels

#### Isolation Levels
| Level | Dirty Read | Non-Repeatable Read | Phantom Read | Use Case |
|-------|-----------|-------------------|-------------|----------|
| READ UNCOMMITTED | Yes | Yes | Yes | Never use |
| READ COMMITTED | No | Yes | Yes | Default (PostgreSQL). Good for most apps |
| REPEATABLE READ | No | No | Yes* | Financial calculations, reports |
| SERIALIZABLE | No | No | No | Money transfers, inventory management |

*PostgreSQL's REPEATABLE READ also prevents phantom reads.

#### Deadlock Prevention
1. **Always acquire locks in the same order**: If you lock users then orders, always do it in that order
2. **Keep transactions short**: Do computation outside the transaction
3. **Use advisory locks for application-level coordination**:
   ```sql
   SELECT pg_advisory_lock(hashtext('user:' || user_id::text));
   -- do work
   SELECT pg_advisory_unlock(hashtext('user:' || user_id::text));
   ```
4. **Set lock timeouts**:
   ```sql
   SET lock_timeout = '5s';  -- Fail instead of waiting forever
   ```

#### Optimistic Locking
```sql
-- Add version column
ALTER TABLE products ADD COLUMN version INT DEFAULT 0;

-- Update with version check
UPDATE products
SET price = 29.99, version = version + 1
WHERE id = 123 AND version = 5;
-- If 0 rows affected: someone else updated first → 409 Conflict
```

---

### Caching Layers

#### Read-Through Cache
```python
def get_user(user_id):
    cached = cache.get(f"user:{user_id}")
    if cached:
        return cached
    user = db.query("SELECT * FROM users WHERE id = %s", user_id)
    cache.set(f"user:{user_id}", user, ttl=300)  # 5 min TTL
    return user
```

#### Write-Through Cache
```python
def update_user(user_id, data):
    db.execute("UPDATE users SET ... WHERE id = %s", user_id)
    cache.set(f"user:{user_id}", data, ttl=300)  # Update cache immediately
```

#### Write-Behind (Write-Back) Cache
Write to cache immediately, flush to DB asynchronously. Higher performance, risk of data loss.

#### Cache Invalidation Strategies
1. **TTL-based**: Simple, eventual consistency. Good for config, catalogs.
2. **Event-based**: Invalidate on write. Good for user data, session data.
3. **Version-based**: Include version in cache key. `user:123:v5`. Never stale, keys accumulate.

#### Cache Stampede Prevention
When TTL expires, hundreds of requests hit DB simultaneously:
```python
# Solution 1: Lock — only one request refills cache
def get_user(user_id):
    cached = cache.get(f"user:{user_id}")
    if cached:
        return cached
    lock = cache.lock(f"lock:user:{user_id}", timeout=5)
    if lock.acquire():
        try:
            user = db.query(...)
            cache.set(f"user:{user_id}", user, ttl=300)
            return user
        finally:
            lock.release()
    else:
        time.sleep(0.1)
        return get_user(user_id)  # Retry, cache should be populated

# Solution 2: Stale-while-revalidate
# Store TTL inside the value, serve stale data while refreshing in background
```

---

### Partitioning

#### Horizontal Partitioning (Sharding)
Split rows across databases by a shard key:
```
Shard 0: user_id % 4 == 0
Shard 1: user_id % 4 == 1
Shard 2: user_id % 4 == 2
Shard 3: user_id % 4 == 3
```

#### PostgreSQL Native Partitioning
```sql
-- Range partitioning by date
CREATE TABLE events (
  id SERIAL,
  created_at TIMESTAMP,
  data JSONB
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_q1 PARTITION OF events
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE events_2026_q2 PARTITION OF events
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

-- List partitioning by region
CREATE TABLE orders (
  id SERIAL,
  region TEXT,
  total NUMERIC
) PARTITION BY LIST (region);

CREATE TABLE orders_us PARTITION OF orders FOR VALUES IN ('US');
CREATE TABLE orders_eu PARTITION OF orders FOR VALUES IN ('EU', 'UK');
```

#### When to Partition
- Table exceeds ~100M rows and queries always filter by partition key
- You need to DROP old data quickly (drop partition, not DELETE)
- Different partitions need different storage tiers (hot/cold)

---

### Common Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| `SELECT *` | Fetches unnecessary data, breaks covering indexes | List specific columns |
| Missing FK indexes | DELETE on parent scans child table | `CREATE INDEX` on every FK |
| Implicit cartesian join | `FROM a, b` without WHERE = n*m rows | Use explicit `JOIN ... ON` |
| String PKs (UUIDs as text) | Slower comparison, larger indexes | Use `UUID` type or `BIGSERIAL` |
| `OFFSET` for deep pages | Scans and discards N rows | Use keyset/cursor pagination |
| EAV (Entity-Attribute-Value) | Unjoinable, unindexable mess | Use JSONB column or separate tables |
| Storing money as FLOAT | Rounding errors | Use `NUMERIC(19,4)` or integer cents |
| No created_at/updated_at | Can't debug, can't partition, can't replicate | Always add timestamp columns |
| God table (100+ columns) | Wide rows, slow scans | Vertical partition into related tables |

---

### Quick Reference Checklist

- [ ] Schema is in 3NF (denormalized only where justified and documented)
- [ ] Every foreign key has an index
- [ ] Composite indexes follow equality-first, range-last rule
- [ ] No `SELECT *` in production code
- [ ] ORM queries checked for N+1 patterns
- [ ] Migrations are backward-compatible (expand-and-contract)
- [ ] Connection pool sized to `(cores * 2) + spindles`
- [ ] Money stored as NUMERIC or integer cents, never FLOAT
- [ ] Every table has `created_at` and `updated_at` timestamps
- [ ] Slow query log is enabled and monitored
- [ ] Cache invalidation strategy is explicit, not ad-hoc
- [ ] Transactions use the minimum isolation level needed
