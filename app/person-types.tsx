import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { OptionPill } from "@/components/pickers";
import {
  GhostButton,
  LabeledInput,
  PrimaryButton,
  SectionLabel,
  Segmented,
  Sheet,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { alpha, colors, fonts } from "@/lib/theme";
import type { FieldKind, PersonType } from "@/lib/types";

const TYPE_COLORS = [
  "#4fd6c0",
  "#6ea8fe",
  "#b98be0",
  "#8bd17c",
  "#e8a13c",
  "#e88a68",
];

const KIND_OPTIONS: { value: FieldKind; label: string }[] = [
  { value: "text", label: "Tekst" },
  { value: "number", label: "Liczba" },
  { value: "date", label: "Data" },
];

const KIND_LABELS: Record<FieldKind, string> = {
  text: "tekst",
  number: "liczba",
  date: "data",
};

export default function PersonTypesScreen() {
  const {
    personTypes,
    people,
    addPersonType,
    updatePersonType,
    deletePersonType,
    addField,
    removeField,
  } = useStore();
  const [typeSheet, setTypeSheet] = useState(false);
  const [editingType, setEditingType] = useState<PersonType | undefined>();
  const [typeName, setTypeName] = useState("");
  const [typeColor, setTypeColor] = useState<string | undefined>();
  const [fieldSheetFor, setFieldSheetFor] = useState<string | null>(null);
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldKind, setFieldKind] = useState<FieldKind>("text");

  const openCreate = () => {
    setEditingType(undefined);
    setTypeName("");
    setTypeColor(TYPE_COLORS[0]);
    setTypeSheet(true);
  };

  const openEdit = (t: PersonType) => {
    setEditingType(t);
    setTypeName(t.name);
    setTypeColor(t.color);
    setTypeSheet(true);
  };

  const saveType = () => {
    if (editingType) {
      updatePersonType(editingType.id, { name: typeName.trim(), color: typeColor });
    } else {
      addPersonType(typeName.trim(), typeColor);
    }
    setTypeSheet(false);
  };

  const saveField = () => {
    if (!fieldSheetFor) return;
    addField(fieldSheetFor, { label: fieldLabel.trim(), kind: fieldKind });
    setFieldLabel("");
    setFieldKind("text");
    setFieldSheetFor(null);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Typy osób definiują, jakie pola ma formularz i profil osoby. Pola są
          danymi — możesz tworzyć własne typy.
        </Text>

        {personTypes.map((t) => {
          const count = people.filter((p) => p.typeId === t.id).length;
          const c = t.color ?? colors.secondary;
          return (
            <View key={t.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 9, flex: 1 }}>
                  <View style={[styles.colorDot, { backgroundColor: c }]} />
                  <Text style={styles.typeName}>{t.name}</Text>
                  <Text style={styles.typeCount}>
                    {count} os.
                  </Text>
                </View>
                <Pressable onPress={() => openEdit(t)} hitSlop={6} style={styles.iconBtn}>
                  <Feather name="edit-2" size={14} color={colors.chipText} />
                </Pressable>
                {personTypes.length > 1 && (
                  <Pressable
                    onPress={() => deletePersonType(t.id)}
                    hitSlop={6}
                    style={styles.iconBtn}
                  >
                    <Feather name="trash-2" size={14} color={colors.danger} />
                  </Pressable>
                )}
              </View>

              <View style={{ gap: 7 }}>
                {t.fields.map((f) => (
                  <View key={f.id} style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{f.label}</Text>
                    <View
                      style={[
                        styles.kindBadge,
                        { backgroundColor: alpha(c, 0.12) },
                      ]}
                    >
                      <Text style={[styles.kindBadgeText, { color: c }]}>
                        {KIND_LABELS[f.kind]}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => removeField(t.id, f.id)}
                      hitSlop={6}
                    >
                      <Feather name="x" size={14} color={colors.secondary} />
                    </Pressable>
                  </View>
                ))}
                {t.fields.length === 0 && (
                  <Text style={styles.noFields}>Brak pól custom.</Text>
                )}
              </View>

              <Pressable
                style={styles.addFieldBtn}
                onPress={() => {
                  setFieldLabel("");
                  setFieldKind("text");
                  setFieldSheetFor(t.id);
                }}
              >
                <Feather name="plus" size={13} color={colors.accentBright} />
                <Text style={styles.addFieldText}>Dodaj pole</Text>
              </Pressable>
            </View>
          );
        })}

        <PrimaryButton label="Nowy typ osoby" onPress={openCreate} />
        <View style={{ height: 40 }} />
      </ScrollView>

      <Sheet
        visible={typeSheet}
        onClose={() => setTypeSheet(false)}
        title={editingType ? "Edytuj typ" : "Nowy typ osoby"}
      >
        <LabeledInput
          label="Nazwa typu"
          value={typeName}
          onChangeText={setTypeName}
          placeholder="np. Podwykonawca"
        />
        <SectionLabel>Kolor</SectionLabel>
        <View style={styles.colorRow}>
          {TYPE_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setTypeColor(c)}
              style={[
                styles.colorSwatch,
                { backgroundColor: c },
                typeColor === c && styles.colorSwatchOn,
              ]}
            />
          ))}
        </View>
        <PrimaryButton
          label={editingType ? "Zapisz zmiany" : "Utwórz typ"}
          onPress={saveType}
          disabled={!typeName.trim()}
        />
      </Sheet>

      <Sheet
        visible={!!fieldSheetFor}
        onClose={() => setFieldSheetFor(null)}
        title="Nowe pole"
      >
        <LabeledInput
          label="Etykieta pola"
          value={fieldLabel}
          onChangeText={setFieldLabel}
          placeholder="np. Numer umowy"
        />
        <SectionLabel>Rodzaj</SectionLabel>
        <View style={{ marginTop: 9, marginBottom: 16 }}>
          <Segmented options={KIND_OPTIONS} value={fieldKind} onChange={setFieldKind} />
        </View>
        <PrimaryButton
          label="Dodaj pole"
          onPress={saveField}
          disabled={!fieldLabel.trim()}
        />
      </Sheet>
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
  intro: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.secondary,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 14,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 11,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  typeName: {
    fontFamily: fonts.heading,
    fontSize: 15.5,
    color: colors.text,
  },
  typeCount: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.cardInset,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  fieldLabel: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 12.5,
    color: colors.body,
  },
  kindBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 100,
  },
  kindBadgeText: {
    fontFamily: fonts.monoMedium,
    fontSize: 9.5,
  },
  noFields: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.muted,
  },
  addFieldBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 11,
    alignSelf: "flex-start",
  },
  addFieldText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.accentBright,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 9,
    marginBottom: 16,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  colorSwatchOn: {
    borderWidth: 3,
    borderColor: colors.text,
  },
});
