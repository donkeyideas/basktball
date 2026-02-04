import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - List historical records and seasons
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "all";

    let data: any = {};

    if (type === "all" || type === "records") {
      data.records = await prisma.historicalRecord.findMany({
        orderBy: { sortOrder: "asc" },
      });
    }

    if (type === "all" || type === "seasons") {
      data.seasons = await prisma.seasonHistory.findMany({
        orderBy: { year: "desc" },
      });
    }

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

// POST - Create a new record or season
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    let result;

    if (type === "record") {
      result = await prisma.historicalRecord.create({
        data: {
          category: data.category,
          record: data.record,
          holder: data.holder,
          date: data.date,
          details: data.details,
          sortOrder: data.sortOrder || 0,
        },
      });
    } else if (type === "season") {
      result = await prisma.seasonHistory.create({
        data: {
          year: data.year,
          champion: data.champion,
          mvp: data.mvp,
          finalsScore: data.finalsScore,
          topScorer: data.topScorer,
          topScorerPpg: data.topScorerPpg,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid type. Must be 'record' or 'season'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error creating history entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create history entry" },
      { status: 500 }
    );
  }
}

// PUT - Update a record or season
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    let result;

    if (type === "record") {
      result = await prisma.historicalRecord.update({
        where: { id },
        data,
      });
    } else if (type === "season") {
      result = await prisma.seasonHistory.update({
        where: { id },
        data,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid type. Must be 'record' or 'season'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating history entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update history entry" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a record or season
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: "ID and type are required" },
        { status: 400 }
      );
    }

    if (type === "record") {
      await prisma.historicalRecord.delete({
        where: { id },
      });
    } else if (type === "season") {
      await prisma.seasonHistory.delete({
        where: { id },
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid type. Must be 'record' or 'season'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting history entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete history entry" },
      { status: 500 }
    );
  }
}
