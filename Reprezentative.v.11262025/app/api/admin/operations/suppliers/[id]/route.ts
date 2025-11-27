import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const {
      name,
      contactPerson,
      email,
      phone,
      country,
      supplierType,
      moq,
      leadTimeDays,
      qualityRating,
      onTimeRate,
      defectRate,
      communicationRating,
      notes,
    } = body;

    if (!name || !email || !country) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name,
        contactPerson,
        email,
        phone,
        country,
        supplierType,
        moq,
        leadTimeDays,
        qualityRating,
        onTimeRate,
        defectRate,
        communicationRating,
        notes,
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Update supplier error:", error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 },
    );
  }
}


