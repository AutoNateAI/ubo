import type { User } from "firebase/auth";

const fallbackApiUrl =
  "https://us-central1-autonateai-learning-hub.cloudfunctions.net/uboApi";

export const apiBaseUrl = (
  import.meta.env.VITE_FIREBASE_API_BASE_URL || fallbackApiUrl
).replace(/\/$/, "");

export type ActionKind =
  | "wiring"
  | "coding"
  | "driving"
  | "ai_prompt"
  | "race"
  | "report";

export type UboAction = {
  kind: ActionKind;
  label: string;
  detail: Record<string, unknown>;
  sessionId: string;
};

async function authHeaders(user: User) {
  return {
    Authorization: `Bearer ${await user.getIdToken()}`,
    "Content-Type": "application/json",
  };
}

export async function createSession(user: User, teamName: string) {
  const response = await fetch(`${apiBaseUrl}/sessions`, {
    method: "POST",
    headers: await authHeaders(user),
    body: JSON.stringify({ teamName }),
  });

  if (!response.ok) {
    throw new Error(`Session create failed: ${response.status}`);
  }

  return (await response.json()) as { sessionId: string };
}

export async function logAction(user: User, action: UboAction) {
  const response = await fetch(`${apiBaseUrl}/actions`, {
    method: "POST",
    headers: await authHeaders(user),
    body: JSON.stringify(action),
  });

  if (!response.ok) {
    throw new Error(`Action log failed: ${response.status}`);
  }
}

export async function submitReport(
  user: User,
  report: { sessionId: string; teamName: string; notes: string; score: number },
) {
  const response = await fetch(`${apiBaseUrl}/reports`, {
    method: "POST",
    headers: await authHeaders(user),
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    throw new Error(`Report submit failed: ${response.status}`);
  }
}
