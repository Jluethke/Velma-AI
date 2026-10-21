# Sip Endpoint Enumeration

Enumerate SIP endpoints, extensions, and VoIP infrastructure components.

## Inputs

- `voip-scope`: Authorized VoIP infrastructure, IP ranges, and PBX systems
- `authorization-record`: Written authorization for VoIP testing

## Outputs

- `sip-endpoint-inventory`: Discovered SIP endpoints with registration status and capabilities
- `extension-list`: Valid extensions discovered through enumeration
- `voip-topology`: PBX, proxy, and gateway architecture map

## Process

1. Scan for SIP services on standard and non-standard ports
2. Enumerate valid extensions using OPTIONS, REGISTER, and INVITE methods
3. Map the VoIP topology including PBX, SIP proxies, and media gateways
4. Identify VoIP device types and firmware versions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
