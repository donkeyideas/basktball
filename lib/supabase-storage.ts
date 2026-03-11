import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

async function ensureAvatarsBucket(): Promise<void> {
  const supabase = getSupabase();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === "avatars");
  if (!exists) {
    const { error } = await supabase.storage.createBucket("avatars", { public: true });
    if (error) throw new Error(`Failed to create avatars bucket: ${error.message}`);
  }
}

export async function uploadAvatar(
  userId: string,
  base64Data: string,
  mimeType: string
): Promise<string> {
  await ensureAvatarsBucket();

  const extension = mimeType === "image/png" ? "png" : "jpg";
  const filePath = `avatars/${userId}/avatar.${extension}`;

  const buffer = Buffer.from(base64Data, "base64");

  const { error } = await getSupabase().storage.from("avatars").upload(filePath, buffer, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) throw new Error(`Storage upload error: ${error.message}`);

  const {
    data: { publicUrl },
  } = getSupabase().storage.from("avatars").getPublicUrl(filePath);

  return publicUrl;
}
