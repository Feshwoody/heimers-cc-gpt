import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sha256 } from "@/lib/session-utils";
import type { NormalizedGameData } from "@/lib/realtime/types";

const attempts = new Map<string, { count: number; reset: number }>();
const MAX_BYTES = 180_000;
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const now = Date.now(); const entry = attempts.get(ip);
  if (entry && entry.reset > now && entry.count >= 40) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  attempts.set(ip, entry && entry.reset > now ? { ...entry, count: entry.count + 1 } : { count: 1, reset: now + 60_000 });
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  const client = getSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "online_mode_not_configured" }, { status: 503 });
  let body: { sessionCode?: string; connectorSecret?: string; normalizedGameData?: NormalizedGameData; matchEnded?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (!body.sessionCode?.match(/^[A-HJ-NP-Z2-9]{6}$/) || !body.connectorSecret || body.connectorSecret.length > 256 || (!body.normalizedGameData && !body.matchEnded)) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const { data: session } = await client.from("macroboard_sessions").select("id,expires_at,shared_state").eq("code", body.sessionCode).maybeSingle();
  if (!session) return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  if (new Date(session.expires_at).getTime() <= now) return NextResponse.json({ error: "session_expired" }, { status: 410 });
  const expected = (session.shared_state as { connectorSecretHash?: string })?.connectorSecretHash;
  if (!expected || await sha256(body.connectorSecret) !== expected) return NextResponse.json({ error: "invalid_connector_secret" }, { status: 401 });
  const gameData = body.matchEnded ? { status: "ended", updatedAt: new Date().toISOString() } : { ...body.normalizedGameData, status: "active" };
  const { error } = await client.from("macroboard_sessions").update({ game_data: gameData, updated_at: new Date().toISOString() }).eq("id", session.id);
  if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });
  await client.from("macroboard_events").insert({ session_id: session.id, source: "connector", event_type: body.matchEnded ? "match_ended" : "game_data", payload: { updatedAt: gameData.updatedAt }, game_time_seconds: body.normalizedGameData ? Math.floor(body.normalizedGameData.gameTime) : null });
  return NextResponse.json({ ok: true });
}
