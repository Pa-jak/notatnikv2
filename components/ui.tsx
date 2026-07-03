import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  alpha,
  avatarGradient,
  colors,
  fonts,
  importanceColors,
  importanceLabels,
  initials,
  statusColors,
  statusLabels,
} from "@/lib/theme";
import type { Importance, ProjectStatus } from "@/lib/types";

export function Chip({
  label,
  active,
  icon,
  removable,
  onPress,
}: {
  label: string;
  active?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  removable?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
    >
      {icon && (
        <Feather
          name={icon}
          size={13}
          color={active ? colors.onAccent : colors.secondary}
        />
      )}
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.onAccent : colors.chipText },
        ]}
      >
        {label}
      </Text>
      {removable && (
        <Feather name="x" size={11} color={active ? colors.onAccent : colors.secondary} />
      )}
    </Pressable>
  );
}

export function TagChip({
  tag,
  active,
  onPress,
}: {
  tag: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tagChip,
        active
          ? {
              backgroundColor: alpha(colors.accent, 0.16),
              borderColor: alpha(colors.accent, 0.4),
            }
          : {
              backgroundColor: colors.input,
              borderColor: colors.borderStrong,
            },
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.sansMedium,
          fontSize: 11.5,
          color: active ? colors.accentBright : colors.secondaryAlt,
        }}
      >
        {tag}
      </Text>
      {active && <Feather name="x" size={10} color={colors.accentBright} />}
    </Pressable>
  );
}

export function TagPill({ tag }: { tag: string }) {
  return (
    <View style={styles.tagPill}>
      <Text style={styles.tagPillText}>{tag}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const c = statusColors[status];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: alpha(c, 0.14), borderColor: alpha(c, 0.3) },
      ]}
    >
      <View style={[styles.badgeDot, { backgroundColor: c }]} />
      <Text style={[styles.badgeText, { color: c }]}>{statusLabels[status]}</Text>
    </View>
  );
}

export function ImportanceBadge({ importance }: { importance: Importance }) {
  const c = importanceColors[importance];
  const glyph = importance === "high" ? "▲" : importance === "medium" ? "△" : "▽";
  return (
    <View
      style={[
        styles.badge,
        importance === "low"
          ? { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "transparent" }
          : { backgroundColor: alpha(c, 0.14), borderColor: alpha(c, 0.35) },
      ]}
    >
      <Text style={[styles.badgeText, { color: c }]}>
        {glyph} {importanceLabels[importance]}
      </Text>
    </View>
  );
}

export function Avatar({
  name,
  size = 26,
  ringColor = colors.cardRaised,
}: {
  name: string;
  size?: number;
  ringColor?: string;
}) {
  const [from, to] = avatarGradient(name);
  return (
    <LinearGradient
      colors={[from, to]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: ringColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: fonts.heading,
          fontSize: size * 0.36,
          color: "#fff",
        }}
      >
        {initials(name)}
      </Text>
    </LinearGradient>
  );
}

export function AvatarStack({
  names,
  ringColor = colors.cardRaised,
}: {
  names: string[];
  ringColor?: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {names.slice(0, 4).map((n, i) => (
        <View key={n + i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar name={n} ringColor={ringColor} />
        </View>
      ))}
    </View>
  );
}

export function ProgressBar({ ratio }: { ratio: number }) {
  return (
    <View style={styles.progressTrack}>
      <LinearGradient
        colors={[colors.accent, colors.accentBright]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: `${Math.round(ratio * 100)}%`, height: "100%" }}
      />
    </View>
  );
}

export function IconSquare({
  icon,
  color,
  size = 38,
}: {
  icon: keyof typeof Feather.glyphMap;
  color: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size > 36 ? 11 : 10,
        backgroundColor: alpha(color, 0.13),
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Feather name={icon} size={size * 0.47} color={color} />
    </View>
  );
}

export function Fab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.fabWrap}>
      <LinearGradient
        colors={[colors.accentBright, colors.accentDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fab}
      >
        <Feather name="plus" size={24} color={colors.onAccent} />
      </LinearGradient>
    </Pressable>
  );
}

export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheetBody}>
        <View style={styles.sheetHandle} />
        {title && <Text style={styles.sheetTitle}>{title}</Text>}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 28 }}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: colors.accent }]}
          >
            <Text
              style={{
                fontFamily: active ? fonts.sansSemi : fonts.sansMedium,
                fontSize: 12.5,
                color: active ? colors.onAccent : colors.secondaryAlt,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
}) {
  return (
    <View style={{ marginBottom: 13 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[
          styles.input,
          multiline && { minHeight: 88, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function PersonDot({
  name,
  onPress,
}: {
  name: string;
  onPress?: () => void;
}) {
  const [from] = avatarGradient(name);
  return (
    <Pressable onPress={onPress} style={styles.personDot}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: from }} />
      <Text style={styles.personDotText}>{name}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.primaryBtn, disabled && { opacity: 0.4 }]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  danger,
  icon,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const c = danger ? colors.danger : colors.chipText;
  return (
    <Pressable onPress={onPress} style={styles.ghostBtn}>
      {icon && <Feather name={icon} size={14} color={c} />}
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: c }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipIdle: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  tagPill: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 100,
  },
  tagPillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10.5,
    color: colors.tagText,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: fonts.sansSemi,
    fontSize: 10.5,
  },
  progressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: colors.cardInset,
    overflow: "hidden",
  },
  fabWrap: {
    position: "absolute",
    right: 18,
    bottom: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accentDeep,
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheetBody: {
    backgroundColor: colors.cardRaised,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.faint,
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: fonts.heading,
    fontSize: 19,
    color: colors.text,
    marginBottom: 14,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.cardInset,
    borderRadius: 11,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 8,
  },
  inputLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.secondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.cardInset,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
  },
  sectionLabel: {
    fontFamily: fonts.heading,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.muted,
  },
  personDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 100,
  },
  personDotText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.chipText,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryBtnText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.onAccent,
  },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingVertical: 11,
  },
});
