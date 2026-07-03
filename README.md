# Notatnik + CRM — klikalny prototyp (wariant B "Teal")

Klikalny prototyp mobilnej aplikacji notatnika z warstwą CRM wg `SPEC.md`,
w kierunku wizualnym B ("Teal", oparty o Projekty) z handoffu designu.
Działa w całości na mockowych danych w pamięci — brak backendu i trwałości,
po restarcie stan wraca do seeda.

## Stack

- Expo SDK 57 + Expo Router (file-based routing)
- TypeScript, Zustand (jeden store seedowany z `lib/mock.ts`)
- Fonty: Space Grotesk / IBM Plex Sans / IBM Plex Mono (`@expo-google-fonts`)
- Ikony: Feather (`@expo/vector-icons`), gradienty: `expo-linear-gradient`

## Uruchomienie

```bash
npm install
npm start          # Expo Go / dev build
npm run web        # przeglądarka
npm run typecheck  # tsc --noEmit
```

## Decyzje projektowe (rozszerzenia względem SPEC)

- **Projekty** są bytem pierwszoplanowym (ekran 1c handoffu): status,
  ważność, tagi, "czemu stoi", checklist zadań, przypisane osoby. Zakładka
  Notatki = widok Projektów; breadcrumb "Wszystkie / Projekty" przełącza na
  płaski widok wszystkich notatek z wyszukiwarką (jak w SPEC).
- **Jeden byt `Task`** z opcjonalnym `projectId` — kanban pokazuje wszystkie
  zadania, karta projektu swoje jako checklist; odhaczenie = kolumna
  "Zrobione", postęp projektu liczy się z kolumn.
- **Kalendarz pokazuje zadania** wg `dueDate` (SPEC), z opcjonalną godziną
  (`dueTime`) i kategorią koloru — widok tygodnia renderuje się jak agenda
  z mockupu 1d (zadania bez godziny = karty "cały dzień" z przerywaną ramką).
- **Na razie tylko dark mode** — mockupy są dark-only; light wg SPEC dojdzie
  po akceptacji UX.

## Struktura

```
app/
  (tabs)/notes.tsx       # Projekty + widok Wszystkie notatki
  (tabs)/people.tsx      # Osoby (filtr po typie)
  (tabs)/tasks.tsx       # Kanban (todo / doing / done)
  (tabs)/calendar.tsx    # Kalendarz: dzień / tydzień / miesiąc
  note/[id].tsx          # szczegół notatki
  person/[id].tsx        # profil osoby + wzmianki (backlinki)
  project/[id].tsx       # szczegół projektu
  person-types.tsx       # user-definiowalne typy osób i ich pola
lib/
  types.ts               # model danych
  mock.ts                # seed (daty relatywne do "dziś")
  store.ts               # zustand, CRUD w pamięci
  theme.ts               # tokeny designu wariantu B
  dates.ts               # helpery dat + polskie nazwy
components/              # UI współdzielone (karty, sheety, pickery)
```
