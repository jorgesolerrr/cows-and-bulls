import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Singleton channel registry.
//
// Supabase's internal `_remove(channel)` filters by *topic name*, not by
// object reference.  When both the lobby and play screens momentarily coexist
// during a `router.replace()` transition, the lobby's cleanup
// (`supabase.removeChannel`) removes the play screen's channel too – breaking
// all future broadcast delivery.
//
// This registry guarantees a single channel instance per game.  Multiple hook
// consumers share the same channel; it is only destroyed when the last one
// releases it (refCount → 0) or when `destroyGameChannel` is called
// explicitly (e.g. from `resetGame`).
//
// Lives in its own file to avoid circular dependencies between the game store
// and the useGameChannel hook.
// ---------------------------------------------------------------------------

export interface ChannelEntry {
  channel: RealtimeChannel;
  refCount: number;
  /** Whether broadcast event handlers have been wired up already. */
  handlersRegistered: boolean;
}

export const channelRegistry = new Map<string, ChannelEntry>();

/**
 * Forcefully tear down the channel for a given `gameId`.
 * Safe to call even if no channel exists.
 */
export function destroyGameChannel(gameId: string): void {
  const key = `game:${gameId}`;
  const entry = channelRegistry.get(key);
  if (entry) {
    channelRegistry.delete(key);
    supabase.removeChannel(entry.channel);
  }
}
