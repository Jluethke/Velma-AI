# Connected Device Inventory

Inventory all connected devices in the home.

## Inputs

- `home-layout`: The rooms and areas in the home
- `existing-devices`: Smart devices already installed or planned

## Outputs

- `device-inventory`: Complete list of devices by room with capabilities
- `integration-map`: Which devices can communicate with each other

## Process

1. List each smart device by room (lights, thermostat, locks, cameras, sensors, speakers).
2. Record each device's protocol (WiFi, Zigbee, Z-Wave, Bluetooth, Thread).
3. Map which devices are compatible with each other and with the central hub.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
