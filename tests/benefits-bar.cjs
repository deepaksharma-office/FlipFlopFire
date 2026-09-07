// Requires playwright and liquidjs, installed outside the theme (see docs/benefits-bar.md).
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { Liquid } = require('liquidjs');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sections/benefits-bar.liquid'), 'utf8');
const schema = JSON.parse(source.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
const template = source.replace(/{% schema %}[\s\S]*?{% endschema %}/, '');
const defaults = (settings) => Object.fromEntries(settings.filter((s) => s.id).map((s) => [s.id, s.default ?? '']));
const fixture = { alt: 'Custom benefit icon', url: 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32"><rect width="48" height="32" fill="#ff1675"/></svg>').toString('base64') };
const liquid = new Liquid({ root: path.join(root, 'snippets'), extname: '.liquid' });
liquid.registerTag('doc', { parse(token, tokens) { while (tokens.length && !tokens.shift().getText().includes('enddoc')) {} }, render() { return ''; } });
liquid.registerFilter('asset_url', (name) => name);
liquid.registerFilter('stylesheet_tag', () => '');
liquid.registerFilter('image_url', (image) => image.url);
liquid.registerFilter('image_tag', (url) => `<img src="${url}" width="48" height="32" alt="">`);
function context(count = 4, mode = 'slide') {
  return { section: { settings: { ...defaults(schema.settings), mobile_layout: mode }, blocks: Array.from({ length: count }, (_, i) => ({
    type: 'benefit', shopify_attributes: `data-test-index="${i}"`, settings: { ...defaults(schema.blocks[0].settings), ...schema.presets[0].blocks[i % 4].settings },
  })) } };
}
const cases = Object.fromEntries([1, 2, 3, 4, 6, 12].map((n) => [`${n} blocks`, (mode) => context(n, mode)]));
Object.assign(cases, {
  long: (mode) => { const c = context(4, mode); c.section.blocks[0].settings.text = 'Durable comfort wherever the next shift takes you. '.repeat(12); c.section.blocks[1].settings.text = 'UnbrokenText'.repeat(25); return c; },
  noIcon: (mode) => { const c = context(4, mode); c.section.blocks.forEach((b) => b.settings.icon = 'none'); return c; },
  missingImage: (mode) => { const c = context(4, mode); c.section.blocks.forEach((b) => b.settings.icon_source = 'image'); return c; },
  noText: (mode) => { const c = context(4, mode); c.section.blocks.forEach((b) => b.settings.text = ''); return c; },
  mobileImage: (mode) => { const c = context(4, mode); c.section.blocks.forEach((b) => { b.settings.mobile_custom = true; b.settings.image_mobile = fixture; }); return c; },
  desktopImage: (mode) => { const c = context(4, mode); c.section.blocks.forEach((b) => { b.settings.icon_source = 'image'; b.settings.image = fixture; }); return c; },
  customFallback: (mode) => { const c = context(4, mode); c.section.blocks.forEach((b) => { b.settings.icon = 'none'; b.settings.image = fixture; }); return c; },
  mobileOnly: (mode) => { const c = context(1, mode); Object.assign(c.section.blocks[0].settings, { text: '', icon: 'none', mobile_custom: true, image_mobile: fixture }); return c; },
  empty: (mode) => { const c = context(4, mode); c.section.blocks.forEach((b) => { b.settings.icon = 'none'; b.settings.text = ''; }); return c; },
  noBlocks: (mode) => context(0, mode),
  reordered: (mode) => { const c = context(4, mode); c.section.blocks.reverse(); return c; },
});

(async () => {
  const browser = await chromium.launch({ headless: true });
  // The section and native scrolling must work with storefront JavaScript disabled.
  const page = await browser.newPage({ javaScriptEnabled: false });
  const css = fs.readFileSync(path.join(root, 'assets/base.css'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'assets/benefits-bar.css'), 'utf8');
  async function render(data, width) {
    await page.setViewportSize({ width, height: 900 });
    const html = await liquid.parseAndRender(template, data);
    assert(!/data-theme-slider|data-splide|<script/.test(html));
    await page.setContent(`<!doctype html><html><head><style>${css}\n:root{--font-body--family:Arial,sans-serif}body{margin:0}</style></head><body>${html}</body></html>`);
  }
  let checks = 0;
  for (const width of [1920, 1728, 1440, 1280, 1024, 768, 480, 430, 390, 375, 320]) {
    for (const mode of ['stack', 'slide']) {
      for (const [name, scenario] of Object.entries(cases)) {
        await render(scenario(mode), width);
        if (['empty', 'noBlocks'].includes(name)) {
          assert.equal(await page.locator('.benefits-bar').count(), 0);
          checks++;
          continue;
        }
        const result = await page.evaluate(() => {
          const bar = document.querySelector('.benefits-bar');
          const list = bar.querySelector('ul');
          const style = getComputedStyle(list);
          const items = [...list.children].filter((el) => getComputedStyle(el).display !== 'none');
          const problems = [];
          if (document.documentElement.scrollWidth > innerWidth) problems.push('page overflow');
          for (const el of items) {
            if (el.scrollWidth > el.clientWidth + 1) problems.push('item text overflow');
            if (el.scrollHeight > el.clientHeight + 1) problems.push('clipped item');
          }
          return { problems, snap: style.scrollSnapType, overflow: style.overflowX, hidden: getComputedStyle(bar).display === 'none', text: items.map((el) => el.querySelector('p')?.textContent), visibleIcons: [...bar.querySelectorAll('.benefits-bar__icon')].filter((el) => getComputedStyle(el).display !== 'none').map((el) => el.firstElementChild.tagName.toLowerCase()) };
        });
        assert.deepEqual(result.problems, [], `${name}, ${mode}, ${width}`);
        if (name === 'mobileOnly' && width >= 750) assert(result.hidden);
        if (mode === 'slide' && width < 750) { assert.equal(result.snap, 'x mandatory'); assert.equal(result.overflow, 'auto'); }
        if (mode === 'stack' || width >= 750) assert.equal(result.snap, 'none');
        if (name === 'noIcon') assert.deepEqual(result.visibleIcons, []);
        if (name === 'missingImage') assert(result.visibleIcons.every((tag) => tag === 'svg'), JSON.stringify({ name, width, mode, result }));
        if (name === 'mobileImage') assert(result.visibleIcons.every((tag) => tag === (width < 750 ? 'img' : 'svg')));
        if (['desktopImage', 'customFallback'].includes(name)) assert(result.visibleIcons.every((tag) => tag === 'img'));
        if (name === 'noText') assert.equal(await page.locator('.benefits-bar__text').count(), 0);
        if (name === 'reordered') assert.equal(result.text[0], schema.presets[0].blocks[3].settings.text);
        checks++;
      }
    }
  }
  await render(context(), 390);
  const list = page.locator('.benefits-bar__list');
  await list.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(800);
  assert(await list.evaluate((el) => el.scrollLeft) > 0, 'Native keyboard scrolling');
  await list.evaluate((el) => el.scrollTo({ left: el.scrollWidth, behavior: 'instant' }));
  await page.waitForTimeout(100);
  assert(await list.evaluate((el) => Math.abs(el.scrollLeft + el.clientWidth - el.scrollWidth) <= 2), 'Last benefit reachable');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await list.evaluate((el) => getComputedStyle(el).scrollBehavior), 'auto');
  await render(context(1), 390);
  assert(await list.evaluate((el) => el.scrollWidth <= el.clientWidth), 'Single item does not scroll');
  for (const [width, mode] of [[1440, 'slide'], [390, 'stack'], [390, 'slide']]) {
    await render(context(4, mode), width);
    await page.screenshot({ path: path.join(os.tmpdir(), `benefits-bar-${width}-${mode}.png`), fullPage: true });
  }
  console.log(`Passed ${checks} layout scenarios with JavaScript disabled, native keyboard scrolling, last-item reachability, and reduced motion.`);
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
