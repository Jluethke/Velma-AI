# RAG Answer Cache in Redis

**One-line description:** Caches final RAG answers in Redis under a key built from the normalized question, the caller's access filters, the index version, the prompt version and the generator settings, with a TTL, so a cached answer is never served across tenants or after the corpus or prompt changes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `prompt_template` (string, required): Path to `work_dir/prompt/`; its content hash is the prompt version.
- `redis_url` (string, required): For example `redis://localhost:6379/0`, or `rediss://` for TLS.
- `cache_ttl_seconds` (integer, required): How long an answer may be served. A user decision tied to how often the corpus changes.
- `work_dir` (string, required): Build folder; writes `work_dir/cache/answer_cache.py` and tests.

---

## Outputs

- `answer_cache` (object): Key recipe, TTL, module path, the version fields included, and the invalidation rule.
- `cache_test_report` (string): Path to `work_dir/cache/answer_cache_tests.json` with test results and measured hit rate and latency on a replay of dev questions.

---

## Phase 1: Key Design

### Entry Criteria
- `redis-cli -u $REDIS_URL PING` returns `PONG`.

### Actions
1. Normalize the question: Unicode NFKC, lowercase, collapse whitespace, strip trailing punctuation. Only these steps; do not remove words or stem, because "can I" and "can't I" must stay different.
2. Build the key from a canonical JSON object with sorted keys:
   `{"q": <normalized question>, "filters": <access and metadata filters, sorted>, "index_version": <id of the current index build>, "prompt_version": <sha256 of the template files>, "generator": <model id>, "gen_params": <temperature, max tokens>}`
   Key = `"rag:ans:" + sha256(json.dumps(obj, sort_keys=True, separators=(",", ":"))).hexdigest()`.
3. The `filters` field must include every access-control value from the authenticated caller. Leaving it out serves one tenant's answer to another.
4. `index_version` changes on every re-index (for example the build timestamp or the hash of the chunk file). Changing it makes old entries unreachable; the TTL then evicts them. This avoids pattern deletes (`KEYS rag:*`), which block Redis on large keyspaces.
5. Semantic caching (serving an answer for a similar but different question by embedding similarity) is out of scope here; it can return a wrong answer for a question that differs in one critical word, and needs its own labeled evaluation before use.

### Output
`make_key()` function.

### Quality Gate
- `pytest`: same question with different `filters` gives different keys; same question with different whitespace and case gives the same key; changing `index_version` changes the key.

---

## Phase 2: Read-Through Cache

### Entry Criteria
- Key tests pass.

### Actions
1. `pip install redis`. `r = redis.Redis.from_url(redis_url)`.
2. Lookup: `cached = r.get(key)`. On hit, return it with a `cached: true` flag for logs.
3. On miss: run the pipeline. Cache only answers that passed `validate_citations.py` with zero invalid ids. Never cache errors, timeouts or `NOT_FOUND` caused by a retrieval outage.
4. Store with `r.set(key, json.dumps(answer), ex=cache_ttl_seconds, nx=True)`. `nx=True` keeps the first writer when two requests race.
5. Value contents: answer text, cited `chunk_id`s, `index_version`, and creation time. Store no prompt text with secrets and no user identity beyond what the filter already encodes.
6. If Redis is unreachable, log and serve from the pipeline; the cache must never be required for an answer.

### Output
`answer_cache.py`.

### Quality Gate
- `pytest` with a test Redis (local container `docker run -p 6379:6379 redis`): hit after miss; `r.ttl(key)` is greater than 0 and at most `cache_ttl_seconds`; an answer with invalid citations is not stored; Redis stopped gives a pipeline answer, not an exception.

---

## Phase 3: Replay Measurement

### Entry Criteria
- Tests pass.

### Actions
1. Replay dev questions twice, plus the real query log if available. Record hit rate and p50/p95 latency for hits and misses.
2. Bump `index_version` and replay once; hit rate on the first pass must be 0.
3. Check memory: `redis-cli -u $REDIS_URL INFO memory` (`used_memory_human`) and confirm `maxmemory-policy` (`CONFIG GET maxmemory-policy`) is a policy that evicts keys with a TTL or all keys, as the operator chooses; with `noeviction` and a full memory, writes fail.

### Output
`answer_cache`, `cache_test_report`.

### Quality Gate
- `answer_cache_tests.json` shows second-pass hit rate, latency for hits and misses, and 0 hits after the version bump.

---

## Worked Example

Illustrative. TTL 86,400 s (user), 136 dev questions.

```
pass 1: hits 0/136   miss p50 2,140 ms
pass 2: hits 129/136 hit p50 1.2 ms   (7 not cached: 4 invalid citations, 3 NOT_FOUND on outage test)
index_version bump: hits 0/136
redis INFO memory: used_memory_human:3.10M  maxmemory-policy: volatile-lru
```

---

## Exit Criteria

DONE when keys include filters, index, prompt and generator versions, tests prove tenant separation and invalidation, and the replay reports hit rate and latency.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No stable index version available | **Return**: add a build id to the index flow output before enabling the cache. |
| Phase 2 | Cache served a different tenant's answer in tests | **Stop**: the filter is missing from the key; fix and rerun all tests. |
| Phase 3 | Writes fail with OOM error | **Adjust**: set a `maxmemory-policy` that evicts, or lower the TTL, with the operator's approval. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
