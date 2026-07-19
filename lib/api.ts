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
function patchForApi(patch: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    out[k] = v === undefined ? null : v;
  }
  return out;
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
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

export const api = {
  async login(password: string): Promise<void> {
    const r = await call<{ token: string }>("POST", "/login", { password });
    token = r.token;
    await AsyncStorage.setItem(TOKEN_KEY, r.token);
  },

  state: () => call<StateSnapshot>("GET", "/state"),

  createNote: (note: Note) => call<Note>("POST", "/notes", note),
  updateNote: (id: string, patch: object) =>
    call<Note>("PUT", `/notes/${enc(id)}`, patchForApi(patch)),
  deleteNote: (id: string) => call<{ ok: true }>("DELETE", `/notes/${enc(id)}`),

  createPerson: (person: Person) => call<Person>("POST", "/people", person),
  updatePerson: (id: string, patch: object) =>
    call<Person>("PUT", `/people/${enc(id)}`, patchForApi(patch)),
  deletePerson: (id: string) =>
    call<{ ok: true }>("DELETE", `/people/${enc(id)}`),

  createPersonType: (type: PersonType) =>
    call<PersonType>("POST", "/person-types", type),
  updatePersonType: (id: string, patch: object) =>
    call<PersonType>("PUT", `/person-types/${enc(id)}`, patchForApi(patch)),
  deletePersonType: (id: string) =>
    call<{ ok: true }>("DELETE", `/person-types/${enc(id)}`),
  addField: (typeId: string, field: FieldDef) =>
    call<PersonType>("POST", `/person-types/${enc(typeId)}/fields`, field),
  removeField: (typeId: string, fieldId: string) =>
    call<PersonType>(
      "DELETE",
      `/person-types/${enc(typeId)}/fields/${enc(fieldId)}`
    ),

  createTask: (task: Task) => call<Task>("POST", "/tasks", task),
  updateTask: (id: string, patch: object) =>
    call<Task>("PUT", `/tasks/${enc(id)}`, patchForApi(patch)),
  deleteTask: (id: string) => call<{ ok: true }>("DELETE", `/tasks/${enc(id)}`),
  moveTask: (id: string, column: Column) =>
    call<Task>("POST", `/tasks/${enc(id)}/move`, { column }),

  createProject: (project: Project) => call<Project>("POST", "/projects", project),
  updateProject: (id: string, patch: object) =>
    call<Project>("PUT", `/projects/${enc(id)}`, patchForApi(patch)),
  deleteProject: (id: string) => call<{ ok: true }>("DELETE", `/projects/${enc(id)}`),
};
