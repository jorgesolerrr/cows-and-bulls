import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { useGameStore } from "@/store/game-store";
import { useGameChannel } from "@/hooks/useGameChannel";
import { gameService } from "@/services/game-service";
import { SecretInput } from "@/components/SecretInput";
import { StatusBadge } from "@/components/StatusBadge";

export default function GameLobbyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { game, players, mySecret, setMySecret, setGame } = useGameStore();
  const { broadcast, refreshGameState } = useGameChannel(id ?? null);

  const [secretSubmitted, setSecretSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const myPlayer = players.find((p) => p.user_id === user?.id);
  const opponent = players.find((p) => p.user_id !== user?.id);
  const opponentReady = opponent?.ready ?? false;
  const bothReady = myPlayer?.ready && opponentReady;

  // When game transitions to playing, navigate to game board
  useEffect(() => {
    if (game?.status === "playing" && id) {
      router.replace(`/(app)/game/play/${id}`);
    }
  }, [game?.status, id]);

  // When game is abandoned or finished (by opponent), go back to home lobby
  useEffect(() => {
    if (game?.status === "abandoned" || game?.status === "finished") {
      Alert.alert("Game Over", "The game has been cancelled.", [
        {
          text: "OK",
          onPress: () => {
            useGameStore.getState().resetGame();
            router.replace("/(app)");
          },
        },
      ]);
    }
  }, [game?.status]);

  const handleSetSecret = async (secret: string) => {
    if (!id || !user) return;
    setLoading(true);
    try {
      await gameService.setSecret(id, user.id, secret);
      await gameService.setReady(id, user.id);
      setMySecret(secret);
      setSecretSubmitted(true);
      await broadcast("player_ready", { user_id: user.id, ready: true });

      // Re-fetch to check if both ready
      await refreshGameState(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-start when both are ready
  useEffect(() => {
    if (bothReady && game?.status !== "playing" && user && id) {
      // Only the game creator starts the game to avoid race conditions
      if (game?.created_by === user.id) {
        startGame();
      }
    }
  }, [bothReady, game?.status]);

  const startGame = async () => {
    if (!id) return;
    try {
      await gameService.startGame(id);
      await broadcast("game_started", { current_turn: user?.id });
      // Refresh so the creator also sees status = 'playing' and navigates
      await refreshGameState(id);
    } catch (err: unknown) {
      // The other player might have started it
      await refreshGameState(id);
    }
  };

  if (!game) {
    return (
      <View className="flex-1 bg-graphite-950 items-center justify-center">
        <ActivityIndicator size="large" color="#4e33ff" />
        <Text className="text-graphite-400 mt-4">Loading game...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-graphite-950 px-6" style={{ paddingTop: 24 + insets.top, paddingBottom: 24 + insets.bottom }}>
      {/* Game code */}
      <View className="items-center mb-8">
        <Text className="text-graphite-400 text-sm mb-1">Game Code</Text>
        <Text className="text-lavender-300 text-3xl font-mono font-bold tracking-widest">
          {game.code}
        </Text>
        <Text className="text-graphite-500 text-xs mt-1">
          Share this code with your friend
        </Text>
      </View>

      {/* Players */}
      <View className="bg-graphite-800 rounded-xl p-4 mb-6 border border-graphite-700">
        <Text className="text-graphite-300 text-sm mb-3 font-semibold">
          Players
        </Text>

        {/* You */}
        <View className="flex-row items-center mb-3">
          <View className="w-8 h-8 rounded-full bg-lavender-800 items-center justify-center mr-3">
            <Text className="text-lavender-300 font-bold">Y</Text>
          </View>
          <Text className="text-graphite-50 flex-1 font-medium">
            You {myPlayer ? `(Seat ${myPlayer.seat})` : ""}
          </Text>
          <StatusBadge
            status={
              secretSubmitted || myPlayer?.ready ? "your-turn" : "waiting"
            }
          />
        </View>

        {/* Opponent */}
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-dusty-taupe-800 items-center justify-center mr-3">
            <Text className="text-dusty-taupe-300 font-bold">
              {opponent ? "O" : "?"}
            </Text>
          </View>
          <Text className="text-graphite-50 flex-1 font-medium">
            {opponent ? `Opponent (Seat ${opponent.seat})` : "Waiting for opponent..."}
          </Text>
          {opponent && (
            <StatusBadge
              status={opponentReady ? "your-turn" : "waiting"}
            />
          )}
        </View>
      </View>

      {/* Secret input */}
      {opponent ? (
        <SecretInput
          onSubmit={handleSetSecret}
          disabled={loading || secretSubmitted}
          submitted={secretSubmitted}
        />
      ) : (
        <View className="bg-graphite-800 rounded-xl p-6 items-center border border-graphite-700">
          <ActivityIndicator size="small" color="#7a66ff" />
          <Text className="text-graphite-400 mt-3 text-center">
            Waiting for your opponent to join...
          </Text>
        </View>
      )}

      {/* Status message */}
      {secretSubmitted && !bothReady && (
        <View className="mt-4 items-center">
          <Text className="text-graphite-400 text-sm">
            Waiting for opponent to be ready...
          </Text>
        </View>
      )}

      {bothReady && (
        <View className="mt-4 items-center">
          <ActivityIndicator size="small" color="#4e33ff" />
          <Text className="text-lavender-300 text-sm mt-2 font-semibold">
            Both ready! Starting game...
          </Text>
        </View>
      )}

      {/* Leave button */}
      <TouchableOpacity
        className="mt-auto bg-graphite-800 rounded-xl py-3 items-center border border-graphite-700"
        onPress={() => {
          Alert.alert("Leave Game", "Are you sure you want to leave?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Leave",
              style: "destructive",
              onPress: async () => {
                if (id) {
                  try {
                    await gameService.abandonGame(id);
                    await broadcast("game_finished", { winner_id: null });
                  } catch {
                    // ignore
                  }
                }
                useGameStore.getState().resetGame();
                router.replace("/(app)");
              },
            },
          ]);
        }}
        activeOpacity={0.7}
      >
        <Text className="text-rosy-taupe-400 font-semibold">Leave Game</Text>
      </TouchableOpacity>
    </View>
  );
}
