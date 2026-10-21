# Java Retries With Resilience4j Retry and Full Jitter

**One-line description:** Implements the retry policy on the JVM with resilience4j-retry (Spring Boot instance properties, a RetryConfigCustomizer for full-jitter and Retry-After intervals, retryExceptions and ignoreExceptions, a budget gate), checks the aspect order and proxy pitfalls, and proves call counts with WireMock scenarios.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the Maven or Gradle project.
- `retry_policy` (object[], required): Output of `res-retry-policy`.

---

## Outputs

- `retry_changes` (object[]): One row per dependency: instance name, properties written, customizer class, layers removed, test names, and test result lines.

---

## Phase 1: Dependencies and Duplicate Layers

### Entry Criteria
- Baseline `./mvnw -q test` or `./gradlew test` passes; save the "Tests run" line.

### Actions
1. Confirm the artifacts: Spring Boot 3 uses `io.github.resilience4j:resilience4j-spring-boot3` plus `org.springframework.boot:spring-boot-starter-aop` (annotations do nothing without AOP). Check `./mvnw dependency:tree | rg resilience4j` or `./gradlew dependencies | rg resilience4j`.
2. Remove each `layers_to_disable` entry: Spring Retry `@Retryable`, manual loops, OkHttp `retryOnConnectionFailure(true)` where the policy moves retries elsewhere (OkHttp default is true), Feign `Retryer` beans. One per change; run tests after each.
3. For AWS SDK v2 as owning layer, set `ClientOverrideConfiguration.builder().retryStrategy(...)` per the SDK docs for your version and remove app retries.

### Output
Dependencies present; single retry layer.

### Quality Gate
- `rg -n "@Retryable|Retryer|retryOnConnectionFailure" src/main` shows none for planned dependencies (or only the owning layer).

---

## Phase 2: Configure the Instance

### Entry Criteria
- resilience4j and AOP on the classpath.

### Actions
1. Properties (`application.yml`), values from `retry_policy`:
   ```yaml
   resilience4j:
     retry:
       instances:
         payments:
           max-attempts: 2            # counts the first call (resilience4j default 3)
           retry-exceptions:
             - java.net.ConnectException
             - java.net.http.HttpConnectTimeoutException
             - com.example.payments.RetryableStatusException
           ignore-exceptions:
             - com.example.payments.ClientErrorException
   ```
2. resilience4j's built-in randomized exponential interval (`enable-randomized-wait`) multiplies by `1 +/- randomized-wait-factor`; it is not full jitter. Add full jitter and `Retry-After` in a customizer bean:
   ```java
   @Bean
   RetryConfigCustomizer paymentsRetry(PaymentsProps p, RetryBudget budget) {
     return RetryConfigCustomizer.of("payments", b -> b
       .intervalBiFunction((Integer attempt, Either<Throwable, Object> r) -> {
         if (r.isLeft() && r.getLeft() instanceof RetryableStatusException e && e.retryAfterMs() > 0) return e.retryAfterMs();
         long ceil = Math.min(p.capMs(), p.baseMs() << (attempt - 1));
         return ThreadLocalRandom.current().nextLong(0, ceil + 1);
       })
       .retryOnException(t -> isRetryable(t) && budget.tryRetry()));
   }
   ```
   Check the `RetryConfig.Builder` methods (`intervalBiFunction`, `retryOnException`) exist in the installed version's Javadoc before compiling. `retryOnException` replaces `retry-exceptions`, so put the class checks into `isRetryable`.
3. Annotate the client method: `@Retry(name = "payments")`. Call it from ANOTHER bean. A call from the same class (`this.charge()`) bypasses the Spring proxy and does not retry.
4. Throw `RetryableStatusException` for 502/503/504/408/429 inside the method (parse `Retry-After` seconds into `retryAfterMs`), and `ClientErrorException` for other 4xx.
5. Generate the idempotency key in the caller and pass it in; the annotated method body runs again on each attempt.
6. If the same method also has `@CircuitBreaker`, the default aspect order is Retry outside CircuitBreaker, so each retry passes through the breaker. Keep this order unless the policy says otherwise; it is set by `resilience4j.retry.retry-aspect-order` and `resilience4j.circuitbreaker.circuit-breaker-aspect-order` (check the docs for your version).

