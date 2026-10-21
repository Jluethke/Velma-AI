# HTTP ETag Conditional GET

**One-line description:** Adds `ETag` or `Last-Modified` validators and correct `304 Not Modified` handling to the routes that need them, choosing a cheap version-based ETag over a body hash where possible, using each framework's real mechanism, and verifies the 304 path with curl `If-None-Match` requests.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the application.
- `header_policy` (object[], required): Routes marked as needing a validator by `cache-http-cache-control-policy`.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `etag_change` (object): Per route: validator type (strong ETag, weak ETag, Last-Modified), how it is computed, whether the body is still built on a 304, files changed, and the curl outputs for 200 and 304.

---

## Phase 1: Choose the Validator

### Entry Criteria
- At least one route in `header_policy` needs a validator.

### Actions
1. For each route, first match:

   | Row | Condition | Validator |
   |---|---|---|
   | 1 | The resource has a version column or a monotonically increasing `updated_at` | ETag from version, computed BEFORE building the body: `"p42-v17"`. Saves database and render work on a 304. |
   | 2 | The body is a deterministic function of a few rows with timestamps | `Last-Modified` from the max `updated_at` (HTTP dates have 1-second resolution, so two changes in one second are not distinguished; use row 1 if that matters) |
   | 3 | Nothing cheap identifies the version | ETag from a hash of the body (the framework default in many stacks). Saves bandwidth only; the server still builds the full body. |

2. Strong vs weak: a strong ETag (`"abc"`) means byte-identical; a weak ETag (`W/"abc"`) means semantically equivalent. Byte-range requests require strong validators. If a compressing proxy alters the body, it may weaken the ETag (nginx converts strong ETags to weak when it gzips a response); `If-None-Match` uses weak comparison, so weak ETags still produce 304s.
3. The ETag value must change when anything in the body changes, including representation differences: if the body varies by `Accept-Language`, include the language in the ETag.

### Output
Validator choice per route with table row.

### Quality Gate
- Every route has one row number and a written formula for its ETag or Last-Modified.

---

## Phase 2: Implement Per Stack

### Entry Criteria
- Validators chosen.

### Actions
1. Use only the rows for `stack` and the repo's framework:

   | Framework | Mechanism |
   |---|---|
   | Django | `from django.views.decorators.http import condition` with `@condition(etag_func=..., last_modified_func=...)` for row 1 or 2 (the funcs run before the view, so a 304 skips the view); `django.middleware.http.ConditionalGetMiddleware` gives row 3 for all responses |
   | Flask | `response.set_etag(tag)` then `return response.make_conditional(request)`; for row 1, compare `request.if_none_match.contains(tag)` before building the body and `abort(304)` style early return |
   | FastAPI / Starlette | No built-in for dynamic routes; compare `request.headers.get("if-none-match")` with the tag and return `Response(status_code=304, headers={...})` |
   | Express | `app.set('etag', 'strong')` or `'weak'` (default is weak) gives row 3; `req.fresh` is true when the request's validators match the response headers already set, so set `ETag` first, then `if (req.fresh) return res.status(304).end()` |
   | Go net/http | Set `w.Header().Set("ETag", tag)` then `http.ServeContent(w, r, name, modtime, readSeeker)`, which evaluates `If-None-Match` and `If-Modified-Since`; for row 1, check `r.Header.Get("If-None-Match")` yourself before loading the body |
   | Spring MVC | `if (webRequest.checkNotModified(etag)) return null;` at the start of the handler (row 1), or `ResponseEntity.ok().eTag(tag)`; `ShallowEtagHeaderFilter` gives row 3 (still renders the body) |

2. A 304 response has no body and must repeat `Cache-Control`, `ETag`, `Vary`, `Expires` and `Content-Location` headers that a 200 would have sent (RFC 9110 section 15.4.5).
3. Quote ETags: the header value includes the double quotes, `ETag: "p42-v17"`.
4. Edit one route at a time, with a test that sends `If-None-Match` and expects 304, then one that changes the resource and expects 200 with a new ETag.

### Output
Validator code and passing tests.

### Quality Gate
- Tests for 304 on match and 200 on change pass for every route.
- For row 1 routes, a test shows the database loader is NOT called on a 304 (spy count 0).

---

## Phase 3: Verify With curl

### Entry Criteria
- Tests pass; app running in staging or locally.

### Actions
1. First request: `curl -sS -o /dev/null -D - https://staging.example.com/products/42`; copy the `etag` value.
2. Conditional request: `curl -sS -o /dev/null -D - -H 'If-None-Match: "p42-v17"' https://staging.example.com/products/42`. Expect `HTTP/2 304` (or `HTTP/1.1 304`), the same `etag`, and the `cache-control` line.
3. Change the product, repeat Action 2; expect `200` and a new `etag`.
4. Through the CDN or proxy, repeat Action 2 and check that the 304 is not turned into a 200 by a layer that strips or rewrites ETags.

### Output
`etag_change`.

### Quality Gate
- curl output shows 304 on match and 200 after change, both recorded.
- The 304 response includes `cache-control` and `etag` lines.

---

## Worked Example

Illustrative. Django, `/products/42`, `products.version` integer.

Phase 1: row 1, ETag `"p{id}-v{version}"`.

Phase 2: `@condition(etag_func=lambda req, pk: f'p{pk}-v{Product.objects.values_list("version", flat=True).get(pk=pk)}')`. Tests pass; on a match the view body (and the full serializer) is not executed.

Phase 3:
```
$ curl -sS -o /dev/null -D - -H 'If-None-Match: "p42-v17"' https://staging.example.com/products/42
HTTP/2 304
etag: "p42-v17"
cache-control: public, max-age=0, s-maxage=300, stale-while-revalidate=60
```

---

## Exit Criteria

DONE when every route that needs a validator returns 304 on a matching conditional request with the required headers, 200 with a new validator after a change, and row 1 routes skip body construction on a 304.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No version column and body hash is expensive | **Adjust**: use `Last-Modified` from `updated_at` (row 2) and note the 1-second resolution. |
| Phase 2 | 304 returned but ETag missing from it | **Adjust**: set headers before the early return. |
| Phase 3 | Always 200 through the CDN | **Adjust**: the CDN strips or weakens ETags, or compresses differently per request; check its settings and the raw origin response. |
| Phase 3 | ETag changes on every request | **Stop**: the ETag includes a timestamp or random field; recompute it from stable data. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
