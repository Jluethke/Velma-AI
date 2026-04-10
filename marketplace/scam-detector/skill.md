# Scam Detector

Analyzes suspicious emails, texts, phone calls, or website offers and tells you if it's a scam. Takes the message content, sender info, and any links or phone numbers, then explains exactly what red flags are present. Covers phishing, romance scams, tech support scams, IRS impersonation, grandparent scams, fake job offers, and crypto fraud. Designed specifically for people who aren't sure what to look for -- explains WHY something is suspicious in plain language. Includes what to do if you already clicked or responded.

## Execution Pattern: ORPA Loop

## Inputs
- message_content: string -- The full text of the email, text message, voicemail transcript, social media message, or website offer. Copy-paste the whole thing
- sender_info: object -- Who sent it: email address, phone number, social media profile name, website URL, or "unknown caller"
- links_or_attachments: array -- (Optional) Any links in the message (don't click them -- just copy the URL text), attachment filenames, or phone numbers they want you to call
- context: object -- (Optional) How you received it (email, text, phone call, Facebook message, pop-up on screen, letter in mail), whether you were expecting it, any prior interaction with this sender
- already_responded: object -- (Optional) If you already clicked a link, called back, gave information, or sent money -- what exactly did you do and when

## Outputs
- verdict: string -- Clear answer: "This is a scam", "This is likely a scam", "This is suspicious -- verify before acting", or "This appears legitimate"
- confidence: string -- How confident the assessment is and why (some scams are obvious, some need more context)
- red_flags: array -- Every suspicious element found, each explained in plain language (what it is and why it matters)
- scam_type: string -- What kind of scam this is (phishing, romance, tech support, impersonation, advance fee, etc.) with a plain-language explanation of how this scam works
- safe_next_steps: array -- Exactly what to do right now, step by step
- damage_control: object -- (Only if already responded) What to do immediately to limit harm

## Execution

### OBSERVE: Examine the Message
**Entry criteria:** At least the message content or a description of what happened is provided.
**Actions:**
1. Read the full message content and note every factual claim it makes (who they say they are, what they want, what they're offering, what they're threatening).
2. Examine sender info:
   - Email: check the actual email address (not the display name). Flag free email domains (gmail, yahoo, outlook) claiming to be companies. Flag misspelled company domains (amaz0n.com, paypa1.com, chasebank-secure.com).
   - Phone: check area code. Scammers often spoof local numbers. Government agencies almost never call you first.
   - Social media: check account age, follower count, post history. New accounts with stock photos are red flags.
3. Examine any links WITHOUT clicking them:
   - Look at the actual URL text. Does it go where it claims? (A link saying "Chase Bank" that goes to chase-verify-account.sketchy-domain.com is phishing.)
   - Flag URL shorteners (bit.ly, tinyurl) that hide the real destination.
   - Flag any link asking you to "verify your account" or "confirm your identity."
4. Note the emotional manipulation technique being used:
   - **Urgency:** "Act NOW or your account will be closed" / "You have 24 hours"
   - **Fear:** "You owe the IRS" / "A warrant has been issued" / "Your account was compromised"
   - **Greed:** "You've won!" / "Exclusive investment opportunity" / "Work from home $5000/week"
   - **Trust:** "This is Sergeant Johnson from the local police" / "I'm calling from Microsoft"
   - **Sympathy:** "I'm stuck overseas" / "I need help and you're the only one"
5. Check for telltale language patterns: poor grammar from supposedly professional organizations, generic greetings ("Dear valued customer" instead of your name), threats of legal action via text message, requests for unusual payment methods (gift cards, wire transfer, cryptocurrency, Zelle to a personal account).

**Output:** Cataloged claims, sender analysis, link analysis, emotional manipulation technique identified, language pattern flags.
**Quality gate:** Every claim in the message is identified. Sender info is analyzed. Manipulation technique is named.

### REASON: Identify the Scam Pattern
**Entry criteria:** Message examination complete.
**Actions:**
1. Match against known scam patterns:
   - **Phishing:** Impersonates a bank, company, or service. Wants you to click a link and enter login credentials or personal info. Often claims "suspicious activity" on your account.
   - **IRS/Government impersonation:** Claims you owe taxes, have a warrant, or need to verify your Social Security number. Real IRS contacts you by mail first, never by phone or email demanding immediate payment.
   - **Tech support:** Pop-up says your computer is infected, or someone calls claiming to be Microsoft/Apple. Wants remote access to your computer or payment for fake repairs.
   - **Romance/catfishing:** Online relationship that moves fast, person can never video chat or meet, eventually needs money for an emergency (medical bills, plane ticket, customs fees).
   - **Grandparent/family emergency:** "Grandma, it's me, I'm in trouble." Caller pretends to be a relative in jail, hospital, or stranded. Asks for money via wire transfer or gift cards.
   - **Fake job offer:** Job you never applied for offers great pay. Requires upfront payment for "training materials" or "equipment." Sends you a check to deposit and wire part back.
   - **Advance fee/lottery:** You won a prize but must pay taxes/fees to claim it. You're inheriting money from a foreign relative. A prince needs your help moving money.
   - **Crypto/investment fraud:** Guaranteed returns, pressure to invest quickly, unregistered platform, celebrity endorsement that's fake, "you can't lose" language.
   - **Package delivery:** Text claims a package can't be delivered, click to reschedule. Link goes to a fake site that harvests your info.
   - **Overpayment:** Buyer sends a check for more than the price, asks you to refund the difference. Check bounces after you've sent real money.
2. Count the red flags. Scoring:
   - 0 flags: Appears legitimate
   - 1-2 flags: Suspicious -- verify independently before acting
   - 3-4 flags: Likely a scam
   - 5+ flags: Definitely a scam
3. Consider the one test that catches almost everything: "Are they asking me to DO something urgently?" Legitimate organizations give you time. Scammers need you to act before you think.
4. Check if a legitimate version of this communication exists. Banks do send fraud alerts -- but they never ask for your password. The IRS does collect taxes -- but not via iTunes gift cards.

**Output:** Identified scam type with plain-language explanation of how it works, red flag count and list, confidence level, the "what legitimate version looks like" comparison.
**Quality gate:** Scam type is identified or explicitly marked as uncertain. Each red flag has a plain-language explanation of why it's suspicious. Confidence level is justified.

### PLAN: Determine Response
**Entry criteria:** Scam pattern identified with confidence level.
**Actions:**
1. If verdict is "scam" or "likely scam," build the immediate response plan:
   - Do NOT click any links, call any numbers, or reply to the message
   - Do NOT send money by any method
   - Block the sender (how-to for email, text, social media, phone)
   - Report the message (how-to for each platform: forward phishing emails to the company being impersonated, report to FTC at reportfraud.ftc.gov, forward scam texts to 7726)
   - If the scam impersonates a specific company, contact that company directly using a number from their official website (not from the message)
2. If verdict is "suspicious -- verify," build the verification plan:
   - Contact the supposed sender through an independently verified channel (look up the company's real phone number, go to their real website by typing the URL yourself)
   - Do NOT use any contact info provided in the suspicious message
   - Check your actual account by logging in directly (type the URL, don't click the link)
3. If already responded, build the damage control plan based on what was compromised:
   - **Clicked a link:** Run antivirus scan immediately. Change passwords for any accounts that use the same password as what you might have entered. Enable two-factor authentication.
   - **Gave login credentials:** Change that password immediately. Change it everywhere else you use the same password. Enable two-factor authentication. Monitor the account for unauthorized activity.
   - **Gave Social Security number:** Place a fraud alert at all three credit bureaus (Equifax, Experian, TransUnion -- calling one auto-notifies the others). Consider a credit freeze. File an identity theft report at identitytheft.gov.
   - **Gave bank account or card info:** Call your bank immediately to freeze the card or account. Dispute any unauthorized charges. Request a new card number.
   - **Sent money via gift cards:** Call the gift card company with the card numbers -- some can freeze remaining balances. File a police report. Report to FTC.
   - **Sent money via wire transfer:** Contact the wire service (Western Union, MoneyGram) immediately to request a recall. File a police report. Report to FTC.
   - **Gave remote access to computer:** Disconnect from internet immediately. Run full antivirus scan. Change all passwords from a different device. Check for installed remote access software and remove it. Consider professional malware removal.
   - **Sent cryptocurrency:** Unfortunately this is almost never recoverable. File reports with FTC and FBI's IC3 (ic3.gov) for the record.

**Output:** Step-by-step action plan appropriate to the verdict and what (if anything) was already compromised.
**Quality gate:** Actions are specific and in priority order. If damage control is needed, the most time-sensitive steps are first. All reporting channels include actual URLs or phone numbers.

### ACT: Deliver Assessment
**Entry criteria:** Response plan complete.
**Actions:**
1. Lead with the verdict in plain language. No hedging, no jargon. "This is a scam" or "This looks legitimate."
2. Explain the scam type in one paragraph that a non-technical person would understand: "This is called phishing. Someone is pretending to be your bank so you'll type your password into their fake website. Your real bank already has your password -- they would never ask you to confirm it."
3. List every red flag found, each with a one-sentence explanation:
   - "The email address is support@chasebank-alerts.com -- Chase's real email domain is chase.com"
   - "They say 'Dear valued customer' instead of your actual name -- your real bank knows your name"
   - "They want you to click a link within 24 hours or your account will be 'suspended' -- real banks don't give deadlines like this"
4. Provide the action steps in numbered order, starting with the most important.
5. End with a general protection tip relevant to this scam type that helps prevent future attempts.
6. If the person sounds frightened or has already lost money, acknowledge that scammers are professionals at deception and falling for one is not a sign of stupidity. Millions of smart people get scammed every year.

**Output:** Complete assessment with verdict, scam explanation, red flag list, action steps, and prevention tip.
**Quality gate:** Verdict is unambiguous. Explanation uses no technical jargon. Every red flag is explained in plain English. Action steps are numbered and specific.

## Exit Criteria
Done when: (1) a clear verdict is delivered (scam, likely scam, suspicious, or legitimate), (2) all red flags are identified and explained in plain language, (3) the scam type is named and explained, (4) specific next steps are provided, (5) if the person already responded, damage control steps are prioritized by urgency.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Only a partial message provided (screenshot description, not full text) | Adjust -- analyze what's available, note which checks couldn't be performed, ask for more detail if verdict is uncertain |
| OBSERVE | Message is in a foreign language | Adjust -- translate and analyze, note that foreign-language messages from unknown senders are themselves a red flag if you don't speak that language |
| REASON | Message has characteristics of both legitimate and scam communication | Escalate -- give "suspicious -- verify" verdict with specific verification steps. Never say "probably fine" when uncertain |
| REASON | Scam type doesn't match known patterns | Adjust -- analyze on red flag principles (urgency, unusual payment, too good to be true) even without a pattern match. New scams appear constantly |
| PLAN | Person already sent money and is panicking | Prioritize -- lead with the single most important damage control step. Time-sensitive actions first, reporting second. Be calm and direct |
| PLAN | Person doesn't believe it's a scam (emotionally invested, especially romance scams) | Adjust -- present red flags factually without being condescending. Suggest one specific verification step they can take to confirm for themselves |
| ACT | Person is elderly or non-technical | Adjust -- simplify all instructions. Use "click the X in the corner to close" level of specificity. Suggest calling a trusted family member for help with technical steps |
| ACT | User rejects final output | **Targeted revision** -- ask which section fell short (verdict confidence, a specific red flag explanation, or damage control steps) and rerun only that section. Do not re-analyze the full message. |

## State Persistence
- Scam pattern library (types encountered, evolving tactics, new variants)
- Sender blocklist (previously identified scam senders, domains, phone numbers)
- Report submission history (what was reported to which agency, reference numbers)
- Damage control actions taken (passwords changed, accounts frozen, credit alerts placed)
- Vulnerability profile (which scam types this person is most exposed to, for future awareness)

---

## Reference

### Red Flag Scoring

| Count | Verdict |
|---|---|
| 0 | Appears legitimate |
| 1-2 | Suspicious — verify independently before acting |
| 3-4 | Likely a scam |
| 5+ | Definitely a scam |

### Scam Type Quick Reference

| Type | Key Signal | Typical Ask |
|---|---|---|
| Phishing | Impersonates bank/service; link to fake site | Login credentials |
| IRS impersonation | Claims you owe taxes; threatens arrest | Wire, gift card, crypto |
| Tech support | Pop-up or call claiming virus/infection | Remote access or payment |
| Romance | Online relationship; never meets; emergency | Wire transfer |
| Grandparent | "Grandma it's me, I'm in trouble" | Gift cards |
| Fake job | Unsolicited job offer; wants upfront payment | Deposit + wire back |
| Advance fee | Prize, inheritance, investment; pay fees first | Fees to release funds |
| Package delivery | Text to reschedule delivery; click link | Personal/payment info |
| Overpayment | Sends overpayment check; wants refund | Refund before check clears |

### The One Universal Test

"Are they asking me to do something urgently, with a short deadline, using an unusual payment method?"
Legitimate organizations give you time. Scammers need you to act before you think.

### Damage Control Priority Order (If Already Responded)

1. Remote access given → Disconnect from internet; run antivirus; change all passwords from a different device
2. Credentials entered → Change password immediately + everywhere reused; enable 2FA
3. Bank/card info given → Call bank NOW to freeze; dispute unauthorized charges
4. SSN given → Fraud alert at all 3 credit bureaus; consider credit freeze; file at identitytheft.gov
5. Money wired → Contact wire service immediately to attempt recall; file police report
6. Gift cards sent → Call gift card company with card numbers; some can freeze remaining balance
7. Crypto sent → File FTC + IC3 reports; recovery is rare but document everything

### Reporting Channels (US)

- FTC: reportfraud.ftc.gov
- FBI Internet Crime: ic3.gov
- Identity theft: identitytheft.gov
- Scam text messages: forward to 7726 (SPAM)
- Phishing emails: forward to the impersonated company + report to your email provider

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
