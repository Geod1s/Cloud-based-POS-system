#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{self};
use tauri_plugin_sql;

fn main() {
  tauri::Builder::default()
  .plugin(tauri_plugin_sql::Builder::default().build())
  .plugin(tauri_plugin_store::Builder::default().build())

  .run(tauri::generate_context!())
  .expect("error while running tauri application");

}
