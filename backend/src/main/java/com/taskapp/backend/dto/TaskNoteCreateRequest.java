package com.taskapp.backend.dto;

import com.taskapp.backend.model.NoteType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class TaskNoteCreateRequest {

    @NotNull(message = "noteType is required")
    private NoteType noteType;

    @NotBlank(message = "noteContent is required")
    @Size(max = 20000, message = "noteContent must be at most 20000 characters")
    private String noteContent;

    public NoteType getNoteType() {
        return noteType;
    }

    public void setNoteType(NoteType noteType) {
        this.noteType = noteType;
    }

    public String getNoteContent() {
        return noteContent;
    }

    public void setNoteContent(String noteContent) {
        this.noteContent = noteContent;
    }
}
