import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Link } from "expo-router";
import { useAuthStore } from "@/store/auth-store";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-graphite-950"
    >
      <View className="flex-1 justify-center px-8">
        {/* Header */}
        <View className="mb-12 items-center">
          <Text className="text-5xl font-bold text-lavender-400 mb-2">
            C&B
          </Text>
          <Text className="text-graphite-300 text-lg">Cows & Bulls</Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="text-graphite-300 text-sm mb-2 ml-1">Email</Text>
            <TextInput
              className="bg-graphite-800 text-graphite-50 rounded-xl px-4 py-3.5 text-base border border-graphite-600"
              placeholder="you@example.com"
              placeholderTextColor="#5e5973"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View>
            <Text className="text-graphite-300 text-sm mb-2 ml-1">
              Password
            </Text>
            <TextInput
              className="bg-graphite-800 text-graphite-50 rounded-xl px-4 py-3.5 text-base border border-graphite-600"
              placeholder="Your password"
              placeholderTextColor="#5e5973"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            className={`mt-4 rounded-xl py-4 items-center ${
              loading ? "bg-lavender-600" : "bg-lavender-400"
            }`}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-graphite-400">
              Don't have an account?{" "}
            </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text className="text-lavender-300 font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
