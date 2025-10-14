-- Function to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  )
  on conflict (id) do nothing;
  
  return new;
end;
$$;

-- Trigger to create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers for updated_at
create trigger set_updated_at_categories
  before update on public.categories
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at_products
  before update on public.products
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at_customers
  before update on public.customers
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at_debts
  before update on public.debts
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Function to update customer total debt
create or replace function public.update_customer_debt()
returns trigger
language plpgsql
as $$
begin
  update public.customers
  set total_debt = (
    select coalesce(sum(remaining_amount), 0)
    from public.debts
    where customer_id = new.customer_id
  )
  where id = new.customer_id;
  
  return new;
end;
$$;

-- Trigger to update customer debt when debt changes
create trigger update_customer_debt_on_insert
  after insert on public.debts
  for each row
  execute function public.update_customer_debt();

create trigger update_customer_debt_on_update
  after update on public.debts
  for each row
  execute function public.update_customer_debt();

-- Function to generate unique sale number
create or replace function public.generate_sale_number()
returns text
language plpgsql
as $$
declare
  new_number text;
  counter integer;
begin
  counter := (select count(*) from public.sales) + 1;
  new_number := 'SALE-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(counter::text, 4, '0');
  
  while exists (select 1 from public.sales where sale_number = new_number) loop
    counter := counter + 1;
    new_number := 'SALE-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(counter::text, 4, '0');
  end loop;
  
  return new_number;
end;
$$;
