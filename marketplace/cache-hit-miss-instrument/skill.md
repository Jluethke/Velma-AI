# Cache Hit and Miss Instrumentation

**One-line description:** Adds client-side cache metrics per namespace (hits, misses, errors, sets, and latency histograms for the cache call and the miss-path load) with the stack's standard Prometheus or Micrometer library, keeping label cardinality bounded, and verifies the series appear on the metrics endpoint.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository.
- `key_schema` (object[], required): Key templates from `cache-key-schema-design`; the `<entity>` segment becomes the metric label.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `cache_metrics` (object): Metric names, label sets, histogram buckets and their source, files changed, the PromQL queries for hit ratio and latency, and a sample of the scraped `/metrics` output.

---

## Phase 1: Define the Metrics

### Entry Criteria
- Cache read paths exist and tests pass.

### Actions
1. Define exactly these metrics (names follow Prometheus naming conventions: base unit seconds, `_total` suffix for counters):
   - `cache_requests_total{cache, result}` counter, `result` in `hit`, `miss`, `error`.
   - `cache_operation_duration_seconds{cache, op}` histogram, `op` in `get`, `set`, `delete`.
   - `cache_load_duration_seconds{cache}` histogram, the time to load from the source on a miss.
2. `cache` label = the `<entity>` segment of the key template (for example `product`). NEVER use the full key, user id or any unbounded value as a label; each distinct label value creates a new time series and can exhaust Prometheus memory.
3. Histogram buckets: use the library default unless measurements show the latencies fall outside it. The Prometheus client default buckets range from 5 ms to 10 s, which is too coarse for sub-millisecond cache gets; if `get` latencies are sub-millisecond (check one trace), define buckets that cover the measured range and record the measurement that justified them.
4. If the repo uses Spring Boot with Micrometer, use its cache metrics instead: Caffeine with `recordStats` and a Redis cache manager with `enableStatistics()` expose `cache.gets{result="hit|miss"}`, `cache.puts`, `cache.evictions` through Actuator. Skip to Phase 3.

### Output
Metric definitions.

### Quality Gate
- Every label's allowed values form a closed, written list.

---

## Phase 2: Add the Instrumentation

### Entry Criteria
- Definitions written.

### Actions
1. Library per stack:

   | `stack` | Library | Calls |
   |---|---|---|
   | `python` | `prometheus_client` | `Counter("cache_requests_total", "...", ["cache", "result"])`, `.labels(cache="product", result="hit").inc()`; `Histogram(...).labels(...).time()` as a context manager |
   | `node` | `prom-client` | `new client.Counter({ name: 'cache_requests_total', help: '...', labelNames: ['cache','result'] })`, `.inc({ cache: 'product', result: 'hit' })`; `histogram.startTimer({ cache, op })` returns an end function |
   | `go` | `github.com/prometheus/client_golang/prometheus` and `promauto` | `promauto.NewCounterVec(prometheus.CounterOpts{Name: "cache_requests_total"}, []string{"cache","result"})`, `.WithLabelValues("product","hit").Inc()`; `prometheus.NewTimer(hist.WithLabelValues(...))` then `ObserveDuration()` |
   | `java` | Micrometer | `Counter.builder("cache.requests").tag("cache","product").tag("result","hit").register(registry).increment()`; Micrometer renders it to Prometheus as `cache_requests_total` |

2. Put the instrumentation in the cache module wrapper only, not at every call site. The wrapper already knows hit, miss and error.
3. Count `error` separately from `miss`. A Redis outage that is counted as misses hides itself as a low hit ratio.
4. Python multi-process servers (Gunicorn): `prometheus_client` needs multiprocess mode (`PROMETHEUS_MULTIPROC_DIR` environment variable and `MultiProcessCollector`); without it each scrape sees one random worker. Read the `prometheus_client` multiprocess docs before enabling.
5. Add a unit test that performs one hit and one miss and asserts the counter values through the library's registry (`REGISTRY.get_sample_value` in Python, `register.getSingleMetric` in prom-client, `testutil.ToFloat64` in Go).

### Output
Instrumented cache module and passing test.

### Quality Gate
- The metric unit test passes.
- `grep -rn "labels(\|WithLabelValues\|labelNames" <changed files>` shows no key or id variable passed as a label value.

---

## Phase 3: Verify Scrape and Queries

### Entry Criteria
- Instrumented build running locally or in staging.

### Actions
1. `curl -s http://localhost:<port>/metrics | grep -E "^cache_(requests_total|operation_duration_seconds|load_duration_seconds)"` (or `/actuator/prometheus` for Spring). Save the lines.
2. Write the queries into `cache_metrics`:
   - Hit ratio: `sum by (cache) (rate(cache_requests_total{result="hit"}[5m])) / sum by (cache) (rate(cache_requests_total{result=~"hit|miss"}[5m]))`
   - Error rate: `sum by (cache) (rate(cache_requests_total{result="error"}[5m]))`
   - Get p99: `histogram_quantile(0.99, sum by (le, cache) (rate(cache_operation_duration_seconds_bucket{op="get"}[5m])))`
3. Run each query in the Prometheus UI or `curl -s 'http://prometheus:9090/api/v1/query' --data-urlencode 'query=<q>'` and confirm a non-empty result.

### Output
`cache_metrics`.

### Quality Gate
- The `/metrics` output contains all three metric families.
- Each PromQL query returns at least one series, with the JSON result saved.

---

## Worked Example

Illustrative. Python, Gunicorn 4 workers, entity `product`.

Phase 1: three metrics, `cache` label values {`product`, `psearch`, `catcounts`}. One trace shows Redis GET at 0.3 to 0.9 ms, so buckets `(0.0001, 0.00025, 0.0005, 0.001, 0.0025, 0.005, 0.01, 0.05)` for `cache_operation_duration_seconds`.

Phase 2: wrapper in `app/cache/client.py`; `PROMETHEUS_MULTIPROC_DIR=/tmp/prom` set in the container. Test passes.

Phase 3: `/metrics` shows `cache_requests_total{cache="product",result="hit"} 1832.0`. The hit ratio query returns `0.948` for `product`.

---

## Exit Criteria

DONE when hit, miss, error and latency metrics exist per cache namespace with bounded labels, a unit test proves the counts, and PromQL queries return data.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Request to label by key or user | **Stop**: unbounded labels break Prometheus; use logs or traces for per-key detail. |
| Phase 2 | Counters reset or jump between scrapes (Python) | **Adjust**: multiprocess mode is missing. |
| Phase 2 | Duplicate metric registration error | **Adjust**: create metrics once at module level, not per request or per test. |
| Phase 3 | Queries return empty | **Retry**: check the scrape target is up in Prometheus `/targets` and the metric names match exactly. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
