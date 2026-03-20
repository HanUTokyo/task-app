package com.taskapp.backend.exception;

public class TaskNoteNotFoundException extends RuntimeException {

    public TaskNoteNotFoundException(Long taskId, Long noteId) {
        super("Task note not found with id: " + noteId + " for task id: " + taskId);
    }
}
