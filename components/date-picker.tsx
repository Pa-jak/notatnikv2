import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  WEEKDAYS_GRID,
  addMonths,
  formatDayShort,
  formatMonthYear,
  isSameDay,
  monthMatrix,
  parseISODate,
  toISODate,
  today,
} from "@/lib/dates";
import { alpha, colors, fonts } from "@/lib/theme";

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (iso?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISODate(value) : undefined;
  const [cursor, setCursor] = useState(() => selected ?? today());

  return (
    <View style={{ marginBottom: 13 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setOpen((o) => !o)}>
        <Feather name="calendar" size={14} color={colors.secondary} />
        <Text
          style={[
            styles.fieldText,
            { color: selected ? colors.text : colors.muted },
          ]}
        >
          {selected ? formatDayShort(selected) + " " + selected.getFullYear() : "Bez daty"}
        </Text>
        {selected && (
          <Pressable onPress={() => onChange(undefined)} hitSlop={8}>
            <Feather name="x" size={14} color={colors.secondary} />
          </Pressable>
        )}
      </Pressable>
      {open && (
        <View style={styles.calendar}>
          <View style={styles.calHead}>
            <Pressable
              style={styles.navBtn}
              onPress={() => setCursor((c) => addMonths(c, -1))}
            >
              <Feather name="chevron-left" size={16} color={colors.chipText} />
            </Pressable>
            <Text style={styles.calTitle}>{formatMonthYear(cursor)}</Text>
            <Pressable
              style={styles.navBtn}
              onPress={() => setCursor((c) => addMonths(c, 1))}
            >
              <Feather name="chevron-right" size={16} color={colors.chipText} />
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {WEEKDAYS_GRID.map((d, i) => (
              <Text
                key={d}
                style={[styles.weekday, i >= 5 && { color: colors.faint }]}
              >
                {d}
              </Text>
            ))}
          </View>
          {monthMatrix(cursor.getFullYear(), cursor.getMonth()).map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((d) => {
                const inMonth = d.getMonth() === cursor.getMonth();
                const isToday = isSameDay(d, today());
                const isSelected = selected && isSameDay(d, selected);
                return (
                  <Pressable
                    key={d.toISOString()}
                    style={[
                      styles.dayCell,
                      isToday && !isSelected && styles.dayToday,
                      isSelected && styles.daySelected,
                    ]}
                    onPress={() => {
                      onChange(toISODate(d));
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !inMonth && { color: colors.faint },
                        isSelected && {
                          color: colors.onAccent,
                          fontFamily: fonts.sansSemi,
                        },
                      ]}
                    >
                      {d.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.secondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.cardInset,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  fieldText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13.5,
  },
  calendar: {
    marginTop: 8,
    backgroundColor: colors.cardInset,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 13,
    padding: 10,
  },
  calHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calTitle: {
    fontFamily: fonts.heading,
    fontSize: 13.5,
    color: colors.text,
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  weekRow: {
    flexDirection: "row",
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    color: colors.muted,
    paddingVertical: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1.15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: alpha(colors.accent, 0.5),
  },
  daySelected: {
    backgroundColor: colors.accent,
  },
  dayText: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.body,
  },
});
