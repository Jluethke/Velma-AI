# iOS URLSession Retry and Offline Cache

**One-line description:** Implements the network policy on iOS with `URLSession` async/await: an explicitly sized `URLCache`, per-request cache policies for offline reads, a single retry loop that classifies `URLError` codes and honors `Retry-After`, `NWPathMonitor` only for replay triggers, and `URLProtocol` stubs that prove each rule in XCTest.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `network_policy` (object, required): From `mob-network-retry-policy`.

---

## Outputs

- `ios_network_layer` (object): File paths of the session factory, retry function, connectivity monitor and outbox; test file path; test results per policy rule.

---

## Phase 1: Session and Cache

### Entry Criteria
- `app_profile.stack` is `ios`, or the work is native iOS code inside a React Native or Flutter app.
- If `app_profile.libraries.networking` is Alamofire, use its `RetryPolicy`/`RequestInterceptor` instead of the loop below and keep the same rules.

### Actions
1. Create one session factory; do not use `URLSession.shared` for API calls (you cannot set its cache or protocol classes for tests).
```swift
enum APISession {
    static func make(protocolClasses: [AnyClass]? = nil) -> URLSession {
        let c = URLSessionConfiguration.default
        c.urlCache = URLCache(memoryCapacity: memBytes, diskCapacity: diskBytes, directory: cacheDir) // iOS 13+
        c.requestCachePolicy = .useProtocolCachePolicy   // honors server Cache-Control/ETag (RFC 9111)
        c.waitsForConnectivity = false                    // we classify failures ourselves
        if let p = protocolClasses { c.protocolClasses = p }
        return URLSession(configuration: c)
    }
}
```
   `memBytes` and `diskBytes` are user inputs from the policy; record them. Default `timeoutIntervalForRequest` is 60 s and `timeoutIntervalForResource` is 7 days (Apple documentation); change only if the policy says so.
2. Offline read for `serve_cache` endpoints: on a connectivity failure, retry once with `request.cachePolicy = .returnCacheDataDontLoad`. If that returns data, deliver it as stale (`Content(isStale=true)`). If it throws, deliver `Error(kind=offline)`.
3. Do NOT add `NSAllowsArbitraryLoads` to `Info.plist` to make a request work.

### Output
Session factory.

### Quality Gate
- `grep -rn "URLSession.shared" <Networking dir>` prints nothing for API code.
- Cache sizes in code match the values recorded in `network_policy`.

---

## Phase 2: Retry Loop and Error Classification

### Entry Criteria
- Phase 1 builds.

### Actions
1. Classify errors with this table:

| Error | Class |
|---|---|
| `URLError.notConnectedToInternet`, `.networkConnectionLost`, `.dataNotAllowed`, `.internationalRoamingOff` | offline (retryable, eligible for cache fallback) |
| `URLError.timedOut`, `.cannotConnectToHost`, `.cannotFindHost`, `.dnsLookupFailed` | transient (retryable) |
| `URLError.cancelled` or `CancellationError` | never retry, never show an error |
| HTTP status in `network_policy.retry_on` | retryable |
| anything else | not retryable |

2. One loop, used by every endpoint whose policy has `retry_on` non-empty:
```swift
func send(_ req: URLRequest, policy p: EndpointPolicy, session: URLSession) async throws -> (Data, HTTPURLResponse) {
    var attempt = 0
    while true {
        try Task.checkCancellation()
        do {
            let (data, resp) = try await session.data(for: req)
            let http = resp as! HTTPURLResponse
            guard p.retryOn.contains(http.statusCode), attempt + 1 < p.maxAttempts else { return (data, http) }
            try await Task.sleep(nanoseconds: delayNs(attempt, p, retryAfter: http.value(forHTTPHeaderField: "Retry-After")))
        } catch let e as URLError where isRetryable(e) && attempt + 1 < p.maxAttempts {
            try await Task.sleep(nanoseconds: delayNs(attempt, p, retryAfter: nil))
        }
        attempt += 1
    }
}
```
   `delayNs` returns `Retry-After` seconds when present and `p.honorRetryAfter`, otherwise `UInt64.random(in: 0...min(cap, base << attempt)) * 1_000_000`.
