import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const dictionaries = Object.assign({}, ...fs.readdirSync(new URL('locales/', root)).sort().map(f => JSON.parse(read('locales/' + f))));
const baseline = JSON.parse(read('test/fixtures/native-catalogs.json'));
// Supplemental English contract: directory browser was not in the catalog extractor.
baseline['directory-browser'] = { en: {
  'browser.title': 'Choose working directory', 'browser.home': 'Home', 'browser.newFolder': 'New folder',
  'browser.folderName': 'Folder name', 'browser.createIn': 'New folder in “{name}”',
  'browser.untitledFolder': 'Untitled', 'browser.create': 'Create', 'browser.cancel': 'Cancel',
  'browser.open': 'Open', 'browser.editPath': 'Edit path', 'browser.loading': 'Loading…',
  'browser.truncated': 'Too many folders. Only the first part of the list is shown.', 'browser.showHidden': 'Show hidden files'
} };
const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
test('frozen English key and placeholder parity: 63 namespaces, 2901 keys', () => {
  assert.deepEqual(Object.keys(dictionaries).sort(), Object.keys(baseline).sort());
  let count = 0;
  for (const [ns, dict] of Object.entries(dictionaries)) {
    assert.deepEqual(Object.keys(dict).sort(), Object.keys(baseline[ns].en).sort(), ns);
    for (const [key, text] of Object.entries(dict)) {
      assert.equal(typeof text, 'string'); if (!text.trim()) assert.equal(baseline[ns].en[key].trim(), '', ns + ':' + key);
      assert.deepEqual(placeholders(text), placeholders(baseline[ns].en[key]), ns + ':' + key); count++;
    }
  }
  assert.equal(count, 2901);
});
function plugin() {
  let definition;
  vm.runInNewContext(read('lib/client.js'), { window: { __ModuleLoader__: { load(value) { definition = value; } } } });
  assert.equal(definition.id, 'dsh-russian-ui');
  const result = definition.factory(); assert.deepEqual(Array.from(result.inject), ['locale']); return result;
}
// Portable public-API contract double, NOT the installed LocaleRuntime.
function context(existing = [], failAt = '') {
  const state = { languages: [{ id: 'en' }, ...existing], dicts: new Map(), events: [], effects: [] };
  return { state, effect(fn) { state.effects.push(fn()); }, locale: {
    getLocale() { return { active: 'en', locales: state.languages }; },
    setLocale() { assert.fail('must not change user preference'); },
    register(ns, language, dictionary) {
      assert.equal(language, 'ru'); if (ns === failAt) throw new Error('conflict');
      assert.ok(!state.dicts.has(ns)); state.dicts.set(ns, dictionary); state.events.push(ns);
      return () => state.dicts.delete(ns);
    },
    addLanguage(language) {
      assert.equal(state.dicts.size, 63); assert.equal(language.fallback, 'en'); assert.equal(language.label, 'Русский');
      state.languages.push(language); state.events.push('language'); return () => state.languages.splice(state.languages.indexOf(language), 1);
    }
  } };
}
test('registers dictionaries before language; owned cleanup is repeatable and reloadable', () => {
  const ctx = context(); plugin().apply(ctx); assert.equal(ctx.state.events.at(-1), 'language');
  ctx.state.effects[0](); ctx.state.effects[0](); assert.equal(ctx.state.dicts.size, 0); assert.equal(ctx.state.languages.length, 1);
  plugin().apply(ctx); ctx.state.effects.at(-1)(); assert.equal(ctx.state.dicts.size, 0);
});
test('another Russian provider fails before effects or dictionary mutation', () => {
  const ctx = context([{ id: 'RU' }]); assert.throws(() => plugin().apply(ctx), /Disable another Russian language pack/);
  assert.equal(ctx.state.effects.length, 0); assert.equal(ctx.state.dicts.size, 0);
});
test('partial registration failure rolls back only owned dictionaries', () => {
  const ctx = context([], Object.keys(dictionaries)[3]); assert.throws(() => plugin().apply(ctx), /conflict/);
  assert.equal(ctx.state.dicts.size, 0); assert.equal(ctx.state.languages.length, 1); ctx.state.effects[0]();
});
test('build is deterministic and committed output is current', () => {
  execFileSync(process.execPath, ['build.mjs', '--check'], { cwd: root });
  const before = read('lib/client.js'); execFileSync(process.execPath, ['build.mjs'], { cwd: root }); assert.equal(read('lib/client.js'), before);
});
test('runtime has no adapters, private paths, IO or preference writes', () => {
  const source = read('lib/client.js') + read('lib/index.js') + read('build.mjs');
  assert.doesNotMatch(source, /whale|\/Users\/|\/tmp\/|node_modules|fetch\(|localStorage\s*[.\[]|setLocale\(/i);
  const pkg = JSON.parse(read('package.json')); assert.equal(pkg.version, '0.2.1'); assert.equal(pkg.name, 'dsh-russian-ui');
  assert.equal(pkg.dependencies, undefined); assert.equal(pkg.devDependencies, undefined);
  for (const hook of ['install', 'postinstall', 'preinstall', 'prepare']) assert.equal(pkg.scripts[hook], undefined);
});
