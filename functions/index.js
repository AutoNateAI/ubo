import admin from "firebase-admin";
import cors from "cors";
import express from "express";
import { onRequest } from "firebase-functions/v2/https";

admin.initializeApp();

const app = express();
const db = admin.firestore();
const jsonParser = express.json({ limit: "256kb" });

app.use(
  cors({
    origin: [
      /^http:\/\/localhost:\d+$/,
      /^https:\/\/autonateai\.github\.io$/,
      /^https:\/\/.*\.github\.io$/,
      /^https:\/\/ub\.autonateai\.com$/,
    ],
  }),
);
app.use(jsonParser);

function cleanString(value, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 4000) : fallback;
}

async function requireUser(req, res, next) {
  const header = req.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Missing Firebase ID token" });
    return;
  }

  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid Firebase ID token" });
  }
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ubo-api",
    namespace: "ubo",
    timestamp: new Date().toISOString(),
  });
});

app.post("/sessions", requireUser, async (req, res) => {
  const teamName = cleanString(req.body?.teamName, "Untitled team").slice(0, 90);
  const ref = db.collection("ubo").doc("sessions").collection("items").doc();

  await ref.set({
    ownerUid: req.user.uid,
    teamName,
    email: req.user.email || null,
    isAnonymous: Boolean(req.user.firebase?.sign_in_provider === "anonymous"),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    userAgent: req.get("user-agent") || null,
  });

  res.status(201).json({ sessionId: ref.id });
});

app.post("/actions", requireUser, async (req, res) => {
  const sessionId = cleanString(req.body?.sessionId).slice(0, 140);
  const kind = cleanString(req.body?.kind).slice(0, 40);
  const label = cleanString(req.body?.label).slice(0, 180);
  const detail =
    req.body?.detail && typeof req.body.detail === "object" && !Array.isArray(req.body.detail)
      ? req.body.detail
      : {};

  if (!sessionId || !kind || !label) {
    res.status(400).json({ error: "sessionId, kind, and label are required" });
    return;
  }

  const sessionRef = db.collection("ubo").doc("sessions").collection("items").doc(sessionId);
  const session = await sessionRef.get();
  if (!session.exists || session.data()?.ownerUid !== req.user.uid) {
    res.status(403).json({ error: "Session does not belong to user" });
    return;
  }

  await db.collection("ubo").doc("actionLogs").collection("items").add({
    ownerUid: req.user.uid,
    sessionId,
    kind,
    label,
    detail,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await sessionRef.set(
    {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      [`actionCounts.${kind}`]: admin.firestore.FieldValue.increment(1),
      lastActionLabel: label,
    },
    { merge: true },
  );

  res.status(201).json({ ok: true });
});

app.post("/reports", requireUser, async (req, res) => {
  const sessionId = cleanString(req.body?.sessionId).slice(0, 140);
  const teamName = cleanString(req.body?.teamName, "Untitled team").slice(0, 90);
  const notes = cleanString(req.body?.notes).slice(0, 4000);
  const score = Number.isFinite(Number(req.body?.score)) ? Number(req.body.score) : 0;

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const sessionRef = db.collection("ubo").doc("sessions").collection("items").doc(sessionId);
  const session = await sessionRef.get();
  if (!session.exists || session.data()?.ownerUid !== req.user.uid) {
    res.status(403).json({ error: "Session does not belong to user" });
    return;
  }

  const reportRef = db.collection("ubo").doc("reports").collection("items").doc(sessionId);
  await reportRef.set(
    {
      ownerUid: req.user.uid,
      sessionId,
      teamName,
      notes,
      score,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await sessionRef.set(
    {
      reportSubmittedAt: admin.firestore.FieldValue.serverTimestamp(),
      score,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  res.status(201).json({ ok: true, reportId: reportRef.id });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

export const uboApi = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "512MiB",
    maxInstances: 10,
    concurrency: 80,
    serviceAccount: "firebase-adminsdk-fbsvc@autonateai-learning-hub.iam.gserviceaccount.com",
    cors: false,
  },
  app,
);
