# Cache Key Schema Design

**One-line description:** Designs cache keys for every planned cache entry with a fixed namespace grammar, tenant and locale scoping, a schema version segment, canonical hashing of long parameter sets, backend key limits, and Redis Cluster hash tags, then proves two different inputs never share a key.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cache_plan` (object[], required): Locations per hotspot from `cache-location-decide`.
- `repo_path` (string, required): Path to the application repository.

---

## Outputs

- `key_schema` (object[]): One row per cached entry type: key template, every segment and its source variable, hashing rule, version segment, namespace generation key (if used), Redis Cluster hash tag (if used), example key, and maximum example key length in bytes.

---

## Phase 1: List Every Input That Changes the Result

### Entry Criteria
- `cache_plan` has at least one row whose location is not "no cache".

### Actions
1. Open the function at each hotspot's code location. List every value the result depends on: function arguments, and also hidden inputs read inside it: current user, tenant, locale, feature flags, request headers, the current date, and configuration values.
2. For each hidden input, decide with this rule: if changing it can change the returned bytes, it goes in the key. If you are unsure, put it in the key. A missing segment serves one user's or tenant's data to another; an extra segment only lowers the hit ratio.
3. Do not include values that are unique per request (request id, timestamp to the millisecond, trace id). They make every key unique and the hit ratio zero.

### Output
A list of key-relevant inputs per entry type, each with the code line where it is read.

### Quality Gate
- Every hidden input found by reading the function body is listed with a file and line.
- No per-request unique value appears in the list.

---

## Phase 2: Write the Key Template

### Entry Criteria
- Input lists exist.

### Actions
1. Use this grammar for every key, segments separated by `:`:
   `<service>:<entity>:v<schema_version>:<scope>:<identifier>`
   - `<service>` stops two services sharing one Redis from colliding.
   - `<entity>` names the data, for example `product`, `category-counts`.
   - `v<schema_version>` is an integer you bump whenever the cached value's shape changes. A deploy that changes the shape then reads new keys and never parses an old-shaped value. Old keys expire through their TTL.
   - `<scope>` is `t<tenant_id>` and/or `l<locale>` when those are inputs, otherwise omitted.
   - `<identifier>` is the primary key, or the hash from Action 2.
2. When the inputs are a set of filters or more than one or two scalar values, build the identifier by hashing a canonical form: serialize the parameters as JSON with sorted keys and no whitespace, then SHA-256, then hex. Python: `hashlib.sha256(json.dumps(p, sort_keys=True, separators=(",", ":")).encode()).hexdigest()`. Node: build the object with sorted keys, then `crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex')`. Normalize first: lowercase case-insensitive values, sort list values whose order does not matter, drop parameters equal to their default.
3. Check backend limits:
   - Memcached: key at most 250 bytes, no spaces or control characters (Memcached protocol.txt). Hash any free-text segment.
   - Redis: keys are binary safe and can be large, but every byte is stored and sent per command; keep the template short and hash free text.
4. Redis Cluster only: if one operation must touch several keys (MGET, a Lua script, MULTI), wrap the shared part in a hash tag so they land in one slot, for example `shop:cart:v1:{u42}:items` and `shop:cart:v1:{u42}:total`. Only the text inside the first `{...}` is hashed. Do not put a low-cardinality value (like a tenant with most traffic) inside the braces, or one slot gets most of the load.
5. Namespace invalidation (optional): if a whole group of keys must be invalidated at once (for example all of one tenant's product lists), add a generation number: store `shop:gen:t<tenant>` as an integer, read it first, and put `g<gen>` in the key. Invalidate with `INCR shop:gen:t<tenant>`. Never invalidate by pattern with `KEYS`; it is O(N) and blocks the Redis server. If a pattern sweep is ever needed, use `SCAN` with `MATCH` and `COUNT`.

### Output
Draft `key_schema` rows.

### Quality Gate
- Every row's template contains a `v<n>` segment and a `<service>` prefix.
- Every example key is under 250 bytes when the backend is Memcached (`printf '%s' "$KEY" | wc -c`).

---

## Phase 3: Prove Keys Do Not Collide

### Entry Criteria
- Draft `key_schema` exists.

### Actions
1. Write one unit test per key builder function. Put key builders in one module (for example `cache_keys.py` or `cacheKeys.ts`) so tests and callers use the same code; do not format keys inline at call sites.
2. The test must assert: two inputs that differ in each listed segment produce different keys; two inputs that differ only in parameter order or default values produce the same key; a tenant A key never equals a tenant B key for the same id.
3. Run the test command for the repo (for example `pytest tests/test_cache_keys.py -q`, `npx vitest run cacheKeys`, `go test ./internal/cache -run TestKey`). Copy the pass line.
4. Do not mark this phase done by reading the test. It must have run and passed.

### Output
`key_schema`, with key builder module path and test command.

### Quality Gate
- The key builder test command exits 0 and its output is recorded.
- `grep -rn "f\"[a-z]*:" <repo_path>` (or the equivalent template-literal search) finds no key formatted outside the key builder module.

---

## Worked Example

Illustrative. Hotspots: product by id (public), product search with filters (per tenant).

Phase 1: `search_products(filters)` reads `request.tenant_id` (line 18) and `get_locale()` (line 22). Both go into the key.

Phase 2:
- `shop:product:v3:42`
- `shop:psearch:v1:t7:len:9f2c...` built from `{"brand":"acme","color":["blue","red"],"in_stock":true}` after sorting `color`.

Phase 3: `pytest tests/test_cache_keys.py -q` prints `6 passed in 0.04s`, including the case where `{"color":["red","blue"]}` and `{"color":["blue","red"]}` give the same key and tenant 7 and tenant 8 give different keys.

---

## Exit Criteria

DONE when every cached entry type has a versioned, namespaced template in one key builder module, and the collision tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Function reads global state you cannot trace | **Stop**: do not cache it until the hidden input is found; a wrong key leaks data. |
| Phase 2 | Key exceeds 250 bytes on Memcached | **Adjust**: replace the long segment with its SHA-256 hex. |
| Phase 3 | Collision test fails | **Adjust**: add the missing segment to the template; never change the test to expect equal keys for different data. |
| Phase 3 | Key formatted inline somewhere | **Adjust**: replace the inline format with a call to the key builder, one file per edit, running tests after each. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
