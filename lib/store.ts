import { create } from "zustand";
import { api, ApiError, clearStoredToken, loadStoredToken } from "./api";
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

interface AppState {
  auth: AuthStatus;
  syncError: string | null;

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

  updateProject: (id: string, patch: Partial<Omit<Project, "id">>) => void;
}

let initStarted = false;

export const useStore = create<AppState>((set, get) => {
  // Mutacje są optymistyczne: stan lokalny zmienia się od razu, żądanie
  // leci w tle. 401 → wylogowanie; inny błąd → komunikat + refresh(),
  // który przywraca stan zgodny z serwerem.
  function sync(run: () => Promise<unknown>): void {
    run().catch((e: unknown) => {
      if (e instanceof ApiError && e.status === 401) {
        void clearStoredToken();
        set({ auth: "loggedOut" });
        return;
      }
      set({
        syncError:
          e instanceof ApiError ? e.message : "Błąd synchronizacji z serwerem",
      });
      void get().refresh();
    });
  }

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

  return {
    auth: "checking",
    syncError: null,

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
      try {
        const snap = await api.state();
        set({ ...snap, auth: "loggedIn" });
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
    },

    login: async (password) => {
      await api.login(password); // rzuca ApiError przy złym haśle
      const snap = await api.state();
      set({ ...snap, auth: "loggedIn", syncError: null });
    },

    logout: async () => {
      await clearStoredToken();
      set({
        auth: "loggedOut",
        personTypes: [],
        people: [],
        notes: [],
        tasks: [],
        projects: [],
      });
    },

    refresh: async () => {
      try {
        const snap = await api.state();
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
      sync(() => api.createNote(created).then(applyNote));
      return created;
    },
    updateNote: (id, patch) => {
      set((s) => ({
        notes: s.notes.map((n) =>
          n.id === id ? { ...n, ...patch, updatedAt: nowISO() } : n
        ),
      }));
      sync(() => api.updateNote(id, patch).then(applyNote));
    },
    deleteNote: (id) => {
      set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
      sync(() => api.deleteNote(id));
    },

    addPerson: (person) => {
      const created: Person = { ...person, id: makeId("p") };
      set((s) => ({ people: [...s.people, created] }));
      sync(() => api.createPerson(created).then(applyPerson));
      return created;
    },
    updatePerson: (id, patch) => {
      set((s) => ({
        people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
      sync(() => api.updatePerson(id, patch).then(applyPerson));
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
      sync(() => api.deletePerson(id));
    },

    addPersonType: (name, color) => {
      const created: PersonType = { id: makeId("pt"), name, color, fields: [] };
      set((s) => ({ personTypes: [...s.personTypes, created] }));
      sync(() => api.createPersonType(created).then(applyPersonType));
      return created;
    },
    updatePersonType: (id, patch) => {
      set((s) => ({
        personTypes: s.personTypes.map((t) =>
          t.id === id ? { ...t, ...patch } : t
        ),
      }));
      sync(() => api.updatePersonType(id, patch).then(applyPersonType));
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
      sync(() => api.deletePersonType(id).then(() => get().refresh()));
    },
    addField: (typeId, field) => {
      const created: FieldDef = { ...field, id: makeId("f") };
      set((s) => ({
        personTypes: s.personTypes.map((t) =>
          t.id === typeId ? { ...t, fields: [...t.fields, created] } : t
        ),
      }));
      sync(() => api.addField(typeId, created).then(applyPersonType));
    },
    removeField: (typeId, fieldId) => {
      set((s) => ({
        personTypes: s.personTypes.map((t) =>
          t.id === typeId
            ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId) }
            : t
        ),
      }));
      sync(() => api.removeField(typeId, fieldId).then(applyPersonType));
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
      sync(() => api.createTask(created).then(applyTask));
      return created;
    },
    updateTask: (id, patch) => {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      }));
      sync(() => api.updateTask(id, patch).then(applyTask));
    },
    deleteTask: (id) => {
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      sync(() => api.deleteTask(id));
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
      sync(() => api.moveTask(id, column).then(applyTask));
    },
    toggleTask: (id) => {
      const current = get().tasks.find((t) => t.id === id);
      if (!current) return;
      const target: Column = current.column === "done" ? "todo" : "done";
      get().moveTask(id, target);
    },

    updateProject: (id, patch) => {
      set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
      sync(() => api.updateProject(id, patch).then(applyProject));
    },
  };
});
