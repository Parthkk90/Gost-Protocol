import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Text, View } from "react-native";
import { Colors } from "../constants/colors";
import { ActivityScreen } from "../features/activity/ActivityScreen";
import { CollectiblesScreen } from "../features/collectibles/CollectiblesScreen";
import { SwapScreen } from "../features/swap/SwapScreen";
import { HomeScreen } from "../features/wallet/HomeScreen";
import { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: `${Colors.backgroundDark}CC`,
          borderTopColor: Colors.borderDark,
          borderTopWidth: 1,
          paddingBottom: 24,
          paddingTop: 8,
          height: 88,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Collectibles"
        component={CollectiblesScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Swap"
        component={SwapScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="swap-horizontal-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="flash-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Browser"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="globe-outline" size={24} color={color} />
          ),
        }}
      >
        {() => (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.backgroundDark }}>
            <Ionicons name="globe-outline" size={64} color={Colors.textSecondary} />
            <Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: "700", marginTop: 16 }}>Browser</Text>
            <Text style={{ color: Colors.textSecondary, marginTop: 8 }}>Coming Soon</Text>
          </View>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};
