# Spec Acquire and Pin

**One-line description:** Downloads the authoritative text of the specification you must implement (IETF RFC, W3C Recommendation, WHATWG commit snapshot, or a purchased ISO/ECMA edition), pins the exact version with a SHA-256 hash, and records every document that updates, obsoletes, or is normatively referenced by it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `spec_id` (string, required): The spec to implement, written as the publisher names it: "RFC 6455", "RFC 9113", a W3C dated TR URL, a WHATWG standard URL plus commit SHA, or "ISO 8601-1:2019".
- `project_dir` (string, required): Repository root. The spec copy is stored under `project_dir/spec/`.

---

## Outputs

- `spec_bundle` (object): `{ "id", "publisher", "version_pin", "files": [{"path", "sha256", "format"}], "obsoletes": [], "updates": [], "obsoleted_by": [], "updated_by": [], "normative_refs": [], "status" }`. Every later flow reads the spec only from the files listed here.

---

## Phase 1: Identify the Authoritative Source

### Entry Criteria
- `spec_id` is set.

### Actions
1. Classify `spec_id` with this table. Use the first row that matches.

   | `spec_id` looks like | Publisher | Authoritative files |
   |---|---|---|
   | "RFC" followed by a number | IETF / RFC Editor | `https://www.rfc-editor.org/rfc/rfcNNNN.txt`, plus `rfcNNNN.xml` and `rfcNNNN.html` when NNNN is 8650 or higher (RFCXML v3 era) |
   | "draft-..." | IETF Internet-Draft | `https://www.ietf.org/archive/id/draft-NAME-NN.txt` with the revision number NN pinned |
   | `https://www.w3.org/TR/YYYY/...` dated URL | W3C | that dated URL; never the undated "latest" URL |
   | `*.spec.whatwg.org` | WHATWG (living standard) | `https://<std>.spec.whatwg.org/commit-snapshots/<sha>/` |
   | "ISO", "IEC", "ECMA-" | ISO / IEC / Ecma | the purchased PDF or Ecma edition PDF the user supplies; record edition and every amendment or corrigendum |
   | anything else | unknown | **Stop** and ask the user for the publisher and an exact version |

2. For an RFC, open `https://www.rfc-editor.org/info/rfcNNNN` and copy the "Status", "Obsoletes", "Updates", "Obsoleted by", and "Updated by" fields. The RFC text itself shows only "Obsoletes" and "Updates"; the reverse links ("Obsoleted by", "Updated by") exist only on the info page and in `https://www.rfc-editor.org/rfc-index.xml`.
3. If "Obsoleted by" is not empty, **Stop** and report the newer RFC number. Implementing an obsoleted RFC is only correct when the user explicitly names the old version (for example a legacy interop target).
4. For a WHATWG standard, ask for the commit SHA if `spec_id` has none. A living standard without a SHA changes under you.

### Output
Publisher, URLs to fetch, and the update/obsolete relations.

### Quality Gate
- The publisher row from the table is named.
- For an RFC, the five info-page fields are recorded, empty or not.
- No undated W3C URL and no WHATWG URL without a commit SHA is used.

---

## Phase 2: Download and Hash

### Entry Criteria
- URLs from Phase 1.

### Actions
1. Create the folder: `mkdir -p "$PROJECT_DIR/spec"`.
2. Download each file. For RFC 6455: `curl -fsSL -o spec/rfc6455.txt https://www.rfc-editor.org/rfc/rfc6455.txt`. The `-f` flag makes curl exit non-zero on HTTP errors, so a 404 page is never saved as the spec.
3. For RFC 8650 and later also fetch the XML: `curl -fsSL -o spec/rfc9113.xml https://www.rfc-editor.org/rfc/rfc9113.xml`. The v3 XML tags every BCP 14 keyword as `<bcp14>MUST</bcp14>` and every ABNF block as `<sourcecode type="abnf">`, which later flows use for exact extraction.
4. Hash every file: `sha256sum spec/*` (on macOS `shasum -a 256 spec/*`; in PowerShell `Get-FileHash spec\* -Algorithm SHA256`).
5. Download every document in "Updates"/"Updated by" the same way. An RFC that updates yours changes normative text you must follow.
6. Do not edit the downloaded files. Notes go in a separate file.

### Output
Spec files on disk with hashes.

### Quality Gate
- `sha256sum spec/*` lists one line per downloaded file.
- `head -c 200 spec/rfcNNNN.txt` shows RFC header text, not HTML.
- Every RFC in "Updated by" has its own file in `spec/`.

---

## Phase 3: Record Normative References

### Entry Criteria
- Spec files on disk.

### Actions
1. Find the "Normative References" section: `grep -n "Normative References" spec/rfc6455.txt`.
2. List every entry under it until "Informative References". Each normative reference is part of the spec you implement (for example RFC 6455 normatively references RFC 3986 for URIs and RFC 5234 for ABNF).
3. For each normative reference, record its ID and whether it is itself obsoleted (check its info page). An obsoleted normative reference is not an error, but it goes in the ambiguity log later because the replacement may differ.
4. Assemble `spec_bundle` and write it to `spec/spec_bundle.json`.

### Output
`spec_bundle`.

### Quality Gate
- `python -m json.tool spec/spec_bundle.json` exits 0.
- `normative_refs` has one entry per line item under "Normative References".
- Every file in `files` has a 64-hex-character `sha256`.

---

## Worked Example

Illustrative. `spec_id` = "RFC 6455", `project_dir` = `~/src/wsd`.

Phase 1: Row "RFC". Info page shows Status: Proposed Standard; Obsoletes: none; Updates: none; Obsoleted by: none; Updated by: RFC 7936, RFC 8307, RFC 8441. RFC 6455 is below 8650, so only `.txt` and `.html` exist from the RFC Editor.

Phase 2:
```
$ curl -fsSL -o spec/rfc6455.txt https://www.rfc-editor.org/rfc/rfc6455.txt
$ curl -fsSL -o spec/rfc8441.txt https://www.rfc-editor.org/rfc/rfc8441.txt
$ sha256sum spec/*.txt
<64 hex>  spec/rfc6455.txt
<64 hex>  spec/rfc8441.txt
...
```

Phase 3: `normative_refs` includes RFC 2119, RFC 2616 (obsoleted, later replaced by RFC 9110 and RFC 9112), RFC 3629, RFC 3986, RFC 4648, RFC 5234, and others. The RFC 2616 entry is flagged "obsoleted" for the ambiguity log.

---

## Exit Criteria

DONE when every authoritative file for the pinned version and every updating document is on disk under `spec/` with a SHA-256 hash, and `spec_bundle.json` lists the update/obsolete relations and all normative references.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Spec is obsoleted and the user did not ask for the old version | **Stop**: report the replacement RFC and ask which version to implement. |
| Phase 1 | Publisher unknown or no exact version | **Stop**: ask the user for the publisher and version; never guess a version. |
| Phase 2 | curl exits 22 (HTTP error) | **Retry** once; if it fails again, **Return** the URL and status code to the user. |
| Phase 2 | ISO/IEC PDF not supplied (paywalled) | **Stop**: the user must supply the purchased edition; do not use a draft or an unofficial copy as authoritative. |
| Phase 3 | No "Normative References" heading (older or non-IETF spec) | **Adjust**: list references that the text says are required ("as defined in", "MUST conform to") and mark the list as derived. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
