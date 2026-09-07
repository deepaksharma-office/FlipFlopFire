/** Opt in with data-theme-slider and configure with Splide's data-splide JSON. */
(() => {
  const selector = '[data-theme-slider]';
  const instances = new Map();

  function init(root = document) {
    const elements = [...root.querySelectorAll(selector)];
    if (root.matches?.(selector)) elements.unshift(root);
    elements.forEach((element) => {
      if (instances.has(element) || !window.Splide) return;
      try {
        const slider = new window.Splide(element, {
          perPage: 1,
          perMove: 1,
          pagination: false,
          keyboard: 'focused',
          direction: document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr',
          reducedMotion: { speed: 0, rewindSpeed: 0, autoplay: 'pause' },
        });
        slider.mount();
        instances.set(element, slider);
      } catch (error) {
        console.warn('Unable to initialize theme slider', element, error);
      }
    });
  }

  function destroy(root) {
    instances.forEach((slider, element) => {
      if (root === element || root.contains(element)) {
        slider.destroy(true);
        instances.delete(element);
      }
    });
  }

  window.ThemeSliders = { init, destroy, get: (element) => instances.get(element) };
  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('shopify:section:unload', (event) => destroy(event.target));
  document.addEventListener('shopify:block:select', (event) => {
    const slide = event.target.closest('.splide__slide');
    const element = slide?.closest(selector);
    const slider = instances.get(element);
    if (!slider || slider.state.is(window.Splide.STATES.DESTROYED)) return;
    slider.Components.Autoplay?.pause();
    const slides = [...element.querySelector('.splide__list').children];
    slider.go(slides.indexOf(slide));
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  } else {
    init();
  }
})();
