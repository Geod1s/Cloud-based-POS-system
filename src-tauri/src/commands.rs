use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct Product {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub price: f64,
    pub stock_quantity: i32,
    pub category_id: Option<String>,
    pub barcode: Option<String>,
    pub sku: Option<String>,
    pub production_date: Option<String>,
    pub expiration_date: Option<String>,
    pub created_at: String,
    pub local_updated_at: String,
    pub remote_updated_at: String,
    pub is_deleted: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub local_updated_at: String,
    pub remote_updated_at: String,
    pub is_deleted: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub phone: String,
    pub email: Option<String>,
    pub address: Option<String>,
    pub total_debt: f64,
    pub created_at: String,
    pub local_updated_at: String,
    pub remote_updated_at: String,
    pub is_deleted: i32,
}

#[tauri::command]
pub async fn get_products(app: tauri::AppHandle) -> Result<Vec<Product>, String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    
    db.execute(
        "SELECT * FROM products WHERE is_deleted = 0 ORDER BY name",
        vec![],
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_product(
    app: tauri::AppHandle,
    name: String,
    description: Option<String>,
    price: f64,
    stock_quantity: i32,
    category_id: Option<String>,
    barcode: Option<String>,
    sku: Option<String>,
    production_date: Option<String>,
    expiration_date: Option<String>,
) -> Result<String, String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    
    db.execute(
        "INSERT INTO products (id, name, description, price, stock_quantity, category_id, barcode, sku, production_date, expiration_date, created_at, local_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        vec![
            id.clone().into(),
            name.into(),
            description.into(),
            price.into(),
            stock_quantity.into(),
            category_id.into(),
            barcode.into(),
            sku.into(),
            production_date.into(),
            expiration_date.into(),
            now.clone().into(),
            now.into(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(id)
}

#[tauri::command]
pub async fn update_product(
    app: tauri::AppHandle,
    id: String,
    name: String,
    description: Option<String>,
    price: f64,
    stock_quantity: i32,
    category_id: Option<String>,
    barcode: Option<String>,
    sku: Option<String>,
    production_date: Option<String>,
    expiration_date: Option<String>,
) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    let now = Utc::now().to_rfc3339();
    
    db.execute(
        "UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ?, category_id = ?, barcode = ?, sku = ?, production_date = ?, expiration_date = ?, local_updated_at = ? WHERE id = ?",
        vec![
            name.into(),
            description.into(),
            price.into(),
            stock_quantity.into(),
            category_id.into(),
            barcode.into(),
            sku.into(),
            production_date.into(),
            expiration_date.into(),
            now.into(),
            id.into(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn delete_product(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    let now = Utc::now().to_rfc3339();
    
    db.execute(
        "UPDATE products SET is_deleted = 1, local_updated_at = ? WHERE id = ?",
        vec![now.into(), id.into()],
    )
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_categories(app: tauri::AppHandle) -> Result<Vec<Category>, String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    
    db.execute(
        "SELECT * FROM categories WHERE is_deleted = 0 ORDER BY name",
        vec![],
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_category(
    app: tauri::AppHandle,
    name: String,
    description: Option<String>,
) -> Result<String, String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    
    db.execute(
        "INSERT INTO categories (id, name, description, created_at, local_updated_at) VALUES (?, ?, ?, ?, ?)",
        vec![
            id.clone().into(),
            name.into(),
            description.into(),
            now.clone().into(),
            now.into(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(id)
}

#[tauri::command]
pub async fn update_category(
    app: tauri::AppHandle,
    id: String,
    name: String,
    description: Option<String>,
) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    let now = Utc::now().to_rfc3339();
    
    db.execute(
        "UPDATE categories SET name = ?, description = ?, local_updated_at = ? WHERE id = ?",
        vec![name.into(), description.into(), now.into(), id.into()],
    )
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn delete_category(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    let now = Utc::now().to_rfc3339();
    
    db.execute(
        "UPDATE categories SET is_deleted = 1, local_updated_at = ? WHERE id = ?",
        vec![now.into(), id.into()],
    )
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn get_customers(app: tauri::AppHandle) -> Result<Vec<Customer>, String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    
    db.execute(
        "SELECT * FROM customers WHERE is_deleted = 0 ORDER BY name",
        vec![],
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_customer(
    app: tauri::AppHandle,
    name: String,
    phone: String,
    email: Option<String>,
    address: Option<String>,
) -> Result<String, String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    
    db.execute(
        "INSERT INTO customers (id, name, phone, email, address, created_at, local_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        vec![
            id.clone().into(),
            name.into(),
            phone.into(),
            email.into(),
            address.into(),
            now.clone().into(),
            now.into(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(id)
}

#[tauri::command]
pub async fn update_customer(
    app: tauri::AppHandle,
    id: String,
    name: String,
    phone: String,
    email: Option<String>,
    address: Option<String>,
) -> Result<(), String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    let now = Utc::now().to_rfc3339();
    
    db.execute(
        "UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, local_updated_at = ? WHERE id = ?",
        vec![
            name.into(),
            phone.into(),
            email.into(),
            address.into(),
            now.into(),
            id.into(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(())
}

// Additional commands for sales, debts, etc. would follow the same pattern
#[tauri::command]
pub async fn get_sales(app: tauri::AppHandle) -> Result<Vec<serde_json::Value>, String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    
    db.execute(
        "SELECT * FROM sales WHERE is_deleted = 0 ORDER BY created_at DESC",
        vec![],
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_sale(
    app: tauri::AppHandle,
    total_amount: f64,
    payment_method: String,
    customer_id: Option<String>,
    user_id: String,
    items: Vec<serde_json::Value>,
) -> Result<String, String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    let sale_id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    
    // Insert sale
    db.execute(
        "INSERT INTO sales (id, total_amount, payment_method, customer_id, user_id, created_at, local_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        vec![
            sale_id.clone().into(),
            total_amount.into(),
            payment_method.into(),
            customer_id.into(),
            user_id.into(),
            now.clone().into(),
            now.clone().into(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;
    
    // Insert sale items
    for item in items {
        let item_id = Uuid::new_v4().to_string();
        db.execute(
            "INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal, created_at, local_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            vec![
                item_id.into(),
                sale_id.clone().into(),
                item["product_id"].as_str().unwrap().into(),
                item["quantity"].as_i64().unwrap().into(),
                item["unit_price"].as_f64().unwrap().into(),
                item["subtotal"].as_f64().unwrap().into(),
                now.clone().into(),
                now.clone().into(),
            ],
        )
        .await
        .map_err(|e| e.to_string())?;
    }
    
    Ok(sale_id)
}

#[tauri::command]
pub async fn get_debts(app: tauri::AppHandle) -> Result<Vec<serde_json::Value>, String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    
    db.execute(
        "SELECT * FROM debts WHERE is_deleted = 0 ORDER BY created_at DESC",
        vec![],
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_debt_payment(
    app: tauri::AppHandle,
    debt_id: String,
    amount: f64,
    payment_method: String,
) -> Result<String, String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    let payment_id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    
    // Insert payment
    db.execute(
        "INSERT INTO debt_payments (id, debt_id, amount, payment_method, created_at, local_updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        vec![
            payment_id.clone().into(),
            debt_id.clone().into(),
            amount.into(),
            payment_method.into(),
            now.clone().into(),
            now.into(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;
    
    // Update debt
    db.execute(
        "UPDATE debts SET amount_paid = amount_paid + ?, status = CASE WHEN amount_paid + ? >= amount THEN 'paid' WHEN amount_paid + ? > 0 THEN 'partial' ELSE 'pending' END WHERE id = ?",
        vec![amount.into(), amount.into(), amount.into(), debt_id.into()],
    )
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(payment_id)
}
