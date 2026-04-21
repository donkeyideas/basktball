import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser, AuthError } from "@/lib/mobile-auth";
import { detectPrediction } from "@/lib/court/prediction-detector";
import { createNotification } from "@/lib/notifications/service";
import { extractFirstUrl } from "@/lib/content/url-parser";
import { unfurlUrl } from "@/lib/content/unfurl";
import { extractMentions, resolveMentionedUserIds } from "@/lib/content/mention-parser";

// POST /api/mobile/takes - Create a take
export async function POST(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const { content, gameId, parentId, tags, pollOptions, pollDuration, quarter, gameClock, mediaUrl, mediaUrls } = await request.json();

    // Support both mediaUrls (array, new) and mediaUrl (string, legacy)
    const resolvedMediaUrls: string[] = mediaUrls && Array.isArray(mediaUrls)
      ? mediaUrls.slice(0, 4).filter((u: string) => typeof u === "string" && u.length > 0)
      : mediaUrl ? [mediaUrl] : [];

    if ((!content || content.trim().length === 0) && resolvedMediaUrls.length === 0) {
      return NextResponse.json({ message: "Content or media is required" }, { status: 400 });
    }

    if (content && content.length > 2000) {
      return NextResponse.json({ message: "Take must be 2,000 characters or less" }, { status: 400 });
    }

    const take = await prisma.take.create({
      data: {
        content: (content || "").trim(),
        authorId: user.id,
        gameId: gameId || null,
        parentId: parentId || null,
        tags: tags || [],
        quarter: quarter || null,
        gameClock: gameClock || null,
        mediaUrl: resolvedMediaUrls[0] || null,
        mediaUrls: resolvedMediaUrls,
      },
      include: {
        author: {
          select: { id: true, displayName: true, name: true, avatarUrl: true, image: true },
        },
      },
    });

    // Create poll if options provided
    if (pollOptions && Array.isArray(pollOptions) && pollOptions.length >= 2 && pollOptions.length <= 4) {
      const durationHours = typeof pollDuration === "number" ? Math.min(pollDuration, 168) : 24;
      const endsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

      await prisma.poll.create({
        data: {
          takeId: take.id,
          endsAt,
          options: {
            create: pollOptions
              .filter((opt: string) => typeof opt === "string" && opt.trim().length > 0)
              .slice(0, 4)
              .map((text: string, i: number) => ({
                text: text.trim().slice(0, 80),
                position: i,
              })),
          },
        },
      });
    }

    // Update denormalized counts
    await prisma.user.update({
      where: { id: user.id },
      data: { takeCount: { increment: 1 } },
    });

    if (parentId) {
      const parentTake = await prisma.take.update({
        where: { id: parentId },
        data: { replyCount: { increment: 1 } },
        select: { authorId: true, content: true },
      });

      createNotification({
        userId: parentTake.authorId,
        type: "REPLY",
        title: "Someone replied to your take",
        body: content.trim().slice(0, 100),
        data: { takeId: take.id, parentTakeId: parentId },
        actorId: user.id,
      }).catch(() => {});
    }

    // Fire-and-forget: detect if this take is a prediction
    detectPrediction(take.id, content.trim(), user.id, gameId || null).catch(() => {});

    // Fire-and-forget: unfurl first URL for link preview
    const firstUrl = extractFirstUrl(content);
    if (firstUrl) {
      unfurlUrl(firstUrl).then(async (preview) => {
        if (preview) {
          await prisma.take.update({
            where: { id: take.id },
            data: { linkPreview: JSON.parse(JSON.stringify(preview)) },
          });
        }
      }).catch(() => {});
    }

    // Fire-and-forget: send mention notifications
    const mentionHandles = extractMentions(content);
    if (mentionHandles.length > 0) {
      resolveMentionedUserIds(mentionHandles).then(async (userIds) => {
        for (const mentionedUserId of userIds) {
          if (mentionedUserId !== user.id) {
            createNotification({
              userId: mentionedUserId,
              type: "MENTION",
              title: `${take.author.displayName || take.author.name || "Someone"} mentioned you`,
              body: content.trim().slice(0, 100),
              data: { takeId: take.id },
              actorId: user.id,
            }).catch(() => {});
          }
        }
      }).catch(() => {});
    }

    return NextResponse.json(take, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Create take error:", error);
    return NextResponse.json({ message: "Failed to create take" }, { status: 500 });
  }
}
