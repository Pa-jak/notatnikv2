import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { OptionPill } from "@/components/pickers";
import {
  LabeledInput,
  PrimaryButton,
  SectionLabel,
  Sheet,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/lib/theme";
import type { Person } from "@/lib/types";

export function PersonForm({
  visible,
  onClose,
  person,
}: {
  visible: boolean;
  onClose: () => void;
  person?: Person;
}) {
  const { personTypes, addPerson, updatePerson } = useStore();
  const [typeId, setTypeId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setTypeId(person?.typeId);
    setName(person?.name ?? "");
    setPhone(person?.phone ?? "");
    setEmail(person?.email ?? "");
    setValues(person?.values ?? {});
  }, [visible, person]);

  const type = personTypes.find((t) => t.id === typeId);

  const save = () => {
    if (!typeId) return;
    const payload = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      typeId,
      values,
    };
    if (person) updatePerson(person.id, payload);
    else addPerson(payload);
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={person ? "Edytuj osobę" : "Nowa osoba"}
    >
      <SectionLabel>Typ osoby</SectionLabel>
      <View style={styles.typeRow}>
        {personTypes.map((t) => (
          <OptionPill
            key={t.id}
            label={t.name}
            color={t.color}
            active={typeId === t.id}
            onPress={() => setTypeId(t.id)}
          />
        ))}
      </View>

      {!typeId ? (
        <Text style={styles.hint}>
          Najpierw wybierz typ — formularz dopasuje pola do typu osoby.
        </Text>
      ) : (
        <>
          <LabeledInput
            label="Imię i nazwisko"
            value={name}
            onChangeText={setName}
            placeholder="np. Jan Kowalski"
          />
          <LabeledInput
            label="Telefon"
            value={phone}
            onChangeText={setPhone}
            placeholder="+48 …"
            keyboardType="phone-pad"
          />
          <LabeledInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="adres@email.pl"
            keyboardType="email-address"
          />

          {type && type.fields.length > 0 && (
            <>
              <View style={{ marginBottom: 9 }}>
                <SectionLabel>{`Pola typu „${type.name}"`}</SectionLabel>
              </View>
              {type.fields.map((f) => (
                <LabeledInput
                  key={f.id}
                  label={f.label}
                  value={values[f.id] ?? ""}
                  onChangeText={(v) =>
                    setValues((vals) => ({ ...vals, [f.id]: v }))
                  }
                  placeholder={
                    f.kind === "number"
                      ? "np. 123"
                      : f.kind === "date"
                        ? "RRRR-MM-DD"
                        : "…"
                  }
                  keyboardType={f.kind === "number" ? "numeric" : "default"}
                />
              ))}
            </>
          )}

          <PrimaryButton
            label={person ? "Zapisz zmiany" : "Dodaj osobę"}
            onPress={save}
            disabled={!name.trim()}
          />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 9,
    marginBottom: 15,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.secondary,
    paddingBottom: 10,
  },
});
