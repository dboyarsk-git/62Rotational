# 6–2 Volleyball Rotation Guide

A static, mobile-friendly teaching site for a volleyball 6–2 system. It is designed to run on GitHub Pages.

## Current features

- Six rotation selector
- Serve Receive teaching view
- Rotation 1 teaching pattern: hidden back-row setter + Zone 2 outside pulling back
- Setter Release view with target between middle and right side
- Base positions
- Outside, middle, and right-side attack views
- Free-ball positioning
- Serve and Serve Recovery views
- Player-by-player job explanations
- Setter/Right Side, Outside, Middle, DS, and Libero roles
- Coach Admin page with editable player names and roles
- Automatic substitute links: link a sub to a starter and choose Front Row, Back Row, or Always
- Modern navy/orange visual design

## Coach Admin

Open `admin.html`. Default PIN: `6262`.

Roster edits are currently saved with browser `localStorage`. This works on GitHub Pages, but edits made on one device do not automatically sync to other devices. A cloud database such as Firebase or Supabase is needed for one coach edit to update every player phone automatically.

## GitHub Pages

Upload all files in this folder to the root of the repository. In GitHub:

1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main`
4. Folder: `/ (root)`
5. Save

The site loads from `index.html`; Coach Admin is at `admin.html`.
