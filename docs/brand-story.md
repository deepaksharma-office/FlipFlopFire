# Brand Story / About

Add **Brand Story / About** in the Shopify theme editor. Existing sections and
templates are unchanged. The section reuses the theme's fonts, complete icon
picker, `icon-or-image` snippet, responsive positioning helper, and existing
`cinematic-hero.js` viewport observer. No new runtime dependency is added.

Upload a main image and optionally a mobile image. A mobile-only upload also
works as the main fallback. Control aspect ratio, optional explicit height,
object fit, desktop/mobile crop, grayscale, opacity, width, border, and corners.
Height 0 uses the selected aspect ratio. Grayscale affects the image only.

The glow is a separate CSS shadow layer behind the image. Its color, opacity,
intensity, blur, spread, size, and position are editable. On mobile, blur and
spread are capped to keep the effect balanced. It does not alter image pixels
or add horizontal scrolling.

The badge belongs to the image wrapper and remains in flow with a configurable
negative top margin for overlap. Its text, icon source, mobile custom icon,
colors, border, shadow, width, padding, and device-specific offsets are editable.
Horizontal offsets are constrained on narrow images to preserve readable width;
mobile overlap is capped at 24px. Without an image, the badge is not rendered.
Clear all badge text or disable the badge to hide it. Missing custom icons fall
back to the selected theme icon, and text can display without any icon.

The content side uses independent Eyebrow, Heading, Description / custom text,
and Button blocks. Add, remove, disable, and reorder them freely. Each supports
typography, alignment, width, spacing, responsive offsets, and animation controls.
Use the heading level appropriate to the page. The button requires both a label
and a URL; its gradient endpoints, solid/outline style, radius, border, spacing,
width, and hover effect are editable. The default darker pink/orange gradient
maintains contrast with white button text.

Desktop uses equal columns with configurable vertical alignment. Tablet
(750–1099px) reduces typography, gaps, and badge padding. Mobile (below 750px)
places content first, followed by the image and badge. Content height remains
natural. Missing columns collapse, empty blocks leave no wrappers, and a section
with neither image nor content renders nothing, including no asset tags.

Animations are independently staggered. The existing observer adds CSS animation
classes once the section enters the viewport and handles theme-editor block
selection. Without JavaScript, with animations disabled, or with reduced motion,
content remains visible.

## Validation

Run `shopify theme check --output json`.

`tests/brand-story.cjs` uses the existing temporary Playwright/LiquidJS setup.
Set `NODE_PATH` to the directory containing those packages, then run:

```powershell
node tests/brand-story.cjs
```

It renders actual section/snippet Liquid with synthetic image fixtures and
substituted Shopify image filters, together with the theme's base CSS. It checks
168 scenarios across 1920, 1728, 1440, 1280, 1024, 900, 768, 480, 430, 414, 390,
375, 360, and 320px. Cases include long copy, missing image/button/description,
reordered blocks, empty content, image-only layouts, missing badge/icon,
mobile-only images, and maximum offsets/glow settings. Additional checks cover
CTA clicks, animations, reduced motion, and visibility without JavaScript.
Desktop/mobile screenshots are saved in the operating system temp directory.

The attachment supplied written requirements but no reference image. The defaults
follow the described composition. Exact reference matching and final photography
should be reviewed in Shopify.
