# Teamblocks logo

A small design tool for dialing in the Teamblocks logo and exporting it.

```sh
pnpm install
pnpm dev
```

## Deploying

The app is fully static (prerendered, everything runs in the browser), so it
deploys to Cloudflare Workers as static assets with no Worker script. It is
served at [logo.teamblocks.dev](https://logo.teamblocks.dev).

```sh
pnpm preview     # build and serve locally with wrangler
pnpm run deploy  # build and deploy (run `pnpm wrangler login` first)
```

## Exports

Ready-to-use files live in [`exports/`](exports), generated from
`src/lib/logo/defaults.ts`. After changing the defaults, regenerate them with:

```sh
pnpm export
```

Each design comes as an SVG plus PNGs at 1x, 2x and 4x. Transparent-background
versions of every file are in [`exports/transparent/`](exports/transparent).

| Design  | Preview                                       |
| ------- | --------------------------------------------- |
| Logo    | ![Logo](exports/teamblocks-logo.png)          |
| Icon    | ![Icon](exports/teamblocks-icon.png)          |
| Favicon | ![Favicon](exports/teamblocks-favicon@4x.png) |

## Where things live

- `src/lib/logo/defaults.ts` — the canonical logo values (`LOGO_DEFAULTS`) and
  the starting export settings (`EXPORT_DEFAULTS`). Tweak values in the app,
  click **Copy logo defaults**, and paste over `LOGO_DEFAULTS` to lock them in.
- `src/lib/logo/geometry.ts` — the symmetric arrow shape, back angle and rounded corners.
- `src/lib/logo/text.ts` — converts the wordmark to outlines with opentype.js.
- `src/lib/logo/layout.ts` — scales the icon / logo to fit its fixed-size frame and renders the SVG.
- `static/fonts/DMSans-Black.ttf` — DM Sans 900, optical size 14 (SIL OFL).
- `resources/design.svg` — the original design, available as an overlay.

Exports contain only paths, so they don't depend on the font being installed.

## Canvas controls

| Action            | Input                                 |
| ----------------- | ------------------------------------- |
| Pan               | Scroll, drag empty canvas, Space+drag |
| Zoom              | ⌘/Ctrl + scroll, pinch, `+` / `-`     |
| Zoom to 100%      | `Shift+0`                             |
| Zoom to fit       | `Shift+1`                             |
| Zoom to selection | `Shift+2`                             |
| Scrub a value     | Drag the field's label (Shift = 10x)  |
| Reset a value     | Double-click label or slider, or ↺    |
