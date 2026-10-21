import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const dictionaries = {};
for (const file of fs.readdirSync(path.join(root, 'locales')).filter(f => /^native-.*\.json$/.test(f)).sort()) {
  for (const [ns, dict] of Object.entries(JSON.parse(fs.readFileSync(path.join(root, 'locales', file), 'utf8')))) {
    if (Object.hasOwn(dictionaries, ns)) throw new Error('Duplicate namespace: ' + ns);
    if (!dict || Object.values(dict).some(value => typeof value !== 'string')) throw new Error('Invalid dictionary: ' + ns);
    dictionaries[ns] = dict;
  }
}
if (Object.keys(dictionaries).length !== 63 || Object.values(dictionaries).reduce((n, d) => n + Object.keys(d).length, 0) !== 2901) throw new Error('Unexpected dictionary coverage');
const body = `window.__ModuleLoader__.load({
  id: 'dsh-russian-ui',
  factory() {
    'use strict';
    const dictionaries = ${JSON.stringify(dictionaries)};
    return {
      name: 'dsh-russian-ui',
      inject: ['locale'],
      apply(ctx) {
        if (ctx.locale.getLocale().locales.some(language => language.id.toLowerCase() === 'ru')) {
          throw new Error('dsh-russian-ui: Russian is already provided. Disable another Russian language pack in Plugins before enabling this one. / Отключите другой русский языковой пакет в менеджере плагинов.');
        }
        const owned = [];
        const cleanup = () => { for (const dispose of owned.splice(0).reverse()) dispose(); };
        ctx.effect(() => cleanup, 'Russian UI: owned registrations');
        try {
          for (const [ns, dictionary] of Object.entries(dictionaries)) owned.push(ctx.locale.register(ns, 'ru', dictionary));
          owned.push(ctx.locale.addLanguage({ id: 'ru', label: 'Русский', fallback: 'en' }));
        } catch (error) {
          cleanup();
          throw error;
        }
      }
    };
  }
});
`;
const outputs = { 'index.js': '/** Client-only language pack; no host permissions or services. */\nexport function apply() {}\n', 'client.js': body };
if (process.argv.includes('--check')) {
  for (const [file, content] of Object.entries(outputs)) if (fs.readFileSync(path.join(root, 'lib', file), 'utf8') !== content) throw new Error('Stale build: ' + file);
} else {
  fs.mkdirSync(path.join(root, 'lib'), { recursive: true });
  for (const [file, content] of Object.entries(outputs)) fs.writeFileSync(path.join(root, 'lib', file), content);
}
console.log('63 namespaces; 2901 keys; deterministic build verified');
