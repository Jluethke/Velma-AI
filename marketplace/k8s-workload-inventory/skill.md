# Kubernetes Workload Inventory

**One-line description:** Reads an application's repository and container image and records every fact a Kubernetes manifest needs (workload kind, listen port, entrypoint form, image user, image platforms, environment variables, secrets, writable paths, dependencies) so no later flow has to guess.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the application repository that contains the Dockerfile (or Containerfile) and source code.
- `app_name` (string, required): DNS-1123 label used as the Kubernetes object name (lowercase letters, digits and '-', at most 63 characters, starts and ends with an alphanumeric).
- `image_ref` (string, required): Full image reference, for example `ghcr.io/acme/orders:1.4.2` or `ghcr.io/acme/orders@sha256:...`.
- `stack` (string, required): One of `python`, `node`, `go`, `java`. Selects the stack-specific flows later in the chain.

---

## Outputs

- `workload_profile` (object): Keys `app_name`, `stack`, `workload_kind`, `container_port`, `port_name`, `protocol`, `entrypoint_form`, `image_user`, `image_platforms`, `image_digest`, `env_vars` (name, source file, line, secret yes/no), `writable_paths`, `dependencies` (host, port, protocol), `existing_health_routes`, `open_questions`.

---

## Phase 1: Classify the Workload Kind

### Entry Criteria
- `repo_dir` exists and contains a `Dockerfile`, `Containerfile`, or a build file that produces an image (for example `jib` in `pom.xml` or `ko` config for Go).
- `app_name` matches the regex `^[a-z0-9]([-a-z0-9]*[a-z0-9])?$` and is at most 63 characters.

### Actions
1. Run `test -f "$REPO/Dockerfile" && echo found` (or the Containerfile path). If no image build file exists, record it in `open_questions` and continue with source reading only.
2. Read the Dockerfile final stage only (the last `FROM` line and everything after it). Earlier stages do not ship.
3. Classify the workload with this table. Use the first row that matches.

| Observation in code or README | `workload_kind` |
|---|---|
| Process exits after finishing work (batch script, migration, report) and is run on a schedule | `CronJob` |
| Process exits after finishing work, run once per release | `Job` |
| Process must run on every node (log shipper, node agent, reads `/var/log` or host paths) | `DaemonSet` |
| Each replica needs its own stable name or its own persistent volume (database, broker, consensus member) | `StatefulSet` |
| Long-running server, any replica can serve any request, state lives in an external store | `Deployment` |

4. If the result is anything other than `Deployment`, write it to `workload_kind`, add "this chain targets Deployments" to `open_questions`, and **Stop** the chain. Do not force a stateful process into a Deployment.

### Output
`workload_kind` decided with the table row cited.

### Quality Gate
- `workload_kind` is one of the five table values and the matching row is quoted.
- `app_name` passes `echo "$APP" | grep -Eq '^[a-z0-9]([-a-z0-9]*[a-z0-9])?$' && echo ok` and prints `ok`.

---

## Phase 2: Read the Image Facts

### Entry Criteria
- `workload_kind` == `Deployment`.

### Actions
1. Resolve the digest: `docker buildx imagetools inspect "$IMAGE"`. Copy the `Digest:` line into `image_digest` and every `Platform:` line into `image_platforms`. If the tool is missing, use `crane digest "$IMAGE"` and `crane manifest "$IMAGE"`.
2. List node architectures: `kubectl get nodes -L kubernetes.io/arch`. Every value in the `ARCH` column must appear in `image_platforms` (for example node `arm64` needs `linux/arm64`). A missing platform produces `exec format error` at container start; record it in `open_questions`.
3. Read the image user: `docker image inspect "$IMAGE" --format '{{.Config.User}}'`. Record the exact string. Empty means root. A name such as `app` (not numeric) matters later: `runAsNonRoot: true` cannot verify a non-numeric user and the pod fails with `CreateContainerConfigError`.
4. Read the entrypoint: `docker image inspect "$IMAGE" --format '{{json .Config.Entrypoint}} {{json .Config.Cmd}}'`. Set `entrypoint_form` with this table.

| Entrypoint/Cmd shape | `entrypoint_form` | Consequence |
|---|---|---|
| JSON array whose first element is the runtime binary (`["node","server.js"]`, `["/app/server"]`, `["gunicorn",...]`, `["java","-jar",...]`) | `exec-direct` | Process is PID 1 and receives SIGTERM |
| First element is `/bin/sh` and `-c` | `shell-wrapped` | Shell is PID 1; SIGTERM may never reach the app |
| First element is `npm`, `yarn` or `pnpm` | `package-manager` | Package manager is PID 1; it may not forward SIGTERM |
| First element is `tini`, `dumb-init` or similar init | `init-wrapped` | Init forwards signals |

5. Read the listen port from the code, not only `EXPOSE`. Search with the stack pattern and record the file and line:

| `stack` | Search command |
|---|---|
| python | `grep -rnE "bind|--port|port=|PORT" --include=*.py --include=*.cfg --include=*.toml --include=Dockerfile "$REPO"` |
| node | `grep -rnE "listen\(|PORT" --include=*.js --include=*.ts --include=Dockerfile "$REPO"` |
| go | `grep -rnE "ListenAndServe|net.Listen|Addr:" --include=*.go "$REPO"` |
| java | `grep -rnE "server.port|management.server.port" -r "$REPO/src/main/resources" "$REPO/Dockerfile"` |

