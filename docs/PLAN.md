# Plan: Notatnik v2 — użyteczna PWA na Hostingerze

Status: żywy dokument — odhaczane w trakcie realizacji.

## Postęp

- [x] WP1 — schemat SQL, warstwa PDO, seed (`7a3de96`)
- [x] WP2 — REST API PHP + smoke testy (`6b64e77`)
- [x] WP3 — frontend podpięty pod API, login (`f2d893b`)
- [x] WP4 — CRUD projektów (API+UI), wylogowanie
- [x] WP5 — offline: cache stanu + kolejka mutacji
- [x] WP6 — PWA: manifest, ikony, service worker
- [ ] WP7 — wdrożenie Hostinger (Git hPanel, MySQL)
- [ ] WP8 — weryfikacja E2E na produkcji

## Kontekst

Aplikacja (repo `Pa-jak/notatnikv2`) ma już:

- **Frontend** (Expo SDK 57, web + mobile): projekty, notatki (tekst/foto/link/głos), CRM osób z własnymi typami i polami, kanban zadań, kalendarz (dzień/tydzień/miesiąc), wzmianki/backlinki. Dark mode "Teal".
- **Backend** (PHP 8, bez frameworka, `api/`): REST z autoryzacją hasło→token HMAC (Bearer), PDO SQLite/MySQL, seed danych, smoke testy (`scripts/api-smoke.mjs`).
- **Integrację**: login screen, hydratacja z `GET /state`, optymistyczne mutacje z sync w tle, token w AsyncStorage.

**Czego brakuje, żeby była użyteczna:**
1. Nie da się utworzyć ani usunąć projektu (brak w API i UI — tylko edycja).
2. Brak przycisku wylogowania (akcja jest w store, bez UI).
3. Brak trybu offline — bez internetu apka nie wystartuje i gubi zmiany.
4. Brak PWA (manifest, service worker, instalowalność).
5. Brak wdrożenia — cel: **Hostinger (apka + MySQL), jedna domena: `/` = PWA, `/api` = PHP**, deploy przez **Git w hPanel** (dedykowany branch `deploy` ze zbudowanymi artefaktami).

**Proces:** Claude nadzoruje; kod pisze `opencode` (deepinfra, model kodowy). Po każdym zadaniu: review diffa, typecheck + smoke testy, iteracja, commit i push na GitHub.

## Proces pracy (każdy WP)

1. Spec zadania → `opencode run -m deepinfra/<model> "<zadanie>"` w katalogu repo.
2. Review: `git diff`, czytanie kluczowych plików; poprawki przez kolejne prompty do opencode (drobiazgi poprawiane bezpośrednio).
3. Weryfikacja: `npm run typecheck`, `node scripts/api-smoke.mjs` (serwer: `php -S localhost:8080 index.php` w `api/`), przy zmianach web: `npx expo export --platform web`.
4. Commit po polsku (konwencja `WPn: ...`) + `git push origin`.

## WP4 — Domknięcie funkcjonalności

- **API** (`api/lib/handlers.php`, `api/index.php`): `POST /projects` (id, name, status, importance, tags, icon, peopleIds, createdAt serwerowe), `DELETE /projects/{id}` (zadania/notatki projektu tracą `projectId` — jak kaskady w `handlePersonDelete`); rozszerzyć `scripts/api-smoke.mjs`.
- **Frontend**: `addProject`/`deleteProject` w `lib/store.ts` + `lib/api.ts` (wzorzec jak notes); UI: przycisk „Nowy projekt" na liście projektów (`app/(tabs)/notes.tsx`), usuwanie w `app/project/[id].tsx`; przycisk wylogowania (ikona w nagłówku zakładki Notatki albo w `person-types.tsx` jako sekcja „Konto").

## WP5 — Offline: cache lokalny + kolejka mutacji

