import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getCourtUser } from "@/lib/court/auth";

// Vote on a poll
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = getCourtUser(session);
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { id: takeId } = await params;
    const { optionId } = await request.json();

    if (!optionId) {
      return NextResponse.json({ message: "Option ID required" }, { status: 400 });
    }

    // Find the poll
    const poll = await prisma.poll.findUnique({
      where: { takeId },
      include: { options: true },
    });

    if (!poll) {
      return NextResponse.json({ message: "Poll not found" }, { status: 404 });
    }

    // Check if poll has expired
    if (poll.endsAt && new Date() > poll.endsAt) {
      return NextResponse.json({ message: "Poll has ended" }, { status: 400 });
    }

    // Check if option belongs to this poll
    const option = poll.options.find((o) => o.id === optionId);
    if (!option) {
      return NextResponse.json({ message: "Invalid option" }, { status: 400 });
    }

    // Check if user already voted
    const existingVote = await prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId: poll.id, userId: user.id } },
    });

    if (existingVote) {
      return NextResponse.json({ message: "Already voted" }, { status: 409 });
    }

    // Cast vote
    await prisma.$transaction([
      prisma.pollVote.create({
        data: {
          pollId: poll.id,
          optionId,
          userId: user.id,
        },
      }),
      prisma.pollOption.update({
        where: { id: optionId },
        data: { voteCount: { increment: 1 } },
      }),
      prisma.poll.update({
        where: { id: poll.id },
        data: { totalVotes: { increment: 1 } },
      }),
    ]);

    // Return updated poll
    const updated = await prisma.poll.findUnique({
      where: { id: poll.id },
      include: {
        options: { orderBy: { position: "asc" } },
        votes: {
          where: { userId: user.id },
          select: { optionId: true },
        },
      },
    });

    return NextResponse.json({ poll: updated });
  } catch (error) {
    console.error("Poll vote error:", error);
    return NextResponse.json({ message: "Failed to vote" }, { status: 500 });
  }
}
