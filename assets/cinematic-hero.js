// Content remains visible without JavaScript; animation is progressive enhancement.
if (!customElements.get('cinematic-hero')) {
  customElements.define('cinematic-hero', class extends HTMLElement {
    connectedCallback() {
      if (this.dataset.animate !== 'true' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!('IntersectionObserver' in window)) return;
      this.observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        this.classList.add('is-entered');
        this.observer.disconnect();
      }, { threshold: 0 });
      this.classList.add('is-animation-ready');
      this.observer.observe(this);
      this.onBlockSelect = () => {
        this.classList.add('is-entered');
        this.observer.disconnect();
      };
      this.addEventListener('shopify:block:select', this.onBlockSelect);
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      this.removeEventListener('shopify:block:select', this.onBlockSelect);
    }
  });
}
