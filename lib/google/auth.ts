import { google, Auth } from "googleapis";

let authClient: Auth.GoogleAuth | null = null;

export function getGoogleAuth() {
  if (authClient) return authClient;

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY env vars must be set");
  }

  authClient = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics.readonly",
    ],
  });

  return authClient;
}
