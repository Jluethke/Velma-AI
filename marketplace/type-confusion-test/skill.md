# Type Confusion Test

Test for type confusion attacks that bypass validation through unexpected object types.

## Inputs

- `serialization-inventory`: Serialization formats and endpoints
- `gadget-chain-results`: Gadget chain test results

## Outputs

- `type-confusion-results`: Type confusion vulnerabilities found
- `bypass-techniques`: Validation bypasses through type substitution

## Process

1. Substitute expected object types with alternative classes that implement the same interface
2. Test for polymorphic deserialization where the type is attacker-controlled
3. Check for JSON deserialization type confusion (Jackson, Fastjson @type)
4. Document which type substitutions bypass server-side validation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
