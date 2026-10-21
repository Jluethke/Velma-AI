# Run the Container as a Non-Root User

**One-line description:** Sets a numeric non-root `USER` in the runtime stage (reusing the base image's own user when it has one), fixes file ownership with `COPY --chown` instead of `chown -R` layers, moves the listen port off privileged ports, and verifies the running UID with `docker top` and a read-only, capability-dropped run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Build context with the Dockerfile.
- `image_name` (string, required): Local image name.
- `pinned_bases` (object, required): From `ctr-pin-base-digest`; the runtime image determines whether a user already exists.
- `app_port` (string, optional): Port the app listens on inside the container. Empty for workers and CLIs.

---

## Outputs

- `user_report` (object): The `USER` line set (UID:GID), how the user was created or reused, writable paths and how they are provided, the port decision, and verification output.

---

## Phase 1: Choose the User

### Entry Criteria
- The runtime image builds.

### Actions
1. Read the runtime base's configured user and passwd file:
   - `docker image inspect -f '{{.Config.User}}' <runtime_ref>`
   - If the image has a shell: `docker run --rm --entrypoint cat <runtime_ref> /etc/passwd`
2. Decide:

| Runtime base | Action |
|---|---|
| distroless `:nonroot` tag | Reuse UID/GID `65532:65532`. Add `USER 65532:65532` explicitly so the Dockerfile documents it. |
| `node:*` images | Reuse user `node`, UID 1000. Write `USER 1000:1000` (numeric). |
| Debian/Ubuntu slim with no app user | Create one: `RUN groupadd --system --gid <gid> app && useradd --system --uid <uid> --gid <gid> --no-create-home --shell /usr/sbin/nologin app` |
| Alpine | `RUN addgroup -S -g <gid> app && adduser -S -D -H -u <uid> -G app app` |
| scratch | No `/etc/passwd`; set `USER <uid>:<gid>` numerically. Copy a passwd file only if the app looks up its own user name. |

3. Choosing `<uid>` when creating a user: it must be non-zero and not already present in the image's `/etc/passwd` (check with step 1 output). If the platform the image runs on assigns UIDs (OpenShift runs containers with an arbitrary UID in group 0), ask the user; on such platforms make app files group-owned by GID 0 and group-writable where writes are needed.
4. Always use the numeric form in `USER`. Kubernetes `runAsNonRoot: true` refuses images whose `USER` is a name it cannot verify as non-zero.

### Output
Chosen UID:GID and creation method.

### Quality Gate
- The chosen UID is non-zero and, when created, absent from the base `/etc/passwd` output pasted in step 1.

---

## Phase 2: Ownership, Writable Paths and Port

### Entry Criteria
- UID:GID chosen.

### Actions
1. Set ownership at copy time: `COPY --from=build --chown=<uid>:<gid> /app /app`. Do NOT add `RUN chown -R <uid> /app` after a `COPY`; it duplicates every file into a new layer and doubles that directory's size in the image.
2. Application code should stay read-only to the app user where possible: copy it owned by root (default) and only give the user ownership of directories it writes. Find writes: `grep -rnE "open\(.*['\"]w|writeFile|os\.Create|FileOutputStream|mkdir" <project_dir>/src` and the app's config for cache, upload or temp directories.
3. For each writable directory, create it owned by the user in the Dockerfile (`RUN mkdir -p /app/data && chown <uid>:<gid> /app/data` on images with a shell; `COPY --chown` of an empty directory from the builder on distroless), or mount a volume / tmpfs at runtime.
4. Port: if `app_port` is below 1024, change the app's configured port to one at or above 1024 when the app reads it from config or env. Linux treats ports below `net.ipv4.ip_unprivileged_port_start` (default 1024) as privileged; Docker Engine lowers this sysctl inside containers, but Kubernetes and other runtimes may not, so a low port can fail with `EACCES`/`permission denied` there. If the port is hard-coded, record it as an open question instead of editing code.
5. Place `USER` after every `RUN` that needs root (package installs) and before `CMD`/`ENTRYPOINT`.

### Output
Updated Dockerfile.

### Quality Gate
- `grep -n "chown -R" Dockerfile` returns nothing.
- `docker image inspect -f '{{.Config.User}}' <image_name>:dev` prints the numeric `<uid>:<gid>`.

---

## Phase 3: Verify at Runtime

### Entry Criteria
- Image rebuilt.

### Actions
1. Start it the way a hardened platform would:
```
docker run -d --name nr-check --read-only --tmpfs /tmp --cap-drop ALL \
  --security-opt no-new-privileges:true -p <app_port>:<app_port> <image_name>:dev
```
2. Read the process UID from the host side (works without a shell in the image): `docker top nr-check -eo uid,pid,comm`. The UID column must show `<uid>`, not `0` or `root`.
3. `docker logs nr-check` must show the normal startup line and no `Permission denied` / `EACCES` / `Read-only file system` errors. Each such error names a path; return to Phase 2 step 3 for it.
4. `docker rm -f nr-check`.

### Output
`user_report` with verification output.

### Quality Gate
- `docker top` output shows the chosen UID for the app process.
- Logs contain the startup line and no permission errors.

---

## Worked Example

Illustrative. Python slim runtime, no app user, port 8000, app writes to `/app/uploads`.

Phase 1: `Config.User` is empty (root). `/etc/passwd` has UIDs 0 to 100 and 65534. Chosen `10001:10001`.

Phase 2: `RUN groupadd --system --gid 10001 app && useradd --system --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin app`, `RUN mkdir -p /app/uploads && chown 10001:10001 /app/uploads`, `USER 10001:10001`. Port 8000 kept.

Phase 3: `docker top nr-check -eo uid,pid,comm` prints `10001  48211  uvicorn`. Logs show `Uvicorn running on http://0.0.0.0:8000`, no permission errors.

---

## Exit Criteria

DONE when the image declares a numeric non-root `USER`, writable paths are explicit, and a read-only, all-capabilities-dropped run starts cleanly as that UID.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `useradd: UID <uid> is not unique` | **Adjust**: pick a UID absent from `/etc/passwd`, rebuild. |
| Phase 2 | App needs to bind port 80 and the port is hard-coded | **Stop**: report it as an open question; do not run as root to avoid it. |
| Phase 3 | `Read-only file system` on a path | **Adjust**: add a tmpfs or volume for that path, or fix the app config to use `/tmp`; rerun Phase 3. |
| Phase 3 | `docker top` shows UID 0 | **Return**: a later `USER root` or entrypoint script is switching back; find it with `grep -n USER Dockerfile`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
