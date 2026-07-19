<?php

/**
 * Front controller REST API Notatnik.
 */

require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/http.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/handlers.php';

// --- CORS (dev) ---
$cfg = require __DIR__ . '/config.php';
$devCors = (string) ($cfg['dev_cors_origin'] ?? '');
if ($devCors !== '') {
    header('Access-Control-Allow-Origin: ' . $devCors);
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Credentials: true');
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

set_exception_handler(function (Throwable $e): void {
    json_error('Wewnętrzny błąd serwera', 500);
});

// --- WYZNACZENIE ŚCIEŻKI ---

function resolvePath(): string
{
    if (!empty($_SERVER['PATH_INFO'])) {
        $p = $_SERVER['PATH_INFO'];
    } else {
        $p = $_SERVER['REQUEST_URI'] ?? '/';
        $p = parse_url($p, PHP_URL_PATH) ?? $p;
        $posApi = strpos($p, '/api');
        if ($posApi !== false) {
            $p = substr($p, $posApi + 4);
        } else {
            $posIndex = strpos($p, '/index.php');
            if ($posIndex !== false) {
                $p = substr($p, $posIndex + strlen('/index.php'));
            } else {
                $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
                $base = dirname($scriptName);
                if ($base !== '/' && $base !== '\\' && $base !== '.' && strpos($p, $base) === 0) {
                    $p = substr($p, strlen($base));
                }
            }
        }
    }
    if ($p === '' || $p[0] !== '/') {
        $p = '/' . $p;
    }
    return $p;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = resolvePath();

// Normalizacja: usuń końcowe ukośniki (poza samym /).
$path = rtrim($path, '/');
if ($path === '') {
    $path = '/';
}

// Inicjalizacja bazy (lazy — wyjątki lapi globalny handler).
$pdo = db();
ensureSchema($pdo);

// --- ROUTING ---

$segments = explode('/', ltrim($path, '/'));

try {
    if ($path === '/') {
        json_out(['ok' => true, 'service' => 'notatnik-api']);
    }

    // /login
    if ($path === '/login' && $method === 'POST') {
        handleLogin($pdo, json_in());
    }
    if ($path === '/login') {
        json_error('Metoda niedozwolona', 405);
    }

    // /seed
    if ($path === '/seed' && $method === 'POST') {
        handleSeed($pdo);
    }
    if ($path === '/seed') {
        json_error('Metoda niedozwolona', 405);
    }

    // /state
    if ($path === '/state' && $method === 'GET') {
        handleState($pdo);
    }
    if ($path === '/state') {
        json_error('Metoda niedozwolona', 405);
    }

    // /notes
    if ($path === '/notes' && $method === 'POST') {
        handleNoteCreate($pdo, json_in());
    }
    if ($path === '/notes') {
        json_error('Metoda niedozwolona', 405);
    }

    if (count($segments) === 2 && $segments[0] === 'notes') {
        $id = urldecode($segments[1]);
        if ($method === 'PUT') {
            handleNoteUpdate($pdo, $id, json_in());
        } elseif ($method === 'DELETE') {
            handleNoteDelete($pdo, $id);
        } else {
            json_error('Metoda niedozwolona', 405);
        }
    }

    // /people
    if ($path === '/people' && $method === 'POST') {
        handlePersonCreate($pdo, json_in());
    }
    if ($path === '/people') {
        json_error('Metoda niedozwolona', 405);
    }

    if (count($segments) === 2 && $segments[0] === 'people') {
        $id = urldecode($segments[1]);
        if ($method === 'PUT') {
            handlePersonUpdate($pdo, $id, json_in());
        } elseif ($method === 'DELETE') {
            handlePersonDelete($pdo, $id);
        } else {
            json_error('Metoda niedozwolona', 405);
        }
    }

    // /person-types
    if ($path === '/person-types' && $method === 'POST') {
        handlePersonTypeCreate($pdo, json_in());
    }
    if ($path === '/person-types') {
        json_error('Metoda niedozwolona', 405);
    }

    // /person-types/{id}
    if (count($segments) === 2 && $segments[0] === 'person-types') {
        $id = urldecode($segments[1]);
        if ($method === 'PUT') {
            handlePersonTypeUpdate($pdo, $id, json_in());
        } elseif ($method === 'DELETE') {
            handlePersonTypeDelete($pdo, $id);
        } else {
            json_error('Metoda niedozwolona', 405);
        }
    }

    // /person-types/{id}/fields
    if (count($segments) === 3 && $segments[0] === 'person-types' && $segments[2] === 'fields' && $method === 'POST') {
        handleFieldAdd($pdo, urldecode($segments[1]), json_in());
    }

    // /person-types/{id}/fields/{fieldId}
    if (count($segments) === 4 && $segments[0] === 'person-types' && $segments[2] === 'fields' && $method === 'DELETE') {
        handleFieldDelete($pdo, urldecode($segments[1]), urldecode($segments[3]));
    }

    // /tasks
    if ($path === '/tasks' && $method === 'POST') {
        handleTaskCreate($pdo, json_in());
    }
    if ($path === '/tasks') {
        json_error('Metoda niedozwolona', 405);
    }

    if (count($segments) === 2 && $segments[0] === 'tasks') {
        $id = urldecode($segments[1]);
        if ($method === 'PUT') {
            handleTaskUpdate($pdo, $id, json_in());
        } elseif ($method === 'DELETE') {
            handleTaskDelete($pdo, $id);
        } else {
            json_error('Metoda niedozwolona', 405);
        }
    }

    if (count($segments) === 3 && $segments[0] === 'tasks' && $segments[2] === 'move' && $method === 'POST') {
        handleTaskMove($pdo, urldecode($segments[1]), json_in());
    }

    // /projects
    if ($path === '/projects' && $method === 'POST') {
        handleProjectCreate($pdo, json_in());
    }
    if ($path === '/projects') {
        json_error('Metoda niedozwolona', 405);
    }

    // /projects/{id}
    if (count($segments) === 2 && $segments[0] === 'projects') {
        $id = urldecode($segments[1]);
        if ($method === 'PUT') {
            handleProjectUpdate($pdo, $id, json_in());
        } elseif ($method === 'DELETE') {
            handleProjectDelete($pdo, $id);
        } else {
            json_error('Metoda niedozwolona', 405);
        }
    }

    json_error('Nieznana trasa', 404);
} catch (Throwable $e) {
    // Handler wyjątkówAPi (już obsłużone w handlerach) vs niespodziewane.
    // Funkcje handler_ konczą się przez json_out / json_error (exit), więc tu trafiają
    // tylko wyjątki z zapytań SQL.
    json_error('Wewnętrzny błąd serwera', 500);
}