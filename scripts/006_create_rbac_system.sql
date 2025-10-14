-- Create permission_tags table
create table if not exists public.permission_tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create user_tags junction table (many-to-many relationship)
create table if not exists public.user_tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  tag_id uuid references public.permission_tags(id) on delete cascade,
  assigned_at timestamp with time zone default now(),
  unique(user_id, tag_id)
);

-- Add is_active field to profiles for deactivation
alter table public.profiles add column if not exists is_active boolean default true;

-- Create indexes
create index if not exists idx_user_tags_user on public.user_tags(user_id);
create index if not exists idx_user_tags_tag on public.user_tags(tag_id);

-- Enable RLS
alter table public.permission_tags enable row level security;
alter table public.user_tags enable row level security;

-- RLS Policies for permission_tags (only admins can manage)
create policy "Anyone can view permission tags"
  on public.permission_tags for select
  using (auth.uid() is not null);

create policy "Admins can insert permission tags"
  on public.permission_tags for insert
  with check (is_admin());

create policy "Admins can update permission tags"
  on public.permission_tags for update
  using (is_admin());

create policy "Admins can delete permission tags"
  on public.permission_tags for delete
  using (is_admin());

-- RLS Policies for user_tags (only admins can manage)
create policy "Anyone can view their own tags"
  on public.user_tags for select
  using (auth.uid() = user_id or is_admin());

create policy "Admins can insert user tags"
  on public.user_tags for insert
  with check (is_admin());

create policy "Admins can delete user tags"
  on public.user_tags for delete
  using (is_admin());

-- Update profiles RLS policies for admin management
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (is_admin());

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (is_admin());

-- Function to check if user has specific permission
create or replace function public.has_permission(permission_name text)
returns boolean
language plpgsql
security definer
as $$
declare
  user_permissions jsonb;
begin
  -- Admins have all permissions
  if is_admin() then
    return true;
  end if;
  
  -- Get all permissions from user's tags
  select jsonb_agg(distinct perm)
  into user_permissions
  from public.user_tags ut
  join public.permission_tags pt on ut.tag_id = pt.id
  cross join jsonb_array_elements_text(pt.permissions) as perm
  where ut.user_id = auth.uid();
  
  -- Check if permission exists
  return user_permissions ? permission_name;
end;
$$;

-- Function to get user's permissions
create or replace function public.get_user_permissions()
returns jsonb
language plpgsql
security definer
as $$
declare
  user_permissions jsonb;
begin
  -- Admins have all permissions
  if is_admin() then
    return '["*"]'::jsonb;
  end if;
  
  -- Get all unique permissions from user's tags
  select coalesce(jsonb_agg(distinct perm), '[]'::jsonb)
  into user_permissions
  from public.user_tags ut
  join public.permission_tags pt on ut.tag_id = pt.id
  cross join jsonb_array_elements_text(pt.permissions) as perm
  where ut.user_id = auth.uid();
  
  return user_permissions;
end;
$$;

-- Trigger for updated_at on permission_tags
create trigger set_updated_at_permission_tags
  before update on public.permission_tags
  for each row
  execute function public.handle_updated_at();

-- Insert default permission tags (Cashier and Inventory Manager)
insert into public.permission_tags (name, description, permissions) values
  (
    'Cashier',
    'Can process sales and handle customer transactions',
    '["login", "process_sales", "search_products", "apply_discounts", "view_customers", "add_customers", "end_of_day_reconciliation"]'::jsonb
  ),
  (
    'Inventory Manager',
    'Can manage inventory and stock levels',
    '["login", "adjust_stock", "receive_stock", "view_suppliers", "run_inventory_reports", "view_products", "add_products", "edit_products"]'::jsonb
  )
on conflict (name) do nothing;
