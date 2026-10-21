# Go OpenTelemetry SDK Setup For Traces And Metrics

**One-line description:** Writes a Go `setupOTel` function that builds a resource, a batching `TracerProvider` with the OTLP gRPC trace exporter, a `MeterProvider` with a periodic OTLP metric reader, and the W3C TraceContext plus Baggage propagator, wraps the HTTP server and client with `otelhttp`, shuts everything down on exit, and proves emission with the stdout exporter and the collector's counters.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Absolute path to the Go module root.
- `service_name` (string, required): Value for `OTEL_SERVICE_NAME`.
- `otlp_endpoint` (string, required): Collector OTLP gRPC endpoint, for example `http://otel-collector:4317`.

---

## Outputs

- `otel_setup` (object): Modules added, `internal/telemetry/otel.go` contents, `main.go` diff, the `OTEL_*` environment block, and captured stdout exporter output showing one span.

---

## Phase 1: Add Modules And The Setup Function

### Entry Criteria
- `go build ./...` and `go test ./...` pass; summary saved.

### Actions
1. Add modules:
```
go get go.opentelemetry.io/otel \
  go.opentelemetry.io/otel/sdk \
  go.opentelemetry.io/otel/sdk/metric \
  go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc \
  go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc \
  go.opentelemetry.io/otel/exporters/stdout/stdouttrace \
  go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp
```
2. Create ONE file `internal/telemetry/otel.go`:
```go
package telemetry

import (
    "context"
    "errors"
    "os"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
    "go.opentelemetry.io/otel/propagation"
    sdkmetric "go.opentelemetry.io/otel/sdk/metric"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

func Setup(ctx context.Context) (func(context.Context) error, error) {
    res, err := resource.New(ctx, resource.WithFromEnv(), resource.WithTelemetrySDK(), resource.WithHost())
    if err != nil {
        return nil, err
    }
    var sp sdktrace.SpanExporter
    if os.Getenv("APP_OTEL_STDOUT") == "1" { // repo-local switch for proof runs
        sp, err = stdouttrace.New(stdouttrace.WithPrettyPrint())
    } else {
        sp, err = otlptracegrpc.New(ctx)
    }
    if err != nil {
        return nil, err
    }
    tp := sdktrace.NewTracerProvider(sdktrace.WithBatcher(sp), sdktrace.WithResource(res))
    me, err := otlpmetricgrpc.New(ctx)
    if err != nil {
        return nil, err
    }
    mp := sdkmetric.NewMeterProvider(sdkmetric.WithReader(sdkmetric.NewPeriodicReader(me)), sdkmetric.WithResource(res))
    otel.SetTracerProvider(tp)
    otel.SetMeterProvider(mp)
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))
    return func(ctx context.Context) error { return errors.Join(tp.Shutdown(ctx), mp.Shutdown(ctx)) }, nil
}
```
3. `resource.WithFromEnv()` reads `OTEL_SERVICE_NAME` and `OTEL_RESOURCE_ATTRIBUTES`, so no hardcoded service name. Avoid `resource.Merge(resource.Default(), resource.NewWithAttributes(semconv.SchemaURL, ...))` with a `semconv` import version different from the SDK's; it fails at runtime with a "conflicting Schema URL" error.
4. Without `otel.SetTextMapPropagator`, the global propagator is a no-op and trace context does not cross service boundaries even though spans are created. This line is mandatory.
5. `errors.Join` needs Go 1.20 or later.

### Output
`internal/telemetry/otel.go`.

### Quality Gate
- `go build ./...` exits 0.
- `go vet ./internal/telemetry/` prints nothing.

---

