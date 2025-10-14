import { invoke } from "@tauri-apps/api/core"

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  stock_quantity: number
  category_id?: string
  barcode?: string
  sku?: string
  production_date?: string
  expiration_date?: string
  created_at: string
  local_updated_at: string
  remote_updated_at: string
  is_deleted: number
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  local_updated_at: string
  remote_updated_at: string
  is_deleted: number
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  total_debt: number
  created_at: string
  local_updated_at: string
  remote_updated_at: string
  is_deleted: number
}

export interface SyncResult {
  success: boolean
  pulled: number
  pushed: number
  errors: string[]
}

// Product commands
export async function getProducts(): Promise<Product[]> {
  return invoke("get_products")
}

export async function createProduct(product: {
  name: string
  description?: string
  price: number
  stock_quantity: number
  category_id?: string
  barcode?: string
  sku?: string
  production_date?: string
  expiration_date?: string
}): Promise<string> {
  return invoke("create_product", product)
}

export async function updateProduct(
  id: string,
  product: {
    name: string
    description?: string
    price: number
    stock_quantity: number
    category_id?: string
    barcode?: string
    sku?: string
    production_date?: string
    expiration_date?: string
  },
): Promise<void> {
  return invoke("update_product", { id, ...product })
}

export async function deleteProduct(id: string): Promise<void> {
  return invoke("delete_product", { id })
}

// Category commands
export async function getCategories(): Promise<Category[]> {
  return invoke("get_categories")
}

export async function createCategory(category: {
  name: string
  description?: string
}): Promise<string> {
  return invoke("create_category", category)
}

export async function updateCategory(
  id: string,
  category: {
    name: string
    description?: string
  },
): Promise<void> {
  return invoke("update_category", { id, ...category })
}

export async function deleteCategory(id: string): Promise<void> {
  return invoke("delete_category", { id })
}

// Customer commands
export async function getCustomers(): Promise<Customer[]> {
  return invoke("get_customers")
}

export async function createCustomer(customer: {
  name: string
  phone: string
  email?: string
  address?: string
}): Promise<string> {
  return invoke("create_customer", customer)
}

export async function updateCustomer(
  id: string,
  customer: {
    name: string
    phone: string
    email?: string
    address?: string
  },
): Promise<void> {
  return invoke("update_customer", { id, ...customer })
}

// Sync command
export async function syncData(supabaseUrl: string, supabaseKey: string): Promise<SyncResult> {
  return invoke("sync_data", { supabaseUrl, supabaseKey })
}
