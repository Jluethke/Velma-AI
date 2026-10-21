# Python SQL Injection Fix With Bound Parameters

**One-line description:** Replaces every SQL string built with f-strings, `%` formatting, `.format()` or `+` in Python code with driver-bound parameters (psycopg, sqlite3, PyMySQL, SQLAlchemy `text()` with named binds, Django `params=`), handles identifiers, `IN` lists and `LIKE` patterns with the correct API, and proves each fix with a Bandit B608 rerun and an injection regression test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `sink_map` (object, required): Output of `ival-sink-class-map`; this flow uses rows with `class` = `sql`.

---

## Outputs

- `py_sql_fixes` (object): `fixed` (file, line, before, after per sink), `bandit_before` and `bandit_after` (B608 counts), `test_file`, `test_run`.

---

## Phase 1: Baseline Scan and Driver Identification

### Entry Criteria
- `sink_map.sinks` has one or more `sql` rows with status `vulnerable` or `needs_review`.

### Actions
1. Install and run Bandit for the SQL test only:
   `pip install bandit` then `bandit -r <src_dir> -t B608 -f txt`. Record the count from the `Total issues` summary as `bandit_before`. B608 is `hardcoded_sql_expressions` (SQL built by string operations).
2. Union the B608 hits with the `sink_map` SQL rows; each unique file:line is one item to fix.
3. Find the driver and its placeholder style. The placeholder is set by the driver, not by Python:

| Driver (import) | Placeholder | Example |
|---|---|---|
| `psycopg` (3) / `psycopg2` | `%s` or `%(name)s` | `cur.execute("SELECT * FROM t WHERE id = %s", (uid,))` |
| `sqlite3` | `?` or `:name` | `cur.execute("SELECT * FROM t WHERE id = ?", (uid,))` |
| `pymysql` / `mysqlclient` | `%s` | `cur.execute("... WHERE id = %s", (uid,))` |
| `asyncpg` | `$1`, `$2` | `await conn.fetch("... WHERE id = $1", uid)` |
| SQLAlchemy `text()` | `:name` | `conn.execute(text("... WHERE id = :id"), {"id": uid})` |
| Django `cursor.execute` / `raw()` | `%s` | `Model.objects.raw("... WHERE id = %s", [uid])` |

   Check: `python -c "import <driver>; print(<driver>.paramstyle)"` prints the DB-API paramstyle for DB-API drivers.

### Output
Fix list with driver and placeholder per item; `bandit_before`.

### Quality Gate
- `bandit_before` recorded from a real run.
- Every fix item names its driver and placeholder style.

---

## Phase 2: Rewrite Each Query

### Entry Criteria
- Fix list exists.

### Actions
1. Apply the rule for what the user value represents:

| User value is | Correct fix | Never |
|---|---|---|
| A value (id, name, date) | bound parameter from the table above | quoting it yourself, `replace("'", "''")` |
| A list for `IN` | psycopg: `WHERE id = ANY(%s)` with a Python list; SQLAlchemy: `bindparam("ids", expanding=True)` and `WHERE id IN :ids`; sqlite3: build `",".join("?" * len(ids))` placeholders and pass the list | joining values into the string |
| A `LIKE` search term | escape `%`, `_` and `\` in the value, then bind: `"... WHERE name LIKE %s ESCAPE '\\'"`, value `f"%{escaped}%"` | putting `%` wildcards from the user unescaped (lets one term scan the whole table) |
| A column or table name | allowlist dict mapping user keys to fixed identifiers: `SORT = {"date": "created_at", "total": "amount_cents"}`; `col = SORT[key]` (KeyError becomes 400) | binding an identifier (drivers bind values only) or f-string |
| A sort direction | `"ASC" if d == "asc" else "DESC"` | f-string of `d` |
| psycopg identifier that cannot be allowlisted | `sql.SQL("SELECT * FROM {}").format(sql.Identifier(name))` | `%s` for identifiers |
| Django ORM `.extra(where=...)` or `RawSQL` | move to ORM filters, or pass `params=[...]` | string building |

2. Pass parameters as the second argument to `execute`. The classic mistake `cur.execute("... = %s" % uid)` uses Python formatting and is still injectable; the `%` must not appear between the string and the tuple.
3. Fix one file at a time. After each file, run its existing tests.
4. Do NOT wrap the query in a try/except that hides database errors; injection probes rely on error differences and so do your tests.

### Output
Rewritten queries.

### Quality Gate
- `bandit -r <src_dir> -t B608` shows a lower count than `bandit_before`; every remaining hit is listed with the reason it is safe (for example an allowlisted identifier), recorded as `bandit_after`.
- `rg -n "execute\(\s*f[\"']|execute\(.*\"\s*%\s" --type py <src_dir>` prints nothing.

---

## Phase 3: Injection Regression Tests

### Entry Criteria
- Queries rewritten.

### Actions
1. For each fixed query write a test against a real test database (the repo's existing fixture, or `sqlite3.connect(":memory:")` when the query is portable). Do not mock the cursor; a mock cannot show injection.

```python
import pytest

PAYLOADS = ["' OR '1'='1", "1; DROP TABLE orders;--", "x' UNION SELECT password FROM users--", "%", "_"]

@pytest.mark.parametrize("p", PAYLOADS)
def test_status_filter_is_not_injectable(db, p):
    db.execute("INSERT INTO orders (id, status) VALUES (1, 'open')")
    rows = list_orders(db, status=p)          # the fixed function
    assert rows == []                         # payload treated as a literal value
    assert db.execute("SELECT count(*) FROM orders").fetchone()[0] == 1   # table intact
```

2. For allowlisted identifiers, assert that an unknown sort key raises the error your handler maps to 400.
3. Run `python -m pytest <test_file> -q`, record the summary.
4. Mutation check: restore the old f-string version of one query in a scratch branch, run the test, confirm `' OR '1'='1` returns rows (test fails), then discard the change.

### Output
`py_sql_fixes`.

### Quality Gate
- pytest summary shows 0 failed.
- Mutation run shows the payload test failing; after discarding, 0 failed.

---

## Worked Example

Illustrative. `sink_map` row: `shop/repo.py:52 cur.execute(f"SELECT * FROM orders WHERE status = '{status}' ORDER BY {sort}")`, driver psycopg 3.

Phase 1: `bandit -r shop -t B608` reports `Total issues (by severity): Medium: 3`.

Phase 2 after:
```python
SORT = {"date": "created_at", "total": "amount_cents"}
cur.execute(
    sql.SQL("SELECT * FROM orders WHERE status = %s ORDER BY {}").format(sql.Identifier(SORT[sort])),
    (status,),
)
```
Phase 3: `5 passed`. Mutation: `FAILED test_status_filter_is_not_injectable[' OR '1'='1]`.

---

## Exit Criteria

DONE when every Python SQL sink binds values through the driver, identifiers come from an allowlist or `sql.Identifier`, B608 count is reduced with every remainder justified, and injection tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Bandit not installable (locked environment) | **Adjust**: use `semgrep scan --config p/python` and record which tool produced the counts. |
| Phase 2 | Query text itself is assembled across several functions | **Adjust**: move assembly into one function returning `(sql, params)`; test that function. |
| Phase 2 | Stored procedure builds dynamic SQL inside the database | **Return**: the injection is in the procedure (`EXECUTE` with concatenation); report it with the procedure name; binding in Python does not fix it. |
| Phase 3 | No test database available | **Stop**: an injection fix without a real query run is unproven. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
