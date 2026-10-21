# IANA Registry Check

**One-line description:** Finds every IANA registry the spec creates or points to (codes, method names, header fields, error codes, media types), downloads the current registry XML, and snapshots the values the implementation must accept, reject, or treat as reserved, because registries change after the RFC is published.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `spec_bundle` (object, required): From `s2i-spec-acquire-pin`.
- `project_dir` (string, required): Repository root; snapshots go to `project_dir/spec/iana/`.

---

## Outputs

- `registry_snapshot` (object[]): One entry per registry: `{ "registry", "url", "retrieved_on", "sha256", "values": [{"value", "name", "status", "reference"}], "ranges": [{"range", "policy"}] }`.

---

## Phase 1: Find Registry References

### Entry Criteria
- `spec_bundle` lists the spec text file.

### Actions
1. Find the IANA section: `grep -n "IANA Considerations" spec/rfcNNNN.txt`.
2. Find every registry mention in the whole text, not only that section: `grep -niE "registry|IANA" spec/rfcNNNN.txt`.
3. For each registry, write down its name exactly as IANA titles it (for RFC 6455: "WebSocket Opcode Registry", "WebSocket Close Code Number Registry", "WebSocket Extension Name Registry", "WebSocket Subprotocol Name Registry").
4. Locate the registry group at `https://www.iana.org/protocols` (search the page for the name). Each group has an XML file at `https://www.iana.org/assignments/<group>/<group>.xml`.
5. If the spec is not an IETF document and names no registry, **Return** an empty `registry_snapshot`.

### Output
List of registry names and group XML URLs.

### Quality Gate
- Every registry named in "IANA Considerations" has a URL.
- Each URL returns HTTP 200: `curl -fsI <url>` exits 0.

---

## Phase 2: Snapshot Values

### Entry Criteria
- Registry URLs.

### Actions
1. Download: `mkdir -p spec/iana && curl -fsSL -o spec/iana/websocket.xml https://www.iana.org/assignments/websocket/websocket.xml`.
2. IANA XML uses a default namespace, so plain XPath like `//record` returns nothing. Use `local-name()`:
   `xmllint --xpath '//*[local-name()="registry"]/@id' spec/iana/websocket.xml`
   then for one registry:
   `xmllint --xpath '//*[local-name()="registry"][@id="close-code-number"]//*[local-name()="record"]' spec/iana/websocket.xml`
   Confirm the registry `id` values from the first command; do not guess them.
3. For each record copy `value`, `name` or `description`, and `xref` (the defining document).
4. Copy the registration policy and any reserved or unassigned ranges (the registry header and records whose description is "Unassigned" or "Reserved").
5. Record `retrieved_on` (today's date) and `sha256sum spec/iana/*.xml`.

### Output
Raw values per registry.

### Quality Gate
- Every registry has at least one value, or its header states it is empty.
- `sha256` recorded for every downloaded XML.

---

## Phase 3: Derive Implementation Rules

### Entry Criteria
- Raw values.

### Actions
1. For each registry, write one rule per range using the spec's own text about unknown values. Look for phrases like "MUST fail the connection", "MUST ignore", "treated as". Example: RFC 6455 Section 5.2 says that if an unknown opcode is received, the receiving endpoint MUST fail the WebSocket connection.
2. Mark values registered after the spec's publication date. These are legal on the wire even though the RFC does not mention them (for example extension names registered by later RFCs such as RFC 7692 "permessage-deflate").
3. Never hard-code only the values printed in the RFC body when a registry exists; use the snapshot.
4. Write `registry_snapshot` to `spec/iana/registry_snapshot.json`.

### Output
`registry_snapshot`.

### Quality Gate
- Every range in every registry maps to an accept, reject, or ignore rule citing a spec section.
- `python -m json.tool spec/iana/registry_snapshot.json` exits 0.

---

## Worked Example

Illustrative. Spec RFC 6455.

Phase 1: IANA Considerations (Section 11) creates the opcode, close code, extension name, and subprotocol registries. All live in the `websocket` group.

Phase 2:
```
$ curl -fsSL -o spec/iana/websocket.xml https://www.iana.org/assignments/websocket/websocket.xml
$ xmllint --xpath '//*[local-name()="registry"]/@id' spec/iana/websocket.xml
 id="..." id="..." id="..."   (one id per registry in the group; copy the exact values printed)
```
Close code records include 1000 Normal Closure, 1001 Going Away, 1002 Protocol error, plus later registrations such as 1012 and 1013, and the 3000-3999 range for registered use and 4000-4999 for private use (RFC 6455 Section 7.4.2).

Phase 3: Rule: a received close code in a reserved, unassigned range below 3000 is invalid; RFC 6455 Section 7.4 states the codes an endpoint MUST NOT send in a Close frame (1005, 1006, 1015).

---

## Exit Criteria

DONE when every registry the spec touches is snapshotted with a date and hash, and every range has an implementation rule tied to spec text.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Registry name not found on iana.org/protocols | **Adjust**: search `https://www.iana.org/assignments/` index; if still missing, add to the ambiguity log. |
| Phase 2 | XPath returns empty | **Adjust**: the namespace is the usual cause; switch to `local-name()` selectors. |
| Phase 2 | `xmllint` not installed | **Adjust**: install libxml2-utils (Debian/Ubuntu) or use `python -c "import xml.etree.ElementTree"` with namespace-aware `findall`. |
| Phase 3 | Spec gives no rule for unknown values | **Return** the registry as a gap for the ambiguity log; do not invent accept or reject behavior. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
