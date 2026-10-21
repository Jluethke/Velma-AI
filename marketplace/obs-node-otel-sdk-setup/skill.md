# Node.js OpenTelemetry SDK Setup For Traces And Metrics

**One-line description:** Adds `@opentelemetry/sdk-node` with `auto-instrumentations-node` in a dedicated instrumentation file that loads before the application through `--require`, configures OTLP trace and metric exporters with a periodic metric reader, adds graceful shutdown, and proves emission with the console exporter and the collector's accepted-span counter.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Absolute path to the Node.js service repository.
- `service_name` (string, required): Value for `OTEL_SERVICE_NAME`.
- `otlp_endpoint` (string, required): Collector OTLP endpoint, for example `http://otel-collector:4318`.

---

## Outputs

- `otel_setup` (object): Packages added, `instrumentation.js` contents, the exact start command, the `OTEL_*` environment block, and captured console output showing one span and one metric.

---

## Phase 1: Install And Write The Instrumentation File

### Entry Criteria
- Tests pass; summary saved.
- Module system known: `node -p "require('./package.json').type"` prints `module` (ESM) or `undefined`/`commonjs` (CommonJS).

### Actions
1. Install with the repo's package manager:
`npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-proto @opentelemetry/exporter-metrics-otlp-proto @opentelemetry/sdk-metrics @opentelemetry/sdk-trace-base`
2. Create ONE file `instrumentation.js` at the repo root:
```js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto');
const { PeriodicExportingMetricReader, ConsoleMetricExporter } = require('@opentelemetry/sdk-metrics');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');

// APP_OTEL_CONSOLE is this repo's own switch (not an OTel spec variable) for local proof runs.
const consoleMode = process.env.APP_OTEL_CONSOLE === '1';
const sdk = new NodeSDK({
  traceExporter: consoleMode ? new ConsoleSpanExporter() : new OTLPTraceExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: consoleMode ? new ConsoleMetricExporter() : new OTLPMetricExporter()
  }),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false }
  })]
});
sdk.start();

const shutdown = () => sdk.shutdown().catch(console.error).finally(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```
3. `instrumentation-fs` is disabled because it creates a span per file system call, which floods traces with noise for most web services. Re-enable only with a reason.
4. Exporters read `OTEL_EXPORTER_OTLP_ENDPOINT` from the environment; do not hardcode a URL in this file. The `-proto` exporters use `http/protobuf`, so the port is 4318.

### Output
`instrumentation.js`.

### Quality Gate
- `node -e "require('./instrumentation.js')"` exits without an error (it will log export failures if no collector runs; that is expected here).
- `npm ls @opentelemetry/sdk-node` shows exactly one version (no duplicates of the API package: `npm ls @opentelemetry/api` must show one deduped version; duplicates break context propagation).

---

## Phase 2: Load Order And Console Proof

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Load the file before any application module. Pick one row:

| Module system | Start command |
|---|---|
| CommonJS | `node --require ./instrumentation.js src/server.js` |
| ESM | Follow the `@opentelemetry/instrumentation` README section on ESM support for your installed version; it requires a loader hook flag in addition to `--import`. Check the README; do not guess the flag. |

2. Do not `require('./instrumentation')` from inside `server.js` after `express` is imported. Instrumentations patch modules when they are first loaded; anything already loaded is not patched, and you will get no HTTP spans with no error.
3. Run with console output for the proof:
```
OTEL_SERVICE_NAME=checkout-api APP_OTEL_CONSOLE=1 \
OTEL_METRIC_EXPORT_INTERVAL=5000 node --require ./instrumentation.js src/server.js
```
`OTEL_METRIC_EXPORT_INTERVAL` is in milliseconds (spec default 60000); 5000 is for this local check only. Add `@opentelemetry/sdk-trace-base` to dependencies if `npm ls` does not show it as a direct dependency.
4. `curl -s localhost:3000/orders >/dev/null` and read the output: a span object with `name: 'GET /orders'` and `kind: 1` (SERVER), and a metric `http.server.duration` or `http.server.request.duration`.

### Output
Captured console spans and metrics.

### Quality Gate
- A SERVER span for the curled route is printed with `attributes['http.route']` set.
- The metric output lists an HTTP server duration histogram with a non-zero count.

---

## Phase 3: Manual Span, Metric And OTLP

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Add one manual span and counter in one service file:
```js
const { trace, metrics, SpanStatusCode } = require('@opentelemetry/api');
const tracer = trace.getTracer('checkout');
const ordersCreated = metrics.getMeter('checkout').createCounter('orders.created', { unit: '{order}' });

async function createOrder(input) {
  return tracer.startActiveSpan('create_order', async (span) => {
    try {
      span.setAttribute('order.item_count', input.items.length);
      const r = await save(input);
      ordersCreated.add(1, { 'payment.method': input.paymentMethod });
      return r;
    } catch (e) {
      span.recordException(e); span.setStatus({ code: SpanStatusCode.ERROR }); throw e;
    } finally { span.end(); }
  });
}
```
2. `span.end()` in `finally` is required; an unended span is never exported.
3. Set the OTLP environment in the deployment file only:
```
OTEL_SERVICE_NAME=checkout-api
OTEL_RESOURCE_ATTRIBUTES=service.version=1.4.2,deployment.environment.name=prod
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
NODE_OPTIONS=--require ./instrumentation.js
```
4. Run tests after the change.

### Output
`otel_setup`.

### Quality Gate
- `curl -s otel-collector:8888/metrics | rg otelcol_receiver_accepted_spans` increases after a request.
- Tests pass with the same count.

---

## Worked Example

Illustrative only.

```
$ npm ls @opentelemetry/api
checkout-api@1.4.2
+-- @opentelemetry/api@1.9.0
`-- @opentelemetry/sdk-node@0.53.0
  `-- @opentelemetry/api@1.9.0 deduped
$ curl -s localhost:3000/orders >/dev/null
(service stdout)
{
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  name: 'GET /orders',
  id: '00f067aa0ba902b7',
  kind: 1,
  attributes: { 'http.method': 'GET', 'http.route': '/orders', 'http.status_code': 200 }
}
$ curl -s otel-collector:8888/metrics | rg accepted_spans
otelcol_receiver_accepted_spans{receiver="otlp",transport="http"} 118
```

---

## Exit Criteria

DONE when SERVER spans and the HTTP duration metric are proven on the console, the manual span nests under the server span, the collector's accepted span count rises, and the start command loads instrumentation first.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `npm ls @opentelemetry/api` shows two versions | **Adjust**: align package versions so the API dedupes; rerun `npm ls`. |
| Phase 2 | Only manual spans, no HTTP spans | **Adjust**: instrumentation loads after the app; fix the start command. |
| Phase 2 | ESM app shows no spans | **Adjust**: apply the ESM loader hook from the README of the installed version. |
| Phase 3 | Exporter logs `ECONNREFUSED` | **Retry**: check endpoint, port 4318 for http/protobuf, and that the collector listens on `0.0.0.0`. |
| Phase 3 | Accepted span count unchanged | **Stop**: telemetry is not flowing; do not claim success. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
