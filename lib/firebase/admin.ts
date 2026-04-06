import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getMessaging, Messaging } from "firebase-admin/messaging";

let adminApp: App | null = null;
let messaging: Messaging | null = null;

export async function getMessagingInstance(): Promise<Messaging | null> {
  if (messaging) return messaging;

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      console.error("FIREBASE_SERVICE_ACCOUNT not configured");
      return null;
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    if (getApps().length === 0) {
      adminApp = initializeApp({ credential: cert(serviceAccount) });
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
