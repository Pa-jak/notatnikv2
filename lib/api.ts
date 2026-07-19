import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Column,
  FieldDef,
  Note,
  Person,
  PersonType,
  Project,
  Task,
} from "./types";

/**
 * Klient REST API (api/index.php). Adres bazowy z EXPO_PUBLIC_API_URL,
 * w dev: `php -S localhost:8080 index.php` w katalogu api/.
 * Uwaga: w Expo Go na telefonie localhost nie zadziała — ustaw adres IP
 * komputera w sieci lokalnej (np. EXPO_PUBLIC_API_URL=http://192.168.0.10:8080).
 */
const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  ""
);

const TOKEN_KEY = "notatnik.apiToken";

export interface StateSnapshot {
  personTypes: PersonType[];
  people: Person[];
  notes: Note[];
  tasks: Task[];
  projects: Project[];
}

export interface MutationOp {
  method: string;
  path: string;
  body?: unknown;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let token: string | null = null;

export async function loadStoredToken(): Promise<boolean> {
  token = await AsyncStorage.getItem(TOKEN_KEY);
  return token !== null;
}

export async function clearStoredToken(): Promise<void> {
  token = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/** Serwer koduje brak wartości jako null; typy frontendu używają undefined. */
function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNulls);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === null) continue;
      out[k] = stripNulls(v);
    }
    return out;
  }
  return value;
}

/**
 * JSON.stringify wycina klucze o wartości undefined, a serwer aktualizuje
 * tylko klucze obecne w ciele — jawne undefined w patchu zamieniamy na null,
 * żeby dało się wyczyścić pole (np. linkUrl przy zmianie rodzaju notatki).
 */
export function patchForApi(patch: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    out[k] = v === undefined ? null : v;
  }
  return out;
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Brak połączenia z serwerem", 0);
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // puste lub nie-JSON ciało
  }
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && typeof (json as any).error === "string"
        ? (json as any).error
        : `Błąd HTTP ${res.status}`;
    throw new ApiError(msg, res.status);
  }
  return stripNulls(json) as T;
}

const enc = encodeURIComponent;

export const ops = {
  createNote: (note: Note): MutationOp => ({
    method: "POST",
    path: "/notes",
    body: note,
  }),
  updateNote: (id: string, patch: object): MutationOp => ({
    method: "PUT",
    path: `/notes/${enc(id)}`,
    body: patchForApi(patch),
  }),
  deleteNote: (id: string): MutationOp => ({
    method: "DELETE",
    path: `/notes/${enc(id)}`,
  }),

  createPerson: (person: Person): MutationOp => ({
    method: "POST",
    path: "/people",
    body: person,
  }),
  updatePerson: (id: string, patch: object): MutationOp => ({
    method: "PUT",
    path: `/people/${enc(id)}`,
    body: patchForApi(patch),
  }),
  deletePerson: (id: string): MutationOp => ({
    method: "DELETE",
    path: `/people/${enc(id)}`,
  }),

  createPersonType: (type: PersonType): MutationOp => ({
    method: "POST",
    path: "/person-types",
    body: type,
  }),
  updatePersonType: (id: string, patch: object): MutationOp => ({
    method: "PUT",
    path: `/person-types/${enc(id)}`,
    body: patchForApi(patch),
  }),
  deletePersonType: (id: string): MutationOp => ({
    method: "DELETE",
    path: `/person-types/${enc(id)}`,
  }),
  addField: (typeId: string, field: FieldDef): MutationOp => ({
    method: "POST",
    path: `/person-types/${enc(typeId)}/fields`,
    body: field,
  }),
  removeField: (typeId: string, fieldId: string): MutationOp => ({
    method: "DELETE",
    path: `/person-types/${enc(typeId)}/fields/${enc(fieldId)}`,
  }),

  createTask: (task: Task): MutationOp => ({
    method: "POST",
    path: "/tasks",
    body: task,
  }),
  updateTask: (id: string, patch: object): MutationOp => ({
    method: "PUT",
    path: `/tasks/${enc(id)}`,
    body: patchForApi(patch),
  }),
  deleteTask: (id: string): MutationOp => ({
    method: "DELETE",
    path: `/tasks/${enc(id)}`,
  }),
  moveTask: (id: string, column: Column): MutationOp => ({
    method: "POST",
    path: `/tasks/${enc(id)}/move`,
    body: { column },
  }),

  createProject: (project: Project): MutationOp => ({
    method: "POST",
    path: "/projects",
    body: project,
  }),
  updateProject: (id: string, patch: object): MutationOp => ({
    method: "PUT",
    path: `/projects/${enc(id)}`,
    body: patchForApi(patch),
  }),
  deleteProject: (id: string): MutationOp => ({
    method: "DELETE",
    path: `/projects/${enc(id)}`,
  }),
};

export const api = {
  async login(password: string): Promise<void> {
    const r = await request<{ token: string }>("POST", "/login", { password });
    token = r.token;
    await AsyncStorage.setItem(TOKEN_KEY, r.token);
  },

  state: () => request<StateSnapshot>("GET", "/state"),
};
