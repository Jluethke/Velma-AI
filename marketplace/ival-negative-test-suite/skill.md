# Per-Class Negative Test Suite for Input Handling

**One-line description:** Builds one negative test module per vulnerability class found in the sink map (SQL, XSS, command, path, SSRF, XXE, deserialization, upload, ReDoS, header) plus a schema-boundary module, driving each entry point through the real HTTP stack with pytest parametrize, Jest or Vitest `test.each`, or Go table tests, asserting both the rejection status and the absence of the side effect, and mutation-checking each module.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `sink_map` (object, required): Output of `ival-sink-class-map`, with `classes` and `sinks`.

---

## Outputs

- `negative_tests` (object): `modules` (file per class), `case_count` per class, `test_command`, `test_run`, `mutation_results` (class, mutation applied, failing test name).

---

## Phase 1: Build the Case Matrix

### Entry Criteria
- `sink_map.classes` is non-empty, and the fix flows for those classes have run.

### Actions
1. For each class in `sink_map.classes`, take every entry point ID in that class's `reached_from` lists. Each pair (entry point, class) is one parametrized test group.
2. Use these payloads and side-effect oracles. The oracle is what proves nothing happened; a status code alone is not enough:

| Class | Payloads (minimum set) | Side-effect oracle |
|---|---|---|
| schema | unknown key, wrong type, each bound plus one, missing required | handler body not reached (spy on the service call, or DB row count unchanged) |
| sql | `' OR '1'='1`, `1;DROP TABLE t;--`, `x' UNION SELECT NULL--` | row count of the table and result set size unchanged |
| xss | `<img src=x onerror=alert(1)>`, `" onfocus=alert(1) x="`, `javascript:alert(1)`, `</script><script>alert(1)</script>` | parsed rendered HTML has no new element or attribute |
| command | `;touch M`, `$(touch M)`, `` `touch M` ``, `-oProxyCommand=touch M` | marker file M absent |
| path | `../x`, `..%2fx`, `/etc/passwd`, `..\\x`, `a%00.png` | outside file content absent from response |
| ssrf | `http://127.0.0.1:P/`, `http://2130706433:P/`, `http://[::ffff:127.0.0.1]:P/`, `http://169.254.169.254/` | local listener request count 0 |
| xxe | external file entity, network entity, billion laughs | marker absent; listener count 0; finishes within test timeout |
| deserialization | YAML `!!python/object/apply`, `$type`, `@class` canaries | no instance of the canary type created |
| upload | over-cap file, HTML named `.png`, `../../x` name, zip with `../` entry | nothing stored outside storage dir; status 413/415/400 |
| redos | analyzer attack string at max length | completes within the project's test timeout |
| header | `%0d%0aSet-Cookie:%20i=1`, `//evil.example`, `/\evil.example`, `Host: evil.example` | no injected header; no off-site `Location`; generated links use configured base URL |

3. Payload files: store payloads in `tests/payloads/<class>.txt`, one per line, so the same list feeds all stacks and the Semgrep test files.

### Output
Case matrix.

### Quality Gate
- Every (entry point, class) pair from `sink_map` appears in the matrix.
- Every row has an oracle that is not only a status code.

---

## Phase 2: Write the Modules

### Entry Criteria
- Matrix exists.

### Actions
1. File naming: `tests/security/test_<class>.py`, `test/security/<class>.test.ts`, or `<pkg>/security_<class>_test.go`.
2. Patterns:

