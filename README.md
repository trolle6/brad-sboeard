# Breadboard Sim

A small in-browser breadboard you can click around on: place jumper wires between holes on a familiar half-board layout.

## Try online

**https://trolle6.github.io/brad-sboeard/**

### One-time setup (if the link 404s)

1. Open [repo Settings → Pages](https://github.com/trolle6/brad-sboeard/settings/pages)
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**
3. **Branch:** `gh-pages` · **Folder:** `/ (root)` · Save

The site should appear within a minute or two. Pushes to `gh-pages` update the live site; `main` also has a GitHub Actions workflow once you switch the source to **GitHub Actions** instead.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx --yes serve .
```

Then open the URL shown (usually http://localhost:3000).

## Controls

- **Wire** — click hole A, then hole B to connect with a jumper
- **Erase** — remove all wires touching a hole
- **Clear wires** — reset connections
- **Esc** — cancel wire in progress

## What's next (ideas)

- Drag-and-drop components (LED, resistor, IC)
- Row bus logic (holes a–e and f–j on the same row are electrically tied)
- Simple DC simulation (voltage, LED on/off)
- Save/load layouts as JSON
