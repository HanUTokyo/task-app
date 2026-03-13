package com.taskapp.backend.service;

import com.taskapp.backend.dto.PhaseRequest;
import com.taskapp.backend.dto.PhaseResponse;
import com.taskapp.backend.dto.TaskCreateRequest;
import com.taskapp.backend.dto.TaskNoteCreateRequest;
import com.taskapp.backend.dto.TaskNoteResponse;
import com.taskapp.backend.dto.TaskResponse;
import com.taskapp.backend.dto.TaskUpdateRequest;
import com.taskapp.backend.exception.TaskNotFoundException;
import com.taskapp.backend.model.PhaseStatus;
import com.taskapp.backend.model.ProjectPriority;
import com.taskapp.backend.model.Task;
import com.taskapp.backend.model.TaskKnowledge;
import com.taskapp.backend.model.TaskNote;
import com.taskapp.backend.model.TaskPhase;
import com.taskapp.backend.repository.TaskKnowledgeRepository;
import com.taskapp.backend.repository.TaskNoteRepository;
import com.taskapp.backend.repository.TaskPhaseRepository;
import com.taskapp.backend.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class TaskService {

    private static final int DEFAULT_PHASE_COUNT = 3;

    private final TaskRepository taskRepository;
    private final TaskPhaseRepository taskPhaseRepository;
    private final TaskKnowledgeRepository taskKnowledgeRepository;
    private final TaskNoteRepository taskNoteRepository;

    public TaskService(
            TaskRepository taskRepository,
            TaskPhaseRepository taskPhaseRepository,
            TaskKnowledgeRepository taskKnowledgeRepository,
            TaskNoteRepository taskNoteRepository
    ) {
        this.taskRepository = taskRepository;
        this.taskPhaseRepository = taskPhaseRepository;
        this.taskKnowledgeRepository = taskKnowledgeRepository;
        this.taskNoteRepository = taskNoteRepository;
    }

    public List<TaskResponse> getAllTasks(String keyword, String sortBy, String order) {
        List<Task> tasks = taskRepository.findAll(keyword, sortBy, order);
        List<Long> taskIds = tasks.stream().map(Task::getId).toList();
        Map<Long, List<TaskPhase>> phaseMap = taskPhaseRepository.findByTaskIds(taskIds);
        Map<Long, TaskKnowledge> knowledgeMap = taskKnowledgeRepository.findByTaskIds(taskIds);
        Map<Long, List<TaskNote>> noteMap = taskNoteRepository.findByTaskIds(taskIds);

        return tasks.stream()
                .map(task -> {
                    List<TaskPhase> phases = phaseMap.get(task.getId());
                    if (phases == null || phases.isEmpty()) {
                        phases = backfillLegacyPhases(task);
                    }
                    return toResponse(task, phases, knowledgeMap.get(task.getId()), noteMap.get(task.getId()));
                })
                .toList();
    }

    public TaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));

        List<TaskPhase> phases = taskPhaseRepository.findByTaskId(id);
        if (phases.isEmpty()) {
            phases = backfillLegacyPhases(task);
        }
        TaskKnowledge knowledge = taskKnowledgeRepository.findByTaskId(id).orElse(null);
        List<TaskNote> notes = taskNoteRepository.findByTaskId(id);
        return toResponse(task, phases, knowledge, notes);
    }

    public TaskResponse createTask(TaskCreateRequest request) {
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        List<TaskPhase> normalizedPhases = normalizePhases(request.getPhases());

        Task task = new Task();
        task.setTaskTitle(request.getTaskTitle().trim());
        task.setTaskDescription(normalizeDescription(request.getTaskDescription()));
        task.setPriority(resolvePriority(request.getPriority()));
        applyLegacyPhaseColumns(task, normalizedPhases);
        task.setOverallProgress(calculateOverallProgress(normalizedPhases));
        task.setCreatedAt(now);
        task.setUpdatedAt(now);

        Task savedTask = taskRepository.save(task);
        taskPhaseRepository.insertAll(savedTask.getId(), normalizedPhases, now);
        taskKnowledgeRepository.upsert(
                savedTask.getId(),
                request.getRecentDecisions(),
                request.getRecentExperiments(),
                request.getKnowledgeHighlights(),
                now
        );

        List<TaskPhase> savedPhases = taskPhaseRepository.findByTaskId(savedTask.getId());
        TaskKnowledge knowledge = taskKnowledgeRepository.findByTaskId(savedTask.getId()).orElse(null);
        List<TaskNote> notes = taskNoteRepository.findByTaskId(savedTask.getId());
        return toResponse(savedTask, savedPhases, knowledge, notes);
    }

    public TaskResponse updateTask(Long id, TaskUpdateRequest request) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));

        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        List<TaskPhase> normalizedPhases = normalizePhases(request.getPhases());

        existingTask.setTaskTitle(request.getTaskTitle().trim());
        existingTask.setTaskDescription(normalizeDescription(request.getTaskDescription()));
        existingTask.setPriority(resolvePriority(request.getPriority()));
        applyLegacyPhaseColumns(existingTask, normalizedPhases);
        existingTask.setOverallProgress(calculateOverallProgress(normalizedPhases));
        existingTask.setUpdatedAt(now);

        Task updatedTask = taskRepository.update(existingTask);
        taskPhaseRepository.replaceAll(id, normalizedPhases, now);
        taskKnowledgeRepository.upsert(
                id,
                request.getRecentDecisions(),
                request.getRecentExperiments(),
                request.getKnowledgeHighlights(),
                now
        );

        List<TaskPhase> savedPhases = taskPhaseRepository.findByTaskId(id);
        TaskKnowledge knowledge = taskKnowledgeRepository.findByTaskId(id).orElse(null);
        List<TaskNote> notes = taskNoteRepository.findByTaskId(id);
        return toResponse(updatedTask, savedPhases, knowledge, notes);
    }

    public void deleteTask(Long id) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException(id));

        taskRepository.deleteById(existingTask.getId());
    }

    public TaskNoteResponse addTaskNote(Long taskId, TaskNoteCreateRequest request) {
        Task existingTask = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException(taskId));

        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        TaskNote saved = taskNoteRepository.save(
                existingTask.getId(),
                request.getNoteType(),
                request.getNoteContent(),
                now
        );
        return toNoteResponse(saved);
    }

    private List<TaskPhase> normalizePhases(List<PhaseRequest> phaseRequests) {
        List<TaskPhase> phases = new ArrayList<>();

        if (phaseRequests != null) {
            for (PhaseRequest request : phaseRequests) {
                if (request == null) {
                    continue;
                }

                String phaseName = request.getPhaseName() == null ? "" : request.getPhaseName().trim();
                if (phaseName.isEmpty()) {
                    continue;
                }

                TaskPhase phase = new TaskPhase();
                phase.setPhaseName(phaseName);
                phase.setPhaseDescription(normalizePhaseDescription(request.getPhaseDescription()));
                phase.setPhaseStatus(request.getPhaseStatus() == null ? PhaseStatus.TODO : request.getPhaseStatus());
                phases.add(phase);
            }
        }

        while (phases.size() < DEFAULT_PHASE_COUNT) {
            int index = phases.size() + 1;
            TaskPhase phase = new TaskPhase();
            phase.setPhaseName("阶段" + index);
            phase.setPhaseDescription(null);
            phase.setPhaseStatus(PhaseStatus.TODO);
            phases.add(phase);
        }

        for (int i = 0; i < phases.size(); i++) {
            phases.get(i).setSortOrder(i + 1);
        }

        return phases;
    }

    private void applyLegacyPhaseColumns(Task task, List<TaskPhase> phases) {
        task.setPhase1Status(getPhaseStatusOrDefault(phases, 0));
        task.setPhase2Status(getPhaseStatusOrDefault(phases, 1));
        task.setPhase3Status(getPhaseStatusOrDefault(phases, 2));
    }

    private PhaseStatus getPhaseStatusOrDefault(List<TaskPhase> phases, int index) {
        if (index >= phases.size()) {
            return PhaseStatus.TODO;
        }
        return phases.get(index).getPhaseStatus();
    }

    private double calculateOverallProgress(List<TaskPhase> phases) {
        if (phases == null || phases.isEmpty()) {
            return 0.0;
        }

        double total = phases.stream()
                .mapToInt(phase -> phase.getPhaseStatus().getScore())
                .sum();

        double raw = total / phases.size();
        return BigDecimal.valueOf(raw)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private TaskResponse toResponse(Task task, List<TaskPhase> phases, TaskKnowledge knowledge, List<TaskNote> notes) {
        TaskResponse response = new TaskResponse();
        response.setId(task.getId());
        response.setTaskTitle(task.getTaskTitle());
        response.setTaskDescription(task.getTaskDescription());
        response.setRecentDecisions(knowledge == null ? null : knowledge.getRecentDecisions());
        response.setRecentExperiments(knowledge == null ? null : knowledge.getRecentExperiments());
        response.setKnowledgeHighlights(knowledge == null ? null : knowledge.getKnowledgeHighlights());
        response.setPriority(task.getPriority() == null ? ProjectPriority.MEDIUM.name() : task.getPriority().name());
        response.setPhases(phases.stream().map(this::toPhaseResponse).toList());
        response.setNotes((notes == null ? List.<TaskNote>of() : notes).stream().map(this::toNoteResponse).toList());
        response.setOverallProgress(task.getOverallProgress());
        response.setCreatedAt(task.getCreatedAt());
        response.setUpdatedAt(task.getUpdatedAt());
        return response;
    }

    private PhaseResponse toPhaseResponse(TaskPhase phase) {
        PhaseResponse response = new PhaseResponse();
        response.setId(phase.getId());
        response.setPhaseName(phase.getPhaseName());
        response.setPhaseDescription(phase.getPhaseDescription());
        response.setPhaseStatus(phase.getPhaseStatus());
        response.setSortOrder(phase.getSortOrder());
        return response;
    }

    private TaskNoteResponse toNoteResponse(TaskNote note) {
        TaskNoteResponse response = new TaskNoteResponse();
        response.setId(note.getId());
        response.setNoteType(note.getNoteType());
        response.setNoteContent(note.getNoteContent());
        response.setCreatedAt(note.getCreatedAt());
        response.setUpdatedAt(note.getUpdatedAt());
        return response;
    }

    private List<TaskPhase> backfillLegacyPhases(Task task) {
        List<TaskPhase> phases = List.of(
                buildLegacyPhase(task.getId(), "阶段1", task.getPhase1Status(), 1),
                buildLegacyPhase(task.getId(), "阶段2", task.getPhase2Status(), 2),
                buildLegacyPhase(task.getId(), "阶段3", task.getPhase3Status(), 3)
        );

        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        taskPhaseRepository.insertAll(task.getId(), phases, now);
        return taskPhaseRepository.findByTaskId(task.getId());
    }

    private TaskPhase buildLegacyPhase(Long taskId, String name, PhaseStatus status, int sortOrder) {
        TaskPhase phase = new TaskPhase();
        phase.setTaskId(taskId);
        phase.setPhaseName(name);
        phase.setPhaseDescription(null);
        phase.setPhaseStatus(status == null ? PhaseStatus.TODO : status);
        phase.setSortOrder(sortOrder);
        return phase;
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String trimmed = description.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ProjectPriority resolvePriority(ProjectPriority requestPriority) {
        if (requestPriority == null) {
            return ProjectPriority.MEDIUM;
        }
        return requestPriority;
    }

    private String normalizePhaseDescription(String description) {
        if (description == null) {
            return null;
        }
        String trimmed = description.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
