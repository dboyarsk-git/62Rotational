# 6–2 Volleyball Rotation Guide — v8

Static GitHub Pages volleyball teaching site with editable coach controls and optional Supabase cloud sync.

## What v8 adds

- Shared roster/config through Supabase
- Coach PIN verified by Supabase when cloud sync is connected
- Player view automatically checks for roster updates every ~15 seconds
- Names, positions, DS substitutions, libero name, and libero rotation assignments all stay synchronized across devices
- Existing browser lineup can be uploaded the first time Supabase is connected
- LocalStorage remains as a fast/offline fallback

## GitHub Pages

Upload all files in this folder to the root of the `62Rotational` repository. GitHub Pages can continue deploying from `main` / `(root)`.

## Supabase setup

Read `SUPABASE_SETUP.md`, then:

1. Run `supabase-schema.sql` once in Supabase SQL Editor.
2. Put your Project URL and **publishable key** into `supabase-config.js`.
3. Commit the updated files to GitHub.

Default coach PIN created by the SQL setup: **6262**.

Never put a Supabase secret/service_role key in a GitHub Pages site.


## v8 change

- Rotation 3 serving formation now places rotational Zone 5 in the middle stack, matching the coach markup.
- Supabase shared-roster support remains included in this version.


## Supabase connection

This v8 build already has the provided Supabase Project URL and publishable browser key entered in `supabase-config.js`. You still need to run `supabase-schema.sql` once in the Supabase SQL Editor if the database schema has not been created yet.
