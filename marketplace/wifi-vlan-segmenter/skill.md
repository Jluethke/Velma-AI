# Wifi Vlan Segmenter

Segment wireless traffic into separate VLANs to isolate corporate, guest, and IoT devices.

## Inputs

- `ap-inventory`: Access points to configure
- `wireless-auth-config`: Authentication settings per SSID

## Outputs

- `vlan-config`: VLAN assignments per SSID
- `segmentation-test`: Verification that inter-VLAN traffic is blocked where intended

## Process

1. Assign each SSID to a dedicated VLAN
2. Configure ACLs or firewall rules to restrict guest and IoT VLANs from the corporate network
3. Allow only internet access from the guest VLAN
4. Test that devices on one VLAN cannot reach devices on a restricted VLAN

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
