# Network Segmentation Configurator

Configure network segmentation to isolate IoT devices.

## Inputs

- `vulnerability-report`: Firmware vulnerability findings
- `device-list`: The devices to segment

## Outputs

- `segmentation-config`: VLAN and firewall rule configuration
- `network-diagram`: Network diagram showing IoT segments

## Process

1. Group devices by trust level and function (cameras, sensors, actuators, management).
2. Create VLANs or network segments for each group.
3. Configure firewall rules to allow only necessary traffic between segments.
4. Block IoT devices from reaching the internet unless required for their function.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
