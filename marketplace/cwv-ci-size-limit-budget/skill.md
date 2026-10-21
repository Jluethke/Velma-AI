# size-limit Bundle Budget in CI

**One-line description:** Adds `size-limit` with `@size-limit/file` (or `@size-limit/preset-app` for time-to-run checks) to the repository, sets each limit from the current measured size of the initial JavaScript and CSS plus a user-set headroom, and runs it on every pull request so bundle growth fails the build.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `ci_platform` (string, required): `github-actions` or `gitlab-ci`.
- `size_headroom` (string, optional): Allowed growth over the measured size, set by the user (for example a percent or a byte count). When empty, the limit equals the measured size (no growth allowed) and headroom is listed as an open question.

---

## Outputs

- `size_limit_config` (object): `.size-limit.json` content, the measured size per entry, the headroom applied, and the compression used.
- `size_ci_job` (object): CI file path, job definition, and the first run result.

---

## Phase 1: Measure Current Sizes

### Entry Criteria
- `npm run build` succeeds.

### Actions
1. Install: `npm install --save-dev size-limit @size-limit/file`.
2. Identify the initial files by build tool:
   | Build | Initial files glob |
   |---|---|
   | Vite | The entry and `modulepreload` files from `dist/index.html`; often `dist/assets/index-*.js` plus vendor chunks, and `dist/assets/index-*.css` |
   | webpack | Files for the entrypoint from `stats.json` (`jq '.entrypoints'`), for example `dist/main.*.js` |
   | Next.js | `.next/static/chunks/main-*.js`, `.next/static/chunks/framework-*.js`, `.next/static/chunks/pages/_app-*.js` (Pages Router) or the app chunks listed in build output; confirm with `ls .next/static/chunks` |
3. Create a draft `.size-limit.json` without limits:
   ```json
   [
     { "name": "initial JS", "path": ["dist/assets/index-*.js", "dist/assets/vendor-*.js"] },
     { "name": "initial CSS", "path": "dist/assets/index-*.css" }
   ]
   ```
4. Measure: `npx size-limit --json`. Read the `size` value for each entry. Record which compression the plugin applied (current `@size-limit/file` defaults to brotli; set `"gzip": true` or `"brotli": false` per the size-limit README if you need another, and record it).

### Output
Measured size per entry.

### Quality Gate
- `npx size-limit --json` output is saved and each entry reports a non-zero size.
- The globs match the files in `dist/index.html` or `stats.json` entrypoints (list both and compare).

---

## Phase 2: Set Limits

### Entry Criteria
- Sizes measured.

### Actions
1. Limit per entry = measured size plus `size_headroom`. If `size_headroom` is empty, limit = measured size.
2. Write limits with units size-limit accepts, for example `"limit": "142 kB"`. Round up to the next whole kB only, and record the exact measured bytes.
3. Final `.size-limit.json`:
   ```json
   [
     { "name": "initial JS", "path": ["dist/assets/index-*.js", "dist/assets/vendor-*.js"], "limit": "142 kB" },
     { "name": "initial CSS", "path": "dist/assets/index-*.css", "limit": "12 kB" }
   ]
   ```
4. Add a script: `"size": "npm run build && size-limit"` in `package.json`.
5. Run `npm run size`; it must pass on the current branch.

### Output
`size_limit_config`.

### Quality Gate
- `npm run size` exits 0.
- Each limit equals measured plus headroom, shown with the arithmetic in the output.

---

## Phase 3: Add the CI Job

### Entry Criteria
- `npm run size` passes locally.

### Actions
1. Write the job:
   | `ci_platform` | Job |
   |---|---|
   | `github-actions` | `.github/workflows/size.yml` on `pull_request`: checkout, setup-node, `npm ci`, `npm run size`. Optionally use the community `andresz1/size-limit-action` to comment size diffs on PRs (read its README for inputs and required permissions). |
   | `gitlab-ci` | Job `size` with a Node image: `npm ci`, `npm run size`. |
2. Push a branch and read the job log.
3. Prove the gate: on a throwaway branch, add a large import to the entry file, push, and confirm the job fails with "Size limit has been exceeded" (wording may vary by version; record the actual line). Delete the branch after.
4. Tell the team the rule: a limit increase requires a pull request that states why. Do not raise limits to make a red job green without that.

### Output
`size_ci_job`.

### Quality Gate
- The first CI run passes and the deliberate regression run fails; both run links are recorded.

---

## Worked Example

Illustrative only. Vite app, GitHub Actions, `size_headroom` = 2 percent (user choice).

Phase 1:
```text
$ npx size-limit --json
[{"name":"initial JS","passed":true,"size":138912},{"name":"initial CSS","passed":true,"size":11204}]
```
Phase 2: JS limit = 138,912 x 1.02 = 141,690 bytes, written as `"142 kB"`; CSS limit = 11,204 x 1.02 = 11,428 bytes, written as `"12 kB"`.

Phase 3: PR run passes. Regression branch imports `moment` in `src/main.tsx`:
```text
  initial JS
  Size limit: 142 kB
  Size:       209.4 kB  with all dependencies, minified and brotlied
```
Job fails as intended.

---

## Exit Criteria

DONE when `.size-limit.json` limits come from measured sizes plus stated headroom, `npm run size` passes locally and in CI, and a deliberate regression fails the job.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Glob matches no files | **Adjust**: list the build directory and fix the glob; hashed names change but prefixes stay. |
| Phase 2 | User gives no headroom | **Adjust**: use zero headroom and list it as an open question. |
| Phase 3 | Job fails on main after merge | **Stop**: find the PR that grew the bundle; do not raise the limit without a recorded reason. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
