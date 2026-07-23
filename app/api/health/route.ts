import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/version";
import { isOnlineConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export function GET() {
  const supabase = isOnlineConfigured();
  return NextResponse.json(
    { status: "ok", supabase, realtime: supabase, version: APP_VERSION },
    { headers: { "Cache-Control": "no-store" } },
  );
}
