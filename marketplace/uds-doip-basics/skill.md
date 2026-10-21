# DoIP Diagnostics over Ethernet (ISO 13400)

**One-line description:** Discovers a DoIP entity over UDP port 13400, performs TCP routing activation, and sends read-only UDS requests in DoIP diagnostic messages using the ISO 13400-2 generic header, with the Python `doipclient` package and a Wireshark capture to read every payload type.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `diag_scope` (object, required): From `uds-diag-scope-readonly` with `interface` "doip".
- `doip_ecu_ip` (string, required): IP address of the DoIP edge node or gateway, or "discover" to find it by broadcast.
- `tester_logical_address` (string, optional): Tester source address. ISO 13400-2 reserves 0x0E00 to 0x0FFF for external test equipment; `doipclient` defaults to 0x0E00.

---

## Outputs

- `doip_session` (object): Entity logical address, VIN and EID from the announcement, routing activation response code, the UDS reads done, and the pcap path.

---

## Phase 1: Physical Link and Discovery

### Entry Criteria
- `diag_scope.read_only` true. The vehicle supports DoIP (the OEM documents it).
- An Ethernet adapter for the OBD connector per ISO 13400-3 (Ethernet pairs on pins 3/11 and 12/13, activation line pin 8; confirm with the adapter's documentation).

### Actions
1. Start a capture: `sudo tcpdump -i <eth> -w doip.pcap port 13400`.
2. Set the host address: many vehicles assign by DHCP; otherwise use auto-IP (169.254.x.x). Check with `ip addr`.
3. `pip install doipclient` and record the version.
4. Discovery: `from doipclient import DoIPClient; address, announcement = DoIPClient.await_vehicle_announcement()` waits for the vehicle announcement (payload type 0x0004) sent after the activation line is set. Or send a vehicle identification request (0x0001) with `DoIPClient.get_entity()`; check the method names in the installed docs.
5. Record `announcement.logical_address`, VIN and EID.

### Output
Entity address and logical address.

### Quality Gate
- `doip.pcap` contains a packet with payload type 0x0004 (Wireshark filter `doip.type == 0x0004`).

---

## Phase 2: Routing Activation

### Entry Criteria
- Entity found.

### Actions
1. The generic header is 8 bytes: protocol version (0x02 for ISO 13400-2:2012, 0x03 for 2019), inverse version (version XOR 0xFF), payload type (2 bytes), payload length (4 bytes).
2. `client = DoIPClient(ip, logical_address, client_logical_address=0x0E00)` opens TCP 13400 and sends routing activation request (0x0005): source address, activation type 0x00 (default), 4 reserved bytes.
3. Read the response (0x0006). Response code 0x10 means routing successfully activated. Any other code: record it and stop.
4. Do not use activation types other than 0x00 default; 0x01 is WWH-OBD and 0xE0 is central security, which is out of scope.

### Output
Active TCP connection.

### Quality Gate
- Wireshark shows payload type 0x0006 with response code 0x10.

---

## Phase 3: Read-Only UDS over DoIP

### Entry Criteria
- Routing active.

### Actions
1. Diagnostic message payload type 0x8001: source address (2), target address (2), UDS bytes. The entity replies 0x8002 (positive ACK) then a 0x8001 with the UDS response; a 0x8003 is a negative ACK (for example unknown target address).
2. With udsoncan: `from doipclient.connectors import DoIPClientUDSConnector; conn = DoIPClientUDSConnector(client)`, then `with Client(conn) as uds:` and use only the calls allowed in `uds-py-udsoncan-client`, behind the same guard.
3. Read `22 F1 90` and compare with the VIN from the announcement.
4. The entity may send alive check requests (0x0007); `doipclient` answers them. If you write your own client, answer with 0x0008.
5. Close the client with `client.close()`.

### Output
`doip_session`.

### Quality Gate
- The VIN from `22 F1 90` equals the announcement VIN.
- No 0x8001 frame in `doip.pcap` carries a SID outside `allowed_services` (check with Wireshark filter `uds` and the service column).

---

## Worked Example

Illustrative only.

```
announcement: logical_address=0x1001 vin=WDD1234567A123456 eid=00:1A:37:xx:xx:xx
routing activation response code 0x10
uds 22 F1 90 -> 62 F1 90 57 44 44 ...
```

---

## Exit Criteria

DONE when routing activation succeeds and read-only UDS requests complete over DoIP with the exchange captured in a pcap.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No announcement | **Retry**: check the activation line and link LEDs; then send identification request 0x0001 to broadcast. |
| Phase 2 | Response code other than 0x10 | **Stop**: record it; codes requiring authentication are out of scope. |
| Phase 3 | 0x8003 negative ACK | **Adjust**: target address unknown; use the logical address from the announcement. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
