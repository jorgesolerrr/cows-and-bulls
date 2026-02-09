import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

interface SecretInputProps {
  onSubmit: (secret: string) => void;
  disabled?: boolean;
  submitted?: boolean;
}

function validateSecret(value: string): string | null {
  if (!/^[1-9]{4}$/.test(value)) {
    return "Must be 4 digits (1-9)";
  }
  if (new Set(value.split("")).size !== 4) {
    return "Digits must be unique";
  }
  return null;
}

export function SecretInput({ onSubmit, disabled, submitted }: SecretInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (text: string) => {
    const filtered = text.replace(/[^1-9]/g, "").slice(0, 4);
    setValue(filtered);
    if (error) setError(null);
  };

  const handleSubmit = () => {
    const err = validateSecret(value);
    if (err) {
      setError(err);
      return;
    }
    onSubmit(value);
  };

  if (submitted) {
    return (
      <View className="bg-graphite-800 rounded-xl p-4 border border-lavender-800">
        <Text className="text-graphite-300 text-sm mb-1">Your Secret</Text>
        <Text className="text-lavender-300 text-3xl font-mono font-bold tracking-widest text-center">
          {value || "****"}
        </Text>
        <Text className="text-lavender-400 text-xs text-center mt-2">
          Secret set! Waiting for opponent...
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-graphite-800 rounded-xl p-4 border border-graphite-600">
      <Text className="text-graphite-300 text-sm mb-3">
        Choose your secret number (4 unique digits, 1-9)
      </Text>

      <TextInput
        className="bg-graphite-900 text-graphite-50 text-3xl font-mono font-bold text-center rounded-xl py-3 tracking-widest border border-graphite-600"
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={4}
        placeholder="----"
        placeholderTextColor="#464356"
        editable={!disabled}
      />

      {error && (
        <Text className="text-rosy-taupe-400 text-sm mt-2 text-center">
          {error}
        </Text>
      )}

      <TouchableOpacity
        className={`mt-4 rounded-xl py-3 items-center ${
          disabled || value.length < 4 ? "bg-graphite-700" : "bg-lavender-400"
        }`}
        onPress={handleSubmit}
        disabled={disabled || value.length < 4}
        activeOpacity={0.7}
      >
        <Text
          className={`font-semibold ${
            disabled || value.length < 4 ? "text-graphite-500" : "text-white"
          }`}
        >
          Lock Secret
        </Text>
      </TouchableOpacity>
    </View>
  );
}
