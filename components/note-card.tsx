import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { IconSquare, PersonDot } from "@/components/ui";
import { alpha, colors, fonts, noteKindColors } from "@/lib/theme";
import type { Note, Person } from "@/lib/types";

export const noteKindIcons = {
  text: "file-text",
  voice: "mic",
  link: "link",
  photo: "camera",
} as const;

const WAVE_HEIGHTS = [6, 11, 16, 9, 14, 18, 8, 13, 17, 10, 6, 12, 15, 7, 11, 16, 9, 5];

export function Waveform({ color }: { color: string }) {
  return (
    <View style={styles.wave}>
      {WAVE_HEIGHTS.map((h, i) => (
        <View
          key={i}
          style={{ width: 3, height: h, borderRadius: 2, backgroundColor: color }}
        />
      ))}
    </View>
  );
}

export function NoteCard({
  note,
  people,
  onPress,
  onPressPerson,
}: {
  note: Note;
  people: Person[];
  onPress?: () => void;
  onPressPerson?: (id: string) => void;
}) {
  const accent = noteKindColors[note.kind];
  const mentioned = note.mentioned
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => !!p);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={{ flexDirection: "row", gap: 11 }}>
        <IconSquare icon={noteKindIcons[note.kind]} color={accent} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title}>{note.title}</Text>
          {note.kind === "voice" ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginTop: 7 }}>
              <Waveform color={accent} />
              <Text style={[styles.mono, { color: accent }]}>
                {note.attachmentLabel?.split("·")[1]?.trim() ?? "0:00"}
              </Text>
            </View>
          ) : note.kind === "link" ? (
            <View style={styles.linkBox}>
              <View style={[styles.favicon, { backgroundColor: alpha(accent, 0.18) }]}>
                <Feather name="globe" size={13} color={accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={styles.linkTitle}>
                  {note.linkDesc || note.linkUrl}
                </Text>
                <Text numberOfLines={1} style={styles.linkDomain}>
                  {domainOf(note.linkUrl)}
                </Text>
              </View>
            </View>
          ) : note.kind === "photo" ? (
            <View style={styles.photoRow}>
              <View style={styles.photoPh}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.photoStripe} />
                ))}
                <Feather
                  name="image"
                  size={15}
                  color={accent}
                  style={{ position: "absolute" }}
                />
              </View>
              <Text numberOfLines={2} style={[styles.body, { flex: 1 }]}>
                {note.body}
              </Text>
            </View>
          ) : (
            <Text numberOfLines={2} style={[styles.body, { marginTop: 4 }]}>
              {note.body}
            </Text>
          )}
          {mentioned.length > 0 && (
            <View style={styles.people}>
              {mentioned.map((p) => (
                <PersonDot
                  key={p.id}
                  name={p.name}
                  onPress={onPressPerson ? () => onPressPerson(p.id) : undefined}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function domainOf(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 14,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 14.5,
    color: colors.textSoft,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.secondaryAlt,
  },
  mono: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
  },
  wave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2.5,
    height: 20,
  },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.cardInset,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 10,
    padding: 8,
    marginTop: 7,
  },
  favicon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  linkTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.body,
  },
  linkDomain: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 1,
  },
  photoRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 7,
    alignItems: "center",
  },
  photoPh: {
    width: 52,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.cardInset,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  photoStripe: {
    width: 3,
    height: "160%",
    backgroundColor: "rgba(255,255,255,0.045)",
    transform: [{ rotate: "35deg" }],
  },
  people: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 9,
  },
});
