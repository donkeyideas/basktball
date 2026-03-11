import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Auto-mark as read when opened
    if (message.status === "UNREAD") {
      await prisma.contactMessage.update({
        where: { id },
        data: { status: "READ", readAt: new Date() },
      });
      message.status = "READ";
      message.readAt = new Date();
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, adminNote } = await request.json();

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      if (status === "READ" && !updateData.readAt) {
        updateData.readAt = new Date();
      }
      if (status === "REPLIED") {
        updateData.repliedAt = new Date();
      }
    }

    if (adminNote !== undefined) {
      updateData.adminNote = adminNote;
    }

    const message = await prisma.contactMessage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.contactMessage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
