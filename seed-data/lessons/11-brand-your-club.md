# Chapter 11: Brand Your Club with Theme Forge

---

A private club with a generic visual identity sends a signal: this is a template, not a place. Brand tells your members they have arrived somewhere intentional. This lesson walks through Theme Forge — hyperlocal's built-in visual editor — and how to use it to make your club look unmistakably yours.

---

## What Theme Forge Does

Theme Forge is a browser-based design tool at `/admin/themes/create`. It generates a complete design token set — colors, radii, typography — from a single primary color. You pick a hue, it builds a full light/dark-mode color system using real color science, then you can tune individual tokens.

The output is a Theme record in your database. Setting a Theme as active immediately changes how your site looks — no deploy, no CSS changes in code.

---

## Opening Theme Forge

> **Action:** Log in to the admin panel. Navigate to `/admin/themes/create` (or **Themes** → **New Theme** in the sidebar).

You will see:

- **Hue ring** — a color wheel for selecting your primary hue
- **Harmony cards** — four color relationship options (complementary, triadic, etc.)
- **Token grid** — the full set of CSS custom properties that Theme Forge manages
- **App preview** — a live preview showing your theme applied to sample components
- **WCAG bar** — accessibility contrast scores for the current theme

---

## Choosing Your Primary Color

The primary color is the visual anchor of your theme. Everything else is derived from it.

> **Action:** Click and drag on the **hue ring** to rotate to your desired hue. Watch the App Preview update in real time.

A few considerations:

- **Blues and greens** read as trustworthy and calm — good for educational or professional communities
- **Ambers and oranges** read as energetic and warm — good for creative or hobbyist communities
- **Deep purples and indigos** read as premium and exclusive — good for high-ticket membership clubs
- **Neutrals (near-black or near-white primaries)** work for any community that wants to feel editorial

> **Note:** Your primary hue does not need to match a specific brand color. Theme Forge builds the palette algorithmically, so colors that look wrong as a hex code often produce beautiful palettes. Explore before committing.

---

## Selecting a Harmony

The **harmony cards** show four color relationship options for your accent palette:

| Harmony | What it means |
|---|---|
| Analogous | Colors adjacent on the wheel — cohesive, muted |
| Complementary | Colors opposite on the wheel — high contrast, dynamic |
| Triadic | Three evenly spaced hues — balanced, varied |
| Split-complementary | The hue adjacent to your complement — energetic but stable |

For most communities, **analogous** or **complementary** works best. Triadic themes can look busy if not handled carefully.

> **Action:** Click each harmony card and watch how the token grid and app preview update. Select the one that feels right for your community.

---

## The Token Grid

The token grid shows all the CSS custom properties Theme Forge manages:

| Token category | What it controls |
|---|---|
| Background / Foreground | Page background color, primary text color |
| Card / Card Foreground | Content card backgrounds (used on panels, modals) |
| Primary / Primary Foreground | Buttons, active states, links |
| Accent / Accent Foreground | Secondary interactive elements |
| Border | Dividers, input borders |
| Muted / Muted Foreground | Subtle backgrounds, subdued text |
| Destructive | Error states, delete actions |
| Ring | Focus rings for keyboard navigation |

You can click any token in the grid to override it manually — useful for fine-tuning specific values that the algorithm did not get quite right.

---

## The WCAG Bar

The WCAG bar at the bottom of the forge shows contrast ratios for critical color pairings:

| Score | Meaning |
|---|---|
| AA (4.5:1+) | Passes WCAG 2.1 Level AA for normal text |
| AAA (7:1+) | Passes WCAG 2.1 Level AAA for normal text |
| ❌ | Fails — consider adjusting lightness |

> **Note:** WCAG compliance is both an ethical obligation and a practical one — low-contrast text is hard to read for everyone in suboptimal lighting, not just users with visual impairments. Aim for AA as a minimum.

Theme Forge will warn you if your theme fails contrast requirements. Adjust the lightness slider or manually override the failing token.

---

## Typography

Below the color tokens, set your typography:

| Field | Controls |
|---|---|
| `fontHeading` | The font stack for headings (h1–h4) |
| `fontBody` | The font stack for body text and UI labels |

These accept any valid CSS `font-family` value. To use Google Fonts, add the font name exactly as it appears on Google Fonts:

```
'Playfair Display', serif
```

> **Note:** Google Fonts are loaded at runtime from the CDN. If your community audience is in a region with restricted access to Google services, host fonts locally instead.

---

## Saving and Applying Your Theme

> **Action:** When you are satisfied with the theme, give it a name in the **Theme Name** field at the top of the forge. Click **Save Theme**.

The theme is saved as a record in your database. To make it active:

> **Action:** Navigate to **Settings** → find the `theme` relation field → select your new theme → Save.

The site now uses your theme. Reload any page to see it applied.

---

## Importing an Existing Theme

If you have a JSON theme export from a previous install or a shared theme, use the **Import Theme** panel at `/admin/themes` → **Import**. Paste the JSON and save — the imported theme becomes available in your theme selector.

---

## What's Next

Your club has a visual identity. The final lesson is the launch checklist — everything to verify before you announce your community and invite your first members.

## Design Is a Signal

Your theme is not decoration. It is the first thing a new visitor experiences and the last thing a long-time member sees every time they log in. A thoughtful, cohesive theme signals that this is a real place run by a person who cares. That signal matters more than you might think.
