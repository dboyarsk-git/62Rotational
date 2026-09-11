# Volleyball 6–2 Rotation Guide — v9

GitHub Pages front end + Supabase shared roster.

### v9 changes
- Added visible LIVE / sync badge.
- Added Supabase Realtime roster updates with a 5-second polling fallback.
- Added cache-busting so desktop browsers do not keep old JS/CSS after a GitHub update.
- Rotation 3 Serve Receive: the back-row setter in Zone 5 pushes up near the net, the outside in Zone 3 pushes up with her, and the S/RS in Zone 2 drops toward Zone 1 to receive.
- Keeps all prior rotation, DS, libero, admin, and Supabase settings.

Run `supabase-schema.sql` once in Supabase SQL Editor, then upload these files to the root of the GitHub Pages repository.
