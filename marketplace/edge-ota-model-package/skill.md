# Edge OTA Model Package

**One-line description:** Assembles an over-the-air model update package containing the ONNX source, the device-keyed engine, a manifest with hashes, versions and the accuracy and benchmark evidence, then signs it with OpenSSL so the device can verify integrity and origin before installing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `engine_file` (object, required): Output of `edge-trtexec-engine-build`.
- `onnx_model` (object, required): Output of `edge-onnx-export-validate`.
- `engine_cache_key` (object, required): Output of `edge-trt-engine-cache-key`.
- `accuracy_report` (object, required): Output of `edge-quantization-accuracy-check`; must carry a PASS verdict.
- `benchmark_report` (object, required): Output of `edge-latency-throughput-benchmark`.
- `model_version` (string, required): Version string for this release, for example `2.3.0`, set by the user.

---

## Outputs

- `model_package` (object): Path to the package tarball, its detached signature, the manifest JSON, the sha256 of every file, the public key fingerprint used to verify, and the verification command.

---

## Phase 1: Assemble the Payload

### Entry Criteria
- `accuracy_report` verdict is PASS.

### Actions
1. Create a staging directory `pkg_<model_version>/` with:
   - `model.onnx` (from `onnx_model`)
   - `engines/<key>/model.engine` and `engines/<key>/key.json` (from `engine_cache_key`)
   - `labels.txt` or other runtime assets the app reads
2. Include the ONNX file always. A device whose live key differs from the packaged engine's key rebuilds from it instead of failing.
3. Write `manifest.json` with: `model_version`, `created_utc`, `files` (relative path to sha256 for every file, from `sha256sum`), `engine_keys` (list of packaged keys with their `key.json` fields), `accuracy` (metric name, value, drop, tolerance, verdict), `benchmark` (median throughput and p99 latency with power mode), and `min_l4t_release` and `tensorrt_version` from the key.

### Output
Staging directory with manifest.

### Quality Gate
- `cd pkg_<model_version> && sha256sum -c <(python3 -c "import json;m=json.load(open('manifest.json'));[print(h+'  '+p) for p,h in m['files'].items()]")` prints `OK` for every file.
- `manifest.json` accuracy verdict is PASS.

---

## Phase 2: Pack and Sign

### Entry Criteria
- Manifest verified.

### Actions
1. Pack deterministically: `tar --sort=name --owner=0 --group=0 --numeric-owner --mtime='UTC 1970-01-01' -czf edge-model-<model_version>.tar.gz -C pkg_<model_version> .` (GNU tar 1.28 or newer for `--sort`; check `tar --version`).
2. Sign with the release private key, kept off the device: `openssl dgst -sha256 -sign release_key.pem -out edge-model-<model_version>.tar.gz.sig edge-model-<model_version>.tar.gz`.
3. Verify with the public key that is installed on devices: `openssl dgst -sha256 -verify release_pub.pem -signature edge-model-<model_version>.tar.gz.sig edge-model-<model_version>.tar.gz`. It must print `Verified OK`.
4. Record the public key fingerprint: `openssl pkey -pubin -in release_pub.pem -outform DER | sha256sum`.

Do NOT: put the private key on any device or in the package. Do NOT skip signing because transport uses TLS; TLS protects the transfer, not the origin of the file at rest.

### Output
Tarball and signature.

### Quality Gate
- `openssl dgst -verify` prints `Verified OK`.
- `tar -tzf` lists `manifest.json` and every file in the manifest.

---

## Phase 3: Record

### Entry Criteria
- Signature verified.

### Actions
1. Record the tarball sha256 and size.
2. Write the device-side verification steps into `model_package`: verify signature, extract to a temporary directory, run `sha256sum -c` from the manifest, compare `min_l4t_release` to `/etc/nv_tegra_release`.
3. Assemble `model_package`.

### Output
`model_package`.

### Quality Gate
- `model_package` contains the verification command with the public key path.
- Rebuilding the tarball from the same staging directory yields the same sha256 (reproducibility check).

---

## Worked Example

Illustrative only.

```
$ tar --sort=name --owner=0 --group=0 --numeric-owner --mtime='UTC 1970-01-01' -czf edge-model-2.3.0.tar.gz -C pkg_2.3.0 .
$ openssl dgst -sha256 -sign release_key.pem -out edge-model-2.3.0.tar.gz.sig edge-model-2.3.0.tar.gz
$ openssl dgst -sha256 -verify release_pub.pem -signature edge-model-2.3.0.tar.gz.sig edge-model-2.3.0.tar.gz
Verified OK
```
Package holds the ONNX, one engine for key `3f7a09c2d1b84e65`, and manifest with accuracy PASS.

---

## Exit Criteria

DONE when a signed, reproducible package with a hash-complete manifest and recorded evidence exists, and its signature verifies with the device public key.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Accuracy verdict not PASS | **Stop**: do not package an engine that failed accuracy. |
| Phase 1 | Hash mismatch on a staged file | **Stop**: re-copy the file from its source and recompute. |
| Phase 2 | `Verification failure` | **Stop**: wrong key pair; never ship an unverifiable package. |
| Phase 3 | Rebuild gives a different hash | **Adjust**: check tar version and flags; gzip header time can vary, so use `gzip -n` via `tar -I 'gzip -n'` if needed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
