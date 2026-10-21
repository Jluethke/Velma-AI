# Cloud Resource Inventory

Inventory all cloud resources including compute instances, databases, storage, networking, and serverless functions across accounts and regions.

## Inputs

- `cloud-account-access`: Read-only credentials or role for the cloud account
- `cloud-provider`: Cloud platform (AWS, Azure, GCP)

## Outputs

- `resource-inventory`: Complete inventory of all cloud resources by service and region
- `resource-tags`: Tagging coverage and consistency report

## Process

1. Enumerate all resources across every enabled region.
2. Classify resources by service type, creation date, and last-modified time.
3. Identify untagged or inconsistently tagged resources.
4. Flag resources that appear unused (zero traffic, no recent access).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