## Phase 2: Wire Into main And HTTP

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. In `main.go` only:
```go
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()
shutdown, err := telemetry.Setup(ctx)
if err != nil { log.Fatal(err) }
defer func() {
    sctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    _ = shutdown(sctx)
}()
srv := &http.Server{Addr: ":8080", Handler: otelhttp.NewHandler(mux, "server")}
```
The 5 second shutdown timeout is a placeholder for the platform's termination grace period (Kubernetes `terminationGracePeriodSeconds` default is 30 s); set it below that value and record the choice.
2. Route names: with Go 1.22 `http.ServeMux` patterns, newer `otelhttp` versions set `http.route` from the pattern. If the span name stays `server` for every route, wrap each handler with `otelhttp.WithRouteTag("/orders/{id}", h)` (check that function exists in your `otelhttp` version with `go doc go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp WithRouteTag`).
3. Outgoing calls: `client := &http.Client{Transport: otelhttp.NewTransport(http.DefaultTransport)}`. Use `http.NewRequestWithContext(ctx, ...)`; a request built without the context starts a new trace.
4. One manual span and counter:
```go
var tracer = otel.Tracer("checkout")
var ordersCreated, _ = otel.Meter("checkout").Int64Counter("orders.created", metric.WithUnit("{order}"))

ctx, span := tracer.Start(ctx, "create_order")
defer span.End()
ordersCreated.Add(ctx, 1, metric.WithAttributes(attribute.String("payment.method", pm)))
```

### Output
Wired service.

### Quality Gate
- `go build ./... && go test ./...` pass with the same count.
- `rg -n "otelhttp.NewHandler" --type go` shows the server wrapping.

---

## Phase 3: Prove Emission

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Stdout proof: `APP_OTEL_STDOUT=1 OTEL_SERVICE_NAME=checkout-api go run ./cmd/server` then `curl -s localhost:8080/orders`. Expect a pretty-printed span with `"SpanKind": 2` (server) and `"Name"` for the route.
2. OTLP: set in the deployment file:
```
OTEL_SERVICE_NAME=checkout-api
OTEL_RESOURCE_ATTRIBUTES=service.version=1.4.2,deployment.environment.name=prod
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_EXPORTER_OTLP_INSECURE=true
```
`OTEL_EXPORTER_OTLP_INSECURE=true` only when the collector listens without TLS.
3. Send traffic and check the collector: `curl -s otel-collector:8888/metrics | rg 'otelcol_receiver_accepted_(spans|metric_points)'` before and after.

### Output
`otel_setup`.

### Quality Gate
- The stdout span shows `SpanKind` 2 and a non-empty `TraceID`.
- Both `otelcol_receiver_accepted_spans` and `otelcol_receiver_accepted_metric_points` increase; the metric one may take one export interval (spec default 60 s, `OTEL_METRIC_EXPORT_INTERVAL`).

---

## Worked Example

Illustrative only.

```
$ APP_OTEL_STDOUT=1 OTEL_SERVICE_NAME=checkout-api go run ./cmd/server &
$ curl -s localhost:8080/orders >/dev/null
{
  "Name": "GET /orders",
  "SpanContext": {"TraceID": "4bf92f3577b34da6a3ce929d0e0e4736", "SpanID": "00f067aa0ba902b7"},
  "SpanKind": 2,
  "Attributes": [{"Key": "http.request.method", "Value": {"Type": "STRING", "Value": "GET"}},
                 {"Key": "http.response.status_code", "Value": {"Type": "INT64", "Value": 200}}],
  "Resource": [{"Key": "service.name", "Value": {"Type": "STRING", "Value": "checkout-api"}}]
}
$ curl -s otel-collector:8888/metrics | rg accepted_spans
otelcol_receiver_accepted_spans{receiver="otlp",transport="grpc"} 311
```

---

## Exit Criteria

DONE when the stdout exporter shows server spans with the service resource, the propagator is set, shutdown flushes on SIGTERM, and the collector's accepted span and metric point counters increase.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | "conflicting Schema URL" at startup | **Adjust**: remove the manual `resource.Merge` with a mismatched `semconv` import; use `resource.New` as shown. |
| Phase 2 | Downstream service starts a new trace | **Adjust**: propagator missing or the request lacks context; fix steps 1.4 or 2.3. |
| Phase 3 | Last spans before exit missing | **Adjust**: shutdown not called or its timeout is too short for the batch. |
| Phase 3 | `connection refused` or TLS handshake error | **Retry**: check port 4317 and the `INSECURE` setting against the collector's TLS config. |
| Phase 3 | Counters unchanged | **Stop**: do not claim success. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
