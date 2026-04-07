# Personal Brand Visual System

Builds a complete visual identity for your personal brand -- colors, fonts, imagery style, and rules for applying them consistently everywhere. Not a logo design tutorial. This is the system behind the logo: the reason some people's LinkedIn, website, slides, and business cards all feel like the same person, while yours looks like five different people made them on five different days. Works for freelancers, job seekers, content creators, small business owners, or anyone who needs to look more polished and intentional online and in print.

## Execution Pattern: Phase Pipeline

```
PHASE 1: BRAND DNA       --> Define your brand personality, audience, and positioning
PHASE 2: COLOR SYSTEM    --> Build a palette that communicates who you are before anyone reads a word
PHASE 3: TYPOGRAPHY      --> Select fonts that match your brand voice and work everywhere
PHASE 4: IMAGERY STYLE   --> Define photo treatments, graphics, and visual patterns
PHASE 5: APPLICATION     --> Create rules for consistent use across all platforms and materials
```

## Inputs
- brand_context: object -- Who you are professionally (role, industry, niche), what you do, and who you serve. Include your personal website, social profiles, or portfolio if they exist
- personality_words: array -- 3-5 words that describe how you want to come across (e.g., approachable, expert, bold, calm, playful, premium, minimal). Be honest -- pick who you actually are, not who you think you should be
- audience: object -- Who needs to trust you: hiring managers, clients, followers, investors, peers. Their age range, industry, and what "professional" looks like in their world
- existing_assets: object -- (Optional) Any existing logo, colors, fonts, or brand elements you're already using or attached to
- inspirations: array -- (Optional) People, brands, or websites whose visual style you admire. Include what specifically you like about each

## Outputs
- color_palette: object -- Primary, secondary, accent, and neutral colors with hex codes, usage ratios, and accessibility ratings
- typography_system: object -- Heading and body font pairings with sizes, weights, and platform-specific alternatives
- imagery_guidelines: object -- Photo style, graphic elements, icon style, and patterns with do/don't examples
- brand_board: object -- One-page visual summary showing all elements working together
- application_guide: object -- Specific settings for LinkedIn, website, slides, email signatures, and business cards

## Execution

### Phase 1: BRAND DNA
**Entry criteria:** Person has a professional context and can describe how they want to be perceived.
**Actions:**
1. Define the brand positioning statement: "I help [audience] achieve [outcome] through [approach]." This isn't a tagline -- it's the filter every visual decision runs through. If a color or font doesn't support this statement, it's wrong.
2. Map the personality spectrum. Place the brand on these axes:
   - **Formal <---> Casual** (suit energy vs. coffee shop energy)
   - **Bold <---> Subtle** (loud and impossible to ignore vs. quiet confidence)
   - **Traditional <---> Modern** (established credibility vs. forward-thinking)
   - **Warm <---> Cool** (approachable and human vs. polished and precise)
   These positions directly determine color temperature, font weight, and imagery style in later phases.
3. Audit the audience's visual expectations. A brand targeting corporate finance clients needs different signals than one targeting creative entrepreneurs. Look at the top 5 people in the same space -- what visual patterns dominate? The goal isn't to copy but to understand the baseline, then differentiate within it.
4. Identify the "visual gap" -- the space between how you currently present and how you want to be perceived. If your current LinkedIn looks like a college student's profile but you're positioning as a senior consultant, that gap is the problem to solve.
5. Document any non-negotiable constraints: existing logo that won't change, company brand guidelines to work within, platforms that must be supported, accessibility requirements, budget for tools.

**Output:** Brand positioning statement, personality spectrum map, audience visual expectations, current vs. desired gap analysis, and constraints list.
**Quality gate:** Personality spectrum positions are specific (not "somewhere in the middle" for everything). Audience expectations are based on actual observation, not assumption. Positioning statement is one sentence.

### Phase 2: COLOR SYSTEM
**Entry criteria:** Brand DNA defined with personality spectrum positions.
**Actions:**
1. Select the primary color based on personality mapping:
   - Warm + Bold = saturated reds, oranges, warm yellows
   - Warm + Subtle = terracotta, sage, muted gold, dusty rose
   - Cool + Bold = electric blue, deep purple, emerald
   - Cool + Subtle = slate, navy, cool gray, muted teal
   Avoid choosing a color "because you like it." Choose it because it communicates the right thing to the right audience. You can like navy AND have a strategic reason for using it.
