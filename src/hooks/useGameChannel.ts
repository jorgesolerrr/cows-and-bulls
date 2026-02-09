import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { channelRegistry } from "@/lib/game-channel-registry";
import { useAuthStore } from "@/store/auth-store";
import { useGameStore } from "@/store/game-store";
import { gameService } from "@/services/game-service";
import type { RealtimeChannel } from "@supabase/supabase-js";

const POLL_INTERVAL_MS = 5_000;

export function useGameChannel(gameId: string | null) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { user, profile } = useAuthStore();
  const { setGame, setPlayers, setGuesses } = useGameStore();

  // ── refreshGameState (stable) ──────────────────────────────────────────
  const refreshGameState = useCallback(
    async (gId: string) => {
      try {
        const [game, players, guesses] = await Promise.all([
          gameService.fetchGame(gId),
          gameService.fetchPlayers(gId),
          gameService.fetchGuesses(gId),
        ]);
        setGame(game);
        setPlayers(players);
        setGuesses(guesses);
      } catch {
        // ignore errors during refresh
      }
    },
    [setGame, setPlayers, setGuesses]
  );

  // ── Channel lifecycle (acquire / release) ──────────────────────────────
  useEffect(() => {
    if (!gameId || !user || !profile) return;

    const key = `game:${gameId}`;
    let entry = channelRegistry.get(key);

    if (entry) {
      // Reuse existing channel – just bump the ref count.
      entry.refCount++;
    } else {
      // Create a brand-new channel and register it.
      const channel = supabase.channel(key, {
        config: { presence: { key: user.id } },
      });

      entry = { channel, refCount: 1, handlersRegistered: false };
      channelRegistry.set(key, entry);
    }

    const channel = entry.channel;
    channelRef.current = channel;

    // Register broadcast + presence handlers once per channel instance.
    if (!entry.handlersRegistered) {
      entry.handlersRegistered = true;

      // Presence
      channel.on("presence", { event: "sync" }, () => {
        // Can be used to show online status
      });

      // Broadcast events → refresh from DB
      const refreshEvents = [
        "player_joined",
        "player_ready",
        "game_started",
        "guess_made",
        "turn_changed",
        "game_finished",
      ];

      for (const event of refreshEvents) {
        channel.on("broadcast", { event }, async () => {
          await refreshGameState(gameId);
        });
      }

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            display_name: profile.display_name,
            at: new Date().toISOString(),
          });

          // Initial fetch
          await refreshGameState(gameId);
        }
      });
    } else {
      // Channel already subscribed – just do an immediate refresh so this
      // screen starts with the latest state.
      refreshGameState(gameId);
    }

    // Cleanup: decrement refCount; only destroy when nobody uses it.
    return () => {
      channelRef.current = null;
      const current = channelRegistry.get(key);
      if (current) {
        current.refCount--;
        if (current.refCount <= 0) {
          channelRegistry.delete(key);
          supabase.removeChannel(current.channel);
        }
      }
    };
  }, [gameId, user?.id, profile?.display_name, refreshGameState]);

  // ── Polling safety net ─────────────────────────────────────────────────
  // Periodically refresh while the game is in "playing" status so the
  // client recovers even if a broadcast message was lost.
  useEffect(() => {
    if (!gameId) return;

    const interval = setInterval(() => {
      const game = useGameStore.getState().game;
      if (game?.status === "playing") {
        refreshGameState(gameId);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [gameId, refreshGameState]);

  // ── broadcast helper ───────────────────────────────────────────────────
  const broadcast = useCallback(
    async (event: string, payload: Record<string, unknown> = {}) => {
      if (channelRef.current) {
        await channelRef.current.send({
          type: "broadcast",
          event,
          payload: { ...payload, game_id: gameId },
        });
      }
    },
    [gameId]
  );

  return { broadcast, refreshGameState };
}
