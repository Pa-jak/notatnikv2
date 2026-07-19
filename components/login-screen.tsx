import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";
import { PrimaryButton } from "./ui";

export function LoginScreen() {
  const login = useStore((s) => s.login);
  const initError = useStore((s) => s.syncError);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await login(password);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Nie udało się zalogować"
      );
      setBusy(false);
    }
  };

  const shownError = error ?? initError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.wrap}
    >
      <View style={styles.card}>
        <LinearGradient
          colors={[colors.accentBright, colors.accentDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}
        >
          <Feather name="book-open" size={26} color={colors.onAccent} />
        </LinearGradient>
        <Text style={styles.title}>Notatnik</Text>
        <Text style={styles.subtitle}>
          Podaj hasło, żeby odblokować swoje notatki
        </Text>

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Hasło"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoFocus
          onSubmitEditing={submit}
          editable={!busy}
          style={styles.input}
        />

        {shownError && <Text style={styles.error}>{shownError}</Text>}

        {busy ? (
          <ActivityIndicator color={colors.accentBright} style={{ height: 44 }} />
        ) : (
          <PrimaryButton
            label="Zaloguj"
            onPress={submit}
            disabled={password.length === 0}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.secondaryAlt,
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardInset,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
  },
  error: {
    fontFamily: fonts.sansMedium,
    fontSize: 12.5,
    color: colors.danger,
    textAlign: "center",
  },
});
