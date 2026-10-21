# SSRF Guard for Server-Side URL Fetches

**One-line description:** Protects every server-side fetch of a user-influenced URL (webhooks, image-by-URL, link previews, import-from-URL) with a scheme and host allowlist, a connect-time check of the resolved IP against private, loopback, link-local and cloud metadata ranges (blocking DNS rebinding), disabled or re-checked redirects, and tests that cover decimal, IPv6 and redirect bypasses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `sink_map` (object, required): Output of `ival-sink-class-map`; rows with `class` = `ssrf`.
- `allowed_hosts` (string[], optional): Hostnames the feature may contact. If given, the allowlist mode in Phase 1 applies; if absent, the denylist-by-IP mode applies.

---

## Outputs

- `ssrf_fixes` (object): `mode` per sink (`allowlist` or `ip_check`), `guard_module`, `redirect_policy`, `test_file`, `test_run`.

---

## Phase 1: Decide the Mode per Fetch

### Entry Criteria
- One or more `ssrf` rows in `sink_map.sinks` whose URL or host comes from a request, queue message or database field a user can set.

### Actions
1. Decide:

| Situation | Mode |
|---|---|
| Destination set is known (a payment provider, your own CDN) | `allowlist`: exact hostname match against `allowed_hosts`, `https` only |
| Destination is any public URL by design (webhooks, link previews) | `ip_check`: resolve, check every address, connect to the checked address |
| URL only selects among internal services | replace the URL input with a key mapped to fixed URLs; no user URL at all |

2. Both modes also apply the `ip_check` at connect time, because an allowlisted name can still resolve to an internal address if its DNS changes.
3. Blocked ranges (from IANA special-purpose registries and cloud provider docs). The guard blocks an address unless it is globally routable:
   - IPv4: `0.0.0.0/8`, `10.0.0.0/8`, `100.64.0.0/10`, `127.0.0.0/8`, `169.254.0.0/16` (includes `169.254.169.254` metadata on AWS, GCP, Azure), `172.16.0.0/12`, `192.168.0.0/16`, `224.0.0.0/4` and above.
   - IPv6: `::1`, `::`, `fc00::/7`, `fe80::/10`, `ff00::/8`, IPv4-mapped `::ffff:0:0/96` (check the embedded IPv4), and `fd00:ec2::254` (AWS metadata over IPv6).

### Output
Mode per fetch.

### Quality Gate
- Every `ssrf` sink has a mode; `allowlist` sinks name their hosts.

---

## Phase 2: Build the Guard and Route Fetches Through It

### Entry Criteria
- Modes decided.

### Actions
1. The check must run on the IP the socket connects to, not on a separate DNS lookup done earlier (DNS rebinding returns a public IP to the check and a private IP to the connect). Stack-specific way to do that:

| `stack` | Connect-time hook |
|---|---|
| go | `net.Dialer{Control: func(network, address string, c syscall.RawConn) error { host, _, _ := net.SplitHostPort(address); ip, _ := netip.ParseAddr(host); ip = ip.Unmap(); if !ip.IsGlobalUnicast() \|\| ip.IsPrivate() \|\| ip.IsLoopback() \|\| ip.IsLinkLocalUnicast() { return errBlocked }; return nil }}` set as the `DialContext` of an `http.Transport`. Add explicit checks for `100.64.0.0/10` with `netip.MustParsePrefix(...).Contains(ip)`. Set `Proxy: nil` on that transport so `HTTP_PROXY` cannot bypass the dialer. |
| python | resolve with `socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)`, check every result with `ipaddress.ip_address(a)`: reject unless `.is_global` is true (for `IPv6Address` with `.ipv4_mapped`, check that too), then connect to the checked IP and send the original hostname in `Host` and TLS SNI. With `requests`, do this through a custom `HTTPAdapter`; or use a maintained guard package after reading its source (`advocate` is unmaintained; check before adopting). |
| node | pass a `lookup` function to the `http.Agent` / `https.Agent` (`new https.Agent({ lookup: guardedLookup })`); `guardedLookup` calls `dns.lookup(host, { all: true })`, rejects if any address is blocked (use `ipaddr.js` `ipaddr.process(a).range()` and allow only `"unicast"`), and returns the checked address. Pass the agent to `axios`/`got`/`node-fetch`. For the built-in `fetch` (undici), use an `undici.Agent` with `connect: { lookup: guardedLookup }`. |

