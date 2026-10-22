# Usb Device Implementation

Implement a USB device with proper descriptor hierarchy, endpoint configuration, enumeration handling, and class-specific protocol for CDC, HID, or custom bulk.

## Inputs

- `usb-class-requirements`: Required USB class (CDC/ACM for virtual COM port, HID for input devices, mass storage, custom bulk), transfer types needed, and data rates
- `framing-protocol`: Application protocol that will run over USB if applicable

## Outputs

- `descriptor-hierarchy`: Device descriptor, configuration descriptor, interface descriptors, endpoint descriptors, and string descriptors with all fields specified
- `usb-driver-api`: Driver interface: init, connect, disconnect, send-data, receive-callback, suspend/resume handling, and class-specific requests

## Process

1. Build the descriptor hierarchy from bottom up. Endpoint descriptors define the pipes: direction (IN/OUT), transfer type (control/bulk/interrupt/isochronous), max packet size (64 bytes for full-speed bulk, 512 for high-speed), and polling interval (for interrupt endpoints). Interface descriptors group endpoints into a function. Configuration descriptor wraps interfaces.
2. For CDC/ACM (virtual COM port): two interfaces. Interface 0 (CDC control): one interrupt IN endpoint for serial state notifications. Interface 1 (CDC data): one bulk IN and one bulk OUT endpoint for data. Include the CDC functional descriptors (header, call management, ACM, union) between the interface and endpoint descriptors.
3. Implement the enumeration state machine. On USB reset: configure endpoint 0 for control transfers (64-byte max packet). Handle standard requests: GET_DESCRIPTOR (return device, config, string descriptors), SET_ADDRESS (move from default to addressed state), SET_CONFIGURATION (move to configured state, enable data endpoints). Handle class-specific requests: SET_LINE_CODING and SET_CONTROL_LINE_STATE for CDC.
4. Handle USB suspend and resume for power management. The host signals suspend by stopping SOF packets for 3 ms. The device must reduce current to under 2.5 mA (for bus-powered devices). On resume (bus activity detected), restore full operation. Implement remote wakeup if the application needs to wake the host.
5. For data transfer, use double-buffered endpoints: the USB hardware fills one buffer while the application processes the other. This prevents gaps in continuous data transfer. The bulk transfer protocol handles flow control: the host will not send another OUT packet until the device ACKs (NAK if busy), and the device will not send IN data until the host polls.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
