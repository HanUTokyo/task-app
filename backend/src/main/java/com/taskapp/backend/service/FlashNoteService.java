package com.taskapp.backend.service;

import com.taskapp.backend.dto.FlashNoteCreateRequest;
import com.taskapp.backend.dto.FlashNoteResponse;
import com.taskapp.backend.exception.FlashNoteNotFoundException;
import com.taskapp.backend.model.FlashNote;
import com.taskapp.backend.repository.FlashNoteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class FlashNoteService {

    private final FlashNoteRepository flashNoteRepository;

    public FlashNoteService(FlashNoteRepository flashNoteRepository) {
        this.flashNoteRepository = flashNoteRepository;
    }

    public List<FlashNoteResponse> getAllFlashNotes() {
        return flashNoteRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public FlashNoteResponse createFlashNote(FlashNoteCreateRequest request) {
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        FlashNote saved = flashNoteRepository.save(request.getNoteContent(), now);
        return toResponse(saved);
    }

    public FlashNoteResponse updateFlashNote(Long noteId, FlashNoteCreateRequest request) {
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        FlashNote updated = flashNoteRepository.update(noteId, request.getNoteContent(), now);
        if (updated == null) {
            throw new FlashNoteNotFoundException(noteId);
        }
        return toResponse(updated);
    }

    public void deleteFlashNote(Long noteId) {
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
        boolean deleted = flashNoteRepository.softDelete(noteId, now);
        if (!deleted) {
            throw new FlashNoteNotFoundException(noteId);
        }
    }

    private FlashNoteResponse toResponse(FlashNote note) {
        FlashNoteResponse response = new FlashNoteResponse();
        response.setId(note.getId());
        response.setNoteContent(note.getNoteContent());
        response.setCreatedAt(note.getCreatedAt());
        response.setUpdatedAt(note.getUpdatedAt());
        return response;
    }
}
