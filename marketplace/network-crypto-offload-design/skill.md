# Network Crypto Offload Design

Design TLS, MACsec, and IPsec offload engines for line-rate encryption, including quantum-safe hybrid key exchange and secure time synchronization.

## Inputs

- `hsm-architecture`: HSM internal architecture and key hierarchy
- `key-ceremony-procedure`: Key generation and management procedures

## Outputs

- `crypto-offload-design`: TLS/MACsec/IPsec engine architecture: throughput, latency, key capacity, algorithm suite
- `quantum-safe-design`: Hybrid key exchange implementation: classical + PQC, algorithm selection, performance impact

## Process

1. TLS offload: implement TLS 1.3 handshake in hardware/firmware (ECDHE key exchange, certificate verification, HKDF key derivation) with data-plane AES-GCM in a dedicated crypto engine. Key design parameters: maximum concurrent sessions (determines session key storage), handshakes per second (asymmetric crypto throughput), bulk throughput (AES-GCM at line rate: 10/25/100 Gbps). For line-rate AES-GCM: pipeline the GHASH and AES computations, use AES-NI or dedicated hardware blocks.
2. MACsec (802.1AE): encrypt and authenticate Ethernet frames at Layer 2. Key agreement via MKA (MACsec Key Agreement, 802.1X-2010). Hardware engine processes frames inline: encrypt payload with AES-GCM-256, append ICV (integrity check value). Latency budget: must not exceed switch forwarding latency specification (< 1 microsecond for cut-through). Support for multiple SAKs (Secure Association Keys) for key rotation without traffic interruption.
3. IPsec: hardware acceleration for ESP (Encapsulating Security Payload). Support AES-GCM and ChaCha20-Poly1305. SA (Security Association) lookup from SPI (Security Parameters Index) in packet header. SA database capacity determines maximum concurrent tunnels. Anti-replay window implementation in hardware (bitmap check against sequence number).
4. Quantum-safe hybrid: implement hybrid key exchange combining classical ECDH with ML-KEM (Kyber). Concatenate the shared secrets from both and derive the session key with HKDF. This provides security against both classical and quantum attackers. Performance impact: ML-KEM-768 adds approximately 2 KB to the key exchange message and 0.1-0.5 ms to handshake time. Plan for algorithm agility: the design should allow swapping PQC algorithms as standards evolve.
5. Secure time synchronization: implement IEEE 1588 PTP with authentication (Annex K) or NTS (Network Time Security, RFC 8915) for NTP. Time accuracy matters for certificate validity checking, replay window management, and audit log integrity. Hardware timestamping at the MAC layer for sub-microsecond accuracy.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
