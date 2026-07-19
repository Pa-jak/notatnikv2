import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NoteCard } from "@/components/note-card";
import { NoteComposer } from "@/components/note-composer";
import { OptionPill } from "@/components/pickers";
import { ProjectForm } from "@/components/project-form";
import {
  ProjectCardCollapsed,
  ProjectCardExpanded,
  plural,
} from "@/components/project-card";
import { Chip, Fab, SectionLabel, Sheet, TagChip } from "@/components/ui";
import { noteGroupLabel } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { colors, fonts, importanceLabels } from "@/lib/theme";
import type { Importance, Note } from "@/lib/types";

type ViewMode = "projects" | "all";
type SortDir = "desc" | "asc";

export default function NotesScreen() {
  const router = useRouter();
  const { projects, notes, tasks, people, toggleTask, logout } = useStore();
  const [mode, setMode] = useState<ViewMode>("projects");
  const [expandedId, setExpandedId] = useState<string | null>(
    projects[0]?.id ?? null
  );
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [importance, setImportance] = useState<Importance | undefined>();
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [importanceSheet, setImportanceSheet] = useState(false);
  const [composer, setComposer] = useState(false);
  const [projectForm, setProjectForm] = useState(false);
  const [search, setSearch] = useState("");

  const allTags = useMemo(
    () => [...new Set(projects.flatMap((p) => p.tags))],
    [projects]
  );

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (activeTags.length > 0) {
      list = list.filter((p) => activeTags.every((t) => p.tags.includes(t)));
    }
    if (importance) {
      list = list.filter((p) => p.importance === importance);
    }
    return [...list].sort((a, b) =>
      sortDir === "desc"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt)
    );
  }, [projects, activeTags, importance, sortDir]);

  const looseNotes = useMemo(
    () => notes.filter((n) => !n.projectId),
    [notes]
  );

  const searchedNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q)
        )
      : notes;
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [notes, search]);

  const groupedNotes = useMemo(() => {
    const groups: { label: string; items: Note[] }[] = [];
    for (const n of searchedNotes) {
      const label = noteGroupLabel(n.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(n);
      else groups.push({ label, items: [n] });
    }
    return groups;
  }, [searchedNotes]);

  const activeCount = projects.filter((p) => p.status === "active").length;
  const filtersActive = activeTags.length > 0 || !!importance;

  const stats = (projectId: string) => {
    const pt = tasks.filter((t) => t.projectId === projectId);
    return {
      noteCount: notes.filter((n) => n.projectId === projectId).length,
      taskCount: pt.length,
      doneCount: pt.filter((t) => t.column === "done").length,
    };
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.breadcrumb}>
          <Feather name="folder" size={14} color={colors.accent} />
          <Pressable onPress={() => setMode("all")}>
            <Text
              style={[
                styles.crumb,
                { color: mode === "all" ? colors.accent : colors.secondaryAlt },
              ]}
            >
              Wszystkie
            </Text>
          </Pressable>
          <Text style={styles.crumbSep}>/</Text>
          <Pressable onPress={() => setMode("projects")}>
            <Text
              style={[
                styles.crumb,
                {
                  color:
                    mode === "projects" ? colors.accent : colors.secondaryAlt,
                },
              ]}
            >
              Projekty
            </Text>
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Text style={styles.title}>
              {mode === "projects" ? "Projekty" : "Wszystkie notatki"}
            </Text>
            <Pressable onPress={logout} hitSlop={10}>
              <Feather name="log-out" size={18} color={colors.secondary} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            {mode === "projects"
              ? `${activeCount} aktywne`
              : `${searchedNotes.length} ${plural(searchedNotes.length, "notatka", "notatki", "notatek")}`}
          </Text>
        </View>

        {mode === "projects" ? (
          <>
            <View style={styles.filterRow}>
              <Chip
                label="Filtry"
                icon="filter"
                active={filtersActive}
                onPress={() => {
                  setActiveTags([]);
                  setImportance(undefined);
                }}
              />
              <Chip
                label={importance ? `Ważność: ${importanceLabels[importance]}` : "Ważność ▾"}
                active={false}
                onPress={() => setImportanceSheet(true)}
              />
              <Chip
                label={sortDir === "desc" ? "Data: najnowsze" : "Data: najstarsze"}
                active={false}
                onPress={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              />
            </View>
            <View style={styles.newProjectRow}>
              <Chip
                label="Nowy projekt"
                icon="plus"
                onPress={() => setProjectForm(true)}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tagRow}>
                {allTags.map((t) => (
                  <TagChip
                    key={t}
                    tag={t}
                    active={activeTags.includes(t)}
                    onPress={() =>
                      setActiveTags((tags) =>
                        tags.includes(t)
                          ? tags.filter((x) => x !== t)
                          : [...tags, t]
                      )
                    }
                  />
                ))}
              </View>
            </ScrollView>
          </>
        ) : (
          <View style={styles.searchBox}>
            <Feather name="search" size={15} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Szukaj w notatkach…"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Feather name="x" size={15} color={colors.secondary} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {mode === "projects" ? (
          <>
            {filteredProjects.map((p) =>
              p.id === expandedId ? (
                <ProjectCardExpanded
                  key={p.id}
                  project={p}
                  stats={stats(p.id)}
                  tasks={tasks.filter((t) => t.projectId === p.id)}
                  people={people.filter((per) => p.peopleIds.includes(per.id))}
                  onToggleTask={toggleTask}
                  onOpen={() => router.push(`/project/${p.id}`)}
                  onCollapse={() => setExpandedId(null)}
                />
              ) : (
                <ProjectCardCollapsed
                  key={p.id}
                  project={p}
                  stats={stats(p.id)}
                  onPress={() => setExpandedId(p.id)}
                />
              )
            )}
            {filteredProjects.length === 0 && (
              <Text style={styles.empty}>
                Brak projektów pasujących do filtrów.
              </Text>
            )}
            {looseNotes.length > 0 && !filtersActive && (
              <>
                <View style={{ marginTop: 8, marginHorizontal: 2 }}>
                  <SectionLabel>Luźne notatki</SectionLabel>
                </View>
                {looseNotes.map((n) => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    people={people}
                    onPress={() => router.push(`/note/${n.id}`)}
                    onPressPerson={(id) => router.push(`/person/${id}`)}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          groupedNotes.map((g) => (
            <View key={g.label} style={{ gap: 10 }}>
              <View style={{ marginHorizontal: 2, marginTop: 4 }}>
                <SectionLabel>{g.label}</SectionLabel>
              </View>
              {g.items.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  people={people}
                  onPress={() => router.push(`/note/${n.id}`)}
                  onPressPerson={(id) => router.push(`/person/${id}`)}
                />
              ))}
            </View>
          ))
        )}
        <View style={{ height: 140 }} />
      </ScrollView>

      <Fab onPress={() => setComposer(true)} />

      <NoteComposer visible={composer} onClose={() => setComposer(false)} />

      <ProjectForm visible={projectForm} onClose={() => setProjectForm(false)} />

      <Sheet
        visible={importanceSheet}
        onClose={() => setImportanceSheet(false)}
        title="Filtruj po ważności"
      >
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <OptionPill
            label="Wszystkie"
            active={!importance}
            onPress={() => {
              setImportance(undefined);
              setImportanceSheet(false);
            }}
          />
          {(Object.keys(importanceLabels) as Importance[]).map((i) => (
            <OptionPill
              key={i}
              label={importanceLabels[i]}
              active={importance === i}
              onPress={() => {
                setImportance(i);
                setImportanceSheet(false);
              }}
            />
          ))}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  crumb: {
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  crumbSep: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.mutedAlt,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  filterRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 10,
  },
  newProjectRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    color: colors.text,
    paddingVertical: 9,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    gap: 13,
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.secondary,
    textAlign: "center",
    paddingVertical: 20,
  },
});