2. Build the full palette with specific roles:
   - **Primary (60%):** The dominant color. Used for headers, key UI elements, and the overall "feel." One color, one hex code.
   - **Secondary (25%):** Complementary or analogous to primary. Used for supporting elements, backgrounds, section breaks. One to two colors.
   - **Accent (5-10%):** High-contrast pop color for calls to action, highlights, and emphasis. One color. This should be the color that draws the eye.
   - **Neutrals (remainder):** Background, body text, and breathing room. Typically a warm white or cool white, a medium gray, and a near-black. Never use pure #000000 or #FFFFFF -- they're harsh on screen.
3. Test contrast ratios for accessibility. Primary on white: minimum 4.5:1 for body text, 3:1 for large text (WCAG AA). Use an online contrast checker. If your brand blue fails on white backgrounds, you need a darker variant for text use.
4. Create dark mode variants. Flip the palette: light backgrounds become dark, dark text becomes light, accent colors may need to be slightly more saturated to pop on dark backgrounds. Don't just invert -- adjust.
5. Generate a "color in context" mockup: show the palette applied to a LinkedIn banner, a slide deck title slide, and a website header. Colors that look great as swatches sometimes clash in real layouts.

**Output:** Complete color palette with hex codes, RGB values, usage percentages, contrast ratios, dark mode variants, and context mockups.
**Quality gate:** Primary color has minimum 4.5:1 contrast on white. Palette has no more than 5-6 total colors. Every color has a defined role and usage percentage. Dark mode variants are tested.

### Phase 3: TYPOGRAPHY
**Entry criteria:** Color palette established.
**Actions:**
1. Select a heading font based on brand personality:
   - **Formal + Traditional:** Serif fonts (Playfair Display, Lora, Cormorant Garamond)
   - **Formal + Modern:** Geometric sans-serifs (Montserrat, Raleway, Josefin Sans)
   - **Casual + Bold:** Strong sans-serifs (Poppins, Work Sans Bold, Outfit)
   - **Casual + Subtle:** Rounded or humanist sans-serifs (Nunito, Source Sans Pro, DM Sans)
   Stick to Google Fonts or system fonts unless you have a specific paid font. Free and widely available beats beautiful and unavailable.
2. Select a body font. Rules: must be highly readable at small sizes, must pair well with the heading font (contrast in style, harmony in proportion). Sans-serif headings pair with serif body text and vice versa. Or use the same family in different weights. Never use two fonts that are almost-but-not-quite the same -- that looks like a mistake.
3. Define the type scale:
   - H1 (page titles): 32-48px
   - H2 (section headers): 24-32px
   - H3 (subsections): 18-24px
   - Body: 16-18px (never smaller than 16px for body text on screens)
   - Small/caption: 12-14px
   Line height: 1.4-1.6 for body text. Heading line height: 1.1-1.3.
4. Specify font weights and when to use them. Most brands need exactly three weights: regular (400) for body, medium (500) for emphasis, and bold (700) for headings. More than that creates decision fatigue and inconsistency.
5. Create platform fallbacks: what fonts to use when your primary choice isn't available (email clients, social media text overlays, mobile apps). Every font choice needs a system font fallback: Arial, Helvetica, Georgia, or system-ui.

**Output:** Font pairing with specimen examples, type scale with specific sizes and weights, line height standards, platform-specific alternatives, and fallback chain.
**Quality gate:** Heading and body fonts are available for free or already owned. Type scale covers all common use cases. Fonts render well on both Mac and Windows. At least one system font fallback is defined.

### Phase 4: IMAGERY STYLE
**Entry criteria:** Color and type systems established.
**Actions:**
1. Define the photo style:
   - **Color treatment:** Full color, desaturated, duotone with brand colors, black and white with color accent? Match to brand personality -- warm brands use warm-toned photos, cool brands use cooler tones.
   - **Composition:** Clean and minimal (lots of white space, single subjects), busy and energetic (groups, action, texture), documentary-style (candid, imperfect, real)?
   - **Subject matter:** People (what kind -- headshots, lifestyle, working?), objects, environments, abstract? If using stock photos, define what "on-brand" stock looks like (hint: not the diverse-team-high-fiving genre).
2. Set graphic element rules:
   - **Shapes:** Rounded corners (approachable) vs. sharp corners (precise). Circles (friendly) vs. rectangles (structured). Choose one geometric tendency and stick to it.
   - **Lines:** Thin lines (elegant, delicate) vs. thick lines (bold, confident). Solid vs. dashed. One style.
   - **Patterns/textures:** If using them, define exactly which ones. Geometric patterns, organic textures, gradients, grain? Maximum two pattern types.
3. Define icon style: line icons, filled icons, duotone, hand-drawn? Match the weight and style to your type choices. Heavy fonts pair with filled icons. Light fonts pair with line icons. Consistency here is more important than any individual choice.
4. Create a "do/don't" reference list with specific examples:
   - DO: Use photos with natural lighting and muted backgrounds
   - DON'T: Use photos with heavy filters, neon overlays, or busy backgrounds
   - DO: Use brand accent color for graphic highlights
   - DON'T: Introduce new colors through graphics
