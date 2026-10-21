# Incident Tempo TraceQL Fault Localization

**One-line description:** Searches Grafana Tempo with TraceQL for failing and slow traces of the affected service, opens trace IDs found in logs, and finds the deepest span that errors or holds the most self time, so the fault is placed on one service and one operation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `incident_record` (object, required): declared_at and affected services.
- `metric_findings` (object, required): From `inc-promql-red-triage`; onset time and latency SLI.
- `loki_log_findings` (object, optional): From `inc-loki-logql-slice`; trace IDs from log lines.
- `cloudwatch_log_findings` (object, optional): From `inc-cloudwatch-insights-slice`; trace IDs from log lines.
- `tempo_url` (string, required): Tempo query base URL, for example `http://tempo-query-frontend.observability:3200`.
- `service_name` (string, required): The OpenTelemetry `service.name` of the entry service, exactly as reported in spans.

---

## Outputs

- `trace_findings` (object): {queries_used, traces_examined, fault_span (service, operation name, status, attributes), self_time_leader, before_vs_after (span durations for the same operation before and after onset), trace_links}.

---

## Phase 1: Collect Trace IDs

### Entry Criteria
- `curl -sS "$TEMPO/ready"` prints `ready`.

### Actions
1. Start with trace IDs from `loki_log_findings` or `cloudwatch_log_findings` if present.
2. Search for error traces in the incident window (Unix seconds):
   ```
   curl -sS -G "$TEMPO/api/search" \
     --data-urlencode 'q={ resource.service.name = "<service_name>" && status = error }' \
     --data-urlencode "start=$START" --data-urlencode "end=$END" --data-urlencode "limit=20" \
     | jq -r '.traces[] | "\(.traceID) \(.rootServiceName) \(.rootTraceName) \(.durationMs)"'
   ```
3. For latency incidents, search slow traces. The duration bound comes from the service's latency SLO or the incident value in `metric_findings`; do not invent one:
   `{ resource.service.name = "<service_name>" && duration > <SLO bound> }`
4. Collect the same query for a window of equal length BEFORE the onset, to have healthy traces for comparison.
5. If the search returns nothing, check the service name: `curl -sS "$TEMPO/api/search/tag/resource.service.name/values"` lists the names Tempo knows (endpoint per the Tempo HTTP API docs; check your version's docs if it returns 404).

### Output
A list of failing or slow trace IDs and healthy ones.

### Quality Gate
- At least five trace IDs from after the onset, or the empty search result is attached.
- At least one healthy trace ID from before the onset.

---

## Phase 2: Read the Traces

### Entry Criteria
- Trace IDs are collected.

### Actions
1. Fetch each trace: `curl -sS "$TEMPO/api/traces/<traceID>" > trace-<id>.json` (OTLP JSON format). Or open it in Grafana Explore with the Tempo data source for a waterfall view.
2. Find the fault span with this rule: the error span with no child span in error is where the error was raised; parent spans that are in error only because a child failed are propagating it.
3. Find the self-time leader: for each span, self time = span duration minus time covered by its children. The span with the largest self time in a slow trace is where time was spent.
4. List the attributes of the fault span: `db.system`, `db.statement` or `db.query.text`, `http.response.status_code`, `rpc.grpc.status_code`, `server.address`, `exception.type`, `exception.message` (attribute names follow OpenTelemetry semantic conventions; older instrumentation may use older names).
5. Use a structural query to count how many error traces share the fault: `{ resource.service.name = "<service_name>" } >> { status = error && resource.service.name = "<fault service>" }`.

### Output
Fault span and self-time leader per trace.

### Quality Gate
- The fault span is named by service and span name for each examined trace.
- The structural query count is recorded.

---

## Phase 3: Compare Before and After

### Entry Criteria
- Fault span is known.

### Actions
1. For the fault span's operation, compare durations and status in healthy traces versus failing traces.
2. Decision:

| Comparison | Reading |
|---|---|
| Same operation, much slower after onset, no error | Downstream slowdown; look at that dependency's saturation |
| Same operation, errors after onset only | New failure in that dependency or in how it is called |
| Operation absent before onset, present after | New code path (from a deploy or flag) |
| Many short repeated spans of the same call after onset | Retry storm or N+1 query |

3. Fill `trace_findings` with the matched row and the trace links.

### Output
`trace_findings`.

### Quality Gate
- One comparison row is chosen and both a healthy and a failing duration for the operation are quoted.

---

## Worked Example

Illustrative only. Service `checkout`, onset 13:59:30Z.

- Phase 1: 20 trace IDs from Loki. Search `{ resource.service.name = "checkout" && status = error }` from 14:00Z to 14:20Z returns 20 traces, durationMs around 5000. Healthy traces from 13:30Z to 13:50Z collected.
- Phase 2: In trace 4bf92f35..., span `GET /v2/price` in service `pricing-v2` is the deepest error span, `http.response.status_code` 504, duration 5000 ms. Structural query: 20 of 20 error traces share it.
- Phase 3: Before onset the trace calls `pricing` (v1) in 40 ms; `pricing-v2` is absent. Row 3: new code path. `trace_findings` records it with links.

---

## Exit Criteria

DONE when `trace_findings` names one fault span by service and operation, gives healthy and failing durations, and links the traces examined.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Search returns no traces | **Adjust**: widen the window, check the service name list, and confirm sampling keeps errors; record the sampling policy. |
| Phase 2 | Traces are broken (missing parents) | **Adjust**: context propagation is missing across a hop; record the hop and use logs for that segment. |
| Phase 2 | `/api/traces/<id>` returns 404 | **Retry**: the trace may not be flushed yet; retry after the ingester flush period, or try the v2 endpoint per your Tempo version. |
| Phase 3 | No difference between healthy and failing traces | **Return**: the fault is outside traced code; rely on runtime and database flows. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
