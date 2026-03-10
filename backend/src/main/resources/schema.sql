CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_title TEXT NOT NULL,
    task_description TEXT,
    phase1_status TEXT NOT NULL,
    phase2_status TEXT NOT NULL,
    phase3_status TEXT NOT NULL,
    overall_progress REAL NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(task_title);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_tasks_progress ON tasks(overall_progress);
