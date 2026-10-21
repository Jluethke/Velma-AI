# Resilience Dependency Map With Criticality

**One-line description:** Builds a complete inventory of every outbound dependency a service calls (HTTP, gRPC, database, cache, queue, object store), with the call sites, client library, current timeout and retry settings, and a criticality class decided by an explicit table, so every later resilience control has a named target.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Absolute path to the service's source repository.
- `stack` (string, required): One of `python`, `node`, `go`, `java`. Selects the search patterns below.
- `trace_source` (string, optional): Base URL of a Jaeger query service or a Prometheus that receives Tempo service-graph metrics. Used to confirm the code inventory against real traffic.

---

## Outputs

- `dependency_map` (object[]): One row per dependency: `name`, `kind` (http, grpc, sql, cache, queue, object_store, other), `config_key` (env var or config key holding its address), `client_library` and version, `call_sites` (file:line list), `mode` (sync or async), `operations` with `idempotent` true/false per operation, `current_timeout` (value with file:line, or "none found"), `current_retries` (value with file:line, or "none found"), `callers` (inbound endpoints that reach it), `criticality` (critical, degradable, non_critical), `criticality_reason`.

---

## Phase 1: Inventory Outbound Calls From Code

### Entry Criteria
- `service_repo` exists and `stack` is one of the four values.
- `rg` (ripgrep) is installed: `rg --version` prints a version.

### Actions
1. Run the search for your `stack` from the repository root and save the output to a scratch file outside the repository:
   - python: `rg -n "requests\.(get|post|put|patch|delete|request|Session)|httpx\.(Client|AsyncClient|get|post)|aiohttp\.ClientSession|grpc\.(insecure_channel|secure_channel|aio\.)|psycopg|asyncpg|create_engine\(|redis\.(Redis|from_url)|boto3\.(client|resource)|KafkaProducer|KafkaConsumer|pika\." --type py`
   - node: `rg -n "fetch\(|axios|got\(|undici|new Pool\(|new Client\(|createClient\(|new Redis\(|@grpc/grpc-js|mongoose\.connect|kafkajs|@aws-sdk/" --type js --type ts`
   - go: `rg -n "http\.(Get|Post|NewRequest|NewRequestWithContext|Client\{|DefaultClient)|grpc\.(Dial|DialContext|NewClient)|sql\.Open|pgxpool\.|pgx\.Connect|redis\.NewClient|kafka\.|aws-sdk-go" --type go`
   - java: `rg -n "HttpClient|RestTemplate|WebClient|RestClient|OkHttpClient|@FeignClient|ManagedChannelBuilder|DataSource|JdbcTemplate|KafkaTemplate|RedisTemplate|Jedis|LettuceConnectionFactory|S3Client" --type java --type kotlin`
2. Run the config search for addresses: `rg -n "(_URL|_HOST|_DSN|_ENDPOINT|_ADDR|_URI)\b" -g "*.env*" -g "*.yaml" -g "*.yml" -g "*.properties" -g "*.toml" -g "*.json"`.
3. Group hits into dependencies: one dependency is one remote system (one host or one cluster), not one call site. Two clients pointing at the same `config_key` are one dependency.
4. For each dependency record `client_library` and its pinned version from the lock file (`poetry.lock`, `requirements.txt`, `package-lock.json`, `go.sum`, `pom.xml` or `build.gradle`).
5. Open every call site and record `mode`: sync if the inbound request waits for the result, async if it is sent to a queue, a background task, or after the response is written.
6. For each operation record `idempotent`: true for HTTP GET, HEAD, PUT, DELETE, OPTIONS (RFC 9110 section 9.2.2) and for reads; false for POST and PATCH unless the call sends an idempotency key the dependency documents; false for SQL writes outside a single transaction with a unique constraint.
7. Do NOT guess a call site from a function name. Every `call_sites` entry must be a file:line you opened.

### Output
Draft `dependency_map` rows with call sites, library, mode, and idempotency.

### Quality Gate
- Every hit from steps 1 and 2 is either assigned to a dependency row or listed as excluded with a reason (test file, dead code confirmed by `rg` showing no caller).
- Every row has a `client_library` version copied from a lock file.

---

## Phase 2: Record Current Timeouts and Retries

### Entry Criteria
- Draft rows exist.

