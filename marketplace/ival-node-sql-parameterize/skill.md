# Node.js SQL Injection Fix With Placeholders

**One-line description:** Replaces template-literal and concatenated SQL in Node.js with placeholders for the driver or ORM actually in use (node-postgres `$1`, mysql2 `?` with `execute`, better-sqlite3 `?`, Knex bindings, Prisma tagged `$queryRaw`, Sequelize `replacements`), allowlists identifiers, and proves each fix with an injection test against a real database.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `sink_map` (object, required): Output of `ival-sink-class-map`; rows with `class` = `sql`.

---

## Outputs

- `node_sql_fixes` (object): `fixed` (file, line, before, after), `scan_before` and `scan_after` (Semgrep finding counts), `test_file`, `test_run`.

---

## Phase 1: Baseline and Library Identification

### Entry Criteria
- One or more `sql` rows in `sink_map.sinks` with status `vulnerable` or `needs_review`.

### Actions
1. Baseline scan: `semgrep scan --config p/javascript --config p/typescript --json -o semgrep-sql-before.json` and count results whose `check_id` contains `sql` (`jq '[.results[] | select(.check_id | test("sql"))] | length' semgrep-sql-before.json`). Record as `scan_before`.
2. Identify the library per file with `rg -n "from ['\"](pg|mysql2|better-sqlite3|knex|@prisma/client|sequelize|typeorm)['\"]|require\(['\"](pg|mysql2|knex|sequelize)" --type js --type ts`.
3. Placeholder and safe call per library:

| Library | Safe form | Unsafe form to remove |
|---|---|---|
| `pg` (node-postgres) | `pool.query("SELECT * FROM t WHERE id = $1", [id])` | `` pool.query(`... ${id}`) `` |
| `mysql2` | `conn.execute("SELECT * FROM t WHERE id = ?", [id])` (server-side prepared) | `` conn.query(`... ${id}`) `` |
| `better-sqlite3` | `db.prepare("SELECT * FROM t WHERE id = ?").get(id)` | `` db.prepare(`... ${id}`) `` |
| Knex | `.where("id", id)`, `.whereRaw("lower(name) = ?", [name])`, `knex.raw("?? = ?", [col, val])` | `` .whereRaw(`name = '${name}'`) `` |
| Prisma | `` prisma.$queryRaw`SELECT * FROM t WHERE id = ${id}` `` (tagged template binds values) or `Prisma.sql` | `$queryRawUnsafe(...)`, `$executeRawUnsafe(...)` with user data |
| Sequelize | `sequelize.query("... WHERE id = :id", { replacements: { id } })` or `bind` | `` sequelize.query(`... ${id}`) `` |
| TypeORM | `.where("u.id = :id", { id })`, `manager.query("... $1", [id])` | `` .where(`u.id = ${id}`) `` |

   Note the trap: in Prisma the backtick form is safe only as a tagged template directly on `$queryRaw`; building the string first and passing it to `$queryRawUnsafe` is injectable.

### Output
Fix list with library per item; `scan_before`.

### Quality Gate
- `scan_before` comes from a saved JSON file.
- Every fix item names its library and target safe form.

---

## Phase 2: Rewrite Each Query

### Entry Criteria
- Fix list exists.

### Actions
1. Apply the rule for what the value represents:

| Value | Fix |
|---|---|
| Scalar value | placeholder from the table |
| Array for `IN` | `pg`: `WHERE id = ANY($1)` with a JS array; Knex: `.whereIn("id", ids)`; mysql2: `WHERE id IN (?)` with `[ids]` using `query` (array expansion is a `query` feature; check mysql2 docs before relying on it with `execute`) |
| `LIKE` term | escape `%`, `_`, `\` then bind: `"name ILIKE $1 ESCAPE '\\'"` with `` `%${escaped}%` `` as the value |
| Column or table name | allowlist object: `const SORT = { date: "created_at", total: "amount_cents" }`; reject keys not in it with 400 |
| Identifier with Knex | `??` binding (`knex.raw("?? = ?", [col, v])`) after allowlisting |
| Identifier with `pg` | allowlist only; `pg-format` `%I` is an option if already a dependency |

2. One file per change; run that file's tests after each.
3. Do NOT use `mysql.escape()` or manual quote doubling as the fix; use placeholders.
4. Do NOT set `multipleStatements: true` in mysql2 connection options; if it is set, record it as a finding and remove it unless the owner names a need.

### Output
Rewritten queries.

### Quality Gate
- Rerun the Phase 1 step 1 scan; `scan_after` is lower, and every remaining SQL finding is listed with why it is safe.
- These two commands print nothing for request-reachable code (single quotes so the shell leaves `$` and backticks alone):

```
rg -n 'queryRawUnsafe|executeRawUnsafe' --type js --type ts
rg -n 'query\(\s*`[^`]*\$\{' --type js --type ts
```

---

## Phase 3: Injection Tests

### Entry Criteria
- Queries rewritten.

### Actions
1. Test against the real database engine (the repo's test container or a `docker run postgres` service). Do not mock the client.

```ts
const payloads = ["' OR '1'='1", "1; DROP TABLE orders;--", "x' UNION SELECT password FROM users--"];

test.each(payloads)("status filter treats %s as a literal", async (p) => {
  await db.query("INSERT INTO orders (id, status) VALUES (1, 'open')");
  expect(await listOrders({ status: p })).toEqual([]);
  const { rows } = await db.query("SELECT count(*)::int AS n FROM orders");
  expect(rows[0].n).toBe(1);
});
```

2. Add one test that an unknown sort key returns 400 through `supertest`.
3. Run `npm test -- sql` and record the summary.
4. Mutation check: reintroduce the template literal in one query, run, confirm failure, revert.

### Output
`node_sql_fixes`.

### Quality Gate
- Test summary shows 0 failed.
- Mutation run fails on the `' OR '1'='1` case; reverted run passes.

---

## Worked Example

Illustrative. `src/repo/orders.ts:52` with node-postgres:

Before:
```ts
pool.query(`SELECT * FROM orders WHERE status = '${status}' ORDER BY ${sort}`)
```
After:
```ts
const SORT = { date: "created_at", total: "amount_cents" } as const;
const col = SORT[sort as keyof typeof SORT];
if (!col) throw new BadRequest("sort");
pool.query(`SELECT * FROM orders WHERE status = $1 ORDER BY ${col}`, [status]);
```
The remaining `${col}` comes only from the constant object, so it is listed as a justified scan finding if Semgrep still flags it.

Phase 3: `Tests  4 passed (4)`.

---

## Exit Criteria

DONE when every Node.js SQL sink binds values through placeholders, identifiers are allowlisted, unsafe Prisma raw calls are gone from request paths, and injection tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `semgrep` not installed | **Adjust**: `pipx install semgrep` or `docker run --rm -v "$PWD:/src" semgrep/semgrep semgrep scan ...`. |
| Phase 2 | Query builder generates SQL from a user-supplied JSON filter object | **Adjust**: map allowed filter keys and operators through an allowlist before passing to the builder; reject anything else with 400. |
| Phase 2 | Placeholder count mismatch error at runtime | **Adjust**: count `$n` placeholders and array entries; do not fall back to interpolation. |
| Phase 3 | Mutation still passes | **Stop**: the test does not call the code you changed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
