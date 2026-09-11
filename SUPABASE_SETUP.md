# Supabase cloud sync — v8

This version can keep the roster synchronized across the GitHub Pages site, phones, tablets, and computers.

## 1. Create or open your Supabase project

In Supabase, open the project you want to use for the volleyball site.

## 2. Run the database setup

Open **SQL Editor**, create a new query, paste everything from `supabase-schema.sql`, and run it once.

This creates one shared roster named `qg-volleyball` and sets the initial coach PIN to **6262**.

## 3. Connection values are already entered

This v8 package already contains the provided Supabase **Project URL** and **publishable browser key** in `supabase-config.js`. No extra config edit is needed.

Do **not** replace it with a secret or `service_role` key.

## 4. Upload v8 to GitHub

Replace the old website files in the root of the `62Rotational` repository with the v8 files and commit them.
GitHub Pages will rebuild automatically.

## How syncing works

- Player view loads its most recent local copy immediately so the page stays fast.
- It then pulls the shared Supabase roster.
- While the page stays open, it checks Supabase about every 15 seconds and whenever the player returns to the tab.
- Coach Admin verifies PIN against Supabase.
- **Save Changes** writes names, positions, subs, and libero assignments to the shared roster.
- The PIN hash stays in Supabase and direct browser writes to the underlying table are blocked.

## Important

The publishable key is designed for browser use. Never place a Supabase **secret** or **service_role** key in `supabase-config.js` or GitHub.
