import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { SessionMember, SharedState } from "./types";

export function createSessionChannel(client: SupabaseClient, code: string, member: SessionMember, onState: (state: SharedState) => void, onPresence: (members: SessionMember[]) => void) {
  const channel: RealtimeChannel = client.channel(`macroboard:${code}`, { config: { broadcast: { self: false }, presence: { key: member.memberId } } });
  channel.on("broadcast", { event: "state" }, ({ payload }) => onState(payload as SharedState));
  channel.on("presence", { event: "sync" }, () => {
    const raw = channel.presenceState<SessionMember>();
    onPresence(Object.values(raw).flatMap((entries) => entries));
  });
  channel.subscribe(async (status) => { if (status === "SUBSCRIBED") await channel.track(member); });
  return {
    channel,
    send: (state: SharedState) => channel.send({ type: "broadcast", event: "state", payload: state }),
    close: () => client.removeChannel(channel),
  };
}
