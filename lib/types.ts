export type FieldKind = "text" | "number" | "date";

export interface FieldDef {
  id: string;
  label: string;
  kind: FieldKind;
}

export interface PersonType {
  id: string;
  name: string;
  color?: string;
  fields: FieldDef[];
}

export interface Person {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  typeId: string;
  values: Record<string, string>;
}

export type NoteKind = "text" | "photo" | "link" | "voice";

export interface Note {
  id: string;
  kind: NoteKind;
  title: string;
  body: string;
  linkUrl?: string;
  linkDesc?: string;
  attachmentLabel?: string;
  mentioned: string[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export type Column = "todo" | "doing" | "done";

export type TaskCategory = "teal" | "green" | "blue" | "purple" | "orange";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  category?: TaskCategory;
  column: Column;
  order: number;
  personId?: string;
  projectId?: string;
}

export type ProjectStatus = "active" | "paused" | "done";

export type Importance = "high" | "medium" | "low";

export type ProjectIcon = "clock" | "star" | "list" | "folder" | "target";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  importance: Importance;
  tags: string[];
  blockedReason?: string;
  peopleIds: string[];
  icon: ProjectIcon;
  createdAt: string;
}
