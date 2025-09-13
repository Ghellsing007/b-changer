-- =============================================================
--  SUPABASE / POSTGRES - ESQUEMA 
--  App: B-CHAnGER Préstamos + Compra/Venta de Libros
--  Autor: Grupo 2 Seminario de Proyectos II
-- =============================================================

-- Extensiones necesarias
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ===========================
-- ENUMS (con bloque DO)
-- ===========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin','staff','seller','customer');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pending','paid','shipped','delivered','cancelled');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_status') THEN
    CREATE TYPE loan_status AS ENUM ('reserved','checked_out','returned','overdue','lost','cancelled');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_type') THEN
    CREATE TYPE listing_type AS ENUM ('sale','loan');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'book_format') THEN
    CREATE TYPE book_format AS ENUM ('hardcover','paperback','ebook','audiobook');
  END IF;
END$$;

-- ===========================
-- FUNCIONES HELPERS
-- ===========================
create or replace function public.now_utc()
returns timestamptz language sql stable as $$
  select now() at time zone 'utc'
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := public.now_utc();
  return new;
end;$$;

-- ===========================
-- PERFILES (auth.users)
-- ===========================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  display_name text,
  username text unique,
  phone text,
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

-- Crear perfil automáticamente
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict(user_id) do nothing;
  return new;
end;$$;

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where event_object_schema='auth'
      and event_object_table='users'
      and trigger_name='on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end$$;

-- ===========================
-- DIRECCIONES
-- ===========================
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text,
  country_code char(2),
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc()
);
drop trigger if exists trg_addresses_updated on public.addresses;
create trigger trg_addresses_updated before update on public.addresses
for each row execute function public.set_updated_at();

-- ===========================
-- CATÁLOGO: autores, editores, categorías, libros, ediciones
-- ===========================
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc()
);
drop trigger if exists trg_authors_updated on public.authors;
create trigger trg_authors_updated before update on public.authors
for each row execute function public.set_updated_at();

create table if not exists public.publishers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc()
);
drop trigger if exists trg_publishers_updated on public.publishers;
create trigger trg_publishers_updated before update on public.publishers
for each row execute function public.set_updated_at();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc()
);
drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated before update on public.categories
for each row execute function public.set_updated_at();

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc()
);
drop trigger if exists trg_books_updated on public.books;
create trigger trg_books_updated before update on public.books
for each row execute function public.set_updated_at();

create table if not exists public.book_authors (
  book_id uuid not null references public.books(id) on delete cascade,
  author_id uuid not null references public.authors(id) on delete cascade,
  primary key (book_id, author_id)
);

create table if not exists public.editions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  publisher_id uuid references public.publishers(id) on delete set null,
  format book_format not null default 'paperback',
  isbn text,
  publication_date date,
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc()
);
drop trigger if exists trg_editions_updated on public.editions;
create trigger trg_editions_updated before update on public.editions
for each row execute function public.set_updated_at();

-- ===========================
-- LISTINGS (venta/préstamo)
-- ===========================
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(user_id) on delete cascade,
  edition_id uuid not null references public.editions(id) on delete restrict,
  type listing_type not null,
  price numeric(12,2) default 0 check (price >= 0),
  quantity int not null default 1 check (quantity >= 0),
  daily_fee numeric(12,2) check (daily_fee is null or daily_fee >= 0),
  max_days int check (max_days is null or max_days > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc()
);
drop trigger if exists trg_listings_updated on public.listings;
create trigger trg_listings_updated before update on public.listings
for each row execute function public.set_updated_at();

-- ===========================
-- CARRITOS
-- ===========================
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc(),
  unique(user_id, is_active)
);
drop trigger if exists trg_carts_updated on public.carts;
create trigger trg_carts_updated before update on public.carts
for each row execute function public.set_updated_at();

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete restrict,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default public.now_utc(),
  unique(cart_id, listing_id)
);

-- ===========================
-- ÓRDENES, ÍTEMS Y PAGOS
-- ===========================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(user_id) on delete restrict,
  status order_status not null default 'pending',
  payment_status payment_status not null default 'pending',
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc()
);
drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete restrict,
  seller_id uuid not null references public.profiles(user_id) on delete restrict,
  edition_id uuid not null references public.editions(id) on delete restrict,
  quantity int not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  subtotal numeric(12,2) not null check (subtotal >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  reference text,
  status payment_status not null default 'pending',
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default public.now_utc()
);

