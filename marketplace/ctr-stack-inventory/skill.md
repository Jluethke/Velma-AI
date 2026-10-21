# Container Stack Inventory

**One-line description:** Reads a project's manifest and lock files to record the exact runtime version, package manager, lockfile, entrypoint, listening port, native dependencies and test command that every later containerization flow needs, without guessing any of them.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Absolute path to the repository root that will become the Docker build context.
- `stack` (string, required): One of `python`, `node`, `go`, `java`. Selects which manifest files are read.

---

## Outputs

- `build_profile` (object): `stack`, `runtime_version` (exact, with the file and line it came from), `package_manager`, `lockfile`, `install_command`, `build_command`, `entrypoint` (exec-form argv), `listen_port` (or `none`), `native_deps` (list), `test_command`, `open_questions` (list).

---

## Phase 1: Read Version and Package Manager

### Entry Criteria
- `project_dir` exists and is readable.
- `stack` is one of the four allowed values.

### Actions
1. List the root: `ls -la <project_dir>` (PowerShell: `Get-ChildItem -Force <project_dir>`). Record which of the files in the table below exist.
2. Read the runtime version from the first file in this order that defines it. Record the file and line.

| stack | Version source, in priority order | Lockfile to package manager |
|---|---|---|
| python | `.python-version`, `pyproject.toml` `[project] requires-python`, `runtime.txt`, `Pipfile` `[requires] python_version` | `uv.lock` = uv; `poetry.lock` = poetry; `Pipfile.lock` = pipenv; `requirements*.txt` with `==` pins = pip; none = **open question** |
| node | `.nvmrc`, `.node-version`, `package.json` `engines.node`, `package.json` `volta.node` | `package-lock.json` = npm; `pnpm-lock.yaml` = pnpm; `yarn.lock` plus `.yarnrc.yml` = yarn berry; `yarn.lock` alone = yarn classic; `package.json` `packageManager` field overrides when present |
| go | `go.mod` `toolchain` directive, then `go.mod` `go` directive | `go.sum` (Go modules); `vendor/modules.txt` means vendored |
| java | `pom.xml` `maven.compiler.release` or `<release>` in maven-compiler-plugin; `build.gradle(.kts)` `java { toolchain { languageVersion = JavaLanguageVersion.of(N) } }`; `.java-version`; `.sdkmanrc` | `mvnw` plus `pom.xml` = Maven wrapper; `gradlew` = Gradle wrapper; `pom.xml` without wrapper = system Maven |

3. If the version is a range (for example `requires-python = ">=3.10"` or `engines.node = ">=18"`), do NOT pick a number. Record the range and add an open question: "Which exact minor version should the image run?" Pick only when the user answers or when a CI file (`.github/workflows/*.yml`, `.gitlab-ci.yml`) pins one exact version; then cite that file and line.
4. If no lockfile exists, record it in `open_questions`. A container build without a lockfile is not reproducible; do not generate one silently.

### Output
Runtime version, package manager and lockfile, each with its source file.

### Quality Gate
- `runtime_version` cites a file path and line number, or is listed in `open_questions`.
- `lockfile` names a file that `ls` shows exists, or `open_questions` says it is missing.

---

## Phase 2: Find Entrypoint, Port and Tests

### Entry Criteria
- Phase 1 output exists.

### Actions
1. Find the entrypoint from the stack's own declaration, never from a guess:
   - python: `[project.scripts]` in `pyproject.toml`, a `Procfile` `web:` line, an existing `CMD` in any old Dockerfile, or a `__main__.py`. ASGI/WSGI apps: record the server command found in the repo (for example `uvicorn app.main:app --host 0.0.0.0 --port 8000` or `gunicorn app.wsgi:application`).
   - node: `package.json` `main`, then the `start` script. Translate `"start": "node dist/server.js"` into argv `["node", "dist/server.js"]`. Record that the container must run `node` directly, not `npm start`, because npm does not forward SIGTERM reliably to the child.
   - go: every `package main` directory: `grep -rl --include=*.go '^package main' <project_dir>`. One result = that path. Several = **open question** naming each.
   - java: Spring Boot plugin present (`spring-boot-maven-plugin` or `org.springframework.boot` Gradle plugin) means an executable fat jar; otherwise read `Main-Class` configuration in the jar or shade/assembly plugin.
