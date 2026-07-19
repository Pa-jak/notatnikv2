<?php

/**
 * Połączenie z bazą danych (PDO) jako singleton.
 * Obsługuje SQLite (dev) oraz MySQL/MariaDB (Hostinger).
 */

function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $configFile = __DIR__ . '/../config.php';
    if (!is_file($configFile)) {
        throw new RuntimeException(
            'Brak pliku konfiguracyjnego. Skopiuj api/config.sample.php do api/config.php i uzupełnij wartości.'
        );
    }

    /** @var array $cfg */
    $cfg = require $configFile;

    $driver = $cfg['driver'] ?? 'sqlite';

    if ($driver === 'sqlite') {
        $path = $cfg['sqlite_path'] ?? (__DIR__ . '/../data.sqlite');
        $dsn = 'sqlite:' . $path;
        $pdo = new PDO($dsn);
        // Włącz wymuszanie kluczy obcych w SQLite.
        $pdo->exec('PRAGMA foreign_keys = ON');
    } elseif ($driver === 'mysql') {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=utf8mb4',
            $cfg['mysql_host'] ?? 'localhost',
            $cfg['mysql_db'] ?? ''
        );
        $pdo = new PDO($dsn, $cfg['mysql_user'] ?? '', $cfg['mysql_pass'] ?? '');
    } else {
        throw new RuntimeException("Nieobsługiwany sterownik bazy: $driver");
    }

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    return $pdo;
}

/**
 * Wykonuje api/schema.sql na podłączonym PDO.
 * Dzieli plik na pojedyncze statementy po średniku.
 */
function ensureSchema(PDO $pdo): void
{
    $sql = file_get_contents(__DIR__ . '/../schema.sql');
    if ($sql === false) {
        throw new RuntimeException('Nie udało się odczytać api/schema.sql');
    }

    // Usuń komentarze liniowe (-- ...), aby nie przeszkadzały w podziale.
    $lines = preg_split('/\r?\n/', $sql);
    $cleaned = [];
    foreach ($lines as $line) {
        $cleaned[] = preg_replace('/--.*$/', '', $line);
    }
    $sql = implode("\n", $cleaned);

    // Podziel na statementy po średniku.
    $statements = preg_split('/;\s*(?=CREATE)/i', $sql);
    foreach ($statements as $stmt) {
        $stmt = trim($stmt);
        if ($stmt === '') {
            continue;
        }
        $pdo->exec($stmt);
    }
}