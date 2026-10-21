# Web File Permission Setter

Set file and directory permissions for the web root to prevent unauthorized modification.

## Inputs

- `web-server-type`: Web server software
- `module-config`: Enabled modules to determine which directories need write access

## Outputs

- `permission-config`: Applied file and directory permissions
- `permission-change-log`: Record of permission changes

## Process

1. Set the web root ownership to a non-root user
2. Remove write permissions from static content directories
3. Restrict access to configuration files (readable only by the web server user)
4. Disable directory listing

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
