import { NextResponse } from "next/server";
import {
  CACHE_TTL_MS,
  SNAPSHOT_SOURCE,
  getLegacyOutbreakFallback,
  getLatestSnapshot,
  isSnapshotFresh,
  refreshAndStoreSnapshot,
} from "@/lib/services/outbreaks";

let refreshPromise: Promise<unknown> | null = null;
let nextGeminiRetryAt = 0;
const RETRY_COOLDOWN_MS = 5 * 60 * 1000;

async function refreshSnapshotWithLock() {
  if (!refreshPromise) {
    refreshPromise = refreshAndStoreSnapshot().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function GET() {
  try {
    const latest = await getLatestSnapshot();

    if (latest && isSnapshotFresh({ fetchedAt: latest.fetchedAt })) {
      return NextResponse.json({
        outbreaks: latest.outbreaks,
        lastUpdated: new Date(latest.fetchedAt).toISOString(),
        sources: [SNAPSHOT_SOURCE],
        total: latest.outbreaks.length,
        cached: true,
        cacheTtlMs: CACHE_TTL_MS,
      });
    }

    if (Date.now() < nextGeminiRetryAt) {
      const legacy = await getLegacyOutbreakFallback();
      if (legacy.length) {
        return NextResponse.json({
          outbreaks: legacy,
          lastUpdated: new Date().toISOString(),
          sources: [SNAPSHOT_SOURCE],
          total: legacy.length,
          cached: true,
          stale: true,
          warning: "Gemini temporarily rate-limited, serving DB fallback",
          cacheTtlMs: CACHE_TTL_MS,
        });
      }
    }

    try {
      const outbreaks = (await refreshSnapshotWithLock()) as typeof latest.outbreaks;
      nextGeminiRetryAt = 0;
      return NextResponse.json({
        outbreaks,
        lastUpdated: new Date().toISOString(),
        sources: [SNAPSHOT_SOURCE],
        total: outbreaks.length,
        cached: false,
        cacheTtlMs: CACHE_TTL_MS,
      });
    } catch (refreshError) {
      const err = refreshError instanceof Error ? refreshError.message : String(refreshError);
      if (err.includes("429")) {
        nextGeminiRetryAt = Date.now() + RETRY_COOLDOWN_MS;
      }

      if (latest) {
        return NextResponse.json({
          outbreaks: latest.outbreaks,
          lastUpdated: new Date(latest.fetchedAt).toISOString(),
          sources: [SNAPSHOT_SOURCE],
          total: latest.outbreaks.length,
          cached: true,
          stale: true,
          warning: "Gemini refresh failed, serving stale DB snapshot",
          cacheTtlMs: CACHE_TTL_MS,
        });
      }

      const legacy = await getLegacyOutbreakFallback();
      if (legacy.length) {
        return NextResponse.json({
          outbreaks: legacy,
          lastUpdated: new Date().toISOString(),
          sources: [SNAPSHOT_SOURCE],
          total: legacy.length,
          cached: true,
          stale: true,
          warning: "Gemini refresh failed, serving legacy Outbreak collection",
          cacheTtlMs: CACHE_TTL_MS,
        });
      }
      throw refreshError;
    }
  } catch (error) {
    console.error("Error fetching outbreaks:", error);
    return NextResponse.json(
      {
        outbreaks: [],
        lastUpdated: new Date().toISOString(),
        sources: [SNAPSHOT_SOURCE],
        total: 0,
        cached: false,
        error: "Unable to fetch outbreak data",
      },
      { status: 502 }
    );
  }
}
