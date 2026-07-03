import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NoteCard } from "@/components/note-card";
import { PersonForm } from "@/components/person-form";
import { Avatar, GhostButton, SectionLabel } from "@/components/ui";
import { useStore } from "@/lib/store";
import { alpha, colors, fonts } from "@/lib/theme";

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { people, personTypes, notes, deletePerson } = useStore();
  const [editing, setEditing] = useState(false);

  const person = people.find((p) => p.id === id);
  if (!person) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>Nie znaleziono osoby.</Text>
      </View>
    );
  }

  const type = personTypes.find((t) => t.id === person.typeId);
  const c = type?.color ?? colors.secondary;
  const mentions = notes
    .filter((n) => n.mentioned.includes(person.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: person.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Avatar name={person.name} size={62} ringColor="transparent" />
          <Text style={styles.name}>{person.name}</Text>
          {type && (
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: alpha(c, 0.14), borderColor: alpha(c, 0.35) },
              ]}
            >
              <View style={[styles.typeDot, { backgroundColor: c }]} />
              <Text style={[styles.typeText, { color: c }]}>{type.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <InfoRow icon="phone" label="Telefon" value={person.phone} />
          <InfoRow icon="mail" label="E-mail" value={person.email} />
          {type?.fields.map((f) => (
            <InfoRow
              key={f.id}
              icon={f.kind === "date" ? "calendar" : f.kind === "number" ? "hash" : "tag"}
              label={f.label}
              value={person.values[f.id]}
            />
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 9 }}>
          <View style={{ flex: 1 }}>
            <GhostButton label="Edytuj" icon="edit-2" onPress={() => setEditing(true)} />
          </View>
          <View style={{ flex: 1 }}>
            <GhostButton
              label="Usuń"
              icon="trash-2"
              danger
              onPress={() => {
                deletePerson(person.id);
                router.back();
              }}
            />
          </View>
        </View>

        <View style={{ marginTop: 8, marginHorizontal: 2 }}>
          <SectionLabel>{`Wspomniany w (${mentions.length})`}</SectionLabel>
        </View>
        {mentions.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            people={people}
            onPress={() => router.push(`/note/${n.id}`)}
          />
        ))}
        {mentions.length === 0 && (
          <Text style={styles.empty}>
            Ta osoba nie jest jeszcze wspomniana w żadnej notatce.
          </Text>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <PersonForm
        visible={editing}
        onClose={() => setEditing(false)}
        person={person}
      />
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={14} color={colors.secondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, !value && { color: colors.muted }]}>
        {value || "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 18,
    gap: 13,
  },
  head: {
    alignItems: "center",
    gap: 9,
    paddingVertical: 8,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 21,
    color: colors.text,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  infoLabel: {
    width: 110,
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.secondary,
  },
  infoValue: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text,
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.secondary,
  },
  missing: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.secondary,
    textAlign: "center",
    marginTop: 40,
  },
});
