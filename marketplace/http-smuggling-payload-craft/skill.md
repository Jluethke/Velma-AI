# Http Smuggling Payload Craft

Craft targeted smuggling payloads to exploit confirmed desynchronization vectors.

## Inputs

- `smuggling-vectors`: Confirmed smuggling vectors
- `timing-evidence`: Timing evidence of desynchronization

## Outputs

- `crafted-payloads`: Smuggling payloads targeting specific vectors
- `payload-descriptions`: Description of each payload's intent

## Process

1. Design payloads for each confirmed vector type
2. Include request prefixing and response queue poisoning variants
3. Test payload reliability with repeated attempts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
