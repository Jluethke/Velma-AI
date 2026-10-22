# Ivr Routing Configurer

Configure the DTMF inputs, speech recognition, and call routing rules.

## Inputs

- `menu-tree`: IVR menu tree
- `ivr-prompts`: Written prompts

## Outputs

- `routing-config`: Routing rules mapping each input to a destination (queue, agent group, self-service module)
- `recognition-config`: DTMF and speech recognition settings for each menu level

## Process

1. Map each DTMF keypress to its routing destination.
2. Configure speech recognition grammars if the system supports spoken input.
3. Set timeout durations (how long to wait for input before reprompting).
4. Define the maximum retry count before routing to a default agent queue.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
