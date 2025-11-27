import { NextRequest, NextResponse } from "next/server";
import { deepseek } from "@/lib/deepseek";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, price, cogsPerUnit } = body as {
      name: string;
      category: string;
      price: number;
      cogsPerUnit?: number | null;
    };

    if (!name || typeof price !== "number") {
      return NextResponse.json(
        { error: "Missing required product data" },
        { status: 400 },
      );
    }

    const messages = [
      {
        role: "system" as const,
        content:
          "You are a pricing strategist for a premium streetwear e-commerce brand. Respond with concise JSON only.",
      },
      {
        role: "user" as const,
        content: `Analyze optimal pricing for this product:

Product: ${name}
Category: ${category ?? "N/A"}
Current Price: ${price}
COGS Per Unit: ${cogsPerUnit ?? "unknown"}

Return JSON in this shape:
{
  "recommendedPrice": number,
  "reasoning": "short explanation"
}`,
      },
    ];

    const response = await deepseek.chat({
      messages,
      max_tokens: 400,
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(match[0]) as {
      recommendedPrice: number;
      reasoning: string;
    };

    return NextResponse.json({
      recommendedPrice: parsed.recommendedPrice,
      reasoning: parsed.reasoning,
    });
  } catch (error) {
    console.error("AI pricing error:", error);
    return NextResponse.json(
      { error: "Error generating pricing recommendation" },
      { status: 500 },
    );
  }
}


