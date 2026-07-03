import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { colors, fonts } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentBright,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.nav,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingTop: 7,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 10,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="notes"
        options={{
          title: "Projekty",
          tabBarIcon: ({ color }) => (
            <Feather name="folder" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: "Osoby",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Zadania",
          tabBarIcon: ({ color }) => (
            <Feather name="trello" size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Kalendarz",
          tabBarIcon: ({ color }) => (
            <Feather name="calendar" size={21} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
