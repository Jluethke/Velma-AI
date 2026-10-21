# Ics Asset Inventory

Inventory all controllers, HMIs, historians, and network components in the authorized test environment.

## Inputs

- `ics-scope`: Authorized ICS environment, zones, and device types
- `network-diagrams`: Available network architecture documentation

## Outputs

- `ics-device-inventory`: Complete inventory of PLCs, RTUs, HMIs, historians, and network devices
- `ics-network-map`: Network topology showing Purdue model levels and connections

## Process

1. Passively discover devices through network traffic analysis (no active scanning of safety systems)
2. Catalog PLCs, RTUs, and DCS controllers with firmware versions
3. Map HMI workstations, engineering workstations, and historian servers
4. Document the network architecture against the Purdue reference model

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
