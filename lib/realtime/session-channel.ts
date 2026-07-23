import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedGameData, SessionMember, SharedState } from "./types";

export function createSessionChannel(client: SupabaseClient, code: string, member: SessionMember, onState: (state: SharedState) => void, onPresence: (members: SessionMember[]) => void, onPersisted?: (state: SharedState, game?: NormalizedGameData) => void) {
  const channel: RealtimeChannel = client.channel(`macroboard:${code}`, { config: { broadcast: { self: false }, presence: { key: member.memberId } } });
  channel.on("broadcast", { event: "state" }, ({ payload }) => onState(payload as SharedState));
  channel.on("presence", { event: "sync" }, () => {
    const raw = channel.presenceState<SessionMember>();
    onPresence(Object.values(raw).flatMap((entries) => entries));
  });
  channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "macroboard_sessions", filter: `code=eq.${code}` }, ({ new: row }) => {
    onPersisted?.(row.shared_state as SharedState, row.game_data as NormalizedGameData | undefined);
  });
  channel.subscribe(async (status) => { if (status === "SUBSCRIBED") await channel.track(member); });
  return {
    channel,
    send: (state: SharedState) => channel.send({ type: "broadcast", event: "state", payload: state }),
    close: () => client.removeChannel(channel),
  };
}
