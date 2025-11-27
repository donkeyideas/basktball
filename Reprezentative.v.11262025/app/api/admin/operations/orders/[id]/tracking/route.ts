import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const { trackingNumber, carrier } = body as {
      trackingNumber?: string;
      carrier?: string;
    };

    if (!trackingNumber || !carrier) {
      return NextResponse.json(
        { error: "Tracking number and carrier are required" },
        { status: 400 },
      );
    }

    const now = new Date();

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        trackingNumber,
        carrier,
        shippedAt: { set: now },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Update tracking error:", error);
    return NextResponse.json(
      { error: "Failed to update tracking" },
      { status: 500 },
    );
  }
}


