# Java OpenTelemetry Agent Setup For Traces And Metrics

**One-line description:** Attaches the OpenTelemetry Java agent (`opentelemetry-javaagent.jar`) to a JVM service through `-javaagent` or `JAVA_TOOL_OPTIONS`, sets the `OTEL_*` environment for OTLP export, adds `@WithSpan` manual spans, and proves traces and JVM plus HTTP metrics are emitted with the console exporter and the collector's counters.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Absolute path to the Maven or Gradle project.
- `service_name` (string, required): Value for `OTEL_SERVICE_NAME`.
- `otlp_endpoint` (string, required): Collector OTLP endpoint, for example `http://otel-collector:4318`.

---

## Outputs

- `otel_setup` (object): Agent version, download location, the exact JVM start command, the `OTEL_*` environment block, files changed, and captured console exporter output.

---

## Phase 1: Obtain And Attach The Agent

### Entry Criteria
- Build passes; test summary saved.
- No other bytecode agent for tracing is attached. Check: `rg -n "javaagent" Dockerfile* *.yaml *.yml pom.xml build.gradle* 2>/dev/null`.

### Actions
1. Download the release jar and record its version:
```
curl -L -o otel/opentelemetry-javaagent.jar \
  https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar
unzip -p otel/opentelemetry-javaagent.jar META-INF/MANIFEST.MF | rg Implementation-Version
```
2. For reproducible builds, replace `latest` with the recorded version tag in the URL (`/releases/download/v<version>/opentelemetry-javaagent.jar`).
3. Attach with one of:

| Where the JVM starts | Change |
|---|---|
| `java -jar` command | `java -javaagent:otel/opentelemetry-javaagent.jar -jar app.jar` |
| Container image you cannot change the command of | `ENV JAVA_TOOL_OPTIONS="-javaagent:/otel/opentelemetry-javaagent.jar"` |
| Kubernetes with the OpenTelemetry Operator | an `Instrumentation` resource plus the `instrumentation.opentelemetry.io/inject-java` pod annotation (see the operator docs) |

4. Do not combine the agent with the OpenTelemetry Spring Boot starter or another vendor APM agent in the same JVM. Pick one.

### Output
Agent jar and attach line.

### Quality Gate
- JVM startup prints a line containing `opentelemetry-javaagent` and the version (`[otel.javaagent ...] INFO io.opentelemetry.javaagent.tooling.VersionLogger`).

---

## Phase 2: Console Proof

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Start with console exporters:
```
OTEL_SERVICE_NAME=checkout-api OTEL_TRACES_EXPORTER=console OTEL_METRICS_EXPORTER=console \
OTEL_LOGS_EXPORTER=none OTEL_METRIC_EXPORT_INTERVAL=5000 \
java -javaagent:otel/opentelemetry-javaagent.jar -jar target/checkout.jar
```
Agent 2.x uses `console`; agent 1.x used `logging`. If the agent warns about an unrecognized exporter, use the other name for your version.
2. `curl -s localhost:8080/orders >/dev/null` and read stdout. A span line names the route (`GET /orders`) with `kind=SERVER`. Metrics include `http.server.request.duration` and JVM metrics such as `jvm.memory.used`.
3. If nothing prints, add `-Dotel.javaagent.debug=true` and read which instrumentations loaded.

### Output
Captured console output.

### Quality Gate
- Output contains a SERVER span for the curled route.
- Output contains `http.server.request.duration` and at least one `jvm.` metric.

---

## Phase 3: Manual Spans And OTLP

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Add the annotations dependency (version aligned with the agent per the instrumentation docs):
```xml
<dependency>
  <groupId>io.opentelemetry.instrumentation</groupId>
  <artifactId>opentelemetry-instrumentation-annotations</artifactId>
  <version><!-- same release line as the agent; check Maven Central --></version>
</dependency>
```
2. Annotate one business method: `@WithSpan("create_order") public Order create(@SpanAttribute("order.item_count") int items)`. The agent applies `@WithSpan` by bytecode instrumentation, not Spring AOP proxies, so it also works on calls from inside the same class. The annotation does nothing without the agent attached; a unit test run without the agent will not show the span.
3. Set OTLP in the deployment file. Agent 2.x defaults `OTEL_EXPORTER_OTLP_PROTOCOL` to `http/protobuf` (port 4318); agent 1.x defaulted to `grpc` (4317). Set it explicitly:
```
OTEL_SERVICE_NAME=checkout-api
OTEL_RESOURCE_ATTRIBUTES=service.version=1.4.2,deployment.environment.name=prod
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```
4. Disable noisy instrumentation only by its documented key, for example `OTEL_INSTRUMENTATION_<NAME>_ENABLED=false`, where `<NAME>` comes from the agent's "suppressing instrumentation" docs table. Do not guess names.

### Output
`otel_setup`.

### Quality Gate
- Console output shows `create_order` with the same trace ID as the server span.
- `curl -s otel-collector:8888/metrics | rg otelcol_receiver_accepted_spans` increases after a request with OTLP export.
- Build passes.

---

## Worked Example

Illustrative only.

```
$ unzip -p otel/opentelemetry-javaagent.jar META-INF/MANIFEST.MF | rg Implementation-Version
Implementation-Version: 2.9.0
$ curl -s localhost:8080/orders >/dev/null
(service stdout)
[otel.javaagent 2026-10-20 14:12:02:118 +0000] [http-nio-8080-exec-1] INFO io.opentelemetry.exporter.logging.LoggingSpanExporter - 'GET /orders' : 4bf92f3577b34da6a3ce929d0e0e4736 00f067aa0ba902b7 SERVER [tracer: io.opentelemetry.tomcat-10.0:2.9.0-alpha] AttributesMap{data={http.route=/orders, http.response.status_code=200, http.request.method=GET}}
$ curl -s otel-collector:8888/metrics | rg accepted_spans
otelcol_receiver_accepted_spans{receiver="otlp",transport="http"} 57
```

---

## Exit Criteria

DONE when the agent version is pinned, console output shows server spans, HTTP and JVM metrics, the manual span shares the trace, and OTLP export raises the collector's accepted span count.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Another tracing agent already attached | **Stop**: report; choose one agent with the owner. |
| Phase 2 | No spans for the framework | **Adjust**: run with `-Dotel.javaagent.debug=true` and check the framework version is in the agent's supported libraries list. |
| Phase 3 | Exporter logs `Failed to export spans` with 404 or protocol errors | **Retry**: protocol and port mismatch; set protocol explicitly as in step 3. |
| Phase 3 | Accepted span count unchanged | **Stop**: telemetry is not flowing; do not claim success. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
