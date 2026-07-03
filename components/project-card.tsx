import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  AvatarStack,
  IconSquare,
  ImportanceBadge,
  ProgressBar,
  StatusBadge,
  TagPill,
} from "@/components/ui";
import { colors, fonts } from "@/lib/theme";
import type { Person, Project, ProjectIcon, Task } from "@/lib/types";

export const projectIconMap: Record<ProjectIcon, "clock" | "star" | "list" | "folder" | "target"> = {
  clock: "clock",
  star: "star",
  list: "list",
  folder: "folder",
  target: "target",
};

export interface ProjectStats {
  noteCount: number;
  taskCount: number;
  doneCount: number;
}

export function TaskCheckRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: () => void;
}) {
  const done = task.column === "done";
  return (
    <Pressable onPress={onToggle} style={styles.checkRow}>
      <View style={[styles.checkbox, done && styles.checkboxDone]}>
        {done && <Feather name="check" size={11} color={colors.onAccent} />}
      </View>
      <Text
        style={[
          styles.checkText,
          done && { color: colors.secondary, textDecorationLine: "line-through" },
        ]}
      >
        {task.title}
      </Text>
    </Pressable>
  );
}

export function ProjectCardExpanded({
  project,
  stats,
  tasks,
  people,
  onToggleTask,
  onOpen,
  onCollapse,
}: {
  project: Project;
  stats: ProjectStats;
  tasks: Task[];
  people: Person[];
  onToggleTask: (id: string) => void;
  onOpen: () => void;
  onCollapse: () => void;
}) {
  const shown = tasks.filter((t) => t.column !== "done").slice(0, 3);
  const doneShown = tasks.filter((t) => t.column === "done").slice(0, 1);
  const checklist = [...doneShown, ...shown];
  return (
    <View style={styles.expanded}>
      <Pressable onPress={onCollapse} style={styles.headRow}>
        <View style={{ flexDirection: "row", gap: 11, alignItems: "center", flex: 1, minWidth: 0 }}>
          <IconSquare icon={projectIconMap[project.icon]} color={colors.accentBright} size={40} />
          <View style={{ minWidth: 0, flex: 1 }}>
            <Text style={styles.name}>{project.name}</Text>
            <Text style={styles.meta}>
              {stats.noteCount} {plural(stats.noteCount, "notatka", "notatki", "notatek")} ·{" "}
              {stats.taskCount} {plural(stats.taskCount, "zadanie", "zadania", "zadań")}
            </Text>
          </View>
        </View>
        <StatusBadge status={project.status} />
      </Pressable>

      <View style={styles.tagRow}>
        <ImportanceBadge importance={project.importance} />
        {project.tags.map((t) => (
          <TagPill key={t} tag={t} />
        ))}
      </View>

      {project.blockedReason && (
        <View style={styles.blockedBox}>
          <Feather name="alert-triangle" size={14} color={colors.amber} style={{ marginTop: 1 }} />
          <Text style={styles.blockedText}>
            <Text style={{ fontFamily: fonts.sansSemi, color: colors.warnText }}>
              Czemu stoi:{" "}
            </Text>
            {project.blockedReason}
          </Text>
        </View>
      )}

      <View style={{ marginBottom: 12 }}>
        <View style={styles.progressHead}>
          <Text style={styles.progressLabel}>Postęp zadań</Text>
          <Text style={[styles.progressLabel, { color: colors.accentBright }]}>
            {stats.doneCount}/{stats.taskCount}
          </Text>
        </View>
        <ProgressBar ratio={stats.taskCount ? stats.doneCount / stats.taskCount : 0} />
      </View>

      <View style={{ gap: 7, marginBottom: 13 }}>
        {checklist.map((t) => (
          <TaskCheckRow key={t.id} task={t} onToggle={() => onToggleTask(t.id)} />
        ))}
      </View>

      <Pressable onPress={onOpen} style={styles.footRow}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <AvatarStack names={people.map((p) => p.name)} />
          <Text style={styles.peopleCount}>
            {people.length} {plural(people.length, "osoba", "osoby", "osób")}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.accentBright} />
      </Pressable>
    </View>
  );
}

export function ProjectCardCollapsed({
  project,
  stats,
  onPress,
}: {
  project: Project;
  stats: ProjectStats;
  onPress: () => void;
}) {
  const pct = stats.taskCount
    ? Math.round((stats.doneCount / stats.taskCount) * 100)
    : 0;
  return (
    <Pressable onPress={onPress} style={styles.collapsed}>
      <IconSquare icon={projectIconMap[project.icon]} color={iconColor(project)} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.collapsedName}>{project.name}</Text>
          <StatusBadge status={project.status} />
        </View>
        <Text style={[styles.meta, { marginTop: 3 }]}>
          {stats.noteCount} {plural(stats.noteCount, "notatka", "notatki", "notatek")} ·{" "}
          {stats.taskCount} {plural(stats.taskCount, "zadanie", "zadania", "zadań")} · postęp {pct}%
        </Text>
        <View style={[styles.tagRow, { marginTop: 7, marginBottom: 0 }]}>
          <ImportanceBadge importance={project.importance} />
          {project.tags.map((t) => (
            <TagPill key={t} tag={t} />
          ))}
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={colors.faint} />
    </Pressable>
  );
}

function iconColor(project: Project): string {
  if (project.icon === "star") return colors.accentBright;
  if (project.icon === "list") return colors.blue;
  return colors.accentBright;
}

export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const styles = StyleSheet.create({
  expanded: {
    backgroundColor: colors.cardRaised,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: 16,
    padding: 15,
  },
  collapsed: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 11,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 16.5,
    color: colors.text,
  },
  collapsedName: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: colors.secondary,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 11,
  },
  blockedBox: {
    flexDirection: "row",
    gap: 7,
    backgroundColor: colors.cardInset,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  blockedText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 11.5,
    lineHeight: 16.5,
    color: colors.warnBody,
  },
  progressHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.secondary,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.faint,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.body,
  },
  footRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  peopleCount: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.secondary,
    marginLeft: 9,
  },
});
