// lib/local-queries.ts
import { getLocalDb } from "@/lib/local-db";

export type LocalProduct = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category_id: string | null;
  category_name?: string | null; // joined name, if available
};

export type LocalCustomer = {
  id: string;
  name: string;
  phone: string;
};

export async function getLocalProducts(): Promise<LocalProduct[]> {
  const db = await getLocalDb();

  // Try to include category names if you have a categories table locally
  try {
    return await db.select<LocalProduct[]>(
      `SELECT p.id, p.name, p.price, p.stock_quantity, p.category_id,
              c.name AS category_name
         FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.is_deleted = 0
     ORDER BY p.name`
    );
  } catch {
    // Fallback if categories table / join isn’t available
    return await db.select<LocalProduct[]>(
      `SELECT id, name, price, stock_quantity, category_id
         FROM products
        WHERE is_deleted = 0
     ORDER BY name`
    );
  }
}

export async function getLocalCustomers(): Promise<LocalCustomer[]> {
  const db = await getLocalDb();
  return await db.select<LocalCustomer[]>(
    `SELECT id, name, phone
       FROM customers
      WHERE is_deleted = 0
   ORDER BY name`
  );
}
