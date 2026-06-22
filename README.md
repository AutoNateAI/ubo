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
open http://localhost:3080/editor
```

From the UBO lab screen, use **Open real simulator**. In local development it
opens `http://localhost:3080/editor`; in production it uses
`VITE_VELXIO_EDITOR_URL` when set, otherwise it falls back to `velxio.dev`.

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
