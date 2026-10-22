# Trng Key Storage Design

Design and qualify a true random number generator for cryptographic key generation, and design the secure key storage with anti-tamper zeroization.

## Inputs

- `puf-design`: PUF implementation and enrollment procedure
- `puf-reliability-data`: PUF characterization results

## Outputs

- `trng-design`: TRNG architecture: entropy source, conditioning, health tests, output rate, certification compliance
- `key-storage-design`: Key storage mechanism: volatile vs non-volatile, encryption-at-rest, anti-tamper zeroization trigger, access control

## Process

1. TRNG entropy source: ring oscillator jitter (sample a free-running oscillator with a lower-frequency clock; the jitter provides entropy), metastable latch (bias a latch near the metastable point), thermal noise amplification. Ring oscillator jitter is the most common in digital ASIC/FPGA. Estimate the min-entropy per sample from the jitter magnitude and sampling rate.
2. Conditioning: raw entropy source output is biased. Apply a cryptographic conditioning function: hash-based (SHA-256 over a block of raw bits produces 256 bits at full entropy if input entropy exceeds 256 bits) or AES-CBC-MAC. The conditioning ratio = raw bits consumed / conditioned bits output. NIST SP 800-90B specifies the testing methodology for entropy source characterization.
3. Health tests (NIST SP 800-90B): repetition count test (detects stuck output), adaptive proportion test (detects bias drift), startup test (verify entropy source before first use after power-on). These run continuously during operation. On health test failure: raise alarm, stop outputting random numbers, attempt recovery, report to security monitor.
4. Key storage: store keys encrypted under the PUF-derived key (keys at rest are never in plaintext in non-volatile memory). Volatile key cache in SRAM for active keys. Anti-tamper zeroization: on tamper detection (mesh break, voltage/temperature out of range, decapsulation light sensor), immediately overwrite key storage SRAM with zeros or random data. Zeroization must complete faster than an attacker can read out the SRAM contents (target: < 1 ms).
5. Qualify the TRNG: run the NIST SP 800-22 statistical test suite on a large output sample (minimum 1 Gbit). Run the SP 800-90B entropy estimation tests. For FIPS 140-3 compliance: TRNG must pass continuous health tests and the entropy source must be characterized per 90B. Document the entropy rate, output rate, and conditioning ratio.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
