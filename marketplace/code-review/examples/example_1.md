# Code Review -- Reviewing a Database Query Handler

## Scenario

A teammate submits a PR adding a user search endpoint. You review it systematically.

## The Code Under Review

```python
@app.get("/users/search")
def search_users(query: str, db: Session = Depends(get_db)):
    users = db.execute(f"SELECT * FROM users WHERE name LIKE '%{query}%'").fetchall()
    results = []
    for user in users:
        orders = db.execute(f"SELECT * FROM orders WHERE user_id = {user.id}").fetchall()
        results.append({"user": user, "order_count": len(orders)})
    return results
```

## Review Using the Checklist

### 1. Security -- BLOCKING
```
SQL INJECTION: The `query` parameter is interpolated directly into SQL.
An attacker can send: `query='; DROP TABLE users; --`

Fix: Use parameterized queries.
```
```python
# Before (vulnerable)
db.execute(f"SELECT * FROM users WHERE name LIKE '%{query}%'")

# After (safe)
db.execute(
    text("SELECT * FROM users WHERE name LIKE :pattern"),
    {"pattern": f"%{query}%"}
)
```

### 2. Performance -- REQUEST CHANGES
```
N+1 QUERY: For each user, a separate query fetches orders.
100 users = 101 queries. 1000 users = 1001 queries.

Fix: Use a JOIN or subquery.
```
```python
# Single query with COUNT
result = db.execute(text("""
    SELECT u.*, COUNT(o.id) as order_count
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    WHERE u.name LIKE :pattern
    GROUP BY u.id
"""), {"pattern": f"%{query}%"})
```

### 3. Correctness -- REQUEST CHANGES
```
MISSING PAGINATION: SELECT * with no LIMIT returns unbounded results.
A search matching 100K users will OOM the server.

Fix: Add LIMIT/OFFSET or cursor pagination.
```

### 4. Readability -- COMMENT
```
Consider: SELECT * pulls all columns including potentially sensitive data
(password_hash, email, SSN). Explicitly list the columns you need.
```

## Review Comment (How to Deliver)

> Hey! Good progress on the search endpoint. A few things to address:
>
> **Must fix before merge:**
> - SQL injection vulnerability in the query parameter (see suggestion above)
> - N+1 query pattern will cause performance issues at scale
>
> **Should fix:**
> - Add pagination (LIMIT/OFFSET) to prevent unbounded result sets
> - Use explicit column names instead of SELECT *
>
> Nice work on the endpoint structure and the Depends injection pattern.

Notice: specific, actionable, kind. Praise what works. Explain WHY each issue matters.
