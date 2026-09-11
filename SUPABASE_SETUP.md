# Supabase LIVE Sync Setup — v9

Your Project URL and publishable key are already filled in.

## One required database step
1. Open Supabase Dashboard → **SQL Editor**.
2. Open `supabase-schema.sql` from this folder.
3. Paste the entire file into a new query and click **Run**.

You can run the v9 SQL even if you already ran v8. It upgrades the database with a safe player-facing mirror table and Supabase Realtime support.

## Then publish v9
Upload all v9 files to the root of the existing GitHub Pages repository and commit them. The HTML now uses `?v=9` cache-busting on the CSS/JS, which helps computers stop holding onto an older build.

## What the badge means
- **LIVE • time** = connected to Supabase and listening for updates.
- **SYNCING…** = loading the newest roster.
- **LIVE unavailable • retrying** = Realtime dropped; the site still polls every 5 seconds as backup.
- **LOCAL • not connected** = Supabase is not available, so that device is using its own browser storage.
