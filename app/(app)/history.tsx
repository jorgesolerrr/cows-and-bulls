import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { gameService } from "@/services/game-service";
import type { GameResult, Profile } from "@/types";

type HistoryItem = GameResult & { opponent: Profile | null };

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      const data = await gameService.fetchHistory(user.id);
      setHistory(data);
    } catch {
      // ignore
    }
  }, [user?.id]);

  useEffect(() => {
    loadHistory().finally(() => setLoading(false));
  }, [loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const getResultLabel = (item: HistoryItem) => {
    if (item.status === "abandoned") return "Abandoned";
    if (item.winner_id === user?.id) return "Won";
    return "Lost";
  };

  const getResultColor = (item: HistoryItem) => {
    if (item.status === "abandoned") return "text-graphite-400";
    if (item.winner_id === user?.id) return "text-lavender-300";
    return "text-rosy-taupe-400";
  };

  if (loading) {
    return (
      <View className="flex-1 bg-graphite-950 items-center justify-center">
        <ActivityIndicator size="large" color="#4e33ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-graphite-950">
      <FlatList
        data={history}
        keyExtractor={(item) => item.game_id}
        contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const resultLabel = getResultLabel(item);
          const resultColor = getResultColor(item);

          return (
            <View className="bg-graphite-800 rounded-xl p-4 mb-3 border border-graphite-700">
              <View className="flex-row items-center mb-2">
                {/* Opponent avatar */}
                <View className="w-9 h-9 rounded-full bg-dusty-taupe-800 items-center justify-center mr-3">
                  <Text className="text-dusty-taupe-300 font-bold">
                    {item.opponent?.display_name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-graphite-50 font-medium">
                    vs {item.opponent?.display_name || "Unknown"}
                  </Text>
                  <Text className="text-graphite-500 text-xs">
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <Text className={`font-bold text-base ${resultColor}`}>
                  {resultLabel}
                </Text>
              </View>

              <View className="flex-row mt-1">
                <Text className="text-graphite-400 text-xs">
                  {item.turns_count} turns
                </Text>
                {item.duration_seconds && (
                  <Text className="text-graphite-500 text-xs ml-3">
                    {Math.floor(item.duration_seconds / 60)}m{" "}
                    {item.duration_seconds % 60}s
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Text className="text-graphite-500 text-lg mb-2">
              No games yet
            </Text>
            <Text className="text-graphite-600 text-sm text-center">
              Play some games and your history will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}
