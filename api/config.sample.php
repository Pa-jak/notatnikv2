<?php

/**
 * Przykładowa konfiguracja backendu Notatnik.
 *
 * 1. Skopiuj ten plik do `config.php` (w tym samym katalogu) i uzupełnij wartości.
 * 2. Wygeneruj hash hasła aplikacji (password_hash) poleceniem:
 *
 *      php -r "echo password_hash('twoje-haslo', PASSWORD_DEFAULT);"
 *
 *    wklej wynik do klucza `password_hash`.
 * 3. Wygeneruj losowy app_secret, np.:
 *
 *      php -r "echo bin2hex(random_bytes(24));"
 *
 * 4. dev_cors_origin: na produkcji ustaw pusty string '', lokalnie np. 'http://localhost:8081'.
 */

return [
    // Sterownik bazy: 'sqlite' (dev lokalnie) lub 'mysql' (Hostinger).
    'driver' => 'sqlite',

    // Ścieżka do pliku SQLite (tylko dla driver='sqlite').
    'sqlite_path' => __DIR__ . '/data.sqlite',

    // Dane MySQL/MariaDB (tylko dla driver='mysql').
    'mysql_host' => 'localhost',
    'mysql_db'   => '',
    'mysql_user' => '',
    'mysql_pass' => '',

    // Hash hasła aplikacji (wygeneruj przez password_hash()).
    'password_hash' => '',

    // Losowy ciąg >= 32 znaków (np. bin2hex(random_bytes(24))).
    'app_secret' => '',

    // Dopuszczony origin CORS w dev ('' na produkcji).
    'dev_cors_origin' => '',
];