5. Address the headshot question directly: professional headshot requirements (background color, lighting style, crop ratio, expression style that matches brand personality). This one photo appears everywhere -- it should be intentional.

**Output:** Photo style guide, graphic element rules, icon specifications, do/don't reference, and headshot requirements.
**Quality gate:** Every imagery decision connects back to brand personality. Do/don't list has at least 5 specific entries. Headshot guidance is actionable enough to brief a photographer.

### Phase 5: APPLICATION
**Entry criteria:** All visual elements (color, type, imagery) defined.
**Actions:**
1. Build the one-page brand board: a single visual that shows logo (if exists), color palette swatches, font samples, imagery examples, and graphic elements all together. This is the "at a glance" reference you'll check before making anything. It should take less than 10 seconds to scan.
2. Create platform-specific guides:
   - **LinkedIn:** Banner dimensions (1584x396), profile photo crop, post image sizes, recommended colors for text overlays, what font to use in Canva when creating post graphics
   - **Website/portfolio:** Header, body, and accent color assignments, font loading recommendations, image aspect ratios, max content width
   - **Slide decks:** Title slide layout, content slide layout, color use per slide (max 2-3 colors per slide), font sizes for projection readability
   - **Email signature:** Layout, which colors to use (keep it simple -- max 2), font that renders in all email clients
   - **Business cards:** Front/back layout, print color mode (CMYK conversions), font minimum size for print (never below 8pt)
3. Build a Canva/Figma brand kit setup guide (step by step): how to save colors, upload fonts, create templates, and set defaults so every new design starts on-brand.
4. Define the "80% rule" for consistency: not everything will be perfectly on-brand -- especially social media in-the-moment content. That's fine. The goal is 80% consistency, with the 20% variance being personality showing through, not chaos.
5. Create a quick-reference cheat sheet: a wallet-sized reference with primary color hex, heading font name, body font name, and the three most-used platform specs. For those moments when you're building something quickly and can't look at the full guide.

**Output:** Brand board, platform-specific guides for 5+ platforms, tool setup instructions, 80% rule guidelines, and quick-reference cheat sheet.
**Quality gate:** Brand board fits on one page/screen. Platform guides include exact dimensions and settings. Every guide is specific enough that someone else could create on-brand materials without asking questions.

## Exit Criteria
Done when: (1) color palette has primary, secondary, accent, and neutral colors with hex codes and usage ratios, (2) typography system has heading/body fonts with a defined scale and fallbacks, (3) imagery style guide covers photos, graphics, icons, and headshot requirements, (4) brand board shows all elements together, (5) application guide covers at least 5 platforms with specific settings and dimensions.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| BRAND DNA | Person can't articulate their brand personality | Adjust -- use the "pick from these pairs" method: show 5 visual comparisons (minimal vs. ornate, warm vs. cool) and let them react. Instinct is faster than articulation |
| BRAND DNA | Brand needs to appeal to very different audiences (e.g., corporate clients AND creative freelancers) | Adjust -- find the overlap in audience expectations. Usually "competent and approachable" works across most professional contexts. Avoid trying to be two brands |
| COLOR SYSTEM | Chosen color fails accessibility contrast requirements | Adjust -- darken or saturate the color for text use, keep the original for large decorative elements. Create a "text-safe" variant |
| COLOR SYSTEM | Person is attached to a color that doesn't fit their brand positioning | Adjust -- use it as the accent color (small doses) and choose a strategically appropriate primary. They still see their favorite color without it undermining the brand |
| TYPOGRAPHY | Desired font isn't available on key platforms | Adjust -- find the closest available alternative. Google Fonts has near-matches for most popular paid fonts. Document both the ideal and the fallback |
| IMAGERY | Person has no budget for professional photography | Adjust -- curate a list of specific stock photo sources (Unsplash collections, Pexels) with search terms that match brand style. Use consistent editing (same filter/treatment) to unify different source photos |
| APPLICATION | Person doesn't use design tools (Canva, Figma) | Adjust -- focus on platform-native customization (LinkedIn settings, website theme colors, Google Slides themes) and provide hex codes for copy-pasting |

## State Persistence
- Brand positioning statement and personality spectrum (foundational reference)
- Complete color palette with hex codes, usage rules, and accessibility data
- Typography system with font names, sizes, weights, and fallbacks
- Imagery guidelines and do/don't reference
- Platform-specific settings and dimensions
- Brand board file and quick-reference cheat sheet
- Evolution log (what changed and why, so the brand stays coherent as it grows)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
