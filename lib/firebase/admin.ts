import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getMessaging, Messaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/db/prisma";

let adminApp: App | null = null;
let messaging: Messaging | null = null;

/**
 * Load Firebase service account from Setting DB table first,
 * then fall back to FIREBASE_SERVICE_ACCOUNT env var.
 */
async function getServiceAccount(): Promise<object | null> {
  // 1. Try database (Setting table)
  try {
    const row = await prisma.setting.findUnique({
      where: { key: "FIREBASE_SERVICE_ACCOUNT" },
    });
    if (row?.value) {
      const parsed = JSON.parse(row.value);
      if (parsed?.project_id) {
        console.log("[Firebase] Loaded service account from DB");
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[Firebase] DB lookup failed, trying env var:", (err as Error).message);
  }

  // 2. Fall back to environment variable
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    console.log("[Firebase] Loaded service account from env var");
    return parsed;
  } catch {
    console.error("[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT env var");
    return null;
  }
}

export async function getMessagingInstance(): Promise<Messaging | null> {
  if (messaging) return messaging;

  try {
    const sa = await getServiceAccount();
    if (!sa) {
      console.error("[Firebase] Service account not configured (checked DB + env)");
      return null;
    }

    if (getApps().length === 0) {
      adminApp = initializeApp({ credential: cert(sa as Parameters<typeof cert>[0]) });
    } else {
      adminApp = getApps()[0];
    }

    messaging = getMessaging(adminApp);
    return messaging;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    return null;
  }
}
