// Standalone layout checks: NODE_PATH must include playwright and liquidjs.
// Shopify-specific image filters use synthetic fixtures; no store connection is required.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { Liquid } = require('liquidjs');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sections/brand-story.liquid'), 'utf8');
const schema = JSON.parse(source.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
const template = source.replace(/{% schema %}[\s\S]*?{% endschema %}/, '');
const defaults = (settings) => Object.fromEntries(settings.filter((s) => s.id).map((s) => [s.id, s.default ?? '']));
const escape = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const fixture = (background = false) => ({
  alt: background ? '' : 'Synthetic featured image for layout testing',
  url: `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${background ? 600 : 1250}" viewBox="0 0 1000 ${background ? 600 : 1250}"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#40243a"/><stop offset="1" stop-color="#c57e52"/></linearGradient></defs><path fill="url(#g)" d="M0 0h1000v1250H0z"/><circle cx="500" cy="380" r="180" fill="#191923"/><path d="M200 1150V780q300-250 600 0v370" fill="#272731"/></svg>`).toString('base64')}`,
});
const liquid = new Liquid({ root: path.join(root, 'snippets'), extname: '.liquid' });
liquid.registerTag('doc', { parse(token, tokens) { while (tokens.length && !tokens.shift().getText().includes('enddoc')) {} }, render() { return ''; } });
liquid.registerFilter('asset_url', (name) => name);
liquid.registerFilter('stylesheet_tag', () => '');
liquid.registerFilter('image_url', (image) => image.url);
liquid.registerFilter('image_tag', (url, ...options) => {
  const attrs = Object.fromEntries(options.filter(Array.isArray));
  return `<img src="${escape(url)}" width="1000" height="1250" ${Object.entries(attrs).filter(([key]) => !['widths', 'sizes', 'width', 'height'].includes(key)).map(([key, value]) => `${key}="${escape(value)}"`).join(' ')}>`;
});

function context() {
  const settings = { ...defaults(schema.settings), image: fixture(), background_image: '' };
  const blocks = schema.presets[0].blocks.map(({ type }, index) => ({
    type, id: `test-${index}`, shopify_attributes: `data-test-block="${index}"`,
    settings: defaults(schema.blocks.find((b) => b.type === type).settings),
  }));
  blocks.find((b) => b.type === 'button').settings.link = '#shop';
  return { section: { settings, blocks, index: 1 } };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const css = fs.readFileSync(path.join(root, 'assets/brand-story.css'), 'utf8');
  const base = fs.readFileSync(path.join(root, 'assets/base.css'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'assets/cinematic-hero.js'), 'utf8');
  async function render(data, reducedMotion = 'reduce', javascript = true) {
    await page.goto('about:blank');
    await page.emulateMedia({ reducedMotion });
    const html = (await liquid.parseAndRender(template, data)).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
    await page.setContent(`<!doctype html><html><head><style>${base}\n:root{--font-body--family:Arial,sans-serif;--font-heading--family:Impact,Arial,sans-serif;--font-heading--weight:700}body{margin:0} ${css}</style></head><body>${html}<div id="shop">Shop target</div></body></html>`);
    if (javascript) await page.addScriptTag({ content: script });
  }
  async function checkLayout(label) {
    const problems = await page.evaluate(() => {
      const problems = [];
      const hero = document.querySelector('.brand-story');
      const heroRect = hero.getBoundingClientRect();
      if (document.documentElement.scrollWidth > innerWidth) problems.push('horizontal scrolling');
      for (const el of hero.querySelectorAll('.brand-story__block, .brand-story__badge, .brand-story__image')) {
        const r = el.getBoundingClientRect();
        if (r.left < -1 || r.right > innerWidth + 1) problems.push(`${el.className}: outside viewport`);
        if (r.bottom > heroRect.bottom + 1) problems.push(`${el.className}: outside section`);
        if (el.scrollWidth > el.clientWidth + 1) problems.push(`${el.className}: overflowing children`);
      }
      const blocks = [...hero.querySelectorAll('.brand-story__content > .brand-story__block')];
      blocks.slice(1).forEach((el, index) => {
        if (el.getBoundingClientRect().top < blocks[index].getBoundingClientRect().bottom - 1) problems.push('overlapping content blocks');
      });
      const content = hero.querySelector('.brand-story__content');
      const image = hero.querySelector('.brand-story__image');
      if (innerWidth < 750 && content && image && image.getBoundingClientRect().top < content.getBoundingClientRect().bottom) problems.push('mobile image overlaps content');
      return problems;
    });
    assert.deepEqual(problems, [], label);
  }
  const widths = [1920, 1728, 1440, 1280, 1024, 900, 768, 480, 430, 414, 390, 375, 360, 320];
  const scenarios = {
    default: () => context(),
    long: () => { const c = context(); c.section.blocks.find((b) => b.type === 'heading').settings.text = 'Created by firefighters, for the firefighter family and everyone who serves their community'; c.section.blocks.find((b) => b.type === 'text').settings.text = '<p>' + 'A story of service, comfort, and community. '.repeat(30) + '</p>'; return c; },
    noImage: () => { const c = context(); c.section.settings.image = ''; return c; },
    noButton: () => { const c = context(); c.section.blocks.find((b) => b.type === 'button').settings.link = ''; return c; },
    noDescription: () => { const c = context(); c.section.blocks.find((b) => b.type === 'text').settings.text = ''; return c; },
    reordered: () => { const c = context(); c.section.blocks.reverse(); c.section.blocks.push(structuredClone(c.section.blocks[0])); return c; },
    empty: () => { const c = context(); c.section.settings.image = ''; c.section.blocks.forEach((b) => b.settings.enabled = false); return c; },
    imageOnly: () => { const c = context(); c.section.blocks = []; return c; },
    noBadge: () => { const c = context(); Object.assign(c.section.settings, { badge_label: '', badge_text: '', badge_secondary: '' }); return c; },
    noBadgeIcon: () => { const c = context(); c.section.settings.badge_icon = 'none'; return c; },
    mobileOnlyImages: () => { const c = context(); c.section.settings.image_mobile = c.section.settings.image; c.section.settings.image = ''; c.section.settings.badge_image_mobile = fixture(); return c; },
    offsets: () => {
      const c = context();
      Object.assign(c.section.settings, { image_ratio: '16 / 9', image_ratio_mobile: '16 / 9', glow_blur: 100, glow_spread: 60, glow_size: 100, glow_x: 40, glow_y: 40 });
      for (const device of ['desktop', 'tablet', 'mobile']) {
        c.section.settings['image_x_' + device] = 60;
        c.section.settings['badge_x_' + device] = -60;
        c.section.settings['badge_y_' + device] = -80;
        c.section.blocks.forEach((b, i) => { b.settings['x_' + device] = i % 2 ? 60 : -60; b.settings['y_' + device] = 24; });
      }
      return c;
    },
  };
  let checked = 0;
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, scenario] of Object.entries(scenarios)) {
      await render(scenario());
      if (name !== 'empty') await checkLayout(`${name} at ${width}px`);
      if (name === 'empty') assert.equal(await page.locator('.brand-story').count(), 0);
      if (name === 'noBadge' || name === 'noImage') assert.equal(await page.locator('.brand-story__badge').count(), 0);
      if (name === 'noBadgeIcon') assert.equal(await page.locator('.brand-story__badge-icon').count(), 0);
      if (name === 'noImage' || name === 'empty') assert.equal(await page.locator('.brand-story__visual').count(), 0);
      if (name === 'noButton' || name === 'empty') assert.equal(await page.locator('.brand-story__button').count(), 0);
      if (name === 'empty') assert.equal(await page.locator('.brand-story__content, .brand-story__visual, .brand-story__block').count(), 0);
      if (name === 'default') {
        await page.locator('.brand-story__button').click();
        assert.equal(await page.evaluate(() => location.hash), '#shop');
      }
      checked++;
    }
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await render(context(), 'no-preference');
  await page.waitForFunction(() => document.querySelector('.brand-story').classList.contains('is-entered'));
  await page.waitForTimeout(1800);
  await checkLayout('animation complete');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.brand-story__heading').evaluate((el) => getComputedStyle(el.parentElement).animationName), 'none');
  const disabled = context(); disabled.section.settings.animate = false;
  await render(disabled, 'no-preference');
  assert.equal(await page.locator('cinematic-hero').evaluate((el) => el.classList.contains('is-animation-ready')), false);
  await render(context(), 'no-preference', false);
  assert.equal(await page.locator('.brand-story__heading').evaluate((el) => getComputedStyle(el.parentElement).opacity), '1');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await render(context());
    await page.screenshot({ path: path.join(os.tmpdir(), `brand-story-${width}.png`), fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log(`Passed ${checked} responsive scenarios, CTA clicks, empty rendering, animation, reduced motion, and no-JS visibility. Screenshots are in ${os.tmpdir()}.`);
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
