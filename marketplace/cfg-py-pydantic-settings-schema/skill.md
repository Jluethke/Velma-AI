# Python Config Schema With pydantic-settings

**One-line description:** Builds one typed `Settings` class with pydantic-settings v2 from the classified key list (SecretStr for secrets, constrained types for the rest, `extra="forbid"`), loads it once at process start so a missing or malformed value stops the process before it serves traffic, and proves both the failure path and that validation errors never print a secret.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `config_keys` (object[], required): Classified keys from `cfg-twelve-factor-audit`.
- `layering_spec` (object, required): Layer order from `cfg-env-layering-precedence`.
- `repo_path` (string, required): Absolute path to the repository root.

---

## Outputs

- `config_schema_module` (string): Path of the settings module created, for example `src/app/settings.py`.
- `startup_validation_command` (string): A command that starts the app with an empty environment and must exit non-zero with a validation message, plus the expected message text.

---

## Phase 1: Write The Settings Class

### Entry Criteria
- `python -c "import pydantic, pydantic_settings; print(pydantic.VERSION)"` prints a 2.x version. If `pydantic_settings` is missing, add `pydantic-settings` to the project's dependency file (`pyproject.toml` or `requirements.txt`) and install it. In pydantic v2, `BaseSettings` lives in the separate `pydantic-settings` package, not in `pydantic`.

### Actions
1. Create one module, for example `src/<pkg>/settings.py`. Edit only this file in this phase.
2. Map each `config_keys` row to a field with this table. Do not invent other types.

| `type` / `class` | Field declaration |
|---|---|
| secret | `db_password: SecretStr` (no default) |
| secret URL with credentials | `database_url: SecretStr` (validate shape after `.get_secret_value()` if needed); use `PostgresDsn` only when you accept that its `repr` shows the password |
| url | `api_base_url: AnyHttpUrl` |
| int | `port: int = Field(8080, ge=1, le=65535)` (TCP port range) |
| bool | `feature_x: bool = False` (pydantic accepts `true/false/1/0/yes/no/on/off`) |
| enum | `log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"` |
| duration | `timeout: timedelta` (accepts ISO 8601 such as `PT30S` or seconds) |
| list | `allowed_hosts: list[str]` (env value must be JSON: `'["a","b"]'`) |

3. Required keys get no default. Optional keys get the default from `config_keys`.
4. Configure the class:
```python
from pydantic import Field, SecretStr, AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=None,          # set per layering_spec layer 4, dev only
        extra="forbid",
        case_sensitive=False,
        frozen=True,
    )
    database_url: SecretStr
    port: int = Field(8080, ge=1, le=65535)
```
   - `env_prefix` must match the variable names in your manifests. If manifests use `DATABASE_URL` without a prefix, set `env_prefix=""` or set `validation_alias="DATABASE_URL"` on that field. Check the inventory before choosing.
   - `extra="forbid"` rejects unknown keys from init kwargs and dotenv files. Unknown environment variables are ignored regardless, because the process environment holds unrelated variables.
   - Default source precedence in pydantic-settings: init arguments, then environment variables, then the dotenv file, then the secrets directory, then field defaults. This matches layers 6, 5, 4 and 1 of `layering_spec`. For Docker or Kubernetes secrets mounted as files, set `secrets_dir="/run/secrets"`; each file name is a field name.
5. Add a single accessor so the class is built once:
```python
from functools import lru_cache

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
```

### Output
Settings module with one field per non-constant key.

### Quality Gate
- `python -c "import ast,sys; ast.parse(open('<module>').read())"` exits 0.
- Count of fields equals count of `config_keys` rows with class `secret` or `deploy-config` (compare `len(Settings.model_fields)` against that count).

---

## Phase 2: Fail Fast At Startup

### Entry Criteria
- Settings module exists.

### Actions
1. In the entry point (`main.py`, `app.py`, `wsgi.py`, `asgi.py`, Django `settings.py`, or the FastAPI app factory), call `get_settings()` before creating the app, opening sockets, or connecting to anything.
2. Catch `ValidationError` only to print a safe message and exit:
```python
import sys
from pydantic import ValidationError

try:
    settings = get_settings()
except ValidationError as exc:
    for err in exc.errors(include_input=False, include_url=False):
        print(f"config error: {'.'.join(map(str, err['loc']))}: {err['msg']}", file=sys.stderr)
    sys.exit(78)  # EX_CONFIG from BSD sysexits.h
```
   `include_input=False` stops pydantic from echoing the rejected value, which may be a secret. Never `print(exc)` or `logger.exception(exc)` for this error; the default string includes `input_value=...`.
