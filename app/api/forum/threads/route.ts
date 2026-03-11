import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { generateSlug, sanitizeContent, requireAuth } from "@/lib/forum/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const categorySlug = searchParams.get("categorySlug");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const sort = searchParams.get("sort") || "latest";
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isDeleted: false };
    if (categoryId) where.categoryId = categoryId;
    if (categorySlug) where.category = { slug: categorySlug };

    let orderBy: Record<string, string>;
    switch (sort) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "hot":
        orderBy = { viewCount: "desc" };
        break;
      case "top":
        orderBy = { postCount: "desc" };
        break;
      default: // "latest"
        orderBy = { lastPostAt: "desc" };
    }

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, orderBy],
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          isPinned: true,
          isHot: true,
          tags: true,
          postCount: true,
          viewCount: true,
          lastPostAt: true,
          lastPostBy: true,
          createdAt: true,
          author: {
            select: { id: true, displayName: true, name: true, avatarUrl: true, image: true, role: true, favoriteTeamId: true },
          },
          category: {
            select: { id: true, name: true, slug: true, color: true },
          },
        },
      }),
      prisma.forumThread.count({ where }),
    ]);

    return NextResponse.json({
      threads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const user = requireAuth(session);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { title, content, categoryId, tags } = await request.json();

    if (!title?.trim() || !content?.trim() || !categoryId) {
      return NextResponse.json({ error: "Title, content, and category are required" }, { status: 400 });
    }

    if (title.trim().length > 200) {
      return NextResponse.json({ error: "Title must be 200 characters or less" }, { status: 400 });
    }

    // Verify category exists
    const category = await prisma.forumCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const slug = generateSlug(title.trim());
    const sanitizedContent = sanitizeContent(content);

    // Create thread + first post + update counters in transaction
    const thread = await prisma.$transaction(async (tx) => {
      const newThread = await tx.forumThread.create({
        data: {
          title: title.trim(),
          slug,
          categoryId,
          authorId: user.id,
          tags: tags || [],
          postCount: 1,
          lastPostAt: new Date(),
          lastPostBy: user.id,
        },
      });

      await tx.forumPost.create({
        data: {
          content: sanitizedContent,
          threadId: newThread.id,
          authorId: user.id,
          postNumber: 1,
        },
      });

      await tx.forumCategory.update({
        where: { id: categoryId },
        data: {
          threadCount: { increment: 1 },
          postCount: { increment: 1 },
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          threadCount: { increment: 1 },
          postCount: { increment: 1 },
        },
      });

      return newThread;
    });

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
