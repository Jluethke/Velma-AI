# Python Cache-Aside With redis-py

**One-line description:** Adds a cache-aside read path and an after-commit invalidation to one Python hotspot using redis-py, with explicit socket timeouts, fail-open on Redis errors, JSON serialization with a schema version, and pytest tests run against fakeredis and then a real Redis container.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the Python repository.
- `key_schema` (object[], required): Key templates from `cache-key-schema-design`.
- `ttl_table` (object[], required): TTL and jitter per entry type from `cache-ttl-from-change-rate`.
- `invalidation_plan` (object[], required): Strategy and writer list from `cache-invalidation-strategy-select`.

---

## Outputs

- `cache_aside_change` (object): Files changed, the read function wrapped, the writers hooked, the test command and its pass output, and the redis-py version installed.

---

## Phase 1: Prepare Client and Tests

### Entry Criteria
- `invalidation_plan` row for this entry type is `cache-aside`, `write-through` or `event-based`.
- The repo's tests run green before any change: run `pytest -q` and record the last line.

### Actions
1. Confirm the library: `pip show redis` (the package is `redis`, import name `redis`). If missing, add `redis` to the dependency file the repo uses (`pyproject.toml`, `requirements.txt`) and install it. Add `fakeredis` to test dependencies.
2. Create one client module, for example `app/cache/client.py`, that builds a single shared client:
   `redis.Redis.from_url(os.environ["REDIS_URL"], socket_connect_timeout=CONNECT_TIMEOUT, socket_timeout=OP_TIMEOUT)`.
   The two timeouts are user inputs (seconds). Without `socket_timeout`, a hung Redis blocks the request until the OS gives up. Do not create a client per request; redis-py pools connections inside one client.
3. Write the failing tests first in `tests/test_<entity>_cache.py` using `fakeredis.FakeRedis()` injected in place of the real client:
   - second call does not hit the database (count calls on a fake repository);
   - after the writer commits, the next read returns the new value;
   - when the client raises `redis.exceptions.ConnectionError`, the read still returns the database value.
4. Run `pytest tests/test_<entity>_cache.py -q`. The tests must FAIL now. If they pass, they are not testing the new code; fix the tests.

### Output
Client module and failing tests.

### Quality Gate
- `pytest tests/test_<entity>_cache.py -q` exits non-zero with assertion failures (not import errors).
- `pip show redis` prints a version.

---

## Phase 2: Implement the Read Path

### Entry Criteria
- Failing tests exist.

### Actions
1. Edit only the function at the hotspot's code location. Pattern:

   ```python
   def get_product(product_id: int) -> dict:
       key = keys.product(product_id)            # from the key builder module
       try:
           raw = cache.get(key)
       except redis.exceptions.RedisError:
           raw = None                            # fail open: serve from DB
       if raw is not None:
           return json.loads(raw)
       value = repo.load_product(product_id)
       try:
           cache.set(key, json.dumps(value, separators=(",", ":")), ex=ttl_with_jitter(PRODUCT_TTL, PRODUCT_JITTER))
       except redis.exceptions.RedisError:
           pass
       return value
   ```
2. `ex=` is seconds, `px=` is milliseconds. Do not use both.
3. Use JSON, not `pickle`. Unpickling bytes from a shared cache executes code if the cache is ever written by an attacker, and pickles break across class renames.
4. If `repo.load_product` returns `None` for a missing row, do not `json.dumps(None)` into the cache yet; leave that to `cache-negative-result-caching`. Return without caching.
5. Run the tests. The read tests must pass now.

### Output
Read path implemented.

### Quality Gate
- `pytest tests/test_<entity>_cache.py -q -k read` exits 0.
- `git diff --stat` shows changes in the hotspot file and the client module only.

---

## Phase 3: Hook the Writers

### Entry Criteria
- Read path tests pass.

### Actions
1. For each in-service writer in `invalidation_plan`, add the invalidation after commit. One writer per edit; run the tests after each.
   - Django: `transaction.on_commit(lambda: safe_delete(keys.product(p.id)))`.
   - SQLAlchemy: register `@event.listens_for(Session, "after_commit")` and delete keys collected in `session.info` during the transaction.
   - Plain DB-API: call `safe_delete` on the line after `conn.commit()`.
   `safe_delete` wraps `cache.delete(key)` in `try/except redis.exceptions.RedisError` and logs the failure with the key. A failed delete leaves stale data until TTL; the log line lets you count it.
2. For `write-through` rows, set the committed value instead of deleting, reading it back from the database after commit.
3. Run the full suite: `pytest -q`. Then run the cache tests once against a real Redis: `docker run --rm -d -p 6379:6379 --name cache-test redis:7` and `REDIS_URL=redis://localhost:6379/0 pytest tests/test_<entity>_cache.py -q`, then `docker stop cache-test`. fakeredis covers command semantics but not timeouts or network errors.

### Output
`cache_aside_change`.

### Quality Gate
- `pytest -q` exits 0 and the pass count is at least the count recorded in Phase 1 entry plus the new tests.
- The real-Redis run exits 0.
- `redis-cli -p 6379 TTL <example key>` during the real run returns a positive number (the key has an expiry). A result of -1 means no TTL was set.

---

## Worked Example

Illustrative. Django app, entry `product`, TTL 300 s, J 30 s.

Phase 1: `pytest -q` baseline `212 passed`. New tests fail: `AssertionError: assert 2 == 1` (database called twice).

Phase 2: edit `catalog/repo.py`. `pytest tests/test_product_cache.py -q -k read` prints `2 passed`.

Phase 3: `catalog/admin.py:88` gains `transaction.on_commit(lambda: safe_delete(keys.product(obj.id)))`. `pytest -q` prints `215 passed`. Against real Redis, `redis-cli TTL shop:product:v3:42` prints `(integer) 284`.

---

## Exit Criteria

DONE when the hotspot reads through Redis, every in-service writer invalidates after commit, Redis errors fall back to the database, and both fakeredis and real-Redis test runs pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Suite is red before any change | **Stop**: report the failing tests; do not start on a red baseline. |
| Phase 1 | New tests pass before implementation | **Adjust**: the tests are not exercising the cache path; inject the fake client properly. |
| Phase 2 | `TypeError: Object of type datetime is not JSON serializable` | **Adjust**: convert to ISO strings in one serializer function; do not switch to pickle. |
| Phase 3 | Existing test fails after hooking a writer | **Retry**: revert that one writer edit, read the failure, fix; never delete or skip the failing test. |
| Phase 3 | Docker not available | **Return**: report the real-Redis run as not executed; do not claim it passed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
