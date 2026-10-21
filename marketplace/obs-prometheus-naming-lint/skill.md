# Prometheus Metric Naming Lint With promtool

**One-line description:** Scrapes a service's `/metrics` output, runs `promtool check metrics` on it, checks every metric against the Prometheus naming rules (base units, `_total` on counters, unit suffixes, snake_case, no label names in metric names), and renames offenders one at a time after finding every dashboard and rule that references the old name.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_metrics_url` (string, required): The scrape URL that exposes the service's metrics in Prometheus text format, for example `http://checkout-api:8000/metrics` or the collector's `http://otel-collector:8889/metrics`.
- `red_metric_spec` (object, required): Output of `obs-red-metrics-spec`; its names are the expected ones.

---

## Outputs

- `naming_report` (object): `promtool` output, a table of metric name, rule broken, proposed name, and references found (dashboards, rules, code), plus the rename status of each.

---

## Phase 1: Run promtool

### Entry Criteria
- `promtool` is installed (it ships in the Prometheus release tarball): `promtool --version` prints a version.
- `curl -sf "$service_metrics_url" | head -3` prints `# HELP` or `# TYPE` lines.

### Actions
1. Lint: `curl -s "$service_metrics_url" | promtool check metrics`.
2. Read the output. Each line is `<metric_name> <problem>`. Typical messages:
   - `counter metrics should have "_total" suffix`
   - `metric names should be written in 'snake_case' not 'camelCase'`
   - `use base unit "seconds" instead of "milliseconds"`
   - `metric name should not include type 'counter'` (or similar)
   - `no help text`
3. Exit code: `promtool check metrics` exits non-zero when it reports problems. Save the full output; do not filter it.

### Output
Raw lint output.

### Quality Gate
- The full `promtool check metrics` output and its exit code (`echo $?`) are pasted.

---

## Phase 2: Apply The Naming Rules

### Entry Criteria
- Lint output saved.

### Actions
1. List all names: `curl -s "$service_metrics_url" | rg '^# TYPE' | awk '{print $3, $4}'`.
2. Check each name against these rules from the Prometheus "Metric and label naming" page:

| Rule | Bad | Good |
|---|---|---|
| Base units: seconds, bytes, meters; ratios 0 to 1 not percent | `request_latency_ms` | `request_duration_seconds` |
| Unit suffix, then `_total` for counters | `bytes_sent` (counter) | `sent_bytes_total` |
| One application prefix | `requests_total` | `checkout_requests_total` or the semconv `http_server_...` |
| No label names or values inside the name | `http_requests_get_total` | `http_requests_total{method="GET"}` |
| `_info` for info metrics with value 1 | `build_version` | `checkout_build_info{version="1.4.2"}` |
| snake_case | `httpRequests` | `http_requests` |

3. OTel-exported names: the collector's Prometheus exporter turns dots into underscores, adds unit suffixes from the instrument unit (`s` to `_seconds`, `By` to `_bytes`, `1` to `_ratio` on gauges) and `_total` to monotonic sums. So fix OTel names at the instrument (name and `unit`), not by renaming in Prometheus. An instrument with unit `ms` exports `_milliseconds`, which promtool flags; change the instrument unit to `s` and the recorded values to seconds together.
4. For each violation, record the proposed name. Compare with `red_metric_spec` names; spec names win.

### Output
Violation table.

### Quality Gate
- Every promtool line appears in the table with a proposed fix or a written reason to keep (for example a third-party library metric you do not own).

---

## Phase 3: Rename Safely

### Entry Criteria
- Violation table complete.

### Actions
1. For each rename, find every reference before changing anything:
   - Dashboards: `rg -n "<old_name>" dashboards/ grafana/ deploy/`
   - Rules: `rg -n "<old_name>" -g '*.rules.y*ml' -g '*rules*.y*ml' .`
   - Live rules: `curl -s $PROM/api/v1/rules | jq -r '.. | .query? // empty' | rg "<old_name>"`
   - Code: `rg -n "<old_name>" src/ app/ internal/`
2. Rename ONE metric per change. Update the code and every reference found in the same change. Do not batch renames; a single mistake then breaks many panels at once.
3. If a dashboard or alert outside this repo uses the old name, keep the old metric emitted alongside the new one for a transition period agreed with its owner, and record the removal date as an open question.
4. Rerun `promtool check metrics` after each rename.

### Output
`naming_report`.

### Quality Gate
- Final `promtool check metrics` output has no lines for metrics this service owns, or each remaining line has a recorded reason.
- For each rename, `rg -n "<old_name>"` over the repo returns no hits (or only the transition dual-emit line).

---

## Worked Example

Illustrative only.

```
$ curl -s http://checkout-api:8000/metrics | promtool check metrics; echo $?
checkout_payment_latency_ms use base unit "seconds" instead of "milliseconds"
checkout_orders counter metrics should have "_total" suffix
1
$ rg -n "checkout_payment_latency_ms" dashboards/ deploy/ app/
dashboards/checkout.json:212:  "expr": "histogram_quantile(0.99, sum by (le)(rate(checkout_payment_latency_ms_bucket[5m])))"
app/metrics.py:9:PAYMENT_LATENCY = Histogram("checkout_payment_latency_ms", ...)
```
Change 1: `app/metrics.py` renames to `checkout_payment_duration_seconds`, observes `elapsed_s` instead of `elapsed_ms`, buckets converted to seconds; `dashboards/checkout.json:212` updated. Rerun shows only the `checkout_orders` line. Change 2 handles `checkout_orders_total`.

---

## Exit Criteria

DONE when promtool reports nothing for owned metrics (or each exception is recorded), and every rename updated all references found by search.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `promtool` not installed | **Adjust**: download the Prometheus release for the platform and use the bundled `promtool`; do not substitute another linter. |
| Phase 1 | Endpoint returns OpenMetrics only | **Adjust**: send `Accept: text/plain` with curl, or lint the OpenMetrics output as promtool supports per its `--help`. |
| Phase 2 | Violation is in a third-party library metric | **Adjust**: record as kept; do not patch the library. |
| Phase 3 | An external dashboard depends on the old name | **Stop**: keep dual emission and record the owner and open question. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
