# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Two independent, German-language PWAs served as static files from GitHub Pages (`main` branch, root). There is no build step, package manager, linter or test suite: the files in the repo are exactly what gets deployed. All UI text and code comments are in German; keep it that way.

- **Root (`/`): Blattscanner**: document scanner that runs fully on the device. Photos never leave the phone.
- **`noten/`: Noten-App**: school-grade tracker backed by Firebase (Auth + Firestore).

The two apps share no code. Each has its own `index.html`, `sw.js`, `manifest.webmanifest` and icons.

## Running locally

Any static server works, for example `python3 -m http.server 8000`, then open `http://localhost:8000/` or `/noten/`. Service workers need `localhost` or HTTPS. Clear the old service worker (or use a private window) when testing changes.

## Blattscanner (root)

Plain scripts with no modules or dependencies, loaded in order by `index.html`. Each one attaches a global:

- `scan.js` → `window.Scan`: image loading (EXIF orientation, downscaling), edge/quad detection (`detect`), perspective warp (`warp`), `rotate`, and `filter` modes (`dokument`, `original`, `grau`, `sw`). Hand-written pixel processing on canvases; no OpenCV.
- `pdf.js` → `window.Pack`: hand-written PDF writer (embeds JPEG pages, A4 when the aspect ratio is close to A4), an uncompressed ZIP writer for multi-JPG export, `bytes`, `stamp` (default filename).
- `app.js`: UI state (`pages` array of `{srcBlob, quad, filter, rot, resBlob, …}`), the crop/look editor, and the save sheet (Web Share API with download fallback). Preferences are stored in `localStorage` under `bs.*` keys.

Working resolutions: source 2400px, preview 1100px, final output 2200px, JPEG quality 0.88.

`sw.js` is cache-first over a fixed file list. **When you change any cached file, bump `CACHE` (`blattscanner-v1`)** and add new files to `FILES`, or installed clients keep the old version.

## Noten-App (`noten/`)

Everything lives in one large `noten/index.html` (inline CSS plus one `<script type="module">`). It imports the Firebase SDK from `www.gstatic.com/firebasejs/13.1.0/`, and `jspdf.umd.min.js` (vendored) is used for PDF export. Views: `uebersicht`, `termine`, `zeugnis`, `einst`. Data comes in through live `onSnapshot` listeners on the Firestore collections `faecher`, `meta`, `noten`, `termine` and `besuche`.

`noten/firestore.rules` is the security model and is **not** deployed by GitHub Pages; changes must be published separately in the Firebase console (project `familien-apps`). There are two hard-coded user roles, `admin()` and `anwender()`, identified by UID. Document shapes are validated in the rules (`gueltigeNote`, `gueltigerTermin`, `besuche`), so any new field written by the client must also be added to the matching `hasOnly([...])` list.

`noten/sw.js`: network-first for the page, stale-while-revalidate for the other shell files, the Firebase SDK and Google Fonts. Firestore and Auth traffic is never cached. Bump `CACHE` (`noten-vN`) on release. The page reloads itself when a new service worker takes over, unless the user is in the middle of an entry.

## Deployment

Push to `main`; GitHub Pages serves it. `ANLEITUNG.md` is the end-user setup guide (in German) for hosting and installing to the home screen.