### Output
Instance properties and customizer.

### Quality Gate
- `./mvnw -q compile` or `./gradlew compileJava` succeeds.
- `curl -s localhost:<port>/actuator/retries` (with `management.endpoints.web.exposure.include=retries,retryevents`) lists the `payments` instance when the app runs.

---

## Phase 3: Budget and Tests

### Entry Criteria
- Configuration compiles.

### Actions
1. Budget component (thread-safe; `ratio` and `maxTokens` from `retry_policy.budget`). resilience4j has no retry budget of its own:
   ```java
   @Component
   final class RetryBudget {
     private final double ratio, max; private double tokens;
     RetryBudget(PaymentsProps p) { ratio = p.budgetRatio(); max = p.budgetMax(); tokens = max; }
     synchronized void onRequest() { tokens = Math.min(max, tokens + ratio); }
     synchronized boolean tryRetry() { if (tokens >= 1) { tokens -= 1; return true; } return false; }
   }
   ```
   Call `onRequest()` in the caller before the annotated method.
2. Spring Boot test with WireMock scenarios and zero waits (`p.baseMs()` = 0 in the test profile):
   ```java
   wm.stubFor(post("/charge").inScenario("r").whenScenarioStateIs(Scenario.STARTED)
       .willReturn(status(503)).willSetStateTo("ok"));
   wm.stubFor(post("/charge").inScenario("r").whenScenarioStateIs("ok").willReturn(okJson("{\"ok\":true}")));
   service.charge(body, "k1");
   wm.verify(2, postRequestedFor(urlEqualTo("/charge")).withHeader("Idempotency-Key", equalTo("k1")));
   ```
3. Add tests: each `never_retry_on` code (verify 1), exhaustion (verify `max-attempts`), empty budget (verify 1), and a self-invocation guard test that calls through the bean.
4. Run `./mvnw -q -Dtest='*Retry*' test` or `./gradlew test --tests '*Retry*'`, and save output.

### Output
`retry_changes` with tests.

### Quality Gate
- All retry tests pass with `verify(<n>, ...)` exact counts.
- No new `@Disabled` (`rg -n "@Disabled" src/test` matches the baseline).

---

## Worked Example

Illustrative. Policy: `payments` `max_attempts` 2, base 100 ms, cap 1000 ms, budget ratio 0.2, max 10 (user input). Owning layer app; `layers_to_disable`: `PaymentsClient.java:31 @Retryable(maxAttempts = 3)`.

Phase 1 removes `@Retryable` and the `spring-retry` dependency if nothing else uses it (`rg -n "@Retryable|@EnableRetry"` returns nothing). Phase 2 adds the YAML and `RetryConfigCustomizer`. Phase 3: `./mvnw -q -Dtest='*Retry*' test` prints `Tests run: 5, Failures: 0, Errors: 0, Skipped: 0`; `curl -s localhost:8080/actuator/retryevents/payments` after the test run shows a `RETRY` event followed by `SUCCESS`.

---

## Exit Criteria

DONE when each dependency's retries are one resilience4j instance matching the policy, with full jitter, Retry-After, a budget, correct proxy usage, and WireMock tests verifying exact call counts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | AOP starter missing | **Adjust**: add `spring-boot-starter-aop`; without it `@Retry` is ignored silently. |
| Phase 2 | Builder method not found | **Adjust**: read the resilience4j Javadoc for the installed version and use its equivalent; do not invent a method. |
| Phase 3 | `verify` shows 1 call where 2 were expected | **Adjust**: check for self-invocation or a missing `retry-exceptions` entry. |
| Phase 3 | Retries on 4xx | **Stop**: fix `isRetryable` and `ignore-exceptions` first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
