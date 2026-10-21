# Node.js Multi-Stage Dockerfile

**One-line description:** Writes a multi-stage Dockerfile for a Node.js service that installs from the lockfile with `npm ci`, `pnpm install --frozen-lockfile` or Yarn immutable installs, compiles TypeScript in a build stage, prunes to production dependencies, and runs `node` directly as PID 1 with correct signal handling in a slim or distroless runtime.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root and build context.
- `build_profile` (object, required): From `ctr-stack-inventory` with `stack=node`.
- `pinned_bases` (object, required): From `ctr-pin-base-digest`.

---

## Outputs

- `node_dockerfile` (object): Path to the Dockerfile, stage names (`deps`, `build`, `prod-deps`, `runtime`), the build command, and Phase 3 verification output.

---

## Phase 1: Dependency and Build Stages

### Entry Criteria
- `build_profile.lockfile` exists (`package-lock.json`, `pnpm-lock.yaml` or `yarn.lock`).

### Actions
1. Start with `# syntax=docker/dockerfile:1`.
2. Pick install commands from the lockfile. Never use `npm install` in a Dockerfile; it can rewrite the lockfile.

| lockfile | full install | production-only install | cache mount target |
|---|---|---|---|
| `package-lock.json` | `npm ci` | `npm ci --omit=dev` | `/root/.npm` |
| `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` | `pnpm install --frozen-lockfile --prod` | `/root/.local/share/pnpm/store` (confirm with `pnpm store path`) |
| `yarn.lock` + `.yarnrc.yml` (Berry) | `yarn install --immutable` | `yarn workspaces focus --production` (built in from Yarn 4; plugin in Yarn 3) | `/root/.yarn/berry/cache` |
| `yarn.lock` only (classic) | `yarn install --frozen-lockfile` | `yarn install --frozen-lockfile --production` | `/usr/local/share/.cache/yarn` |

3. For pnpm and Yarn Berry, enable Corepack first so the version in `package.json` `packageManager` is used: `RUN corepack enable`. Check the base image still ships Corepack (`docker run --rm <builder_ref> corepack --version`); if not, install the pinned version with `npm install -g pnpm@<version from packageManager>`.
4. Write the stages (npm shown):
```
FROM <builder_ref> AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM <builder_ref> AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
```
5. If the project has no build script (plain JavaScript), skip the `build` stage and copy source in the runtime stage instead.
6. Private registry tokens: never `COPY .npmrc`. Use `RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci` and build with `--secret id=npmrc,src=$HOME/.npmrc` (see `ctr-build-args-secrets`).

### Output
Dependency and build stages.

### Quality Gate
- `docker build --target build <project_dir>` exits 0.
- `grep -n "npm install\b" Dockerfile` returns nothing.

---

## Phase 2: Runtime Stage and PID 1

### Entry Criteria
- Build stage succeeds.

### Actions
1. Slim runtime:
```
FROM <runtime_ref> AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE <listen_port>
CMD ["node", "dist/server.js"]
```
   Distroless `nodejs<major>-debian12` images already set `ENTRYPOINT ["/nodejs/bin/node"]`; there the command is `CMD ["dist/server.js"]` and the user is `nonroot` (65532), so use `--chown=65532:65532`.
2. Signals: as PID 1, Node gets no default handler for SIGTERM, so `docker stop` waits for the timeout (10 seconds default) then sends SIGKILL. Apply one of these, in order of preference:
   - The app already handles `process.on('SIGTERM', ...)` (grep for it). Then nothing else is needed.
   - Otherwise add an init: in Debian slim, `RUN apt-get update && apt-get install -y --no-install-recommends tini && rm -rf /var/lib/apt/lists/*` and `ENTRYPOINT ["/usr/bin/tini", "--"]`; or tell the operator to run with `docker run --init` (Compose: `init: true`).
3. Do NOT use `CMD ["npm", "start"]`. npm adds a process layer and does not reliably forward signals.
4. Native addons (`sharp`, `bcrypt`, `better-sqlite3`): the `prod-deps` stage must use the same base OS and libc as `runtime`, or the compiled `.node` file will not load. Keep both on the same Debian release.

### Output
Complete Dockerfile.

### Quality Gate
- `docker build -t <name>:dev <project_dir>` exits 0.
- `CMD`/`ENTRYPOINT` are JSON arrays and start `node` or `tini`, never `npm`.

---

## Phase 3: Verify Inside the Image

### Entry Criteria
- Image built.

### Actions
1. No dev dependencies: `docker run --rm --entrypoint node <name>:dev -e "require.resolve('typescript')"` must fail with `Cannot find module 'typescript'` (replace with any package listed only in `devDependencies`).
2. Production deps load: `docker run --rm --entrypoint node <name>:dev -e "require('<a dependency>')"` exits 0.
3. Signal handling: `docker run -d --name nodesig <name>:dev`, then measure `time docker stop nodesig`. Then `docker inspect -f '{{.State.ExitCode}}' nodesig`. Exit code 137 after about the stop timeout means SIGTERM was ignored; return to Phase 2 step 2. Exit 0 or 143 promptly means handled. `docker rm nodesig`.
4. Read the startup log: `docker logs nodesig` shows the server's listening line.

### Output
`node_dockerfile` with verification outputs.

### Quality Gate
- Step 1 prints `Cannot find module` for a dev-only package.
- Step 3 exit code is not 137.

---

## Worked Example

Illustrative. Node 22, npm, TypeScript, `entrypoint=["node","dist/server.js"]`, port 3000.

Phase 1: `deps` runs `npm ci` (`added 412 packages`), `build` runs `tsc -p .`, `prod-deps` runs `npm ci --omit=dev` (`added 61 packages`).

Phase 2: runtime `node:22-bookworm-slim@sha256:...`, `USER node`, `CMD ["node","dist/server.js"]`. Grep finds no SIGTERM handler, so tini is added.

Phase 3: `require.resolve('typescript')` prints `Error: Cannot find module 'typescript'`. `time docker stop nodesig` reports `real 0m0.6s`; exit code 143.

---

## Exit Criteria

DONE when the image installs from the lockfile, ships only production dependencies and compiled output, runs `node` (directly or under tini) as non-root, and stops promptly on SIGTERM.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `npm ci` fails: lockfile out of sync with `package.json` | **Stop**: ask the user to regenerate and commit the lockfile; do not switch to `npm install`. |
| Phase 1 | `node-gyp` errors for a native addon | **Adjust**: add `python3 make g++` to the `deps` and `prod-deps` stages only. |
| Phase 2 | `Error: ... invalid ELF header` or `GLIBC_x.y not found` at runtime | **Adjust**: put `prod-deps` and `runtime` on the same OS base, rebuild. |
| Phase 3 | Exit code 137 on stop | **Return**: apply Phase 2 step 2 and rerun Phase 3. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
