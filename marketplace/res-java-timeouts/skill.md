# Java Client Timeouts From the Timeout Plan

**One-line description:** Applies planned connect, read and call timeouts to JVM clients (java.net.http.HttpClient, Spring RestClient/RestTemplate/WebClient, OkHttp, HikariCP plus the PostgreSQL JDBC driver, gRPC-java, Lettuce) and proves each fires with a WireMock fixed-delay stub or pg_sleep.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `service_repo` (string, required): Path to the Maven or Gradle project.
- `timeout_plan` (object[], required): Output of `res-timeout-budget`.

---

## Outputs

- `timeout_changes` (object[]): One row per client: dependency name, file:line or property key, setting with exact value and unit, test name, and the build tool's test result line.

---

## Phase 1: Inventory Clients and Defaults

### Entry Criteria
- Baseline `./mvnw -q test` or `./gradlew test` passes; save the "Tests run" summary.

### Actions
1. Run `rg -n "HttpClient\.newBuilder|HttpRequest\.newBuilder|RestTemplate|RestClient\.(builder|create)|WebClient\.(builder|create)|new OkHttpClient|OkHttpClient\.Builder|ManagedChannelBuilder|HikariConfig|spring\.datasource|RedisClient\.create|LettuceClientConfiguration" --type java --type kotlin` and `rg -n "timeout|Timeout" -g "application*.yml" -g "application*.properties"`.
2. Record the effective default per client (verify against the docs of the pinned version):

| Client | Setting | Default |
|---|---|---|
| `java.net.http.HttpClient` | `connectTimeout(Duration)` on builder; `timeout(Duration)` on each `HttpRequest` | none for both |
| OkHttp | `connectTimeout`, `readTimeout`, `writeTimeout`, `callTimeout` | 10 s, 10 s, 10 s, 0 (none) |
| Spring `SimpleClientHttpRequestFactory` | `setConnectTimeout`, `setReadTimeout` | JDK `HttpURLConnection` defaults (infinite) |
| Reactor Netty (WebClient) | `ChannelOption.CONNECT_TIMEOUT_MILLIS`, `responseTimeout(Duration)` | 30000 ms connect; no response timeout |
| HikariCP | `connectionTimeout` (wait for a pool connection) | 30000 ms |
| PostgreSQL JDBC (pgjdbc) | `connectTimeout`, `socketTimeout` (seconds, URL params) | 10 s connect, 0 (infinite) socket |
| gRPC-java | `stub.withDeadlineAfter(n, unit)` | none |
| Lettuce | `ClientOptions.timeoutOptions` / `RedisURI.setTimeout` | 60 s command timeout |

### Output
Client list with file:line and effective defaults.

### Quality Gate
- Every client named in `timeout_plan` has a row with file:line or property key.

---

## Phase 2: Apply Timeouts, One Dependency per Change

### Entry Criteria
- List exists.

### Actions
1. One dependency per change; run the tests after each.
2. Put values in configuration, not literals: `clients.payments.per-try=750ms` bound with `@ConfigurationProperties` (Spring converts `Duration` from `750ms`).
3. JDK HttpClient: `HttpClient.newBuilder().connectTimeout(connect).build()` and on every request `HttpRequest.newBuilder(uri).timeout(perTry)`. Builder-only timeout does not limit the response wait.
4. Spring Boot 3.2+ RestClient: build a factory explicitly, for example `new JdkClientHttpRequestFactory(httpClient)` then `factory.setReadTimeout(perTry)`, and pass it to `RestClient.builder().requestFactory(factory)`. Check the Spring Framework docs for the factory classes in your version; Spring Boot 3.4 also adds `spring.http.client.connect-timeout` and `spring.http.client.read-timeout` properties.
5. WebClient: `HttpClient.create().option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectMs).responseTimeout(perTry)` from `reactor.netty.http.client`, wrapped in `ReactorClientHttpConnector`.
6. OkHttp: `new OkHttpClient.Builder().connectTimeout(connect).readTimeout(perTry).callTimeout(perTry).build()`. `callTimeout` bounds the whole call including retries OkHttp performs internally.
7. JDBC: append `?connectTimeout=<s>&socketTimeout=<s>` to the URL (seconds) and set a server-side limit with `options=-c%20statement_timeout%3D<ms>` or `SET statement_timeout`. `socketTimeout` is a last-resort socket cutoff; `statement_timeout` cancels the query cleanly. Keep `spring.datasource.hikari.connection-timeout` at its default unless the plan gives a pool wait value.
8. gRPC: `stub.withDeadlineAfter(Math.min(perTryMs, remainingMs), TimeUnit.MILLISECONDS)` per call. Create the deadline per call; a stub with a deadline set once at startup expires for every later call.
9. If the plan's connect value is an "open question", keep the documented default and record it. Do NOT invent a value.

