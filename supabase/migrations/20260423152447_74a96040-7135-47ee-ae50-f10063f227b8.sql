
-- Roles enum and table
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
on public.user_roles for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Anyone can view visible categories"
on public.categories for select
using (is_visible = true);

create policy "Admins can view all categories"
on public.categories for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage categories"
on public.categories for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'active',
  is_visible boolean not null default true,
  in_stock boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Anyone can view active visible products"
on public.products for select
using (status = 'active' and is_visible = true);

create policy "Admins can view all products"
on public.products for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage products"
on public.products for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger products_updated_at before update on public.products
for each row execute function public.update_updated_at();

-- Orders log (whatsapp click inquiries)
create table public.orders_log (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  user_id uuid references auth.users(id) on delete set null,
  user_agent text,
  created_at timestamptz not null default now(),
  is_read boolean not null default false
);

alter table public.orders_log enable row level security;

-- Anyone (incl. anonymous) can insert an inquiry
create policy "Anyone can log an inquiry"
on public.orders_log for insert
with check (true);

create policy "Admins can view inquiries"
on public.orders_log for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update inquiries"
on public.orders_log for update to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Realtime
alter publication supabase_realtime add table public.orders_log;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.categories;
