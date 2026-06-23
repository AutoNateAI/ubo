# UBO Robotics Arena

A GitHub Pages friendly React app for the one-hour Upward Bound ESP32 robot-car Olympics.

The app uses Firebase Authentication and a `uboApi` Cloud Function on the shared
`autonateai-learning-hub` project to log wiring, coding, driving, race, AI-assist,
and report actions for later review.

## Local development

```bash
npm install
npm run dev
```

## Real Simulator

The portal now vendors the Velxio source under `vendor/velxio` so we can build
around the real Wokwi-style editor instead of a static mock. Velxio is licensed
under AGPL-3.0; keep its license and source available with any network-deployed
modified version.

Run the real simulator locally:

```bash
npm run simulator:start
npm run simulator:frontend
```

Then open the UBO app at `http://localhost:5173/editor` or use the Wiring lab
screen. The portal embeds the patched Velxio source editor from
`http://localhost:3081/editor`; that source frontend proxies simulator API calls
to the Docker container on `http://localhost:3080`.

Set `VITE_VELXIO_EMBED_URL` or `VITE_VELXIO_EDITOR_URL` to point the portal at a
hosted simulator editor. Without either value, production falls back to
`https://velxio.dev/editor`.

Useful commands:

```bash
npm run simulator:logs
npm run simulator:stop
npm run simulator:build
```

## Firebase Functions

```bash
cd functions
npm install
npm run deploy
```

The function namespace is `uboApi`; Firestore data is stored under `ubo/...`.
