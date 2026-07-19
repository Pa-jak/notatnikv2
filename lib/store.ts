import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { api, ApiError, clearStoredToken, loadStoredToken, ops, request } from "./api";
import type { MutationOp } from "./api";
import {
  clearQueue,
  enqueue,
  initQueue,
  pendingCount,
} from "./mutation-queue";
import type {
  Column,
  FieldDef,
  Note,
  Person,
  PersonType,
  Project,
  Task,
} from "./types";

let counter = 0;
export function makeId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

// Format zgodny z iso_now() serwera (sekundy, bez strefy).
function nowISO(): string {
  return new Date().toISOString().slice(0, 19);
}

export type AuthStatus = "checking" | "loggedOut" | "loggedIn";

interface StateCache {
  personTypes: PersonType[];
  people: Person[];
  notes: Note[];
  tasks: Task[];
  projects: Project[];
}

interface AppState {
  auth: AuthStatus;
  syncError: string | null;
  pendingCount: number;

  personTypes: PersonType[];
  people: Person[];
  notes: Note[];
  tasks: Task[];
  projects: Project[];

  init: () => Promise<void>;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  dismissSyncError: () => void;

  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => Note;
  updateNote: (
    id: string,
    patch: Partial<Omit<Note, "id" | "createdAt">>
  ) => void;
  deleteNote: (id: string) => void;

  addPerson: (person: Omit<Person, "id">) => Person;
  updatePerson: (id: string, patch: Partial<Omit<Person, "id">>) => void;
  deletePerson: (id: string) => void;

  addPersonType: (name: string, color?: string) => PersonType;
  updatePersonType: (
    id: string,
    patch: Partial<Omit<PersonType, "id" | "fields">>
  ) => void;
  deletePersonType: (id: string) => void;
  addField: (typeId: string, field: Omit<FieldDef, "id">) => void;
  removeField: (typeId: string, fieldId: string) => void;

  addTask: (task: Omit<Task, "id" | "order">) => Task;
  updateTask: (id: string, patch: Partial<Omit<Task, "id">>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, column: Column) => void;
  toggleTask: (id: string) => void;

  addProject: (project: Omit<Project, "id" | "createdAt">) => Project;
  updateProject: (id: string, patch: Partial<Omit<Project, "id">>) => void;
  deleteProject: (id: string) => void;
}

const STATE_CACHE_KEY = "notatnik.stateCache";

let initStarted = false;

function stateCacheFromState(s: AppState): StateCache {
  return {
    personTypes: s.personTypes,
    people: s.people,
    notes: s.notes,
    tasks: s.tasks,
    projects: s.projects,
  };
}

async function saveStateCache(snapshot: StateCache): Promise<void> {
  await AsyncStorage.setItem(STATE_CACHE_KEY, JSON.stringify(snapshot));
}

async function loadStateCache(): Promise<StateCache | null> {
  const raw = await AsyncStorage.getItem(STATE_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StateCache;
  } catch {
    return null;
  }
}


