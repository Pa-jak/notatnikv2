import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
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
import { Fab, Segmented } from "@/components/ui";
import {
  WEEKDAYS_SHORT,
  WEEKDAYS_GRID,
  addDays,
  addMonths,
  formatDayFull,
  formatMonthYear,
  formatWeekRange,
  isSameDay,
  monthMatrix,
  parseISODate,
  relativeDayLabel,
  startOfWeek,
  toISODate,
  today,
} from "@/lib/dates";
import { useStore } from "@/lib/store";
import {
  alpha,
  categoryColors,
  colors,
  fonts,
} from "@/lib/theme";
import type { Task } from "@/lib/types";

type Range = "day" | "week" | "month";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "day", label: "Dzień" },
  { value: "week", label: "Tydzień" },
  { value: "month", label: "Mies." },
];

export default function CalendarScreen() {
  const { tasks, people, projects } = useStore();
  const [range, setRange] = useState<Range>("week");
  const [anchor, setAnchor] = useState(() => today());
  const [selected, setSelected] = useState(() => today());
  const [sheet, setSheet] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.dueTime ?? "99:99").localeCompare(b.dueTime ?? "99:99"));
    }
    return map;
  }, [tasks]);

  const openTask = (t: Task) => {
    setEditing(t);
    setSheet(true);
  };

  const openNew = () => {
    setEditing(undefined);
    setSheet(true);
  };

  const navigate = (dir: -1 | 1) => {
    if (range === "day") {
      const d = addDays(anchor, dir);
      setAnchor(d);
      setSelected(d);
    } else if (range === "week") {
      setAnchor(addDays(anchor, dir * 7));
    } else {
      setAnchor(addMonths(anchor, dir));
    }
  };

  const headerTitle =
    range === "day"
      ? relativeDayLabel(anchor)
      : range === "week"
        ? isSameDay(startOfWeek(anchor), startOfWeek(today()))
          ? "Ten tydzień"
          : "Tydzień"
        : formatMonthYear(anchor);

  const headerSub =
    range === "day"
      ? formatDayFull(anchor)
      : range === "week"
        ? formatWeekRange(startOfWeek(anchor))
        : undefined;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title}>{headerTitle}</Text>
            {headerSub && <Text style={styles.subtitle}>{headerSub}</Text>}
          </View>
          <Pressable style={styles.navBtn} onPress={() => navigate(-1)}>
            <Feather name="chevron-left" size={17} color={colors.chipText} />
          </Pressable>
          <Pressable style={styles.navBtn} onPress={() => navigate(1)}>
            <Feather name="chevron-right" size={17} color={colors.chipText} />
          </Pressable>
        </View>
        <Segmented
          options={RANGE_OPTIONS}
          value={range}
          onChange={(r) => {
            setRange(r);
            if (r === "day") setAnchor(selected);
          }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {range === "week" && (
          <WeekView
            weekStart={startOfWeek(anchor)}
            tasksByDate={tasksByDate}
            onTask={openTask}
            peopleName={(pid) => people.find((p) => p.id === pid)?.name}
            projectName={(pid) => projects.find((p) => p.id === pid)?.name}
          />
        )}
        {range === "day" && (
          <DayAgenda
            date={anchor}
            tasks={tasksByDate.get(toISODate(anchor)) ?? []}
            onTask={openTask}
            peopleName={(pid) => people.find((p) => p.id === pid)?.name}
            projectName={(pid) => projects.find((p) => p.id === pid)?.name}
          />
        )}
        {range === "month" && (
          <MonthView
            anchor={anchor}
            selected={selected}
            onSelect={setSelected}
            tasksByDate={tasksByDate}
            onTask={openTask}
            peopleName={(pid) => people.find((p) => p.id === pid)?.name}
            projectName={(pid) => projects.find((p) => p.id === pid)?.name}
          />
        )}
        <View style={{ height: 140 }} />
      </ScrollView>

      <Fab onPress={openNew} />
      <TaskEditSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        task={editing}
        defaultDate={toISODate(range === "month" ? selected : anchor)}
      />
    </SafeAreaView>
  );
}

function taskDot(t: Task): string {
  return t.category ? categoryColors[t.category] : colors.accentBright;
}

