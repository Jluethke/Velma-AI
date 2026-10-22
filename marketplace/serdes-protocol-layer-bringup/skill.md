# Serdes Protocol Layer Bringup

Bring up the protocol layer above the SERDES physical layer: link training, flow control, error detection, and end-to-end data integrity verification.

## Inputs

- `encoding-layer-rtl`: Working encoding, alignment, and channel bonding logic
- `alignment-verification-results`: Verified alignment and deskew performance

## Outputs

- `protocol-layer-implementation`: Complete protocol stack from SERDES to user data interface, including link training, flow control, and error handling
- `link-bringup-results`: Verification of end-to-end data transfer at target throughput with measured BER, error recovery behavior, and latency

## Process

1. Implement link training (for protocols that require it, such as PCIe or Ethernet auto-negotiation). Link training negotiates the data rate, lane count, and equalization settings with the link partner. The FPGA's SERDES primitive often includes a link training state machine; configure it with the channel's optimal equalization coefficients as training hints.
2. Implement flow control. Credit-based flow control (PCIe, FC): the receiver advertises buffer credits; the transmitter sends data only when credits are available. Pause-based flow control (Ethernet): the receiver sends pause frames when its buffer fills. Implement the credit counter or pause state machine with correct decrement/increment logic.
3. Implement error detection and reporting. For 8b10b: detect disparity errors and invalid characters. For 64b66b: detect invalid sync headers and scrambler desynchronization. For protocol-level integrity: implement CRC checking on received packets (CRC-32 for most protocols). Count error types in hardware registers accessible via a management interface.
4. Implement error recovery. When the link detects persistent errors (BER exceeds threshold), initiate a link re-training or reset sequence. Implement an error rate monitor that counts errors over a sliding window and triggers re-training when the error rate exceeds a configured threshold.
5. End-to-end verification: transmit known data patterns through the entire protocol stack and verify data integrity at the receiver. Measure throughput: actual data rate considering encoding overhead, flow control pauses, and protocol headers. Measure latency: time from data presented at the transmit interface to data available at the receive interface.
6. Stress testing: run the link for extended periods (hours to days) under thermal stress (operate the FPGA at the maximum temperature rating) to catch marginal timing or equalization issues that only appear under stress.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
