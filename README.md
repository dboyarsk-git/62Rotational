# 6–2 Volleyball Rotation Guide

A static, mobile-friendly teaching site for a volleyball 6–2 system. It is designed to run on GitHub Pages.

## Current features

- Six rotation selector
- Rally phases in coaching order: Serve → Serve Receive → Base → Outside Hit → Middle Hit → Right Side Hit → Free Ball
- Compact serving stack so players can release quickly to base after contact
- Rotation 1 serve-receive pattern: hidden back-row setter + Zone 2 outside pulling back
- Setter target fixed at the right sideline × 10-ft-line intersection in Base and every hitting option
- All three front-row players visibly placed on the net in Base
- Back-row/left-back coverage visibly changes for Outside, Middle, and Right Side attacks
- Free-ball positioning with front-row hitters getting off the net to approach
- Player-by-player job explanations
- Setter/Right Side, Outside, Middle, DS, and Libero lessons
- Coach Admin page with editable starter names and roles
- Separate Libero Rotation Map: choose who the libero replaces in each of Rotations 1–6, or set her Off Court
- Libero uses a visually different court bubble
- Automatic DS/other substitute links: link a sub to a starter and choose Front Row, Back Row, or Always
- Modern navy/orange visual design
- No vertical center line on the court

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
