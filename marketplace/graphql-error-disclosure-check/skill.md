# Graphql Error Disclosure Check

Check for information disclosure through error messages, stack traces, and debug output.

## Inputs

- `graphql-endpoint`: URL of the GraphQL API endpoint
- `authz-findings`: Authorization findings to inform targeted error testing

## Outputs

- `disclosure-findings`: Information leaked through error responses
- `debug-mode-status`: Whether debug or development mode is exposed

## Process

1. Send malformed queries and record error detail level
2. Check for stack traces, file paths, database schema, or internal IP addresses in errors
3. Test for GraphQL-specific debug extensions (tracing, Apollo debug)
4. Attempt to trigger validation errors that reveal type and field information

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
