# Design System Strategy: Luminous Professionalism

## 1. Overview & Creative North Star
The **Creative North Star** for this design system is **"The Luminous Atoll."** 

In beauty salon management, the interface should mirror the physical transformation experienced by the client: transitioning from chaos to clarity, and from the mundane to the radiant. We are moving away from the heavy, industrial "dark mode" of the past and into an editorial space that feels airy, high-end, and intentional.

This system breaks the "standard template" look by utilizing **intentional asymmetry**—where key action buttons or display typography may bleed off standard grid alignments—and **tonal depth**. Instead of rigid boxes, we use layered, soft-edged surfaces that feel like fine-milled paper or frosted glass. The result is a professional tool that feels like a premium lifestyle magazine.

---

## 2. Colors: The Palette of Radiance
We leverage a sophisticated spectrum that balances high-energy warm accents with calming, pastel-toned neutrals.

### Tonal Foundation
*   **Primary (`#765b00` / `#ffc700`):** Our "Golden Hour" accent. Used for high-priority CTAs and brand moments.
*   **Secondary (`#775932` / `#ffd6a5`):** A warm, skin-tone adjacent peach that adds human warmth to the digital environment.
*   **Tertiary (`#67587d` / `#dac7f2`):** A soft lavender that provides a calming contrast to the primary yellow, perfect for background accents or specialized status tags.

### The "No-Line" Rule
To maintain a high-end editorial feel, **1px solid borders are strictly prohibited for sectioning.** 
*   **Boundary Definition:** Create separation solely through background color shifts. For example, a `surface-container-low` list item should sit atop a `background` (`#faf9fe`) surface. 
*   **Nesting:** Treat the UI as a series of physical layers. A card should be defined by its shift to `surface-container-lowest` (#ffffff) against a `surface-container` background, not by a stroke.

### The "Glass & Gradient" Rule
*   **Signature Gradients:** Use a subtle linear gradient (Top-Left to Bottom-Right) transitioning from `primary` to `primary_container` for hero banners or primary action buttons to give them "soul."
*   **Glassmorphism:** Floating elements (like navigation bars or modals) must use `surface` colors at 80% opacity with a `backdrop-filter: blur(20px)`.

---

## 3. Typography: Editorial Clarity
We utilize **Plus Jakarta Sans** for its modern, geometric-yet-warm character, replacing the standard Noto Sans for a more premium feel.

*   **Display (lg/md/sm):** Large, confident, and tight-tracking. Used for empty state titles or welcome messages.
*   **Headlines & Titles:** These serve as the "anchors" of the page. Use `headline-lg` for screen headers to establish an authoritative hierarchy.
*   **Body (lg/md/sm):** Optimized for readability in high-density data environments (like booking schedules).
*   **Labels:** Minimal and purposeful. Always use `label-md` for metadata to keep the interface from feeling cluttered.

---

## 4. Elevation & Depth: Tonal Layering
Depth in this system is not "added"—it is "revealed" through the stacking of Material tokens.

*   **The Layering Principle:** 
    *   Base layer: `surface` (`#faf9fe`)
    *   Section layer: `surface-container-low` (`#f4f3f8`)
    *   Interactive Card: `surface-container-lowest` (`#ffffff`)
*   **Ambient Shadows:** For elements that must float (like FABs or Modals), use a **Low-Opacity Tinted Shadow**. Instead of grey, use a 6% opacity shadow derived from `on_surface` with a 32px blur and 8px offset. It should look like a soft glow, not a drop shadow.
*   **The "Ghost Border" Fallback:** If a divider is mandatory for accessibility, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Soft & Purposeful

### Buttons & Inputs
*   **Primary Button:** Uses `primary_container` with `on_primary_container` text. Corners are `full` (pill-shaped) for a friendly, approachable feel.
*   **Input Fields:** Use `surface_container_highest` with a `none` border. On focus, transition to a `ghost border` of the `primary` color at 20% opacity. Corner radius: `md` (1.5rem).

### Cards & Lists (The Beauty Chart)
*   **No Dividers:** Lists of clients or appointments must be separated by `1rem` of vertical white space or a subtle shift from `surface` to `surface-container-low`.
*   **Soft Corners:** Apply `DEFAULT` (1rem) or `md` (1.5rem) rounding to all containers to remove "sharpness" from the professional environment.

### Appointment Chips
*   **Status Indicators:** Use `secondary_container` (Peach) for "Pending" and `tertiary_container` (Lavender) for "Completed." These soft pastels keep the schedule looking "airy" even when full.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use ample white space. If you think there's enough space, add 8px more.
*   **Do** use `surface-bright` for areas where you want the user's eye to land first.
*   **Do** ensure that typography scales are dramatic. High contrast between `display-lg` and `body-md` creates an editorial, high-end look.

### Don't:
*   **Don't** use pure black (#000000). Use `on_surface` (#1a1b1f) for text to maintain a soft, premium feel.
*   **Don't** use 1px solid borders to separate list items. It breaks the "Luminous Atoll" aesthetic and makes the app look like a legacy spreadsheet.
*   **Don't** use high-intensity shadows. If the shadow is clearly visible as a dark shape, it is too heavy. Decrease opacity and increase blur.