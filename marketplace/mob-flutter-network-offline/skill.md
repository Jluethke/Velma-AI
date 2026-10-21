# Flutter Retry and Offline Cache

**One-line description:** Implements the network policy in Flutter with one `Dio` instance, a single retry interceptor configured from the policy (or `package:http` `RetryClient` when the app uses `http`), cache fallback through the local database or `dio_cache_interceptor`, `connectivity_plus` only as a replay trigger, and tests with a stub `HttpClientAdapter`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `network_policy` (object, required): From `mob-network-retry-policy`.

---

## Outputs

- `flutter_network_layer` (object): Paths of the client factory, retry interceptor, connectivity watcher, outbox; per-rule test results.

---

## Phase 1: Client and Retry

### Entry Criteria
- `app_profile.stack` is `flutter`.
- Networking library known from `app_profile`: `dio` or `http`.

### Actions
1. Branch:

| Library | Retry mechanism |
|---|---|
| `dio` | One `QueuedInterceptor`/`Interceptor` you write, or `dio_smart_retry` `RetryInterceptor` if already in `pubspec.yaml` |
| `http` | `RetryClient` from `package:http/retry.dart` with `retries`, `when`, `whenError`, `delay` callbacks |

2. Dio client, created once and injected:
```dart
final dio = Dio(BaseOptions(
  baseUrl: base,
  connectTimeout: Duration(milliseconds: policy.connectMs),   // no default timeout unless set; record the value
  receiveTimeout: Duration(milliseconds: policy.receiveMs),
));
dio.interceptors.add(PolicyRetryInterceptor(dio, policy));
```
3. Retry interceptor `onError(DioException err, handler)`:

| `err.type` / status | Action |
|---|---|
| `connectionError`, `connectionTimeout`, `receiveTimeout`, `sendTimeout` | retry if endpoint retryable |
| `badResponse` with status in `retry_on` | retry; read `err.response?.headers.value('retry-after')` |
| `cancel` | `handler.next(err)`, never retry |
| other | `handler.next(err)` |

   Store the attempt count in `err.requestOptions.extra['attempt']`, wait with `await Future.delayed(...)` using full jitter or `Retry-After`, then `handler.resolve(await dio.fetch(err.requestOptions))`. Stop when `attempt + 1 >= maxAttempts`.
4. Only one retry layer: do not add `dio_smart_retry` and a custom interceptor together.
5. Do NOT set `badCertificateCallback` to return true to get past TLS errors.

### Output
Client and interceptor.

### Quality Gate
- `flutter analyze` reports no new issues.
- `grep -rn "Dio(" lib | wc -l` prints 1 (single instance), or each extra instance is justified in a comment.

---

## Phase 2: Offline Reads and Outbox

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Reads with `serve_cache`:

| Data already in local DB (`drift`/`sqflite`) | Use |
|---|---|
| Yes | Repository returns a DB `Stream`; network refresh writes to the DB; on failure keep the stream and mark stale |
| No | `dio_cache_interceptor` with a persistent store, policy `CachePolicy.request`, and fallback to cache on network errors |

   The `CacheOptions` parameter that enables "serve cache on error" was renamed between major versions of `dio_cache_interceptor` (`hitCacheOnErrorExcept` in 3.x, `hitCacheOnErrorCodes`/`hitCacheOnNetworkFailure` in 4.x). Read the README of the version in `pubspec.lock`; do not guess the name.
2. Connectivity: `Connectivity().onConnectivityChanged` emits `List<ConnectivityResult>` since `connectivity_plus` 6.0 (a single value before). It reports the interface, not internet access; use it only to trigger outbox replay and `ConnectivityRestored`, never to skip a request.
3. Outbox for `outbox` endpoints: a DB table with `id` (UUID used as `Idempotency-Key`), method, path, body JSON, created time. Insert before sending; delete after 2xx; replay in insertion order on connectivity change and app start. For replay while the app is backgrounded see `mob-android-workmanager` and `mob-ios-background-tasks` (the `workmanager` plugin).

### Output
Repository changes and outbox.

### Quality Gate
- `flutter analyze` clean.
- Outbox insert happens before the request: in code, the `insert` call line precedes the `dio.request` line in the same function.

---

## Phase 3: Tests With a Stub Adapter

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Implement `class StubAdapter implements HttpClientAdapter` returning queued `ResponseBody.fromString(body, status, headers: {...})` or throwing `DioException(type: DioExceptionType.connectionError, ...)`; set `dio.httpClientAdapter = StubAdapter(...)`. `http_mock_adapter` is fine if already present.
2. Inject a delay function into the interceptor so tests do not wait real time.
3. Tests: 503 then 200 succeeds with 2 calls; 400 single call; `Retry-After: 2` produces a 2 s requested delay; POST without key single call; cancel via `CancelToken` stops retries; offline read returns DB rows marked stale.
4. Run `flutter test test/network`.

### Output
`flutter_network_layer`.

### Quality Gate
- `All tests passed!` and each test asserts the adapter's call count.

---

## Worked Example

Illustrative only. `dio: ^5.7.0`, `drift` present, policy `GET /v1/orders` retry on 502/503/504, 4 attempts.

Phase 2: orders read from drift stream; no HTTP cache package added.

Phase 3:
```
$ flutter test test/network
00:01 +6: All tests passed!
```

---

## Exit Criteria

DONE when one client carries one retry layer that follows the policy, offline reads come from the DB or HTTP cache marked stale, outbox writes persist before sending, and stub-adapter tests prove each rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Retries never stop | **Adjust**: the attempt counter is not carried in `requestOptions.extra`; each retry restarts at zero. |
| Phase 1 | `DioException [connection error]` on Android emulator to localhost | **Adjust**: use `10.0.2.2` for the host machine; not a retry problem. |
| Phase 2 | Cache option name not found | **Adjust**: read the README for the installed major version. |
| Phase 3 | Test waits real seconds | **Adjust**: inject the delay function. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
