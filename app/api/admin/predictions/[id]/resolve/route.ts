import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/service";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "EDITOR")) {
    return null;
  }
  return session.user;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { verdict, explanation } = body;

  if (!verdict || (verdict !== "RECEIPT" && verdict !== "BUST")) {
    return NextResponse.json({ message: "Verdict must be RECEIPT or BUST" }, { status: 400 });
  }

  const prediction = await prisma.prediction.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true, claim: true, takeId: true },
  });

  if (!prediction) {
    return NextResponse.json({ message: "Prediction not found" }, { status: 404 });
  }

  if (prediction.status !== "PENDING") {
    return NextResponse.json({ message: "Prediction already resolved" }, { status: 400 });
  }

  // Update prediction
  const updated = await prisma.prediction.update({
    where: { id },
    data: {
      status: verdict,
      result: explanation || `Manually resolved by admin as ${verdict}`,
      resolvedAt: new Date(),
    },
  });

  // Update user stats
  const userUpdate: { predictionCount: { increment: number }; correctPredictions?: { increment: number } } = {
    predictionCount: { increment: 1 },
  };
  if (verdict === "RECEIPT") {
    userUpdate.correctPredictions = { increment: 1 };
  }

  await prisma.user.update({
    where: { id: prediction.userId },
    data: userUpdate,
  });

  // Notify user
  createNotification({
    userId: prediction.userId,
    type: "PREDICTION_RESOLVED",
    title: verdict === "RECEIPT" ? "RECEIPT! Your prediction was correct!" : "BUST! Your prediction was wrong",
    body: prediction.claim.slice(0, 100),
    data: { predictionId: prediction.id, takeId: prediction.takeId, verdict },
  }).catch(() => {});

  return NextResponse.json({ prediction: updated });
}
