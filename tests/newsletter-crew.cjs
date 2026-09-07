// Local Liquid rendering checks only. No browser, network, or form submission.
// Requires the existing temporary liquidjs installation via NODE_PATH.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { Liquid } = require('liquidjs');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sections/newsletter-crew.liquid'), 'utf8');
const schema = JSON.parse(source.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
const defaults = Object.fromEntries(schema.settings.filter((s) => s.id).map((s) => [s.id, s.default ?? '']));
const engine = new Liquid({ root: path.join(root, 'snippets'), extname: '.liquid' });
let fixtureForm = {};
engine.registerTag('doc', { parse(token, tokens) { while (tokens.length && !tokens.shift().getText().includes('enddoc')) {} }, render() { return ''; } });
// The storefront uses Shopify's real form tag. This test substitutes only its
// wrapper so its field, state, and accessibility markup can be checked locally.
engine.registerTag('form', {
  parse(token, tokens) {
    this.templates = [];
    const stream = this.liquid.parser.parseStream(tokens)
      .on('tag:endform', () => stream.stop())
      .on('template', (template) => this.templates.push(template));
    stream.start();
  },
  *render(context) {
    context.push({ form: fixtureForm });
    const contents = yield this.liquid.renderer.renderTemplates(this.templates, context);
    context.pop();
    return '<form data-test-platform-wrapper>' + contents + '</form>';
  },
});
engine.registerFilter('asset_url', (name) => name);
engine.registerFilter('stylesheet_tag', () => '');
engine.registerFilter('t', (key) => ({ 'blocks.email_signup.label': 'Email address', 'blocks.contact_form.name': 'First name', 'blocks.email_signup.success': 'Thanks for subscribing.' }[key] ?? key));
engine.registerFilter('default_errors', () => '<ul><li>Email is invalid.</li></ul>');
async function render(settings = {}, form = {}, id = 'test-1') {
  fixtureForm = form;
  const html = await engine.parseAndRender(source.replace(/{% schema %}[\s\S]*?{% endschema %}/, ''), { section: { id, settings: { ...defaults, ...settings } }, form });
  return html.trim();
}
(async () => {
  for (const file of ['newsletter-crew', 'rewards-program']) {
    const text = fs.readFileSync(path.join(root, `sections/${file}.liquid`), 'utf8');
    const data = JSON.parse(text.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
    for (const settings of [data.settings, ...(data.blocks ?? []).map((block) => block.settings)]) {
      const ids = settings.filter((s) => s.id).map((s) => s.id);
      assert.equal(ids.length, new Set(ids).size, `${file}: duplicate setting IDs`);
      for (const setting of settings) {
        if (setting.type === 'select') assert(setting.options.some((o) => o.value === setting.default), setting.id);
        if (setting.type === 'range') {
          assert(setting.default >= setting.min && setting.default <= setting.max, setting.id);
          assert(Math.abs((setting.default - setting.min) / setting.step - Math.round((setting.default - setting.min) / setting.step)) < 0.001, setting.id);
        }
      }
    }
  }
  const rewardsSource = fs.readFileSync(path.join(root, 'sections/rewards-program.liquid'), 'utf8');
  const rewardsSchema = JSON.parse(rewardsSource.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
  const settingsFor = (settings) => Object.fromEntries(settings.filter((s) => s.id).map((s) => [s.id, s.default ?? '']));
  const cardDefaults = settingsFor(rewardsSchema.blocks.find((b) => b.type === 'card').settings);
  const rewardSettings = settingsFor(rewardsSchema.settings);
  async function rewards(count, overrides = {}) {
    return engine.parseAndRender(rewardsSource.replace(/{% schema %}[\s\S]*?{% endschema %}/, ''), {
      section: { settings: rewardSettings, blocks: Array.from({ length: count }, (_, i) => ({ type: 'card', settings: { ...cardDefaults, number: `Step ${i + 1}`, title: 'A reward', description: '<p>Details</p>', ...overrides } })) },
    });
  }
  for (const count of [1, 2, 3, 4, 6]) {
    const html = await rewards(count);
    assert.equal((html.match(/class="rewards__card-slot/g) ?? []).length, count);
    assert(html.includes(`Step ${count}`));
  }
  assert(!(await rewards(3, { number: '' })).includes('class="rewards__number'));
  assert(!(await rewards(3, { icon: 'none' })).includes('class="rewards__icon'));
  assert.equal((await rewards(3, { number: '', icon: 'none', title: '', description: '' })).trim(), '');
  assert.equal((await rewards(3, { enabled: false })).trim(), '');
  const initial = await render();
  assert(initial.includes('name="contact[email]" type="email"'));
  assert(initial.includes('name="contact[tags]" value="newsletter"'));
  assert(initial.includes('name="contact[id]" value="NewsletterCrew-test-1"'));
  assert(initial.includes('for="NewsletterCrew-test-1-email"'));
  assert(!initial.includes('role="status"'));
  assert(!initial.includes('role="alert"'));
  const nameInput = initial.match(/<input[^>]*name="contact\[first_name\]"[^>]*>/)[0];
  assert(!nameInput.includes('required'));
  assert((await render({ first_name_required: true })).match(/<input[^>]*name="contact\[first_name\]"[^>]*required/));
  assert(!(await render({ show_first_name: false })).includes('name="contact[first_name]"'));
  const reversed = await render({ field_order: 'email_first' });
  assert(reversed.indexOf('name="contact[email]"') < reversed.indexOf('name="contact[first_name]"'));
  assert(!(await render({ button_label: '' })).includes('<form'));
  assert(!(await render({ show_form: false })).includes('<form'));
  assert.equal(await render({ eyebrow: '', heading: '', description: '', show_form: false }), '');
  const success = await render({}, { 'posted_successfully?': true, id: '' });
  assert(success.includes('role="status"'));
  assert(success.includes(defaults.success_message));
  const errors = ['email']; errors.messages = { email: 'is invalid' };
  const error = await render({}, { errors, email: 'bad email', first_name: 'A & B', id: '' });
  assert(error.includes('role="alert"'));
  assert(error.includes('aria-invalid="true"'));
  assert(error.includes('value="bad email"'));
  assert(error.includes('value="A &amp; B"'));
  assert(!(await render({}, { errors, id: 'different-form' })).includes('role="alert"'));
  assert((await render({}, {}, 'second')).includes('NewsletterCrew-second-email'));
  assert(!(await render({ eyebrow: '', description: '', privacy: '' })).includes('newsletter-crew__copy--privacy'));
  console.log('Passed newsletter Liquid rendering, form states, field order, required fields, optional content, escaping, unique IDs, and newsletter/rewards schema checks.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
