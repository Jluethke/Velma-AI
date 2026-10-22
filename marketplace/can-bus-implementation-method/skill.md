# Can Bus Implementation Method

Implement CAN bus communication with proper bit timing calculation from oscillator tolerance and bus length, message filtering, and bus-off recovery.

## Inputs

- `can-network-spec`: Bus speed (125k/250k/500k/1M), bus length, number of nodes, transceiver type, and termination
- `message-definitions`: CAN message IDs, DLCs, signal definitions, and cycle times for each message

## Outputs

- `can-bit-timing`: Bit timing parameters: prescaler, time segment 1, time segment 2, SJW, sample point percentage, and oscillator tolerance analysis
- `can-driver-api`: Driver interface: init, send-message, receive-callback, filter-config, bus-status, error-counters, and bus-off recovery

## Process

1. Calculate bit timing parameters. The CAN bit is divided into: sync segment (1 TQ), propagation segment, phase segment 1, and phase segment 2. Total TQ per bit = prescaler * peripheral_clock / bitrate. The sample point (typically 75% to 87.5% of the bit time) is set by the ratio of (sync + prop + phase1) to total TQ.
2. Account for oscillator tolerance. CAN requires all nodes to sample within the correct bit. The maximum oscillator frequency deviation depends on the SJW (synchronization jump width) setting: df_max = min(SJW / (2 * 10 * bit_time_in_TQ), SJW / (20 * bit_time_in_TQ)). For 500 kbps with 16 TQ/bit and SJW=1, this allows 0.3% tolerance. A 20 ppm crystal easily meets this; a ceramic resonator at 0.5% does not.
3. Account for propagation delay from bus length: propagation_delay = 2 * (bus_length_m * 5 ns/m + transceiver_delay). The propagation segment must be at least this value in TQ. For a 40-meter bus with 150 ns transceiver delay: (2 * (40*5 + 150)) = 700 ns.
4. Configure hardware message filters. Most CAN controllers support ID masking (accept messages where ID AND mask equals filter AND mask) and ID list mode (accept only specific IDs). Use masks for ranges (e.g., accept all messages from a node) and lists for individual high-priority messages. Unfiltered messages waste CPU time in the receive interrupt.
5. Implement bus-off recovery. CAN controllers enter bus-off state after 256 error events (transmit error counter reaches 256). Recovery options: automatic recovery after 128 sequences of 11 recessive bits (ISO 11898 specified), or manual recovery triggered by the application after a delay. Always log bus-off events for diagnostics.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
