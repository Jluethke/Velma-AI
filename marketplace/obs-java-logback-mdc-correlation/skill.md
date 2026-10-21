# Java Logback JSON Logging With MDC Correlation IDs

**One-line description:** Makes a Spring Boot or plain servlet Java service emit JSON logs through Logback with `request_id` in the MDC set by a servlet filter, `trace_id`/`span_id` injected by the OpenTelemetry Java agent, and MDC copied across thread pools, then proves it with a request and a JSON parse.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Absolute path to the Maven or Gradle project.
- `service_name` (string, required): Value for the `service` field.
- `log_level_policy` (object, required): Output of `obs-log-level-policy`.

---

## Outputs

- `logging_change` (object): Files changed, the diff, the verification command, and one captured JSON log line with `request_id` and `trace_id`.

---

## Phase 1: Choose And Configure The JSON Encoder

### Entry Criteria
- Build passes: `./mvnw -q verify` or `./gradlew build`; save the test summary.

### Actions
1. Find the Spring Boot version: `rg -n "spring-boot" pom.xml build.gradle* | head`.
2. Pick the encoder with this table:

| Situation | Choice |
|---|---|
| Spring Boot 3.4 or later | Built-in structured logging: set `logging.structured.format.console=logstash` (or `ecs`) in `application.properties` |
| Spring Boot below 3.4, or no Spring | `net.logstash.logback:logstash-logback-encoder` with `LogstashEncoder` |

3. For the encoder route, add the dependency (Maven):
```xml
<dependency>
  <groupId>net.logstash.logback</groupId>
  <artifactId>logstash-logback-encoder</artifactId>
  <version><!-- latest from Maven Central; check https://central.sonatype.com --></version>
</dependency>
```
and create `src/main/resources/logback-spring.xml` (or `logback.xml` without Spring):
```xml
<configuration>
  <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <customFields>{"service":"checkout-api"}</customFields>
    </encoder>
  </appender>
  <root level="${LOG_LEVEL:-INFO}"><appender-ref ref="JSON"/></root>
</configuration>
```
`LogstashEncoder` writes every MDC entry as a top-level JSON field by default.
4. Do not pin a version number you have not looked up. Read it from Maven Central.

### Output
JSON encoder configured.

### Quality Gate
- Starting the app prints startup lines that `jq -c .` parses without error (`java -jar target/app.jar 2>&1 | head -5 | jq -c .`).

---

## Phase 2: request_id Filter And Thread Propagation

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Add ONE class `RequestIdFilter`:
```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {
  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String id = Optional.ofNullable(req.getHeader("X-Request-ID")).filter(s -> !s.isBlank())
        .orElse(UUID.randomUUID().toString());
    MDC.put("request_id", id);
    res.setHeader("X-Request-ID", id);
    try { chain.doFilter(req, res); }
    finally { MDC.remove("request_id"); }
  }
}
```
2. The `finally` block is required. Servlet threads are pooled; without it, the next request on that thread inherits the old ID.
3. MDC is thread-local. For `@Async`, `CompletableFuture.supplyAsync` with an executor, or any `ExecutorService`, add a `TaskDecorator`:
```java
public class MdcTaskDecorator implements TaskDecorator {
  public Runnable decorate(Runnable r) {
    Map<String,String> ctx = MDC.getCopyOfContextMap();
    return () -> { if (ctx != null) MDC.setContextMap(ctx); try { r.run(); } finally { MDC.clear(); } };
  }
}
```
and set it on each `ThreadPoolTaskExecutor` with `setTaskDecorator(new MdcTaskDecorator())`.
4. WebFlux (reactive) does not use servlet threads; this filter does not apply. Record it as an open question and use Reactor context propagation per the Spring docs.

### Output
Filter and decorator.

### Quality Gate
- `rg -n "MDC.remove\(\"request_id\"\)" src/main` returns one hit inside a `finally` block.
- Build and tests pass with the same count.

---

## Phase 3: Trace IDs And Verification

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Use this table for trace IDs in MDC:

| Tracing setup | MDC keys | Action |
|---|---|---|
| OpenTelemetry Java agent (`obs-java-otel-agent-setup`) | `trace_id`, `span_id`, `trace_flags` | none; the agent's Logback MDC instrumentation injects them |
| Micrometer Tracing (Spring Boot actuator) | `traceId`, `spanId` | keep, or rename in the encoder; record the key names in `logging_change` |
| Neither | none | run `obs-java-otel-agent-setup` first |

2. Do not run both the OTel agent and a second tracing library that writes different IDs into the MDC; logs would carry two unrelated trace IDs.
3. Start the app with the agent and send `curl -s -D - -o /dev/null -H "X-Request-ID: verify-123" localhost:8080/orders`.
4. Grab the matching line: `<app stdout> | rg '"request_id":"verify-123"' | head -1 | jq .`
5. Convert string-concatenated log calls (`log.info("order " + id)`) to parameterized ones (`log.info("order created {}", kv("order_id", id))` with `StructuredArguments.kv`, or plain `{}` placeholders) one file at a time, running tests after each.

### Output
`logging_change`.

### Quality Gate
- Response headers include `X-Request-ID: verify-123`.
- The parsed line has `request_id`, `trace_id` (32 hex) and `service`.
- `./mvnw -q verify` or `./gradlew build` passes.

---

## Worked Example

Illustrative only.

Input: Spring Boot 3.3 service, OTel agent attached.
```
$ java -javaagent:otel/opentelemetry-javaagent.jar -jar target/checkout.jar 2>&1 | rg verify-123 | head -1 | jq .
{
  "@timestamp": "2026-10-20T14:09:30.118Z",
  "@version": "1",
  "message": "orders listed",
  "logger_name": "com.example.checkout.OrderController",
  "thread_name": "http-nio-8080-exec-3",
  "level": "INFO",
  "request_id": "verify-123",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "trace_flags": "01",
  "service": "checkout-api"
}
```

---

## Exit Criteria

DONE when a live request produces a JSON line with `request_id` and `trace_id`, the MDC is cleared in `finally`, executors propagate MDC, and the build passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Two Logback configs present (`logback.xml` and `logback-spring.xml`) | **Stop**: report both; ask which is authoritative. Do not delete either. |
| Phase 2 | `request_id` missing on async lines | **Adjust**: that executor lacks the `TaskDecorator`; add it. |
| Phase 3 | `trace_id` missing with the agent attached | **Adjust**: check the agent log for "logback" instrumentation being disabled (`OTEL_INSTRUMENTATION_LOGBACK_MDC_ENABLED`); enable it. |
| Phase 3 | Build fails after a call-site change | **Retry**: revert that file and redo. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
