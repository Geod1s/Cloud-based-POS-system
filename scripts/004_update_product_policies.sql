-- Update RLS policies to allow all authenticated users to insert products
-- Drop the old admin-only insert policy
drop policy if exists "Admins can insert products" on public.products;

-- Create new policy allowing all authenticated users to insert products
create policy "Anyone can insert products"
  on public.products for insert
  with check (auth.uid() is not null);

-- Keep update policy as admin-only
-- (already exists, no change needed)

-- Keep delete policy as admin-only
-- (already exists, no change needed)
