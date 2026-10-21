# Environment Layering And Precedence

**One-line description:** Defines one explicit, ordered stack of config layers (code defaults, base file, per-environment overlay, local untracked overrides, environment variables, command-line flags), documents which layer may hold which key class, and writes precedence tests that prove the highest layer wins for every layer pair.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `config_keys` (object[], required): Classified keys from `cfg-twelve-factor-audit`.
- `repo_path` (string, required): Absolute path to the repository root.
- `environments` (string[], required): Deploy targets that exist, for example `["dev", "staging", "prod"]`.

---

## Outputs

- `layering_spec` (object): Ordered layer list (lowest to highest precedence), file name per layer, which key classes each layer may contain, and the loader library or framework mechanism that implements it.
- `precedence_tests` (string[]): Paths of test files added, each asserting the winner for one adjacent layer pair, plus the command that runs them.

---

## Phase 1: Write The Layer Order

### Entry Criteria
- `config_keys` is non-empty.
- `environments` has at least one entry.

### Actions
1. Use this fixed order, lowest precedence first. Do not reorder it; every mainstream loader (pydantic-settings, Spring Boot, dotenv tools, caarlos0/env) agrees that environment variables beat files and explicit arguments beat environment variables.

| Order | Layer | File or mechanism | May contain |
|---|---|---|---|
| 1 | Code defaults | Default values in the schema class or struct | deploy-config only |
| 2 | Base file (optional) | `config/base.yaml`, `application.yml`, or none | deploy-config only |
| 3 | Environment overlay (optional) | `config/<env>.yaml`, `application-<env>.yml` | deploy-config only |
| 4 | Local override (dev only) | `.env` or `.env.local`, gitignored | anything, dev credentials only |
| 5 | Process environment | Set by the platform (Kubernetes, ECS, systemd, CI) | anything, secrets included |
| 6 | Command-line flags | `--port 9000`, `--spring.profiles.active=...` | deploy-config only (flags appear in `ps` output) |

2. Write the rule that secrets enter only at layer 4 (developer machines) or layer 5 (deployed). Layers 1, 2, 3 and 6 never contain a secret. Record this in `layering_spec.secret_layers = [4, 5]`.
3. Record that layer 4 is never read in deployed environments. Implementation per stack:
   - Python pydantic-settings: set `env_file` only when an explicit flag such as `APP_LOAD_DOTENV=1` is set, or keep the default and ensure no `.env` exists in the image (`.dockerignore` contains `.env*`).
   - Node: load `dotenv` only in the dev script (`node --env-file-if-exists=.env` on Node versions that support it, otherwise `node -r dotenv/config` only in `npm run dev`); check `node --help` for the flag on your version.
   - Go: call `godotenv.Load()` only behind a `-dev` flag, or not at all.
   - Spring Boot: `spring.config.import=optional:file:.env[.properties]` only in `application-dev.yml`.
4. Note the twelve-factor caution: named environment overlays (layer 3) grow into a combinatorial set. Keep overlays small: only keys whose value differs per environment and is not a secret.

### Output
Draft `layering_spec`.

### Quality Gate
- `layering_spec` lists 6 layers in the order above with a file or mechanism for each one used (unused layers marked `unused`).
- `layering_spec.secret_layers` equals `[4, 5]`.

---

## Phase 2: Check Existing Files Against The Spec

### Entry Criteria
- Draft `layering_spec` exists.

### Actions
1. For each file named in layers 2 and 3, list its keys and cross-check against `config_keys`. Any key with `class: secret` and a plaintext value is a violation; record it and stop editing that file until the secret store flow moves the value.
2. Confirm layer 4 files are ignored: `git check-ignore -v .env` must print the matching `.gitignore` line. If it prints nothing, the file is not ignored; add `.env`, `.env.*` and `!.env.example` to `.gitignore`.
3. Confirm layer 4 files are excluded from images: `rg -n '^\.env' .dockerignore` must match. If `.dockerignore` does not exist, create it with `.env*` and `!.env.example`.
4. For every key in `config_keys` with `class: deploy-config`, record which layers set it today. If a key is set in more than two layers, record it as a simplification candidate; do not delete any layer value in this flow.

