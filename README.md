# Notatnik + CRM (wariant B "Teal")

Mobilna aplikacja notatnika z warstwą CRM wg `SPEC.md`,
w kierunku wizualnym B ("Teal", oparty o Projekty) z handoffu designu.
Frontend (Expo) łączy się z backendem REST w PHP (katalog `api/`),
dane trwałe w SQLite lub MySQL, dostęp chroniony hasłem.

## Stack

- Expo SDK 57 + Expo Router (file-based routing)
- TypeScript, Zustand (store z optymistycznymi mutacjami synchronizowanymi
  z API; `lib/api.ts` = klient REST, token logowania w AsyncStorage)
- Backend: PHP 8 (bez frameworka), PDO (SQLite/MySQL), REST w `api/`
- Fonty: Space Grotesk / IBM Plex Sans / IBM Plex Mono (`@expo-google-fonts`)
- Ikony: Feather (`@expo/vector-icons`), gradienty: `expo-linear-gradient`

## Uruchomienie

Backend (dev):

```bash
cp api/config.sample.php api/config.php   # ustaw password_hash i app_secret
php api/seed.php                          # jednorazowo: schemat + dane demo
php -S localhost:8080 api/index.php       # serwer dev API
node scripts/api-smoke.mjs                # smoke testy API (27 asercji)
```

Frontend:

```bash
npm install
npm start          # Expo Go / dev build
npm run web        # przeglądarka
npm run typecheck  # tsc --noEmit
```

Adres API konfiguruje zmienna `EXPO_PUBLIC_API_URL` (domyślnie
`http://localhost:8080`). W Expo Go na telefonie podaj IP komputera
w sieci lokalnej, np.:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.10:8080 npm start
```

Przy serwowaniu API spod Apache (np. hosting współdzielony) wystarczy
wgrać katalog `api/` — `api/.htaccess` kieruje żądania do `index.php`,
a `dev_cors_origin` w `config.php` ustawiony na `''` wyłącza nagłówki CORS.

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
  mock.ts                # dane demo (odwzorowane w api/seed.php)
  api.ts                 # klient REST + token w AsyncStorage
  store.ts               # zustand: optymistyczny CRUD + sync z API
  theme.ts               # tokeny designu wariantu B
  dates.ts               # helpery dat + polskie nazwy
components/              # UI współdzielone (karty, sheety, pickery)
api/
  index.php              # front controller REST (routing, CORS dev)
  lib/                   # db (PDO+schemat), auth (Bearer), http, handlery
  schema.sql             # schemat bazy (MySQL/SQLite)
  seed.php               # seeder CLI + runSeed() dla POST /seed
scripts/
  api-smoke.mjs          # smoke testy API (node, bez zależności)
```
