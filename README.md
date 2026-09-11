# Volleyball 6–2 Rotation Guide — v5

Static HTML/CSS/JavaScript site designed for GitHub Pages.

## v5 updates

- Rotation 1 court positioning rebuilt from the coach's annotated reference.
- Other rotations use the same role-based 6–2 logic as the lineup rotates.
- Phase order is now: Serve → Serve Receive → Base → Outside Hit → Middle Hit → Right Side Hit → Free Ball.
- Outside / Middle / Right Side modes now teach **team defense against the opponent hitter**, not your own hitter coverage.
- Base puts all front-row players on the net, with left-side defense and setter at the 10-ft-line / sideline intersections.
- Serve uses a compact legal-order stack and animates directly to Base.
- Serve Receive hides the back-row setter and shows the pass/set target between the middle and right side.
- Free Ball sends the setter to target and pulls the front row off the net for approaches.
- Separate libero system: editable libero name plus Rotation 1–6 replacement selectors.
- Libero uses a visually different navy/orange bubble.
- DS / regular automatic substitution rules remain available.

## Admin

Open `admin.html`.

Default PIN: `6262`

Roster settings save in browser `localStorage`. Because GitHub Pages is static, edits on one device do not automatically sync to other devices.

## GitHub Pages

Upload the files in this folder to the root of your GitHub repository and keep Pages set to `main` / `(root)`.
