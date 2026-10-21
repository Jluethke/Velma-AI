# Logmon Sensitive Data Check

Check logs for sensitive data that should not be logged (credentials, PII, health data, payment data).

## Inputs

- `source-inventory`: Log source inventory
- `siem-access`: Access to search and sample log data

## Outputs

- `sensitive-data-findings`: Instances of sensitive data found in logs
- `data-handling-assessment`: Assessment of log sanitization and masking practices

## Process

1. Sample logs from each source and scan for common sensitive data patterns (SSN, credit card, email, password)
2. Check application logs for request/response body logging that may capture credentials
3. Test whether error messages in logs expose internal system details
4. Review log masking and redaction configurations

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
