# Go Config Schema With caarlos0/env

**One-line description:** Builds one `internal/config` package that parses environment variables into a typed struct with `github.com/caarlos0/env/v11` (required and notEmpty tags, file-backed secrets, explicit defaults), adds a `Validate()` method for cross-field rules, wraps secrets in a type that redacts itself in `fmt`, `%+v` and `log/slog`, and proves `main` exits before any I/O when config is invalid.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `config_keys` (object[], required): Classified keys from `cfg-twelve-factor-audit`.
- `layering_spec` (object, required): Layer order from `cfg-env-layering-precedence`.
- `repo_path` (string, required): Absolute path to the repository root.

---

## Outputs

- `config_schema_module` (string): Path of the package created, for example `internal/config/config.go`.
- `startup_validation_command` (string): A command that starts the binary with an empty environment and must exit non-zero with a validation message, plus the expected message text.

---

## Phase 1: Write The Config Struct

### Entry Criteria
- `go version` prints 1.18 or later (generics are used by `env.ParseAs`). Check the minimum Go version in the module's current `go.mod` of caarlos0/env before adding it.
- `go get github.com/caarlos0/env/v11` succeeds and `go.mod` lists it. If the project already uses `kelseyhightower/envconfig` or `spf13/viper`, keep that library and translate the tags; do not add a second config library.

### Actions
1. Create `internal/config/config.go`. Edit only this package in this phase.
2. Define a redacting secret type:
```go
type Secret string

func (Secret) String() string           { return "[redacted]" }
func (Secret) GoString() string         { return "[redacted]" }
func (Secret) LogValue() slog.Value     { return slog.StringValue("[redacted]") }
func (s Secret) MarshalJSON() ([]byte, error) { return []byte(`"[redacted]"`), nil }
func (s Secret) Reveal() string         { return string(s) }
```
   `String` covers `%s`, `%v` and `%+v`; `GoString` covers `%#v`; `LogValue` implements `slog.LogValuer`; `MarshalJSON` covers JSON logs. `Reveal` is the only way to get the value; grep for it in review.
3. Map `config_keys` rows to fields with tags:

| `type` / `class` | Field and tag |
|---|---|
| secret | `DBPassword Secret \`env:"DB_PASSWORD,required,notEmpty"\`` |
| secret mounted as a file | `DBPassword Secret \`env:"DB_PASSWORD_FILE,file,required"\`` (the variable holds a path; the library reads the file) |
| int | `Port int \`env:"PORT" envDefault:"8080"\`` |
| bool | `Debug bool \`env:"DEBUG" envDefault:"false"\`` (parsed with `strconv.ParseBool`) |
| duration | `Timeout time.Duration \`env:"TIMEOUT" envDefault:"30s"\`` (Go duration syntax) |
| list | `Hosts []string \`env:"HOSTS" envSeparator:","\`` |
| url | `APIBase url.URL \`env:"API_BASE,required"\`` |

   Defaults come only from `config_keys`; do not invent them.
4. Add the loader:
```go
func Load() (Config, error) {
    cfg, err := env.ParseAs[Config]()
    if err != nil {
        return Config{}, err
    }
    return cfg, cfg.Validate()
}
```
5. Add `Validate()` for rules tags cannot express, for example port range 1 to 65535 (TCP), an enum value set, or "TLS cert and key must both be set". Use `errors.Join` to return all problems at once.

### Output
Config package with struct, Secret type, `Load` and `Validate`.

### Quality Gate
- `go vet ./internal/config/...` exits 0.
- Number of struct fields equals the count of `config_keys` rows with class `secret` or `deploy-config`.

---

## Phase 2: Load Before Any I/O

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. In `main()` call `config.Load()` first:
```go
cfg, err := config.Load()
if err != nil {
    fmt.Fprintln(os.Stderr, "config error:", err)
    os.Exit(78) // EX_CONFIG from BSD sysexits.h
}
```
   caarlos0/env error messages name the variable (for example `required environment variable "DB_PASSWORD" is not set`) and do not echo values for missing keys. For parse errors they can include the raw value; for `Secret` fields there is no parsing, so the value is not echoed.
