# Android OkHttp Retry and Offline Cache

**One-line description:** Implements the network policy on Android with an OkHttp disk `Cache`, `CacheControl.FORCE_CACHE` fallback for offline reads, a single coroutine retry loop in the repository (not a blocking interceptor) that honors `Retry-After`, a `ConnectivityManager` callback for replay, a Room-backed outbox drained by WorkManager, and `MockWebServer` tests for each rule.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `network_policy` (object, required): From `mob-network-retry-policy`.

---

## Outputs

- `android_network_layer` (object): Paths of the client module, retry helper, connectivity observer, outbox DAO and worker; test class path; per-rule results.

---

## Phase 1: Client and Disk Cache

### Entry Criteria
- `app_profile.libraries.networking` is OkHttp or Retrofit (Retrofit uses OkHttp). If it is Ktor, keep the same rules with Ktor's `HttpRequestRetry` plugin and stop following the OkHttp specifics.

### Actions
1. Build one `OkHttpClient` per process (singleton in DI); never `OkHttpClient()` per request (each has its own connection pool and cache).
```kotlin
val client = OkHttpClient.Builder()
    .cache(Cache(File(context.cacheDir, "http_cache"), cacheBytes))   // cacheBytes from network_policy
    .connectTimeout(connectS, TimeUnit.SECONDS)    // OkHttp default 10 s; set only if the policy changed it
    .readTimeout(readS, TimeUnit.SECONDS)
    .build()
```
2. `retryOnConnectionFailure` defaults to true and silently retries some connection-level failures (for example a stale pooled connection). Record that in `network_policy` notes; the app loop below handles HTTP statuses and must not duplicate connection retries more than the policy allows.
3. Offline read for `serve_cache` endpoints: after an `IOException`, repeat the call with `.cacheControl(CacheControl.FORCE_CACHE)`. A cache miss returns HTTP 504 from OkHttp itself (`Unsatisfiable Request (only-if-cached)`); map that to `Error(kind=offline)`.
4. If the project stores the data in Room, prefer the database as the source of truth and skip HTTP cache for that endpoint (record which one is used).
5. Do NOT add `android:usesCleartextTraffic="true"` or a `network_security_config` with `cleartextTrafficPermitted="true"` to fix a connection.

### Output
Client module.

### Quality Gate
- `grep -rn "OkHttpClient()" app/src/main` prints only the DI provider.
- `./gradlew :app:assembleDebug` exits 0.

---

## Phase 2: Repository Retry Loop

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Classify:

| Failure | Class |
|---|---|
| `java.net.UnknownHostException`, `ConnectException`, `SocketTimeoutException`, `javax.net.ssl.SSLHandshakeException` during connect | transient/offline, retryable |
| `retrofit2.HttpException` with `code()` in `retry_on` (or OkHttp `Response.code`) | retryable |
| `kotlinx.coroutines.CancellationException` | rethrow, never retry |
| JSON decode exceptions (`kotlinx.serialization.SerializationException`, `JsonDataException`) | not retryable |

2. Retry in the repository with `delay()`, so waiting suspends instead of blocking an OkHttp dispatcher thread:
```kotlin
suspend fun <T> withPolicy(p: EndpointPolicy, block: suspend () -> Response<T>): Response<T> {
    var attempt = 0
    while (true) {
        val r: Response<T>? = try { block() } catch (e: IOException) { if (attempt + 1 >= p.maxAttempts) throw e; null }
        if (r != null && (r.code() !in p.retryOn || attempt + 1 >= p.maxAttempts)) return r
        val ra = r?.headers()?.get("Retry-After")?.toLongOrNull()
        delay(if (ra != null && p.honorRetryAfter) ra * 1000 else Random.nextLong(0, minOf(p.capMs, p.baseMs shl attempt) + 1))
        attempt++
    }
}
```
   `Retry-After` can also be an HTTP date; parse it with `java.time` (`DateTimeFormatter.RFC_1123_DATE_TIME`) when `toLongOrNull()` is null.