```python
# python (pytest)
PAYLOADS = [l.rstrip("\n") for l in open("tests/payloads/sql.txt", encoding="utf-8") if l.strip()]

@pytest.mark.parametrize("payload", PAYLOADS)
@pytest.mark.parametrize("route,field", [("/orders", "status"), ("/users", "q")])
def test_sql_payloads_rejected_or_inert(client, db, route, field, payload):
    before = db.scalar("SELECT count(*) FROM orders")
    r = client.get(route, params={field: payload})
    assert r.status_code in (200, 400, 422)
    assert db.scalar("SELECT count(*) FROM orders") == before
    if r.status_code == 200:
        assert r.json()["items"] == []
```
```ts
// node (vitest or jest + supertest)
const payloads = readFileSync("tests/payloads/ssrf.txt", "utf8").split("\n").filter(Boolean);
test.each(payloads)("ssrf refused: %s", async (p) => {
  const before = listener.count;
  const r = await request(app).post("/hooks").send({ callback_url: p.replace("P", String(listener.port)) });
  expect([400, 422]).toContain(r.status);
  expect(listener.count).toBe(before);
});
```
```go
// go (table test with httptest)
for _, p := range loadPayloads(t, "../../tests/payloads/path.txt") {
    t.Run(p, func(t *testing.T) {
        rec := httptest.NewRecorder()
        srv.ServeHTTP(rec, httptest.NewRequest("GET", "/files?name="+url.QueryEscape(p), nil))
        if strings.Contains(rec.Body.String(), outsideMarker) { t.Fatal("outside file leaked") }
    })
}
```
3. Tests go through the real router and middleware (test client, supertest, `ServeHTTP`), not by calling the validator directly, because the class flows already unit-test validators; this suite proves the wiring.
4. Do NOT mark any case `skip`, `xfail`, `.todo` or `t.Skip` to get green. A case that fails is a finding: report it.
5. Write one module, run it, then the next.

### Output
Test modules.

### Quality Gate
- `rg -n "@pytest\.mark\.(skip|xfail)|\.skip\(|\.todo\(|t\.Skip\(" tests test <pkg>` prints nothing in the security modules.
- Each module runs on its own and its pass count equals its parametrized case count.

---

## Phase 3: Run and Mutation-Check Every Module

### Entry Criteria
- All modules written.

### Actions
1. Run the whole suite: `python -m pytest tests/security -q`, `npx vitest run test/security` (or `npx jest test/security`), `go test ./... -run Security -v`. Record the summary.
2. For each class, apply one mutation that disables its fix (remove the validator middleware for schema, restore string SQL for sql, add `|safe` for xss, `shell=True` for command, plain join for path, bypass the guarded client for ssrf, `resolve_entities=True` for xxe, unsafe loader for deserialization, skip type check for upload, old regex for redos, remove redirect helper for header). Run that class's module; record the failing test name; revert with `git checkout -- <file>`.
3. Run the whole suite again after all reverts and confirm it is green.

### Output
`negative_tests`.

### Quality Gate
- Final suite summary shows 0 failed, 0 skipped in security modules.
- `mutation_results` has one entry per class with a named failing test; `git status --porcelain` shows no leftover mutation.

---

## Worked Example

Illustrative. `stack` = `python`, `sink_map.classes` = `["sql", "path", "ssrf"]`, 5 (entry point, class) pairs.

Phase 3:
```
$ python -m pytest tests/security -q
........................................                    [100%]
40 passed in 2.31s
```
Mutation results:
```
sql   restored f-string in shop/repo.py:52   -> FAILED test_sql.py::test_sql_payloads_rejected_or_inert[status-/orders-' OR '1'='1]
path  plain os.path.join in shop/files.py:19 -> FAILED test_path.py::test_path_payloads[../base-other/secret.txt]
ssrf  requests.post without guard            -> FAILED test_ssrf.py::test_ssrf_refused[http://127.0.0.1:P/]
```

---

## Exit Criteria

DONE when every (entry point, class) pair has a parametrized negative test through the real HTTP stack with a side-effect oracle, the suite is green with nothing skipped, and every class has a recorded mutation that turns its module red.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | An entry point needs authentication | **Adjust**: use the existing test fixture that logs in; do not disable auth middleware for the test. |
| Phase 2 | A case fails on current code | **Return**: report it as an open finding with the class flow to rerun; do not skip it. |
| Phase 3 | A mutation does not turn the module red | **Stop**: the module does not exercise that fix; fix the test, not the mutation. |
| Phase 3 | Tests are slow because of real DB and listener | **Adjust**: share fixtures per module (`scope="module"`), never drop the real oracle. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
