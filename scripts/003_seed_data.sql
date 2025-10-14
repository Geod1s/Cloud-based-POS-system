-- Insert default categories
insert into public.categories (name, description) values
  ('Electronics', 'Electronic devices and accessories'),
  ('Food & Beverages', 'Food items and drinks'),
  ('Clothing', 'Apparel and fashion items'),
  ('Home & Garden', 'Home improvement and garden supplies'),
  ('Health & Beauty', 'Health and beauty products')
on conflict (name) do nothing;
