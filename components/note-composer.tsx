import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Waveform, noteKindIcons } from "@/components/note-card";
import { PeopleMultiSelect, ProjectSelect } from "@/components/pickers";
import {
  LabeledInput,
  PrimaryButton,
  SectionLabel,
  Sheet,
} from "@/components/ui";
import { alpha, colors, fonts, noteKindColors, noteKindLabels } from "@/lib/theme";
import { useStore } from "@/lib/store";
import type { Note, NoteKind } from "@/lib/types";

const KINDS: NoteKind[] = ["text", "photo", "link", "voice"];

export function NoteComposer({
  visible,
  onClose,
  note,
  defaultProjectId,
}: {
  visible: boolean;
  onClose: () => void;
  note?: Note;
  defaultProjectId?: string;
}) {
  const { people, personTypes, projects, addNote, updateNote } = useStore();
  const [kind, setKind] = useState<NoteKind>("text");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDesc, setLinkDesc] = useState("");
  const [attachment, setAttachment] = useState<string | undefined>();
  const [mentioned, setMentioned] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setKind(note?.kind ?? "text");
    setTitle(note?.title ?? "");
    setBody(note?.body ?? "");
    setLinkUrl(note?.linkUrl ?? "");
    setLinkDesc(note?.linkDesc ?? "");
    setAttachment(note?.attachmentLabel);
    setMentioned(note?.mentioned ?? []);
    setProjectId(note?.projectId ?? defaultProjectId);
    setRecording(false);
  }, [visible, note, defaultProjectId]);

  const canSave = title.trim().length > 0;

  const save = () => {
    const payload = {
      kind,
      title: title.trim(),
      body: body.trim(),
      linkUrl: kind === "link" ? linkUrl.trim() || undefined : undefined,
      linkDesc: kind === "link" ? linkDesc.trim() || undefined : undefined,
      attachmentLabel:
        kind === "photo" || kind === "voice" ? attachment : undefined,
      mentioned,
      projectId,
    };
    if (note) {
      updateNote(note.id, payload);
    } else {
      addNote(payload);
    }
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={note ? "Edytuj notatkę" : "Nowa notatka"}
    >
      <View style={styles.kindRow}>
        {KINDS.map((k) => {
          const active = k === kind;
          const c = noteKindColors[k];
          return (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              style={[
                styles.kindBtn,
                active
                  ? { backgroundColor: alpha(c, 0.16), borderColor: alpha(c, 0.45) }
                  : { backgroundColor: colors.cardInset, borderColor: colors.borderSoft },
              ]}
            >
              <Feather
                name={noteKindIcons[k]}
                size={17}
                color={active ? c : colors.secondary}
              />
              <Text
                style={{
                  fontFamily: active ? fonts.sansSemi : fonts.sansMedium,
                  fontSize: 11,
                  color: active ? c : colors.secondary,
                }}
              >
                {noteKindLabels[k]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <LabeledInput
        label="Tytuł"
        value={title}
        onChangeText={setTitle}
        placeholder="O czym jest notatka?"
      />

      {kind === "link" && (
        <>
          <LabeledInput
            label="Adres URL"
            value={linkUrl}
            onChangeText={setLinkUrl}
            placeholder="https://…"
          />
          <LabeledInput
            label="Opis linku"
            value={linkDesc}
            onChangeText={setLinkDesc}
            placeholder="Tytuł strony"
          />
        </>
      )}

      {kind === "photo" && (
        <Pressable
          style={[styles.attachBox, attachment ? styles.attachBoxOn : null]}
          onPress={() => setAttachment("Zdjęcie · zdjecie.jpg")}
        >
          <Feather
            name="camera"
            size={19}
            color={attachment ? noteKindColors.photo : colors.secondary}
          />
          <Text style={styles.attachText}>
            {attachment ?? "Dodaj zdjęcie (placeholder)"}
          </Text>
        </Pressable>
      )}

      {kind === "voice" && (
        <Pressable
          style={[styles.attachBox, (recording || attachment) ? styles.attachBoxOn : null]}
          onPress={() => {
            if (recording) {
              setRecording(false);
              setAttachment("Nagranie · 0:12");
            } else if (!attachment) {
              setRecording(true);
            } else {
              setAttachment(undefined);
            }
          }}
        >
          {recording ? (
            <>
              <Waveform color={noteKindColors.voice} />
              <Text style={[styles.attachText, { color: noteKindColors.voice }]}>
                Nagrywanie… (tapnij, aby zakończyć)
              </Text>
            </>
          ) : (
            <>
              <Feather
                name="mic"
                size={19}
                color={attachment ? noteKindColors.voice : colors.secondary}
              />
              <Text style={styles.attachText}>
                {attachment ?? "Nagraj notatkę głosową (placeholder)"}
              </Text>
            </>
          )}
        </Pressable>
      )}

      <LabeledInput
        label="Treść"
        value={body}
        onChangeText={setBody}
        placeholder="Zapisz szczegóły…"
        multiline
      />

      <SectionLabel>Projekt</SectionLabel>
      <View style={{ marginTop: 9, marginBottom: 15 }}>
        <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} />
      </View>

      <SectionLabel>Wspomnij osoby</SectionLabel>
      <View style={{ marginTop: 9, marginBottom: 17 }}>
        <PeopleMultiSelect
          people={people}
          personTypes={personTypes}
          selected={mentioned}
          onToggle={(id) =>
            setMentioned((m) =>
              m.includes(id) ? m.filter((x) => x !== id) : [...m, id]
            )
          }
        />
      </View>

      <PrimaryButton
        label={note ? "Zapisz zmiany" : "Dodaj notatkę"}
        onPress={save}
        disabled={!canSave}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  kindRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
  },
  kindBtn: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  attachBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.faint,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 14,
    marginBottom: 13,
  },
  attachBoxOn: {
    borderColor: alpha(colors.green, 0.5),
    borderStyle: "solid",
    backgroundColor: alpha(colors.green, 0.07),
  },
  attachText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12.5,
    color: colors.secondaryAlt,
  },
});
