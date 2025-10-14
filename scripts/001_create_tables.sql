-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Categories table
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Products table with production, expiration, and insertion dates
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price decimal(10, 2) not null,
  stock_quantity integer not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  barcode text unique,
  sku text unique,
  production_date date,
  expiration_date date,
  inserted_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Customers table for debt tracking
create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null unique,
  email text,
  address text,
  total_debt decimal(10, 2) default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Sales table
create table if not exists public.sales (
  id uuid primary key default uuid_generate_v4(),
  sale_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  subtotal decimal(10, 2) not null,
  tax decimal(10, 2) default 0,
  discount decimal(10, 2) default 0,
  total decimal(10, 2) not null,
  payment_method text not null, -- cash, card, debt
  payment_status text not null default 'paid', -- paid, debt, partial
  created_at timestamp with time zone default now()
);

-- Sale items table
create table if not exists public.sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null, -- Store name in case product is deleted
  quantity integer not null,
  unit_price decimal(10, 2) not null,
  subtotal decimal(10, 2) not null,
  created_at timestamp with time zone default now()
);

-- Debts table for tracking customer debts
create table if not exists public.debts (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete cascade,
  sale_id uuid references public.sales(id) on delete set null,
  amount decimal(10, 2) not null,
  paid_amount decimal(10, 2) default 0,
  remaining_amount decimal(10, 2) not null,
  status text not null default 'pending', -- pending, partial, paid
  due_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Debt payments table
create table if not exists public.debt_payments (
  id uuid primary key default uuid_generate_v4(),
  debt_id uuid references public.debts(id) on delete cascade,
  amount decimal(10, 2) not null,
  payment_method text not null,
  notes text,
  created_at timestamp with time zone default now()
);

-- User profiles table for role-based access
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user', -- admin, user
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_barcode on public.products(barcode);
create index if not exists idx_sales_customer on public.sales(customer_id);
create index if not exists idx_sales_user on public.sales(user_id);
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_debts_customer on public.debts(customer_id);
create index if not exists idx_debt_payments_debt on public.debt_payments(debt_id);

-- Enable Row Level Security
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.profiles enable row level security;

-- RLS Policies for categories (all authenticated users can read, only admins can modify)
create policy "Anyone can view categories"
  on public.categories for select
  using (auth.uid() is not null);

create policy "Admins can insert categories"
  on public.categories for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update categories"
  on public.categories for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete categories"
  on public.categories for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for products (all authenticated users can read, only admins can modify)
create policy "Anyone can view products"
  on public.products for select
  using (auth.uid() is not null);

create policy "Admins can insert products"
  on public.products for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update products"
  on public.products for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete products"
  on public.products for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- RLS Policies for customers (all authenticated users can access)
create policy "Anyone can view customers"
  on public.customers for select
  using (auth.uid() is not null);

create policy "Anyone can insert customers"
  on public.customers for insert
  with check (auth.uid() is not null);

create policy "Anyone can update customers"
  on public.customers for update
  using (auth.uid() is not null);

-- RLS Policies for sales (all authenticated users can access)
create policy "Anyone can view sales"
  on public.sales for select
  using (auth.uid() is not null);

create policy "Anyone can insert sales"
  on public.sales for insert
  with check (auth.uid() is not null);

create policy "Anyone can update sales"
  on public.sales for update
  using (auth.uid() is not null);

-- RLS Policies for sale_items (all authenticated users can access)
create policy "Anyone can view sale_items"
  on public.sale_items for select
  using (auth.uid() is not null);

create policy "Anyone can insert sale_items"
  on public.sale_items for insert
  with check (auth.uid() is not null);

-- RLS Policies for debts (all authenticated users can access)
create policy "Anyone can view debts"
  on public.debts for select
  using (auth.uid() is not null);

create policy "Anyone can insert debts"
  on public.debts for insert
  with check (auth.uid() is not null);

create policy "Anyone can update debts"
  on public.debts for update
  using (auth.uid() is not null);

-- RLS Policies for debt_payments (all authenticated users can access)
create policy "Anyone can view debt_payments"
  on public.debt_payments for select
  using (auth.uid() is not null);

create policy "Anyone can insert debt_payments"
  on public.debt_payments for insert
  with check (auth.uid() is not null);

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
