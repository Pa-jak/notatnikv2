import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { DateField } from "@/components/date-picker";
import { OptionPill, ProjectSelect } from "@/components/pickers";
import {
  GhostButton,
  LabeledInput,
  PrimaryButton,
  SectionLabel,
  Segmented,
  Sheet,
} from "@/components/ui";
import { categoryColors, categoryLabels } from "@/lib/theme";
import { useStore } from "@/lib/store";
import type { Column, Task, TaskCategory } from "@/lib/types";

const CATEGORIES = Object.keys(categoryLabels) as TaskCategory[];

const COLUMN_OPTIONS: { value: Column; label: string }[] = [
  { value: "todo", label: "Do zrobienia" },
  { value: "doing", label: "W trakcie" },
  { value: "done", label: "Zrobione" },
];

export function TaskEditSheet({
  visible,
  onClose,
  task,
  defaultColumn,
  defaultDate,
  defaultProjectId,
}: {
  visible: boolean;
  onClose: () => void;
  task?: Task;
  defaultColumn?: Column;
  defaultDate?: string;
  defaultProjectId?: string;
}) {
  const { people, projects, addTask, updateTask, deleteTask, moveTask } =
    useStore();
  const [title, setTitle] = useState("");
  const [column, setColumn] = useState<Column>("todo");
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [dueTime, setDueTime] = useState("");
  const [category, setCategory] = useState<TaskCategory | undefined>();
  const [personId, setPersonId] = useState<string | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();

  useEffect(() => {
    if (!visible) return;
    setTitle(task?.title ?? "");
    setColumn(task?.column ?? defaultColumn ?? "todo");
    setDueDate(task?.dueDate ?? defaultDate);
    setDueTime(task?.dueTime ?? "");
    setCategory(task?.category);
    setPersonId(task?.personId);
    setProjectId(task?.projectId ?? defaultProjectId);
  }, [visible, task, defaultColumn, defaultDate, defaultProjectId]);

  const save = () => {
    const time = /^\d{1,2}:\d{2}$/.test(dueTime.trim())
      ? dueTime.trim().padStart(5, "0")
      : undefined;
    const payload = {
      title: title.trim(),
      dueDate,
      dueTime: dueDate ? time : undefined,
      category,
      personId,
      projectId,
    };
    if (task) {
      updateTask(task.id, payload);
      if (task.column !== column) moveTask(task.id, column);
    } else {
      addTask({ ...payload, column });
    }
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={task ? "Edytuj zadanie" : "Nowe zadanie"}
    >
      <LabeledInput
        label="Tytuł"
        value={title}
        onChangeText={setTitle}
        placeholder="Co jest do zrobienia?"
      />

      <SectionLabel>Kolumna</SectionLabel>
      <View style={{ marginTop: 9, marginBottom: 15 }}>
        <Segmented options={COLUMN_OPTIONS} value={column} onChange={setColumn} />
      </View>

      <DateField label="Termin" value={dueDate} onChange={setDueDate} />

      {dueDate && (
        <LabeledInput
          label="Godzina (opcjonalnie, HH:MM)"
          value={dueTime}
          onChangeText={setDueTime}
          placeholder="np. 14:00"
        />
      )}

      <SectionLabel>Kategoria</SectionLabel>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 9, marginBottom: 15 }}
      >
        <View style={{ flexDirection: "row", gap: 7 }}>
          {CATEGORIES.map((c) => (
            <OptionPill
              key={c}
              label={categoryLabels[c]}
              color={categoryColors[c]}
              active={category === c}
              onPress={() => setCategory(category === c ? undefined : c)}
            />
          ))}
        </View>
      </ScrollView>

      <SectionLabel>Osoba</SectionLabel>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 9, marginBottom: 15 }}
      >
        <View style={{ flexDirection: "row", gap: 7 }}>
          <OptionPill
            label="Nikt"
            active={!personId}
            onPress={() => setPersonId(undefined)}
          />
          {people.map((p) => (
            <OptionPill
              key={p.id}
              label={p.name}
              active={personId === p.id}
              onPress={() => setPersonId(p.id)}
            />
          ))}
        </View>
      </ScrollView>

      <SectionLabel>Projekt</SectionLabel>
      <View style={{ marginTop: 9, marginBottom: 17 }}>
        <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} />
      </View>

      <PrimaryButton
        label={task ? "Zapisz zmiany" : "Dodaj zadanie"}
        onPress={save}
        disabled={!title.trim()}
      />
      {task && (
        <View style={{ marginTop: 9 }}>
          <GhostButton
            label="Usuń zadanie"
            danger
            icon="trash-2"
            onPress={() => {
              deleteTask(task.id);
              onClose();
            }}
          />
        </View>
      )}
    </Sheet>
  );
}
