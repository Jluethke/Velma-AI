# File Upload Validation and Safe Storage

**One-line description:** Hardens every upload endpoint with a byte cap enforced while streaming (and at the reverse proxy), a file-type check on the content's magic bytes against an allowlist, server-generated storage names outside the web root, re-encoding of images, archive limits, and download headers that stop browsers from rendering uploads as HTML, with framework-specific settings for Flask, Django, FastAPI, Express/multer and Go.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `sink_map` (object, required): Output of `ival-sink-class-map`; rows with `class` = `upload`.
- `max_upload_bytes` (integer, required): Maximum accepted file size, set by the product owner. This flow does not choose it.
- `allowed_file_types` (string[], required): MIME types the feature accepts, for example `["image/png", "image/jpeg", "application/pdf"]`.

---

## Outputs

- `upload_fixes` (object): `endpoints` (file, line, controls applied), `proxy_limit` (config line), `storage_dir`, `test_file`, `test_run`.

---

## Phase 1: Size Caps That Actually Stop Reading

### Entry Criteria
- `max_upload_bytes` and `allowed_file_types` provided.

### Actions
1. Apply the framework setting. Several settings that look like limits are only memory thresholds:

| Framework | Real cap | Looks like a cap but is not |
|---|---|---|
| Flask | `app.config["MAX_CONTENT_LENGTH"] = max_upload_bytes` (raises 413) | none |
| Django | no single total-size setting for file uploads; `DATA_UPLOAD_MAX_MEMORY_SIZE` caps non-file body data only. Enforce the total at the proxy (step 2) and check `request.META["CONTENT_LENGTH"]` plus a custom upload handler that raises `StopUpload` when bytes exceed the cap | `FILE_UPLOAD_MAX_MEMORY_SIZE` (only decides memory vs temp file) |
| FastAPI / Starlette | stream `await file.read(chunk)` and stop after `max_upload_bytes`; enforce at the proxy too (check your Starlette version's docs for form size options) | `UploadFile.size` (reported after reading) |
| Express + multer | `multer({ limits: { fileSize: max_upload_bytes, files: N, fields: M } })`, where N and M come from the form design; error code `LIMIT_FILE_SIZE` maps to 413 | none |
| Go | `r.Body = http.MaxBytesReader(w, r.Body, max_upload_bytes)` before `ParseMultipartForm`, or stream with `r.MultipartReader()` | `ParseMultipartForm(maxMemory)` (memory threshold; the rest goes to temp files) |

2. Reverse proxy: nginx `client_max_body_size` (default 1m per nginx docs); set it to the same value for the upload location. Other proxies: find the equivalent and record it.

### Output
Caps in place.

### Quality Gate
- `curl -s -o /dev/null -w "%{http_code}" -F "file=@big.bin" <upload_url>` with a file one byte over `max_upload_bytes` prints `413`.
- The proxy config line is recorded in `proxy_limit`.

---

## Phase 2: Content Type, Name and Storage

### Entry Criteria
- Caps in place.

### Actions
1. Detect type from content, never from the client's `Content-Type` header or the extension alone:

| `stack` | Detection |
|---|---|
| python | `python-magic`: `magic.from_buffer(first_bytes, mime=True)` (needs libmagic on the host); or `filetype.guess(first_bytes).mime` (pure Python) |
| node | `file-type` package: `const { fileTypeFromBuffer } = await import("file-type")` (ESM-only in current versions) |
| go | `http.DetectContentType(first512)` (implements the WHATWG MIME sniffing algorithm; reads at most 512 bytes; recognizes fewer types than libmagic) |

   Reject with 415 when the detected type is not in `allowed_file_types`. Also require the extension to match the detected type.
2. Storage name: generate it (`uuid4().hex`, `crypto.randomUUID()`, `uuid.NewString()`) plus the extension for the detected type. Keep the original name only as metadata in the database, length-capped, and never use it in a path (see `ival-path-traversal-fix`).
3. Storage location: outside any directory the web server serves statically, or in object storage with private ACLs. Serve through a handler that sets:
   - `Content-Type` = the detected type
   - `X-Content-Type-Options: nosniff`
   - `Content-Disposition: attachment; filename="<sanitized>"` for anything that is not an image shown inline
   - for images shown inline, a separate cookieless domain is the documented OWASP recommendation; record whether one exists.
4. Content-specific controls:

| Type | Control |
|---|---|
| Raster images | re-encode with Pillow (`Image.open(f); img.verify()`, reopen, `img.save(out, format=...)`), `sharp` or Go `image` decoders, which drops embedded payloads and metadata. Pillow's `Image.MAX_IMAGE_PIXELS` decompression bomb guard is on by default; do not set it to `None`. |
| SVG | treat as active content: reject unless required; if required, sanitize (DOMPurify with SVG profile) and always serve as `attachment` or from a separate domain; also parse it with the hardened parser from `ival-xxe-parser-hardening` |
| PDF, Office | serve as `attachment`; if parsed server-side, apply the XXE flow to Office formats |
| ZIP / archives | cap entry count and total uncompressed size from owner-provided numbers before extracting; check every entry path (zip slip) |

5. Malware scanning: if the product requires it, send the stored file to ClamAV (`clamdscan --fdpass <file>`, exit code 1 means infected) before marking it available. If not required, record that decision.

### Output
Type checks, generated names, safe serving.

### Quality Gate
- Uploading a PNG renamed `x.pdf` returns 415 (curl status printed).
- `curl -sI <download_url>` shows `X-Content-Type-Options: nosniff` and the expected `Content-Disposition`.
- `rg -n "\.filename|originalname|file\.name" <upload handlers>` shows no use inside a path expression.

---

## Phase 3: Upload Abuse Tests

### Entry Criteria
- Controls in place.

### Actions
1. Automated tests with the framework client:

| Case | Expected |
|---|---|
| file of `max_upload_bytes + 1` bytes | 413 |
| HTML file named `x.png` with `Content-Type: image/png` | 415 |
| PNG with a polyglot HTML tail (append `<script>alert(1)</script>` to a valid PNG) | accepted only after re-encode; stored bytes no longer contain `<script` |
| filename `../../app.py` | stored under a generated name; nothing written outside storage dir |
| SVG with `<script>` (if SVG allowed) | sanitized or rejected; download has `attachment` |
| decompression bomb image (large declared dimensions) | rejected (Pillow `DecompressionBombError` or equivalent) |
| zip containing `../evil` | rejected |

2. Run, record summary. Mutation check: disable the type check, rerun, confirm the HTML-as-PNG case fails, revert.

### Output
`upload_fixes`.

### Quality Gate
- Test summary shows 0 failed.
- Mutation run fails; reverted run passes.

---

## Worked Example

Illustrative. Express + multer avatar upload, `max_upload_bytes` = 2097152 (owner's value), `allowed_file_types` = `["image/png", "image/jpeg"]`.

Phase 1: `multer({ storage: multer.memoryStorage(), limits: { fileSize: 2097152, files: 1 } })`; nginx `client_max_body_size 2m;` on `location /avatar`.

Phase 2: `fileTypeFromBuffer(req.file.buffer)` returns `{ mime: "image/png" }`; `sharp(buf).png().toFile(path.join(STORE, randomUUID() + ".png"))`.

Phase 3:
```
$ npx vitest run upload
 ✓ test/upload.test.ts (7)
      Tests  7 passed (7)
```

---

## Exit Criteria

DONE when every upload endpoint stops reading at the owner's byte cap (app and proxy), accepts only allowlisted types detected from content, stores under generated names outside the web root, re-encodes images, limits archives, serves with `nosniff` and correct disposition, and the abuse tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `max_upload_bytes` not provided | **Stop**: ask the owner; do not pick a number. |
| Phase 1 | Uploads go directly to object storage with presigned URLs | **Adjust**: set the size limit in the presigned policy (S3 POST policy `content-length-range`) and run type checks in the post-upload processing step before the file is marked available. |
| Phase 2 | libmagic missing on the host | **Adjust**: use the pure-Python `filetype` package and record the choice. |
| Phase 3 | Re-encoded image fails visual checks (color profile lost) | **Adjust**: preserve the ICC profile explicitly; do not skip re-encoding. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