3. Replace each direct `os.getenv`/`os.environ` read listed in the inventory with `get_settings().<field>`. Change one file, run the tests, then the next file. Do not batch-edit every file at once.
4. Where a secret is needed, call `.get_secret_value()` at the point of use (passing to the driver), never earlier and never into a log line.

### Output
Entry point validates config before any I/O.

### Quality Gate
- `rg -n 'os\.(getenv|environ)' src/` returns only `settings.py` (or a documented exception with a reason).
- The project test command (for example `pytest -q`) exits 0 after each file change.

---

## Phase 3: Prove The Failure Path And Redaction

### Entry Criteria
- Entry point updated and tests pass.

### Actions
1. Build `startup_validation_command`: start the app with an empty environment, for example `env -i PATH="$PATH" python -m app` (Linux/macOS). It must exit with code 78 and print `config error: database_url: Field required`.
2. Run it and record the exit code with `echo $?`.
3. Add a pytest test for the same behavior:
```python
def test_missing_required_fails(monkeypatch):
    monkeypatch.delenv("APP_DATABASE_URL", raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)
```
4. Add a redaction test: set `APP_DATABASE_URL` to a recognizable fake (`postgresql://u:FAKE-SECRET-123@h/db`), build Settings, and assert `"FAKE-SECRET-123" not in repr(settings)` and not in `str(settings.model_dump())`. SecretStr renders as `**********`.
5. Run `pytest -q` and record the summary line.

### Output
`config_schema_module`, `startup_validation_command`.

### Quality Gate
- The empty-environment start exits 78 (record the printed code).
- The redaction test passes, and swapping `SecretStr` to `str` for that field makes it fail (mutation check; restore afterwards).

---

## Common Mistakes To Avoid

- Do not import `BaseSettings` from `pydantic` in v2; it raises `PydanticImportError`. Import it from `pydantic_settings`.
- Do not give secrets defaults like `"changeme"`; a forgotten variable then runs production with a known password.
- Do not instantiate `Settings()` at import time in a library module that tests import; use `get_settings()` and call `get_settings.cache_clear()` in tests that change the environment.
- Do not log `settings.model_dump()` without `mode="json"` review; SecretStr is masked, but a `PostgresDsn` field shows its password.

---

## Worked Example

Illustrative. FastAPI service, keys `DATABASE_URL` (secret), `PORT` (int, default 8080), `LOG_LEVEL` (enum).

Phase 1 result: `src/billing/settings.py` with 3 fields, `env_prefix="APP_"`.

Phase 2: `src/billing/main.py` now starts with `settings = get_settings()` inside the guarded block. `rg -n 'os\.(getenv|environ)' src/` prints only `src/billing/settings.py` (none, after migration).

Phase 3:
```
$ env -i PATH="$PATH" python -m billing.main; echo "exit=$?"
config error: database_url: Field required
exit=78
$ pytest -q tests/test_settings.py
...                                                      [100%]
3 passed in 0.12s
```

---

## Exit Criteria

DONE when one Settings class covers every config key, the entry point validates before I/O, the empty-environment start exits 78 with a field name and no value, and redaction is proven by a test that fails under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Project pinned to pydantic v1 | **Adjust**: use `from pydantic import BaseSettings` with `class Config: env_prefix = ...`, or plan the v2 upgrade separately; do not mix both APIs. |
| Phase 1 | Manifest variable names lack a common prefix | **Adjust**: use `env_prefix=""` and `validation_alias` per field. |
| Phase 2 | A test suite relies on `os.environ` changes after import | **Adjust**: call `get_settings.cache_clear()` in a fixture; do not remove the cache. |
| Phase 3 | Exit code is 1 instead of 78 | **Retry**: the exception escaped before the guard; move `get_settings()` into the guarded block. |
| Phase 3 | Secret visible in an error | **Stop**: replace `print(exc)` with the `errors(include_input=False)` loop and rerun. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
