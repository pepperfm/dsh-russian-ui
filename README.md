# dsh-russian-ui

Русский язык для встроенного интерфейса DeepSeek Harness. Версия **0.2.1**, 63 пространства имён, 2901 ключ. MIT, pepperfm. Нет runtime-зависимостей, сетевых запросов, доступа к учётным данным или записи настроек.

## Установка

**Desktop:** откройте менеджер **Plugins**, выберите установку npm-пакета и укажите `dsh-russian-ui`. Не используйте CLI для установки в Desktop.

**Web:**

```sh
dsh plugin --profile web add dsh-russian-ui
```

Альтернативы: [GitHub](https://github.com/pepperfm/dsh-russian-ui) / `github:pepperfm/dsh-russian-ui`, а также готовые npm-совместимые архивы `.tgz` в [GitHub Releases](https://github.com/pepperfm/dsh-russian-ui/releases). Страница пакета: [npm](https://www.npmjs.com/package/dsh-russian-ui).

После установки может потребоваться перезапуск DSH. Затем выберите **Settings → General → Language → Русский** (Настройки → Основные → Язык). Плагин сам не переключает язык и не записывает предпочтение. Сам DSH может восстановить уже выбранный русский язык или применить язык браузера после регистрации.

Проверенная совместимость: **только DSH 0.2.1-rc.2**. Другие версии не проверены. Перевод не охватывает системные меню ОС и интерфейсы сторонних плагинов. Недостающие строки используют английский fallback.

## Переход с объединённого локального 0.1.1

Сначала через менеджер Plugins отключите и удалите существующий русский locale provider: одновременно может работать только один пакет русского языка. Затем установите этот пакет. Для русского интерфейса китёнка установите также [dsh-whale-locale-ru](https://github.com/pepperfm/dsh-whale-locale-ru); он не входит в этот репозиторий и требует оригинальный Whale Widget 0.4.2. Не редактируйте профиль вручную. Сохранённый выбор языка остаётся под управлением DSH.

## Разработка и публикация

Нужен Node.js 22 или 24; установка зависимостей не требуется.

```sh
node build.mjs
node --test
node build.mjs --check
node --check lib/index.js
node --check lib/client.js
npm pack --dry-run
```

Сборка воспроизводима и не требует сторонних библиотек: читает только `locales/native-*.json`, создаёт host noop и клиентский модуль. Готовый `lib` хранится в git, чтобы GitHub-установка не требовала lifecycle install-скриптов. После изменения словарей пересоберите и включите `lib` в изменения. CI проверяет Node 22/24.

Релизы распространяются через npm и GitHub Releases. `prepack` запускает сборку и тесты; install/prepare-скриптов нет. Tarball содержит только `lib`, native-словари, manifest, README и лицензии/уведомления плюс обязательный package.json; исходник сборки, тесты и CI не публикуются. CI сам не публикует пакеты: выпуск выполняется отдельно после проверок.

Тесты проверяют ключи и placeholders по замороженному английскому каталогу DSH (2888 ключей) и отдельному контракту directory-browser (13 ключей). Проверки lifecycle используют **portable mock публичного API**, а не реальный установленный LocaleRuntime; это не end-to-end проверка Desktop/Web. Нет зависимости от установленного приложения или пользовательских каталогов.

## English

Standalone Russian locale pack for native DSH UI, tested only against 0.2.1-rc.2. In Desktop, install npm package `dsh-russian-ui` through Plugins; for Web use the command above. GitHub source and release archives are alternative installation methods. Restart if needed, then select General → Language → Русский. Disable any other Russian provider first. No OS-menu or third-party UI translation; no automatic locale selection or preference writes by this plugin. For Whale Widget translation/layout, install [dsh-whale-locale-ru](https://github.com/pepperfm/dsh-whale-locale-ru) separately; the original Whale Widget 0.4.2 is still required.
