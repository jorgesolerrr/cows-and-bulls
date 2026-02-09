import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { useGameStore } from "@/store/game-store";
import { useGameChannel } from "@/hooks/useGameChannel";
import { gameService } from "@/services/game-service";
import { GuessInput } from "@/components/GuessInput";
import { GuessHistory } from "@/components/GuessHistory";
import { StatusBadge } from "@/components/StatusBadge";

export default function GamePlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { game, players, guesses, mySecret } = useGameStore();
  const { broadcast, refreshGameState } = useGameChannel(id ?? null);

  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const isMyTurn = game?.current_turn === user?.id;
  const isFinished = game?.status === "finished" || game?.status === "abandoned";
  const didIWin = game?.winner === user?.id;

  const opponent = players.find((p) => p.user_id !== user?.id);
  const myGuesses = guesses.filter((g) => g.guesser_id === user?.id);
  const opponentGuesses = guesses.filter((g) => g.guesser_id !== user?.id);

  useEffect(() => {
    if (isFinished) {
      setShowResult(true);
    }
  }, [isFinished]);

  const handleGuess = async (guess: string) => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const result = await gameService.makeGuess(id, guess);

      if (result.status === "finished") {
        await broadcast("game_finished", { winner_id: result.winner });
      } else {
        await broadcast("guess_made", { guesser_id: user.id });
        await broadcast("turn_changed", { current_turn: result.current_turn });
      }

      await refreshGameState(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    Alert.alert("Abandon Game", "Your opponent will win. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Abandon",
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
  };

  return (
    <View className="flex-1 bg-graphite-950">
      {/* Header bar */}
      <View className="bg-graphite-900 px-4 pb-3 flex-row items-center border-b border-graphite-800" style={{ paddingTop: 12 + insets.top }}>
        <View className="flex-1">
          <Text className="text-graphite-50 font-semibold text-base">
            Game #{game?.code}
          </Text>
          <Text className="text-graphite-400 text-xs">
            vs {opponent ? "Opponent" : "..."} | Turn {guesses.length + 1}
          </Text>
        </View>

        <StatusBadge
          status={
            isFinished
              ? "finished"
              : isMyTurn
              ? "your-turn"
              : "opponent-turn"
          }
        />
      </View>

      {/* My secret display */}
      <View className="bg-graphite-800/50 px-4 py-2 flex-row items-center justify-between border-b border-graphite-800">
        <Text className="text-graphite-400 text-xs">Your secret:</Text>
        <Text className="text-lavender-300 font-mono font-bold tracking-widest text-sm">
          {mySecret || "****"}
        </Text>
      </View>

      {/* Guess history */}
      <View className="flex-1 px-4 pt-3">
        <GuessHistory guesses={guesses} currentUserId={user?.id ?? ""} />
      </View>

      {/* Guess input */}
      {!isFinished && (
        <View className="px-4 pb-4">
          <GuessInput
            onSubmit={handleGuess}
            disabled={loading || !isMyTurn}
            isMyTurn={isMyTurn}
          />
        </View>
      )}

      {/* Abandon button */}
      {!isFinished && (
        <TouchableOpacity
          className="mx-4 py-2 items-center"
          style={{ marginBottom: 16 + insets.bottom }}
          onPress={handleLeave}
          activeOpacity={0.6}
        >
          <Text className="text-rosy-taupe-500 text-sm">Abandon Game</Text>
        </TouchableOpacity>
      )}

      {/* Result modal */}
      <Modal visible={showResult} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="bg-graphite-800 rounded-2xl p-8 w-full max-w-sm border border-graphite-600 items-center">
            <Text
              className={`text-5xl mb-4 ${
                didIWin ? "text-lavender-300" : "text-rosy-taupe-400"
              }`}
            >
              {game?.status === "abandoned"
                ? "Game Abandoned"
                : didIWin
                ? "You Won!"
                : "You Lost"}
            </Text>

            <Text className="text-graphite-50 text-2xl font-bold mb-2">
              {game?.status === "abandoned"
                ? "Game Over"
                : didIWin
                ? "Congratulations!"
                : "Better luck next time"}
            </Text>

            <Text className="text-graphite-400 text-center mb-6">
              Game finished in {guesses.length} turns
            </Text>

            <View className="flex-row gap-8 mb-8">
              <View className="items-center">
                <Text className="text-graphite-400 text-xs mb-1">
                  Your guesses
                </Text>
                <Text className="text-lavender-300 text-2xl font-bold">
                  {myGuesses.length}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-graphite-400 text-xs mb-1">
                  Their guesses
                </Text>
                <Text className="text-dusty-taupe-300 text-2xl font-bold">
                  {opponentGuesses.length}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="bg-lavender-400 rounded-xl py-3 px-8 w-full items-center"
              onPress={() => {
                setShowResult(false);
                useGameStore.getState().resetGame();
                router.replace("/(app)");
              }}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">
                Back to Lobby
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
