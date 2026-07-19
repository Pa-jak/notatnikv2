import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NoteCard } from "@/components/note-card";
import { NoteComposer } from "@/components/note-composer";
import { OptionPill } from "@/components/pickers";
import { TaskCheckRow, plural, projectIconMap } from "@/components/project-card";
import { TaskEditSheet } from "@/components/task-edit-sheet";
import {
  Avatar,
  IconSquare,
  ImportanceBadge,
  GhostButton,
  LabeledInput,
  PrimaryButton,
  ProgressBar,
  SectionLabel,
  Sheet,
  StatusBadge,
  TagPill,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { colors, fonts, importanceLabels, statusLabels } from "@/lib/theme";
import type { Importance, ProjectStatus, Task } from "@/lib/types";

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    projects,
    notes,
    tasks,
    people,
    toggleTask,
    updateProject,
    deleteProject,
  } = useStore();
  const [editSheet, setEditSheet] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [blockedDraft, setBlockedDraft] = useState("");
  const [taskSheet, setTaskSheet] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [composer, setComposer] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <View style={styles.screen}>
        <Text style={styles.missing}>Nie znaleziono projektu.</Text>
      </View>
    );
  }

  const projectTasks = tasks
    .filter((t) => t.projectId === project.id)
    .sort((a, b) => (a.column === "done" ? 1 : 0) - (b.column === "done" ? 1 : 0));
  const projectNotes = notes
    .filter((n) => n.projectId === project.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const members = people.filter((p) => project.peopleIds.includes(p.id));
  const done = projectTasks.filter((t) => t.column === "done").length;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: project.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headRow}>
          <IconSquare
            icon={projectIconMap[project.icon]}
            color={colors.accentBright}
            size={44}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name}>{project.name}</Text>
            <Text style={styles.meta}>
              {projectNotes.length} {plural(projectNotes.length, "notatka", "notatki", "notatek")} ·{" "}
              {projectTasks.length} {plural(projectTasks.length, "zadanie", "zadania", "zadań")}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setBlockedDraft(project.blockedReason ?? "");
              setEditSheet(true);
            }}
            style={styles.editBtn}
          >
            <Feather name="edit-2" size={14} color={colors.chipText} />
          </Pressable>
        </View>

        <View style={styles.badgeRow}>
          <StatusBadge status={project.status} />
          <ImportanceBadge importance={project.importance} />
          {project.tags.map((t) => (
            <TagPill key={t} tag={t} />
          ))}
        </View>

        {project.blockedReason && (
          <View style={styles.blockedBox}>
            <Feather
              name="alert-triangle"
              size={14}
              color={colors.amber}
              style={{ marginTop: 1 }}
            />
            <Text style={styles.blockedText}>
              <Text style={{ fontFamily: fonts.sansSemi, color: colors.warnText }}>
                Czemu stoi:{" "}
              </Text>
              {project.blockedReason}
            </Text>
          </View>
        )}

        <View>
          <View style={styles.progressHead}>
            <Text style={styles.progressLabel}>Postęp zadań</Text>
            <Text style={[styles.progressLabel, { color: colors.accentBright }]}>
              {done}/{projectTasks.length}
            </Text>
          </View>
          <ProgressBar
            ratio={projectTasks.length ? done / projectTasks.length : 0}
          />
        </View>

        <View style={{ marginTop: 4, marginHorizontal: 2 }}>
          <SectionLabel>Zadania</SectionLabel>
        </View>
        <View style={{ gap: 9 }}>
          {projectTasks.map((t) => (
            <View key={t.id} style={styles.taskRow}>
              <View style={{ flex: 1 }}>
                <TaskCheckRow task={t} onToggle={() => toggleTask(t.id)} />
              </View>
              <Pressable
                onPress={() => {
                  setEditingTask(t);
                  setTaskSheet(true);
                }}
                hitSlop={6}
              >
                <Feather name="more-horizontal" size={16} color={colors.muted} />
              </Pressable>
            </View>
          ))}
          <Pressable
            style={styles.addRow}
            onPress={() => {
              setEditingTask(undefined);
              setTaskSheet(true);
            }}
          >
            <Feather name="plus" size={14} color={colors.accentBright} />
            <Text style={styles.addRowText}>Dodaj zadanie</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 4, marginHorizontal: 2 }}>
          <SectionLabel>Notatki projektu</SectionLabel>
        </View>
        {projectNotes.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            people={people}
            onPress={() => router.push(`/note/${n.id}`)}
            onPressPerson={(pid) => router.push(`/person/${pid}`)}
          />
        ))}
        <Pressable style={styles.addRow} onPress={() => setComposer(true)}>
          <Feather name="plus" size={14} color={colors.accentBright} />
          <Text style={styles.addRowText}>Dodaj notatkę</Text>
        </Pressable>

        <View style={{ marginTop: 4, marginHorizontal: 2 }}>
          <SectionLabel>Osoby</SectionLabel>
        </View>
        <View style={{ gap: 9 }}>
          {members.map((p) => (
            <Pressable
              key={p.id}
              style={styles.personRow}
              onPress={() => router.push(`/person/${p.id}`)}
            >
              <Avatar name={p.name} size={30} ringColor="transparent" />
              <Text style={styles.personName}>{p.name}</Text>
              <Feather name="chevron-right" size={16} color={colors.faint} />
            </Pressable>
          ))}
        </View>
        <View style={{ marginTop: 8 }}>
          <GhostButton
            label={confirmDelete ? "Na pewno usunąć?" : "Usuń projekt"}
            onPress={() => {
              if (confirmDelete) {
                deleteProject(project.id);
                router.back();
              } else {
                setConfirmDelete(true);
              }
            }}
            danger
            icon="trash-2"
          />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Sheet
        visible={editSheet}
        onClose={() => setEditSheet(false)}
        title="Edytuj projekt"
      >
        <SectionLabel>Status</SectionLabel>
        <View style={styles.pillRow}>
          {(Object.keys(statusLabels) as ProjectStatus[]).map((s) => (
            <OptionPill
              key={s}
              label={statusLabels[s]}
              active={project.status === s}
              onPress={() => updateProject(project.id, { status: s })}
            />
          ))}
        </View>
        <SectionLabel>Ważność</SectionLabel>
        <View style={styles.pillRow}>
          {(Object.keys(importanceLabels) as Importance[]).map((i) => (
            <OptionPill
              key={i}
              label={importanceLabels[i]}
              active={project.importance === i}
              onPress={() => updateProject(project.id, { importance: i })}
            />
          ))}
        </View>
        <LabeledInput
          label="Czemu stoi (puste = nie stoi)"
          value={blockedDraft}
          onChangeText={setBlockedDraft}
          placeholder="np. czekamy na akceptację budżetu…"
          multiline
        />
        <PrimaryButton
          label="Zapisz"
          onPress={() => {
            updateProject(project.id, {
              blockedReason: blockedDraft.trim() || undefined,
            });
            setEditSheet(false);
          }}
        />
      </Sheet>

      <TaskEditSheet
        visible={taskSheet}
        onClose={() => setTaskSheet(false)}
        task={editingTask}
        defaultProjectId={project.id}
      />

      <NoteComposer
        visible={composer}
        onClose={() => setComposer(false)}
        defaultProjectId={project.id}
      />
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
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: colors.secondary,
    marginTop: 2,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
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
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    marginHorizontal: 2,
  },
  addRowText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12.5,
    color: colors.accentBright,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  personName: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 9,
    marginBottom: 15,
  },
  missing: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.secondary,
    textAlign: "center",
    marginTop: 40,
  },
});
