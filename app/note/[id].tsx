import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NoteComposer } from "@/components/note-composer";
import { Waveform, noteKindIcons } from "@/components/note-card";
import {
  Avatar,
  GhostButton,
  IconSquare,
  SectionLabel,
} from "@/components/ui";
import { formatDayFull } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { alpha, colors, fonts, noteKindColors, noteKindLabels } from "@/lib/theme";

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { notes, people, projects, deleteNote } = useStore();
  const [editing, setEditing] = useState(false);

  const note = notes.find((n) => n.id === id);
  if (!note) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>Nie znaleziono notatki.</Text>
      </View>
    );
  }

  const accent = noteKindColors[note.kind];
  const project = projects.find((p) => p.id === note.projectId);
  const mentioned = note.mentioned
    .map((mid) => people.find((p) => p.id === mid))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const created = new Date(note.createdAt);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: noteKindLabels[note.kind] }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headRow}>
          <IconSquare icon={noteKindIcons[note.kind]} color={accent} size={44} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title}>{note.title}</Text>
            <Text style={styles.date}>
              {formatDayFull(created)} ·{" "}
              {created.toTimeString().slice(0, 5)}
            </Text>
          </View>
        </View>

        {project && (
          <Pressable
            style={styles.projectRow}
            onPress={() => router.push(`/project/${project.id}`)}
          >
            <Feather name="folder" size={13} color={colors.accentBright} />
            <Text style={styles.projectText}>{project.name}</Text>
            <Feather name="chevron-right" size={15} color={colors.faint} />
          </Pressable>
        )}

        {note.kind === "voice" && (
          <View style={[styles.mediaBox, { borderColor: alpha(accent, 0.35) }]}>
            <Feather name="mic" size={17} color={accent} />
            <Waveform color={accent} />
            <Text style={[styles.mediaLabel, { color: accent }]}>
              {note.attachmentLabel ?? "Nagranie"}
            </Text>
          </View>
        )}

        {note.kind === "photo" && (
          <View style={[styles.mediaBox, { borderColor: alpha(accent, 0.35) }]}>
            <Feather name="image" size={17} color={accent} />
            <Text style={[styles.mediaLabel, { color: accent }]}>
              {note.attachmentLabel ?? "Zdjęcie"}
            </Text>
          </View>
        )}

        {note.kind === "link" && note.linkUrl && (
          <View style={styles.linkBox}>
            <View style={[styles.favicon, { backgroundColor: alpha(accent, 0.18) }]}>
              <Feather name="globe" size={15} color={accent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.linkTitle}>{note.linkDesc || note.linkUrl}</Text>
              <Text style={styles.linkUrl} numberOfLines={1}>
                {note.linkUrl}
              </Text>
            </View>
          </View>
        )}

        {note.body.length > 0 && <Text style={styles.body}>{note.body}</Text>}

        <View style={{ marginTop: 6, marginHorizontal: 2 }}>
          <SectionLabel>Wspomniane osoby</SectionLabel>
        </View>
        {mentioned.length > 0 ? (
          <View style={{ gap: 9 }}>
            {mentioned.map((p) => (
              <Pressable
                key={p.id}
                style={styles.personRow}
                onPress={() => router.push(`/person/${p.id}`)}
              >
                <Avatar name={p.name} size={32} ringColor="transparent" />
                <Text style={styles.personName}>{p.name}</Text>
                <Feather name="chevron-right" size={17} color={colors.faint} />
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Brak wspomnianych osób.</Text>
        )}

        <View style={{ flexDirection: "row", gap: 9, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <GhostButton label="Edytuj" icon="edit-2" onPress={() => setEditing(true)} />
          </View>
          <View style={{ flex: 1 }}>
            <GhostButton
              label="Usuń"
              icon="trash-2"
              danger
              onPress={() => {
                deleteNote(note.id);
                router.back();
              }}
            />
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <NoteComposer
        visible={editing}
        onClose={() => setEditing(false)}
        note={note}
      />
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
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 19,
    color: colors.text,
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.secondary,
    marginTop: 3,
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignSelf: "flex-start",
  },
  projectText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12.5,
    color: colors.chipText,
  },
  mediaBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.card,
  },
  mediaLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 11.5,
  },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    padding: 12,
  },
  favicon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  linkTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.body,
  },
  linkUrl: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 2,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.body,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  personName: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 13.5,
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