6. Set `container_port` to the port the process binds, `port_name` to `http` (or `grpc` when the server is gRPC), and `protocol` to `TCP`. If the code binds a port below 1024, record it in `open_questions`: a non-root container should listen on a high port and let the Service map port 80 to it.

### Output
Image facts: `image_digest`, `image_platforms`, `image_user`, `entrypoint_form`, `container_port`.

### Quality Gate
- `image_digest` starts with `sha256:` and was copied from tool output, not typed.
- Every node architecture printed by `kubectl get nodes -L kubernetes.io/arch` is present in `image_platforms`, or the gap is listed in `open_questions`.
- `container_port` cites a file and line from the grep output.

---

## Phase 3: Read Configuration, Writable Paths and Dependencies

### Entry Criteria
- Phase 2 complete.

### Actions
1. Find every environment variable the code reads:

| `stack` | Command |
|---|---|
| python | `grep -rnoE "os\.(environ(\.get)?\[?\(?|getenv\()['\"][A-Z0-9_]+" --include=*.py "$REPO"` |
| node | `grep -rnoE "process\.env\.[A-Z0-9_]+|process\.env\[['\"][A-Z0-9_]+" --include=*.js --include=*.ts "$REPO"` |
| go | `grep -rnoE "os\.(Getenv|LookupEnv)\(\"[A-Z0-9_]+" --include=*.go "$REPO"` |
| java | `grep -rnoE "System\.getenv\(\"[A-Z0-9_]+|\\$\{[A-Z0-9_.]+" "$REPO/src/main"` |

2. Mark a variable `secret: yes` when its name contains `PASSWORD`, `SECRET`, `TOKEN`, `KEY`, `CREDENTIAL`, `DSN`, or `DATABASE_URL`, or when its value in any sample `.env` file contains a password. Everything else is `secret: no`. Never copy secret values into the profile; record names only.
3. Find writable paths: search for file writes (`open(..., 'w')`, `fs.writeFile`, `os.Create`, `Files.write`), temp directory use (`tempfile`, `os.tmpdir()`, `os.TempDir()`, `java.io.tmpdir`) and caches. Record each directory in `writable_paths`. Add `/tmp` when any temp API is used. These become `emptyDir` mounts when the root filesystem is made read-only.
4. Find dependencies: database URLs, broker hosts, HTTP clients pointed at other services. Record host, port and protocol for each in `dependencies`. NetworkPolicy egress rules are written from this list.
5. Find existing health routes: `grep -rnE "health|livez|readyz|ready|alive|actuator" "$REPO" --include=*.py --include=*.js --include=*.ts --include=*.go --include=*.java --include=*.properties --include=*.yml`. Record route paths in `existing_health_routes`.
6. Assemble `workload_profile` as one JSON object with every key listed under Outputs.

### Output
`workload_profile`.

### Quality Gate
- Every `env_vars` entry has a file and line from grep output.
- `workload_profile` contains no secret values: `grep -iE "password|secret|token" profile.json` returns names only, no values.
- `dependencies` has one entry per external host found, or the literal note "no outbound dependencies found by search".

---

## Worked Example

Illustrative only. Input: `repo_dir=/src/orders`, `app_name=orders`, `image_ref=ghcr.io/acme/orders:1.4.2`, `stack=python`.

Phase 1: the README says "HTTP API for orders, state in PostgreSQL". Table row "Long-running server" gives `Deployment`.

Phase 2:
```
$ docker buildx imagetools inspect ghcr.io/acme/orders:1.4.2
Name:      ghcr.io/acme/orders:1.4.2
MediaType: application/vnd.oci.image.index.v1+json
Digest:    sha256:3f9c...e1
Manifests:
  Platform:  linux/amd64
  Platform:  linux/arm64
$ kubectl get nodes -L kubernetes.io/arch
NAME     STATUS   ROLES    AGE   VERSION   ARCH
node-a   Ready    <none>   40d   v1.31.4   amd64
$ docker image inspect ghcr.io/acme/orders:1.4.2 --format '{{.Config.User}}'
app
$ docker image inspect ghcr.io/acme/orders:1.4.2 --format '{{json .Config.Entrypoint}} {{json .Config.Cmd}}'
null ["gunicorn","-c","gunicorn.conf.py","orders.wsgi:application"]
```
`image_user=app` (non-numeric, flagged), `entrypoint_form=exec-direct`, `container_port=8000` from `gunicorn.conf.py:3 bind = "0.0.0.0:8000"`.

Phase 3: env vars `DATABASE_URL` (secret), `LOG_LEVEL`, `ALLOWED_HOSTS`; writable path `/tmp`; dependency `postgres.data.svc:5432/TCP`; existing route `/healthz` in `orders/urls.py:14`.

---

## Exit Criteria

DONE when `workload_profile` is written with every key filled or explained in `open_questions`, and `workload_kind` is `Deployment`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `app_name` fails the DNS-1123 regex | **Stop**: ask for a valid name; Kubernetes rejects the object at apply time. |
| Phase 1 | Workload is not a Deployment | **Stop**: report `workload_kind`; this chain only builds Deployments. |
| Phase 2 | `imagetools inspect` returns unauthorized | **Adjust**: run `docker login <registry>` and repeat; do not guess the digest. |
| Phase 2 | Node architecture missing from image platforms | **Return**: send the image back to the build to add the platform (`docker buildx build --platform linux/amd64,linux/arm64`). |
| Phase 3 | Listen port differs between code and `EXPOSE` | **Adjust**: trust the code value and record the mismatch in `open_questions`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
