package com.taskapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class FlashNoteCreateRequest {

    @NotBlank(message = "noteContent is required")
    @Size(max = 20000, message = "noteContent must be at most 20000 characters")
    private String noteContent;

    public String getNoteContent() {
        return noteContent;
    }

    public void setNoteContent(String noteContent) {
        this.noteContent = noteContent;
    }
}