3. `Task.sleep` throws on cancellation, so leaving the screen stops the loop. Do not replace it with `Thread.sleep` or `DispatchQueue.asyncAfter`.
4. Outbox endpoints: persist the request body, method, path and `Idempotency-Key` UUID before the first attempt; delete the row only after a 2xx.

### Output
Retry function and outbox writer.

### Quality Gate
- `grep -n "Thread.sleep" <Networking dir>` prints nothing.
- Build exits 0.

---

## Phase 3: Connectivity Replay and Stub Tests

### Entry Criteria
- Phase 2 builds.

### Actions
1. `NWPathMonitor` (Network framework) emits `ConnectivityRestored` when `path.status` changes to `.satisfied`; start it on a dedicated `DispatchQueue`, cancel it in `deinit`. It triggers outbox replay and the screen event only; it never gates a request. Read `path.isConstrained` (Low Data Mode) and `path.isExpensive` only if the policy defers large downloads.
2. Write a `URLProtocol` subclass stub that returns queued responses or errors, and inject it with `APISession.make(protocolClasses: [StubProtocol.self])`.
3. One test per rule: 503 then 200 succeeds in 2 attempts; 503 with `Retry-After: 1` waits about 1 s; 400 is not retried; `URLError(.notConnectedToInternet)` on a `serve_cache` endpoint returns cached data; `POST` without key is attempted exactly once; cancelling the task stops further attempts.
4. Run `xcodebuild test -scheme <S> -destination 'platform=iOS Simulator,name=<device>' -only-testing:<UnitTarget>/NetworkPolicyTests`.
5. Manual check on device: Settings > Developer > Network Link Conditioner, profile "100% Loss", open the screen, confirm the stale banner; then "Very Bad Network" for timeouts.

### Output
`ios_network_layer`.

### Quality Gate
- `** TEST SUCCEEDED **` and the stub's recorded request count matches the expected attempts in each test.
- Manual check results are written down with the profile name used, or marked `not run` with the reason.

---

## Worked Example

Illustrative only. Policy: `GET /v1/orders` retry on 502/503/504, `max_attempts=4`, base 500 ms, cap 8000 ms, `serve_cache`; disk cache 20 MB chosen by the user.

Phase 2 test log:
```
Test Case '-[ShopTests.NetworkPolicyTests test_503_then_200_succeedsOnSecondAttempt]' passed (0.612 seconds).
Test Case '-[ShopTests.NetworkPolicyTests test_post_withoutKey_attemptedOnce]' passed (0.004 seconds).
Test Case '-[ShopTests.NetworkPolicyTests test_offline_servesCache_asStale]' passed (0.011 seconds).
Executed 6 tests, with 0 failures
** TEST SUCCEEDED **
```
Phase 3 manual: "100% Loss" shows cached orders with the stale banner.

---

## Exit Criteria

DONE when one session factory and one retry loop implement every policy rule, offline reads fall back to cache as stale, outbox writes persist before sending, and stub tests prove each rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `.returnCacheDataDontLoad` returns nothing although the screen loaded before | **Adjust**: the server sent `no-store` or the response was too large for the cache (responses over about 5 percent of disk capacity are not cached); record and use the database as cache instead. |
| Phase 2 | Retries continue after leaving the screen | **Adjust**: the call runs in a detached task; use the screen's structured task. |
| Phase 3 | `URLProtocol` stub never called | **Adjust**: the code under test built its own session; pass the injected session. |
| Phase 3 | Test with `Retry-After` is slow or flaky | **Adjust**: inject a clock/sleeper so the test does not depend on wall time. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
