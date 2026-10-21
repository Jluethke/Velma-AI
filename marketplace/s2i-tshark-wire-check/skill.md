# Wire Format Check with tshark

**One-line description:** Uses Wireshark's protocol dissectors through `tshark` as an independent oracle on interop captures: decrypts TLS with the key log, lists every malformed packet and expert-info warning, and extracts specific header fields to check byte-level requirements (flags, lengths, masks, codes) that application logs cannot show.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `capture_files` (string[], required): From `s2i-interop-reference-impl`.
- `spec_bundle` (object, required): From `s2i-spec-acquire-pin`; to cite sections for findings.
- `tls_keylog_file` (string, optional): Path to an NSS key log file when captures are TLS-encrypted and the key logs are not next to the captures.

---

## Outputs

- `wire_findings` (object[]): Rows `{ "capture", "frame_no", "severity", "protocol", "message", "field", "value", "req_ids", "spec_section" }`.

---

## Phase 1: Decode the Captures

### Entry Criteria
- At least one capture file with non-zero size.
- `tshark --version` prints a version.

### Actions
1. Check the protocol is dissected: `tshark -r <cap> -q -z io,phs` prints the protocol hierarchy. If your protocol is missing and you see only `tcp` with `data`, tshark did not recognize the port.
2. Force a dissector on a non-standard port with decode-as: `tshark -r <cap> -d tcp.port==8080,http2 ...`. List valid names with `tshark -d .` (prints the decode-as help) or `tshark -G protocols | grep -i <name>`.
3. For TLS: `tshark -r <cap> -o tls.keylog_file:<keylog> -q -z io,phs`. Use `tls_keylog_file` if given, else the `keys-<scenario>.log` saved by the interop flow. After decryption the hierarchy must show the application protocol under `tls`.
4. For QUIC the same `tls.keylog_file` preference decrypts QUIC payloads.

### Output
Working decode command per capture.

### Quality Gate
- `io,phs` output for each capture includes the spec's protocol name (for example `http2`, `websocket`, `quic`).
- The exact tshark command per capture is saved in `reports/interop/wire_commands.txt`.

---

## Phase 2: Malformed Packets and Expert Info

### Entry Criteria
- Decoding works.

### Actions
1. Malformed frames: `tshark -r <cap> <decode opts> -Y '_ws.malformed'`. Any output line is a frame the dissector could not parse according to the protocol.
2. Expert info summary: `tshark -r <cap> <decode opts> -q -z expert`. Read the sections by severity: Errors, Warnings, Notes, Chats. Errors and Warnings are findings to explain; Chats are routine.
3. For each Error or Warning, get the frame details: `tshark -r <cap> <decode opts> -Y 'frame.number == <n>' -V`.
4. Remember the dissector is an oracle, not the spec. A dissector warning must be confirmed against the spec text before it becomes a finding; dissectors also have bugs and may lag newer RFCs.

### Output
Candidate findings.

### Quality Gate
- `-Y '_ws.malformed'` and `-z expert` outputs are saved per capture.
- Every Error and Warning is either a finding with a spec section or dismissed with a written reason.

---

## Phase 3: Field-Level Requirement Checks

### Entry Criteria
- Candidate findings.

### Actions
1. For requirements about specific bits or fields, extract the field for all frames and check it. Find field names with `tshark -G fields | grep -i '^F.*websocket'` (columns: type, description, field name).
2. Examples:
   - WebSocket masking (RFC 6455 Section 5.1): `tshark -r <cap> -d tcp.port==9000,websocket -Y websocket -T fields -e frame.number -e tcp.srcport -e websocket.mask` and check the value per direction.
   - HTTP/2 frame types and flags: `tshark -r <cap> -d tcp.port==8080,http2 -Y http2 -T fields -e frame.number -e http2.type -e http2.flags -e http2.streamid`.
   - TLS versions negotiated: `-Y 'tls.handshake.type == 2' -T fields -e tls.handshake.extensions.supported_version`.
   Confirm each field name in `tshark -G fields` before using it.
3. Compare each value with the requirement; every mismatch becomes a finding with `req_ids`.
4. Write `wire_findings` to `reports/interop/wire_findings.json`.

### Output
`wire_findings`.

### Quality Gate
- Every field used appears in `tshark -G fields` output.
- Every finding has `capture`, `frame_no`, and a spec section.

---

## Worked Example

Illustrative. WebSocket server on port 9000; capture `S4.pcapng` from websocat client.

Phase 1:
```
$ tshark -r S4.pcapng -d tcp.port==9000,http -q -z io,phs
... tcp  ... http ... websocket ...
```
(The WebSocket dissector takes over after the HTTP Upgrade.)

Phase 2:
```
$ tshark -r S4.pcapng -d tcp.port==9000,http -q -z expert
Errors (0)
Warnings (1)
  Frequency   Group   Protocol   Summary
          1   Protocol  WebSocket  ...
```
Frame details show a Close frame with a reserved close code; RFC 6455 Section 7.4 confirms it is not allowed on the wire. Finding recorded.

Phase 3:
```
$ tshark -r S4.pcapng -d tcp.port==9000,http -Y websocket -T fields -e frame.number -e tcp.srcport -e websocket.mask
12  54012  1
14  9000   0
```
Source port 9000 shows frame 14 is server-to-client with mask 0, as REQ-5.1-03 requires.

---

## Exit Criteria

DONE when every capture is decoded (decrypted where needed), malformed packets and expert Errors/Warnings are explained or recorded as findings, and every bit-level requirement in scope has been checked by field extraction.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | TLS not decrypted | **Adjust**: the key log is missing or from a different run; rerun the scenario with `SSLKEYLOGFILE` set. |
| Phase 1 | Protocol has no dissector | **Return** empty findings for field checks and note it; malformed checks still apply to lower layers. |
| Phase 2 | Dissector warning contradicts the spec | **Adjust**: dismiss with the spec quote; optionally report it to the Wireshark issue tracker. |
| Phase 3 | Field name not found | **Adjust**: search `tshark -G fields` for the protocol prefix; never guess a field name. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
