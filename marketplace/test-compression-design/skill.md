# Test Compression Design

Implement test compression (LBIST or codec-based) to reduce scan test data volume and test time while maintaining fault coverage.

## Inputs

- `scan-inserted-netlist`: Design with internal scan chains
- `test-patterns`: Uncompressed ATPG patterns with pattern count and data volume

## Outputs

- `compressed-test-architecture`: Decompressor and compactor design with compression ratio
- `compressed-patterns`: Compressed test patterns with updated fault coverage

## Process

1. Without compression: for 1000 internal scan chains of 500 flip-flops each, test data volume = 1000 * 500 * N_patterns bits. At 500 MHz ATE speed with 32 physical channels, test time = data_volume / (32 * 500M). For 5000 patterns, this is approximately 80 seconds per die, costing approximately $0.10/die on modern ATE.
2. Codec-based compression (e.g., Synopsys DFTMAX, Cadence Modus): a decompressor expands a small number of physical scan-in channels to many internal chains. The decompressor uses a linear-feedback shift register (LFSR) seeded by the ATE data to generate the internal chain inputs. Only the specified (care) bits need to match; do not care bits are filled by the LFSR.
3. Compression ratio: typical ATPG patterns have 1-5% specified (care) bits. A 100:1 compression ratio is achievable, mapping 32 physical channels to 3200 internal chains. This reduces test time by 100x. The compactor on the output side XOR-combines multiple chain outputs into fewer physical scan-out channels.
4. Compression vs coverage trade-off: higher compression may reduce fault coverage because the decompressor cannot set all arbitrary care-bit combinations (aliasing). Typically, coverage drop is < 0.5% for 100:1 compression. If coverage drops below target, reduce the compression ratio or add dedicated test points.
5. LBIST (Logic BIST): the LFSR generates pseudo-random patterns applied to the scan chains. No external ATE data needed during test. Coverage is limited by random-pattern-resistant faults (faults requiring specific input combinations that pseudo-random patterns rarely generate). Typical stuck-at coverage from LBIST: 85-95%. Supplement with stored test points or weighted random patterns to improve.
6. Hybrid approach: use LBIST for initial high-coverage testing (fast, low cost), then apply a small set of compressed deterministic patterns for the remaining hard-to-detect faults. This minimizes total test cost while achieving >99% fault coverage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
