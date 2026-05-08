import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCourtUser } from "@/lib/court/auth";
import { getMobileUser } from "@/lib/mobile-auth";

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await auth();
    let user = getCourtUser(session);
    if (!user) {
      const mobileUser = await getMobileUser(request);
      if (mobileUser) user = { id: mobileUser.id, role: mobileUser.role };
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Speech transcription not configured" }, { status: 500 });
    }

    // Send to Groq Whisper (free tier, OpenAI-compatible)
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, "audio.webm");
    whisperForm.append("model", "whisper-large-v3-turbo");
    whisperForm.append("language", "en");
    whisperForm.append("response_format", "verbose_json");
    whisperForm.append("temperature", "0");
    whisperForm.append("prompt", "This is a basketball take or opinion about NBA, players, teams, and games.");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq Whisper error:", response.status, err);
      return NextResponse.json({ error: `Transcription error (${response.status})` }, { status: 502 });
    }

    const result = await response.json();

    // verbose_json includes segments with no_speech_prob — filter high-silence segments
    if (result.segments?.length) {
      const voiced = result.segments.filter((s: any) => (s.no_speech_prob ?? 0) < 0.7);
      const text = voiced.map((s: any) => s.text?.trim()).filter(Boolean).join(" ");
      return NextResponse.json({ text });
    }

    return NextResponse.json({ text: result.text ?? "" });
  } catch (error: any) {
    console.error("Transcribe error:", error?.message ?? error);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}
