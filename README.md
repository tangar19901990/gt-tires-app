# GT Tires CRM

Однофайлова веб-CRM для шиномонтажу **GT Tires** (Велика Димерка, вул. Соборна 106).
Vanilla JS + Supabase, без збірки та фреймворків. Деплой — GitHub Pages.

- Репозиторій: `tangar19901990/gt-tires-app`
- Прод: https://tangar19901990.github.io/gt-tires-app
- Дані: `localStorage` (offline-first) + синхронізація з Supabase

---

## Структура файлів

```
gt-tires-v4-supabase-ready.html   ← адмін-панель, підключає styles.css і app.js
gt-tires-miniapp.html             ← Telegram Mini App для клієнтів
index.html                        ← стартова сторінка з посиланнями на обидва
styles.css                        ← усі стилі
app.js                            ← уся логіка (vanilla JS, 1 файл)
print.js                          ← друк рахунку/наряду
gt_tires_bot.py                   ← Telegram-бот (Python), відкриває miniapp
reference-prices/                 ← прайси у текстовому/CSV вигляді для довідки (не підключені в код)
backup/                           ← резервні копії робочих версій
tests/smoke-test.js               ← смок-тест критичної логіки (jsdom)
PROJECT_STRUCTURE.md              ← карта модулів усередині app.js
README.md
CONTEXT.md                        ← правила проєкту (для себе / для AI)
ONBOARDING.md                     ← підключення нового клієнта (окрема копія)
```

Усі файли лежать пласко в корені репозиторію (без папок `css/`/`js/`) —
шляхи в HTML відносні до кореня.

---

## Запуск локально

`app.js` звертається до Supabase і шрифтів через мережу, тому відкривати
через `file://` ненадійно. Піднімай простий статичний сервер з папки проєкту:

```bash
# Python (є майже всюди)
python3 -m http.server 8000
# відкрити: http://localhost:8000/gt-tires-v4-supabase-ready.html
```

Альтернатива, якщо є Node:

```bash
npx serve .
```

---

## Деплой на GitHub Pages

1. Заливаєш у репо **разом із папками** `css/` і `js/` (шляхи відносні).
2. Settings → Pages → гілка `main`, корінь `/`.
3. Через ~1 хв доступно за прод-адресою.

> Важливо: структуру папок `css/` та `js/` зберігати. Якщо їх не залити —
> сторінка відкриється без стилів і без логіки.

---

## Резервні копії

Перед будь-якою зміною роби копію робочого файлу в `backup/` з датою:

```
backup/gt-tires-v4-supabase-ready_РРРР-ММ-ДД.html
```

Дивись найновіший файл у `backup/` за датою в назві — це остання точка відкату.

---

## Перевірка після правок

```bash
node --check app.js                                         # синтаксис JS
grep -c 'styles.css' gt-tires-v4-supabase-ready.html         # = 1
grep -c 'app.js'      gt-tires-v4-supabase-ready.html        # = 1
cd tests && npm install && node smoke-test.js                # бізнес-логіка
```

Детальні правила розробки — у `CONTEXT.md`.
