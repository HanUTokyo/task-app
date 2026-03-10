package com.taskapp.backend.service;

import com.taskapp.backend.dto.TaskCreateRequest;
import com.taskapp.backend.dto.TaskResponse;
import com.taskapp.backend.dto.TaskUpdateRequest;
import com.taskapp.backend.exception.TaskNotFoundException;
import com.taskapp.backend.model.PhaseStatus;
import com.taskapp.backend.model.Task;
import com.taskapp.backend.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<TaskResponse> getAllTasks(String keyword, String sortBy, String order) {
        return taskRepository.findAll(keyword, sortBy, order)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));
        return toResponse(task);
    }

    public TaskResponse createTask(TaskCreateRequest request) {
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);

        PhaseStatus phase1Status = request.getPhase1Status();
        PhaseStatus phase2Status = request.getPhase2Status();
        PhaseStatus phase3Status = request.getPhase3Status();

        Task task = new Task();
        task.setTaskTitle(request.getTaskTitle().trim());
        task.setTaskDescription(normalizeDescription(request.getTaskDescription()));
        task.setPhase1Status(phase1Status);
        task.setPhase2Status(phase2Status);
        task.setPhase3Status(phase3Status);
        task.setOverallProgress(calculateOverallProgress(phase1Status, phase2Status, phase3Status));
        task.setCreatedAt(now);
        task.setUpdatedAt(now);

        Task savedTask = taskRepository.save(task);
        return toResponse(savedTask);
    }

    public TaskResponse updateTask(Long id, TaskUpdateRequest request) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));

        existingTask.setTaskTitle(request.getTaskTitle().trim());
        existingTask.setTaskDescription(normalizeDescription(request.getTaskDescription()));
        existingTask.setPhase1Status(request.getPhase1Status());
        existingTask.setPhase2Status(request.getPhase2Status());
        existingTask.setPhase3Status(request.getPhase3Status());
        existingTask.setOverallProgress(calculateOverallProgress(
                request.getPhase1Status(),
                request.getPhase2Status(),
                request.getPhase3Status()
        ));
        existingTask.setUpdatedAt(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));

        Task updatedTask = taskRepository.update(existingTask);
        return toResponse(updatedTask);
    }

    public void deleteTask(Long id) {
        boolean deleted = taskRepository.deleteById(id);
        if (!deleted) {
            throw new TaskNotFoundException(id);
        }
    }

    private double calculateOverallProgress(PhaseStatus phase1Status, PhaseStatus phase2Status, PhaseStatus phase3Status) {
        double raw = (phase1Status.getScore() + phase2Status.getScore() + phase3Status.getScore()) / 3.0;
        return BigDecimal.valueOf(raw)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private TaskResponse toResponse(Task task) {
        TaskResponse response = new TaskResponse();
        response.setId(task.getId());
        response.setTaskTitle(task.getTaskTitle());
        response.setTaskDescription(task.getTaskDescription());
        response.setPhase1Status(task.getPhase1Status());
        response.setPhase2Status(task.getPhase2Status());
        response.setPhase3Status(task.getPhase3Status());
        response.setOverallProgress(task.getOverallProgress());
        response.setCreatedAt(task.getCreatedAt());
        response.setUpdatedAt(task.getUpdatedAt());
        return response;
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String trimmed = description.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
