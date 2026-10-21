# npm Reproducible Pack

**One-line description:** Builds the npm package from two clean checkouts of the release tag with `npm ci` and the lockfile, packs each with `npm pack --json`, compares the `integrity` and `shasum` values and file lists, and audits the file list for leaked files before anything is published.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the package root.
- `release_tag` (object, required): Tag name and commit SHA (from rel-tag-sign-git or the tag your release tool created).

---

## Outputs

- `node_dist` (object): Tarball path from build A, its `integrity` (sha512) and `shasum` (sha1) as printed by `npm pack --json`, `version`, and the file list.
- `node_repro_report` (object): `integrity` of A and B, `identical`, Node and npm versions, and the cause of any difference.

---

## Phase 1: Pin Toolchain and Inputs

### Entry Criteria
- `package-lock.json` (or `npm-shrinkwrap.json`) is committed at the tag: `git show <tag>:package-lock.json | head -1` prints `{`.

### Actions
1. Use the Node version the project declares: `.nvmrc`, `.node-version` or `engines.node`. Record `node --version` and `npm --version`; both builds use the same.
2. Read the lifecycle scripts that run during pack: `node -p "JSON.stringify(require('./package.json').scripts, null, 2)"`. `prepack`, `prepare` and `postpack` run on `npm pack`. Note any that write timestamps or git hashes into files.
3. Check the package version at the tag: `git show <tag>:package.json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).version))"`. If it prints `0.0.0-development` (semantic-release style), the version is set at publish time and this flow packs after `npm version <ver> --no-git-tag-version` in both builds.

### Output
Toolchain and script record.

### Quality Gate
- Node and npm versions are recorded.
- The lockfile exists at the tag.

---

## Phase 2: Pack Twice

### Entry Criteria
- Phase 1 done.

### Actions
1. `git worktree add /tmp/pack-a <tag>` and `git worktree add /tmp/pack-b <tag>`.
2. In each: `npm ci` (never `npm install`, which may rewrite the lockfile), then `mkdir -p /tmp/out-a && npm pack --json --pack-destination /tmp/out-a > /tmp/out-a.json` (and the same with `b`). npm writes every tar entry with a fixed modification date, so differences come from file contents, not from tar timestamps.
3. Each JSON file contains `filename`, `integrity`, `shasum`, `version`, `files` (path, size, mode).
4. Compare: `diff <(jq -S . /tmp/out-a.json) <(jq -S . /tmp/out-b.json)`. No output means identical metadata, including `integrity`.

### Output
Two pack results.

### Quality Gate
- `npm ci` exited 0 in both worktrees.
- Both `npm pack --json` outputs were saved and parsed by `jq`.

---

## Phase 3: Audit Contents and Explain Differences

### Entry Criteria
- Pack results exist.

### Actions
1. Audit the file list from build A (`jq -r '.[0].files[].path' /tmp/out-a.json`). Stop if it contains any of: `.env*`, `*.pem`, `*.key`, `.npmrc`, `coverage/`, test fixtures with credentials, or source maps that embed absolute paths (`grep -l '/home/\|/Users/\|C:\\\\' ` on the unpacked `.map` files). Fix with the `files` allowlist in `package.json` in a new release; do not publish this tarball.
2. If `integrity` differs between A and B, unpack both (`mkdir a b && tar -xzf <a.tgz> -C a && tar -xzf <b.tgz> -C b`) and run `diff -r a b`. Map the cause:

   | `diff -r` shows | Cause |
   |---|---|
   | a build-info file with a date or time | build script uses `Date.now()`; make it read `SOURCE_DATE_EPOCH` |
   | absolute paths in `.map` or bundled output | bundler embeds the checkout path; build from the same path or set the bundler's source root option |
   | different hashed chunk names | bundler output depends on file order or environment |
   | a file present in one only | a lifecycle script generated files conditionally |

3. Fill `node_dist` from build A.

### Output
`node_dist`, `node_repro_report`.

### Quality Gate
- `node_repro_report.identical` is true, or every differing file is listed with its cause.
- The file list audit result (clean or the blocking files) is recorded.

---

## Worked Example

Illustrative. `@acme/fetcher` at tag `v3.3.0`, Node 22, npm 10.

- Phase 1: `prepack` runs `tsc -p tsconfig.build.json`.
- Phase 2: `npm pack --json --pack-destination /tmp/out-a` prints:
  ```json
  [{"id":"@acme/fetcher@3.3.0","filename":"acme-fetcher-3.3.0.tgz","integrity":"sha512-7Qk...==","shasum":"3f2a...","entryCount":14,"files":[{"path":"dist/index.js","size":4120,"mode":420}]}]
  ```
  Build B prints the same `integrity`.
- Phase 3: file list has `dist/`, `README.md`, `LICENSE`, `package.json`; no secrets; source maps contain relative paths. Identical.

---

## Exit Criteria

DONE when the tarball was packed twice from clean tag checkouts with `npm ci`, the integrity values are compared, the file list passed the audit, and `node_dist` describes build A.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No lockfile at the tag | **Stop**: builds are not reproducible without it; add the lockfile and release again. |
| Phase 2 | `npm ci` fails: lockfile out of sync with package.json | **Stop**: the tag is broken; fix in a new release, never edit the tag. |
| Phase 3 | Secret or credential file in the tarball | **Stop**: do not publish; rotate the secret if it was ever pushed anywhere public. |
| Phase 3 | Integrity differs | **Return**: publish nothing until the cause is known and recorded. |
| Any | Using `npm pack` without `--json` and reading sizes by eye | **Adjust**: always use the JSON integrity value. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
