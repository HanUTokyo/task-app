package com.taskapp.backend.model;

public enum PhaseStatus {
    TODO(0),
    DOING(50),
    DONE(100);

    private final int score;

    PhaseStatus(int score) {
        this.score = score;
    }

    public int getScore() {
        return score;
    }
}
