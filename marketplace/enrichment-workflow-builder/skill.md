# Enrichment Workflow Builder

Build the workflow for enriching contact records from public signals to fill gaps and keep data current without asking the contact directly.

## Inputs

- `dedup-rules`: Duplicate detection logic
- `merge-protocol`: How to merge records

## Outputs

- `enrichment-sources`: Ranked list of public data sources for each field (LinkedIn for job title, company website for email format, social media for interests)
- `enrichment-workflow`: The step-by-step process for enriching a contact record, including when to enrich (on creation, on verification trigger, on re-engagement) and how to validate enriched data

## Process

1. Map enrichment sources by field. Job title and company: LinkedIn (primary), company website (secondary). Email: company email pattern + first/last name (verify by sending). Phone: not reliably enrichable from public sources, ask directly. Interests and topics: social media posts and activity. Company size and industry: company databases and news.
2. Design the enrichment workflow. On new contact creation: look up LinkedIn profile and company, populate job title, company, and industry. On verification trigger: re-check LinkedIn for title and company changes. On re-engagement: full re-enrichment of all fields since the contact may have changed jobs, cities, or roles during dormancy.
3. Set the validation rule: enriched data gets a 'source: enriched' tag and a lower confidence score than directly confirmed data. If enriched data conflicts with existing data, flag for manual review instead of overwriting. A LinkedIn title that differs from your CRM might mean the contact changed jobs, or it might mean LinkedIn is showing an old profile.
4. Define the enrichment ethics boundary. Use only publicly available information (LinkedIn public profiles, company websites, published articles, public social media). Do not use information obtained through access the contact did not intend (private social media posts, internal directories you have access to but should not use for personal CRM purposes). The enrichment should pass the test: 'would the contact be comfortable knowing I found this information this way?'

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
