import { View, Text } from "react-native";

interface StatusBadgeProps {
  status: "online" | "offline" | "your-turn" | "opponent-turn" | "finished" | "waiting";
}

const config: Record<
  StatusBadgeProps["status"],
  { bg: string; text: string; label: string }
> = {
  online: { bg: "bg-lavender-800", text: "text-lavender-300", label: "Online" },
  offline: { bg: "bg-graphite-700", text: "text-graphite-400", label: "Offline" },
  "your-turn": { bg: "bg-lavender-800", text: "text-lavender-300", label: "Your Turn" },
  "opponent-turn": { bg: "bg-dusty-taupe-800", text: "text-dusty-taupe-300", label: "Opponent's Turn" },
  finished: { bg: "bg-thistle-800", text: "text-thistle-300", label: "Finished" },
  waiting: { bg: "bg-graphite-700", text: "text-graphite-300", label: "Waiting..." },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { bg, text, label } = config[status];
  return (
    <View className={`${bg} rounded-full px-3 py-1`}>
      <Text className={`${text} text-xs font-semibold`}>{label}</Text>
    </View>
  );
}
