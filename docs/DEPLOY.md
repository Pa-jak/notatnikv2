# Wdrożenie na Hostinger (Git + MySQL)

Ten dokument opisuje, jak wypuścić aplikację Notatnik na hostingu
współdzielonym Hostinger z Apache, PHP 8 i MySQL.

Po stronie frontendu jest to zbudowana PWA z katalogu `dist/`, po stronie
backendu — PHP REST w katalogu `api/`. Aplikacja jest łączona w jedną
strukturę produkcyjną w katalogu `public_html` przez funkcję **Git**
dostępną w hPanelu.

---

## Co dzieje się przy deployu

```bash
npm run deploy
```

1. Ustawia `EXPO_PUBLIC_API_URL=/api` i buduje web (`npm run build:web`).
2. Tworzy katalog `.deploy/` z:
   - plikami PWA z `dist/` (`index.html`, `_expo/`, `assets/`, `sw.js`,
     `manifest.webmanifest`, ikony),
   - szablonem `scripts/deploy.htaccess` jako root `.htaccess`,
   - podzbiorem `api/`: `index.php`, `seed.php`, `config.sample.php`,
     `.htaccess`, `schema.sql` oraz `lib/*.php`.
   **Nie** trafia tu lokalny `api/config.php` ani żadne pliki SQLite.
3. Inicjuje w `.deploy/` nowe repozytorium na branchu `deploy` i wypycha je
   force'm na zdalne `origin` jako branch `deploy`.
4. Czyści katalog `.deploy/`.

hPanel łączy się z brancha `deploy`, więc każdy kolejny `npm run deploy`
aktualizuje produkcję.

---

## Kroki konfiguracji w hPanel

### 1. Baza danych MySQL

hPanel → **Bazy danych** → **MySQL** (lub **Bazy danych MySQL**):

- Utwórz nową bazę.
- Zapisz: **nazwę bazy**, **użytkownika** i **hasło**.
- Serwer (host) to zazwyczaj `localhost` na Hostingerze.

### 2. Podłączenie repozytorium przez Git

hPanel → **Zaawansowane** → **GIT**:

- Repository URL: `https://github.com/Pa-jak/notatnikv2.git`
- Branch: `deploy`
- Deployment directory: `public_html`
- Zapisz ustawienia.

Po pierwszym połączeniu hPanel pobierze zawartość brancha `deploy` do
`public_html`.

> **Auto-deploy:** w ustawieniach Git w hPanelu możesz włączyć webhook
> automatycznego deployu. Dzięki temu wystarczy wykonać `npm run deploy`
> lokalnie, a serwer sam pobierze nową wersję brancha.

### 3. Konfiguracja backendu — api/config.php

W hPanelu otwórz **Menedżer plików** i przejdź do
`public_html/api/`. Tam znajdziesz `config.sample.php`.

Skopiuj go jako `config.php` i uzupełnij dane. Przykład dla MySQL:

```php
<?php
return [
    'driver' => 'mysql',
    'sqlite_path' => __DIR__ . '/data.sqlite',
    'mysql_host' => 'localhost',
    'mysql_db'   => 'twoja_nazwa_bazy',
    'mysql_user' => 'nazwa_uzytkownika',
    'mysql_pass' => 'haslo_uzytkownika',
    'password_hash' => '',
    'app_secret' => '',
    'dev_cors_origin' => '',
];
```

Najważniejsze pola:

- `password_hash` — hash hasła logowania. Wygeneruj go lokalnie poleceniem:

  ```bash
  php -r "echo password_hash('twoje-haslo', PASSWORD_DEFAULT);"
  ```

  Skopiuj cały wynik do `password_hash`.

- `app_secret` — losowy sekret do podpisywania tokenów. Wygeneruj:

  ```bash
  php -r "echo bin2hex(random_bytes(24));"
  ```

- `dev_cors_origin` — na produkcji **pusty string** `''`.

Jeśli nie masz dostępu do terminala PHP na komputerze, użyj lokalnie
dostępnego PHP lub dowolnego generatora losowych bajtów i wklej wartości
bezpośrednio w menedżerze plików.

> **Bezpieczeństwo:** `config.php` nigdy nie trafia do brancha `deploy`
> automatycznie, więc ustawienia produkcyjne zostają wyłącznie na serwerze.

---

## Pierwsze uruchomienie

Otwórz w przeglądarce:

```text
https://<twoja-domena>/api/
```

Powinieneś zobaczyć odpowiedź JSON, np.:

```json
{"ok": true, "service": "notatnik-api"}
```

Oznacza to, że PHP i baza są skonfigurowane, a schemat tabel przygotowany.
Baza utworzy się automatycznie przy pierwszym żądaniu (schema wykonuje się
z `api/schema.sql`).

### Seed danych demo

Aby wypełnić aplikację danymi demo:

1. Otwórz aplikację pod `https://<twoja-domena>/` i zaloguj się hasłem
   ustawionym w `password_hash`.
2. Skopiuj token: w przeglądarce DevTools → Application → Local Storage →
   klucz `notatnik.apiToken` (albo podejrzyj odpowiedź `POST /login`
   w zakładce Network).
3. Wykonaj żądanie:

   ```bash
   curl -X POST https://<twoja-domena>/api/seed \
     -H "Authorization: Bearer <TWÓJ_TOKEN>"
   ```

Jeśli wolisz zacząć od pustej bazy, po prostu zacznij używać aplikacji —
schemat tworzy się automatycznie.

---

## Aktualizacja aplikacji

Po wprowadzeniu zmian w głównym kodzie:

```bash
npm run deploy
```

Skrypt:

- zbuduje PWA z `EXPO_PUBLIC_API_URL=/api`,
- złoży drzewo produkcyjne i wypchnie je force'm na branch `deploy`.

hPanel pobierze nową wersję automatycznie (jeśli masz włączony auto-deploy
lub ręcznie odświeżysz funkcję Git w hPanelu).

---

## Rozwiązywanie problemów

### Status 500 po wejściu na /api/

Sprawdź, czy w `public_html/api/` istnieje plik `config.php` z poprawnymi
danymi MySQL. Brak tego pliku to najczęstsza przyczyna błędu 500.

### Problemy z PHP

W hPanelu sprawdź wersję PHP — aplikacja wymaga **PHP >= 8.1** (preferowane
8.x). Ustawienie wersji jest zazwyczaj dostępne w sekcji **Advanced** →
**PHP Configuration** lub **Select PHP Version**.

### HTTPS i certyfikat

Jeśli przeglądarka ostrzega przed niezabezpieczoną stroną:

- Upewnij się, że domena ma działający certyfikat SSL (hPanel → **SSL**).
- Root `.htaccess` ustawia przekierowanie HTTP → HTTPS z wyjątkiem
  `localhost`, ale gdy Hostinger działa za reverse proxy, warunek
  `%{HTTPS}` może wymagać dodatkowego `%{HTTP:X-Forwarded-Proto}`.
  W razie problemów skontaktuj się z supportem Hostinger lub dodaj warunek:

  ```apache
  RewriteCond %{HTTP:X-Forwarded-Proto} !https [NC]
  ```

### PWA nie odświeża się po deployu

`index.html` i `sw.js` mają nagłówki `Cache-Control: no-cache`, więc powinny
się odświeżać. Jeśli przeglądarka trzyma starą wersję, zamknij kartę,
wyczyść pamięć podręczną dla domeny lub odśwież przytrzymując **Ctrl+F5**.
