import { NextRequest, NextResponse } from "next/server";
import { assemblyai } from "@/lib/assemblyai/client";

export async function POST(request: NextRequest) {
  try {
    const { audioUrl, sessionId } = await request.json();

    if (!audioUrl) {
      return NextResponse.json(
        { error: "audioUrl is required" },
        { status: 400 }
      );
    }

    // Start transcription
    const transcript = await assemblyai.transcripts.transcribe({
      audio: audioUrl,
    });

    return NextResponse.json({
      transcriptionId: transcript.id,
      status: transcript.status,
      transcript: transcript.text || "",
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to start transcription" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transcriptionId = searchParams.get("id");

    if (!transcriptionId) {
      return NextResponse.json(
        { error: "transcriptionId is required" },
        { status: 400 }
      );
    }

    const transcript = await assemblyai.transcripts.get(transcriptionId);

    return NextResponse.json({
      transcriptionId: transcript.id,
      status: transcript.status,
      transcript: transcript.text || "",
    });
  } catch (error) {
    console.error("Get transcription error:", error);
    return NextResponse.json(
      { error: "Failed to get transcription" },
      { status: 500 }
    );
  }
}
