import { View, Text, ScrollView } from "react-native";
import type { Guess } from "@/types";

interface GuessHistoryProps {
  guesses: Guess[];
  currentUserId: string;
}

function GuessRow({
  guess,
  isOwn,
  index,
}: {
  guess: Guess;
  isOwn: boolean;
  index: number;
}) {
  return (
    <View
      className={`flex-row items-center py-3 px-4 rounded-xl mb-1.5 ${
        isOwn ? "bg-graphite-800" : "bg-graphite-800/50"
      }`}
    >
      {/* Turn number */}
      <Text className="text-graphite-500 text-xs w-8">{index + 1}</Text>

      {/* Who guessed */}
      <View
        className={`w-2 h-2 rounded-full mr-3 ${
          isOwn ? "bg-lavender-400" : "bg-dusty-taupe-400"
        }`}
      />

      {/* The guess */}
      <Text className="text-graphite-50 text-xl font-mono font-bold tracking-widest flex-1">
        {guess.guess}
      </Text>

      {/* Bulls */}
      <View className="flex-row items-center mr-4">
        <Text className="text-thistle-400 font-bold text-lg mr-1">
          {guess.bulls}
        </Text>
        <Text className="text-thistle-500 text-xs">B</Text>
      </View>

      {/* Cows */}
      <View className="flex-row items-center">
        <Text className="text-dusty-taupe-400 font-bold text-lg mr-1">
          {guess.cows}
        </Text>
        <Text className="text-dusty-taupe-500 text-xs">C</Text>
      </View>
    </View>
  );
}

export function GuessHistory({ guesses, currentUserId }: GuessHistoryProps) {
  if (guesses.length === 0) {
    return (
      <View className="py-8 items-center">
        <Text className="text-graphite-500 text-base">No guesses yet</Text>
        <Text className="text-graphite-600 text-sm mt-1">
          Make the first move!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="flex-row px-4 mb-2">
        <Text className="text-graphite-500 text-xs w-8">#</Text>
        <View className="w-5" />
        <Text className="text-graphite-500 text-xs flex-1">Guess</Text>
        <Text className="text-graphite-500 text-xs mr-4 w-8 text-center">
          Bulls
        </Text>
        <Text className="text-graphite-500 text-xs w-8 text-center">
          Cows
        </Text>
      </View>

      {guesses.map((guess, i) => (
        <GuessRow
          key={guess.id}
          guess={guess}
          isOwn={guess.guesser_id === currentUserId}
          index={i}
        />
      ))}
    </ScrollView>
  );
}
