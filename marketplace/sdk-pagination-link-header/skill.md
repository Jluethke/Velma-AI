# SDK Link Header Pagination

**One-line description:** Follows RFC 8288 `Link` response headers (`rel="next"`) in a lazy iterator using requests or httpx `response.links`, a tested parser in TypeScript and Go, treats the next URL as opaque, and refuses to send credentials when the next URL changes origin.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`; `pagination_styles.link_header` lists the operations.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root.

---

## Outputs

- `link_paginator` (object): Parser used, stop rule, origin rule, iterator type, and test results.

---

## Phase 1: Choose the Parser

### Entry Criteria
- `pagination_styles.link_header` is non-empty.

### Actions
1. Header format (RFC 8288): `Link: <https://api.example.com/v1/repos?page=3&per_page=50>; rel="next", <https://api.example.com/v1/repos?page=9&per_page=50>; rel="last"`. `rel` may hold several space-separated values (`rel="next last"`), and the header may repeat.
2. Parser per stack:

| Stack | Parser |
|---|---|
| python + requests | `resp.links.get("next", {}).get("url")` (built in) |
| python + httpx | `resp.links.get("next", {}).get("url")` (built in) |
| typescript | A small parser in `src/pagination/linkHeader.ts`; or the npm package `parse-link-header` if the user accepts the dependency |
| go | A small parser in `acme/linkheader.go`; or `github.com/tomnomnom/linkheader` if the user accepts the dependency |

3. A handwritten parser must: split on commas that are outside `<...>`, read the URL between `<` and `>`, read `rel` as quoted or unquoted, split `rel` on whitespace, and match `next` case-insensitively. Do NOT split naively on `,`; URLs can contain commas.

### Output
Parser choice.

### Quality Gate
- The chosen parser is recorded with the dependency decision.

---

## Phase 2: Implement

### Entry Criteria
- Parser chosen.

### Actions
1. First request: the normal list call with filters. Later requests: GET the next URL exactly as given. Do NOT rebuild it from `page` numbers or re-append the original filters; the server already encoded them.
2. Relative next URLs: resolve against the URL of the response that carried the header (python `urllib.parse.urljoin(str(resp.url), next)`, typescript `new URL(next, res.url)`, go `resp.Request.URL.ResolveReference(u)`).
3. Origin rule: if the next URL's scheme, host or port differs from the configured base URL, stop and raise a pagination error, unless the user configured an allowed host list. Sending `Authorization` or an API key to another host leaks the credential.
4. Stop when there is no `rel="next"` link, or when the items array is empty, or when a next URL repeats one already fetched in this iteration (raise).
5. Iterator shape as in the cursor flow (Python generator, TypeScript async generator, Go `iter.Seq2`).

### Output
Link-header paginator.

### Quality Gate
- Type checker passes.
- The origin check exists (`grep -n "host" <paginator file>`).

---

## Phase 3: Test

### Entry Criteria
- Implementation compiles.

### Actions
1. Parser unit tests (TypeScript and Go only): a URL containing a comma; `rel="next last"`; unquoted `rel=next`; two separate `Link` headers; no `next`.
2. Iterator tests:
   - Three pages via absolute next links: 3 requests, items in order.
   - Relative next link resolves correctly.
   - Next link to a different host: raises before the request is sent; mock for that host records 0 calls.
   - Repeated next URL: raises after 2 requests.
   - Final page has `rel="last"` and `rel="prev"` but no next: stops.
3. Run the suite.

### Output
`link_paginator`.

### Quality Gate
- All tests pass.
- Mutation check: disable the origin rule; the cross-host test must fail; restore.

---

## Worked Example

Illustrative only. `stack = go`, `GET /v1/audit-logs` returns `Link` headers.

```
$ go test ./acme -run 'LinkHeader|AuditLogs' -count=1 -v | grep -E "^(--- |ok)"
--- PASS: TestParseLinkHeaderCommaInURL (0.00s)
--- PASS: TestParseLinkHeaderMultiRel (0.00s)
--- PASS: TestParseLinkHeaderUnquoted (0.00s)
--- PASS: TestParseLinkHeaderRepeated (0.00s)
--- PASS: TestAuditLogsThreePages (0.00s)
--- PASS: TestAuditLogsRelativeNext (0.00s)
--- PASS: TestAuditLogsCrossHostRefused (0.00s)
--- PASS: TestAuditLogsRepeatedNext (0.00s)
--- PASS: TestAuditLogsNoNext (0.00s)
ok  	github.com/example/acme-go/acme	0.02s
```

---

## Exit Criteria

DONE when link-header operations iterate by following opaque next URLs with a correct parser, relative links resolve, cross-origin links are refused, and tests prove each rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Server sends `Link` without `rel` quotes | **Adjust**: the parser must accept unquoted values; add the test. |
| Phase 2 | Next URL drops required filters | **Return**: report as a server defect; do not patch URLs client-side without the owner's agreement. |
| Phase 3 | Cross-host test hits the network | **Stop**: the check runs after sending; move it before the request. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