- **Cache snapshotu**: po każdym udanym `/state` zapis do AsyncStorage (`notatnik.stateCache`); start apki: najpierw hydratacja z cache (natychmiastowe UI), potem odświeżenie z sieci. Zalogowany użytkownik bez internetu widzi dane z cache zamiast błędu.
- **Kolejka mutacji** (nowy `lib/mutation-queue.ts`): błąd sieci (`ApiError.status === 0`) → mutacja `{method, path, body}` trafia do trwałej kolejki FIFO w AsyncStorage zamiast do `syncError`+refresh. Po odzyskaniu sieci (nasłuch `online` na web / retry z interwałem) kolejka odtwarzana po kolei tym samym klientem `lib/api.ts`; odpowiedź 4xx przy odtwarzaniu → odrzucenie wpisu + `refresh()` (last-write-wins, aplikacja jednoosobowa).
- **UI**: dyskretny wskaźnik offline + licznik oczekujących zmian (np. pasek nad tab barem).

## WP6 — PWA

- `public/manifest.webmanifest` (nazwa, `display: standalone`, `theme_color`/`background_color` `#0d1513`), ikony 192/512 (prosty skrypt generujący PNG z motywem teal).
- Ręczny service worker `public/sw.js`: precache shellu (lista plików z `dist/` po buildzie), statyka cache-first, `/api` — network-only (offline obsługuje kolejka z WP5), nawigacja → fallback do `index.html`.
- `scripts/build-web.mjs`: `expo export --platform web` → kopiuje manifest/ikony/sw do `dist/`, wstrzykuje do `index.html` `<link rel="manifest">` i rejestrację SW z wersjonowaniem cache (hash builda).

## WP7 — Wdrożenie na Hostinger (Git w hPanel)

- `scripts/deploy.mjs`: buduje web (WP6), składa drzewo produkcyjne (root: `index.html`, assets, `manifest`, `sw.js`, `.htaccess`; podkatalog `api/` z PHP bez `config.php`/`*.sqlite`), commituje na **orphan branch `deploy`** i pushuje z force.
- Root `.htaccess`: przekierowanie HTTP→HTTPS, `/api/*` → `api/index.php` (współpraca z istniejącym `api/.htaccess`), długi cache dla hashowanych assetów, no-cache dla `index.html`/`sw.js`.
- Instrukcja w `docs/DEPLOY.md` (kroki ręczne po stronie użytkownika): utworzenie bazy MySQL w hPanel; hPanel → Git → repo, branch `deploy`, katalog `public_html`; utworzenie `api/config.php` na serwerze (driver mysql, dane bazy, świeży `password_hash` — wygenerować `php -r "echo password_hash('...', PASSWORD_BCRYPT);"` — nowy `app_secret`, `dev_cors_origin` pusty); seed przez `POST /api/seed` po zalogowaniu.
- Aktualizacja `README.md` (sekcja wdrożenia).

## WP8 — Weryfikacja końcowa E2E

- Smoke testy na produkcji: `API_URL=https://<domena>/api API_PASS=<hasło> node scripts/api-smoke.mjs`.
- Checklist ręczny dla użytkownika: instalacja PWA na telefonie (Android/Chrome i ewent. iOS), test offline (tryb samolotowy → edycja → powrót sieci → sync), login/logout, CRUD projektów.

## Weryfikacja (stała, po każdym WP)

- `npm run typecheck` — czysto.
- `node scripts/api-smoke.mjs` — wszystkie asercje PASS (rozszerzone o projekty w WP4).
- `npx expo export --platform web` — build bez błędów (WP5+).
- Commit + push po każdym zaakceptowanym WP.

## Ryzyka / uwagi

- Hostinger: PHP 8.x i mod_rewrite dostępne na hostingu współdzielonym — `api/.htaccess` już przygotowany; wymagane rozszerzenie `pdo_mysql` (standard).
- `config.php` i baza nie są w repo — deploy przez git ich nie nadpisze (pliki nieśledzone zostają).
- Hasło dev (`dev123`) nie może trafić na produkcję — nowy hash + sekret w kroku WP7.
- Kroki w hPanel (baza, Git, config) wymagają działań użytkownika — dostanie dokładną instrukcję w `docs/DEPLOY.md`.
