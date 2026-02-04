import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET - List all draft prospects
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");

    const where = year ? { draftYear: parseInt(year) } : {};

    const prospects = await prisma.draftProspect.findMany({
      where,
      orderBy: { rank: "asc" },
    });

    return NextResponse.json({ success: true, prospects });
  } catch (error) {
    console.error("Error fetching draft prospects:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch draft prospects" },
      { status: 500 }
    );
  }
}

// POST - Create a new draft prospect
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const prospect = await prisma.draftProspect.create({
      data: {
        rank: body.rank,
        name: body.name,
        position: body.position,
        school: body.school,
        height: body.height,
        weight: body.weight,
        age: body.age,
        ppg: body.ppg,
        rpg: body.rpg,
        apg: body.apg,
        fgPct: body.fgPct,
        threePct: body.threePct,
        strengths: body.strengths || [],
        weaknesses: body.weaknesses || [],
        comparison: body.comparison,
        projectedPick: body.projectedPick,
        draftYear: body.draftYear || new Date().getFullYear(),
      },
    });

    return NextResponse.json({ success: true, prospect });
  } catch (error) {
    console.error("Error creating draft prospect:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create draft prospect" },
      { status: 500 }
    );
  }
}

// PUT - Update a draft prospect
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Prospect ID is required" },
        { status: 400 }
      );
    }

    const prospect = await prisma.draftProspect.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, prospect });
  } catch (error) {
    console.error("Error updating draft prospect:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update draft prospect" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a draft prospect
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Prospect ID is required" },
        { status: 400 }
      );
    }

    await prisma.draftProspect.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft prospect:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete draft prospect" },
      { status: 500 }
    );
  }
}