### Actions
1. For each row, search the client construction for timeout settings with the pattern for the library: `timeout=`, `connect_timeout`, `read_timeout`, `Timeout:`, `context.WithTimeout`, `AbortSignal.timeout`, `connectTimeout`, `readTimeout`, `statement_timeout`, `socket_timeout`, `withDeadlineAfter`.
2. Record the value and file:line in `current_timeout`. If no setting exists, write "none found" and the library default from its documentation, for example: `requests` has no default timeout (waits indefinitely); Go `http.DefaultClient` has `Timeout` 0 (no limit); `axios` `timeout` default 0 (none); `httpx` default 5 seconds.
3. Search for retry settings: `Retry(`, `tenacity`, `@retry`, `backoff`, `p-retry`, `cockatiel`, `retries`, `max_attempts`, `@Retry`, `RetryConfig`, `retry_on`, and record them in `current_retries` the same way.
4. Note every place where two layers both retry the same call (for example an SDK with built-in retries plus an application loop). Mark the row `retry_layers: 2` or more.

### Output
Rows with `current_timeout` and `current_retries`.

### Quality Gate
- No row has an empty `current_timeout` or `current_retries`; each holds a value with file:line or "none found" plus the documented default.
- Every "none found" for a sync dependency is listed for the timeout flows.

---

## Phase 3: Confirm Against Traffic and Classify Criticality

### Entry Criteria
- Rows with settings exist.

### Actions
1. If `trace_source` is a Jaeger query URL, fetch edges: `curl -s "<trace_source>/api/dependencies?endTs=$(date +%s000)&lookback=604800000"` and list each `parent`/`child`/`callCount` where `parent` is this service. If it is a Prometheus with Tempo service graphs, query `sum by (server) (rate(traces_service_graph_request_total{client="<service>"}[1h]))`.
2. Compare: any traced child with no code row is a missing dependency (often an SDK or a sidecar call). Add it. Any code row with no traced edge stays, marked `seen_in_traces: false`.
3. For each row, list `callers`: the inbound routes whose handler reaches a call site (follow the call graph by opening files; do not guess).
4. Assign `criticality` with this table, first match wins:

| Condition (check in code at the call site) | criticality |
|---|---|
| `mode` is async, or the call happens after the response is sent | non_critical |
| An error from the call is caught and the handler still returns a success response with reduced content | degradable |
| An error from the call propagates to the inbound response as an error | critical |

5. Write the exact code line that decided the class into `criticality_reason`.
6. Do NOT mark a dependency degradable because it "could" have a fallback. Classify what the code does today; fallbacks are added later by `res-graceful-degradation`.

### Output
Final `dependency_map`.

### Quality Gate
- Every row has `criticality` and a `criticality_reason` that cites a file:line.
- If `trace_source` was given, every traced child of this service appears in `dependency_map`.

---

## Worked Example

Illustrative. Input: `service_repo` = `/srv/checkout`, `stack` = `python`, `trace_source` = `http://jaeger-query:16686`.

Phase 1, `rg` finds `httpx.AsyncClient(base_url=settings.PAYMENTS_URL)` in `checkout/clients/payments.py:14`, `redis.from_url(settings.REDIS_URL)` in `checkout/cache.py:8`, `create_engine(settings.DATABASE_URL)` in `checkout/db.py:5`, and `boto3.client("sqs")` in `checkout/events.py:11`.

Phase 2 records:
```
payments  httpx 0.27.0   timeout: none found (httpx default 5s)  retries: none found
redis     redis 5.0.4    socket_timeout: none found (redis-py default None)
postgres  SQLAlchemy 2.0.30  pool_timeout default 30; statement_timeout none found
sqs       boto3 1.34.x   retries: botocore legacy mode default, plus app loop events.py:30 -> retry_layers: 2
```

Phase 3, Jaeger returns `{"parent":"checkout","child":"fraud-score","callCount":91234}`; no code row matched because the call goes through `payments`'s SDK helper `clients/fraud.py:22`. Added. Classification: `payments` critical (`api/orders.py:57` re-raises), `redis` degradable (`cache.py:31` catches `RedisError` and reads the DB), `sqs` non_critical (published in a background task, `api/orders.py:80`).

---

## Exit Criteria

DONE when every outbound dependency the code or traces show has a row with call sites, library version, current timeout and retry settings, idempotency per operation, and a criticality backed by a cited line.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rg` not installed | **Stop**: install ripgrep; `grep -rn` misses `.gitignore` handling and types, so do not substitute silently. |
| Phase 1 | Client is built by a framework from config only (no constructor in code) | **Adjust**: search config files for the framework's client keys and record the config file:line as the call site. |
| Phase 2 | Library default unknown | **Adjust**: open the library's official docs for the pinned version and cite the page; never write a remembered default. |
| Phase 3 | `trace_source` unreachable | **Adjust**: continue with the code inventory and set `seen_in_traces` to "unknown" for every row. |
| Phase 3 | Handler path too indirect to follow | **Return**: list the dependency with `criticality` "critical" and `criticality_reason` "call path not traced"; critical is the safe default for planning. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
