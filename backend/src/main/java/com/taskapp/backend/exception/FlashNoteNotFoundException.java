package com.taskapp.backend.exception;

public class FlashNoteNotFoundException extends RuntimeException {

    public FlashNoteNotFoundException(Long noteId) {
        super("Flash note not found with id: " + noteId);
    }
}
