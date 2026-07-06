# GT Tires CRM

Однофайлова веб-CRM для шиномонтажу **GT Tires** (Велика Димерка, вул. Соборна 106).
Vanilla JS + Supabase, без збірки та фреймворків. Деплой — GitHub Pages.

- Репозиторій: `tangar19901990/gt-tires-app`
- Прод: https://tangar19901990.github.io/gt-tires-app
- Дані: `localStorage` (offline-first) + синхронізація з Supabase

---

## Структура файлів

```
gt-tires-v4-supabase-ready.html   ← розмітка, підключає css/ і js/
css/styles.css                    ← усі стилі
js/app.js                         ← уся логіка (vanilla JS, 1 файл)
backup/                           ← резервні копії робочих версій
docs/PROJECT_STRUCTURE.md         ← карта модулів усередині app.js
README.md
CONTEXT.md                        ← правила проєкту (для себе / для AI)
```

До розділення це був один HTML-файл (~776 КБ). CSS і JS винесено окремо
**без зміни логіки** — браузер отримує байт-у-байт той самий код.

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

Поточний backup: `backup/gt-tires-v4-supabase-ready_2026-06-30.html`
(односторінкова продакшн-версія — точка відкату).

---

## Перевірка після правок

```bash
node --check js/app.js     # синтаксис JS
grep -c 'css/styles.css' gt-tires-v4-supabase-ready.html   # = 1
grep -c 'js/app.js'      gt-tires-v4-supabase-ready.html    # = 1
```

Детальні правила розробки — у `CONTEXT.md`.
