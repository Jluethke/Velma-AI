# Pqc Integration Testing

Integrate PQC hardware into a complete system, test interoperability with hybrid classical/PQC protocols, validate performance at system level, and prepare for compliance.

## Inputs

- `hardware-implementation`: PQC hardware accelerator RTL and performance metrics
- `side-channel-assessment`: Side-channel evaluation results

## Outputs

- `system-integration-results`: PQC accelerator integrated into TLS/IPsec stack, end-to-end test results, interoperability with reference implementations
- `compliance-readiness`: Mapping to CNSA 2.0, FIPS 203/204/205, NIST SP 800-227 requirements with evidence of compliance

## Process

1. Integration: connect the PQC hardware accelerator to the host processor via a standard bus (AXI for FPGA, PCIe for server card). Implement a driver that exposes ML-KEM (keygen, encaps, decaps) and ML-DSA (keygen, sign, verify) as API calls. Integrate with an existing TLS library (OpenSSL, mbedTLS) by registering the hardware-accelerated PQC algorithms as providers/engines.
2. Interoperability testing: establish TLS 1.3 connections with the reference implementation (liboqs, PQClean) using hybrid key exchange (X25519 + ML-KEM-768). Verify that the handshake completes successfully, that the negotiated cipher suite is correct, and that application data is transferred correctly. Test with both sides using hardware acceleration and with one side using software-only.
3. Performance validation: measure end-to-end TLS handshake time (time from ClientHello to application data) and compare hardware-accelerated vs software-only. Measure steady-state throughput (AES-GCM data transfer after handshake). Verify that PQC handshake latency meets application requirements (e.g., < 50 ms for web, < 10 ms for API).
4. Certificate chain testing: generate a test CA with ML-DSA certificates. Issue leaf certificates. Verify that certificate chain validation works with ML-DSA signatures. Test certificate chain size impact on handshake (each ML-DSA-65 signature adds ~3.3 KB to the chain vs ~72 bytes for ECDSA). For bandwidth-constrained links: evaluate certificate compression (RFC 8879).
5. Compliance mapping: FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA). NIST SP 800-227 (PQC migration guidelines). CNSA 2.0 timeline: software and firmware signing with PQC by 2025, web/cloud services by 2030, traditional networking by 2030, legacy systems by 2033. Document which requirements are met and which need roadmap items.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
