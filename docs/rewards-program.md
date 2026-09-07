# Loyalty / Rewards Program

Add **Loyalty / Rewards Program** in the theme editor. Introductory Eyebrow,
Heading, and Description blocks appear first; Reward card blocks form the grid;
Button blocks form the final CTA row. Editor order is preserved within each area.
All content is editable. Button labels require configured URLs before rendering.

The heading has separate normal/accent phrases, with an optional configurable
gradient on the accent phrase. Cards have independent numbers, theme/custom
icons, mobile custom icons, copy, colors, typography, borders, badge styling,
spacing, minimum heights, and animations. Number values are displayed exactly
as entered. Missing values leave no empty elements; wholly empty cards and
sections disappear.

Desktop columns are configurable and limited by the visible card count; tablet
uses up to two columns and mobile stacks cards. Cards stretch within each row.
Each row reserves space for the largest overlapping number badge. Icons use the
existing theme implementation; entrance animations reuse `cinematic-hero.js`.
No new runtime dependency or slider is introduced.

## Validation status

Shopify Theme Check returned no findings for this section. Local schema and
Liquid rendering checks are included in `tests/newsletter-crew.cjs`, including
different card counts, custom number text, missing icons/numbers, and empty cards.

Responsive browser testing remains incomplete: automatic approval review
rejected the browser-test command because the account usage limit was reached.
No reference image was present in the attachment, so exact visual matching is
also unverified. The current implementation follows the written composition.
