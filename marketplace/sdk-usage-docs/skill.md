# SDK Usage Docs

**One-line description:** Writes the SDK README and examples in a fixed section order (install, client setup, auth, first call, pagination, errors, retries and timeouts, idempotency, versioning), and makes every code sample executable as a test: pytest doctest globs for Python, compiled example files for TypeScript, and Go `Example` functions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `api_inventory` (object, required): Output of `sdk-spec-inventory`.
- `stack` (string, required): `python`, `typescript` or `go`.
- `project_dir` (string, required): SDK repository root.
- `error_hierarchy` (object, required): Output of `sdk-error-hierarchy`; the error section lists its classes.
- `version_bump` (object, required): Output of `sdk-versioning-changelog`; the install line pins this version.

---

## Outputs

- `usage_docs` (object): README path, example files, the command that executes the samples, and its result.

---

## Phase 1: Write the README Skeleton

### Entry Criteria
- The SDK builds and its tests pass.

### Actions
1. Write `README.md` with exactly these sections, in this order:

| Section | Must contain |
|---|---|
| Installation | `pip install acme-client==<version>` / `npm install @acme/sdk@<version>` / `go get github.com/example/acme-go@v<version>`; supported runtime versions |
| Client setup | Constructor with base URL and the environment variable name for credentials |
| Authentication | Each scheme from `api_inventory.auth_schemes` that the SDK supports |
| First call | One read call and the printed result |
| Pagination | Auto-paging loop and single-page access, per style present |
| Errors | The class tree from `error_hierarchy` and one catch example using the request ID |
| Retries and timeouts | Defaults (stated as the configured values), per-call overrides, disabling retries |
| Idempotency | Only if supported: automatic keys and the override |
| Versioning | SemVer policy and link to `CHANGELOG.md` |

2. Use only API names that exist. Before writing a method name, grep for it in the source (`grep -rn "def list\b\|list(" ...`). Do NOT document methods, options or environment variables that do not exist.
3. State defaults by reading the code constants, not from memory.

### Output
README draft.

### Quality Gate
- All nine section headings exist (`grep -c "^## " README.md` is at least 9, or 8 when idempotency is unsupported).

---

## Phase 2: Make Every Sample Executable

### Entry Criteria
- README draft exists.

### Actions
1. Per stack:
   - python: write samples as doctest blocks (`>>> client.users.retrieve("u_1").id` then `'u_1'`) and run `pytest --doctest-glob="README.md" -q`. Point the client at a mock (respx fixture via `conftest.py` doctest namespace, or a Prism server at `http://127.0.0.1:4010`).
   - typescript: put each sample in `examples/<name>.ts` and include it in the README by copying; type-check with `npx tsc --noEmit -p examples/tsconfig.json`. Add a script that checks README code blocks equal the example files, for example by extracting fenced blocks and diffing.
   - go: write `example_test.go` functions such as `func ExampleClient_ListUsers()` (naming rule: `Example<Type>_<Method>`). Functions with an `// Output:` comment run and compare stdout in `go test`; functions without it compile only. These examples also appear in `pkg.go.dev` docs.
2. Samples that need a network run against a local mock only. Never put real credentials in samples; use `os.environ["ACME_API_KEY"]`, `process.env.ACME_API_KEY`, `os.Getenv("ACME_API_KEY")`.
3. Run the stack's command and record the result.

### Output
Executable samples.

### Quality Gate
- The sample command exits 0: `pytest --doctest-glob="README.md" -q`, `npx tsc --noEmit -p examples/tsconfig.json`, or `go test -run Example ./... -count=1`.
- Mutation check: rename one method in a sample to a wrong name; the command must fail; restore.

---

## Phase 3: Reference Docs and Final Review

### Entry Criteria
- Samples pass.

### Actions
1. Generate API reference with the stack's standard tool (python `pdoc acme_client -o site/` or Sphinx with autodoc; typescript `npx typedoc src/index.ts`; go: none needed, `go doc` and pkg.go.dev read doc comments).
2. Check every public symbol has a doc comment: go `go vet` does not check this; use `staticcheck` or `revive` with its exported rule; python `pydocstyle` or ruff `D` rules on the facade; typescript `eslint-plugin-jsdoc` `require-jsdoc` on exported symbols. Record the tool's count of missing docs.
3. Read the README top to bottom once as a new user: every code block must be copy-paste runnable after the install line and an environment variable.

### Output
`usage_docs`.

### Quality Gate
- The reference doc build command exits 0.
- The missing-doc count is recorded with the tool used.

---

## Worked Example

Illustrative only. `stack = go`, version `v2.0.0`.

```go
func ExampleClient_GetUser() {
    srv := newExampleServer() // httptest server returning {"id":"u_1","email":"a@example.com"}
    defer srv.Close()
    c, _ := acme.New(acme.WithBaseURL(srv.URL), acme.WithAPIKey("test"))
    u, _ := c.Users.Get(context.Background(), "u_1")
    fmt.Println(u.Email)
    // Output: a@example.com
}
```
```
$ go test -run Example ./... -count=1 -v | grep -E "^(--- |ok)"
--- PASS: ExampleClient_GetUser (0.00s)
--- PASS: ExampleClient_ListUsers (0.00s)
ok  	github.com/example/acme-go/v2	0.02s
```

---

## Exit Criteria

DONE when the README has every required section in order, every sample runs or compiles in CI against a mock, reference docs build, and missing doc comments are counted.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A documented feature does not exist in code | **Stop**: remove it from the README or return the feature to its flow; never document planned behavior as present. |
| Phase 2 | Doctest output differs by repr formatting | **Adjust**: print a specific field instead of the whole object. |
| Phase 3 | Reference build fails on a docstring | **Adjust**: fix the docstring syntax; do not exclude the module. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
