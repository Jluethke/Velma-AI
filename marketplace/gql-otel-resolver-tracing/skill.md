# Resolver Performance Tracing With OpenTelemetry

**One-line description:** Instruments the GraphQL server with OpenTelemetry (`@opentelemetry/instrumentation-graphql`, Strawberry `OpenTelemetryExtension`, or `otelgqlgen`), exports spans over OTLP to a local Jaeger, and reads the trace waterfall of each client operation to name the slowest resolvers and serial waits.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Server root.
- `stack` (string, required): `apollo`, `yoga`, `python` or `go`.
- `operation_documents` (string, required): Operations to trace.

---

## Outputs

- `tracing_setup` (string[]): Paths of the instrumentation code and the exporter configuration.
- `slow_resolver_report` (object[]): Per operation: total duration, the top resolver spans by self time, serial chains, and database spans under each.

---

## Phase 1: Local Collector

### Entry Criteria
- Docker available: `docker --version`.

### Actions
1. Start Jaeger with OTLP receivers: `docker run --rm -d --name jaeger -p 16686:16686 -p 4317:4317 -p 4318:4318 jaegertracing/all-in-one:latest`. (Jaeger v2 publishes `jaegertracing/jaeger`; either works for local use; check the Jaeger getting-started page.)
2. Open `http://localhost:16686`. The UI must load.
3. Exporter endpoint for the app: `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` (HTTP) or `http://localhost:4317` (gRPC), and `OTEL_SERVICE_NAME=<service>`. These are standard OpenTelemetry SDK environment variables.

### Output
Collector running.

### Quality Gate
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:16686` prints `200`.

---

## Phase 2: Instrument

### Entry Criteria
- Collector running.

### Actions
1. Instrument per stack:

| `stack` | Setup |
|---|---|
| `apollo`, `yoga` | `npm i @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http`. Create `src/tracing.ts` that starts `new NodeSDK({ traceExporter: new OTLPTraceExporter(), instrumentations: [getNodeAutoInstrumentations()] }).start()`. Load it before any other import: `node --import ./dist/tracing.js dist/server.js` (or `--require` for CommonJS). The bundle includes `@opentelemetry/instrumentation-graphql`; configure it with `'@opentelemetry/instrumentation-graphql': { ignoreTrivialResolveSpans: true, mergeItems: true }` to drop spans for default property resolvers and merge list item spans |
| `python` | `pip install opentelemetry-sdk opentelemetry-exporter-otlp`. Configure a `TracerProvider` with `BatchSpanProcessor(OTLPSpanExporter())` at startup, then `strawberry.Schema(..., extensions=[OpenTelemetryExtension])` from `strawberry.extensions.tracing` (use `OpenTelemetryExtensionSync` for a sync schema). Add DB spans with `opentelemetry-instrumentation-sqlalchemy` or `-asyncpg` |
| `go` | `go get github.com/ravilushqa/otelgqlgen go.opentelemetry.io/otel/sdk go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp`. Set a global tracer provider with the OTLP exporter, then `srv.Use(otelgqlgen.Middleware())`. Add DB spans with an instrumented driver (for example `github.com/exaring/otelpgx` as the pgx `Tracer`) |

2. Database spans are what make a waterfall useful; an operation trace with only resolver spans hides where time goes.
3. Restart the server with the OTEL environment variables set.

### Output
Instrumented server.

### Quality Gate
- After one request, the Jaeger UI service dropdown lists `OTEL_SERVICE_NAME`, and the trace contains a span for the GraphQL operation and at least one database span.

---

## Phase 3: Read the Waterfall

### Entry Criteria
- Traces arrive.

### Actions
1. Send each operation in `operation_documents` with realistic variables, three times; analyze the slowest of the three (first may include cold caches; record it separately).
2. In Jaeger, open the trace. For each operation record: total duration; the resolver spans sorted by self time (span duration minus children); and database spans under each.
3. Diagnose with this table:

| Pattern in waterfall | Meaning | Next flow |
|---|---|---|
| Many identical short DB spans under sibling resolvers | N+1 | `gql-n-plus-one-detect` then the stack DataLoader flow |
| DB spans one after another where they do not depend on each other | Serial awaits in one resolver | run independent calls concurrently (`Promise.all`, `asyncio.gather`, goroutines with `errgroup`) |
| One long DB span | Slow query | run `EXPLAIN (ANALYZE, BUFFERS)` on it |
| Long resolver self time with no children | CPU work or an uninstrumented call | instrument the client library or profile |
| Gap before execute span | Parse/validate cost on large documents | persisted operations plus document cache |

4. Record each finding in `slow_resolver_report` with the span names and durations from the UI. Do not claim an improvement without a second trace after the fix.

### Output
`tracing_setup`, `slow_resolver_report`.

### Quality Gate
- Every operation in `operation_documents` has a row with total duration and the top span by self time.
- Every finding cites a span name visible in Jaeger.

---

## Worked Example

Illustrative only. `stack = python`.

Trace for `CustomerOrders` (slowest of three, 184 ms):
```
POST /graphql                         184 ms
  GraphQL Query                       180 ms
    resolve viewer.orders              22 ms
      SELECT orders ...                20 ms
    resolve Order.customer x20        150 ms
      SELECT customers WHERE id=? x20   6-8 ms each, sequential
```
Report row: `{ op: "CustomerOrders", total_ms: 184, top_self: "Order.customer", pattern: "N+1", next: "gql-py-strawberry-dataloader" }`. After the loader fix, second trace shows one `SELECT customers WHERE id IN (...)` and total 41 ms.

---

## Exit Criteria

DONE when every operation is traced with resolver and database spans, and each slow operation has a diagnosed pattern with the next flow named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | No GraphQL spans in Node | **Adjust**: the SDK started after `graphql` was imported; load `tracing` with `--import`/`--require` before the app. |
| Phase 2 | Spans exported nowhere | **Adjust**: check the protocol and port pair (HTTP 4318 vs gRPC 4317) matches the exporter package. |
| Phase 3 | Thousands of trivial resolver spans | **Adjust**: enable `ignoreTrivialResolveSpans` (Node) or filter in the extension options (check Strawberry docs). |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
