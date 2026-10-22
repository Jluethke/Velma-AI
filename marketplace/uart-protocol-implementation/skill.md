# Uart Protocol Implementation

Implement UART communication with proper framing, baud rate configuration, DMA-based reception for continuous data streams, and protocol layer design.

## Inputs

- `uart-requirements`: Baud rate, data bits, parity, stop bits, flow control (hardware RTS/CTS or software XON/XOFF), and the higher-level protocol carried over UART
- `data-patterns`: Expected message sizes, frequency, burst patterns, and required response latency

## Outputs

- `uart-configuration`: UART peripheral settings, baud rate error analysis, DMA configuration for RX/TX, and idle line detection setup
- `framing-protocol`: Message framing design: start delimiter, length field, payload, CRC, and end delimiter with timeout-based frame sync recovery

## Process

1. Calculate baud rate generator settings. The baud rate divisor = peripheral_clock / (oversampling * baud_rate). Common oversampling is 16x (standard) or 8x (for higher baud rates on slower clocks). The actual baud rate will differ from the target by the rounding error in the divisor. Keep this error under 2% for reliable communication; under 1% for long frames.
2. For continuous reception, use DMA in circular mode writing to a ring buffer. Enable idle line detection interrupt: the UART signals when the line is idle for one frame duration after receiving data. This interrupt fires at the end of each packet, telling the application how much data arrived without polling.
3. Alternative for framed protocols: use DMA in normal mode with a timeout. Start DMA for the expected message length. If the full message does not arrive within the timeout, process the partial data and resync. This handles variable-length messages and noise on the line.
4. Design the framing protocol for noisy or multi-message environments. A reliable frame: sync byte(s) (e.g., 0xAA 0x55), length field, sequence number, payload, CRC-16. The sync bytes allow the receiver to find frame boundaries after a line error. The CRC catches corrupted frames. The sequence number detects dropped messages.
5. Implement frame synchronization recovery: if a received frame fails CRC, scan the receive buffer byte-by-byte for the next sync sequence. Discard everything before it and attempt to parse a new frame from the sync. This recovers from any single burst error without resetting the connection.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
