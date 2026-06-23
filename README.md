# GT Tires Service — цифрова система

CRM, Telegram Mini App і бот для шиномонтажу **GT Tires** (Велика Димерка).

---

## 📂 Структура проєкту

```
gt-tires-app/
├─ gt-tires-v4-supabase-ready.html   ← ГОЛОВНА CRM (один файл, з AI Tools)
├─ gt-tires-miniapp.html             ← Telegram Mini App (прайси, черга)
├─ gt-tires-qr.html                  ← QR-сторінка
├─ index.html                        ← стартова сторінка (лінки на CRM і Mini App)
├─ gt_tires_bot.py                   ← Telegram-бот (aiogram)
├─ requirements.txt                  ← залежності бота
├─ .gitignore
│
├─ assets/
│  └─ prices/                        ← прайси (txt, csv) — довідкові дані
├─ supabase/
│  └─ schema.sql                     ← опис таблиць Supabase
├─ docs/
│  └─ TEST_CHECKLIST.md              ← чек-лист перевірки
└─ archive/
   └─ old_files/                     ← старі версії (НЕ видалені, лежать тут)
```

> CRM навмисно лишається **одним файлом** — так його зручно заливати з телефона
> й оновлювати через `?v=НОМЕР`. Стилі та скрипти вшиті всередині.

---

## 🚀 Запуск

### CRM
Відкрий `gt-tires-v4-supabase-ready.html` у браузері (локально або через GitHub Pages):
```
https://tangar19901990.github.io/gt-tires-app/gt-tires-v4-supabase-ready.html?v=18
```
Після кожного оновлення файлу збільшуй `?v=` (скидає кеш браузера).

### Telegram-бот
```
pip install -r requirements.txt
python gt_tires_bot.py
```

---

## 🗄 Supabase

- Проєкт: `lxeswqlkereptdtwytbp` (eu-west-1).
- Таблиці описані в `supabase/schema.sql`.
- **Edge Functions:**
  - `ai-evaluate-tire` — AI-оцінка шини по тексту (OpenAI).
  - `ai-scan-tire` — AI-аналіз шини по фото (OpenAI Vision).
- **Секрети:** `OPENAI_API_KEY` зберігається у Supabase → Edge Functions → Secrets.
  У коді/файлах ключа OpenAI немає.
- **Захист функцій:** приймають лише запити із заголовком `x-app-key`
  і з домену сайту; інакше — 403.

> ⚠️ `anon key` Supabase публічний за задумом — захист даних забезпечує RLS
> (див. `schema.sql`). Не покладайся на «приховування» ключа.

---

## 🧪 Тестування
Перед і після змін проходь `docs/TEST_CHECKLIST.md`.
Правило: **краще нічого не видаляти, ніж зламати робочий функціонал.**
Усе зайве не видаляється, а переноситься в `archive/old_files/`.

---

## 🧩 Модулі CRM
Заказ-наряди (+редагування), клієнти, склад, каса/фінанси, прайс-калькулятор,
друк заказ-наряду, Top Secret, **Шини AI** (калькулятор/склад Б/У/ринок/AI-оцінка),
**🧠 AI Tools** (оцінка Б/У, помічник торгу, аналітика, пошук, голос, фото-сканер).
