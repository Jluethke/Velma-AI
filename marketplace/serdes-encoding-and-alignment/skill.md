# Serdes Encoding And Alignment

Implement the line encoding (8b10b, 64b66b, or other), comma detection for word alignment, and channel bonding for multi-lane interfaces.

## Inputs

- `equalization-settings`: Tuned TX and RX equalization parameters
- `eye-diagram-results`: Verified eye opening and BER performance

## Outputs

- `encoding-layer-rtl`: RTL for encoding, comma detection, word alignment, and channel bonding, configured for the target protocol
- `alignment-verification-results`: Verification that comma detection achieves alignment within the specified number of characters, and multi-lane skew is within budget

## Process

1. Implement line encoding. 8b10b maps 8-bit data to 10-bit symbols, providing DC balance and guaranteed transition density for clock recovery. It uses K-characters (commas) for alignment. Overhead is 25%. 64b66b maps 64 data bits to a 66-bit block with a 2-bit sync header. Overhead is 3.125%. Select based on the protocol standard.
2. For 8b10b: implement the encoder using lookup tables. Track running disparity (RD+ and RD-) to maintain DC balance. Implement comma detection: K28.5 (0xBC) produces bit patterns 0011111010 or 1100000101 that are unique and cannot appear in any valid data stream. The receiver searches for this pattern to establish word alignment.
3. For 64b66b: implement the scrambler (x^58 + x^39 + 1 polynomial) and sync header insertion. The 2-bit sync header (01 for data blocks, 10 for control blocks) provides alignment. The receiver uses the sync header pattern to lock: it tries every bit position and checks if the sync header pattern appears at the expected 66-bit interval. Lock is declared after N consecutive valid headers.
4. Word alignment: the receiver deserializer produces a raw bit stream. The aligner shifts the bit stream until the comma or sync header is detected at the word boundary. Once aligned, the aligner locks and only re-aligns if alignment is lost (indicated by disparity errors for 8b10b or invalid sync headers for 64b66b).
5. For multi-lane interfaces: implement channel bonding to compensate for inter-lane skew. Each lane achieves word alignment independently. The receiver then adjusts per-lane FIFO delays so that a bonding character (a specific K-character sent simultaneously on all lanes) is received at the same time on all lanes. Maximum deskew is the bonding FIFO depth times the parallel clock period.
6. Verify alignment: inject bit errors into the comma pattern and verify the aligner does not mis-align. Inject lane-to-lane skew up to the maximum deskew range and verify channel bonding compensates. Measure alignment lock time from initial bit stream to valid data output.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
