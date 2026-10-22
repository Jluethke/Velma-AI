# Medical Emergency Section

Build the medical emergency section: who to call, insurance info, medical power of attorney, and medical history for each household member.

## Inputs

- `household-members`: Who lives in the household
- `emergency-contact-sheet`: The master contact sheet

## Outputs

- `medical-section`: For each household member: insurance policy number, group number, primary care physician, specialists, allergies, medications, blood type, medical power of attorney holder
- `medical-action-steps`: Step-by-step instructions for a medical emergency: who to call first, what information to give the paramedics, where to find the insurance card

## Process

1. For each household member, record: health insurance policy number and phone number, primary care physician, specialists, current medications, known allergies, blood type, and any advance directives.
2. Identify who holds the medical power of attorney. If no one does, note it as a gap to address with an attorney.
3. Write the action steps for someone who has never handled a medical emergency in this household: call 911, give this address, provide this medical history, bring these documents to the hospital.
4. Store a copy of insurance cards and advance directives in the playbook.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
