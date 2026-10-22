# Pqc Algorithm Selection

Select post-quantum algorithms based on application requirements: compare NIST-standardized algorithms by security level, key and signature sizes, performance on target platform, and migration impact.

## Inputs

- `application-requirements`: Use case: key exchange, digital signature, key encapsulation. Performance constraints, bandwidth constraints, storage constraints.
- `target-platform`: Hardware platform: FPGA, ASIC, microcontroller, server CPU. Clock frequency, memory, power budget.

## Outputs

- `algorithm-selection`: Selected PQC algorithms with security level, parameter set, and rationale
- `migration-impact-analysis`: Protocol changes required, bandwidth impact, storage impact, latency impact compared to classical algorithms

## Process

1. Key encapsulation (replacing ECDH/RSA key exchange): ML-KEM (Kyber) is the NIST standard. Parameter sets: ML-KEM-512 (NIST Level 1, ~128-bit security), ML-KEM-768 (Level 3, ~192-bit), ML-KEM-1024 (Level 5, ~256-bit). Key sizes: public key 800-1568 bytes, ciphertext 768-1568 bytes. Performance: 10-100x faster than RSA key exchange, comparable to ECDH on modern CPUs.
2. Digital signatures (replacing ECDSA/RSA signatures): ML-DSA (Dilithium) for general use. Parameter sets: ML-DSA-44 (Level 2), ML-DSA-65 (Level 3), ML-DSA-87 (Level 5). Signature size: 2420-4627 bytes (much larger than ECDSA's 64 bytes). Public key: 1312-2592 bytes. For stateless hash-based signatures: SLH-DSA (SPHINCS+) offers conservative security assumptions but larger signatures (7-50 KB). For stateful: XMSS/LMS (smaller signatures but state management is critical: signing key must be updated after each use, reuse breaks security).
3. Hybrid approach: combine classical + PQC in a hybrid scheme. For TLS key exchange: concatenate ECDH shared secret and ML-KEM shared secret, derive session key from both. This ensures security even if one algorithm is broken. For signatures: include both ECDSA and ML-DSA signatures in certificates. RFC 9180 (HPKE) and draft-ietf-tls-hybrid-design define the protocol framework.
4. Migration impact: evaluate bandwidth increase (ML-KEM adds ~2 KB to TLS handshake, ML-DSA adds ~5 KB per signature in certificate chain). For constrained devices (IoT, embedded): bandwidth and memory may be the binding constraint. For high-throughput servers: computation time is minimal but certificate chain size affects TLS handshake latency.
5. Timeline: NIST standards finalized in 2024. Regulatory mandates (CNSA 2.0) require PQC for national security systems by 2030-2033. Start with hybrid to maintain interoperability with classical-only peers. Plan for algorithm agility: design the system so that PQC algorithm and parameter set can be changed without hardware redesign.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
