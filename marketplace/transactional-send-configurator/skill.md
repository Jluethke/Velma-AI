# Transactional Send Configurator

Configure the sending infrastructure and API integration.

## Inputs

- `transactional-templates`: The built templates
- `delivery-requirements`: The SLAs and retry policies

## Outputs

- `send-configuration`: API integration configuration (provider, API keys, endpoint, headers, payload format)
- `retry-configuration`: Retry and fallback configuration for failed sends

## Process

1. Select and configure the transactional email provider (or self-hosted SMTP).
2. Set up the API integration: authentication, endpoint, payload format for each template.
3. Configure the retry logic (exponential backoff, max retries, fallback provider if available).
4. Set up the webhook for delivery status callbacks (delivered, bounced, complained).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
