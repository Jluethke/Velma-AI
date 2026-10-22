# Tpm Secure Element Design

Select and integrate a trusted platform module or secure element: TPM 2.0 hierarchy and key management, CC EAL certification process, and integration into the system security architecture.

## Inputs

- `system-security-architecture`: Overall system threat model, required security functions, host processor interface
- `certification-requirements`: Required assurance level: CC EAL, FIPS 140-3, platform-specific (TCG, GlobalPlatform)

## Outputs

- `tpm-se-selection`: Selected component with interface specification, supported algorithms, key storage capacity, and certification status
- `integration-design`: Bus connection (SPI, I2C), command protocol, key hierarchy mapping to TPM hierarchies, locality configuration

## Process

1. Define security functions needed from the root of trust: key generation and storage, signature and verification, encryption/decryption, PCR measurement, attestation, monotonic counter, sealed storage. Map each function to TPM 2.0 commands or SE applets.
2. TPM 2.0 hierarchy: Endorsement (EK: device identity, manufacturer-provisioned), Platform (PH: firmware measurements, controlled by BIOS), Owner (SRK: user keys, general purpose). Each hierarchy has independent authorization. Map application keys to the correct hierarchy.
3. Select component: compare discrete TPM (e.g., Infineon SLB9672, Nuvoton NPCT7xx) vs firmware TPM (fTPM in ARM TrustZone or Intel ME) vs secure element (NXP SE050, Microchip ATECC608). Discrete TPM provides hardware isolation but adds BOM cost and board space. fTPM shares the main processor. SE is smaller and cheaper but may lack full TPM command set.
4. For CC EAL certification: evaluate which EAL level is required (EAL4+ is typical for secure elements, EAL6+ for government applications). Certification adds 6-18 months and significant cost. Use pre-certified components where possible. If custom silicon: engage a CCRA-licensed evaluation lab early, write the Security Target document defining the TOE (Target of Evaluation) boundary.
5. Integration: connect via SPI (faster, full-duplex) or I2C (fewer pins, multi-drop). Implement the TCG TPM command interface (TIS or CRB). Verify that the TPM initialization sequence is correct in the boot chain (TPM must be initialized before first PCR extend). Test all key generation, signing, and attestation flows end-to-end.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
