INSERT OR IGNORE INTO tasks (
    id,
    task_title,
    task_description,
    phase1_status,
    phase2_status,
    phase3_status,
    overall_progress,
    created_at,
    updated_at
) VALUES
    (
        1,
        'Oracle VM environment setup',
        'Prepare Linux VM, install Java 21, and verify system runtime dependencies.',
        'DONE',
        'DOING',
        'TODO',
        50.0,
        '2026-03-07T09:00:00',
        '2026-03-08T14:20:00'
    ),
    (
        2,
        'Task API integration',
        'Connect frontend fetch calls with backend REST API and align response fields.',
        'DONE',
        'DONE',
        'DOING',
        83.3,
        '2026-03-07T10:30:00',
        '2026-03-09T10:45:00'
    ),
    (
        3,
        'Regression checklist',
        'Run CRUD, search, and sorting checks before release.',
        'TODO',
        'TODO',
        'TODO',
        0.0,
        '2026-03-09T08:00:00',
        '2026-03-09T08:00:00'
    );

INSERT OR IGNORE INTO task_phases (
    task_id,
    phase_name,
    phase_status,
    sort_order,
    created_at,
    updated_at
) VALUES
    (1, '阶段1', 'DONE', 1, '2026-03-07T09:00:00', '2026-03-08T14:20:00'),
    (1, '阶段2', 'DOING', 2, '2026-03-07T09:00:00', '2026-03-08T14:20:00'),
    (1, '阶段3', 'TODO', 3, '2026-03-07T09:00:00', '2026-03-08T14:20:00'),
    (2, '阶段1', 'DONE', 1, '2026-03-07T10:30:00', '2026-03-09T10:45:00'),
    (2, '阶段2', 'DONE', 2, '2026-03-07T10:30:00', '2026-03-09T10:45:00'),
    (2, '阶段3', 'DOING', 3, '2026-03-07T10:30:00', '2026-03-09T10:45:00'),
    (3, '阶段1', 'TODO', 1, '2026-03-09T08:00:00', '2026-03-09T08:00:00'),
    (3, '阶段2', 'TODO', 2, '2026-03-09T08:00:00', '2026-03-09T08:00:00'),
    (3, '阶段3', 'TODO', 3, '2026-03-09T08:00:00', '2026-03-09T08:00:00');
