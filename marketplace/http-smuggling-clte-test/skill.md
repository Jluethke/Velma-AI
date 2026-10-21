# Http Smuggling Clte Test

Test for CL.TE and TE.CL request smuggling discrepancies between front-end and back-end servers.

## Inputs

- `server-chain-map`: Map of servers in the processing chain
- `header-parsing-differences`: Observed header parsing differences

## Outputs

- `smuggling-vectors`: Confirmed CL.TE or TE.CL smuggling vectors
- `timing-evidence`: Timing evidence confirming desynchronization

## Process

1. Send CL.TE test payloads and observe response timing
2. Send TE.CL test payloads and observe response timing
3. Confirm desynchronization with differential response analysis

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
