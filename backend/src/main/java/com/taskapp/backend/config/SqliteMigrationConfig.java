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
}
