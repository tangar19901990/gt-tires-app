"""
🔒 Top_Secret — Telegram Bot
GT Tires Service / Tir Parking

Бот для прийому замовлень з Telegram Mini App.
Замовлення надсилаються адміну в особисті.

ВСТАНОВЛЕННЯ:
  pip install python-telegram-bot --upgrade

НАЛАШТУВАННЯ:
  1. Встав свій BOT_TOKEN від @BotFather
  2. Встав свій ADMIN_CHAT_ID (дізнатись: написати @userinfobot)
  3. В BotFather: /mybots → твій бот → Bot Settings → Menu Button
     → встанови URL на свій GitHub Pages (де лежить gt-tires-miniapp.html)

ЗАПУСК:
  python gt_tires_bot.py
"""

import os
import json
import logging
from datetime import datetime
from telegram import Update, WebAppInfo, KeyboardButton, ReplyKeyboardMarkup, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes

# ============================================================
# ⚠️  НАЛАШТУВАННЯ
# ============================================================
BOT_TOKEN = os.getenv("BOT_TOKEN", "8849628930:AAGrxPC2I978TtPuzrPywgPx6XkCPp8bk4w")
ADMIN_CHAT_ID = int(os.getenv("ADMIN_CHAT_ID", "5881869536"))
MINIAPP_URL = "https://tangar19901990.github.io/gt-tires-app/gt-tires-miniapp.html"
# ============================================================

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Лічильник замовлень (за сесію)
order_counter = 0


def fmt_money(amount):
    """Форматує суму у гривнях."""
    return f"{amount:,.0f}₴".replace(",", " ")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start — привітання + кнопка Mini App."""
    keyboard = ReplyKeyboardMarkup(
        [[KeyboardButton("🔧 Замовити послугу", web_app=WebAppInfo(url=MINIAPP_URL))]],
        resize_keyboard=True
    )
    await update.message.reply_text(
        "🔒 *Top\\_Secret*\n"
        "━━━━━━━━━━━━━━━━\n"
        "🛞 GT Tires Service\n\n"
        "Натисни кнопку нижче щоб обрати послуги та оформити замовлення\\!\n\n"
        "📋 /price — Прайс\\-лист\n"
        "📍 /info — Контакти та адреса\n"
        "📞 /call — Зателефонувати",
        parse_mode="MarkdownV2",
        reply_markup=keyboard
    )


async def price_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /price — відкриває miniapp на вкладці прайсу."""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("📋 Відкрити прайс", web_app=WebAppInfo(url=MINIAPP_URL))]
    ])
    await update.message.reply_text(
        "💰 *Прайс\\-лист*\n\n"
        "Натисни кнопку щоб переглянути повний прайс \\(199 позицій\\)\\.",
        parse_mode="MarkdownV2",
        reply_markup=keyboard
    )


async def info_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /info — інформація про сервіс."""
    await update.message.reply_text(
        "🔒 *Top\\_Secret \\| GT Tires Service*\n"
        "━━━━━━━━━━━━━━━━\n\n"
        "📍 *Адреса:* Велика Димарка, вул\\. Соборна 106\n"
        "🅿️ *Tir Parking*\n\n"
        "🕐 *Графік:*\n"
        "Пн\\-Сб: 08:00 — 20:00\n"
        "Нд: 09:00 — 18:00\n\n"
        "📞 *Телефон:* \\+38 068 259 01 96\n"
        "💬 *Telegram:* @G\\_tires\n\n"
        "🛞 Шиномонтаж легкових, вантажних, сільгосп\\.\n"
        "🔧 Ремонт шин, балансування, рихтування дисків\\.",
        parse_mode="MarkdownV2"
    )


async def call_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /call — кнопка дзвінка."""
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("📞 Зателефонувати", url="tel:+380682590196")]
    ])
    await update.message.reply_text(
        "Натисни щоб зателефонувати:",
        reply_markup=keyboard
    )


