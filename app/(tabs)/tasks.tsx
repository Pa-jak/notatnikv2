import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { plural } from "@/components/project-card";
import { TaskEditSheet } from "@/components/task-edit-sheet";
import { useStore } from "@/lib/store";
import { isOverdue, parseISODate, relativeDayLabel } from "@/lib/dates";
import {
  alpha,
  categoryColors,
  colors,
  fonts,
} from "@/lib/theme";
import type { Column, Task } from "@/lib/types";

const COLUMNS: { key: Column; label: string }[] = [
  { key: "todo", label: "Do zrobienia" },
  { key: "doing", label: "W trakcie" },
  { key: "done", label: "Zrobione" },
];

export default function TasksScreen() {
  const { tasks, people, projects, moveTask } = useStore();
  const [sheet, setSheet] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [newColumn, setNewColumn] = useState<Column>("todo");

  const openNew = (col: Column) => {
    setEditing(undefined);
    setNewColumn(col);
    setSheet(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setSheet(true);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Zadania</Text>
        <Text style={styles.subtitle}>
          {tasks.length} {plural(tasks.length, "zadanie", "zadania", "zadań")}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.board}
      >
        {COLUMNS.map(({ key, label }, colIdx) => {
          const colTasks = tasks
            .filter((t) => t.column === key)
            .sort((a, b) => a.order - b.order);
          return (
            <View key={key} style={styles.column}>
              <View style={styles.colHead}>
                <Text style={styles.colTitle}>{label}</Text>
                <View style={styles.colCount}>
                  <Text style={styles.colCountText}>{colTasks.length}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => openNew(key)} hitSlop={6} style={styles.colAdd}>
                  <Feather name="plus" size={15} color={colors.accentBright} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={{ gap: 9, paddingBottom: 30 }}>
                {colTasks.map((t) => (
                  <TaskKanbanCard
                    key={t.id}
                    task={t}
                    personName={people.find((p) => p.id === t.personId)?.name}
                    projectName={projects.find((p) => p.id === t.projectId)?.name}
                    onPress={() => openEdit(t)}
                    onMoveLeft={
                      colIdx > 0
                        ? () => moveTask(t.id, COLUMNS[colIdx - 1].key)
                        : undefined
                    }
                    onMoveRight={
                      colIdx < COLUMNS.length - 1
                        ? () => moveTask(t.id, COLUMNS[colIdx + 1].key)
                        : undefined
                    }
                  />
                ))}
                {colTasks.length === 0 && (
                  <Text style={styles.emptyCol}>Pusto tutaj.</Text>
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      <TaskEditSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        task={editing}
        defaultColumn={newColumn}
      />
    </SafeAreaView>
  );
}

function TaskKanbanCard({
  task,
  personName,
  projectName,
  onPress,
  onMoveLeft,
  onMoveRight,
}: {
  task: Task;
  personName?: string;
  projectName?: string;
  onPress: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}) {
  const overdue =
    task.dueDate && task.column !== "done" && isOverdue(task.dueDate);
  const cat = task.category ? categoryColors[task.category] : undefined;
  const done = task.column === "done";
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {cat && <View style={[styles.cardAccent, { backgroundColor: cat }]} />}
      <View style={{ flex: 1, minWidth: 0, gap: 7 }}>
        <Text
          style={[
            styles.cardTitle,
            done && {
              color: colors.secondary,
              textDecorationLine: "line-through",
            },
          ]}
        >
          {task.title}
        </Text>
        <View style={styles.cardChips}>
          {task.dueDate && (
            <View
              style={[
                styles.dueChip,
                overdue && {
                  backgroundColor: alpha(colors.danger, 0.14),
                  borderColor: alpha(colors.danger, 0.4),
                },
              ]}
            >
              <Feather
                name={overdue ? "alert-circle" : "calendar"}
                size={10}
                color={overdue ? colors.danger : colors.secondary}
              />
              <Text
                style={[
                  styles.dueChipText,
                  overdue && { color: colors.danger },
                ]}
              >
                {relativeDayLabel(parseISODate(task.dueDate))}
                {task.dueTime ? ` · ${task.dueTime}` : ""}
              </Text>
            </View>
          )}
          {personName && (
            <View style={styles.metaChip}>
              <Feather name="user" size={10} color={colors.secondary} />
              <Text style={styles.metaChipText}>{personName.split(" ")[0]}</Text>
            </View>
          )}
          {projectName && (
            <View style={styles.metaChip}>
              <Feather name="folder" size={10} color={colors.secondary} />
              <Text style={styles.metaChipText}>{projectName}</Text>
            </View>
          )}
        </View>
        <View style={styles.moveRow}>
          {onMoveLeft ? (
            <Pressable onPress={onMoveLeft} hitSlop={8} style={styles.moveBtn}>
              <Feather name="arrow-left" size={13} color={colors.secondaryAlt} />
            </Pressable>
          ) : (
            <View style={styles.moveBtn} />
          )}
          {onMoveRight ? (
            <Pressable onPress={onMoveRight} hitSlop={8} style={styles.moveBtn}>
              <Feather name="arrow-right" size={13} color={colors.secondaryAlt} />
            </Pressable>
          ) : (
            <View style={styles.moveBtn} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.mutedAlt,
    marginBottom: 3,
  },
  board: {
    padding: 14,
    gap: 12,
  },
  column: {
    width: 272,
    backgroundColor: colors.cardInset,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    padding: 10,
  },
  colHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  colTitle: {
    fontFamily: fonts.heading,
    fontSize: 13.5,
    color: colors.text,
  },
  colCount: {
    backgroundColor: colors.input,
    borderRadius: 100,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  colCountText: {
    fontFamily: fonts.monoMedium,
    fontSize: 10.5,
    color: colors.secondaryAlt,
  },
  colAdd: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    padding: 12,
  },
  cardAccent: {
    width: 3,
    borderRadius: 2,
    alignSelf: "stretch",
  },
  cardTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSoft,
  },
  cardChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  dueChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 100,
  },
  dueChipText: {
    fontFamily: fonts.monoMedium,
    fontSize: 9.5,
    color: colors.secondaryAlt,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 100,
  },
  metaChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 9.5,
    color: colors.tagText,
  },
  moveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  moveBtn: {
    width: 26,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCol: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    paddingVertical: 16,
  },
});
