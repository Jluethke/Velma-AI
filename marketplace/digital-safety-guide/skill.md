# Digital Safety Guide

A practical, plain-language guide to staying safe online. Covers passwords (why "password123" is dangerous and what to use instead), two-factor authentication (what it is and how to turn it on), phishing emails (how to spot them), public WiFi risks, social media privacy settings, and what to do if you think you've been hacked. Written for people who use technology but feel anxious about security. No scare tactics -- just clear, actionable steps ranked by importance.

## Execution Pattern: ORPA Loop

## Inputs
- current_situation: string -- What brought you here: "I just want to be safer online," "I think I might have been hacked," "someone told me my password is bad," "I got a suspicious email," "I want to protect my family," or "I don't know where to start"
- devices_used: array -- (Optional) What you use regularly: iPhone, Android phone, iPad/tablet, Windows computer, Mac, Chromebook, smart TV, smart home devices (Alexa, Google Home)
- accounts_that_matter: array -- (Optional) Which accounts are most important to protect: email, banking, social media, Amazon/shopping, medical portal, work accounts, photos/iCloud/Google Photos
- current_habits: object -- (Optional) Be honest, no judgment: Do you reuse passwords? Use the same password everywhere? Write them on sticky notes? Use your pet's name? Have you ever set up two-factor authentication? Do you click links in emails without checking?
- technical_comfort: string -- (Optional) "I can barely use my phone," "I manage fine day-to-day," "I'm pretty comfortable with tech," or "I work with computers but security isn't my thing"
- household: string -- (Optional) Who else uses your devices or network: kids, teenagers, elderly parents, spouse, roommates -- different people create different risks

## Outputs
- priority_actions: array -- The 5 most important things to do RIGHT NOW, ranked by impact. Each one includes why it matters and step-by-step how to do it.
- password_guide: object -- A complete, jargon-free explanation of password safety: what makes a strong password, why reusing passwords is dangerous, how to use a password manager (and why it's easier than what you're doing now), and how to change your most critical passwords today
- two_factor_guide: object -- What two-factor authentication is (in one sentence), why it's the single most effective thing you can do, and step-by-step instructions to turn it on for your email, banking, and social media
- phishing_guide: object -- How to spot fake emails, texts, and calls. Real examples of what scam messages look like vs. real ones. The one test that catches 90% of phishing attempts.
- wifi_safety: object -- When public WiFi is dangerous and when it's fine. What a VPN is (in plain English) and whether you need one.
- social_media_checkup: object -- The 3 privacy settings to change on Facebook, Instagram, and other platforms, with step-by-step instructions
- emergency_plan: object -- What to do RIGHT NOW if you think you've been hacked, step by step

## Execution

### OBSERVE: Assess Current Risk and Habits
**Entry criteria:** Person has shared their situation and at least some information about their habits.
**Actions:**
1. Determine urgency level:
   - **Emergency:** "I think I've been hacked" or "there are charges on my account I didn't make" -- skip to emergency plan immediately
   - **Elevated:** "I got a suspicious email" or "someone has my password" -- address the immediate threat, then move to general hardening
   - **Preventive:** "I just want to be safer" -- methodical walkthrough, highest-impact changes first
2. Assess current risk based on habits:
   - Same password everywhere = critical risk (one breach exposes everything)
   - No two-factor on email = high risk (email is the master key to every other account)
   - Clicking email links without checking = high phishing risk
   - No screen lock on phone = high risk if lost or stolen
   - Public WiFi for banking = moderate risk
   - Sharing devices without separate accounts = moderate risk depending on who
