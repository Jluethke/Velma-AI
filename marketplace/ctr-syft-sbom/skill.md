# Generate an Image SBOM with Syft

**One-line description:** Generates SPDX JSON and CycloneDX JSON software bills of materials for a built image with Syft, checks that OS packages and language packages (Python, npm, Go modules, Java archives) were all cataloged, and optionally attaches a BuildKit SBOM attestation with `docker buildx build --sbom=true`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `image_name` (string, required): Image to catalog; `:dev` or a pushed reference.
- `project_dir` (string, required): Where SBOM files are written under `sbom/`.

---

## Outputs

- `sbom_file` (object): Paths of the SPDX and CycloneDX files, Syft version, image digest cataloged, package counts by type, and any expected ecosystem that is missing.

---

## Phase 1: Generate

### Entry Criteria
- `syft version` prints a version. If not installed, run it as a container: `docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v <project_dir>/sbom:/out anchore/syft:<version> ...` (pin the tool image).

### Actions
1. Record the exact image identity: `docker image inspect -f '{{.Id}}' <image_name>:dev` (and `{{index .RepoDigests 0}}` if pushed).
2. Generate both formats in one pass:
```
mkdir -p <project_dir>/sbom
syft <image_name>:dev -o spdx-json=<project_dir>/sbom/sbom.spdx.json -o cyclonedx-json=<project_dir>/sbom/sbom.cdx.json
```
3. Scope: Syft's default scope is `squashed` (what is visible in the final filesystem). Use `--scope all-layers` only when you need packages that were deleted in later layers (for forensic review), and record which scope was used.
4. Source selection: if both a local daemon image and a registry image exist with the same name, force the source to avoid cataloging the wrong one: `syft docker:<image_name>:dev` (daemon) or `syft registry:<ref>` (registry). Check `syft --help` for the scheme list of your version.
5. Do NOT hand-edit SBOM files. They are generated evidence.

### Output
`sbom.spdx.json` and `sbom.cdx.json`.

### Quality Gate
- Both files exist and parse: `jq empty <file>` exits 0 for each.

---

## Phase 2: Check Coverage

### Entry Criteria
- Both files parse.

### Actions
1. Count packages: `jq '.packages | length' sbom/sbom.spdx.json` and `jq '.components | length' sbom/sbom.cdx.json`.
2. Count by type from the table view: `syft <image_name>:dev -o table | awk 'NR>1 {print $NF}' | sort | uniq -c`. The last column is the type (`deb`, `apk`, `python`, `npm`, `go-module`, `java-archive`, `binary`).
3. Check the expected ecosystems are present:

| stack | Must appear | If missing |
|---|---|---|
| python | `python` entries for the locked packages; `deb` for Debian bases | venv not in the final image, or site-packages path unusual; confirm with `docker run --rm --entrypoint ls <image> /opt/venv/lib` |
| node | `npm` entries | `node_modules` not in the image, or only a bundled file shipped; record that bundled code is invisible to the SBOM |
| go | `go-module` entries from the binary's embedded build info | binary built with `-buildvcs=false` is fine; missing modules means build info was stripped (for example by `upx`), record it |
| java | `java-archive` entries for the jars | layered extraction is fine; a shaded uber-jar may report fewer entries, record it |
| distroless | `deb` entries | distroless records packages in `/var/lib/dpkg/status.d/`; Syft reads it; absence means an old Syft, upgrade |

4. Spot-check one known dependency from the lockfile: `jq -r '.packages[] | select(.name=="<dep>") | .versionInfo' sbom/sbom.spdx.json` must equal the locked version.

### Output
Counts and coverage findings.

### Quality Gate
- The spot-checked dependency version in the SBOM equals the lockfile version (both pasted).
- Every expected ecosystem for the stack is present or explained.

---

## Phase 3: Attach an Attestation (Optional)

### Entry Criteria
- Image will be pushed to a registry, and the user wants SBOM attestations.

### Actions
1. BuildKit can generate and attach an SBOM (it runs a Syft-based scanner) when building:
```
docker buildx build --sbom=true --provenance=mode=max -t <registry>/<image_name>:<tag> --push <project_dir>
```
   Attestations require an exporter that supports them (push to a registry, or `--output type=oci`); the classic `docker` image store load may drop them.
2. Read it back: `docker buildx imagetools inspect <registry>/<image_name>:<tag> --format '{{json .SBOM}}' | jq '.SPDX.packages | length'`.
3. Keep the Phase 1 files as the reviewed artifact; the attestation is for consumers of the image.

### Output
`sbom_file` with attestation status.

### Quality Gate
- If attached, step 2 prints a package count. If skipped, the report says "attestation not attached".

---

## Worked Example

Illustrative. `inventory:dev` (Go on distroless static).

Phase 1: `syft inventory:dev -o spdx-json=sbom/sbom.spdx.json -o cyclonedx-json=sbom/sbom.cdx.json` prints `Cataloged packages [38 packages]`.

Phase 2: types: `4 deb` (base-files, netbase, tzdata, media-types), `33 go-module`, `1 binary` (Go stdlib). `jq` for `github.com/jackc/pgx/v5` returns `v5.7.1`, matching `go.sum`.

Phase 3: pushed with `--sbom=true`; `imagetools inspect --format '{{json .SBOM}}'` count prints `38`.

---

## Exit Criteria

DONE when SPDX and CycloneDX SBOMs exist for an identified image, parse, contain every ecosystem the stack ships, and a locked dependency version is confirmed inside them.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `could not fetch image` | **Retry**: use the explicit `docker:` source scheme, or `docker save` and `syft docker-archive:img.tar`. |
| Phase 2 | Language packages missing | **Return**: report the gap and its cause from the table; do not add packages by hand. |
| Phase 3 | Attestation absent after push | **Adjust**: use a `docker-container` buildx builder (`docker buildx create --use`) and push directly from buildx. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