### Output
Edited configuration and client builders.

### Quality Gate
- Every planned dependency has its timeout in a configuration property (show the `rg` hit for the key).
- The build's tests pass after each change; "Tests run" is not lower than the baseline.

---

## Phase 3: Prove Each Timeout Fires

### Entry Criteria
- Changes applied.

### Actions
1. HTTP clients: use WireMock (`org.wiremock:wiremock` 3.x) with a delay longer than the per-try value:
   ```java
   @RegisterExtension
   static WireMockExtension wm = WireMockExtension.newInstance().options(wireMockConfig().dynamicPort()).build();

   @Test
   void paymentsReadTimeout() {
       wm.stubFor(post("/charge").willReturn(ok().withFixedDelay(PLAN_PER_TRY_MS + 1000)));
       var client = paymentsClientFactory.create(wm.baseUrl()); // the real factory
       long start = System.nanoTime();
       assertThrows(HttpTimeoutException.class, () -> client.charge(req));
       assertTrue(Duration.ofNanos(System.nanoTime() - start).toMillis() < PLAN_PER_TRY_MS + 500);
   }
   ```
2. Expected exceptions: JDK client `java.net.http.HttpTimeoutException`; OkHttp `java.io.InterruptedIOException` ("timeout") or `SocketTimeoutException`; Spring wraps as `ResourceAccessException`; Reactor Netty `io.netty.handler.timeout.ReadTimeoutException` wrapped in `WebClientRequestException`; JDBC `org.postgresql.util.PSQLException` with SQLState `57014` (test via Testcontainers PostgreSQL and `SELECT pg_sleep(n)`); gRPC `StatusRuntimeException` with `Status.Code.DEADLINE_EXCEEDED`.
3. Run `./mvnw -q -Dtest='*Timeout*' test` or `./gradlew test --tests '*Timeout*'` and save the result.

### Output
`timeout_changes` with test names and results.

### Quality Gate
- Every changed dependency has a passing timeout test in the saved output.
- `rg -n "@Disabled" src/test` shows no new hits compared with the baseline.

---

## Worked Example

Illustrative. Plan: `payments` per try 750 ms, connect 200 ms (measured); `postgres` 45 ms.

Phase 1 finds `PaymentsConfig.java:22 RestClient.create(baseUrl)` (no timeouts) and `spring.datasource.url=jdbc:postgresql://db:5432/app` with no `socketTimeout`.

Phase 2: `application.yml` gets `clients.payments.connect: 200ms` and `clients.payments.per-try: 750ms`; `PaymentsConfig` builds `HttpClient.newBuilder().connectTimeout(props.connect())` and a `JdkClientHttpRequestFactory` with `setReadTimeout(props.perTry())`. JDBC URL gains `?options=-c%20statement_timeout%3D45`.

Phase 3: `./mvnw -q -Dtest='*Timeout*' test` prints `Tests run: 2, Failures: 0, Errors: 0, Skipped: 0`.

---

## Exit Criteria

DONE when every JVM client for a planned dependency has configured timeouts from the plan, held in properties, with a passing test per dependency proving the exception is raised in time.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Baseline tests red | **Stop**: report the failures before changing timeouts. |
| Phase 2 | Spring factory class not found in this version | **Adjust**: check the Spring Framework reference for `ClientHttpRequestFactory` implementations in the pinned version; do not copy an API from another major version. |
| Phase 3 | WireMock delay test passes too slowly | **Adjust**: the read timeout is not applied to the request in use; check the factory is actually passed to the builder. |
| Phase 3 | Docker unavailable for Testcontainers | **Return**: record the JDBC timeout as configured but unproven; list it as an open item. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
