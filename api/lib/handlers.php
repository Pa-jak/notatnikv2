<?php

/**
 * Obsługa endpointów REST API. Każda funkcja przyjmuje PDO i parametry
 * wyizolowane z żądania w index.php. Zwraca wynik przez helpery http_*
 * (które kończą wykonywanie).

 * Konwencja: wiersz DB (snake_case) → JSON camelCase zgodny 1:1 z lib/types.ts.
 */

require_once __DIR__ . '/http.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/../seed.php';

const JSON_FLAGS_OUT = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

function iso_now(): string
{
    return date('Y-m-d\TH:i:s');
}

function gen_id(string $prefix): string
{
    return $prefix . '-' . bin2hex(random_bytes(6));
}

// --- KONWERSJE WIERSZ → JSON (camelCase) ---

function personTypeRow(array $row): array
{
    return [
        'id'     => $row['id'],
        'name'   => $row['name'],
        'color'  => $row['color'] !== null ? $row['color'] : null,
        'fields' => json_decode($row['fields_json'], true) ?? [],
    ];
}

function personRow(array $row): array
{
    return [
        'id'     => $row['id'],
        'name'   => $row['name'],
        'phone'  => $row['phone'] !== null ? $row['phone'] : null,
        'email'  => $row['email'] !== null ? $row['email'] : null,
        'typeId' => $row['type_id'],
        'values' => json_decode($row['values_json'], true) ?? [],
    ];
}

function noteMentions(PDO $pdo, string $noteId): array
{
    $st = $pdo->prepare('SELECT person_id FROM note_mentions WHERE note_id = ?');
    $st->execute([$noteId]);
    return array_map(fn($r) => $r['person_id'], $st->fetchAll());
}

