-- Одна таблица: кто какой подарок берёт.
-- Supabase → SQL Editor → New query → вставить → Run.

create table if not exists gift_reservations (
  gift_id    text primary key,
  name       text,
  created_at timestamptz default now()
);

alter table gift_reservations enable row level security;

drop policy if exists "read"   on gift_reservations;
drop policy if exists "insert" on gift_reservations;
drop policy if exists "delete" on gift_reservations;

create policy "read"   on gift_reservations for select using (true);
create policy "insert" on gift_reservations for insert to anon, authenticated with check (true);
create policy "delete" on gift_reservations for delete to anon, authenticated using (true);
