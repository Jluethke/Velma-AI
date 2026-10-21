# Payment Terminal Protocol Analysis

Analyze communication protocols between the terminal and payment processor including transaction flows.

## Inputs

- `terminal-specifications`: Terminal model, firmware version, and network config
- `authorization-scope`: Written scope of the authorized test
- `test-cards`: Authorized test payment cards and accounts

## Outputs

- `protocol-map`: Map of communication protocols and endpoints
- `transaction-flow-analysis`: Analyzed transaction message flows

## Process

1. Capture network traffic during test transactions
2. Identify all communication protocols (ISO 8583, TLS, proprietary)
3. Map the full transaction flow from card read to authorization response
4. Check for plaintext transmission of any transaction data

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
