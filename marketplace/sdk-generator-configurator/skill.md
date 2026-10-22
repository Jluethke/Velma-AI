# Sdk Generator Configurator

Configure the SDK generator and customize the output.

## Inputs

- `sdk-requirements`: The SDK requirements per language
- `api-spec`: The OpenAPI specification
- `sdk-style-guide`: The style guide

## Outputs

- `generator-config`: Generator configuration (OpenAPI Generator, Speakeasy, or custom) with templates and customizations
- `generated-sdks`: The generated SDK code for each target language

## Process

1. Select the generator (OpenAPI Generator, Speakeasy, Stainless, or custom templates).
2. Configure the generator for each language: package name, namespace, authentication handling.
3. Customize templates for language-idiomatic patterns where the default output is not sufficient.
4. Generate the SDK code and review the output.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
