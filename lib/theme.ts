import type { Importance, NoteKind, ProjectStatus, TaskCategory } from "./types";

export const colors = {
  bg: "#0d1513",
  card: "#111f1c",
  cardRaised: "#132420",
  cardInset: "#0f1d1a",
  input: "#142320",
  nav: "#0f1d1a",
  border: "rgba(255,255,255,0.06)",
  borderSoft: "rgba(255,255,255,0.05)",
  borderStrong: "rgba(255,255,255,0.07)",
  accentBorder: "rgba(63,183,166,0.22)",
  accent: "#3fb7a6",
  accentBright: "#4fd6c0",
  accentDeep: "#2f9d8c",
  accentDim: "rgba(63,183,166,0.15)",
  onAccent: "#0d1513",
  text: "#f0f7f5",
  textSoft: "#eaf3f0",
  body: "#dbeae6",
  chipText: "#c3d4cf",
  secondary: "#7d938c",
  secondaryAlt: "#8fa8a1",
  muted: "#5a706a",
  mutedAlt: "#6a8079",
  faint: "#3a534d",
  tagText: "#9db3ac",
  warnText: "#c4b48f",
  warnBody: "#a9bdb7",
  green: "#8bd17c",
  blue: "#6ea8fe",
  purple: "#b98be0",
  orange: "#e0724d",
  amber: "#e8a13c",
  danger: "#e88a68",
};

export const fonts = {
  heading: "SpaceGrotesk_600SemiBold",
  headingMedium: "SpaceGrotesk_500Medium",
  sans: "IBMPlexSans_400Regular",
  sansMedium: "IBMPlexSans_500Medium",
  sansSemi: "IBMPlexSans_600SemiBold",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
};

export const categoryColors: Record<TaskCategory, string> = {
  teal: colors.accentBright,
  green: colors.green,
  blue: colors.blue,
  purple: colors.purple,
  orange: colors.orange,
};

export const categoryLabels: Record<TaskCategory, string> = {
  teal: "Projekt",
  green: "Spotkanie",
  blue: "Praca",
  purple: "Osobiste",
  orange: "Deadline",
};

export const noteKindColors: Record<NoteKind, string> = {
  text: colors.amber,
  voice: colors.green,
  link: colors.blue,
  photo: colors.purple,
};

export const noteKindLabels: Record<NoteKind, string> = {
  text: "Tekst",
  voice: "Głos",
  link: "Link",
  photo: "Zdjęcie",
};

export const importanceColors: Record<Importance, string> = {
  high: colors.danger,
  medium: colors.amber,
  low: "#8fa89f",
};

export const importanceLabels: Record<Importance, string> = {
  high: "Wysoka",
  medium: "Średnia",
  low: "Niska",
};

export const statusColors: Record<ProjectStatus, string> = {
  active: colors.green,
  paused: colors.amber,
  done: colors.secondaryAlt,
};

export const statusLabels: Record<ProjectStatus, string> = {
  active: "Aktywny",
  paused: "Wstrzymany",
  done: "Zakończony",
};

export const avatarGradients: [string, string][] = [
  ["#e0724d", "#c74f34"],
  ["#6ea8fe", "#4a7fd6"],
  ["#b98be0", "#9161c4"],
  ["#8bd17c", "#5fa855"],
  ["#4fd6c0", "#2f9d8c"],
  ["#e8a13c", "#c77f2a"],
];

export function avatarGradient(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return avatarGradients[h % avatarGradients.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function alpha(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
