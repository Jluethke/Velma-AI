# Pcap Processor

Process PCAP files for forensic analysis including validation and indexing.

## Inputs

- `capture-files`: PCAP or PCAPNG files to analyze
- `analysis-scope`: Time range, IPs, and protocols of interest

## Outputs

- `indexed-capture`: Indexed and validated capture data
- `capture-statistics`: Statistics on packet counts, protocols, and time range

## Process

1. Validate capture file integrity and check for truncation
2. Index packets by timestamp, source, destination, and protocol
3. Compute overall statistics (packet count, unique IPs, protocol distribution)
4. Identify the capture duration and any time gaps

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
