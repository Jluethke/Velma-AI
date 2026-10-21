# Ddos Detection Classification

Detect and classify the DDoS attack by type and characteristics.

## Inputs

- `network-alerts`: Network monitoring alerts indicating abnormal traffic
- `service-status`: Status of affected services and their degradation level

## Outputs

- `attack-classification`: Attack type (volumetric, protocol, application layer) and characteristics
- `traffic-profile`: Profile of attack traffic including sources, protocols, and volume

## Process

1. Confirm the service degradation is caused by a DDoS attack, not an infrastructure failure
2. Classify the attack type: volumetric (bandwidth flood), protocol (SYN flood, amplification), or application layer (HTTP flood)
3. Profile the attack traffic: source distribution, protocols, packet sizes, and request patterns
4. Estimate the attack volume in Gbps or requests per second

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
