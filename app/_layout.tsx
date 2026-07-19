import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from "@expo-google-fonts/ibm-plex-mono";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from "@expo-google-fonts/ibm-plex-sans";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LoginScreen } from "@/components/login-screen";
import { plural } from "@/components/project-card";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";

function AuthGate({ children }: { children: React.ReactNode }) {
  const auth = useStore((s) => s.auth);
  const init = useStore((s) => s.init);
  const syncError = useStore((s) => s.syncError);
  const dismissSyncError = useStore((s) => s.dismissSyncError);
  const pendingCount = useStore((s) => s.pendingCount);

  useEffect(() => {
    void init();
  }, [init]);

  if (auth === "checking") {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.accentBright} size="large" />
      </View>
    );
  }
  if (auth === "loggedOut") {
    return <LoginScreen />;
  }
  return (
    <View style={{ flex: 1 }}>
      {children}
      {pendingCount > 0 && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            Offline — {pendingCount} {plural(pendingCount, "zmiana", "zmiany", "zmian")} czeka na synchronizację
          </Text>
        </View>
      )}
      {syncError && (
        <Pressable style={styles.errorBanner} onPress={dismissSyncError}>
          <Text style={styles.errorBannerText}>{syncError}</Text>
          <Text style={styles.errorBannerHint}>dotknij, aby zamknąć</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <AuthGate>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.accentBright,
          headerTitleStyle: {
            fontFamily: fonts.heading,
            fontSize: 17,
            color: colors.text,
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="note/[id]" options={{ title: "Notatka" }} />
        <Stack.Screen name="person/[id]" options={{ title: "Osoba" }} />
        <Stack.Screen name="project/[id]" options={{ title: "Projekt" }} />
        <Stack.Screen name="person-types" options={{ title: "Typy osób" }} />
      </Stack>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineBanner: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 14,
    backgroundColor: colors.cardRaised,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 10,
  },
  offlineBannerText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text,
  },
  errorBanner: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    backgroundColor: colors.cardRaised,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.danger,
  },
  errorBannerHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
});
