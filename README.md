# 🔒 Top_Secret — GT Tires Service

> Авторська система управління шиномонтажним бізнесом
> Designed by Top_Secret (Ne_tot_brat)

## 📦 Файли проєкту

| Файл | Опис |
|------|------|
| `index.html` | Головна сторінка (для GitHub Pages) |
| `gt-tires-v4.html` | Адмін-панель (9 модулів, 199 послуг) |
| `gt-tires-miniapp.html` | Telegram Mini App для клієнтів |
| `gt_tires_bot.py` | Python бот для прийому замовлень |
| `requirements.txt` | Залежності для Python бота |

---

## 🚀 Заливка на GitHub

### Крок 1: Залий файли в репозиторій
1. Відкрий https://github.com/tangar19901990/gt-tires-app
2. Натисни **"Add file" → "Upload files"**
3. Перетягни всі файли
4. Внизу натисни **"Commit changes"**

### Крок 2: Увімкни GitHub Pages
1. У репозиторії → **Settings** (вгорі)
2. Зліва → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main**, папка: **/ (root)**
5. **Save**

Через 2-3 хвилини сайт буде доступний:
- 🏠 Головна: `https://tangar19901990.github.io/gt-tires-app/`
- 🔧 Адмінка: `https://tangar19901990.github.io/gt-tires-app/gt-tires-v4.html`
- 📱 Mini App: `https://tangar19901990.github.io/gt-tires-app/gt-tires-miniapp.html`

---

## 🤖 Налаштування Telegram бота

### 1. Створити бота
- @BotFather у Telegram
- `/newbot` → дай назву
- Отримай токен типу `1234567890:ABCdef...`

### 2. Дізнатись свій chat_id
- Напиши боту @userinfobot
- Він відповість твоїм ID (число)

### 3. Підключити Mini App до бота
- @BotFather → `/mybots` → твій бот
- **Bot Settings → Menu Button**
- URL: `https://tangar19901990.github.io/gt-tires-app/gt-tires-miniapp.html`

### 4. Налаштувати бота
У файлі `gt_tires_bot.py` заміни:
```python
BOT_TOKEN = "ТВІЙ_ТОКЕН"
ADMIN_CHAT_ID = 123456789  # Твій ID
```

### 5. Запустити бота (Windows)
```cmd
pip install python-telegram-bot
python gt_tires_bot.py
```

---

## ⚙️ Що замінити перед запуском

- `+380XXXXXXXXX` → реальний телефон
- `@top_secret_tires` → реальний Telegram username

---

## 🆘 Якщо щось не працює

**Браузер показує стару версію:**
- Очисти кеш або відкрий в інкогніто

**Бот не відповідає:**
- Перевір токен і chat_id

---

© 2025 Top_Secret • Велика Димерка
