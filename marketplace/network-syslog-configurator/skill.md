# Network Syslog Configurator

Configure centralized syslog logging on all network devices.

## Inputs

- `device-inventory`: Network devices to configure
- `management-acl`: Management ACLs ensuring syslog server is reachable

## Outputs

- `syslog-config`: Syslog configuration applied to each device
- `log-verification`: Confirmation that log events are arriving at the syslog server

## Process

1. Configure each device to send logs to the central syslog server
2. Set the logging severity level to informational or higher
3. Include timestamps and source interface in log messages
4. Verify log arrival at the syslog server with a test event

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
