# Data Decay Modeler

Model the decay rate for each type of contact data so you know when a field is likely stale even if nobody reported a change.

## Inputs

- `contact-fields`: The fields in your contact records (name, email, phone, job title, company, address, social profiles)
- `historical-change-data`: Any records of when contact fields changed in the past (from CRM history, bounced emails, returned mail, LinkedIn profile changes)

## Outputs

- `decay-model`: Per-field estimated half-life: the number of months after which there is a 50% chance the field is outdated
- `staleness-flags`: Fields in your current database that exceed their half-life and should be verified

## Process

1. Set default half-lives from industry data. Job title: 18 months (median tenure in a role). Company: 24 months (median time at a company). Email: 14 months (tied to company changes plus domain changes). Phone: 30 months. Physical address: 36 months. LinkedIn URL: 60 months (rarely changes). Name: practically never (but legal name changes and name corrections happen).
2. Calibrate against your own data. If you have CRM change history, calculate the actual change frequency for each field. If your contacts change jobs faster than the 18-month default (common in tech), shorten the half-life. If your contacts are in stable industries (government, academia), lengthen it.
3. Flag all fields that exceed their half-life. A contact whose job title was last confirmed 24 months ago has exceeded the 18-month half-life and should be flagged for verification. Do not assume the data is wrong, just that it needs checking.
4. Rank staleness by relationship importance. A stale phone number for a level 4 trusted contact is a higher priority than a stale email for a level 1 acquaintance. Verify high-value contacts first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
