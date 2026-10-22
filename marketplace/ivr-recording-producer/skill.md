# Ivr Recording Producer

Produce the audio recordings for all IVR prompts.

## Inputs

- `ivr-scripts`: The written scripts
- `recording-schedule`: List of recordings needed

## Outputs

- `recording-files`: Audio files for each prompt, properly formatted for the phone system (8kHz, mono, WAV or CCITT)
- `recording-inventory`: Inventory of all recordings with filenames, durations, and script text

## Process

1. Choose the recording method: professional voice talent, text-to-speech, or internal recording.
2. Record or generate each prompt per the scripts.
3. Format the audio files for the phone system (8kHz sample rate, mono, appropriate codec).
4. Review each recording for clarity, pace, and volume consistency.
5. Build the inventory mapping each file to its menu position and script text.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
