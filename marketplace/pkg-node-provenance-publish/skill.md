# npm Publish With Provenance

**One-line description:** Publishes to npm from GitHub Actions with a signed provenance statement, using npm trusted publishing (OIDC) or a granular token, the correct dist-tag and access level, then verifies the attestation with `npm audit signatures`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `node_install_report` (object, required): From `pkg-node-clean-install`; verdict PASS.
- `package_name` (string, required): npm name, including scope.
- `release_version` (string, required): From `pkg-release-version-lock`.
- `repo_slug` (string, required): GitHub `owner/repo`; must match `repository.url` in `package.json`.

---

## Outputs

- `npm_publish_record` (object): Workflow path, auth method, dist-tag used, publish log, `npm view` output and `npm audit signatures` output.

---

## Phase 1: Choose Auth and Tag

### Entry Criteria
- `node_install_report` verdict PASS.

### Actions
1. Auth method:

   | Situation | Method |
   |---|---|
   | Package exists on npm and owner can edit its settings | trusted publishing: on npmjs.com, package Settings, add a trusted publisher for GitHub Actions with the org or user, repo, and workflow filename. Requires a recent npm CLI (11.5.1 or later per npm docs; confirm at docs.npmjs.com/trusted-publishers) |
   | First publish of a new name, or trusted publishing unavailable | granular access token with publish rights, stored as the repo secret `NPM_TOKEN`; switch to trusted publishing after the first release |

2. Dist-tag:

   | `release_version` | Flag |
   |---|---|
   | final (`3.0.0`) | default `latest`, no flag |
   | pre-release (`3.0.0-rc.1`) | `--tag next` (or `beta`), so `latest` users are not moved to it |
   | patch for an older major (`2.4.1` while `3.x` is latest) | `--tag v2-latest` or similar, so `latest` does not go backward |

3. Scoped packages are private by default: first publish needs `--access public` (or `publishConfig.access`).

### Output
Auth method and flags.

### Quality Gate
- The chosen table rows are recorded.

---

## Phase 2: Write the Workflow

### Entry Criteria
- Phase 1 done.

### Actions
1. Create `.github/workflows/npm-publish.yml`:
   ```yaml
   name: npm-publish
   on:
     push:
       tags: ["v*"]
   permissions:
     contents: read
     id-token: write
   jobs:
     publish:
       runs-on: ubuntu-latest
       environment: npm
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: "22"
             registry-url: "https://registry.npmjs.org"
         - run: npm install -g npm@latest
         - run: npm ci
         - run: npm test
         - run: npm publish --provenance --access public
           env:
             NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
   ```
2. With trusted publishing, remove the `env` block; npm exchanges the OIDC token and provenance is generated automatically.
3. Add `--tag next` for pre-releases per Phase 1.
4. `id-token: write` is required for provenance in both methods. Provenance only works from supported cloud CI runners, not a laptop.
5. Never echo `NPM_TOKEN`, never write an `.npmrc` with the token into the repo.

### Output
Workflow committed.

### Quality Gate
- `grep -n "id-token: write" .github/workflows/npm-publish.yml` prints a line.
- `git grep -n "npm_[A-Za-z0-9]\{36\}"` prints nothing.

---

## Phase 3: Publish and Verify

### Entry Criteria
- Release commit merged, workflow on default branch.

### Actions
1. Push the tag: `git tag -a v<release_version> -m v<release_version> && git push origin v<release_version>`.
2. Watch: `gh run watch`. The publish log ends with `+ <name>@<version>` and a line saying a provenance statement was published to the transparency log, with a URL.
3. Verify: `npm view <name>@<version> version dist.tarball` prints the version, and `npm view <name> dist-tags` shows `latest` (or `next`) at the right version.
4. Verify signatures from a consumer: in `/tmp/consumer`, `npm install <name>@<version>` then `npm audit signatures`. It reports verified registry signatures and verified attestations.
5. The npm package page shows a provenance section linking the commit and workflow run.

### Output
`npm_publish_record`.

### Quality Gate
- `npm view` prints `release_version`.
- `npm audit signatures` output contains a verified attestation count of at least one for this package.

---

## Worked Example

Illustrative. `@acme/qs-lite@3.0.0`, trusted publishing configured.

```
$ gh run watch
npm notice publish Signed provenance statement with source and build information from GitHub Actions
npm notice publish Provenance statement published to transparency log: https://search.sigstore.dev/?logIndex=...
+ @acme/qs-lite@3.0.0
$ npm view @acme/qs-lite dist-tags
{ latest: '3.0.0' }
$ npm audit signatures
audited 1 package in 1s
1 package has a verified registry signature
1 package has a verified attestation
```

---

## Exit Criteria

DONE when the version is on npm under the intended dist-tag with a provenance attestation that `npm audit signatures` verifies.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 3 | `E422` provenance repository mismatch | **Adjust**: `repository.url` must equal the publishing repo; fix and bump the patch version. |
| Phase 3 | `E403 You cannot publish over the previously published versions` | **Stop**: the version exists; bump through `pkg-release-version-lock`. |
| Phase 3 | `E402 Payment Required` on a scoped package | **Adjust**: add `--access public`. |
| Phase 3 | Defective release | **Return**: publish a fixed patch; use `npm deprecate <name>@<version> "<reason>"`; unpublish is limited by npm policy and breaks dependents. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
