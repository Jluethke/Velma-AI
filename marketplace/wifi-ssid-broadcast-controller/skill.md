# Wifi Ssid Broadcast Controller

Control SSID broadcast settings based on network sensitivity.

## Inputs

- `ap-inventory`: Access points to configure
- `vlan-config`: VLAN segmentation already applied

## Outputs

- `ssid-broadcast-config`: Broadcast settings per SSID
- `hidden-ssid-list`: List of hidden SSIDs and their connection instructions

## Process

1. Disable SSID broadcast for management or sensitive networks
2. Keep the guest SSID visible for usability
3. Document the hidden SSID connection procedure for authorized users

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
