# Separate Build Args, Runtime Env and Build Secrets

**One-line description:** Classifies every `ARG` and `ENV` in a Dockerfile as build-time input, runtime configuration or secret, moves secrets to `RUN --mount=type=secret`, and proves nothing sensitive is baked into the image by reading `docker history --no-trunc`, `docker image inspect` and the output of `docker build --check`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Build context with the Dockerfile.
- `image_name` (string, required): Local image name.
- `build_secrets` (string[], optional): Secret IDs the build needs (for example `npmrc`, `pip_index_token`, `m2settings`). Empty means none expected.

---

## Outputs

- `build_config_report` (object): Table of every `ARG` and `ENV` with its class, the secret mounts added, the exact `docker build` command with `--secret` flags, and the leak-check outputs.

---

## Phase 1: Classify Every Variable

### Entry Criteria
- The Dockerfile builds.

### Actions
1. List them: `grep -nE '^\s*(ARG|ENV)\b' <project_dir>/Dockerfile`.
2. Classify each with this table:

| Variable is | Class | Correct mechanism |
|---|---|---|
| Needed only while building (versions, target platform, feature toggles for compile) | build-time | `ARG NAME=default`, passed with `--build-arg NAME=value` |
| Read by the app at runtime and safe to show (port, log level, `NODE_ENV`, `PYTHONUNBUFFERED`) | runtime default | `ENV NAME=value`; override at run with `-e` or Compose `environment:` |
| Token, password, private key, registry credential, `.npmrc`/`settings.xml`/`pip.conf` with auth | secret | build: `RUN --mount=type=secret`; runtime: injected by the orchestrator (`-e`, Compose `secrets:`, Kubernetes Secret), never in the Dockerfile |
| Needed at build AND runtime, not secret | both | `ARG NAME` then `ENV NAME=$NAME` in the stage that needs it |

3. Scope rules to check, because weak models get these wrong:
   - An `ARG` declared before the first `FROM` is visible only in `FROM` lines. To use it inside a stage, redeclare `ARG NAME` (no value) after that `FROM`.
   - An `ARG` declared in one stage is not visible in another stage. Redeclare it per stage.
   - `ARG` values are NOT secret. Values used by `RUN` appear in `docker history --no-trunc` and in build provenance attestations.
4. Mark any variable whose name contains `TOKEN`, `SECRET`, `PASSWORD`, `PASSWD`, `KEY`, `CREDENTIAL` or `AUTH` as `secret` unless the user confirms otherwise.

### Output
Classification table.

### Quality Gate
- Every line from step 1 appears in the table with one class.
- Every `secret` row is scheduled for Phase 2.

---

## Phase 2: Move Secrets to Secret Mounts

### Entry Criteria
- At least one `secret` row, or `build_secrets` not empty.

### Actions
1. Replace each secret `ARG`/`ENV`/`COPY` with a secret mount on the single `RUN` that needs it:
```
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
RUN --mount=type=secret,id=pip_index_token,env=PIP_INDEX_TOKEN \
    pip install --index-url "https://__token__:${PIP_INDEX_TOKEN}@<host>/simple" -r requirements.txt
```
   The `env=` option on secret mounts requires a recent Dockerfile frontend; keep `# syntax=docker/dockerfile:1` at the top and check the Dockerfile reference if the build reports an unknown option. Without `target` or `env`, the secret is a file at `/run/secrets/<id>`.
2. Build with the matching flags. Source from a file or an environment variable:
```
docker build --secret id=npmrc,src=$HOME/.npmrc --secret id=pip_index_token,env=PIP_INDEX_TOKEN -t <image_name>:dev <project_dir>
```
3. Remove every `COPY .npmrc`, `COPY settings.xml`, `COPY pip.conf`, `COPY id_rsa` line. For SSH-based private git dependencies use `RUN --mount=type=ssh` and `docker build --ssh default`.
4. Do NOT use `rm` in a later `RUN` to "delete" a copied secret; the file stays in the earlier layer.
5. Do NOT print secrets in `RUN` (no `cat /run/secrets/...`, no `set -x` around them).

### Output
Dockerfile without secret values, plus the build command.

### Quality Gate
- `grep -nE 'COPY .*(\.npmrc|settings\.xml|pip\.conf|id_rsa|\.env)' Dockerfile` returns nothing.
- The build with `--secret` flags exits 0.

---

## Phase 3: Prove No Leak

### Entry Criteria
- Image rebuilt.

### Actions
1. Lint with BuildKit's checks: `docker build --check <project_dir>`. Read each warning; `SecretsUsedInArgOrEnv` names any `ARG`/`ENV` that looks like a secret. Every such warning must be resolved or justified in the report. (Build checks need Buildx 0.15 or later; run `docker buildx version`.)
2. History: `docker history --no-trunc --format '{{.CreatedBy}}' <image_name>:dev | grep -iE 'token|secret|password|key='`. Must print nothing, or only lines that show a mount option without a value.
3. Config: `docker image inspect -f '{{json .Config.Env}}' <image_name>:dev`. No secret values.
4. Filesystem: `docker run --rm --entrypoint sh <image_name>:dev -c 'ls -la /root/.npmrc /root/.m2/settings.xml /run/secrets 2>&1'` (skip on images without a shell, and instead export the filesystem: `docker create --name leak <image_name>:dev && docker export leak | tar -t | grep -E 'npmrc|settings.xml|run/secrets'; docker rm leak`). Expect `No such file` or no output.
5. Scan for secrets with Trivy: `trivy image --scanners secret <image_name>:dev`. Expect `Secrets: 0` style output with no findings.

### Output
`build_config_report` with check outputs.

### Quality Gate
- `docker build --check` output has no unresolved `SecretsUsedInArgOrEnv` warning.
- Steps 2 to 5 each produce no secret match, with the commands and outputs pasted.

---

## Worked Example

Illustrative. Dockerfile has `ARG NPM_TOKEN` and `RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc && npm ci`.

Phase 1: `NPM_TOKEN` classified `secret`; `ARG NODE_VERSION` build-time; `ENV PORT=3000` runtime default.

Phase 2: replaced with `RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci`; build command `docker build --secret id=npmrc,src=$HOME/.npmrc -t web:dev .`.

Phase 3: `docker build --check .` prints `Check complete, no warnings found.` History grep prints nothing. `trivy image --scanners secret web:dev` reports no secrets.

---

## Exit Criteria

DONE when every variable is classified, no secret is passed through `ARG`, `ENV` or `COPY`, and history, config, filesystem and Trivy secret checks all come back empty.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unsure whether a value is secret | **Stop**: ask the user; treat it as secret until answered. |
| Phase 2 | Build fails: secret file empty or missing | **Retry**: confirm the `src=` path exists on the build host; the build does not fail on a missing secret by default unless `required=true` is set. |
| Phase 3 | Secret found in an old layer | **Adjust**: remove the line that wrote it and rebuild with `--no-cache`; tell the user to rotate the credential because the old image already contains it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
