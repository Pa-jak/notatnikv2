import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { PeopleMultiSelect, OptionPill } from "@/components/pickers";
import {
  IconSquare,
  LabeledInput,
  PrimaryButton,
  SectionLabel,
  Sheet,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { alpha, colors, importanceLabels, statusLabels } from "@/lib/theme";
import type { Importance, ProjectIcon, ProjectStatus } from "@/lib/types";

const iconList: ProjectIcon[] = ["clock", "star", "list", "folder", "target"];

export function ProjectForm({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { people, personTypes, addProject } = useStore();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [importance, setImportance] = useState<Importance>("medium");
  const [icon, setIcon] = useState<ProjectIcon>("folder");
  const [tagsDraft, setTagsDraft] = useState("");
  const [peopleIds, setPeopleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    setName("");
    setStatus("active");
    setImportance("medium");
    setIcon("folder");
    setTagsDraft("");
    setPeopleIds([]);
  }, [visible]);

  const save = () => {
    if (!name.trim()) return;
    const tags = tagsDraft
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    addProject({
      name: name.trim(),
      status,
      importance,
      tags,
      icon,
      peopleIds,
    });
    onClose();
  };

  const togglePerson = (id: string) => {
    setPeopleIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Nowy projekt">
      <LabeledInput
        label="Nazwa"
        value={name}
        onChangeText={setName}
        placeholder="np. Nowa strona www"
      />

      <SectionLabel>Status</SectionLabel>
      <View style={styles.pillRow}>
        {(Object.keys(statusLabels) as ProjectStatus[]).map((s) => (
          <OptionPill
            key={s}
            label={statusLabels[s]}
            active={status === s}
            onPress={() => setStatus(s)}
          />
        ))}
      </View>

      <SectionLabel>Ważność</SectionLabel>
      <View style={styles.pillRow}>
        {(Object.keys(importanceLabels) as Importance[]).map((i) => (
          <OptionPill
            key={i}
            label={importanceLabels[i]}
            active={importance === i}
            onPress={() => setImportance(i)}
          />
        ))}
      </View>

      <SectionLabel>Ikona</SectionLabel>
      <View style={styles.iconRow}>
        {iconList.map((i) => (
          <Pressable
            key={i}
            onPress={() => setIcon(i)}
            style={[
              styles.iconBox,
              icon === i && styles.iconBoxActive,
            ]}
          >
            <IconSquare
              icon={i}
              color={
                icon === i ? colors.accentBright : colors.secondary
              }
              size={32}
            />
          </Pressable>
        ))}
      </View>

      <LabeledInput
        label="Tagi (rozdziel przecinkami)"
        value={tagsDraft}
        onChangeText={setTagsDraft}
        placeholder="np. klient, www, pilne"
      />

      <SectionLabel>Osoby</SectionLabel>
      <PeopleMultiSelect
        people={people}
        personTypes={personTypes}
        selected={peopleIds}
        onToggle={togglePerson}
      />

      <View style={{ marginTop: 8 }}>
        <PrimaryButton
          label="Utwórz"
          onPress={save}
          disabled={!name.trim()}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 9,
    marginBottom: 15,
  },
  iconRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 9,
    marginBottom: 15,
  },
  iconBox: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 8,
    backgroundColor: colors.cardInset,
  },
  iconBoxActive: {
    borderColor: alpha(colors.accent, 0.45),
    backgroundColor: alpha(colors.accent, 0.1),
  },
});

