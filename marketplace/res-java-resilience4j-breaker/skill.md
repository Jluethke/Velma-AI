# Java Circuit Breaker With Resilience4j

**One-line description:** Implements the breaker policy on the JVM with resilience4j-circuitbreaker Spring Boot instance properties (sliding window type and size, minimum calls, failure and slow-call thresholds, open wait, half-open permits, record and ignore exceptions), exposes state through Actuator and Micrometer without wiring it into readiness, and proves transitions with registry-driven tests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the Maven or Gradle project.
- `breaker_policy` (object[], required): Output of `res-breaker-policy`.

---

## Outputs

- `breaker_changes` (object[]): One row per dependency: instance name, properties written with sources, annotation location, metrics and endpoints checked, test names, and results.

---

## Phase 1: Write Instance Properties

### Entry Criteria
- `resilience4j-spring-boot3` and `spring-boot-starter-aop` on the classpath (`./mvnw dependency:tree | rg "resilience4j|aop"`).
- Baseline tests pass.

### Actions
1. Map each field to properties (resilience4j docs; defaults in parentheses):
   ```yaml
   resilience4j:
     circuitbreaker:
       instances:
         payments:
           sliding-window-type: TIME_BASED          # COUNT_BASED (default) or TIME_BASED
           sliding-window-size: 60                  # calls, or seconds when TIME_BASED (default 100)
           minimum-number-of-calls: 50              # (default 100)
           failure-rate-threshold: 50               # percent (default 50)
           slow-call-duration-threshold: 750ms      # (default 60000 ms)
           slow-call-rate-threshold: 100            # percent (default 100)
           wait-duration-in-open-state: 60s         # (default 60000 ms)
           permitted-number-of-calls-in-half-open-state: 10   # (default 10)
           automatic-transition-from-open-to-half-open-enabled: false   # (default false)
           record-exceptions:
             - java.net.ConnectException
             - java.net.http.HttpTimeoutException
             - com.example.payments.RetryableStatusException
           ignore-exceptions:
             - com.example.payments.ClientErrorException
   ```
2. Put a comment with the source next to every non-default value (`# source: user input 2026-10-20` or `# source: breaker_policy`).
3. When `record-exceptions` is set, only those exceptions (and subclasses) count as failures; everything else counts as success unless ignored. Confirm every class in `counts_as_failure` is listed.
4. `slow-call-rate-threshold` 100 means slow calls alone open the breaker only when every call in the window is slow. Use the policy value; do not lower it without a source.

### Output
Properties per dependency.

### Quality Gate
- Every numeric property either matches the documented default or has a source comment.
- No class from the policy's `never_counts` appears in `record-exceptions`.

---

## Phase 2: Apply and Expose

### Entry Criteria
- Properties written.

### Actions
1. Annotate the single-attempt method: `@CircuitBreaker(name = "payments")`. The `@Retry` from `res-java-resilience4j-retry` stays on the same method or an outer bean; the default aspect order runs Retry outside CircuitBreaker. Confirm the order properties if the project changed them.
2. Call the annotated method from another bean; self-invocation skips the proxy and the breaker.
3. Add `io.github.resilience4j.circuitbreaker.CallNotPermittedException` to the retry instance's `ignore-exceptions` (or to the predicate returning false) so retries do not hammer an open breaker.
4. Translate `CallNotPermittedException` at the web layer with an `@ExceptionHandler` to the policy's `open_error` (for example 503 with `Retry-After`), or to the fallback when the matrix from `res-graceful-degradation` exists.
5. Expose state: `management.endpoints.web.exposure.include=health,circuitbreakers,circuitbreakerevents,prometheus`. With Micrometer Prometheus registry, metrics include `resilience4j_circuitbreaker_state`, `resilience4j_circuitbreaker_calls_seconds_count{kind=...}` and `resilience4j_circuitbreaker_not_permitted_calls_total`.
6. Do NOT add the breaker health indicator to the Kubernetes readiness group (`management.endpoint.health.group.readiness.include`). An open breaker to one dependency would mark every pod not ready and remove all capacity. If `register-health-indicator: true` is wanted for dashboards, keep it out of the readiness and liveness groups.

### Output
Breakers active and observable.

### Quality Gate
- With the app running, `curl -s localhost:<port>/actuator/circuitbreakers` lists `payments` with state `CLOSED`.
- `rg -n "circuitbreakers" src/main/resources` shows no entry in a readiness or liveness health group.

---

## Phase 3: Prove Transitions

### Entry Criteria
- Breaker visible in Actuator.

### Actions
1. Spring Boot test with a test profile that shrinks values (`sliding-window-type: COUNT_BASED`, `sliding-window-size: 4`, `minimum-number-of-calls: 4`, `wait-duration-in-open-state: 100ms`, `permitted-number-of-calls-in-half-open-state: 1`) and WireMock as the dependency:
   ```java
   @Autowired CircuitBreakerRegistry registry;
   @Test void opensAndRejectsWithoutCalling() {
     wm.stubFor(post("/charge").willReturn(serverError()));
     for (int i = 0; i < 4; i++) assertThrows(Exception.class, () -> client.charge(body, "k" + i));
     assertEquals(CircuitBreaker.State.OPEN, registry.circuitBreaker("payments").getState());
     assertThrows(CallNotPermittedException.class, () -> client.charge(body, "k5"));
     wm.verify(4, postRequestedFor(urlEqualTo("/charge")));
   }
   ```
2. Add: half-open after the wait (call `registry.circuitBreaker("payments").transitionToHalfOpenState()` or sleep past the wait), one success closes; a half-open failure reopens; 4xx `ClientErrorException` never opens; slow calls open when `withFixedDelay` exceeds the slow-call threshold (test profile with `slow-call-rate-threshold` from policy).
3. Reset the breaker between tests: `registry.circuitBreaker("payments").reset()` in `@AfterEach`.
4. Run `./mvnw -q -Dtest='*Breaker*' test` or `./gradlew test --tests '*Breaker*'`, and save output.

### Output
`breaker_changes` with tests.

### Quality Gate
- Tests for open, reject without call (`verify(4, ...)`), half-open close, half-open reopen, 4xx ignored, and slow call all pass.
- No new `@Disabled` tests.

---

## Worked Example

Illustrative. Policy `payments`: TIME_BASED 60 s (user), min 50 (user), 50% (default), slow 750 ms (policy), open 60 s (default), probes 10 (default).

Phase 1 writes the YAML above. Phase 2: `curl -s localhost:8080/actuator/circuitbreakers` returns `{"circuitBreakers":{"payments":{"failureRate":"-1.0%","state":"CLOSED",...}}}` (failure rate -1 means fewer than minimum calls recorded). Phase 3: `./mvnw -q -Dtest='*Breaker*' test` prints `Tests run: 6, Failures: 0, Errors: 0, Skipped: 0`.

---

## Exit Criteria

DONE when each mapped dependency runs through a resilience4j breaker configured from the policy with sources, visible in Actuator and Prometheus, kept out of readiness, with retries ignoring `CallNotPermittedException`, and tests proving every transition.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Property key rejected at startup | **Adjust**: check the resilience4j Spring Boot docs for the installed version's key names. |
| Phase 2 | Actuator does not list the instance | **Adjust**: the bean was never invoked or AOP is missing; call the method once and check the AOP starter. |
| Phase 2 | Readiness group already includes circuit breakers | **Adjust**: remove it and record why. |
| Phase 3 | `verify` counts more calls than expected | **Adjust**: retries are running into the open breaker; add `CallNotPermittedException` to retry ignore list. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
