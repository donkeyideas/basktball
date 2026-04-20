import { NextResponse } from "next/server";
import { requireMobileUser, AuthError } from "@/lib/mobile-auth";
import { cache } from "@/lib/cache/redis";
import {
  createPresignedUploadUrl,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/r2";

export const dynamic = "force-dynamic";

const STORAGE_LIMIT_BYTES = 8 * 1024 * 1024 * 1024; // 8 GB
const MONTHLY_UPLOAD_LIMIT = 500_000;

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getMonthKey(): string {
  const now = new Date();
  return `r2:uploads:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const { contentType, fileSize } = await request.json();

    if (
      !contentType ||
      !ALLOWED_IMAGE_TYPES.includes(
        contentType as (typeof ALLOWED_IMAGE_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    if (!fileSize || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB" },
        { status: 400 }
      );
    }

    // Check storage limits
    const totalBytes = (await cache.get<number>("r2:storage:total_bytes")) || 0;
    if (totalBytes + fileSize > STORAGE_LIMIT_BYTES) {
      return NextResponse.json(
        { error: "Storage limit reached. Image uploads are temporarily disabled." },
        { status: 429 }
      );
    }

    const monthKey = getMonthKey();
    const monthlyUploads = (await cache.get<number>(monthKey)) || 0;
    if (monthlyUploads >= MONTHLY_UPLOAD_LIMIT) {
      return NextResponse.json(
        { error: "Monthly upload limit reached." },
        { status: 429 }
      );
    }

    const ext = EXTENSION_MAP[contentType] || "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const key = `court/${user.id}/${timestamp}-${random}.${ext}`;

    const { uploadUrl, publicUrl } = await createPresignedUploadUrl(
      key,
      contentType
    );

    cache.set("r2:storage:total_bytes", totalBytes + fileSize, 0).catch(() => {});
    cache.incr(monthKey).catch(() => {});

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Mobile upload presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
