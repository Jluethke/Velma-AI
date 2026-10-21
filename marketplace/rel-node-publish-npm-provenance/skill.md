# npm Publish with Provenance and Correct dist-tag

**One-line description:** Publishes the exact tarball from the reproducible pack step to npm from GitHub Actions with provenance, using npm trusted publishing (OIDC) or a granular automation token, sets `--access public` for scoped packages and `--tag next` (or another non-`latest` tag) for pre-releases, and confirms integrity, dist-tags and provenance on the registry.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `node_dist` (object, required): From rel-node-reproducible-pack; tarball path and `integrity`.
- `package_name` (string, required): npm package name.
- `next_version` (object, required): Uses `semver`.
- `prerelease_id` (string, optional): Non-empty for a pre-release.
- `provenance_verification` (object, required): From rel-slsa-provenance-attest; must have `verified` = true.

---

## Outputs

- `npm_release_url` (object): `https://www.npmjs.com/package/<name>/v/<version>`, registry `dist.integrity`, dist-tags after publish, and whether provenance is attached.

---

## Phase 1: Preflight

### Entry Criteria
- `provenance_verification.verified` = true. Tarball file exists.

### Actions
1. Confirm the version is unused: `npm view <package_name>@<version> version`. Empty output with an `E404` error means free. npm never allows publishing the same name and version twice, even after unpublish.
2. Confirm the tarball's version: `tar -xzOf <tarball> package/package.json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).version))"` equals `next_version.semver`.
3. Choose the dist-tag:

   | Condition | `--tag` value |
   |---|---|
   | `prerelease_id` empty and version is the highest stable | `latest` (default) |
   | `prerelease_id` non-empty | `next` (or the `prerelease_id` itself, for example `rc`) |
   | Patch on an older maintenance line (for example 2.4.1 while 3.x is current) | a line tag such as `v2-lts`; never `latest` |

   Publishing without `--tag` assigns `latest`. A pre-release or an old-line patch on `latest` makes every `npm install <pkg>` pick it.
4. Scoped package (`@scope/name`) that should be public: add `--access public`; scoped packages default to restricted.

### Output
Dist-tag and access decision.

### Quality Gate
- The `npm view` check shows the version is free.
- The tarball version equals `next_version.semver`.

---

## Phase 2: Configure Authentication

### Entry Criteria
- Preflight passed.

### Actions
1. Prefer npm trusted publishing: on npmjs.com, package Settings, Trusted Publisher, add GitHub Actions with organization or user, repository, workflow file name and optional environment. It requires a recent npm CLI; check the minimum version in the npm trusted publishing docs and run `npm install -g npm@latest` in the job if the bundled npm is older. With trusted publishing, provenance is generated automatically.
2. Otherwise use a granular access token with publish rights to this package only, stored as `NPM_TOKEN`, and publish with `--provenance`.
3. Job settings:
   ```yaml
   publish-npm:
     needs: [build]
     runs-on: ubuntu-latest
     environment: npm
     permissions:
       contents: read
       id-token: write
     steps:
       - uses: actions/setup-node@v4
         with:
           node-version: lts/*
           registry-url: https://registry.npmjs.org
       - uses: actions/download-artifact@v4
         with: {name: npm-tarball, path: dist/}
       - run: npm publish dist/<tarball> --access public --tag <tag> --provenance
         env:
           NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```
   Drop `NODE_AUTH_TOKEN` when trusted publishing is configured. `registry-url` makes setup-node write an `.npmrc` that reads `NODE_AUTH_TOKEN`.
4. Publish the downloaded tarball, never `npm publish` from the source directory in this job; that would repack and change the integrity.

### Output
Publish job.

### Quality Gate
- `actionlint` reports no errors.
- The `npm publish` line names a `.tgz` path and an explicit `--tag`.

---

## Phase 3: Publish and Confirm

### Entry Criteria
- Job merged; release tag pushed.

### Actions
1. Watch the run: `gh run watch <id>`. The publish log shows `Signed provenance statement with source and build information from GitHub Actions` and `Provenance statement published to transparency log` when provenance works.
2. Confirm integrity: `npm view <package_name>@<version> dist.integrity` equals `node_dist.integrity`.
3. Confirm dist-tags: `npm view <package_name> dist-tags`. `latest` must point where Phase 1 decided.
4. Confirm provenance: `npm view <package_name>@<version> dist.attestations` shows an attestations URL with a provenance predicate.
5. If a pre-release landed on `latest`: `npm dist-tag add <package_name>@<previous stable> latest` and `npm dist-tag add <package_name>@<version> next`.

### Output
`npm_release_url`.

### Quality Gate
- Registry `dist.integrity` equals `node_dist.integrity` exactly.
- `dist-tags` output matches the Phase 1 decision.

---

## Worked Example

Illustrative. `@acme/fetcher` `3.3.0-rc.1`, `prerelease_id` = `rc`.

- Phase 1: `npm view @acme/fetcher@3.3.0-rc.1 version` returns `E404`. Tag decision: `next`. Scoped: `--access public`.
- Phase 2: trusted publisher configured for `acme/fetcher`, workflow `release.yml`, environment `npm`.
- Phase 3: `npm view @acme/fetcher dist-tags` prints `{ latest: '3.2.0', next: '3.3.0-rc.1' }`. `npm view @acme/fetcher@3.3.0-rc.1 dist.integrity` prints `sha512-7Qk...==`, equal to `node_dist`.

---

## Exit Criteria

DONE when the tarball from the reproducible pack is on npm with the decided dist-tag and access, registry integrity equals the local integrity, and provenance is attached.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Version exists | **Stop**: npm versions cannot be reused; go back to rel-semver-bump-decision. |
| Phase 3 | `E403 You cannot publish over the previously published versions` | **Stop**: same cause; never bump only the tarball name. |
| Phase 3 | `E402 Payment Required` on a scoped package | **Adjust**: add `--access public`. |
| Phase 3 | Provenance error about missing `id-token` | **Adjust**: add `id-token: write` to the job permissions. |
| Phase 3 | `latest` points to a pre-release | **Adjust**: move tags with `npm dist-tag add` as in Phase 3 step 5. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
