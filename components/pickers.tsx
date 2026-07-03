import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui";
import { alpha, colors, fonts } from "@/lib/theme";
import type { Person, PersonType, Project } from "@/lib/types";

export function PeopleMultiSelect({
  people,
  personTypes,
  selected,
  onToggle,
}: {
  people: Person[];
  personTypes: PersonType[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={{ gap: 7 }}>
      {people.map((p) => {
        const active = selected.includes(p.id);
        const type = personTypes.find((t) => t.id === p.typeId);
        return (
          <Pressable
            key={p.id}
            onPress={() => onToggle(p.id)}
            style={[styles.personRow, active && styles.personRowActive]}
          >
            <Avatar name={p.name} size={30} ringColor="transparent" />
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>{p.name}</Text>
              {type && (
                <Text style={[styles.personType, { color: type.color ?? colors.secondary }]}>
                  {type.name}
                </Text>
              )}
            </View>
            <View style={[styles.checkbox, active && styles.checkboxOn]}>
              {active && <Feather name="check" size={11} color={colors.onAccent} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProjectSelect({
  projects,
  value,
  onChange,
}: {
  projects: Project[];
  value?: string;
  onChange: (id?: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row", gap: 7 }}>
        <OptionPill
          label="Bez projektu"
          active={!value}
          onPress={() => onChange(undefined)}
        />
        {projects.map((p) => (
          <OptionPill
            key={p.id}
            label={p.name}
            active={value === p.id}
            onPress={() => onChange(p.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

export function OptionPill({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  const c = color ?? colors.accent;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        active
          ? { backgroundColor: alpha(c, 0.18), borderColor: alpha(c, 0.45) }
          : { backgroundColor: colors.input, borderColor: colors.borderStrong },
      ]}
    >
      {color && (
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      )}
      <Text
        style={{
          fontFamily: active ? fonts.sansSemi : fonts.sansMedium,
          fontSize: 12,
          color: active ? (color ?? colors.accentBright) : colors.chipText,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.cardInset,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  personRowActive: {
    borderColor: alpha(colors.accent, 0.45),
    backgroundColor: alpha(colors.accent, 0.08),
  },
  personName: {
    fontFamily: fonts.sansMedium,
    fontSize: 13.5,
    color: colors.text,
  },
  personType: {
    fontFamily: fonts.sansMedium,
    fontSize: 10.5,
    marginTop: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.faint,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
  },
});
