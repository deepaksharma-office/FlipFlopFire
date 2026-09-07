# Benefits / Feature Bar

Add **Benefits / Feature Bar** in the Shopify theme editor. This is a separate
section from **Icon with text bar**. It adds no JavaScript and never initializes
Splide or another carousel.

The default desktop layout is a compact 54px dark strip with a pink top border,
four editable benefits, theme icons, and subtle dividers. Add up to 12 blocks;
equal-width grid columns wrap into additional rows when space is limited.
Wrapped rows have no outer dividers. Section and block padding can increase the
height naturally, and long text wraps without clipping.

Below the theme's 750px breakpoint, choose **Stack** or **Slide**. Slide uses
native horizontal scrolling and CSS scroll snap. Its configurable 80–90% item
width shows a preview of the next item; a single item fills the available width.
The list can receive keyboard focus for native arrow-key scrolling. A thin
native scrollbar remains available. Reduced motion disables smooth scrolling.
At 768px the theme's desktop/tablet grid convention still applies.

## Icons and overrides

The theme icon selector reuses every option from the existing icon block and
renders through `icon-or-image`. Select **Custom image** to use the uploaded
desktop image. If that image is missing, the selected theme icon is used. If no
theme icon is selected but a desktop image exists, the image is used.

Enable **Use custom mobile icon** to replace the desktop icon below 750px.
Without a mobile upload, the desktop choice remains. A mobile-only icon with no
text is hidden on desktop, including its empty section if it is the only block.
Provide an accessibility label for icon-only content, especially custom images.

Block colors inherit section settings when empty. Icon and text sizes use the
section default when set to 0; an icon/text gap of -1 inherits the section gap.
Icon width 0 follows the responsive icon size; a nonzero width supports wide
logos without distortion. Weight, line height, and item alignment have an explicit
section-default option. Block order follows the theme editor.

Empty text emits no paragraph, missing icons emit no icon wrapper, and completely
empty blocks emit no list item. If no valid blocks remain, the section emits no
bar, border, background, or stylesheet link.

## Verification

Run `shopify theme check --output json`.

`tests/benefits-bar.cjs` uses Playwright and LiquidJS installed outside the theme.
Set `NODE_PATH` to their node_modules directory, then run:

```powershell
node tests/benefits-bar.cjs
```

The test renders actual section/snippet Liquid with substituted Shopify image
filters and the existing theme base CSS. It runs 374 scenarios at 1920, 1728,
1440, 1280, 1024, 768, 480, 430, 390, 375, and 320px in both mobile modes.
Coverage includes 1/2/3/4/6/12 blocks, long copy, missing content, icon source
fallbacks, desktop/mobile images, and reordered blocks. JavaScript is disabled;
native keyboard scrolling, last-item reachability, and reduced motion are checked.
Screenshots are written to the operating system temp directory.

The supplied attachment contained written requirements only, with no reference
image. The defaults follow the described composition; exact reference matching
and final merchant images should be reviewed in Shopify.
