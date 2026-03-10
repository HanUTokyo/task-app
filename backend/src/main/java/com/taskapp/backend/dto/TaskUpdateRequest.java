package com.taskapp.backend.dto;

import com.taskapp.backend.model.PhaseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class TaskUpdateRequest {

    @NotBlank(message = "taskTitle is required")
    @Size(max = 200, message = "taskTitle must be at most 200 characters")
    private String taskTitle;

    @Size(max = 2000, message = "taskDescription must be at most 2000 characters")
    private String taskDescription;

    @NotNull(message = "phase1Status is required")
    private PhaseStatus phase1Status;

    @NotNull(message = "phase2Status is required")
    private PhaseStatus phase2Status;

    @NotNull(message = "phase3Status is required")
    private PhaseStatus phase3Status;

    public String getTaskTitle() {
        return taskTitle;
    }

    public void setTaskTitle(String taskTitle) {
        this.taskTitle = taskTitle;
    }

    public String getTaskDescription() {
        return taskDescription;
    }

    public void setTaskDescription(String taskDescription) {
        this.taskDescription = taskDescription;
    }

    public PhaseStatus getPhase1Status() {
        return phase1Status;
    }

    public void setPhase1Status(PhaseStatus phase1Status) {
        this.phase1Status = phase1Status;
    }

    public PhaseStatus getPhase2Status() {
        return phase2Status;
    }

    public void setPhase2Status(PhaseStatus phase2Status) {
        this.phase2Status = phase2Status;
    }

    public PhaseStatus getPhase3Status() {
        return phase3Status;
    }

    public void setPhase3Status(PhaseStatus phase3Status) {
        this.phase3Status = phase3Status;
    }
}
