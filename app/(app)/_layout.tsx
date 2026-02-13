import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text } from "react-native";
import { BottomTabBar } from "@react-navigation/bottom-tabs";

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={(props) => (
        <View
          style={{
            backgroundColor: "#17161d",
            borderTopColor: "#2f2c3a",
            borderTopWidth: 1,
          }}
        >
          <Text
            style={{
              color: "#5e5973",
              fontSize: 11,
              textAlign: "center",
              paddingTop: 6,
            }}
          >
            Made with love for Gaby 🤍
          </Text>
          <BottomTabBar {...props} />
        </View>
      )}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#17161d",
          borderTopColor: "transparent",
          borderTopWidth: 0,
          paddingBottom: 12 + insets.bottom,
          paddingTop: 8,
          height: 72 + insets.bottom,
        },
        tabBarActiveTintColor: "#4e33ff",
        tabBarInactiveTintColor: "#5e5973",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
        tabBarIconStyle: { marginBottom: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Lobby",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "game-controller" : "game-controller-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="game/lobby/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="game/play/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
