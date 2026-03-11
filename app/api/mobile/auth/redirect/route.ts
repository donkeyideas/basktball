import { NextRequest } from "next/server";

// HTTP 302 redirect to custom scheme URL
// Chrome Custom Tabs handle HTTP-level redirects to custom schemes via Android intents
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const user = searchParams.get("user");
  const scheme = searchParams.get("scheme") || "basktball";

  if (!token || !user) {
    return new Response("Missing parameters", { status: 400 });
  }

  const deepLink = `${scheme}://auth?token=${encodeURIComponent(token)}&user=${encodeURIComponent(user)}`;

  // Return HTTP 302 redirect - this is handled at the HTTP level by Chrome,
  // which delegates custom scheme URLs to Android's intent system
  return new Response(null, {
    status: 302,
    headers: {
      Location: deepLink,
      "Cache-Control": "no-store",
    },
  });
}
