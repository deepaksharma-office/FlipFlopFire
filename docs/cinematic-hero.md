# Cinematic hero

Add **Cinematic hero** through the theme editor on any page template. This is a
new section; existing hero sections and template assignments are unchanged.

Upload the background and featured image separately. Each accepts a mobile
image; a mobile-only upload also works as the desktop fallback. Image cropping,
radius, width, overlay, gradient, section minimum height, and spacing are editable.
The overlay affects the background only. Clearing its gradient lets the overlay
color control the full overlay.

Content uses reorderable Eyebrow, Heading, Description / custom text, Button,
Trust / feature, and Bottom statement blocks. Each block can be disabled and has
alignment, width, responsive offsets, spacing, typography, and animation controls.
Any block can be placed in the main content or the bottom area; order is preserved
within its selected area. Use the heading-level setting to match the page hierarchy.

Horizontal offsets reserve space inside the column to prevent overflow. Vertical
position controls add space in document flow so they do not overlap neighboring
content. Desktop is 1100px and up, tablet is 750–1099px, and mobile is below 750px.
The image moves below content on mobile. Review overlap is adjustable per device;
mobile overlap is capped at 10vw to keep landscape images and extreme offsets safe.

The review card stays hidden until a real rating or review text is entered. Its
colors, icon, border, width, overlap, offsets, and animation are independent of the
featured image. It can also display without an image. Stars are decorative;
include the rating scale in the rating text, for example “4.9 / 5”.

A button requires both label and URL. Empty and disabled blocks do not leave
wrappers or spacing. No placeholder images or sample review claims are shipped.
Text defaults are editable schema values. Content remains visible without
JavaScript and when reduced motion is requested. Animations run once when the
section enters the viewport; theme-editor block selection reveals the section.

## Validation

`shopify theme check --output json`

The standalone browser test uses Playwright and LiquidJS installed outside the
theme. Set `NODE_PATH` to their node_modules directory, then run:

```powershell
node tests/cinematic-hero.cjs
```

It renders the actual Liquid section and snippets with synthetic image fixtures
and the theme's base CSS. Shopify asset/image filters are substituted locally.
It checks 1920, 1728, 1440, 1280, 1024, 768, 480, 390, 375, and 320px for overflow,
content containment, and unintended text overlap across nine content scenarios.
These include long copy, missing image/button/description, reordered and repeated
blocks, all-empty content, mobile-only images, and maximum horizontal offsets.
Additional checks cover CTA clicks, animation, reduced motion, and no-JS visibility.
Desktop and mobile screenshots are written to the operating system temp directory.

The supplied attachment contained written requirements but no reference image.
The layout follows those requirements; visual matching against the intended
reference and final merchant imagery must be reviewed in Shopify.
