# Cache Location Decide

**One-line description:** Chooses where each hotspot is cached (in-process memory, a shared Redis or Memcached tier, an HTTP private cache, or a CDN shared cache) with a decision table driven by deployment topology, data visibility and the consistency requirement, and picks the shared backend.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `read_hotspots` (object[], required): Ranked hotspots from `cache-read-hotspot-measure`.
- `deployment_topology` (string, required): How the app runs: number of hosts or pods, worker processes per host (for example Gunicorn workers, Node cluster workers), whether a CDN or reverse proxy sits in front, and whether Redis or Memcached already exists.
- `consistency_requirement` (string, required): Per hotspot, one of `read-your-writes` (a user who writes must see the write on the next read), `bounded-staleness` (stale up to a stated time is acceptable), or `eventual`.

---

## Outputs

- `cache_plan` (object[]): One row per hotspot: chosen location (`in-process`, `shared`, `http-private`, `cdn`, or a two-tier pair such as `in-process+shared`), the decision table row that selected it, data visibility (`public` or `per-user`), and the flags `has_in_process`, `has_http_layer`.
- `cache_backend` (string): `redis`, `memcached` or `none`, for the shared tier.

---

## Phase 1: Classify Each Hotspot

### Entry Criteria
- `read_hotspots` is non-empty.
- `consistency_requirement` gives a value for every hotspot.

### Actions
1. For each hotspot, open the code location from `read_hotspots` and answer these four questions with yes or no. Write the answer and the line of code that proves it.
   - Q1 Is the result the same for every caller (no user id, tenant id, permission or locale in the inputs)? yes = `public`, no = `per-user`.
   - Q2 Is it served directly as an HTTP GET response body (not an internal call whose result is combined with other data)?
   - Q3 Is the serialized result small enough to copy per process? Measure one: serialize a real result and print its byte length (`len(json.dumps(x).encode())` in Python, `Buffer.byteLength(JSON.stringify(x))` in Node).
   - Q4 Do writes to the underlying data happen in this service?
2. Count processes that would each hold a separate in-process copy: hosts times workers per host, from `deployment_topology`.

### Output
A classification row per hotspot with Q1 to Q4 answers and the process count.

### Quality Gate
- Every answer cites a file and line or a measured byte count.
- Process count is a number taken from `deployment_topology`, not assumed.

---

## Phase 2: Apply the Decision Table

### Entry Criteria
- Classification rows exist.

### Actions
1. Walk this table top to bottom for each hotspot and take the FIRST row that matches. Record the row number.

   | Row | Condition | Location |
   |---|---|---|
   | 1 | Response contains secrets or regulated personal data that must not be stored at rest | no cache; record why |
   | 2 | Q2 yes and Q1 yes (public GET) and a CDN or reverse proxy exists | `cdn`, plus `shared` behind it if the origin miss is still expensive |
   | 3 | Q2 yes and Q1 no (per-user GET) | `http-private` (browser cache with `Cache-Control: private`), plus `shared` for the origin work |
   | 4 | `read-your-writes` and process count is greater than 1 | `shared` only; in-process copies on other processes would serve the old value |
   | 5 | Process count is 1, Q3 yes | `in-process` |
   | 6 | `bounded-staleness` or `eventual`, Q3 yes, and the network round trip to the shared cache is a large share of the hotspot's latency | `in-process+shared` (short in-process TTL in front of the shared tier) |
   | 7 | Anything else | `shared` |

2. Do not choose `in-process` for `read-your-writes` data in a multi-process deployment unless an invalidation broadcast is also planned (see `cache-event-invalidation-pubsub`). Write that dependency into the row.
3. Set `has_in_process` = true if any row contains `in-process`. Set `has_http_layer` = true if any row contains `cdn` or `http-private`.

### Output
Draft `cache_plan`.

### Quality Gate
- Every hotspot has exactly one table row number recorded.
- No `per-user` hotspot has location `cdn`.

---

## Phase 3: Pick the Shared Backend

### Entry Criteria
- At least one row uses `shared`, otherwise set `cache_backend` = `none` and finish.

### Actions
1. Use this table. Take the first matching row.

   | Row | Condition | Backend |
   |---|---|---|
   | 1 | Redis or Memcached already runs in this environment and meets every need below | the existing one |
   | 2 | You need atomic set-if-absent locks (`SET NX PX`), Lua scripts, pub/sub, streams, sorted sets, or persistence | `redis` |
   | 3 | Only get, set and delete of opaque blobs, each under the Memcached item size limit (`-I`, default 1 MB) | `memcached` or `redis`; pick the one the team already operates |
   | 4 | Anything else | `redis` |

2. Note: the stampede lock flow (`cache-stampede-redis-lock`) and the stream based invalidation in `cache-event-invalidation-pubsub` need Redis features. If either is planned, row 2 applies.
3. Write the final `cache_plan` and `cache_backend`.

### Output
`cache_plan`, `cache_backend`.

### Quality Gate
- `cache_backend` is one of `redis`, `memcached`, `none`.
- If `cache_backend` is `memcached`, no row depends on a Redis-only feature.

---

## Worked Example

Illustrative. `deployment_topology`: 6 Kubernetes pods, 4 Gunicorn workers each, Cloudflare in front, Redis 7 already used for sessions.

Phase 1: `GET /products/42`: Q1 yes (no user input in `repo.py:41`), Q2 yes, Q3 yes (1,184 bytes), Q4 yes. `cart_summary(user_id)`: Q1 no, Q2 no. Process count = 6 x 4 = 24.

Phase 2: products hit row 2: `cdn` + `shared`. `cart_summary` is `read-your-writes` with 24 processes: row 4, `shared`. `has_in_process` = false, `has_http_layer` = true.

Phase 3: row 1 applies (Redis 7 exists and supports `SET NX PX`), `cache_backend` = `redis`.

---

## Exit Criteria

DONE when every hotspot has a location chosen by a numbered table row and `cache_backend` is set.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Cannot tell if the result depends on the caller | **Stop**: treat it as `per-user` until the code proves otherwise; caching per-user data as public leaks data between users. |
| Phase 1 | `consistency_requirement` missing for a hotspot | **Return**: ask the user; do not default it. |
| Phase 2 | Two rows seem to match | **Adjust**: take the first matching row in table order. |
| Phase 3 | Team cannot operate a new Redis or Memcached | **Adjust**: restrict to `in-process` for bounded-staleness rows and `cdn`/`http-private` rows; mark `read-your-writes` rows as uncached. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
