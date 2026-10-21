# Edge TensorRT Engine Cache Key per Device

**One-line description:** Defines a deterministic cache key for a serialized TensorRT engine from every fact that makes an engine non-portable (ONNX hash, TensorRT version, L4T release, compute capability, precision, shape profile, DLA core), stores the engine under that key, and makes the runtime rebuild instead of loading a mismatched engine.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `engine_file` (object, required): Output of `edge-trtexec-engine-build`.
- `onnx_model` (object, required): Output of `edge-onnx-export-validate`.
- `platform_report` (object, required): Output of `edge-jetpack-l4t-version-check`.
- `cuda_stack_report` (object, required): Output of `edge-cuda-cudnn-aarch64-verify`.
- `precision` (string, required): Precision the engine was built with.
- `input_shapes` (object, required): The profile shapes used in the build.

---

## Outputs

- `engine_cache_key` (object): The key string, the JSON of all fields that make it up, the cache directory path where the engine is stored, and the runtime check procedure that compares the key before loading.

---

## Phase 1: Collect Key Fields

### Entry Criteria
- All inputs exist.

### Actions
1. Collect exactly these fields:

| Field | Source |
|---|---|
| `onnx_sha256` | `onnx_model` |
| `tensorrt_version` | `TensorRT version:` line in the build log or `tensorrt.__version__` |
| `l4t_release` | `platform_report` (for example `R36.4.0`) |
| `compute_capability` | `cuda_stack_report` (for example `8.7`) |
| `module_model` | `platform_report` |
| `precision` | `precision`, plus `calib_sha256` when INT8 with a cache |
| `profile` | min, opt, max per input from `input_shapes` |
| `dla_core` | the DLA core or `none` |
| `trtexec_flags` | the sorted list of build flags from `engine_file` |

2. Serialize the fields as JSON with sorted keys and no whitespace: `python3 -c "import json,sys; print(json.dumps(d, sort_keys=True, separators=(',',':')))"`.
3. Key = first 16 hex characters of the sha256 of that JSON string. Record the full JSON next to it so a collision can be checked.

### Output
Key fields JSON and key string.

### Quality Gate
- All nine field rows have a value (`none` is a value where noted).
- Recomputing the key from the saved JSON gives the same string.

---

## Phase 2: Store Under the Key

### Entry Criteria
- Key computed.

### Actions
1. Create `/opt/edge-models/engines/<key>/` on the device (path is a convention; record the one used).
2. Copy the engine to `<key>/model.engine` and write `<key>/key.json`.
3. Write `<key>/model.engine.sha256` with `sha256sum model.engine > model.engine.sha256`.
4. Never overwrite an existing key directory. A new build with identical fields produces the same key; compare sha256 and keep the existing one if they match.

### Output
Populated cache directory.

### Quality Gate
- `sha256sum -c model.engine.sha256` prints `OK` inside the key directory.
- `key.json` parses with `python3 -m json.tool`.

---

## Phase 3: Define the Runtime Check

### Entry Criteria
- Engine stored.

### Actions
1. Write the load procedure the runtime follows on start:
   1. Compute the live fields (TensorRT version, L4T release, compute capability, module) on the device.
   2. Recompute the key with the deployment's ONNX hash, precision, profile and DLA core.
   3. If `<key>/model.engine` exists and its sha256 verifies, load it.
   4. Otherwise rebuild from ONNX with the recorded flags (see `edge-trtexec-engine-build`), store under the new key, then load.
2. Record the deserialization failure text so an operator recognizes it: a TensorRT runtime fed an engine from another version logs an error about the serialized engine or version tag not matching and returns a null engine. The application must treat null as "rebuild", never retry the same file in a loop.
3. Note TensorRT's version-compatible and hardware-compatible engine options; check the TensorRT Developer Guide for whether they apply to Jetson integrated GPUs on your version before relying on them.
4. Assemble `engine_cache_key`.

### Output
`engine_cache_key`.

### Quality Gate
- The load procedure has an explicit branch for a null engine.
- Changing any one field in a copy of `key.json` changes the key (test one field and record both keys).

---

## Worked Example

Illustrative only.

```
key.json: {"compute_capability":"8.7","dla_core":"none","l4t_release":"R36.4.0","module_model":"NVIDIA Jetson AGX Orin Developer Kit","onnx_sha256":"9c1e...","precision":"fp16","profile":{"images":{"max":[8,3,640,640],"min":[1,3,640,640],"opt":[4,3,640,640]}},"tensorrt_version":"10.3.0","trtexec_flags":["--fp16","--memPoolSize=workspace:2048"]}
key: 3f7a09c2d1b84e65
/opt/edge-models/engines/3f7a09c2d1b84e65/model.engine: OK
```
Changing `precision` to `int8` gave key `a40c...`, confirming field sensitivity.

---

## Exit Criteria

DONE when the engine is stored under a reproducible key built from every portability-relevant field and the runtime load procedure rebuilds on mismatch.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A field is unknown | **Stop**: an incomplete key lets a wrong engine load; collect the field first. |
| Phase 2 | Key directory exists with a different sha256 | **Stop**: report a non-deterministic build or a corrupt file; do not overwrite. |
| Phase 3 | App retries a failed deserialize | **Adjust**: add the null-engine branch that triggers rebuild. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
