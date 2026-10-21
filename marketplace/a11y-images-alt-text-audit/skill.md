# Images and Alternative Text Audit

**One-line description:** Classifies every image, inline SVG, icon font, CSS background image and image of text with the W3C alt decision tree (informative, functional, decorative, complex, text), then checks each text alternative against its class for SC 1.1.1 Non-text Content and SC 1.4.5 Images of Text.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.
- `repo_dir` (string, required): Front-end source repository, for static searches.

---

## Outputs

- `image_issues` (object[]): One row per failing image: `issue_id` (IM001, ...), `sc` (1.1.1 or 1.4.5), `page_id`, `selector`, `image_class` (informative, functional, decorative, complex, text), `current_alt` (exact value, or "missing"), `problem` (missing, empty-on-meaningful, filename, redundant, not-describing-function, decorative-exposed, no-long-description, image-of-text), `suggested_alt` (only when the meaning is clear from context; otherwise "owner to supply"), `source_location`, `source` = "images".

---

## Phase 1: Collect Every Image

### Entry Criteria
- Inventory exists.

### Actions
1. On each page run in the DevTools Console:
   ```js
   console.table([...document.querySelectorAll('img, svg, [role=img], input[type=image], area, i[class*=icon], span[class*=icon]')].map(el => ({
     tag: el.tagName, sel: el.id ? '#' + el.id : el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '',
     alt: el.hasAttribute('alt') ? el.getAttribute('alt') : 'MISSING',
     role: el.getAttribute('role'), ariaLabel: el.getAttribute('aria-label'),
     ariaHidden: el.getAttribute('aria-hidden'),
     inLinkOrButton: !!el.closest('a[href], button'),
     src: (el.currentSrc || el.getAttribute('src') || '').split('/').pop()
   })));
   ```
2. CSS background images: in DevTools, search Styles for `background-image: url(`; or run `rg -n "background(-image)?\s*:.*url\(" <repo_dir> --glob "*.{css,scss,less}"`. A background image that carries meaning (a product photo, a status icon) fails 1.1.1 unless text in the HTML conveys the same meaning.
3. Static search for images without `alt` in source:
   - JSX: `rg -nP "<img(?![^>]*\balt=)[^>]*>" <repo_dir>/src`
   - Vue and HTML templates: `rg -nP "<img(?![^>]*(\balt=|:alt=))[^>]*>" <repo_dir>`
   - Angular: `rg -nP "<img(?![^>]*(\balt=|\[alt\]=|\[attr\.alt\]=))[^>]*>" <repo_dir>/src`
   `-P` enables the PCRE2 engine that supports the `(?!...)` lookahead; plain `rg` does not.

### Output
An image list per page.

### Quality Gate
- Every page has a saved Console table.
- The three static searches were run and their output saved.

---

## Phase 2: Classify with the Decision Tree

### Entry Criteria
- Image list exists.

### Actions
1. Classify each image by asking these questions in order (W3C WAI Images Tutorial, "An alt Decision Tree"):

   | Question | If yes |
   |---|---|
   | Does the image contain text? | if the same text is next to it in HTML: decorative; if not: `image_class` = text (alt = the text; also check 1.4.5) |
   | Is it inside a link or button, or is it the only content of one? | functional: alt describes the destination or action, not the picture ("Search", not "magnifying glass") |
   | Does it add information to the page? | informative: alt is a short description of that information |
   | Is it a chart, diagram, map or infographic? | complex: short alt naming it, plus a long description in nearby text, a linked page, or `aria-describedby` |
   | Is it purely decorative or redundant with adjacent text? | decorative: `alt=""` with no `title`; or a CSS background |

2. If the purpose cannot be determined from the page (for example a product photo with no caption), set `suggested_alt` = "owner to supply". Never invent facts the image may not show.

### Output
Each image with an `image_class`.

### Quality Gate
- Every image in the list has exactly one `image_class`.

---

## Phase 3: Check Each Alternative Against Its Class

### Entry Criteria
- Classification done.

### Actions
1. Apply the checks:

   | Class | Fail when | `problem` |
   |---|---|---|
   | any `<img>` | no `alt` attribute at all (screen readers may read the file name) | missing |
   | informative, functional, text | `alt=""` or `aria-hidden="true"` | empty-on-meaningful |
   | any | alt is a file name (`IMG_2041.jpg`, `hero-banner`) | filename |
   | any | alt starts with "image of", "picture of", "graphic of", or repeats adjacent text word for word | redundant |
   | functional | alt describes appearance, not action or destination | not-describing-function |
   | decorative | non-empty alt, a `title`, or an inline SVG without `aria-hidden="true"` | decorative-exposed |
   | complex | no long description reachable | no-long-description |
   | text | the same presentation could be made with styled HTML text, and it is not a logo | image-of-text (1.4.5) |

2. Inline SVG rules:
   - Meaningful: `<svg role="img" aria-labelledby="t1"><title id="t1">Order shipped</title>...</svg>` or `role="img"` with `aria-label`. Without `role="img"`, some browser and screen reader pairs ignore `<title>`.
   - Decorative: `<svg aria-hidden="true" focusable="false">`. `focusable="false"` matters only for legacy Internet Explorer and is harmless.
   - Icon in a button with no text: the button needs a name (`aria-label` on the button, or visually hidden text), and the SVG gets `aria-hidden="true"`.
3. Icon fonts (`<i class="fa fa-trash">`): the glyph is announced as a strange character or nothing. Fail when the icon carries meaning and there is no text alternative. Fix pattern: `aria-hidden="true"` on the `<i>` and visually hidden text or `aria-label` on the control.
4. Find the source location for each failing image: search the `src` file name or class in `repo_dir` (`rg -n "<filename>" <repo_dir>/src`), and record the file and line. If the alt comes from a CMS field, record "CMS: <content type>.<field>".

### Output
`image_issues`.

### Quality Gate
- Every failing row has a `problem` from the fixed list and a `source_location` or a CMS field reference.
- No row has `suggested_alt` invented for an image whose meaning is unknown (those say "owner to supply").

---

## Worked Example

Illustrative only. P01 home page.

Phase 1 Console table excerpt:
```
tag  sel           alt                 inLinkOrButton  src
IMG  .logo         "logo"              true            logo.svg
IMG  .hero-img     MISSING             false           summer-sale.png
SVG  .icon-cart                        true
```
Phase 2: `.logo` is functional (links home); `summer-sale.png` contains the text "Summer Sale 40% off" that is not in the HTML, so class = text; the cart SVG is functional inside a link with no other text.
Phase 3 rows: IM001 `problem` not-describing-function, `current_alt` "logo", `suggested_alt` "Example Shop home"; IM002 `problem` missing plus 1.4.5 image-of-text, `suggested_alt` "Summer Sale 40% off"; IM003 `problem` empty-on-meaningful for the cart link (no accessible name), `suggested_alt` "Cart".

---

## Exit Criteria

DONE when every image on every inventory page is classified and every failing alternative is recorded with a fixed problem code and a source location.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Images lazy-load and are missing from the table | **Adjust**: scroll to the bottom of the page first, or run `document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')` and wait, then rerun. |
| Phase 2 | Cannot tell if a photo is informative or decorative | **Adjust**: ask "if the image were removed, would a user lose information?"; if unknown, mark informative and "owner to supply". |
| Phase 3 | Alt text comes from user uploads | **Adjust**: record the upload form as the fix location (it must ask for alt text) and record existing items as a content issue. |

**Do not:** write alt text that guesses what a photo shows; add `alt` to decorative images with descriptive text; put `title` attributes as a substitute for `alt`.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
