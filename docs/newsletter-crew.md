# Newsletter / Email Signup

Add **Newsletter / Email Signup** in the Shopify theme editor. Copy, typography,
background/gradient, borders, spacing, input appearance, submit button, and
privacy text are editable. The attachment contained no reference image; defaults
follow its written description.

The form uses Shopify's native `{% form 'customer' %}` submission, as the existing
newsletter blocks do. Shopify generates its platform hidden inputs; the section
also supplies `contact[tags]=newsletter` and a unique `contact[id]`. It posts
`contact[email]` and optional `contact[first_name]`, with no custom submit handler,
external provider, or simulated success state.

Email is always required. First name can be hidden or made required; it is
optional by default. Field order is configurable in both DOM and visual order.
Accessible labels are separate from placeholders. Values are repopulated from
the Shopify form/customer objects where available and escaped. Shopify's error
list appears with an editable introduction; success uses the configured message
or the existing translated theme success message if that setting is cleared.

The desktop form uses three columns, or two without first name. At 750–1099px,
the submit button moves beneath the two fields. Below 750px all controls stack.
Inputs use minimum heights; mobile email/name text is at least 16px. Clearing
the button label hides the signup form and associated privacy copy. Empty top
copy is omitted; a section with neither copy nor an enabled form renders nothing.

Entrance animations reuse `cinematic-hero.js`. Keyboard focus immediately
reveals the form controls. Reduced motion and no-JavaScript behavior preserve
visibility. There is no JavaScript validation or AJAX submission layer.

## Validation status

`tests/newsletter-crew.cjs` runs local Liquid rendering and schema checks using
the existing temporary LiquidJS package via `NODE_PATH`. Its test-only Shopify
form wrapper provides success/error fixtures; the actual storefront still uses
Shopify's form tag. Checks cover optional fields/content, native required flags,
field order, labels/IDs, escaping, state messages, and unrelated-form isolation.
The script also validates rewards schemas and basic card rendering/empty states.

Browser checks across the requested viewport sizes, final Shopify Theme Check
for this section, and a real storefront subscription have not been completed.
Automatic approval review rejected the preceding browser-test command because
the account usage limit was reached. No live subscription was submitted.
The sandboxed Shopify Theme Check retry also failed during CLI startup with
`uv_os_get_passwd` / `ENOMEM`, before checking the theme.
