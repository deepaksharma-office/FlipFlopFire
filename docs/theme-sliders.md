# Theme sliders

Splide 4.1.4 is bundled locally (MIT license in assets/splide-LICENSE.txt).
Add **Icon with text bar** in the theme editor, including the Header group.
All nonempty sets mount a slider on desktop and mobile, including a single block.
Select slides per view separately for desktop (1?6, default 3) and mobile
(1?3, default 1; below 750px). Navigation buttons can appear on desktop, mobile,
or both. Buttons are hidden when all items fit in the current view.
Enable autoplay to advance slides every 2?10 seconds (default 5 seconds).
Autoplay defaults off, pauses on hover or keyboard focus, and respects reduced motion.

Other sections can opt in without a new script:

```html
<div class="splide" data-theme-slider
  aria-label="Featured items"
  data-splide='{"perPage":3,"gap":"24px","breakpoints":{"749":{"perPage":1}}}'>
  <div class="splide__track">
    <ul class="splide__list">
      <li class="splide__slide">First item</li>
      <li class="splide__slide">Second item</li>
    </ul>
  </div>
</div>
```

Use standard Splide options: https://splidejs.com/guides/options/
The shared script handles initial load and Shopify section load/unload events.
For custom HTML replacements, call `ThemeSliders.destroy(container)` before
replacement and `ThemeSliders.init(container)` afterward. Repeated init calls
are safe. `ThemeSliders.get(element)` returns an instance for custom controls.
Avoid loop clones on editable Shopify blocks; use `type: "slide", rewind: true`.