function noteRow(PDO $pdo, array $row): array
{
    return [
        'id'        => $row['id'],
        'kind'      => $row['kind'],
        'title'     => $row['title'],
        'body'      => $row['body'],
        'linkUrl'   => $row['link_url'] !== null ? $row['link_url'] : null,
        'linkDesc'  => $row['link_desc'] !== null ? $row['link_desc'] : null,
        'attachmentLabel' => $row['attachment_label'] !== null ? $row['attachment_label'] : null,
        'mentioned' => noteMentions($pdo, $row['id']),
        'projectId' => $row['project_id'] !== null ? $row['project_id'] : null,
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function taskRow(array $row): array
{
    return [
        'id'          => $row['id'],
        'title'       => $row['title'],
        'description' => $row['description'] !== null ? $row['description'] : null,
        'dueDate'     => $row['due_date'] !== null ? $row['due_date'] : null,
        'dueTime'     => $row['due_time'] !== null ? $row['due_time'] : null,
        'category'    => $row['category'] !== null ? $row['category'] : null,
        'column'      => $row['board_column'],
        'order'       => (int) $row['sort_order'],
        'personId'    => $row['person_id'] !== null ? $row['person_id'] : null,
        'projectId'   => $row['project_id'] !== null ? $row['project_id'] : null,
    ];
}

function projectPeople(PDO $pdo, string $projectId): array
{
    $st = $pdo->prepare('SELECT person_id FROM project_people WHERE project_id = ?');
    $st->execute([$projectId]);
    return array_map(fn($r) => $r['person_id'], $st->fetchAll());
}

function projectRow(PDO $pdo, array $row): array
{
    return [
        'id'            => $row['id'],
        'name'          => $row['name'],
        'status'        => $row['status'],
        'importance'    => $row['importance'],
        'tags'          => json_decode($row['tags_json'], true) ?? [],
        'blockedReason' => $row['blocked_reason'] !== null ? $row['blocked_reason'] : null,
        'peopleIds'     => projectPeople($pdo, $row['id']),
        'icon'          => $row['icon'],
        'createdAt'     => $row['created_at'],
    ];
}

// --- POMOCNICZE POZYCJE ---

function getNote(PDO $pdo, string $id): ?array
{
    $st = $pdo->prepare('SELECT * FROM notes WHERE id = ?');
    $st->execute([$id]);
    $r = $st->fetch();
    return $r !== false ? $r : null;
}

function getPerson(PDO $pdo, string $id): ?array
{
    $st = $pdo->prepare('SELECT * FROM people WHERE id = ?');
    $st->execute([$id]);
    $r = $st->fetch();
    return $r !== false ? $r : null;
}

function getPersonType(PDO $pdo, string $id): ?array
{
    $st = $pdo->prepare('SELECT * FROM person_types WHERE id = ?');
    $st->execute([$id]);
    $r = $st->fetch();
    return $r !== false ? $r : null;
}

function getTask(PDO $pdo, string $id): ?array
{
    $st = $pdo->prepare('SELECT * FROM tasks WHERE id = ?');
    $st->execute([$id]);
    $r = $st->fetch();
    return $r !== false ? $r : null;
}

function getProject(PDO $pdo, string $id): ?array
{
    $st = $pdo->prepare('SELECT * FROM projects WHERE id = ?');
    $st->execute([$id]);
    $r = $st->fetch();
    return $r !== false ? $r : null;
}

/**
 * Zwraca pełny snapshot stanu aplikacji (5 tabel).
 */
function getState(PDO $pdo): array
{
    $personTypes = array_map('personTypeRow', $pdo->query('SELECT * FROM person_types')->fetchAll());

    $people = array_map('personRow', $pdo->query('SELECT * FROM people')->fetchAll());

    $notesRows = $pdo->query('SELECT * FROM notes ORDER BY created_at DESC')->fetchAll();
    $notes = array_map(fn($r) => noteRow($pdo, $r), $notesRows);

    $taskRows = $pdo->query('SELECT * FROM tasks ORDER BY board_column ASC, sort_order ASC')->fetchAll();
    $tasks = array_map('taskRow', $taskRows);

    $projectRows = $pdo->query('SELECT * FROM projects')->fetchAll();
    $projects = array_map(fn($r) => projectRow($pdo, $r), $projectRows);

    return [
        'personTypes' => $personTypes,
        'people'       => $people,
        'notes'        => $notes,
        'tasks'        => $tasks,
        'projects'     => $projects,
    ];
}

// --- HANDLERY AUTH ---

function handleLogin(PDO $pdo, array $body): void
{
    $cfg = require __DIR__ . '/../config.php';
    $hash = (string) ($cfg['password_hash'] ?? '');
    $password = (string) ($body['password'] ?? '');
    if (!password_verify($password, $hash)) {
        json_error('Niepoprawne hasło', 401);
    }
    json_out(['token' => appToken()]);
}

function handleSeed(PDO $pdo): void
{
    requireAuth();
    $count = (int) $pdo->query('SELECT COUNT(*) FROM person_types')->fetchColumn();
    if ($count > 0) {
        json_error('Baza już zaseedowana', 409);
    }
    ensureSchema($pdo);
    $counts = runSeed($pdo);
    json_out($counts);
}

function handleState(PDO $pdo): void
{
    requireAuth();
    json_out(getState($pdo));
}

// --- NOTES ---

function handleNoteCreate(PDO $pdo, array $body): void
{
    requireAuth();
    $id = (string) ($body['id'] ?? '');
    $title = (string) ($body['title'] ?? '');
    $kind = (string) ($body['kind'] ?? '');
    if ($id === '' || $title === '' || !in_array($kind, ['text', 'photo', 'link', 'voice'], true)) {
        json_error('Brak lub niepoprawne pola (id, title, kind)', 400);
    }
    if (getNote($pdo, $id) !== null) {
        json_error('Notatka o tym id już istnieje', 409);
    }
    $body_text = (string) ($body['body'] ?? '');
    $linkUrl = $body['linkUrl'] ?? null;
    $linkDesc = $body['linkDesc'] ?? null;
    $attachmentLabel = $body['attachmentLabel'] ?? null;
    $projectId = $body['projectId'] ?? null;
    $mentioned = $body['mentioned'] ?? [];
    if (!is_array($mentioned)) {
        $mentioned = [];
    }

    $now = iso_now();
    $pdo->beginTransaction();
    try {
        $st = $pdo->prepare('INSERT INTO notes (id, kind, title, body, link_url, link_desc, attachment_label, project_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $st->execute([$id, $kind, $title, $body_text, $linkUrl, $linkDesc, $attachmentLabel, $projectId, $now, $now]);
        $stM = $pdo->prepare('INSERT INTO note_mentions (note_id, person_id) VALUES (?, ?)');
        foreach ($mentioned as $pid) {
            $stM->execute([$id, $pid]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    $row = getNote($pdo, $id);
    json_out(noteRow($pdo, $row), 201);
}

function handleNoteUpdate(PDO $pdo, string $id, array $body): void
{
    requireAuth();
    $row = getNote($pdo, $id);
    if ($row === null) {
        json_error('Notatka nie istnieje', 404);
    }

    $fields = ['kind', 'title', 'body'];
    $map = [
        'kind'            => 'kind',
        'title'           => 'title',
        'body'            => 'body',
        'linkUrl'         => 'link_url',
        'linkDesc'        => 'link_desc',
        'attachmentLabel' => 'attachment_label',
        'projectId'       => 'project_id',
    ];
    $sets = [];
    $args = [];
    foreach ($map as $json => $col) {
        if (array_key_exists($json, $body)) {
            $sets[] = "$col = ?";
            $args[] = $body[$json];
        }
    }
    if (array_key_exists('mentioned', $body)) {
        // wstrzymane do transakcji poniżej
    }

    $now = iso_now();
    $sets[] = 'updated_at = ?';
    $args[] = $now;
    $args[] = $id;

    $pdo->beginTransaction();
    try {
        if (!empty($sets)) {
            $sql = 'UPDATE notes SET ' . implode(', ', $sets) . ' WHERE id = ?';
            $pdo->prepare($sql)->execute($args);
        }
        if (array_key_exists('mentioned', $body)) {
            $pdo->prepare('DELETE FROM note_mentions WHERE note_id = ?')->execute([$id]);
            $mentioned = $body['mentioned'];
            if (!is_array($mentioned)) {
                $mentioned = [];
            }
            $stM = $pdo->prepare('INSERT INTO note_mentions (note_id, person_id) VALUES (?, ?)');
            foreach ($mentioned as $pid) {
                $stM->execute([$id, $pid]);
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    $row = getNote($pdo, $id);
    json_out(noteRow($pdo, $row));
}

function handleNoteDelete(PDO $pdo, string $id): void
{
    requireAuth();
    if (getNote($pdo, $id) === null) {
        json_error('Notatka nie istnieje', 404);
    }
    $pdo->prepare('DELETE FROM notes WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}

// --- PEOPLE ---

function handlePersonCreate(PDO $pdo, array $body): void
{
    requireAuth();
    $id = (string) ($body['id'] ?? '');
    $name = (string) ($body['name'] ?? '');
    $typeId = (string) ($body['typeId'] ?? '');
    $values = $body['values'] ?? [];
    if (!is_array($values)) {
        $values = [];
    }
    if ($id === '' || $name === '' || $typeId === '') {
        json_error('Brak lub niepoprawne pola (id, name, typeId)', 400);
    }
    if (getPersonType($pdo, $typeId) === null) {
        json_error('Typ osoby nie istnieje', 409);
    }
    if (getPerson($pdo, $id) !== null) {
        json_error('Osoba o tym id już istnieje', 409);
    }
    $st = $pdo->prepare('INSERT INTO people (id, name, phone, email, type_id, values_json) VALUES (?, ?, ?, ?, ?, ?)');
    $st->execute([
        $id,
        $name,
        $body['phone'] ?? null,
        $body['email'] ?? null,
        $typeId,
        json_encode($values, JSON_FLAGS_OUT),
    ]);
    $row = getPerson($pdo, $id);
    json_out(personRow($row), 201);
}

function handlePersonUpdate(PDO $pdo, string $id, array $body): void
{
    requireAuth();
    $row = getPerson($pdo, $id);
    if ($row === null) {
        json_error('Osoba nie istnieje', 404);
    }
    $map = [
        'name' => 'name',
        'phone' => 'phone',
        'email' => 'email',
        'typeId' => 'type_id',
    ];
    $sets = [];
    $args = [];
    foreach ($map as $json => $col) {
        if (array_key_exists($json, $body)) {
            $sets[] = "$col = ?";
            $args[] = $body[$json];
        }
    }
    if (array_key_exists('values', $body)) {
        $sets[] = 'values_json = ?';
        $args[] = json_encode(is_array($body['values']) ? $body['values'] : [], JSON_FLAGS_OUT);
    }
    if (!empty($sets)) {
        $args[] = $id;
        $pdo->prepare('UPDATE people SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($args);
    }
    $row = getPerson($pdo, $id);
    json_out(personRow($row));
}

function handlePersonDelete(PDO $pdo, string $id): void
{
    requireAuth();
    if (getPerson($pdo, $id) === null) {
        json_error('Osoba nie istnieje', 404);
    }
    $pdo->prepare('DELETE FROM people WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}

// --- PERSON TYPES ---

function handlePersonTypeCreate(PDO $pdo, array $body): void
{
    requireAuth();
    $id = (string) ($body['id'] ?? '');
    $name = (string) ($body['name'] ?? '');
    if ($id === '' || $name === '') {
        json_error('Brak lub niepoprawne pola (id, name)', 400);
    }
    if (getPersonType($pdo, $id) !== null) {
        json_error('Typ osoby o tym id już istnieje', 409);
    }
    $st = $pdo->prepare('INSERT INTO person_types (id, name, color, fields_json) VALUES (?, ?, ?, ?)');
    $st->execute([$id, $name, $body['color'] ?? null, '[]']);
    $row = getPersonType($pdo, $id);
    json_out(personTypeRow($row), 201);
}

function handlePersonTypeUpdate(PDO $pdo, string $id, array $body): void
{
    requireAuth();
    $row = getPersonType($pdo, $id);
    if ($row === null) {
        json_error('Typ osoby nie istnieje', 404);
    }
    $sets = [];
    $args = [];
    if (array_key_exists('name', $body)) {
        $sets[] = 'name = ?';
        $args[] = $body['name'];
    }
    if (array_key_exists('color', $body)) {
        $sets[] = 'color = ?';
        $args[] = $body['color'];
    }
    if (!empty($sets)) {
        $args[] = $id;
        $pdo->prepare('UPDATE person_types SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($args);
    }
    $row = getPersonType($pdo, $id);
    json_out(personTypeRow($row));
}

function handlePersonTypeDelete(PDO $pdo, string $id): void
{
    requireAuth();
    $row = getPersonType($pdo, $id);
    if ($row === null) {
        json_error('Typ osoby nie istnieje', 404);
    }
    $pdo->beginTransaction();
    try {
        $fallback = $pdo->prepare('SELECT id FROM person_types WHERE id <> ? LIMIT 1');
        $fallback->execute([$id]);
        $fb = $fallback->fetchColumn();
        if ($fb === false) {
            $cnt = (int) $pdo->query('SELECT COUNT(*) FROM people WHERE type_id = ' . $pdo->quote($id))->fetchColumn();
            if ($cnt > 0) {
                throw new RuntimeException('Nie można usunąć jedynego typu — istnieją osoby');
            }
        } else {
            $pdo->prepare('UPDATE people SET type_id = ? WHERE type_id = ?')->execute([$fb, $id]);
        }
        $pdo->prepare('DELETE FROM person_types WHERE id = ?')->execute([$id]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_error($e->getMessage(), 409);
    }
    json_out(['ok' => true]);
}

function handleFieldAdd(PDO $pdo, string $typeId, array $body): void
{
    requireAuth();
    $row = getPersonType($pdo, $typeId);
    if ($row === null) {
        json_error('Typ osoby nie istnieje', 404);
    }
    $label = (string) ($body['label'] ?? '');
    $kind = (string) ($body['kind'] ?? '');
    $id = (string) ($body['id'] ?? '');
    if ($label === '' || !in_array($kind, ['text', 'number', 'date'], true)) {
        json_error('Brak lub niepoprawne pola (label, kind)', 400);
    }
    if ($id === '') {
        $id = gen_id('f');
    }
    $fields = json_decode($row['fields_json'], true) ?? [];
    $fields[] = ['id' => $id, 'label' => $label, 'kind' => $kind];
    $pdo->prepare('UPDATE person_types SET fields_json = ? WHERE id = ?')
        ->execute([json_encode($fields, JSON_FLAGS_OUT), $typeId]);
    $row = getPersonType($pdo, $typeId);
    json_out(personTypeRow($row));
}

function handleFieldDelete(PDO $pdo, string $typeId, string $fieldId): void
{
    requireAuth();
    $row = getPersonType($pdo, $typeId);
    if ($row === null) {
        json_error('Typ osoby nie istnieje', 404);
    }
    $fields = json_decode($row['fields_json'], true) ?? [];
    $fields = array_values(array_filter($fields, fn($f) => $f['id'] !== $fieldId));
    $pdo->prepare('UPDATE person_types SET fields_json = ? WHERE id = ?')
        ->execute([json_encode($fields, JSON_FLAGS_OUT), $typeId]);
    $row = getPersonType($pdo, $typeId);
    json_out(personTypeRow($row));
}

// --- TASKS ---

function handleTaskCreate(PDO $pdo, array $body): void
{
    requireAuth();
    $id = (string) ($body['id'] ?? '');
    $title = (string) ($body['title'] ?? '');
    $column = (string) ($body['column'] ?? '');
    if ($id === '' || $title === '' || $column === '') {
        json_error('Brak lub niepoprawne pola (id, title, column)', 400);
    }
    if (getTask($pdo, $id) !== null) {
        json_error('Zadanie o tym id już istnieje', 409);
    }
    $pdo->beginTransaction();
    try {
        $pdo->prepare('UPDATE tasks SET sort_order = sort_order + 1 WHERE board_column = ?')->execute([$column]);
        $st = $pdo->prepare('INSERT INTO tasks (id, title, description, due_date, due_time, category, board_column, sort_order, person_id, project_id) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)');
        $st->execute([
            $id,
            $title,
            $body['description'] ?? null,
            $body['dueDate'] ?? null,
            $body['dueTime'] ?? null,
            $body['category'] ?? null,
            $column,
            $body['personId'] ?? null,
            $body['projectId'] ?? null,
        ]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
    $row = getTask($pdo, $id);
    json_out(taskRow($row), 201);
}

function handleTaskUpdate(PDO $pdo, string $id, array $body): void
{
    requireAuth();
    $row = getTask($pdo, $id);
    if ($row === null) {
        json_error('Zadanie nie istnieje', 404);
    }
    $map = [
        'title'       => 'title',
        'description' => 'description',
        'dueDate'     => 'due_date',
        'dueTime'     => 'due_time',
        'category'    => 'category',
        'column'      => 'board_column',
        'order'       => 'sort_order',
        'personId'    => 'person_id',
        'projectId'   => 'project_id',
    ];
    $sets = [];
    $args = [];
    foreach ($map as $json => $col) {
        if (array_key_exists($json, $body)) {
            $sets[] = "$col = ?";
            $args[] = $json === 'order' ? (int) $body[$json] : $body[$json];
        }
    }
    if (!empty($sets)) {
        $args[] = $id;
        $pdo->prepare('UPDATE tasks SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($args);
    }
    $row = getTask($pdo, $id);
    json_out(taskRow($row));
}

function handleTaskDelete(PDO $pdo, string $id): void
{
    requireAuth();
    if (getTask($pdo, $id) === null) {
        json_error('Zadanie nie istnieje', 404);
    }
    $pdo->prepare('DELETE FROM tasks WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}

function handleTaskMove(PDO $pdo, string $id, array $body): void
{
    requireAuth();
    $row = getTask($pdo, $id);
    if ($row === null) {
        json_error('Zadanie nie istnieje', 404);
    }
    $column = (string) ($body['column'] ?? '');
    if ($column === '') {
        json_error('Brak pola column', 400);
    }
    $pdo->beginTransaction();
    try {
        $st = $pdo->prepare('SELECT COALESCE(MAX(sort_order), -1) FROM tasks WHERE board_column = ?');
        $st->execute([$column]);
        $max = (int) $st->fetchColumn();
        $pdo->prepare('UPDATE tasks SET board_column = ?, sort_order = ? WHERE id = ?')
            ->execute([$column, $max + 1, $id]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
    $row = getTask($pdo, $id);
    json_out(taskRow($row));
}

// --- PROJECTS ---

function handleProjectUpdate(PDO $pdo, string $id, array $body): void
{
    requireAuth();
    $row = getProject($pdo, $id);
    if ($row === null) {
        json_error('Projekt nie istnieje', 404);
    }
    $map = [
        'name'          => 'name',
        'status'        => 'status',
        'importance'    => 'importance',
        'blockedReason' => 'blocked_reason',
        'icon'          => 'icon',
    ];
    $sets = [];
    $args = [];
    foreach ($map as $json => $col) {
        if (array_key_exists($json, $body)) {
            $sets[] = "$col = ?";
            $args[] = $body[$json];
        }
    }
    if (array_key_exists('tags', $body)) {
        $sets[] = 'tags_json = ?';
        $args[] = json_encode(is_array($body['tags']) ? $body['tags'] : [], JSON_FLAGS_OUT);
    }

    $pdo->beginTransaction();
    try {
        if (!empty($sets)) {
            $args[] = $id;
            $pdo->prepare('UPDATE projects SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($args);
        }
        if (array_key_exists('peopleIds', $body) && is_array($body['peopleIds'])) {
            $pdo->prepare('DELETE FROM project_people WHERE project_id = ?')->execute([$id]);
            $stPP = $pdo->prepare('INSERT INTO project_people (project_id, person_id) VALUES (?, ?)');
            foreach ($body['peopleIds'] as $pid) {
                $stPP->execute([$id, $pid]);
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    $row = getProject($pdo, $id);
    json_out(projectRow($pdo, $row));
}