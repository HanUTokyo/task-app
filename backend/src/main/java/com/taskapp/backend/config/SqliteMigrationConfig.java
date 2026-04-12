package com.taskapp.backend.config;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class SqliteMigrationConfig {

    private final JdbcTemplate jdbcTemplate;

    public SqliteMigrationConfig(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        ensurePriorityColumn();
        ensureSoftDeleteColumns();
        ensurePhaseDescriptionColumn();
        ensureKnowledgeTable();
        ensureTaskNotesTable();
        ensureFlashNotesTable();
        ensureTaskNotesSoftDeleteColumns();
        ensureFlashNotesSoftDeleteColumns();
    }

    private void ensurePriorityColumn() {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList("PRAGMA table_info(tasks)");
        boolean hasPriority = columns.stream()
                .map(column -> String.valueOf(column.get("name")))
                .anyMatch(name -> "priority".equalsIgnoreCase(name));

        if (!hasPriority) {
            jdbcTemplate.execute("ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'MEDIUM'");
        }

        jdbcTemplate.update("UPDATE tasks SET priority = 'MEDIUM' WHERE priority IS NULL OR TRIM(priority) = ''");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)");
    }

    private void ensureKnowledgeTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS task_knowledge (
                    task_id INTEGER PRIMARY KEY,
                    recent_decisions TEXT,
                    recent_experiments TEXT,
                    knowledge_highlights TEXT,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    CONSTRAINT fk_task_knowledge_task FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_task_knowledge_updated_at ON task_knowledge(updated_at)");
    }

    private void ensureSoftDeleteColumns() {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList("PRAGMA table_info(tasks)");

        boolean hasIsDeleted = columns.stream()
                .map(column -> String.valueOf(column.get("name")))
                .anyMatch(name -> "is_deleted".equalsIgnoreCase(name));
        if (!hasIsDeleted) {
            jdbcTemplate.execute("ALTER TABLE tasks ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0");
        }

        boolean hasDeletedAt = columns.stream()
                .map(column -> String.valueOf(column.get("name")))
                .anyMatch(name -> "deleted_at".equalsIgnoreCase(name));
        if (!hasDeletedAt) {
            jdbcTemplate.execute("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME");
        }

        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_tasks_is_deleted ON tasks(is_deleted)");
    }

    private void ensurePhaseDescriptionColumn() {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList("PRAGMA table_info(task_phases)");
        boolean hasPhaseDescription = columns.stream()
                .map(column -> String.valueOf(column.get("name")))
                .anyMatch(name -> "phase_description".equalsIgnoreCase(name));

        if (!hasPhaseDescription) {
            jdbcTemplate.execute("ALTER TABLE task_phases ADD COLUMN phase_description TEXT");
        }
    }

    private void ensureTaskNotesTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS task_notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id INTEGER NOT NULL,
                    note_type TEXT NOT NULL,
                    note_content TEXT NOT NULL,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    CONSTRAINT fk_task_notes_task FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON task_notes(task_id)");
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_task_notes_created_at ON task_notes(created_at)");
    }

    private void ensureFlashNotesTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS flash_notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    note_content TEXT NOT NULL,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL
                )
                """);
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_flash_notes_updated_at ON flash_notes(updated_at)");
    }

    private void ensureTaskNotesSoftDeleteColumns() {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList("PRAGMA table_info(task_notes)");
        boolean hasIsDeleted = columns.stream()
                .map(column -> String.valueOf(column.get("name")))
                .anyMatch(name -> "is_deleted".equalsIgnoreCase(name));
        if (!hasIsDeleted) {
            jdbcTemplate.execute("ALTER TABLE task_notes ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0");
        }

        boolean hasDeletedAt = columns.stream()
                .map(column -> String.valueOf(column.get("name")))
                .anyMatch(name -> "deleted_at".equalsIgnoreCase(name));
        if (!hasDeletedAt) {
            jdbcTemplate.execute("ALTER TABLE task_notes ADD COLUMN deleted_at DATETIME");
        }

        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_task_notes_is_deleted ON task_notes(is_deleted)");
    }

    private void ensureFlashNotesSoftDeleteColumns() {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList("PRAGMA table_info(flash_notes)");
        boolean hasIsDeleted = columns.stream()
                .map(column -> String.valueOf(column.get("name")))
                .anyMatch(name -> "is_deleted".equalsIgnoreCase(name));
        if (!hasIsDeleted) {
            jdbcTemplate.execute("ALTER TABLE flash_notes ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0");
        }

        boolean hasDeletedAt = columns.stream()
                .map(column -> String.valueOf(column.get("name")))
                .anyMatch(name -> "deleted_at".equalsIgnoreCase(name));
        if (!hasDeletedAt) {
            jdbcTemplate.execute("ALTER TABLE flash_notes ADD COLUMN deleted_at DATETIME");
        }

        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_flash_notes_is_deleted ON flash_notes(is_deleted)");
    }
}
