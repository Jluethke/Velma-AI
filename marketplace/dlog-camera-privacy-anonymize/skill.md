# Camera Data Privacy Anonymization

**One-line description:** Detects faces and license plates in logged camera frames with a named detector (for example Meta's open-source EgoBlur models), masks them irreversibly with solid fill, writes an anonymized MCAP copy, and measures detector recall on a hand-labeled sample against the user's privacy policy.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `archive_path` (string, required): Archive root with the original drives.
- `privacy_policy` (object, required): The user's rules: who may access raw camera data, retention of raw data, the required recall on the labeled sample, whether GNSS position must be coarsened, and the legal basis the user's counsel identified (for example GDPR, Regulation (EU) 2016/679, Articles 5(1)(c) data minimization and 25 data protection by design).
- `drive_index` (object, required): From `dlog-drive-index-sqlite`; selects camera topics and files.

---

## Outputs

- `anonymized_log` (object): Paths of anonymized MCAP files, the detector name and version, mask method, and per-file frame counts in and out.
- `privacy_audit` (object): Labeled sample size, true positives, false negatives, measured recall per class, pass or fail against `privacy_policy`, and the access controls applied to raw data.

---

## Phase 1: Restrict Raw Data

### Entry Criteria
- `privacy_policy` names who may access raw camera data.

### Actions
1. Confirm raw camera files sit in a location with access limited to the named group (`ls -l`, `getfacl`, or the storage provider's access policy). Record the evidence.
2. Record the raw data retention period from `privacy_policy`; this flow does not choose one.
3. Raw camera data never goes into test suites, tickets or shared datasets. Only the anonymized copy does.

### Output
Access evidence.

### Quality Gate
- The evidence shows access limited to the group named in `privacy_policy`.

---

## Phase 2: Detect and Mask

### Entry Criteria
- Detector chosen and installed; version recorded. Do not substitute a generic object detector without measuring it in Phase 3.

### Actions
1. Select camera topics via `drive_index` (`SELECT path FROM topics WHERE schema_name LIKE '%Image%'`).
2. Read frames in log-time order (`iter_decoded_messages`). Decode CompressedImage with `cv2.imdecode`; raw Image by reshaping `data` with `height`, `width` and `encoding`. For H.264 CompressedVideo, decode the stream with PyAV or FFmpeg first.
3. Run the detector per frame. Use the detector's documented default score threshold unless `privacy_policy` sets another; record which.
4. Mask each box with a solid fill (`cv2.rectangle(img, p1, p2, (0,0,0), thickness=-1)`), expanded by a margin the user sets. Solid fill is irreversible; light Gaussian blur on small regions can sometimes be partly reversed, so use blur only if the policy accepts it.
5. Re-encode and write to a NEW MCAP file in a separate `anonymized/` root with the same `log_time`, `publish_time`, topic, schema and channel metadata. Copy all non-camera channels unchanged.
6. If `privacy_policy` requires coarsening position, round or drop GNSS fields in the copy and record how.

### Output
Anonymized MCAP files.

### Quality Gate
- For each file, frames out equals frames in per camera topic (`mcap info` channel counts).
- The original files' `sha256sum -c SHA256SUMS` still passes (originals untouched).

---

## Phase 3: Measure Recall

### Entry Criteria
- Anonymized copy written.

### Actions
1. Draw a random sample of frames across drives, conditions (day, night, rain) and cameras. Sample size is a user input.
2. A person labels every face and plate in the sample from the RAW frames (within the access group).
3. A label counts as covered when the mask covers it fully. Recall = covered / labeled, per class.
4. Compare recall to `privacy_policy`. Report false negatives with frame references for retraining or threshold review.
5. Do NOT report a recall computed on fewer labeled objects than the user's minimum sample; report it as insufficient instead.

### Output
`privacy_audit`.

### Quality Gate
- `privacy_audit` lists labeled count, covered count and recall per class, computed from the label file.
- Pass or fail is stated against the policy value, not a value chosen by this flow.

---

## Worked Example

Illustrative.
```
detector: EgoBlur face and plate models, version recorded from the release tag
$ python tools/anonymize.py --index drive_index.sqlite --topics /cam_front/image_raw/compressed --out /archive_anon
d2026_10_21_a/part_0001.mcap  frames in 1800 out 1800  boxes 412
sample: 600 frames, labeled faces 214, covered 211 -> recall 0.986
labeled plates 389, covered 386 -> recall 0.992
policy requires 0.99 per class -> faces FAIL, plates PASS
```

---

## Exit Criteria

DONE when anonymized copies exist for every camera file, raw access is restricted, and recall per class is measured against the policy.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Raw data readable by people outside the group | **Stop**: fix access before any processing. |
| Phase 2 | Frame count differs | **Stop**: find the decode failure; never ship a copy with silently missing frames. |
| Phase 3 | Recall below policy | **Return**: report misses; adjust detector or threshold, rerun Phases 2 and 3. |
| Phase 3 | `privacy_policy` has no recall requirement | **Return**: report measured recall and ask for the requirement. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