3. Do NOT put `Thread.sleep` inside an `Interceptor`. Do NOT catch `Exception` broadly around `block()`; it swallows `CancellationException`.
4. Outbox: Room entity `OutboxRequest(id: String /* UUID = Idempotency-Key */, method, path, body, createdAt)`. Insert before the first attempt; delete after 2xx. A `CoroutineWorker` (see `mob-android-workmanager`) drains it with `Constraints(requiredNetworkType = NetworkType.CONNECTED)` and enqueues with `enqueueUniqueWork("outbox", ExistingWorkPolicy.KEEP, ...)`.

### Output
Retry helper and outbox.

### Quality Gate
- `grep -rn "Thread.sleep" app/src/main` prints nothing.
- `./gradlew :app:compileDebugKotlin` exits 0.

---

## Phase 3: Connectivity and MockWebServer Tests

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Connectivity observer: `connectivityManager.registerDefaultNetworkCallback(callback)`; in `onCapabilitiesChanged`, treat the network as usable only when `NetworkCapabilities.NET_CAPABILITY_VALIDATED` is present. Expose as `callbackFlow` and `unregisterNetworkCallback` in `awaitClose`. Requires `android.permission.ACCESS_NETWORK_STATE` in the manifest.
2. Add `com.squareup.okhttp3:mockwebserver` at the same version as OkHttp (`testImplementation`). Its API differs between OkHttp 4 (`okhttp3.mockwebserver`) and 5 (`mockwebserver3`); check the version you have.
3. Tests, one per rule: enqueue `MockResponse().setResponseCode(503)` then `200`, assert `server.requestCount == 2`; 503 with `Retry-After: 1`; 400 not retried (`requestCount == 1`); POST without key attempted once; offline cache fallback: serve 200 with `Cache-Control: max-age=60`, shut down the server, call again with FORCE_CACHE path, assert cached body. Use `runTest` with a test dispatcher so `delay()` is virtual time.
4. Run `./gradlew :app:testDebugUnitTest --tests "*NetworkPolicyTest"`.

### Output
`android_network_layer`.

### Quality Gate
- `BUILD SUCCESSFUL`; XML report shows `failures="0"` and one test per policy rule.
- Each test asserts `requestCount`; `grep -c "requestCount" NetworkPolicyTest.kt` is at least the number of retry rules.

---

## Worked Example

Illustrative only. OkHttp 4.12.0, Retrofit 2.11.0, policy for `GET /v1/orders` retry on 502/503/504, 4 attempts.

Phase 1: 10 MiB cache (user choice), default timeouts kept.

Phase 3:
```
$ ./gradlew :app:testDebugUnitTest --tests "*NetworkPolicyTest"
NetworkPolicyTest > serviceUnavailable_thenOk_retriesOnce PASSED
NetworkPolicyTest > badRequest_notRetried PASSED
NetworkPolicyTest > offline_servesForceCache PASSED
NetworkPolicyTest > post_withoutKey_singleAttempt PASSED
BUILD SUCCESSFUL in 21s
```

---

## Exit Criteria

DONE when one client with a disk cache, one suspend retry loop, a validated-network observer and a persisted outbox implement the policy, and MockWebServer tests prove each rule with request counts.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | FORCE_CACHE always returns 504 | **Adjust**: server sends `no-store` or `private` is blocked by an interceptor; inspect `response.cacheResponse`/`networkResponse`, or use the Room table as cache. |
| Phase 2 | Coroutine cancellation ignored | **Adjust**: a broad `catch (e: Exception)` swallowed it; narrow to `IOException`. |
| Phase 3 | `NetworkOnMainThreadException` in tests | **Adjust**: call through the suspend API with `Dispatchers.IO` injected, not `execute()` on main. |
| Phase 3 | MockWebServer imports do not resolve | **Adjust**: align its version with OkHttp and use the package for that major version. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
