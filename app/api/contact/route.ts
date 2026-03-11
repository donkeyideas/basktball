import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Rate limit: max 3 messages per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.contactMessage.count({
      where: {
        email: email.trim().toLowerCase(),
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 }
      );
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    // Forward to Donkey Ideas centralized inbox
    try {
      await fetch("https://www.donkeyideas.com/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.DONKEY_IDEAS_CONTACT_API_KEY || "",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          message: `[${subject.trim()}] ${message.trim()}`,
          source: "basktball",
        }),
      });
    } catch (forwardError) {
      console.error("Forward to Donkey Ideas failed:", forwardError);
    }

    return NextResponse.json({
      success: true,
      id: contactMessage.id,
      message: "Your message has been sent successfully!",
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