### Output
Layer audit appended to `layering_spec.audit`.

### Quality Gate
- `git check-ignore -v .env` output is recorded and non-empty.
- Zero secret-class keys with plaintext values remain unrecorded in layers 2, 3 or 6.

---

## Phase 3: Write Precedence Tests

### Entry Criteria
- Layer audit exists.

### Actions
1. Pick one harmless deploy-config key, for example `LOG_LEVEL`. Write one test per adjacent layer pair that is in use: set the key in the lower layer to value `A` and in the higher layer to `B`, load config, assert the result is `B`. Then remove the higher layer and assert `A`.
2. Use the stack's test runner and isolate the environment per test:
   - Python pytest: `monkeypatch.setenv("APP_LOG_LEVEL", "DEBUG")` and `tmp_path` for files; construct `Settings(_env_file=tmp_path / ".env")`.
   - Node vitest or jest: copy `process.env` in `beforeEach` and restore it in `afterEach`; import the config module inside the test after setting variables (`vi.resetModules()` in vitest, `jest.resetModules()` in jest).
   - Go: `t.Setenv("LOG_LEVEL", "debug")` (restores automatically; cannot be used with `t.Parallel()`).
   - Spring Boot: `@SpringBootTest(properties = "app.log-level=debug")` and `@TestPropertySource`, or `ApplicationContextRunner().withPropertyValues(...)`.
3. Add one negative test: with no layer setting a required key, loading config fails. This is the fail-fast check that the stack schema flows also enforce.
4. Run the tests with the stack command (`pytest -q tests/config`, `npx vitest run config`, `go test ./internal/config/...`, `./mvnw -q test -Dtest=ConfigPrecedence*` or `./gradlew test --tests '*ConfigPrecedence*'`). Record the command in `precedence_tests`.
5. Mutation check: swap the expected values in one test, run it, confirm it fails, then restore. A precedence test that cannot fail proves nothing.

### Output
`layering_spec`, `precedence_tests`.

### Quality Gate
- The recorded test command exits 0.
- The mutation check run exited non-zero (record its output line).

---

## Common Mistakes To Avoid

- Do not let a `.env` file override real environment variables in deployed environments. python-dotenv and the `dotenv` npm package do not override existing variables by default; do not pass `override=True` or `override: true`.
- Do not put secrets in command-line flags; they are visible in `ps aux` and `/proc/<pid>/cmdline`.
- Do not write tests that mutate the global environment without restoring it; later tests then pass or fail by order.

---

## Worked Example

Illustrative. Python service, `environments=["dev","prod"]`.

Phase 1 spec: layers 1 (pydantic defaults), 3 unused, 4 (`.env`, dev only), 5 (Kubernetes env), 6 unused. `secret_layers=[4,5]`.

Phase 2:
```
$ git check-ignore -v .env
.gitignore:3:.env	.env
$ rg -n '^\.env' .dockerignore
1:.env*
```
Phase 3 test:
```python
def test_env_beats_dotenv(tmp_path, monkeypatch):
    (tmp_path / ".env").write_text("APP_LOG_LEVEL=INFO\n")
    monkeypatch.setenv("APP_LOG_LEVEL", "DEBUG")
    assert Settings(_env_file=tmp_path / ".env").log_level == "DEBUG"
```
```
$ pytest -q tests/config
....                                                     [100%]
4 passed in 0.21s
```
Mutation run (expected `INFO`): `1 failed, 3 passed`. Restored.

---

## Exit Criteria

DONE when the six-layer order is written with secrets confined to layers 4 and 5, local override files are ignored by git and Docker, and precedence tests pass and were shown able to fail.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | The framework's own precedence differs from the table | **Adjust**: record the framework's documented order with a link to its docs and test that order instead. |
| Phase 2 | Plaintext secret in a committed overlay | **Return**: hand it to secret scanning and rotation; the value is in history. |
| Phase 3 | Test passes in isolation but fails in the suite | **Adjust**: the environment leaks between tests; restore it per test. Do not mark the test skipped. |
| Phase 3 | Mutation check also passes | **Stop**: the test does not read config through the loader; rewrite it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
