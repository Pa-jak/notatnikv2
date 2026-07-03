import { create } from "zustand";
import {
  seedNotes,
  seedPeople,
  seedPersonTypes,
  seedProjects,
  seedTasks,
} from "./mock";
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

function nowISO(): string {
  return new Date().toISOString();
}

interface AppState {
  personTypes: PersonType[];
  people: Person[];
  notes: Note[];
  tasks: Task[];
  projects: Project[];

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

export const useStore = create<AppState>((set) => ({
  personTypes: seedPersonTypes,
  people: seedPeople,
  notes: seedNotes,
  tasks: seedTasks,
  projects: seedProjects,

  addNote: (note) => {
    const created: Note = {
      ...note,
      id: makeId("n"),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    set((s) => ({ notes: [created, ...s.notes] }));
    return created;
  },
  updateNote: (id, patch) =>
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: nowISO() } : n
      ),
    })),
  deleteNote: (id) =>
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

  addPerson: (person) => {
    const created: Person = { ...person, id: makeId("p") };
    set((s) => ({ people: [...s.people, created] }));
    return created;
  },
  updatePerson: (id, patch) =>
    set((s) => ({
      people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  deletePerson: (id) =>
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
    })),

  addPersonType: (name, color) => {
    const created: PersonType = { id: makeId("pt"), name, color, fields: [] };
    set((s) => ({ personTypes: [...s.personTypes, created] }));
    return created;
  },
  updatePersonType: (id, patch) =>
    set((s) => ({
      personTypes: s.personTypes.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      ),
    })),
  deletePersonType: (id) =>
    set((s) => {
      const fallback = s.personTypes.find((t) => t.id !== id);
      return {
        personTypes: s.personTypes.filter((t) => t.id !== id),
        people: s.people.map((p) =>
          p.typeId === id && fallback ? { ...p, typeId: fallback.id } : p
        ),
      };
    }),
  addField: (typeId, field) =>
    set((s) => ({
      personTypes: s.personTypes.map((t) =>
        t.id === typeId
          ? { ...t, fields: [...t.fields, { ...field, id: makeId("f") }] }
          : t
      ),
    })),
  removeField: (typeId, fieldId) =>
    set((s) => ({
      personTypes: s.personTypes.map((t) =>
        t.id === typeId
          ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId) }
          : t
      ),
    })),

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
    return created;
  },
  updateTask: (id, patch) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
  deleteTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  moveTask: (id, column) =>
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
    }),
  toggleTask: (id) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? { ...t, column: t.column === "done" ? "todo" : "done" }
          : t
      ),
    })),

  updateProject: (id, patch) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
}));
