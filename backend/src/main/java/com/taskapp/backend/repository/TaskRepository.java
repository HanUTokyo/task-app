package com.taskapp.backend.repository;

import com.taskapp.backend.model.PhaseStatus;
import com.taskapp.backend.model.ProjectPriority;
import com.taskapp.backend.model.Task;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Repository
public class TaskRepository {

    private static final DateTimeFormatter DB_DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Task> taskRowMapper = (rs, rowNum) -> {
        Task task = new Task();
        task.setId(rs.getLong("id"));
        task.setTaskTitle(rs.getString("task_title"));
        task.setTaskDescription(rs.getString("task_description"));
        task.setPhase1Status(PhaseStatus.valueOf(rs.getString("phase1_status")));
        task.setPhase2Status(PhaseStatus.valueOf(rs.getString("phase2_status")));
        task.setPhase3Status(PhaseStatus.valueOf(rs.getString("phase3_status")));
        task.setPriority(parsePriority(rs.getString("priority")));
        task.setOverallProgress(rs.getDouble("overall_progress"));
        task.setCreatedAt(parseDateTime(rs.getString("created_at")));
        task.setUpdatedAt(parseDateTime(rs.getString("updated_at")));
        return task;
    };

    public TaskRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Task> findAll(String keyword, String sortBy, String order) {
        StringBuilder sql = new StringBuilder("""
                SELECT id, task_title, task_description, phase1_status, phase2_status, phase3_status,
                       priority, overall_progress, created_at, updated_at
                FROM tasks
                """);

        List<Object> params = new ArrayList<>();
        if (keyword != null && !keyword.isBlank()) {
            sql.append(" WHERE LOWER(task_title) LIKE ?");
            params.add("%" + keyword.trim().toLowerCase(Locale.ROOT) + "%");
        }

        sql.append(" ORDER BY ").append(resolveSortColumn(sortBy)).append(" ").append(resolveSortDirection(order));
        return jdbcTemplate.query(sql.toString(), taskRowMapper, params.toArray());
    }

    public Optional<Task> findById(Long id) {
        String sql = """
                SELECT id, task_title, task_description, phase1_status, phase2_status, phase3_status,
                       priority, overall_progress, created_at, updated_at
                FROM tasks
                WHERE id = ?
                """;
        List<Task> tasks = jdbcTemplate.query(sql, taskRowMapper, id);
        return tasks.stream().findFirst();
    }

    public Task save(Task task) {
        String sql = """
                INSERT INTO tasks (
                    task_title, task_description, phase1_status, phase2_status, phase3_status,
                    priority, overall_progress, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, task.getTaskTitle());
            ps.setString(2, task.getTaskDescription());
            ps.setString(3, task.getPhase1Status().name());
            ps.setString(4, task.getPhase2Status().name());
            ps.setString(5, task.getPhase3Status().name());
            ps.setString(6, task.getPriority().name());
            ps.setDouble(7, task.getOverallProgress());
            ps.setString(8, formatDateTime(task.getCreatedAt()));
            ps.setString(9, formatDateTime(task.getUpdatedAt()));
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            task.setId(keyHolder.getKey().longValue());
        }
        return task;
    }

    public Task update(Task task) {
        String sql = """
                UPDATE tasks
                SET task_title = ?,
                    task_description = ?,
                    phase1_status = ?,
                    phase2_status = ?,
                    phase3_status = ?,
                    priority = ?,
                    overall_progress = ?,
                    updated_at = ?
                WHERE id = ?
                """;

        jdbcTemplate.update(
                sql,
                task.getTaskTitle(),
                task.getTaskDescription(),
                task.getPhase1Status().name(),
                task.getPhase2Status().name(),
                task.getPhase3Status().name(),
                task.getPriority().name(),
                task.getOverallProgress(),
                formatDateTime(task.getUpdatedAt()),
                task.getId()
        );

        return task;
    }

    public boolean deleteById(Long id) {
        int affectedRows = jdbcTemplate.update("DELETE FROM tasks WHERE id = ?", id);
        return affectedRows > 0;
    }

    private String resolveSortColumn(String sortBy) {
        if ("overallProgress".equalsIgnoreCase(sortBy)) {
            return "overall_progress";
        }
        if ("priority".equalsIgnoreCase(sortBy)) {
            return "CASE priority WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 1 ELSE 0 END";
        }
        if ("createdAt".equalsIgnoreCase(sortBy)) {
            return "created_at";
        }
        if ("taskTitle".equalsIgnoreCase(sortBy)) {
            return "task_title";
        }
        return "CASE priority WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 1 ELSE 0 END";
    }

    private String resolveSortDirection(String order) {
        return "asc".equalsIgnoreCase(order) ? "ASC" : "DESC";
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime.truncatedTo(ChronoUnit.SECONDS).format(DB_DATE_TIME_FORMATTER);
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value, DB_DATE_TIME_FORMATTER);
        } catch (DateTimeParseException ex) {
            return LocalDateTime.parse(value);
        }
    }

    private ProjectPriority parsePriority(String value) {
        if (value == null || value.isBlank()) {
            return ProjectPriority.MEDIUM;
        }

        try {
            return ProjectPriority.valueOf(value);
        } catch (IllegalArgumentException ex) {
            return ProjectPriority.MEDIUM;
        }
    }
}
