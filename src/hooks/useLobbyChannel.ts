import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { useGameStore } from "@/store/game-store";
import type { OnlinePlayer, GameInvite } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useLobbyChannel() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { user, profile } = useAuthStore();
  const { setOnlinePlayers, setPendingInvite } = useGameStore();

  useEffect(() => {
    if (!user || !profile) return;

    const channel = supabase.channel("lobby", {
      config: { presence: { key: user.id } },
    });

    // Presence sync
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const players: OnlinePlayer[] = [];
      for (const [, presences] of Object.entries(state)) {
        const p = presences[0] as unknown as OnlinePlayer;
        if (p?.user_id && p.user_id !== user.id) {
          players.push(p);
        }
      }
      setOnlinePlayers(players);
    });

    // Broadcast: game invite
    channel.on("broadcast", { event: "game_invite" }, ({ payload }) => {
      const invite = payload as GameInvite;
      if (invite.from_user_id !== user.id) {
        setPendingInvite(invite);
      }
    });

    channel.on("broadcast", { event: "invite_declined" }, ({ payload }) => {
      const { game_id } = payload as { game_id: string; by_user_id: string };
      const sentId = useGameStore.getState().sentInviteGameId;
      if (sentId === game_id) {
        useGameStore.getState().setSentInviteGameId(null);
        useGameStore.getState().setError("Invite was declined");
      }
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: user.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user?.id, profile?.display_name]);

  const sendInvite = useCallback(
    async (invite: GameInvite) => {
      if (channelRef.current) {
        await channelRef.current.send({
          type: "broadcast",
          event: "game_invite",
          payload: invite,
        });
      }
    },
    []
  );

  const sendDecline = useCallback(
    async (gameId: string) => {
      if (channelRef.current && user) {
        await channelRef.current.send({
          type: "broadcast",
          event: "invite_declined",
          payload: { game_id: gameId, by_user_id: user.id },
        });
      }
    },
    [user?.id]
  );

  const sendAccepted = useCallback(
    async (gameId: string) => {
      if (channelRef.current && user) {
        await channelRef.current.send({
          type: "broadcast",
          event: "invite_accepted",
          payload: { game_id: gameId, by_user_id: user.id },
        });
      }
    },
    [user?.id]
  );

  return { sendInvite, sendDecline, sendAccepted };
}
