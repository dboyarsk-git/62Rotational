# 6–2 Volleyball Rotation Guide

A mobile-friendly interactive teaching website for explaining a volleyball 6–2 rotation.

## Features

- Six rotation buttons
- Serve positions
- Animated Serve → Serve Recovery movement
- Free-ball positions
- Role lessons for Setter/Right Side, Outside, and Middle
- Tap any player to see her specific job
- “Show me my job” player selector
- Separate Coach Admin page
- Editable player names and roles
- No build tools required

## Coach Admin

Open `admin.html`.

Default demo PIN: `6262`

The PIN is only a convenience lock. Because GitHub Pages is a static host, the site source can be viewed publicly.

## How saving works on GitHub Pages

This version saves admin edits with browser `localStorage`. This means:

- Names persist on the same browser/device.
- The website itself can be hosted for free on GitHub Pages.
- An edit made on the coach's phone does **not** automatically update every player's phone.

For shared live updates across all devices, connect the site to Firebase, Supabase, or another small database.

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload all files in this folder to the repository root.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder.
6. Save. GitHub will provide the public website address.

No npm install or build step is needed.

## Files

- `index.html` — player-facing teaching page
- `admin.html` — coach editor
- `styles.css` — styling and responsive court layout
- `data.js` — default lineup, storage, and rotation math
- `app.js` — player-view interactions and movement
- `admin.js` — admin editor logic
