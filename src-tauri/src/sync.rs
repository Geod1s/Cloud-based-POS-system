use serde::{Deserialize, Serialize};
use tauri::State;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub pulled: usize,
    pub pushed: usize,
    pub errors: Vec<String>,
}

#[tauri::command]
pub async fn sync_data(
    app: tauri::AppHandle,
    supabase_url: String,
    supabase_key: String,
) -> Result<SyncResult, String> {
    let db = app.state::<tauri_plugin_sql::Db>();
    let mut errors = Vec::new();
    let mut pulled = 0;
    let mut pushed = 0;
    
    // Get last sync time
    let last_synced: String = db
        .execute("SELECT last_synced_at FROM sync_meta WHERE id = 1", vec![])
        .await
        .map_err(|e| e.to_string())?
        .first()
        .and_then(|row| row.get("last_synced_at"))
        .ok_or("Failed to get last sync time")?;
    
    // PHASE 1: PULL from Supabase
    let client = reqwest::Client::new();
    
    // Pull categories
    match pull_table(
        &client,
        &supabase_url,
        &supabase_key,
        "categories",
        &last_synced,
        &db,
    )
    .await
    {
        Ok(count) => pulled += count,
        Err(e) => errors.push(format!("Categories pull error: {}", e)),
    }
    
    // Pull products
    match pull_table(
        &client,
        &supabase_url,
        &supabase_key,
        "products",
        &last_synced,
        &db,
    )
    .await
    {
        Ok(count) => pulled += count,
        Err(e) => errors.push(format!("Products pull error: {}", e)),
    }
    
    // Pull customers
    match pull_table(
        &client,
        &supabase_url,
        &supabase_key,
        "customers",
        &last_synced,
        &db,
    )
    .await
    {
        Ok(count) => pulled += count,
        Err(e) => errors.push(format!("Customers pull error: {}", e)),
    }
    
    // PHASE 2: PUSH to Supabase
    // Push categories
    match push_table(
        &client,
        &supabase_url,
        &supabase_key,
        "categories",
        &db,
    )
    .await
    {
        Ok(count) => pushed += count,
        Err(e) => errors.push(format!("Categories push error: {}", e)),
    }
    
    // Push products
    match push_table(
        &client,
        &supabase_url,
        &supabase_key,
        "products",
        &db,
    )
    .await
    {
        Ok(count) => pushed += count,
        Err(e) => errors.push(format!("Products push error: {}", e)),
    }
    
    // Push customers
    match push_table(
        &client,
        &supabase_url,
        &supabase_key,
        "customers",
        &db,
    )
    .await
    {
        Ok(count) => pushed += count,
        Err(e) => errors.push(format!("Customers push error: {}", e)),
    }
    
    // Update last sync time
    let now = Utc::now().to_rfc3339();
    db.execute(
        "UPDATE sync_meta SET last_synced_at = ? WHERE id = 1",
        vec![now.into()],
    )
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(SyncResult {
        success: errors.is_empty(),
        pulled,
        pushed,
        errors,
    })
}

async fn pull_table(
    client: &reqwest::Client,
    supabase_url: &str,
    supabase_key: &str,
    table: &str,
    last_synced: &str,
    db: &tauri_plugin_sql::Db,
) -> Result<usize, String> {
    // Fetch records from Supabase that were updated after last_synced
    let url = format!("{}/rest/v1/{}?updated_at=gt.{}", supabase_url, table, last_synced);
    
    let response = client
        .get(&url)
        .header("apikey", supabase_key)
        .header("Authorization", format!("Bearer {}", supabase_key))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    let records: Vec<serde_json::Value> = response.json().await.map_err(|e| e.to_string())?;
    
    let count = records.len();
    
    // Upsert records into local SQLite
    for record in records {
        // Build dynamic INSERT OR REPLACE query based on table structure
        // This is simplified - you'd need to handle each table's specific columns
        let id = record["id"].as_str().unwrap();
        let updated_at = record["updated_at"].as_str().unwrap();
        
        // Check if local version is newer
        let local_updated: Option<String> = db
            .execute(
                &format!("SELECT local_updated_at FROM {} WHERE id = ?", table),
                vec![id.into()],
            )
            .await
            .ok()
            .and_then(|rows| rows.first().and_then(|row| row.get("local_updated_at")));
        
        if let Some(local_time) = local_updated {
            if local_time > updated_at.to_string() {
                // Local is newer, skip this record
                continue;
            }
        }
        
        // Remote wins - upsert the record
        // This would need to be customized per table with proper column mapping
        db.execute(
            &format!(
                "INSERT OR REPLACE INTO {} (id, remote_updated_at, ...) VALUES (?, ?, ...)",
                table
            ),
            vec![id.into(), updated_at.into()],
        )
        .await
        .map_err(|e| e.to_string())?;
    }
    
    Ok(count)
}

async fn push_table(
    client: &reqwest::Client,
    supabase_url: &str,
    supabase_key: &str,
    table: &str,
    db: &tauri_plugin_sql::Db,
) -> Result<usize, String> {
    // Get dirty records (local_updated_at > remote_updated_at)
    let dirty_records: Vec<serde_json::Value> = db
        .execute(
            &format!(
                "SELECT * FROM {} WHERE local_updated_at > remote_updated_at",
                table
            ),
            vec![],
        )
        .await
        .map_err(|e| e.to_string())?;
    
    let count = dirty_records.len();
    
    for record in dirty_records {
        let id = record["id"].as_str().unwrap();
        let is_deleted = record["is_deleted"].as_i64().unwrap_or(0);
        
        if is_deleted == 1 {
            // Delete from Supabase
            let url = format!("{}/rest/v1/{}?id=eq.{}", supabase_url, table, id);
            
            client
                .delete(&url)
                .header("apikey", supabase_key)
                .header("Authorization", format!("Bearer {}", supabase_key))
                .send()
                .await
                .map_err(|e| e.to_string())?;
            
            // Delete from local SQLite
            db.execute(
                &format!("DELETE FROM {} WHERE id = ?", table),
                vec![id.into()],
            )
            .await
            .map_err(|e| e.to_string())?;
        } else {
            // Upsert to Supabase
            let url = format!("{}/rest/v1/{}", supabase_url, table);
            
            let response = client
                .post(&url)
                .header("apikey", supabase_key)
                .header("Authorization", format!("Bearer {}", supabase_key))
                .header("Prefer", "resolution=merge-duplicates")
                .json(&record)
                .send()
                .await
                .map_err(|e| e.to_string())?;
            
            if response.status().is_success() {
                // Update remote_updated_at in local SQLite
                let now = chrono::Utc::now().to_rfc3339();
                db.execute(
                    &format!("UPDATE {} SET remote_updated_at = ? WHERE id = ?", table),
                    vec![now.into(), id.into()],
                )
                .await
                .map_err(|e| e.to_string())?;
            }
        }
    }
    
    Ok(count)
}
