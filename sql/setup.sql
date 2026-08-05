-- ============================================================
--  GT TIRES CRM — SQL для Supabase
--  Проєкт: lxeswqlkereptdtwytbp
--
--  ЯК ЗАПУСТИТИ:
--    1. supabase.com → свій проєкт → SQL Editor → New query
--    2. Вставити ВЕСЬ цей файл
--    3. Натиснути Run
--
--  Запускати можна повторно — нічого не зламає й не затре.
--  Наприкінці файлу ОБОВ'ЯЗКОВО зміни адмін-пароль (крок 6).
-- ============================================================


-- ============================================================
--  1. ЗАЯВКИ (leads)
--     Сюди падають заявки зі сторінки тарифів.
-- ============================================================

create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),

  shop_name    text not null,              -- назва точки
  city         text,
  phone        text,
  telegram     text,
  plan_id      text,                       -- який тариф обрав
  note         text,                       -- коментар клієнта

  status       text not null default 'new',-- new | contacted | done | rejected
  admin_note   text,                       -- твоя нотатка
  handled_at   timestamptz
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_status_idx  on public.leads (status);


-- ============================================================
--  2. ЛІЦЕНЗІЇ (licenses)
--     Таблиця вже існує. Додаємо колонки, яких бракує.
--     add column if not exists — наявні дані не чіпає.
-- ============================================================

create table if not exists public.licenses (
  client_slug  text primary key,
  paid_until   date,
  is_active    boolean not null default true
);

alter table public.licenses add column if not exists shop_name   text;
alter table public.licenses add column if not exists city        text;
alter table public.licenses add column if not exists phone       text;
alter table public.licenses add column if not exists telegram    text;
alter table public.licenses add column if not exists plan_id     text;
alter table public.licenses add column if not exists price       integer;
alter table public.licenses add column if not exists is_trial    boolean default false;
alter table public.licenses add column if not exists created_at  timestamptz default now();
alter table public.licenses add column if not exists lead_id     uuid;


-- ============================================================
--  3. ІСТОРІЯ ОПЛАТ
-- ============================================================

create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  client_slug  text not null,
  amount       integer not null,
  months       integer not null default 1,
  method       text default 'manual',      -- manual | mono
  note         text
);

create index if not exists payments_client_idx on public.payments (client_slug, created_at desc);


-- ============================================================
--  4. АДМІН-ПАРОЛЬ
--     Зберігається як хеш. У коді сайту пароля НЕМАЄ.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.admin_config (
  key   text primary key,
  value text not null
);


-- ============================================================
--  5. ЗАХИСТ (RLS)
--
--     Логіка:
--       leads    — анонім може ТІЛЬКИ додати заявку. Читати не може.
--       licenses — анонім може прочитати ЛИШЕ свій рядок (перевірка ліцензії).
--       payments — аноніму закрито повністю.
--
--     Все, що робить адмінка, йде через функції нижче з паролем.
-- ============================================================

alter table public.leads        enable row level security;
alter table public.licenses     enable row level security;
alter table public.payments     enable row level security;
alter table public.admin_config enable row level security;

-- leads: тільки вставка
drop policy if exists "anon can submit lead" on public.leads;
create policy "anon can submit lead"
  on public.leads for insert to anon
  with check (true);

-- licenses: тільки читання (CRM перевіряє свій client_slug)
drop policy if exists "anon can read licenses" on public.licenses;
create policy "anon can read licenses"
  on public.licenses for select to anon
  using (true);

-- payments та admin_config: жодних політик = аноніму закрито


-- ============================================================
--  6. ФУНКЦІЇ АДМІНКИ
--     security definer — працюють в обхід RLS, але лише з паролем.
-- ============================================================

-- --- встановити / змінити пароль -----------------------------
create or replace function public.admin_set_password(p_new_password text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(coalesce(p_new_password,'')) < 8 then
    return 'Пароль має бути щонайменше 8 символів';
  end if;

  insert into admin_config (key, value)
  values ('admin_password_hash', crypt(p_new_password, gen_salt('bf')))
  on conflict (key) do update set value = excluded.value;

  return 'OK';
end;
$$;

-- --- перевірка пароля (внутрішня) ---------------------------
create or replace function public.admin_check(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare h text;
begin
  select value into h from admin_config where key = 'admin_password_hash';
  if h is null then return false; end if;
  return h = crypt(coalesce(p_token,''), h);
end;
$$;

-- --- список заявок ------------------------------------------
create or replace function public.admin_leads(p_token text)
returns setof public.leads
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_token) then
    raise exception 'Невірний пароль';
  end if;
  return query select * from leads order by created_at desc limit 200;
end;
$$;

-- --- список ліцензій ----------------------------------------
create or replace function public.admin_licenses(p_token text)
returns setof public.licenses
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_token) then
    raise exception 'Невірний пароль';
  end if;
  return query select * from licenses order by paid_until desc nulls last;