2. Pass `cfg` (or the sub-struct a component needs) into constructors. Do not keep a package-level global that other packages read with `os.Getenv`.
3. Replace each `os.Getenv`/`os.LookupEnv` site from the inventory with a field on the passed config. Change one package, run `go test ./...`, then the next.
4. If `layering_spec` uses a local `.env` in development, load it only behind a flag (`-dotenv`) with `github.com/joho/godotenv` `godotenv.Load()`, which does not override variables already set.

### Output
`main` validates config before opening sockets or connections.

### Quality Gate
- `rg -n 'os\.(Getenv|LookupEnv)' --type go -g '!internal/config/**' -g '!vendor'` returns nothing (or documented exceptions).
- `go test ./...` exits 0.

---

## Phase 3: Prove Failure And Redaction

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Build and run with an empty environment: `go build -o /tmp/app ./cmd/app && env -i /tmp/app; echo "exit=$?"`. Expected: `config error: env: required environment variable "DB_PASSWORD" is not set` (exact wording depends on the library version) and `exit=78`. Record the actual line as `startup_validation_command`'s expected text.
2. Add tests in `internal/config/config_test.go`:
```go
func TestLoadMissingSecret(t *testing.T) {
    t.Setenv("PORT", "8080") // t.Setenv restores after the test
    if _, err := config.Load(); err == nil {
        t.Fatal("expected error for missing DB_PASSWORD")
    }
}

func TestSecretRedacted(t *testing.T) {
    s := config.Secret("FAKE-SECRET-123")
    for _, out := range []string{fmt.Sprintf("%v", s), fmt.Sprintf("%+v", struct{ P config.Secret }{s}), fmt.Sprintf("%#v", s)} {
        if strings.Contains(out, "FAKE-SECRET-123") {
            t.Fatalf("secret leaked: %s", out)
        }
    }
}
```
   `TestLoadMissingSecret` must not inherit `DB_PASSWORD` from the developer shell; use `os.Unsetenv` via `t.Setenv("DB_PASSWORD", "")` only if the tag includes `notEmpty`, which then fails as required.
3. Run `go test ./internal/config/ -run 'TestLoad|TestSecret' -v` and record the PASS lines.

### Output
`config_schema_module`, `startup_validation_command`.

### Quality Gate
- The empty-environment run prints `exit=78`.
- Removing the `GoString` method makes `TestSecretRedacted` fail (mutation check; restore afterwards).

---

## Common Mistakes To Avoid

- Do not import `github.com/caarlos0/env` without `/v11`; older major versions have different APIs (`env.Parse(&cfg)` exists in all, `ParseAs` does not).
- Do not log `cfg` with `%+v` when secrets are plain `string` fields. Use the `Secret` type.
- Do not call `t.Setenv` in a test that calls `t.Parallel()`; Go panics.
- Do not invent struct tags. Supported options are listed in the caarlos0/env README; check it for your version.

---

## Worked Example

Illustrative. Go worker, keys `DB_PASSWORD` (secret, mounted at `/run/secrets/db_password`), `QUEUE_URL` (url), `CONCURRENCY` (int, default 4 from config_keys).

Phase 1:
```go
type Config struct {
    DBPassword  Secret  `env:"DB_PASSWORD_FILE,file,required"`
    QueueURL    url.URL `env:"QUEUE_URL,required"`
    Concurrency int     `env:"CONCURRENCY" envDefault:"4"`
}
```
Phase 2: `rg -n 'os\.Getenv' --type go -g '!internal/config/**'` prints nothing. `go test ./...` prints `ok` for 6 packages.

Phase 3:
```
$ env -i /tmp/worker; echo "exit=$?"
config error: env: required environment variable "DB_PASSWORD_FILE" is not set; required environment variable "QUEUE_URL" is not set
exit=78
```

---

## Exit Criteria

DONE when one config struct covers every key, `main` exits 78 before I/O on invalid config, secrets cannot print through `fmt` or `slog`, and both tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Go version too old for `ParseAs` | **Adjust**: use `var cfg Config; err := env.Parse(&cfg)`. |
| Phase 1 | Project already uses viper | **Adjust**: keep viper, add `viper.AutomaticEnv()` and an explicit required-key check in `Validate()`; do not add caarlos0/env. |
| Phase 2 | A library reads `os.Getenv` internally | **Adjust**: leave it and record it as a documented exception. |
| Phase 3 | Test passes locally because the shell exports the secret | **Retry**: run with `env -i PATH="$PATH" HOME="$HOME" go test ./internal/config/`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
