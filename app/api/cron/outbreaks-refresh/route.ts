import { NextRequest, NextResponse } from "next/server";
import { refreshAndStoreSnapshot, SNAPSHOT_SOURCE } from "@/lib/services/outbreaks";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // Allow local/dev if secret not configured

  const bearer = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");
  return bearer === `Bearer ${secret}` || headerSecret === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const outbreaks = await refreshAndStoreSnapshot();
    return NextResponse.json({
      ok: true,
      source: SNAPSHOT_SOURCE,
      total: outbreaks.length,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron refresh failed:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to refresh outbreaks snapshot" },
      { status: 502 }
    );
  }
}

