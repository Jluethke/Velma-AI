# Codebase Risk Inventory

Inventory the codebase and identify high-risk areas including authentication, authorization, data handling, and cryptographic operations.

## Inputs

- `source-repository`: Repository URL or local path to the codebase
- `application-context`: Description of the application purpose and architecture

## Outputs

- `risk-inventory`: Map of high-risk code areas with threat context
- `technology-stack`: Languages, frameworks, and libraries in use

## Process

1. Catalog all source files by language, framework, and function.
2. Identify code handling authentication, authorization, and session management.
3. Locate code that processes user input, performs database queries, or calls external services.
4. Mark areas using cryptographic operations, file I/O, or system commands.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
