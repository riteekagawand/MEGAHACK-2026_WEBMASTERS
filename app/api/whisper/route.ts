import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;

    if (!audio) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "DEEPGRAM_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const arrayBuffer = await audio.arrayBuffer();
    const mimeType = audio.type || "audio/webm";
    const contentType = mimeType.includes("webm")
      ? "audio/webm"
      : mimeType.includes("mp4")
        ? "audio/mp4"
        : "audio/webm";

    const url = new URL("https://api.deepgram.com/v1/listen");
    url.searchParams.set("model", "nova-3");
    url.searchParams.set("smart_format", "true");
    url.searchParams.set("language", "multi");
    url.searchParams.set("punctuate", "true");

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": contentType,
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Deepgram API error:", err);
      return NextResponse.json(
        { error: "Transcription failed", details: err },
        { status: response.status }
      );
    }

    const data = (await response.json()) as {
      results?: {
        channels?: Array<{
          alternatives?: Array<{ transcript?: string }>;
        }>;
      };
    };
    const transcript =
      data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
    return NextResponse.json({ text: transcript });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
