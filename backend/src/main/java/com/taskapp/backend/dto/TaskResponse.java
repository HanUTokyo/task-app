package com.taskapp.backend.dto;

import com.taskapp.backend.model.PhaseStatus;

import java.time.LocalDateTime;

public class TaskResponse {

    private Long id;
    private String taskTitle;
    private String taskDescription;
    private PhaseStatus phase1Status;
    private PhaseStatus phase2Status;
    private PhaseStatus phase3Status;
    private double overallProgress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public double getOverallProgress() {
        return overallProgress;
    }

    public void setOverallProgress(double overallProgress) {
        this.overallProgress = overallProgress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
