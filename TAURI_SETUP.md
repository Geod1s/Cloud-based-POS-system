# Tauri Desktop App Setup Guide

This guide will help you set up the local-first desktop version of the Cloud POS System using Tauri.

## Prerequisites

1. **Rust**: Install from [rustup.rs](https://rustup.rs/)
2. **Node.js**: Version 18 or higher
3. **System Dependencies**:
   - **Windows**: Microsoft Visual Studio C++ Build Tools
   - **macOS**: Xcode Command Line Tools
   - **Linux**: `webkit2gtk`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

## Installation Steps

### 1. Install Dependencies

\`\`\`bash
# Install Node.js dependencies
npm install

# Install Tauri CLI
npm install -D @tauri-apps/cli

# Install Tauri API for frontend
npm install @tauri-apps/api
\`\`\`

### 2. Initialize Tauri (if not already done)

\`\`\`bash
npm run tauri init
\`\`\`

### 3. Configure Next.js for Static Export

Update `next.config.mjs`:

\`\`\`javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
\`\`\`

### 4. Update package.json Scripts

Add these scripts to your `package.json`:

\`\`\`json
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
\`\`\`

### 5. Build and Run

#### Development Mode

\`\`\`bash
npm run tauri:dev
\`\`\`

This will:
- Start the Next.js dev server
- Launch the Tauri window
- Enable hot-reload for both frontend and backend

#### Production Build

\`\`\`bash
npm run tauri:build
\`\`\`

This creates a native installer in `src-tauri/target/release/bundle/`

## How It Works

### Local-First Architecture

1. **SQLite Database**: All data is stored locally in `pos.db`
2. **Offline-First**: Full CRUD operations work without internet
3. **Bi-directional Sync**: Manual sync button pushes/pulls changes to/from Supabase
4. **Conflict Resolution**: Last-write-wins based on timestamps

### Sync Process

1. **PULL Phase**: Fetches remote changes newer than last sync
2. **PUSH Phase**: Sends local changes to Supabase
3. **Conflict Handling**: Compares `local_updated_at` vs `remote_updated_at`

### Database Schema

Each table includes sync columns:
- `local_updated_at`: Tracks local modifications
- `remote_updated_at`: Tracks last successful sync
- `is_deleted`: Soft delete flag for sync

## Usage

### Running the Desktop App

1. Launch the app: `npm run tauri:dev`
2. Use the POS system normally (all data saves locally)
3. Click "Sync Now" button to synchronize with cloud
4. View sync status in toast notifications

### Deployment

The built application is a standalone executable that includes:
- The Next.js frontend (static export)
- Rust backend with SQLite
- All dependencies bundled

Users can run the app completely offline and sync when connected.

## Troubleshooting

### Build Errors

- **Rust not found**: Install from rustup.rs
- **WebView errors**: Install system dependencies listed above
- **SQLite errors**: Check file permissions in app data directory

### Sync Issues

- **401 Unauthorized**: Check Supabase credentials in environment variables
- **Infinite recursion**: Ensure RLS policies use security definer functions
- **Conflict errors**: Check timestamp formats (must be UTC RFC3339)

## Environment Variables

Create `.env.local`:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

These are embedded in the Tauri build for sync functionality.

## File Structure

\`\`\`
├── src-tauri/
│   ├── src/
│   │   ├── main.rs          # Tauri entry point
│   │   ├── commands.rs      # CRUD commands
│   │   └── sync.rs          # Sync logic
│   ├── migrations/          # SQLite migrations
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── lib/tauri/
│   ├── commands.ts         # TypeScript bindings
│   └── utils.ts            # Tauri detection
└── components/
    └── sync-button.tsx     # Sync UI component
\`\`\`

## Next Steps

1. Test the sync functionality thoroughly
2. Add real-time sync with Supabase Realtime (optional)
3. Implement automatic background sync
4. Add sync conflict resolution UI
5. Create app icons for different platforms
