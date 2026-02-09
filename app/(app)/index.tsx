import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { useGameStore } from "@/store/game-store";
import { useLobbyChannel } from "@/hooks/useLobbyChannel";
import { gameService } from "@/services/game-service";
import { PlayerCard } from "@/components/PlayerCard";
import { GameInviteModal } from "@/components/GameInviteModal";

export default function LobbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  const {
    onlinePlayers,
    pendingInvite,
    sentInviteGameId,
    setPendingInvite,
    setSentInviteGameId,
    setGame,
    setError,
  } = useGameStore();
  const { sendInvite, sendDecline, sendAccepted } = useLobbyChannel();

  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Presence auto-syncs, just a brief delay for UX
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  }, []);

  // Send invite to a player
  const handleInvite = async (targetUserId: string, targetName: string) => {
    if (!user || !profile) return;
    useGameStore.getState().resetGame();
    setLoading(true);
    try {
      const game = await gameService.createGame(user.id, targetUserId);
      setSentInviteGameId(game.id);
      setGame(game);

      await sendInvite({
        from_user_id: user.id,
        from_display_name: profile.display_name,
        game_id: game.id,
        game_code: game.code,
      });

      // Navigate to game lobby
      router.push(`/(app)/game/lobby/${game.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create game";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  // Accept incoming invite
  const handleAcceptInvite = async () => {
    if (!user || !pendingInvite) return;
    useGameStore.getState().resetGame();
    setLoading(true);
    try {
      const player = await gameService.joinGame(
        pendingInvite.game_id,
        user.id
      );
      await sendAccepted(pendingInvite.game_id);
      const game = await gameService.fetchGame(pendingInvite.game_id);
      setGame(game);
      setPendingInvite(null);
      router.push(`/(app)/game/lobby/${pendingInvite.game_id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  // Decline invite
  const handleDeclineInvite = async () => {
    if (!pendingInvite) return;
    await sendDecline(pendingInvite.game_id);
    setPendingInvite(null);
  };

  // Join by code
  const handleJoinByCode = async () => {
    if (!user || !joinCode.trim()) return;
    useGameStore.getState().resetGame();
    setLoading(true);
    try {
      const { game } = await gameService.joinGameByCode(
        joinCode.trim(),
        user.id
      );
      setGame(game);
      setJoinCode("");
      router.push(`/(app)/game/lobby/${game.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-graphite-950">
      <FlatList
        data={onlinePlayers}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Welcome */}
            <Text className="text-graphite-50 text-2xl font-bold mb-1">
              Welcome, {profile?.display_name || "Player"}
            </Text>
            <Text className="text-graphite-400 text-sm mb-6">
              Find an opponent and start playing
            </Text>

            {/* Join by code */}
            <View className="bg-graphite-800 rounded-xl p-4 mb-6 border border-graphite-700">
              <Text className="text-graphite-300 text-sm mb-3">
                Join a game by code
              </Text>
              <View className="flex-row gap-3">
                <TextInput
                  className="flex-1 bg-graphite-900 text-graphite-50 rounded-xl px-4 py-3 text-base font-mono tracking-widest border border-graphite-600 text-center"
                  placeholder="ABCD12"
                  placeholderTextColor="#464356"
                  value={joinCode}
                  onChangeText={(t) => setJoinCode(t.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                />
                <TouchableOpacity
                  className={`px-5 rounded-xl justify-center ${
                    !joinCode.trim() || loading
                      ? "bg-graphite-700"
                      : "bg-lavender-400"
                  }`}
                  onPress={handleJoinByCode}
                  disabled={!joinCode.trim() || loading}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`font-semibold ${
                      !joinCode.trim() || loading
                        ? "text-graphite-500"
                        : "text-white"
                    }`}
                  >
                    Join
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Online players header */}
            <View className="flex-row items-center mb-3">
              <Text className="text-graphite-50 text-lg font-semibold flex-1">
                Online Players
              </Text>
              <View className="bg-lavender-800 rounded-full px-3 py-1">
                <Text className="text-lavender-300 text-xs font-semibold">
                  {onlinePlayers.length} online
                </Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <PlayerCard
            player={item}
            onInvite={() => handleInvite(item.user_id, item.display_name)}
            disabled={loading || !!sentInviteGameId}
          />
        )}
        ListEmptyComponent={
          <View className="py-12 items-center">
            <Text className="text-graphite-500 text-lg mb-2">
              No players online
            </Text>
            <Text className="text-graphite-600 text-sm text-center px-8">
              Share your game code with a friend, or wait for someone to come
              online
            </Text>
          </View>
        }
      />

      {/* Invite modal */}
      <GameInviteModal
        invite={pendingInvite}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
        loading={loading}
      />
    </View>
  );
}
