import { View, Text, TouchableOpacity } from "react-native";
import type { OnlinePlayer } from "@/types";

interface PlayerCardProps {
  player: OnlinePlayer;
  onInvite?: () => void;
  disabled?: boolean;
}

export function PlayerCard({ player, onInvite, disabled }: PlayerCardProps) {
  return (
    <View className="flex-row items-center bg-graphite-800 rounded-xl px-4 py-3 mb-2">
      {/* Avatar placeholder */}
      <View className="w-10 h-10 rounded-full bg-lavender-800 items-center justify-center mr-3">
        <Text className="text-lavender-300 font-bold text-lg">
          {player.display_name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Name + status */}
      <View className="flex-1">
        <Text className="text-graphite-50 font-medium text-base">
          {player.display_name}
        </Text>
        <View className="flex-row items-center mt-0.5">
          <View className="w-2 h-2 rounded-full bg-lavender-300 mr-1.5" />
          <Text className="text-graphite-400 text-xs">Online</Text>
        </View>
      </View>

      {/* Invite button */}
      {onInvite && (
        <TouchableOpacity
          className={`px-4 py-2 rounded-lg ${
            disabled ? "bg-graphite-700" : "bg-lavender-400"
          }`}
          onPress={onInvite}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text
            className={`font-semibold text-sm ${
              disabled ? "text-graphite-500" : "text-white"
            }`}
          >
            Play
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
