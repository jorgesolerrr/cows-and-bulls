import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

interface GuessInputProps {
  onSubmit: (guess: string) => void;
  disabled?: boolean;
  isMyTurn: boolean;
}

function validateGuess(value: string): string | null {
  if (!/^[1-9]{4}$/.test(value)) {
    return "Must be 4 digits (1-9)";
  }
  if (new Set(value.split("")).size !== 4) {
    return "Digits must be unique";
  }
  return null;
}

export function GuessInput({ onSubmit, disabled, isMyTurn }: GuessInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (text: string) => {
    const filtered = text.replace(/[^1-9]/g, "").slice(0, 4);
    setValue(filtered);
    if (error) setError(null);
  };

  const handleSubmit = () => {
    const err = validateGuess(value);
    if (err) {
      setError(err);
      return;
    }
    onSubmit(value);
    setValue("");
  };

  return (
    <View className="bg-graphite-800 rounded-xl p-4 border border-graphite-600">
      {!isMyTurn ? (
        <View className="py-3">
          <Text className="text-graphite-400 text-center text-base">
            Waiting for opponent's turn...
          </Text>
        </View>
      ) : (
        <>
          <Text className="text-lavender-300 text-sm font-semibold mb-3">
            Your turn! Enter your guess
          </Text>

          <View className="flex-row gap-3">
            <TextInput
              className="flex-1 bg-graphite-900 text-graphite-50 text-2xl font-mono font-bold text-center rounded-xl py-3 tracking-widest border border-graphite-600"
              value={value}
              onChangeText={handleChange}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="----"
              placeholderTextColor="#464356"
              editable={!disabled}
            />

            <TouchableOpacity
              className={`px-6 rounded-xl justify-center ${
                disabled || value.length < 4
                  ? "bg-graphite-700"
                  : "bg-lavender-400"
              }`}
              onPress={handleSubmit}
              disabled={disabled || value.length < 4}
              activeOpacity={0.7}
            >
              <Text
                className={`font-bold text-base ${
                  disabled || value.length < 4
                    ? "text-graphite-500"
                    : "text-white"
                }`}
              >
                Go
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <Text className="text-rosy-taupe-400 text-sm mt-2">
              {error}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
