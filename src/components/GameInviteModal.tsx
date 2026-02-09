import { View, Text, TouchableOpacity, Modal } from "react-native";
import type { GameInvite } from "@/types";

interface GameInviteModalProps {
  invite: GameInvite | null;
  onAccept: () => void;
  onDecline: () => void;
  loading?: boolean;
}

export function GameInviteModal({
  invite,
  onAccept,
  onDecline,
  loading,
}: GameInviteModalProps) {
  return (
    <Modal
      visible={!!invite}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="bg-graphite-800 rounded-2xl p-6 w-full max-w-sm border border-graphite-600">
          <Text className="text-graphite-50 text-xl font-bold text-center mb-2">
            Game Invite!
          </Text>

          <Text className="text-graphite-300 text-center mb-6">
            <Text className="text-lavender-300 font-semibold">
              {invite?.from_display_name}
            </Text>{" "}
            wants to play Cows & Bulls with you
          </Text>

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-graphite-700 rounded-xl py-3 items-center"
              onPress={onDecline}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text className="text-graphite-300 font-semibold">Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 rounded-xl py-3 items-center ${
                loading ? "bg-lavender-600" : "bg-lavender-400"
              }`}
              onPress={onAccept}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold">
                {loading ? "Joining..." : "Accept"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
