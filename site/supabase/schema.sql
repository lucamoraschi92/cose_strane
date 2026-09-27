-- ============================================================
-- Schema per "Cose Strane sul Web"
-- Da eseguire in Supabase: Dashboard > SQL Editor > New query > Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tabella prodotti ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in (
    'casa','altro','spettacolo','libri','vestiti','geniali','giochi','moda-accessori'
  )),
  price_range text not null check (price_range in (
    'regalini','costosetti','impegnativi'
  )),
  affiliate_url text not null,
  image_url text,
  short_caption text,
  description text,
  publish_date date,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_publish on products (is_published, publish_date);

-- ---------- Tabella iscritti newsletter ----------
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now()
);

-- ---------- Permessi espliciti sulla Data API ----------
-- (indipendenti dalla checkbox "Automatically expose new tables":
-- così lo script funziona a prescindere da come l'hai impostata)
grant select, insert, update, delete on products to anon, authenticated;
grant select, insert on newsletter_subscribers to anon;
grant select on newsletter_subscribers to authenticated;

-- ---------- Sicurezza (RLS) ----------
alter table products enable row level security;
alter table newsletter_subscribers enable row level security;

-- Chiunque (sito pubblico) può leggere solo i prodotti pubblicati e già "usciti"
drop policy if exists "public read published products" on products;
create policy "public read published products"
on products for select
to anon
using (is_published = true and publish_date <= current_date);

-- Solo l'admin autenticato (tu, dal pannello) può creare/modificare/cancellare/leggere tutto
drop policy if exists "admin full access products" on products;
create policy "admin full access products"
on products for all
to authenticated
using (true)
with check (true);

-- Chiunque può iscriversi alla newsletter (solo inserimento, non può leggere gli altri iscritti)
drop policy if exists "public can subscribe" on newsletter_subscribers;
create policy "public can subscribe"
on newsletter_subscribers for insert
to anon
with check (true);

-- Solo l'admin può vedere/esportare la lista iscritti
drop policy if exists "admin read subscribers" on newsletter_subscribers;
create policy "admin read subscribers"
on newsletter_subscribers for select
to authenticated
using (true);

-- ============================================================
-- STORAGE (fallo dal pannello Supabase, non da qui):
-- 1. Vai su "Storage" nel menu laterale
-- 2. Crea un nuovo bucket chiamato:  product-images
-- 3. Impostalo come "Public bucket" (così le immagini si vedono sul sito)
-- ============================================================
