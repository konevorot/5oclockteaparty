-- =====================================================================
--  ВИШЛИСТ: закрытая таблица + функции доступа
--  Supabase → SQL Editor → New query → вставить всё → Run.
--  Скрипт можно запускать повторно, ничего не сломается.
--
--  Как устроено:
--   • гостям видны только занятые позиции, без имён;
--   • при бронировании браузер гостя сохраняет у себя случайный ключ,
--     а в базу кладётся только его отпечаток (хеш) — сам ключ база не знает;
--   • снять отметку может тот, у кого этот ключ, либо хозяйка по паролю.
--  Имена видите только вы — в Table Editor.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists gift_reservations (
  gift_id     text primary key,
  name        text,
  secret_hash text,                    -- отпечаток ключа гостя
  created_at  timestamptz default now()
);

-- для тех, у кого таблица уже была
alter table gift_reservations add column if not exists secret_hash text;

alter table gift_reservations enable row level security;

-- ---------- 1. Закрываем прямой доступ к таблице ----------
drop policy if exists "read"   on gift_reservations;
drop policy if exists "insert" on gift_reservations;
drop policy if exists "delete" on gift_reservations;
drop policy if exists "gifts read"   on gift_reservations;
drop policy if exists "gifts book"   on gift_reservations;
drop policy if exists "gifts cancel" on gift_reservations;

revoke all on gift_reservations from anon;
revoke all on gift_reservations from authenticated;

-- ---------- 2. Ваш запасной пароль ----------
-- Поменять: впишите новый и запустите скрипт заново.
create or replace function wishlist_password()
returns text language sql immutable
as $$ select '060288'::text $$;

revoke all on function wishlist_password() from anon, authenticated, public;

-- ---------- 3. Что видят гости: только занятые позиции ----------
create or replace function taken_gifts()
returns table(gift_id text)
language sql security definer set search_path = public
as $$ select g.gift_id from gift_reservations g $$;

-- ---------- 4. Забронировать (с ключом гостя) ----------
create or replace function book_gift(p_gift text, p_name text, p_secret text default null)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
begin
  insert into gift_reservations(gift_id, name, secret_hash)
  values (
    p_gift,
    nullif(btrim(coalesce(p_name,'')), ''),
    case when coalesce(p_secret,'') = '' then null
         else encode(digest(p_secret, 'sha256'), 'hex') end
  );
  return 'ok';
exception
  when unique_violation then return 'taken';
end $$;

-- ---------- 5. Снять отметку: своим ключом ИЛИ вашим паролем ----------
create or replace function unbook_gift(p_gift text, p_key text)
returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare v_hash text;
begin
  select secret_hash into v_hash from gift_reservations where gift_id = p_gift;
  if not found then return 'not_found'; end if;

  -- запасной путь для хозяйки
  if p_key = wishlist_password() then
    delete from gift_reservations where gift_id = p_gift;
    return 'ok';
  end if;

  -- ключ гостя
  if v_hash is not null and encode(digest(coalesce(p_key,''), 'sha256'), 'hex') = v_hash then
    delete from gift_reservations where gift_id = p_gift;
    return 'ok';
  end if;

  return 'denied';
end $$;

-- ---------- 6. Права: только на функции, не на таблицу ----------
grant execute on function taken_gifts()                    to anon, authenticated;
grant execute on function book_gift(text, text, text)      to anon, authenticated;
grant execute on function unbook_gift(text, text)          to anon, authenticated;

-- старую двухаргументную версию убираем, чтобы не мешалась
drop function if exists book_gift(text, text);

select * from taken_gifts();
