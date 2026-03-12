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
    updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS task_phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    phase_name TEXT NOT NULL,
    phase_status TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_task_phases_task FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT uq_task_phase_sort UNIQUE(task_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(task_title);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_tasks_progress ON tasks(overall_progress);
CREATE INDEX IF NOT EXISTS idx_task_phases_task_id ON task_phases(task_id);
