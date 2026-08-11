# SQL — база SaaS-частини

Міграції **вже застосовані** до проєкту `lxeswqlkereptdtwytbp` (gt-tires)
через Supabase-конектор. Запускати руками нічого не треба.

Історія міграцій видима у Supabase → Database → Migrations:
- `saas_leads_payments_admin_config`
- `licenses_add_saas_columns`
- `admin_rpc_functions`
- `admin_password_fix_search_path`

## Таблиці

**leads** — заявки зі сторінки тарифів
`shop_name, city, phone, telegram, plan_id, note, status (new/contacted/done/rejected)`

**licenses** — доступ клієнтів (існувала раніше, додано колонок)
`client_slug, business_name, paid_until, is_active` + `city, phone, telegram, plan_id, price, is_trial, lead_id`

**saas_payments** — історія оплат за підписку
Названа так, щоб не плутати з `v4_payments` (оплати клієнтів у CRM).

**admin_config** — пароль адмінки, зберігається хешем bcrypt

## Хто що може (RLS)

| Таблиця | anon |
|---|---|
| leads | тільки INSERT |
| licenses | тільки SELECT |
| saas_payments | нічого |
| admin_config | нічого |

## Функції адмінки

Усі приймають пароль першим аргументом.

- `admin_leads(token)` — список заявок
- `admin_licenses(token)` — список ліцензій
- `admin_grant(token, slug, days, lead_id, trial, plan, price, business_name)` — підключити або продовжити
- `admin_toggle(token, slug, active)` — увімкнути/вимкнути доступ
- `admin_lead_status(token, id, status, note)` — позначити заявку

`admin_check` — внутрішня, аноніму відкликана.

`admin_grant` продовжує від чинної дати, якщо вона ще не минула,
інакше від сьогодні. Заявка закривається автоматично.

## Змінити пароль

Supabase → SQL Editor:
```sql
select public.admin_set_password('новий_пароль');
```

Працює лише з SQL Editor (роль `postgres`). З сайту викликати не можна — навмисно.

## Примітка про pgcrypto

Живе у схемі `extensions`, тому функції мають
`set search_path = public, extensions`. Без цього `gen_salt` не знаходиться.

---

## Сповіщення в Telegram

Працюють на стороні бази — окремий сервер не потрібен.

**Нова заявка** → тригер `trg_notify_new_lead` на `leads` шле повідомлення.

**Підписка спливає** → `pg_cron` щодня о 09:00 (Київ) викликає
`check_expiring_licenses()`. Пише за 7, 3, 1 день і в день закінчення.
Повторів немає — надіслане позначається в `admin_config`
(`notified:<slug>:<дата>`, чиститься через 60 днів).

### Головне

Відправка загорнута в `exception when others then null`.
**Збій Telegram не заважає прийняти заявку** — клієнт її подасть у будь-якому разі,
просто ти не отримаєш сповіщення. Перевірено на живому.

### Налаштування

Токен бота і chat_id лежать у `admin_config` — серверна таблиця, аноніму закрита.
У коді сайту їх немає.

```sql
select public.admin_set_telegram('токен_бота', 'chat_id');
```

Викликається лише з SQL Editor.

### Перевірка

```sql
select public.tg_send('перевірка');           -- має прийти повідомлення
select public.check_expiring_licenses();       -- 'Нагадувань: N'
select jobname, schedule, active from cron.job;
```

### Розклад

`0 6 * * *` — це 06:00 UTC. Влітку в Києві 09:00, узимку 08:00.
Змінити:
```sql
select cron.unschedule('check-expiring-licenses');
select cron.schedule('check-expiring-licenses','0 7 * * *',
  $$ select public.check_expiring_licenses(); $$);
```

---

## Права на дані CRM (11.08.2026)

### Що було не так

Політики на `v4_*` були `FOR ALL TO anon, authenticated USING (true)`.
`anon`-ключ лежить у відкритому HTML — отже **будь-хто, хто зазирнув
у вихідний код сторінки, міг читати, змінювати і видаляти**
замовлення, клієнтів і касу. Без входу.

Те саме з `mini_app_bookings`: `anon` читав і редагував усі заявки,
тобто імена, телефони й авто клієнтів були відкриті.

### Як зараз

| Таблиця | anon | authenticated |
|---|---|---|
| `v4_*` (замовлення, клієнти, каса, склад) | ✗ нічого | повний доступ |
| `mini_app_bookings` | тільки INSERT | читання + закриття |
| `licenses` | тільки SELECT | — |
| `leads` | тільки INSERT | — |

CRM і так вимагала входу перед синхронізацією (`if(!_session) return`),
тож для роботи нічого не змінилось.

Перевірено від імені `anon`: бачить 0 рядків, видалити не може.
Заявку з MiniApp додати може — це й потрібно.

Знімок попередніх прав: таблиця `_policy_backup_20260811`.

### ⚠️ Що лишилось відкритим

`app_prices` і `gt_queue` — політика `ALL` для `public`.
Їх пише **адмінка всередині MiniApp**, яка працює без входу.
Закрити зараз означало б зламати редагування прайсу з телефона.

Ризик обмежений: прайс відновлюється синхронізацією з CRM,
`gt_queue` — це один прапорець «відчинено/зачинено».
Але поки що будь-хто з ключем може їх переписати.

Правильне рішення — перевести адмінку MiniApp на вхід
(`supabase.auth`), як у CRM. Окрема задача.

### Для проєктів клієнтів

У кожного клієнта **свій** проєкт Supabase зі своїми політиками.
Ті самі дірки там теж є. При підключенні нового клієнта треба
застосувати ці ж міграції до його бази.
