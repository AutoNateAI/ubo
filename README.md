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

## Firebase Functions

```bash
cd functions
npm install
npm run deploy
```

The function namespace is `uboApi`; Firestore data is stored under `ubo/...`.
