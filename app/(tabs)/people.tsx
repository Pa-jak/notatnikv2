import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PersonForm } from "@/components/person-form";
import { OptionPill } from "@/components/pickers";
import { plural } from "@/components/project-card";
import { Avatar, Fab } from "@/components/ui";
import { useStore } from "@/lib/store";
import { alpha, colors, fonts } from "@/lib/theme";

export default function PeopleScreen() {
  const router = useRouter();
  const { people, personTypes } = useStore();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [form, setForm] = useState(false);

  const filtered = useMemo(
    () =>
      typeFilter ? people.filter((p) => p.typeId === typeFilter) : people,
    [people, typeFilter]
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Osoby</Text>
          <Text style={styles.subtitle}>
            {people.length} {plural(people.length, "osoba", "osoby", "osób")}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 7, paddingBottom: 2 }}>
            <OptionPill
              label="Wszyscy"
              active={!typeFilter}
              onPress={() => setTypeFilter(undefined)}
            />
            {personTypes.map((t) => (
              <OptionPill
                key={t.id}
                label={t.name}
                color={t.color}
                active={typeFilter === t.id}
                onPress={() =>
                  setTypeFilter(typeFilter === t.id ? undefined : t.id)
                }
              />
            ))}
          </View>
        </ScrollView>
        <Pressable
          style={styles.manageBtn}
          onPress={() => router.push("/person-types")}
        >
          <Feather name="sliders" size={13} color={colors.accentBright} />
          <Text style={styles.manageText}>Zarządzaj typami</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((p) => {
          const type = personTypes.find((t) => t.id === p.typeId);
          const c = type?.color ?? colors.secondary;
          return (
            <Pressable
              key={p.id}
              style={styles.card}
              onPress={() => router.push(`/person/${p.id}`)}
            >
              <Avatar name={p.name} size={40} ringColor="transparent" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={styles.name}>{p.name}</Text>
                  {type && (
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor: alpha(c, 0.14),
                          borderColor: alpha(c, 0.35),
                        },
                      ]}
                    >
                      <Text style={[styles.typeBadgeText, { color: c }]}>
                        {type.name}
                      </Text>
                    </View>
                  )}
                </View>
                {p.phone && <Text style={styles.phone}>{p.phone}</Text>}
              </View>
              <Feather name="chevron-right" size={19} color={colors.faint} />
            </Pressable>
          );
        })}
        {filtered.length === 0 && (
          <Text style={styles.empty}>Brak osób tego typu.</Text>
        )}
        <View style={{ height: 140 }} />
      </ScrollView>

      <Fab onPress={() => setForm(true)} />
      <PersonForm visible={form} onClose={() => setForm(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.mutedAlt,
    marginBottom: 3,
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  manageText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.accentBright,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 13,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 14.5,
    color: colors.text,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 9.5,
  },
  phone: {
    fontFamily: fonts.mono,
    fontSize: 11.5,
    color: colors.secondary,
    marginTop: 3,
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.secondary,
    textAlign: "center",
    paddingVertical: 20,
  },
});
