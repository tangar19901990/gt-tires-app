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

## Примітка про pgcrypto

Живе у схемі `extensions`, тому функції мають
`set search_path = public, extensions`. Без цього `gen_salt` не знаходиться.