export const useStore = create<AppState>((set, get) => {
  // Po odpowiedzi serwera podmieniamy encję (serwerowe znaczniki czasu itp.).
  const applyNote = (n: Note) =>
    set((s) => ({ notes: s.notes.map((x) => (x.id === n.id ? n : x)) }));
  const applyPerson = (p: Person) =>
    set((s) => ({ people: s.people.map((x) => (x.id === p.id ? p : x)) }));
  const applyPersonType = (t: PersonType) =>
    set((s) => ({
      personTypes: s.personTypes.map((x) => (x.id === t.id ? t : x)),
    }));
  const applyTask = (t: Task) =>
    set((s) => ({ tasks: s.tasks.map((x) => (x.id === t.id ? t : x)) }));
  const applyProject = (p: Project) =>
    set((s) => ({ projects: s.projects.map((x) => (x.id === p.id ? p : x)) }));

  async function sync<T>(
    op: MutationOp,
    apply?: (res: T) => void
  ): Promise<void> {
    // FIFO: dopóki kolejka zawiera wcześniejsze mutacje, nowe też do niej trafiają.
    if (pendingCount() > 0) {
      await enqueue(op);
      return;
    }

    try {
      const res = await request<T>(op.method, op.path, op.body);
      apply?.(res);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 0) {
          await enqueue(op);
          return;
        }
        if (e.status === 401) {
          await clearStoredToken();
          set({ auth: "loggedOut" });
          return;
        }
      }
      set({
        syncError:
          e instanceof ApiError ? e.message : "Błąd synchronizacji z serwerem",
      });
      void get().refresh();
    }
  }

  return {
    auth: "checking",
    syncError: null,
    pendingCount: 0,

    personTypes: [],
    people: [],
    notes: [],
    tasks: [],
    projects: [],

    init: async () => {
      if (initStarted) return;
      initStarted = true;

      const hasToken = await loadStoredToken();
      if (!hasToken) {
        set({ auth: "loggedOut" });
        return;
      }

      await initQueue({
        onCountChange: (count) => set({ pendingCount: count }),
        onFlushed: (executedAny) => {
          if (executedAny) void get().refresh();
        },
        onAuthError: () => {
          void clearStoredToken();
          set({ auth: "loggedOut" });
        },
      });

      const cached = await loadStateCache();
      if (cached) {
        set({ ...cached, auth: "loggedIn", syncError: null });
        void get().refresh();
      } else {
        try {
          const snap = await api.state();
          await saveStateCache(snap);
          set({ ...snap, auth: "loggedIn", syncError: null });
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            await clearStoredToken();
            set({ auth: "loggedOut" });
          } else {
            set({
              auth: "loggedOut",
              syncError:
                e instanceof ApiError ? e.message : "Nie udało się pobrać danych",
            });
          }
        }
      }
    },

    login: async (password) => {
      await api.login(password); // rzuca ApiError przy złym haśle
      const snap = await api.state();
      await saveStateCache(snap);
      set({ ...snap, auth: "loggedIn", syncError: null });
    },

    logout: async () => {
      await clearStoredToken();
      await clearQueue();
      await AsyncStorage.removeItem(STATE_CACHE_KEY);
      set({
        auth: "loggedOut",
        personTypes: [],
        people: [],
        notes: [],
        tasks: [],
        projects: [],
        pendingCount: 0,
      });
    },

    refresh: async () => {
      // Nie nadpisujemy stanu, dopóki serwer nie zna zakolejkowanych zmian.
      if (pendingCount() > 0) return;
      try {
        const snap = await api.state();
        await saveStateCache(snap);
        set({ ...snap });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          await clearStoredToken();
          set({ auth: "loggedOut" });
        }
      }
    },

    dismissSyncError: () => set({ syncError: null }),

    addNote: (note) => {
      const created: Note = {
        ...note,
        id: makeId("n"),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      set((s) => ({ notes: [created, ...s.notes] }));
      void sync(ops.createNote(created), applyNote);
      return created;
    },
    updateNote: (id, patch) => {
      set((s) => ({
        notes: s.notes.map((n) =>
          n.id === id ? { ...n, ...patch, updatedAt: nowISO() } : n
        ),
      }));
      void sync(ops.updateNote(id, patch), applyNote);
    },
    deleteNote: (id) => {
      set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
      void sync(ops.deleteNote(id));
    },

    addPerson: (person) => {
      const created: Person = { ...person, id: makeId("p") };
      set((s) => ({ people: [...s.people, created] }));
      void sync(ops.createPerson(created), applyPerson);
      return created;
    },
    updatePerson: (id, patch) => {
      set((s) => ({
        people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
      void sync(ops.updatePerson(id, patch), applyPerson);
    },
    deletePerson: (id) => {
      // Lustrzane odbicie kaskad serwera (FK: mentions, tasks, project_people).
      set((s) => ({
        people: s.people.filter((p) => p.id !== id),
        notes: s.notes.map((n) =>
          n.mentioned.includes(id)
            ? { ...n, mentioned: n.mentioned.filter((m) => m !== id) }
            : n
        ),
        tasks: s.tasks.map((t) =>
          t.personId === id ? { ...t, personId: undefined } : t
        ),
        projects: s.projects.map((prj) =>
          prj.peopleIds.includes(id)
            ? { ...prj, peopleIds: prj.peopleIds.filter((m) => m !== id) }
            : prj
        ),
      }));
      void sync(ops.deletePerson(id));
    },

    addPersonType: (name, color) => {
      const created: PersonType = { id: makeId("pt"), name, color, fields: [] };
      set((s) => ({ personTypes: [...s.personTypes, created] }));
      void sync(ops.createPersonType(created), applyPersonType);
      return created;
    },
    updatePersonType: (id, patch) => {
      set((s) => ({
        personTypes: s.personTypes.map((t) =>
          t.id === id ? { ...t, ...patch } : t
        ),
      }));
      void sync(ops.updatePersonType(id, patch), applyPersonType);
    },
    deletePersonType: (id) => {
      set((s) => {
        const fallback = s.personTypes.find((t) => t.id !== id);
        return {
          personTypes: s.personTypes.filter((t) => t.id !== id),
          people: s.people.map((p) =>
            p.typeId === id && fallback ? { ...p, typeId: fallback.id } : p
          ),
        };
      });
      // Serwer sam wybiera typ zastępczy — refresh dociąga jego wybór.
      void sync(ops.deletePersonType(id), () => void get().refresh());
    },
    addField: (typeId, field) => {
      const created: FieldDef = { ...field, id: makeId("f") };
      set((s) => ({
        personTypes: s.personTypes.map((t) =>
          t.id === typeId ? { ...t, fields: [...t.fields, created] } : t
        ),
      }));
      void sync(ops.addField(typeId, created), applyPersonType);
    },
    removeField: (typeId, fieldId) => {
      set((s) => ({
        personTypes: s.personTypes.map((t) =>
          t.id === typeId
            ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId) }
            : t
        ),
      }));
      void sync(ops.removeField(typeId, fieldId), applyPersonType);
    },

    addTask: (task) => {
      const created: Task = { ...task, id: makeId("t"), order: 0 };
      set((s) => ({
        tasks: [
          created,
          ...s.tasks.map((t) =>
            t.column === task.column ? { ...t, order: t.order + 1 } : t
          ),
        ],
      }));
      void sync(ops.createTask(created), applyTask);
      return created;
    },
    updateTask: (id, patch) => {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      }));
      void sync(ops.updateTask(id, patch), applyTask);
    },
    deleteTask: (id) => {
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      void sync(ops.deleteTask(id));
    },
    moveTask: (id, column) => {
      set((s) => {
        const maxOrder = Math.max(
          -1,
          ...s.tasks.filter((t) => t.column === column).map((t) => t.order)
        );
        return {
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, column, order: maxOrder + 1 } : t
          ),
        };
      });
      void sync(ops.moveTask(id, column), applyTask);
    },
    toggleTask: (id) => {
      const current = get().tasks.find((t) => t.id === id);
      if (!current) return;
      const target: Column = current.column === "done" ? "todo" : "done";
      get().moveTask(id, target);
    },

    addProject: (project) => {
      const created: Project = {
        ...project,
        id: makeId("prj"),
        createdAt: nowISO(),
      };
      set((s) => ({ projects: [created, ...s.projects] }));
      void sync(ops.createProject(created), applyProject);
      return created;
    },
    updateProject: (id, patch) => {
      set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
      void sync(ops.updateProject(id, patch), applyProject);
    },
    deleteProject: (id) => {
      // Lustrzane odbicie kaskad serwera (FK: tasks i notes => projectId SET NULL).
      set((s) => ({
        projects: s.projects.filter((p) => p.id !== id),
        tasks: s.tasks.map((t) =>
          t.projectId === id ? { ...t, projectId: undefined } : t
        ),
        notes: s.notes.map((n) =>
          n.projectId === id ? { ...n, projectId: undefined } : n
        ),
      }));
      void sync(ops.deleteProject(id));
    },
  };
});

// Debounce 500 ms: zapisujemy aktualny stan do cache po każdej zmianie.
let cacheTimer: ReturnType<typeof setTimeout> | null = null;
useStore.subscribe((s) => {
  if (cacheTimer) clearTimeout(cacheTimer);
  cacheTimer = setTimeout(() => {
    void saveStateCache(stateCacheFromState(s));
  }, 500);
});