-- ===========================
-- PRÉSTAMOS, RESERVAS, MULTAS
-- ===========================
create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete restrict,
  lender_id uuid not null references public.profiles(user_id) on delete restrict,
  borrower_id uuid not null references public.profiles(user_id) on delete restrict,
  status loan_status not null default 'reserved',
  start_date date,
  due_date date,
  returned_at date,
  days int,
  daily_fee numeric(12,2) default 0,
  fine_amount numeric(12,2) default 0,
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc()
);
drop trigger if exists trg_loans_updated on public.loans;
create trigger trg_loans_updated before update on public.loans
for each row execute function public.set_updated_at();

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  borrower_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default public.now_utc(),
  expires_at timestamptz
);

create table if not exists public.fines (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  reason text,
  amount numeric(12,2) not null check (amount >= 0),
  paid boolean not null default false,
  created_at timestamptz not null default public.now_utc()
);

-- ===========================
-- REVIEWS + WISHLISTS
-- ===========================
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(user_id) on delete cascade,
  edition_id uuid not null references public.editions(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default public.now_utc(),
  updated_at timestamptz not null default public.now_utc(),
  unique(reviewer_id, edition_id)
);
drop trigger if exists trg_product_reviews_updated on public.product_reviews;
create trigger trg_product_reviews_updated before update on public.product_reviews
for each row execute function public.set_updated_at();

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null default 'Mi lista',
  created_at timestamptz not null default public.now_utc()
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  edition_id uuid not null references public.editions(id) on delete cascade,
  created_at timestamptz not null default public.now_utc(),
  unique(wishlist_id, edition_id)
);

-- ===========================
-- ROW LEVEL SECURITY (RLS)
-- ===========================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Addresses policies
CREATE POLICY "Users can view their own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

-- Public read access for catalog tables
CREATE POLICY "Anyone can view authors" ON public.authors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view publishers" ON public.publishers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view books" ON public.books FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view book_authors" ON public.book_authors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view editions" ON public.editions FOR SELECT TO authenticated USING (true);

-- Admin can manage catalog
CREATE POLICY "Admins can manage authors" ON public.authors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "Admins can manage publishers" ON public.publishers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "Admins can manage books" ON public.books FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "Admins can manage book_authors" ON public.book_authors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);
CREATE POLICY "Admins can manage editions" ON public.editions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Listings policies
CREATE POLICY "Anyone can view active listings" ON public.listings FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Sellers can manage their own listings" ON public.listings FOR ALL USING (auth.uid() = seller_id);

-- Cart policies
CREATE POLICY "Users can view their own carts" ON public.carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own carts" ON public.carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own cart items" ON public.cart_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.carts WHERE id = cart_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their own cart items" ON public.cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.carts WHERE id = cart_id AND user_id = auth.uid())
);

-- Order policies
CREATE POLICY "Users can view their own orders as buyer" ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view orders containing their items" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.order_items WHERE order_id = id AND seller_id = auth.uid())
);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Users can update their own orders" ON public.orders FOR UPDATE USING (auth.uid() = buyer_id);

-- Order items policies
CREATE POLICY "Users can view order items for their orders" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = id AND oi.seller_id = auth.uid())))
);

-- Payment policies
CREATE POLICY "Users can view payments for their orders" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid())
);

-- Loan policies
CREATE POLICY "Users can view loans as lender or borrower" ON public.loans FOR SELECT USING (
  auth.uid() = lender_id OR auth.uid() = borrower_id
);
CREATE POLICY "Users can create loans as borrower" ON public.loans FOR INSERT WITH CHECK (auth.uid() = borrower_id);
CREATE POLICY "Lenders and borrowers can update loans" ON public.loans FOR UPDATE USING (
  auth.uid() = lender_id OR auth.uid() = borrower_id
);

-- Reservation policies
CREATE POLICY "Users can view their own reservations" ON public.reservations FOR SELECT USING (auth.uid() = borrower_id);
CREATE POLICY "Users can create their own reservations" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = borrower_id);
CREATE POLICY "Users can delete their own reservations" ON public.reservations FOR DELETE USING (auth.uid() = borrower_id);

-- Fine policies
CREATE POLICY "Users can view fines for their loans" ON public.fines FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.loans WHERE id = loan_id AND (lender_id = auth.uid() OR borrower_id = auth.uid()))
);

-- Review policies
CREATE POLICY "Anyone can view reviews" ON public.product_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own reviews" ON public.product_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update their own reviews" ON public.product_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete their own reviews" ON public.product_reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- Wishlist policies
CREATE POLICY "Users can view their own wishlists" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own wishlists" ON public.wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own wishlist items" ON public.wishlist_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their own wishlist items" ON public.wishlist_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND user_id = auth.uid())
);