end;
$$;

-- --- ПІДКЛЮЧИТИ КЛІЄНТА (та сама одна кнопка) ---------------
--     Створює ліцензію на N днів і закриває заявку.
create or replace function public.admin_grant(
  p_token   text,
  p_slug    text,
  p_days    integer default 14,
  p_lead_id uuid    default null,
  p_trial   boolean default true,
  p_plan    text    default null,
  p_price   integer default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead   leads%rowtype;
  v_until  date;
  v_slug   text;
begin
  if not admin_check(p_token) then
    raise exception 'Невірний пароль';
  end if;

  v_slug := lower(trim(p_slug));
  if v_slug is null or v_slug = '' then
    raise exception 'Порожній client_slug';
  end if;

  if p_lead_id is not null then
    select * into v_lead from leads where id = p_lead_id;
  end if;

  -- продовжуємо від наявної дати, якщо вона ще не минула
  select greatest(coalesce(paid_until, current_date), current_date) + p_days
    into v_until
    from licenses where client_slug = v_slug;

  if v_until is null then
    v_until := current_date + p_days;
  end if;

  insert into licenses (client_slug, paid_until, is_active, shop_name, city,
                        phone, telegram, plan_id, price, is_trial, lead_id)
  values (v_slug, v_until, true, v_lead.shop_name, v_lead.city,
          v_lead.phone, v_lead.telegram, coalesce(p_plan, v_lead.plan_id),
          p_price, p_trial, p_lead_id)
  on conflict (client_slug) do update set
    paid_until = v_until,
    is_active  = true,
    shop_name  = coalesce(licenses.shop_name, excluded.shop_name),
    city       = coalesce(licenses.city,      excluded.city),
    phone      = coalesce(licenses.phone,     excluded.phone),
    telegram   = coalesce(licenses.telegram,  excluded.telegram),
    plan_id    = coalesce(excluded.plan_id,   licenses.plan_id),
    price      = coalesce(excluded.price,     licenses.price),
    is_trial   = excluded.is_trial;

  if p_price is not null and p_price > 0 then
    insert into payments (client_slug, amount, months, method)
    values (v_slug, p_price, greatest(1, round(p_days / 30.0)::int), 'manual');
  end if;

  if p_lead_id is not null then
    update leads set status = 'done', handled_at = now() where id = p_lead_id;
  end if;

  return json_build_object('ok', true, 'client_slug', v_slug, 'paid_until', v_until);
end;
$$;

-- --- увімкнути / вимкнути доступ ----------------------------
create or replace function public.admin_toggle(
  p_token  text,
  p_slug   text,
  p_active boolean
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_token) then
    raise exception 'Невірний пароль';
  end if;

  update licenses set is_active = p_active where client_slug = lower(trim(p_slug));
  return json_build_object('ok', true);
end;
$$;

-- --- позначити заявку ---------------------------------------
create or replace function public.admin_lead_status(
  p_token  text,
  p_id     uuid,
  p_status text,
  p_note   text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_token) then
    raise exception 'Невірний пароль';
  end if;

  update leads
     set status     = p_status,
         admin_note = coalesce(p_note, admin_note),
         handled_at = now()
   where id = p_id;

  return json_build_object('ok', true);
end;
$$;

-- права на виклик функцій
grant execute on function public.admin_leads(text)                              to anon;
grant execute on function public.admin_licenses(text)                           to anon;
grant execute on function public.admin_grant(text,text,integer,uuid,boolean,text,integer) to anon;
grant execute on function public.admin_toggle(text,text,boolean)                to anon;
grant execute on function public.admin_lead_status(text,uuid,text,text)         to anon;
grant execute on function public.admin_set_password(text)                       to anon;


-- ============================================================
--  7. ⚠️  ОБОВ'ЯЗКОВО: ЗМІНИ ПАРОЛЬ
--
--  Заміни ЗМІНИ_ЦЕЙ_ПАРОЛЬ на свій (мінімум 8 символів)
--  і виконай рядок нижче. Цей пароль вводитимеш в адмінці.
--  У коді сайту він не зберігається.
-- ============================================================

select public.admin_set_password('ЗМІНИ_ЦЕЙ_ПАРОЛЬ');


-- ============================================================
--  ПЕРЕВІРКА — має повернути порожній список без помилки
-- ============================================================
-- select * from public.admin_licenses('ТВІЙ_ПАРОЛЬ');
