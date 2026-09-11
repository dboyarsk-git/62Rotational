# Volleyball 6–2 Rotation Guide — v12

GitHub Pages front end + Supabase shared roster.

### v12 changes
- Rebuilt all six **Serve Receive** formations from the coach-marked `Fixed rotations.pdf`.
- Rotations 1/4: Zone 2 pulls back to hide the Zone 1 setter.
- Rotations 2/5: Zones 4-5-1 form the passing line with Zone 6 hidden.
- Rotations 3/6: Zones 5 + 3 push up near the net; Zones 6-1-2 form the passing line.
- Removed the unwanted vertical center line from the court.
- Supabase LIVE sync settings from v12 are preserved.
- Rotation 6 Serve Receive now mirrors Rotation 3: setter hidden up by the net, front-row outside pushed up at the net, and the S/RS in Zone 2 drops back toward Zone 1 to receive.
- Added visible LIVE / sync badge.
- Added Supabase Realtime roster updates with a 5-second polling fallback.
- Added cache-busting so desktop browsers do not keep old JS/CSS after a GitHub update.
- Rotation 3 Serve Receive: the back-row setter in Zone 5 pushes up near the net, the outside in Zone 3 pushes up with her, and the S/RS in Zone 2 drops toward Zone 1 to receive.
- Keeps all prior rotation, DS, libero, admin, and Supabase settings.

Run `supabase-schema.sql` once in Supabase SQL Editor, then upload these files to the root of the GitHub Pages repository.


## v12 serve-receive correction
Serve Receive is now driven by an explicit rotation/zone coordinate table from the coach's marked-up Fixed rotations sheet rather than generic role placement.
- Rotations 1 & 4: passing line 5-6-2; Zone 1 setter hidden behind Zone 2.
- Rotations 2 & 5: passing line 4-5-1; Zone 6 setter pushes up near the net/target.
- Rotations 3 & 6: Zone 5 setter + Zone 3 outside push up; passing line 6-1-2.

The header shows **BUILD v12**. If that badge is not visible after publishing, the browser/GitHub page is still serving an older build.
