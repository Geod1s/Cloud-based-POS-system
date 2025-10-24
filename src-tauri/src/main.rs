use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

mod commands;
mod sync;

fn main() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/001_initial_schema.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:pos.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::get_products,
            commands::create_product,
            commands::update_product,
            commands::delete_product,
            commands::get_categories,
            commands::create_category,
            commands::update_category,
            commands::delete_category,
            commands::get_customers,
            commands::create_customer,
            commands::update_customer,
            commands::get_sales,
            commands::create_sale,
            commands::get_debts,
            commands::create_debt_payment,
            sync::sync_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
