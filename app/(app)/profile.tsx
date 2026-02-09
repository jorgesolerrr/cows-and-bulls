import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, updateProfile, signOut } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ display_name: displayName.trim() });
      Alert.alert("Success", "Profile updated!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-graphite-950 px-6" contentContainerStyle={{ paddingTop: 24 + insets.top }}>
      {/* Avatar */}
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-lavender-800 items-center justify-center mb-3">
          <Text className="text-lavender-300 font-bold text-3xl">
            {profile?.display_name?.charAt(0).toUpperCase() || "?"}
          </Text>
        </View>
        <Text className="text-graphite-400 text-sm">{user?.email}</Text>
      </View>

      {/* Edit name */}
      <View className="mb-8">
        <Text className="text-graphite-300 text-sm mb-2 ml-1">
          Display Name
        </Text>
        <TextInput
          className="bg-graphite-800 text-graphite-50 rounded-xl px-4 py-3.5 text-base border border-graphite-600 mb-3"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor="#5e5973"
        />
        <TouchableOpacity
          className={`rounded-xl py-3 items-center ${
            saving ? "bg-lavender-600" : "bg-lavender-400"
          }`}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats placeholder */}
      <View className="bg-graphite-800 rounded-xl p-4 mb-8 border border-graphite-700">
        <Text className="text-graphite-300 text-sm font-semibold mb-3">
          Account Info
        </Text>
        <View className="flex-row justify-between mb-2">
          <Text className="text-graphite-400">Email</Text>
          <Text className="text-graphite-50">{user?.email}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-graphite-400">Joined</Text>
          <Text className="text-graphite-50">
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString()
              : "—"}
          </Text>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        className="bg-graphite-800 rounded-xl py-3 items-center border border-rosy-taupe-700 mb-12"
        onPress={handleSignOut}
        activeOpacity={0.7}
      >
        <Text className="text-rosy-taupe-400 font-semibold">Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