function TaskAgendaCard({
  task,
  personName,
  projectName,
  onPress,
}: {
  task: Task;
  personName?: string;
  projectName?: string;
  onPress: () => void;
}) {
  const overdue =
    task.dueDate && task.column !== "done" && parseISODate(task.dueDate) < today();
  const done = task.column === "done";
  const allDay = !task.dueTime;
  return (
    <View style={styles.agendaRow}>
      <View style={styles.timeCol}>
        <Text style={[styles.timeText, overdue ? { color: colors.danger } : null]}>
          {task.dueTime ?? "—"}
        </Text>
      </View>
      <Pressable
        onPress={onPress}
        style={[
          styles.eventCard,
          allDay && styles.eventCardAllDay,
        ]}
      >
        {!allDay && (
          <View style={[styles.eventAccent, { backgroundColor: taskDot(task) }]} />
        )}
        {allDay && (
          <Feather
            name="calendar"
            size={14}
            color={colors.amber}
            style={{ marginTop: 1 }}
          />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {overdue && (
              <Feather name="alert-circle" size={12} color={colors.danger} />
            )}
            <Text
              style={[
                styles.eventTitle,
                done && {
                  color: colors.secondary,
                  textDecorationLine: "line-through",
                },
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
          </View>
          <Text style={styles.eventMeta} numberOfLines={1}>
            {allDay ? "cały dzień" : null}
            {allDay && (projectName || personName) ? " · " : ""}
            {[projectName, personName].filter(Boolean).join(" · ") ||
              (allDay ? "" : "zadanie")}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function DaySection({
  date,
  tasks,
  onTask,
  peopleName,
  projectName,
}: {
  date: Date;
  tasks: Task[];
  onTask: (t: Task) => void;
  peopleName: (id?: string) => string | undefined;
  projectName: (id?: string) => string | undefined;
}) {
  const isToday = isSameDay(date, today());
  return (
    <View style={{ marginBottom: 4 }}>
      <View style={styles.daySectionHead}>
        <View style={styles.dayCol}>
          <Text style={styles.dayColShort}>
            {WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}
          </Text>
          <Text
            style={[
              styles.dayColNum,
              isToday && { color: colors.accentBright },
            ]}
          >
            {date.getDate()}
          </Text>
        </View>
        <View style={styles.dayLine} />
        <Text style={styles.dayCount}>
          {relativeDayLabel(date)} · {tasks.length}
        </Text>
      </View>
      {tasks.map((t) => (
        <TaskAgendaCard
          key={t.id}
          task={t}
          personName={peopleName(t.personId)}
          projectName={projectName(t.projectId)}
          onPress={() => onTask(t)}
        />
      ))}
    </View>
  );
}

function WeekView({
  weekStart,
  tasksByDate,
  onTask,
  peopleName,
  projectName,
}: {
  weekStart: Date;
  tasksByDate: Map<string, Task[]>;
  onTask: (t: Task) => void;
  peopleName: (id?: string) => string | undefined;
  projectName: (id?: string) => string | undefined;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const withTasks = days.filter((d) => (tasksByDate.get(toISODate(d)) ?? []).length > 0);
  return (
    <View>
      <View style={styles.weekStrip}>
        {days.map((d) => {
          const isToday = isSameDay(d, today());
          const dayTasks = tasksByDate.get(toISODate(d)) ?? [];
          return (
            <View
              key={d.toISOString()}
              style={[styles.weekDay, isToday && styles.weekDayToday]}
            >
              <Text
                style={[
                  styles.weekDayLetter,
                  isToday && { color: colors.onAccent },
                ]}
              >
                {WEEKDAYS_GRID[(d.getDay() + 6) % 7]}
              </Text>
              <Text
                style={[
                  styles.weekDayNum,
                  isToday && { color: colors.onAccent, fontFamily: fonts.sansSemi },
                ]}
              >
                {d.getDate()}
              </Text>
              <View style={{ height: 5, marginTop: 2, flexDirection: "row", gap: 2 }}>
                {dayTasks.slice(0, 1).map((t) => (
                  <View
                    key={t.id}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isToday
                          ? colors.onAccent
                          : taskDot(t),
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
      {withTasks.map((d) => (
        <DaySection
          key={d.toISOString()}
          date={d}
          tasks={tasksByDate.get(toISODate(d)) ?? []}
          onTask={onTask}
          peopleName={peopleName}
          projectName={projectName}
        />
      ))}
      {withTasks.length === 0 && (
        <Text style={styles.empty}>Brak zadań w tym tygodniu.</Text>
      )}
    </View>
  );
}

function DayAgenda({
  date,
  tasks,
  onTask,
  peopleName,
  projectName,
}: {
  date: Date;
  tasks: Task[];
  onTask: (t: Task) => void;
  peopleName: (id?: string) => string | undefined;
  projectName: (id?: string) => string | undefined;
}) {
  return (
    <View>
      {tasks.length > 0 ? (
        <DaySection
          date={date}
          tasks={tasks}
          onTask={onTask}
          peopleName={peopleName}
          projectName={projectName}
        />
      ) : (
        <Text style={styles.empty}>Brak zadań tego dnia.</Text>
      )}
    </View>
  );
}

function MonthView({
  anchor,
  selected,
  onSelect,
  tasksByDate,
  onTask,
  peopleName,
  projectName,
}: {
  anchor: Date;
  selected: Date;
  onSelect: (d: Date) => void;
  tasksByDate: Map<string, Task[]>;
  onTask: (t: Task) => void;
  peopleName: (id?: string) => string | undefined;
  projectName: (id?: string) => string | undefined;
}) {
  const weeks = monthMatrix(anchor.getFullYear(), anchor.getMonth());
  const selectedTasks = tasksByDate.get(toISODate(selected)) ?? [];
  return (
    <View>
      <View style={styles.monthGridHead}>
        {WEEKDAYS_GRID.map((d, i) => (
          <Text
            key={d}
            style={[styles.monthWeekday, i >= 5 && { color: colors.faint }]}
          >
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: "row" }}>
          {week.map((d) => {
            const inMonth = d.getMonth() === anchor.getMonth();
            const isToday = isSameDay(d, today());
            const isSelected = isSameDay(d, selected);
            const dayTasks = tasksByDate.get(toISODate(d)) ?? [];
            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => onSelect(d)}
                style={[
                  styles.monthCell,
                  isToday && !isSelected && styles.monthCellToday,
                  isSelected && styles.monthCellSelected,
                ]}
              >
                <Text
                  style={[
                    styles.monthCellNum,
                    !inMonth && { color: colors.faint },
                    isSelected && {
                      color: colors.onAccent,
                      fontFamily: fonts.sansSemi,
                    },
                  ]}
                >
                  {d.getDate()}
                </Text>
                <View style={styles.monthDots}>
                  {dayTasks.slice(0, 3).map((t) => (
                    <View
                      key={t.id}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: isSelected
                            ? colors.onAccent
                            : taskDot(t),
                        },
                      ]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.agendaHead}>
        <Text style={styles.agendaTitle}>{formatDayFull(selected)}</Text>
        <Text style={styles.agendaCount}>
          {selectedTasks.length}{" "}
          {plural(selectedTasks.length, "zadanie", "zadania", "zadań")}
        </Text>
      </View>
      {selectedTasks.map((t) => (
        <TaskAgendaCard
          key={t.id}
          task={t}
          personName={peopleName(t.personId)}
          projectName={projectName(t.projectId)}
          onPress={() => onTask(t)}
        />
      ))}
      {selectedTasks.length === 0 && (
        <Text style={styles.empty}>Brak zadań tego dnia.</Text>
      )}
    </View>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 11.5,
    color: colors.mutedAlt,
    marginTop: 3,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 18,
  },
  weekStrip: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 18,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  weekDayToday: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  weekDayLetter: {
    fontFamily: fonts.monoMedium,
    fontSize: 9.5,
    color: colors.muted,
  },
  weekDayNum: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  daySectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 9,
    marginTop: 9,
  },
  dayCol: {
    width: 52,
    alignItems: "center",
  },
  dayColShort: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
  },
  dayColNum: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.text,
  },
  dayLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderStrong,
  },
  dayCount: {
    fontFamily: fonts.monoMedium,
    fontSize: 10.5,
    color: colors.secondary,
  },
  agendaRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 9,
  },
  timeCol: {
    width: 52,
    alignItems: "flex-end",
    paddingTop: 12,
  },
  timeText: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.secondaryAlt,
  },
  eventCard: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    padding: 12,
  },
  eventCardAllDay: {
    borderStyle: "dashed",
    borderColor: alpha(colors.amber, 0.45),
    backgroundColor: alpha(colors.amber, 0.04),
  },
  eventAccent: {
    width: 3,
    borderRadius: 2,
    alignSelf: "stretch",
  },
  eventTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.textSoft,
    flexShrink: 1,
  },
  eventMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.secondary,
    marginTop: 3,
  },
  monthGridHead: {
    flexDirection: "row",
    marginBottom: 4,
  },
  monthWeekday: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    color: colors.muted,
    paddingVertical: 4,
  },
  monthCell: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    margin: 1,
  },
  monthCellToday: {
    borderWidth: 1,
    borderColor: alpha(colors.accent, 0.5),
    backgroundColor: alpha(colors.accent, 0.06),
  },
  monthCellSelected: {
    backgroundColor: colors.accent,
  },
  monthCellNum: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.body,
  },
  monthDots: {
    flexDirection: "row",
    gap: 3,
    height: 5,
    marginTop: 3,
  },
  agendaHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 10,
  },
  agendaTitle: {
    fontFamily: fonts.heading,
    fontSize: 15.5,
    color: colors.text,
  },
  agendaCount: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.secondary,
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.secondary,
    textAlign: "center",
    paddingVertical: 24,
  },
});
