CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_title TEXT NOT NULL,
    task_description TEXT,
    phase1_status TEXT NOT NULL,
    phase2_status TEXT NOT NULL,
    phase3_status TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    overall_progress REAL NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS task_phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    phase_name TEXT NOT NULL,
    phase_description TEXT,
    phase_status TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_task_phases_task FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT uq_task_phase_sort UNIQUE(task_id, sort_order)
);

CREATE TABLE IF NOT EXISTS task_knowledge (
    task_id INTEGER PRIMARY KEY,
    recent_decisions TEXT,
    recent_experiments TEXT,
    knowledge_highlights TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_task_knowledge_task FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    note_type TEXT NOT NULL,
    note_content TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at DATETIME,
    CONSTRAINT fk_task_notes_task FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS flash_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_content TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(task_title);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_tasks_progress ON tasks(overall_progress);
CREATE INDEX IF NOT EXISTS idx_task_phases_task_id ON task_phases(task_id);
CREATE INDEX IF NOT EXISTS idx_task_knowledge_updated_at ON task_knowledge(updated_at);
CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON task_notes(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_created_at ON task_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_flash_notes_updated_at ON flash_notes(updated_at);
