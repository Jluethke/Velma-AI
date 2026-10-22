# Backup Destination Configurator

Configure the backup destinations: local, cloud, and offsite.

## Inputs

- `backup-schedule`: Backup frequency for each source
- `retention-policy`: How long backups are kept

## Outputs

- `destination-config`: Backup destinations for each source with storage tier and encryption settings
- `cost-estimate`: Monthly and annual storage cost by destination

## Process

1. Select the primary destination for each source: local NAS, cloud object storage, or managed backup service.
2. Configure a secondary destination for critical data (3-2-1 rule: 3 copies, 2 media types, 1 offsite).
3. Set the storage tier (hot, cool, archive) based on access frequency and retention period.
4. Enable encryption at rest and in transit for all destinations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
