-- Schemat bazy danych aplikacji Notatnik.
-- Wspólny dla MySQL/MariaDB (Hostinger) i SQLite (dev lokalnie).
-- Bez ENUM, ENGINE, CHARSET, ON UPDATE CURRENT_TIMESTAMP — kompatybilne z oboma silnikami.

CREATE TABLE IF NOT EXISTS person_types (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(16) NULL,
    fields_json LONGTEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS people (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NULL,
    email VARCHAR(255) NULL,
    type_id VARCHAR(64) NOT NULL,
    values_json LONGTEXT NOT NULL,
    FOREIGN KEY (type_id) REFERENCES person_types(id)
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(16) NOT NULL,
    importance VARCHAR(16) NOT NULL,
    tags_json LONGTEXT NOT NULL,
    blocked_reason TEXT NULL,
    icon VARCHAR(16) NOT NULL,
    created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    kind VARCHAR(10) NOT NULL,
    title VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    link_url TEXT NULL,
    link_desc VARCHAR(500) NULL,
    attachment_label VARCHAR(255) NULL,
    project_id VARCHAR(64) NULL,
    created_at VARCHAR(32) NOT NULL,
    updated_at VARCHAR(32) NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NULL,
    due_date CHAR(10) NULL,
    due_time CHAR(5) NULL,
    category VARCHAR(10) NULL,
    board_column VARCHAR(10) NOT NULL,
    sort_order INT NOT NULL,
    person_id VARCHAR(64) NULL,
    project_id VARCHAR(64) NULL,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS note_mentions (
    note_id VARCHAR(64) NOT NULL,
    person_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (note_id, person_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_people (
    project_id VARCHAR(64) NOT NULL,
    person_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (project_id, person_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);