2. Scheme and port: accept only `http` and `https` (only `https` in `allowlist` mode). Reject `file:`, `gopher:`, `ftp:`, `dict:`. Ports: if the owner gives an allowed port list, enforce it; otherwise record the open question.
3. Redirects: disable them (`requests`: `allow_redirects=False`; Go: `CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }`; `axios`: `maxRedirects: 0`; `fetch`: `redirect: "manual"`). If the feature needs redirects, follow them in your code, running the full check on each `Location`.
4. Cap response size and time with the values your caller already uses or the owner provides; do not make them up.
5. Do not return the fetched body or the error detail to the user for `ip_check` fetches (blind SSRF probing reads error differences). Return a generic failure.
6. Route every `ssrf` sink through the one guarded client. Change one sink per commit.

### Output
`guard_module` and converted sinks.

### Quality Gate
- `rg -n "requests\.(get|post)\(|http\.Get\(|axios\.(get|post)\(|fetch\(" <src>` lists only calls that pass the guarded session, client or agent, or calls with constant URLs (each listed).
- The guarded client has redirects disabled or re-checked (cite the line).

---

## Phase 3: Bypass Tests

### Entry Criteria
- Sinks converted.

### Actions
1. Start a local HTTP server on `127.0.0.1` in the test. Assert each URL is refused before any byte reaches that server (the server records zero requests):

```
http://127.0.0.1:<port>/
http://localhost:<port>/
http://2130706433:<port>/            (decimal 127.0.0.1)
http://0x7f.0.0.1:<port>/
http://[::1]:<port>/
http://[::ffff:127.0.0.1]:<port>/
http://169.254.169.254/latest/meta-data/
http://0.0.0.0:<port>/
file:///etc/passwd
```
2. Rebinding: mock the resolver (Go: a custom `Resolver` in the dialer test; Python: patch `socket.getaddrinfo`; Node: inject `guardedLookup`'s `dns.lookup`) to return `127.0.0.1` for `public.example`, and assert refusal.
3. Redirect: a public-looking test server that returns `302 Location: http://127.0.0.1:<port>/`; assert refusal.
4. Positive: an allowed public test destination (or a resolver mock returning a documentation address such as `203.0.113.10` with a local listener) succeeds.
5. Run, record summary. Mutation check: bypass the guard for one sink, rerun, confirm failure, revert.

### Output
`ssrf_fixes`.

### Quality Gate
- Test summary shows 0 failed; the local server request counter is 0 after the blocked cases.
- Mutation run fails; reverted run passes.

---

## Worked Example

Illustrative. `stack` = `go`; webhook delivery in `internal/hooks/deliver.go:30` called `http.Post(sub.URL, ...)` with a user-registered URL. `allowed_hosts` absent, so mode = `ip_check`.

Phase 2: `guard.NewClient()` returns an `*http.Client` whose transport dialer has the `Control` check, `Proxy: nil`, and `CheckRedirect` returning `http.ErrUseLastResponse`.

Phase 3:
```
$ go test ./internal/hooks -run SSRF -v
--- PASS: TestSSRF/decimal_loopback (0.00s)
--- PASS: TestSSRF/ipv4_mapped_ipv6 (0.00s)
--- PASS: TestSSRF/rebinding (0.00s)
--- PASS: TestSSRF/redirect_to_loopback (0.00s)
ok   example.com/shop/internal/hooks  0.031s
```

---

## Exit Criteria

DONE when every user-influenced fetch goes through one guarded client that checks the connected IP, allows only http and https, disables or re-checks redirects, ignores proxy environment variables, and the bypass tests pass with zero requests reaching the local listener.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fetch must reach an internal service chosen by the user | **Adjust**: replace the URL input with an enum key mapped to fixed internal URLs. |
| Phase 2 | Outbound traffic must go through a corporate proxy | **Return**: the IP check then belongs in the proxy; report that the app cannot see the connected IP and request a proxy ACL for the blocked ranges. |
| Phase 2 | HTTPS breaks after connecting by IP | **Adjust**: keep the hostname for SNI and certificate checks; only the dial target changes (Go and Node hooks above do this automatically). |
| Phase 3 | Local listener received a request | **Stop**: a path bypasses the guard; find it before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