2. Find the listening port: search config and code with `grep -rnE "PORT|listen\(|\.port|server\.port|ListenAndServe|--port" <project_dir> --include=*.{py,js,ts,go,java,properties,yml,yaml,toml}`. Record the default value and the env var that overrides it. If the app is a worker or CLI with no socket, record `none`.
3. Find native dependencies (these decide libc and builder packages later):
   - python: packages needing compilers when no wheel exists: `psycopg2` (not `psycopg2-binary`), `mysqlclient`, `lxml`, `cryptography` on old pins, anything with `setup.py` building C extensions. Also `grep -n "build-system" pyproject.toml`.
   - node: run `grep -l '"gypfile": true\|binding.gyp' -r node_modules/*/package.json` if `node_modules` exists, else list known native packages in `package.json` (`bcrypt`, `sharp`, `better-sqlite3`, `canvas`, `node-gyp`).
   - go: `grep -rn 'import "C"' --include=*.go <project_dir>`. Any hit means cgo is required.
   - java: JNI libraries in `src/main/resources` (`*.so`), or dependencies such as `netty-tcnative`, `sqlite-jdbc`, `rocksdbjni`.
4. Find the test command: `pyproject.toml` `[tool.pytest.ini_options]` or `pytest.ini` = `pytest`; `package.json` `scripts.test`; Go = `go test ./...`; Maven = `mvn -B test`; Gradle = `./gradlew test`. Copy the exact command from CI config if one exists.

### Output
`build_profile` with all fields filled or listed in `open_questions`.

### Quality Gate
- `entrypoint` is a JSON argv array (exec form), not a shell string.
- `native_deps` is present (an empty list is allowed only after the Phase 2 step 3 search ran and its command is recorded).
- `test_command` is copied from a repo file and the file is cited.

---

## Worked Example

Illustrative. Input: `project_dir=/src/orders-api`, `stack=python`.

Phase 1: `ls` shows `pyproject.toml`, `uv.lock`, `.python-version`. `.python-version` line 1 is `3.12`. Package manager `uv`, lockfile `uv.lock`, install command `uv sync --frozen --no-dev`.

Phase 2: `pyproject.toml` has no scripts; `Procfile` line 1 is `web: uvicorn orders.main:app --host 0.0.0.0 --port ${PORT:-8000}`. Grep finds `psycopg[binary]` (wheel available, not native build). Test command from `.github/workflows/ci.yml` line 41: `uv run pytest -q`.

```json
{"stack":"python","runtime_version":"3.12 (.python-version:1)","package_manager":"uv","lockfile":"uv.lock",
 "install_command":"uv sync --frozen --no-dev","build_command":"none",
 "entrypoint":["uvicorn","orders.main:app","--host","0.0.0.0","--port","8000"],
 "listen_port":"8000 (env PORT)","native_deps":[],"test_command":"uv run pytest -q","open_questions":[]}
```

---

## Exit Criteria

DONE when `build_profile` has every field filled from a cited repo file, or the unknown field is listed in `open_questions` for the user to answer before Dockerfile flows run.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stack` disagrees with files found (for example `stack=node` but only `go.mod` exists) | **Stop**: report both facts and ask the user which stack is correct. |
| Phase 1 | Version given only as a range | **Return**: list it in `open_questions`; do not choose a version. |
| Phase 1 | No lockfile | **Return**: record it; later flows must not invent pins. |
| Phase 2 | Several `package main` directories or several apps in one repo | **Stop**: ask which binary or app this image is for; one image per process. |
| Phase 2 | Entrypoint uses `npm start` or a shell script | **Adjust**: record the underlying command the script runs as argv, cite the script. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
