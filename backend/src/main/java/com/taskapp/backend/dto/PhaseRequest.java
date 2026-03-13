package com.taskapp.backend.dto;

import com.taskapp.backend.model.PhaseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class PhaseRequest {

    @NotBlank(message = "phaseName is required")
    @Size(max = 100, message = "phaseName must be at most 100 characters")
    private String phaseName;

    @Size(max = 2000, message = "phaseDescription must be at most 2000 characters")
    private String phaseDescription;

    @NotNull(message = "phaseStatus is required")
    private PhaseStatus phaseStatus;

    public String getPhaseName() {
        return phaseName;
    }

    public void setPhaseName(String phaseName) {
        this.phaseName = phaseName;
    }

    public PhaseStatus getPhaseStatus() {
        return phaseStatus;
    }

    public void setPhaseStatus(PhaseStatus phaseStatus) {
        this.phaseStatus = phaseStatus;
    }

    public String getPhaseDescription() {
        return phaseDescription;
    }

    public void setPhaseDescription(String phaseDescription) {
        this.phaseDescription = phaseDescription;
    }
}
