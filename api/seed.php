<?php

/**
 * Seeder bazy danych aplikacji Notatnik.
 * Wierna kopia danych z lib/mock.ts.
 *
 * Uruchomienie CLI: php api/seed.php
 * Drugie uruchomienie odmawia (jeśli person_types nie jest pusta).
 *
 * Programowo: require tego pliku i wywołaj runSeed(PDO): array.
 */

require_once __DIR__ . '/lib/db.php';

/**
 * Wstawia dane seedowe w transakcji. Nie sprawdza, czy baza jest pusta
 * — sprawdzi to wywołujący (CLI lub endpoint /seed).
 *
 * @return array<string,int> liczebności zapisanych tabel
 */
function runSeed(PDO $pdo): array
{
    $iso = function (int $offset, string $time = '12:00'): string {
        return date('Y-m-d', strtotime("$offset days")) . 'T' . $time . ':00';
    };
    $day = function (int $offset): string {
        return date('Y-m-d', strtotime("$offset days"));
    };

    $personTypes = [
        [
            'id' => 'pt-kontakt',
            'name' => 'Kontakt',
            'color' => '#6ea8fe',
            'fields' => [
                ['id' => 'f-lubi', 'label' => 'Lubi', 'kind' => 'text'],
                ['id' => 'f-nielubi', 'label' => 'Nie lubi', 'kind' => 'text'],
            ],
        ],
        [
            'id' => 'pt-klient',
            'name' => 'Klient',
            'color' => '#4fd6c0',
            'fields' => [
                ['id' => 'f-umowa', 'label' => 'Numer umowy', 'kind' => 'text'],
                ['id' => 'f-zakres', 'label' => 'Zakres prac', 'kind' => 'text'],
                ['id' => 'f-lubi2', 'label' => 'Lubi', 'kind' => 'text'],
            ],
        ],
        [
            'id' => 'pt-wspolpracownik',
            'name' => 'Współpracownik',
            'color' => '#b98be0',
            'fields' => [
                ['id' => 'f-rola', 'label' => 'Rola', 'kind' => 'text'],
                ['id' => 'f-stawka', 'label' => 'Stawka godzinowa', 'kind' => 'number'],
            ],
        ],
    ];

    $people = [
        [
            'id' => 'p-anna',
            'name' => 'Anna Kowalska',
            'phone' => '+48 601 234 567',
            'email' => 'anna.kowalska@firma.pl',
            'type_id' => 'pt-klient',
            'values' => [
                'f-umowa' => 'UM/2026/041',
                'f-zakres' => 'Onboarding aplikacji mobilnej',
                'f-lubi2' => 'konkrety i krótkie spotkania',
            ],
        ],
        [
            'id' => 'p-marek',
            'name' => 'Marek Nowak',
            'phone' => '+48 512 887 213',
            'email' => 'marek.nowak@gmail.com',
            'type_id' => 'pt-kontakt',
            'values' => [
                'f-lubi' => 'wspinaczkę, kawę przelewową',
                'f-nielubi' => 'spotkań przed 10:00',
            ],
        ],
        [
            'id' => 'p-kasia',
            'name' => 'Katarzyna Zielińska',
            'phone' => '+48 728 445 902',
            'email' => 'k.zielinska@studio.design',
            'type_id' => 'pt-wspolpracownik',
            'values' => [
                'f-rola' => 'Projektantka UI',
                'f-stawka' => '180',
            ],
        ],
        [
            'id' => 'p-piotr',
            'name' => 'Piotr Wiśniewski',
            'phone' => '+48 604 118 330',
            'email' => 'piotr@wisniewski.dev',
            'type_id' => 'pt-wspolpracownik',
            'values' => [
                'f-rola' => 'Backend developer',
                'f-stawka' => '210',
            ],
        ],
        [
            'id' => 'p-ola',
            'name' => 'Aleksandra Mazur',
            'phone' => '+48 793 220 415',
            'email' => 'ola.mazur@agencja.pl',
            'type_id' => 'pt-klient',
            'values' => [
                'f-umowa' => 'UM/2026/037',
                'f-zakres' => 'Rebranding identyfikacji',
                'f-lubi2' => 'moodboardy i szybkie iteracje',
            ],
        ],
        [
            'id' => 'p-tomek',
            'name' => 'Tomasz Lis',
            'phone' => '+48 505 662 118',
            'email' => 'tomek.lis@interia.pl',
            'type_id' => 'pt-kontakt',
            'values' => [
                'f-lubi' => 'planszówki, dobre IPA',
                'f-nielubi' => 'rozmów telefonicznych',
            ],
        ],
    ];

    $projects = [
        [
            'id' => 'prj-onboarding',
            'name' => 'Onboarding v2',
            'status' => 'paused',
            'importance' => 'high',
            'tags' => ['#klient', '#design'],
            'blocked_reason' => 'czekamy na akceptację budżetu od klienta (Anna, do 15.07).',
            'people_ids' => ['p-anna', 'p-kasia', 'p-piotr'],
            'icon' => 'clock',
            'created_at' => $iso(-9),
        ],
        [
            'id' => 'prj-crm',
            'name' => 'Migracja CRM',
            'status' => 'active',
            'importance' => 'medium',
            'tags' => ['#wewnętrzne', '#q3'],
            'blocked_reason' => null,
            'people_ids' => ['p-piotr', 'p-tomek'],
            'icon' => 'star',
            'created_at' => $iso(-14),
        ],
        [
            'id' => 'prj-rebranding',
            'name' => 'Rebranding',
            'status' => 'active',
            'importance' => 'low',
            'tags' => ['#marketing', '#design'],
            'blocked_reason' => null,
            'people_ids' => ['p-ola', 'p-kasia', 'p-marek', 'p-tomek'],
            'icon' => 'list',
            'created_at' => $iso(-21),
        ],
    ];

    $notes = [
        [
            'id' => 'n-brief',
            'kind' => 'text',
            'title' => 'Brief po rozmowie z Anną',
            'body' => 'Priorytet: skrócić pierwsze uruchomienie do 3 kroków. Anna chce zobaczyć prototyp ekranu powitalnego przed akceptacją budżetu. Wraca z decyzją do 15.07.',
            'link_url' => null,
            'link_desc' => null,
            'attachment_label' => null,
            'mentioned' => ['p-anna'],
            'project_id' => 'prj-onboarding',
            'created_at' => $iso(0, '09:40'),
            'updated_at' => $iso(0, '09:40'),
        ],
        [
            'id' => 'n-voice-standup',
            'kind' => 'voice',
            'title' => 'Głosówka po standupie',
            'body' => 'Notatka głosowa o blokerach w migracji.',
            'link_url' => null,
            'link_desc' => null,
            'attachment_label' => 'Nagranie · 1:24',
            'mentioned' => ['p-piotr'],
            'project_id' => 'prj-crm',
            'created_at' => $iso(0, '11:05'),
            'updated_at' => $iso(0, '11:05'),
        ],
        [
            'id' => 'n-link-inspo',
            'kind' => 'link',
            'title' => 'Inspiracja na onboarding',
            'body' => 'Świetny pattern progresywnego onboardingu — pokazać Kasi.',
            'link_url' => 'https://mobbin.com/flows/onboarding',
            'link_desc' => 'Mobbin — Onboarding flows',
            'attachment_label' => null,
            'mentioned' => ['p-kasia'],
            'project_id' => 'prj-onboarding',
            'created_at' => $iso(-1, '16:20'),
            'updated_at' => $iso(-1, '16:20'),
        ],
        [
            'id' => 'n-photo-tablica',
            'kind' => 'photo',
            'title' => 'Tablica po warsztacie',
            'body' => 'Zdjęcie tablicy z priorytetami rebrandingu.',
            'link_url' => null,
            'link_desc' => null,
            'attachment_label' => 'Zdjęcie · tablica.jpg',
            'mentioned' => ['p-ola', 'p-kasia'],
            'project_id' => 'prj-rebranding',
            'created_at' => $iso(-1, '13:45'),
            'updated_at' => $iso(-1, '13:45'),
        ],
        [
            'id' => 'n-marek-kawa',
            'kind' => 'text',
            'title' => 'Kawa z Markiem',
            'body' => 'Marek poleca kontakt do drukarni na materiały po rebrandingu. Umówić się na wrzesień na wspinaczkę.',
            'link_url' => null,
            'link_desc' => null,
            'attachment_label' => null,
            'mentioned' => ['p-marek'],
            'project_id' => null,
            'created_at' => $iso(-2, '18:10'),
            'updated_at' => $iso(-2, '18:10'),
        ],
        [
            'id' => 'n-crm-eksport',
            'kind' => 'text',
            'title' => 'Eksport danych ze starego CRM',
            'body' => 'Piotr sprawdził: eksport kontaktów działa, ale historia notatek wymaga skryptu. Tomek ma dostęp do starej bazy.',
            'link_url' => null,
            'link_desc' => null,
            'attachment_label' => null,
            'mentioned' => ['p-piotr', 'p-tomek'],
            'project_id' => 'prj-crm',
            'created_at' => $iso(-3, '10:30'),
            'updated_at' => $iso(-3, '10:30'),
        ],
        [
            'id' => 'n-link-fonty',
            'kind' => 'link',
            'title' => 'Fonty do nowego brandu',
            'body' => 'Para: Space Grotesk + IBM Plex — sprawdzić licencje.',
            'link_url' => 'https://fonts.google.com/specimen/Space+Grotesk',
            'link_desc' => 'Google Fonts — Space Grotesk',
            'attachment_label' => null,
            'mentioned' => [],
            'project_id' => 'prj-rebranding',
            'created_at' => $iso(-4, '15:00'),
            'updated_at' => $iso(-4, '15:00'),
        ],
        [
            'id' => 'n-voice-pomysl',
            'kind' => 'voice',
            'title' => 'Notatka głosowa — pomysł',
            'body' => 'Pomysł na aplikację do nawyków, nagrany w drodze.',
            'link_url' => null,
            'link_desc' => null,
            'attachment_label' => 'Nagranie · 0:48',
            'mentioned' => [],
            'project_id' => null,
            'created_at' => $iso(-1, '08:15'),
            'updated_at' => $iso(-1, '08:15'),
        ],
        [
            'id' => 'n-photo-moodboard',
            'kind' => 'photo',
            'title' => 'Moodboard od Oli',
            'body' => 'Pierwsza wersja moodboardu — ciepłe kolory, dużo bieli.',
            'link_url' => null,
            'link_desc' => null,
            'attachment_label' => 'Zdjęcie · moodboard.png',
            'mentioned' => ['p-ola'],
            'project_id' => 'prj-rebranding',
            'created_at' => $iso(-5, '12:40'),
            'updated_at' => $iso(-5, '12:40'),
        ],
    ];

    $tasks = [
        ['id' => 't-wymagania', 'title' => 'Zebrać wymagania wejściowe', 'description' => null, 'column' => 'done', 'order' => 0, 'project_id' => 'prj-onboarding', 'person_id' => 'p-anna', 'due_date' => $day(-6), 'due_time' => null, 'category' => 'teal'],
        ['id' => 't-audyt', 'title' => 'Audyt obecnego onboardingu', 'description' => null, 'column' => 'done', 'order' => 1, 'project_id' => 'prj-onboarding', 'person_id' => null, 'due_date' => $day(-5), 'due_time' => null, 'category' => 'teal'],
        ['id' => 't-flow', 'title' => 'Mapa przepływu 3 kroków', 'description' => null, 'column' => 'done', 'order' => 2, 'project_id' => 'prj-onboarding', 'person_id' => 'p-kasia', 'due_date' => $day(-3), 'due_time' => null, 'category' => 'teal'],
        ['id' => 't-copy', 'title' => 'Teksty ekranów powitalnych', 'description' => null, 'column' => 'done', 'order' => 3, 'project_id' => 'prj-onboarding', 'person_id' => null, 'due_date' => $day(-2), 'due_time' => null, 'category' => 'teal'],
        ['id' => 't-analityka', 'title' => 'Zdarzenia analityczne onboardingu', 'description' => null, 'column' => 'done', 'order' => 4, 'project_id' => 'prj-onboarding', 'person_id' => 'p-piotr', 'due_date' => $day(-2), 'due_time' => null, 'category' => 'blue'],
        ['id' => 't-prototyp', 'title' => 'Prototyp ekranu powitalnego', 'description' => null, 'column' => 'doing', 'order' => 0, 'project_id' => 'prj-onboarding', 'person_id' => 'p-kasia', 'due_date' => $day(0), 'due_time' => '14:00', 'category' => 'teal'],
        ['id' => 't-testy', 'title' => 'Testy z 3 użytkownikami', 'description' => null, 'column' => 'todo', 'order' => 0, 'project_id' => 'prj-onboarding', 'person_id' => null, 'due_date' => $day(2), 'due_time' => '10:00', 'category' => 'green'],
        ['id' => 't-budzet', 'title' => 'Follow-up: budżet od Anny', 'description' => null, 'column' => 'todo', 'order' => 1, 'project_id' => 'prj-onboarding', 'person_id' => 'p-anna', 'due_date' => $day(4), 'due_time' => null, 'category' => 'orange'],
        ['id' => 't-handoff', 'title' => 'Handoff prototypu do wyceny', 'description' => null, 'column' => 'todo', 'order' => 2, 'project_id' => 'prj-onboarding', 'person_id' => null, 'due_date' => $day(6), 'due_time' => null, 'category' => 'teal'],
        ['id' => 't-eksport', 'title' => 'Skrypt eksportu historii notatek', 'description' => null, 'column' => 'doing', 'order' => 1, 'project_id' => 'prj-crm', 'person_id' => 'p-piotr', 'due_date' => $day(0), 'due_time' => '16:30', 'category' => 'blue'],
        ['id' => 't-mapowanie', 'title' => 'Mapowanie pól kontaktów', 'description' => null, 'column' => 'done', 'order' => 5, 'project_id' => 'prj-crm', 'person_id' => null, 'due_date' => $day(-4), 'due_time' => null, 'category' => 'blue'],
        ['id' => 't-dostepy', 'title' => 'Dostępy do starej bazy', 'description' => null, 'column' => 'done', 'order' => 6, 'project_id' => 'prj-crm', 'person_id' => 'p-tomek', 'due_date' => $day(-7), 'due_time' => null, 'category' => 'blue'],
        ['id' => 't-import-test', 'title' => 'Testowy import na staging', 'description' => null, 'column' => 'done', 'order' => 7, 'project_id' => 'prj-crm', 'person_id' => null, 'due_date' => $day(-1), 'due_time' => null, 'category' => 'blue'],
        ['id' => 't-przelaczenie', 'title' => 'Przełączenie produkcji na nowy CRM', 'description' => null, 'column' => 'todo', 'order' => 3, 'project_id' => 'prj-crm', 'person_id' => null, 'due_date' => $day(7), 'due_time' => null, 'category' => 'orange'],
        ['id' => 't-moodboard', 'title' => 'Feedback do moodboardu', 'description' => null, 'column' => 'done', 'order' => 8, 'project_id' => 'prj-rebranding', 'person_id' => 'p-ola', 'due_date' => $day(-1), 'due_time' => null, 'category' => 'purple'],
        ['id' => 't-logo', 'title' => 'Szkice logo — 3 kierunki', 'description' => null, 'column' => 'doing', 'order' => 2, 'project_id' => 'prj-rebranding', 'person_id' => 'p-kasia', 'due_date' => $day(1), 'due_time' => '12:00', 'category' => 'purple'],
        ['id' => 't-drukarnia', 'title' => 'Wycena z drukarni od Marka', 'description' => null, 'column' => 'todo', 'order' => 4, 'project_id' => 'prj-rebranding', 'person_id' => 'p-marek', 'due_date' => $day(-2), 'due_time' => null, 'category' => 'purple'],
        ['id' => 't-ksiegowa', 'title' => 'Wysłać faktury do księgowej', 'description' => null, 'column' => 'todo', 'order' => 5, 'project_id' => null, 'person_id' => null, 'due_date' => $day(0), 'due_time' => '18:00', 'category' => 'green'],
        ['id' => 't-przeglad', 'title' => 'Tygodniowy przegląd notatek', 'description' => null, 'column' => 'todo', 'order' => 6, 'project_id' => null, 'person_id' => null, 'due_date' => $day(3), 'due_time' => null, 'category' => 'teal'],
    ];

    $jsonFlags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

    $pdo->beginTransaction();

    try {
        $stPt = $pdo->prepare('INSERT INTO person_types (id, name, color, fields_json) VALUES (?, ?, ?, ?)');
        foreach ($personTypes as $pt) {
            $stPt->execute([
                $pt['id'],
                $pt['name'],
                $pt['color'],
                json_encode($pt['fields'], $jsonFlags),
            ]);
        }

        $stPeople = $pdo->prepare('INSERT INTO people (id, name, phone, email, type_id, values_json) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($people as $p) {
            $stPeople->execute([
                $p['id'],
                $p['name'],
                $p['phone'],
                $p['email'],
                $p['type_id'],
                json_encode($p['values'], $jsonFlags),
            ]);
        }

        $stProj = $pdo->prepare('INSERT INTO projects (id, name, status, importance, tags_json, blocked_reason, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        foreach ($projects as $pr) {
            $stProj->execute([
                $pr['id'],
                $pr['name'],
                $pr['status'],
                $pr['importance'],
                json_encode($pr['tags'], $jsonFlags),
                $pr['blocked_reason'],
                $pr['icon'],
                $pr['created_at'],
            ]);
        }

        $stNote = $pdo->prepare('INSERT INTO notes (id, kind, title, body, link_url, link_desc, attachment_label, project_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stMention = $pdo->prepare('INSERT INTO note_mentions (note_id, person_id) VALUES (?, ?)');
        $noteMentionCount = 0;
        foreach ($notes as $n) {
            $stNote->execute([
                $n['id'],
                $n['kind'],
                $n['title'],
                $n['body'],
                $n['link_url'],
                $n['link_desc'],
                $n['attachment_label'],
                $n['project_id'],
                $n['created_at'],
                $n['updated_at'],
            ]);
            foreach ($n['mentioned'] as $pid) {
                $stMention->execute([$n['id'], $pid]);
                $noteMentionCount++;
            }
        }

        $stTask = $pdo->prepare('INSERT INTO tasks (id, title, description, due_date, due_time, category, board_column, sort_order, person_id, project_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        foreach ($tasks as $t) {
            $stTask->execute([
                $t['id'],
                $t['title'],
                $t['description'],
                $t['due_date'],
                $t['due_time'],
                $t['category'],
                $t['column'],
                $t['order'],
                $t['person_id'],
                $t['project_id'],
            ]);
        }

        $stPrPeople = $pdo->prepare('INSERT INTO project_people (project_id, person_id) VALUES (?, ?)');
        $projectPeopleCount = 0;
        foreach ($projects as $pr) {
            foreach ($pr['people_ids'] as $pid) {
                $stPrPeople->execute([$pr['id'], $pid]);
                $projectPeopleCount++;
            }
        }

        $pdo->commit();

        return [
            'person_types'   => (int) $pdo->query('SELECT COUNT(*) FROM person_types')->fetchColumn(),
            'people'         => (int) $pdo->query('SELECT COUNT(*) FROM people')->fetchColumn(),
            'projects'       => (int) $pdo->query('SELECT COUNT(*) FROM projects')->fetchColumn(),
            'notes'          => (int) $pdo->query('SELECT COUNT(*) FROM notes')->fetchColumn(),
            'tasks'          => (int) $pdo->query('SELECT COUNT(*) FROM tasks')->fetchColumn(),
            'note_mentions'  => (int) $pdo->query('SELECT COUNT(*) FROM note_mentions')->fetchColumn(),
            'project_people' => (int) $pdo->query('SELECT COUNT(*) FROM project_people')->fetchColumn(),
        ];
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

// --- ENTRY POINT CLI ---
if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $pdo = db();
    ensureSchema($pdo);

    $count = (int) $pdo->query('SELECT COUNT(*) FROM person_types')->fetchColumn();
    if ($count > 0) {
        fwrite(STDERR, "Baza już zaseedowana, pomijam.\n");
        exit(1);
    }

    try {
        $counts = runSeed($pdo);
        echo "Zaseedowano:\n";
        foreach ($counts as $table => $c) {
            echo "  $table: $c\n";
        }
    } catch (Throwable $e) {
        fwrite(STDERR, 'Błąd seedowania: ' . $e->getMessage() . "\n");
        exit(2);
    }
}