async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обробка замовлення з Mini App."""
    global order_counter

    try:
        data = json.loads(update.effective_message.web_app_data.data)
    except (json.JSONDecodeError, AttributeError) as e:
        logger.error(f"Помилка парсингу даних: {e}")
        await update.message.reply_text("❌ Помилка обробки замовлення. Спробуйте ще раз.")
        return

    if data.get("type") != "order":
        return

    order_counter += 1
    items = data.get("items", [])
    total = data.get("total", 0)
    user = update.effective_user
    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    order_id = f"TS-{order_counter:04d}"

    # --- Повідомлення клієнту ---
    client_lines = [f"✅ *Замовлення {order_id} прийнято\\!*\n"]
    for item in items:
        name = item.get("n", item.get("name", "?"))
        qty = item.get("q", item.get("qty", 1))
        price = item.get("p", item.get("price", 0))
        # Escape markdown
        name_esc = name.replace(".", "\\.").replace("-", "\\-").replace("(", "\\(").replace(")", "\\)").replace("+", "\\+").replace("!", "\\!")
        client_lines.append(f"• {name_esc} ×{qty} — {fmt_money(price * qty)}")

    client_lines.append(f"\n💰 *Всього: {fmt_money(total)}*")
    client_lines.append(f"\nМи зв'яжемось з вами найближчим часом\\! 🔧")

    await update.message.reply_text(
        "\n".join(client_lines),
        parse_mode="MarkdownV2"
    )

    # --- Повідомлення адміну ---
    admin_lines = [
        f"🆕 НОВЕ ЗАМОВЛЕННЯ {order_id}",
        f"━━━━━━━━━━━━━━━━",
        f"📅 {now}",
        f"👤 {user.full_name}",
        f"🆔 @{user.username}" if user.username else f"🆔 ID: {user.id}",
        f"",
    ]
    for item in items:
        name = item.get("n", item.get("name", "?"))
        qty = item.get("q", item.get("qty", 1))
        price = item.get("p", item.get("price", 0))
        admin_lines.append(f"  {name} ×{qty} — {fmt_money(price * qty)}")

    admin_lines.append(f"")
    admin_lines.append(f"💰 ВСЬОГО: {fmt_money(total)}")

    # Кнопки для адміна
    admin_keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Прийняти", callback_data=f"accept_{order_id}_{user.id}"),
            InlineKeyboardButton("❌ Відхилити", callback_data=f"reject_{order_id}_{user.id}"),
        ],
        [
            InlineKeyboardButton(f"💬 Написати клієнту", url=f"tg://user?id={user.id}")
        ]
    ])

    await context.bot.send_message(
        chat_id=ADMIN_CHAT_ID,
        text="\n".join(admin_lines),
        reply_markup=admin_keyboard
    )

    logger.info(f"Замовлення {order_id} від {user.full_name} на {fmt_money(total)}")


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обробка натискань кнопок адміном."""
    query = update.callback_query
    await query.answer()

    data = query.data
    parts = data.split("_")

    if len(parts) < 3:
        return

    action = parts[0]
    order_id = parts[1]
    client_id = int(parts[2])

    if action == "accept":
        # Оновлюємо повідомлення адміна
        await query.edit_message_text(
            text=query.message.text + "\n\n✅ ПРИЙНЯТО",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton(f"💬 Написати клієнту", url=f"tg://user?id={client_id}")]
            ])
        )
        # Повідомляємо клієнта
        try:
            await context.bot.send_message(
                chat_id=client_id,
                text=f"✅ Ваше замовлення {order_id} прийнято!\n\n"
                     f"Чекаємо вас! 🔧\n"
                     f"📍 Велика Димарка, вул. Соборна 106"
            )
        except Exception as e:
            logger.error(f"Не вдалось надіслати клієнту: {e}")

    elif action == "reject":
        await query.edit_message_text(
            text=query.message.text + "\n\n❌ ВІДХИЛЕНО",
            reply_markup=None
        )
        try:
            await context.bot.send_message(
                chat_id=client_id,
                text=f"😔 На жаль, замовлення {order_id} не може бути виконано зараз.\n"
                     f"Зв'яжіться з нами для уточнення: +38 068 259 01 96"
            )
        except Exception as e:
            logger.error(f"Не вдалось надіслати клієнту: {e}")


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обробка звичайних текстових повідомлень."""
    text = update.message.text.lower()

    if any(w in text for w in ["прайс", "ціна", "скільки", "price", "вартість"]):
        await price_cmd(update, context)
    elif any(w in text for w in ["адреса", "де ви", "знайти", "карта", "location"]):
        await info_cmd(update, context)
    elif any(w in text for w in ["телефон", "зателефон", "дзвон", "call", "номер"]):
        await call_cmd(update, context)
    else:
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🔧 Замовити", web_app=WebAppInfo(url=MINIAPP_URL))],
            [InlineKeyboardButton("📋 Прайс", web_app=WebAppInfo(url=MINIAPP_URL))],
        ])
        await update.message.reply_text(
            "🛞 Оберіть що вас цікавить:",
            reply_markup=keyboard
        )


def main():
    """Запуск бота."""
    app = Application.builder().token(BOT_TOKEN).build()

    # Команди
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("price", price_cmd))
    app.add_handler(CommandHandler("info", info_cmd))
    app.add_handler(CommandHandler("call", call_cmd))

    # Web App дані (замовлення з miniapp)
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))

    # Кнопки (прийняти/відхилити)
    app.add_handler(CallbackQueryHandler(handle_callback))

    # Текстові повідомлення
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    logger.info("🔒 Top_Secret Bot запущено!")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