3. Identify their most valuable accounts. Not all accounts are equal:
   - **Tier 1 (protect these first):** Email (it's the reset gateway for everything else), banking/financial, anything with your Social Security number
   - **Tier 2 (protect next):** Shopping accounts with saved payment info (Amazon, etc.), social media, photo storage
   - **Tier 3 (when you get to it):** Streaming services, forums, newsletters
4. Note their tech comfort level so instructions match their ability. "Go to Settings > Security > Two-Factor Authentication" is meaningless if they don't know where Settings is.
5. Check for household factors. A teenager on the same WiFi has different risk patterns than a grandparent sharing a tablet.

**Output:** Urgency level, current risk assessment, account priority tiers, instruction detail level needed, household considerations.
**Quality gate:** Emergency situations are identified immediately. Risk assessment is based on stated habits, not assumptions.

### REASON: Build the Protection Plan
**Entry criteria:** Risk assessment complete.
**Actions:**
1. Rank the priority actions by impact. The order almost always is:
   - **#1: Secure your email account.** Email is the skeleton key. If someone gets into your email, they can reset the password on every other account you have. Turn on two-factor authentication for email FIRST.
   - **#2: Stop reusing passwords.** If you use the same password on Amazon and your bank, and Amazon gets breached (it happens), hackers try that password on banks next. This is called credential stuffing and it's how most people get "hacked."
   - **#3: Set up a password manager.** This sounds hard but it's actually easier than remembering passwords. You remember ONE password (for the manager), and it remembers everything else. It's like a locked notebook that auto-fills your passwords for you.
   - **#4: Turn on two-factor authentication everywhere.** After your email, turn it on for banking, social media, and shopping accounts. It means even if someone gets your password, they still can't get in without your phone.
   - **#5: Learn to spot phishing.** The one test: "Is this message asking me to DO something urgently?" Pause. Go to the website directly by typing the URL yourself. Don't click the link in the message.
2. Build the password explanation:
   - Why "Fluffy2019!" is a bad password (it's your pet's name and a year -- both findable on social media)
   - Why "correct horse battery staple" style passwords work (long and random beats short and complex)
   - How a password manager works in practice (install app, create one master password, let it generate and store everything else)
   - Recommended managers by comfort level: Apple Keychain (already on your iPhone/Mac, free), Google Password Manager (already in Chrome, free), 1Password or Bitwarden (for people ready for a dedicated app)
3. Build the two-factor explanation:
   - "Two-factor means your account needs two things to log in: your password (something you know) AND your phone (something you have). It's like a door that needs both a key and a fingerprint. Even if someone copies your key, they can't get in without your finger."
   - SMS codes (text messages) are the easiest to set up. They're not the most secure option, but they're 100x better than no two-factor at all.
   - Authenticator apps (Google Authenticator, Microsoft Authenticator) are better if comfortable
4. Build the phishing guide with concrete examples:
   - Red flags: urgency, generic greeting, slightly-wrong sender address, links that don't match the company
   - The golden rule: never click links in unexpected messages. Go to the website yourself by typing the address.
5. Build device-specific instructions for everything recommended based on what they use.

**Output:** Ranked action plan, password guide with manager recommendation, two-factor walkthrough, phishing examples, device-specific instructions.
**Quality gate:** Actions are in impact order. Password manager recommendation matches their comfort level. Two-factor instructions are specific to their email provider.

### PLAN: Make It Doable, Not Overwhelming
**Entry criteria:** Full protection plan built.
**Actions:**
1. If emergency (suspected hack), restructure everything:
   - Lead with: Change email password from a clean device RIGHT NOW
   - Then: Check for unauthorized account recovery changes (phone numbers, backup emails added by someone else)
   - Then: Change banking password
   - Then: Check financial accounts for unauthorized activity
   - Then: Enable two-factor on everything
   - Then: Monitor credit (annualcreditreport.com -- one free report per year from each bureau)
2. For non-emergency, break the work into sessions:
   - **Today (15 minutes):** Change your email password to something strong and turn on two-factor for email
   - **This week (30 minutes):** Install a password manager and add your top 5 accounts
   - **This month (as you go):** Each time you log into a site, let the password manager generate a new unique password. Turn on two-factor wherever you see the option
   - **Ongoing:** Before clicking any link in a message, pause and ask "Was I expecting this?"
3. For household situations, add specific guidance:
   - **Kids/teens:** Separate accounts on shared devices. Family sharing for app purchases. Privacy settings on social media (they won't like it, but explain why). Screen time limits are not safety -- they're separate.
   - **Elderly parents:** Write down the master password and keep it in a locked drawer (not on a sticky note on the monitor). Set up their password manager for them. Be their tech support for suspicious emails.
   - **Shared devices:** Use separate user profiles on computers. Never stay logged into banking on shared devices.
4. Create the quick-reference card: 5 rules that fit on a sticky note:
   - Different password for every account
   - Two-factor on email and banking
   - Don't click links in unexpected messages
   - Lock your phone with a PIN or fingerprint
   - When in doubt, go to the website directly

**Output:** Phased action plan (today/this week/this month/ongoing), household-specific guidance, quick-reference card.
**Quality gate:** No session requires more than 30 minutes. Steps are ordered so the most impactful happen first. Instructions don't require any prior security knowledge.

### ACT: Deliver the Guide
**Entry criteria:** Phased plan complete.
**Actions:**
1. If emergency, lead with the emergency plan in numbered steps. Everything else waits. Use bold for the single most important action: "**Change your email password right now, before reading the rest of this.**"
2. For preventive cases, open with reassurance: "Online safety doesn't require you to be a tech expert. It comes down to a handful of habits. Let's get the biggest ones in place."
3. Deliver the priority actions as a numbered list. For each one:
   - One sentence on why it matters (the motivation)
   - Step-by-step how to do it right now (the instructions)
   - How long it takes (set expectations: "This takes about 3 minutes")
4. Present the phishing guide as "The One Test": "Before you click any link in any email or text, ask yourself: 'Was I expecting this?' If not, don't click. Go to the website by typing the address yourself. This one habit prevents more hacking than any software you could buy."
5. Include the WiFi section as practical, not scary: "Public WiFi at a coffee shop is fine for browsing and social media. Just don't log into your bank or enter credit card numbers. If you need to do something sensitive, switch to your phone's cellular data instead."
6. Present social media privacy settings as a quick checklist, platform by platform, with the exact menu path for each setting.
7. End with the quick-reference card and: "You don't need to do all of this today. Start with #1 and #2. Those two changes alone make you dramatically safer than most people online."

**Output:** Complete digital safety guide, personalized to situation, devices, and comfort level.
**Quality gate:** Emergency situations are handled first and fast. Non-emergency guidance is broken into doable chunks. No scare tactics. No jargon without explanation. Every recommendation includes step-by-step instructions.

## Exit Criteria
Done when: (1) current risk is assessed and communicated without panic, (2) priority actions are ranked and explained with step-by-step instructions, (3) password safety is explained with a specific manager recommendation, (4) two-factor authentication is explained and setup instructions are provided for their primary email, (5) phishing awareness is covered with the "one test" framework, (6) if emergency, immediate action steps are provided as the top priority, (7) ongoing habits are simple enough to remember and practice.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Person is actively locked out of their account | Emergency -- guide them through account recovery for their specific provider (Google, Apple, Microsoft, etc.). If recovery options have been changed by an attacker, escalate to contacting the provider's support directly |
| OBSERVE | Person has already given credentials to a phishing site | Emergency -- change that password immediately on a clean device. If the same password is used elsewhere, change those too. Check for unauthorized activity. Enable two-factor everywhere |
| REASON | Person insists their simple password is fine because "nobody would target me" | Explain -- most hacking is automated, not targeted. Bots try stolen password lists against millions of accounts. You don't need to be important to be a victim. You just need to be on a list |
| REASON | Person is overwhelmed by the number of recommendations | Simplify -- cut down to exactly 2 actions: (1) change email password, (2) turn on two-factor for email. Everything else can wait. Two changes that take 10 minutes total |
| PLAN | Person doesn't have a smartphone for two-factor authentication | Adjust -- recommend email-based two-factor (backup codes, email verification) or a hardware security key. Note that even SMS to a basic phone works |
| PLAN | Person manages accounts for an elderly relative remotely | Adjust -- provide instructions for setting up password manager with shared vault, backup recovery contacts, and a check-in schedule |
| ACT | Person asks about VPNs, antivirus, or other products | Address briefly -- "A good free antivirus (Windows Defender, which is already on your computer) is sufficient for most people. A VPN is useful if you regularly use public WiFi for sensitive tasks, but it's lower priority than passwords and two-factor" |
| ACT | User rejects final output | Targeted revision -- ask which section fell short (password guidance, two-factor setup, phishing examples, or emergency plan) and rerun only that section with more detail or simpler instructions. |

## State Persistence
- Accounts secured (which accounts have strong passwords and two-factor enabled)
- Password manager status (which one, setup complete or in progress, number of accounts migrated)
- Phishing encounters (suspicious messages flagged, actions taken)
- Household members covered (who has been set up with safe practices)
- Security improvement timeline (when each major change was made, for tracking progress)

## Reference

### Account Priority Tiers

| Tier | Accounts | Why |
|---|---|---|
| Tier 1 (secure first) | Email, banking, Social Security-linked portals | Email is the master reset key for everything else |
| Tier 2 (secure next) | Shopping with saved payment info, social media, photo storage | Financial and reputational risk |
| Tier 3 (when you get to it) | Streaming, forums, newsletters | Low consequence if compromised |

### Password Manager Options by Comfort Level

| Tool | Comfort Level | Cost | Notes |
|---|---|---|---|
| Apple Keychain | iOS/Mac users | Free | Built in, auto-fills, syncs across Apple devices |
| Google Password Manager | Chrome users | Free | Built into Chrome, syncs with Google account |
| Bitwarden | Any device | Free (premium $10/yr) | Open source, cross-platform, most privacy-focused |
| 1Password | Any device | $3/mo | Polished UI, good for families |

### Two-Factor Authentication Options (Best to Least Secure)

| Method | Security Level | Ease of Setup |
|---|---|---|
| Hardware key (YubiKey) | Highest | Moderate |
| Authenticator app (Google/Microsoft Authenticator) | High | Moderate |
| SMS text code | Medium | Easiest |
| Email code | Medium | Easiest |

### The One Phishing Test

Before clicking any link in any email or text: "Was I expecting this message?"

If NO → Go to the website by typing the URL yourself. Never click the link.

### 5-Rule Quick Reference Card

1. Different password for every account (use a password manager)
2. Two-factor on email and banking (do this today)
3. Never click links in unexpected messages (type the URL yourself)
4. Lock your phone with a PIN or fingerprint
5. When in doubt, go to the website directly

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
