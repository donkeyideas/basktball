import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getDualUser } from "@/lib/court/dual-auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDualUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify the take exists
    const take = await prisma.take.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, authorId: true },
    });

    if (!take) {
      return NextResponse.json(
        { message: "Take not found" },
        { status: 404 }
      );
    }

    // Check if an AgingTake already exists for this take
    const existing = await prisma.agingTake.findUnique({
      where: { takeId: id },
    });

    if (existing) {
      return NextResponse.json(
        { message: "This take is already marked for aging" },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { revisitDate, reason } = body;

    // Validate revisitDate
    if (!revisitDate) {
      return NextResponse.json(
        { message: "revisitDate is required" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(revisitDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { message: "revisitDate must be a valid date" },
        { status: 400 }
      );
    }

    // Must be in the future
    if (parsedDate <= new Date()) {
      return NextResponse.json(
        { message: "revisitDate must be in the future" },
        { status: 400 }
      );
    }

    // Validate reason (optional)
    const trimmedReason = reason && typeof reason === "string"
      ? reason.trim().slice(0, 500)
      : null;

    const agingTake = await prisma.agingTake.create({
      data: {
        takeId: id,
        userId: user.id,
        revisitDate: parsedDate,
        reason: trimmedReason,
        status: "AGING",
      },
      include: {
        take: {
          select: {
            id: true,
            content: true,
            authorId: true,
            createdAt: true,
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            name: true,
            avatarUrl: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ agingTake }, { status: 201 });
  } catch (error) {
    console.error("Create aging take error:", error);
    return NextResponse.json(
      { message: "Failed to create aging take" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getDualUser(request);
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Load the take to verify ownership
    const take = await prisma.take.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!take) {
      return NextResponse.json(
        { message: "Take not found" },
        { status: 404 }
      );
    }

    // Must be the take author
    if (take.authorId !== user.id) {
      return NextResponse.json(
        { message: "Only the take author can remove the aging marker" },
        { status: 403 }
      );
    }

    // Find and delete the AgingTake record
    const agingTake = await prisma.agingTake.findUnique({
      where: { takeId: id },
    });

    if (!agingTake) {
      return NextResponse.json(
        { message: "No aging record found for this take" },
        { status: 404 }
      );
    }

    await prisma.agingTake.delete({
      where: { takeId: id },
    });

    return NextResponse.json({ message: "Aging take removed" });
  } catch (error) {
    console.error("Delete aging take error:", error);
    return NextResponse.json(
      { message: "Failed to remove aging take" },
      { status: 500 }
    );
  }
}
