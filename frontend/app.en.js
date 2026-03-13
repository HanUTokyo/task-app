const API_BASE_URL = window.TASK_API_BASE_URL || `${window.location.protocol}//${window.location.hostname || "localhost"}:8080/api`;
const TASKS_API_URL = `${API_BASE_URL}/tasks`;

const state = {
  keyword: "",
  sortBy: "priority",
  order: "desc"
};

let tasks = [];
let editingTaskId = null;
let lastFocusedElement = null;
let confirmResolver = null;
let searchLoading = false;
let deletingTaskId = null;
let addingPhaseTaskId = null;
let pendingAddPhaseTaskId = null;
let editingPhaseTaskId = null;
let pendingEditPhaseTaskId = null;
let pendingEditPhaseIndex = null;
let addingNoteTaskId = null;
let pendingAddNoteTaskId = null;
let currentPhases = [];
let detailTaskId = null;
const detailPreviewState = {
  recentDecisions: false,
  recentExperiments: false,
  knowledgeHighlights: false
};

const elements = {
  taskModal: document.getElementById("taskModal"),
  confirmModal: document.getElementById("confirmModal"),
  addPhaseModal: document.getElementById("addPhaseModal"),
  editPhaseModal: document.getElementById("editPhaseModal"),
  addNoteModal: document.getElementById("addNoteModal"),
  detailDrawerBackdrop: document.getElementById("detailDrawerBackdrop"),
  detailDrawer: document.getElementById("detailDrawer"),
  openTaskModalBtn: document.getElementById("openTaskModalBtn"),
  closeTaskModalBtn: document.getElementById("closeTaskModalBtn"),
  closeDetailDrawerBtn: document.getElementById("closeDetailDrawerBtn"),
  confirmMessage: document.getElementById("confirmMessage"),
  confirmOkBtn: document.getElementById("confirmOkBtn"),
  confirmCancelBtn: document.getElementById("confirmCancelBtn"),
  addPhaseForm: document.getElementById("addPhaseForm"),
  addPhaseModalTitle: document.getElementById("addPhaseModalTitle"),
  addPhaseName: document.getElementById("addPhaseName"),
  addPhaseValidation: document.getElementById("addPhaseValidation"),
  addPhaseStatus: document.getElementById("addPhaseStatus"),
  addPhaseDescription: document.getElementById("addPhaseDescription"),
  addPhaseCancelBtn: document.getElementById("addPhaseCancelBtn"),
  addPhaseConfirmBtn: document.getElementById("addPhaseConfirmBtn"),
  editPhaseForm: document.getElementById("editPhaseForm"),
  editPhaseModalTitle: document.getElementById("editPhaseModalTitle"),
  editPhaseName: document.getElementById("editPhaseName"),
  editPhaseValidation: document.getElementById("editPhaseValidation"),
  editPhaseStatus: document.getElementById("editPhaseStatus"),
  editPhaseDescription: document.getElementById("editPhaseDescription"),
  editPhaseCancelBtn: document.getElementById("editPhaseCancelBtn"),
  editPhaseConfirmBtn: document.getElementById("editPhaseConfirmBtn"),
  addNoteForm: document.getElementById("addNoteForm"),
  addNoteModalTitle: document.getElementById("addNoteModalTitle"),
  addNoteType: document.getElementById("addNoteType"),
  addNoteContent: document.getElementById("addNoteContent"),
  addNoteValidation: document.getElementById("addNoteValidation"),
  addNoteCancelBtn: document.getElementById("addNoteCancelBtn"),
  addNoteConfirmBtn: document.getElementById("addNoteConfirmBtn"),
  taskForm: document.getElementById("taskForm"),
  formTitle: document.getElementById("formTitle"),
  submitBtn: document.getElementById("submitBtn"),
  resetBtn: document.getElementById("resetBtn"),
  addPhaseBtn: document.getElementById("addPhaseBtn"),
  phaseList: document.getElementById("phaseList"),
  searchBtn: document.getElementById("searchBtn"),
  keywordInput: document.getElementById("keywordInput"),
  sortBySelect: document.getElementById("sortBySelect"),
  orderSelect: document.getElementById("orderSelect"),
  applySortBtn: document.getElementById("applySortBtn"),
  taskTableBody: document.getElementById("taskTableBody"),
  emptyState: document.getElementById("emptyState"),
  toast: document.getElementById("toast"),
  doingCount: document.getElementById("doingCount"),
  doneCount: document.getElementById("doneCount"),
  taskTitle: document.getElementById("taskTitle"),
  taskDescription: document.getElementById("taskDescription"),
  recentDecisions: document.getElementById("recentDecisions"),
  recentExperiments: document.getElementById("recentExperiments"),
  knowledgeHighlights: document.getElementById("knowledgeHighlights"),
  taskPriority: document.getElementById("taskPriority"),
  progressRankingList: document.getElementById("progressRankingList"),
  recentUpdatedList: document.getElementById("recentUpdatedList"),
  detailDrawerTitle: document.getElementById("detailDrawerTitle"),
  detailMeta: document.getElementById("detailMeta"),
  detailProgress: document.getElementById("detailProgress"),
  detailPhases: document.getElementById("detailPhases"),
  detailRecentDecisions: document.getElementById("detailRecentDecisions"),
  detailRecentExperiments: document.getElementById("detailRecentExperiments"),
  detailKnowledgeHighlights: document.getElementById("detailKnowledgeHighlights"),
  knowledgeToggleButtons: Array.from(document.querySelectorAll(".knowledge-toggle-btn"))
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  elements.sortBySelect.value = state.sortBy;
  elements.orderSelect.value = state.order;
  bindEvents();
  resetForm();
  applySelectTone(elements.taskPriority, "priority");
  applySelectTone(elements.addPhaseStatus, "status");
  applySelectTone(elements.editPhaseStatus, "status");
  loadTasks();
}

function bindEvents() {
  elements.openTaskModalBtn.addEventListener("click", () => {
    resetForm();
    openTaskModal();
  });

  elements.closeTaskModalBtn.addEventListener("click", () => {
    closeTaskModal(true);
  });

  elements.taskModal.addEventListener("click", (event) => {
    if (event.target === elements.taskModal) {
      closeTaskModal(true);
    }
  });

  elements.confirmModal.addEventListener("click", (event) => {
    if (event.target === elements.confirmModal) {
      resolveConfirm(false);
    }
  });

  elements.confirmCancelBtn.addEventListener("click", () => {
    resolveConfirm(false);
  });

  elements.confirmOkBtn.addEventListener("click", () => {
    resolveConfirm(true);
  });

  elements.addPhaseModal.addEventListener("click", (event) => {
    if (event.target === elements.addPhaseModal) {
      closeAddPhaseModal(true);
    }
  });

  elements.addPhaseCancelBtn.addEventListener("click", () => {
    closeAddPhaseModal(true);
  });

  elements.editPhaseModal.addEventListener("click", (event) => {
    if (event.target === elements.editPhaseModal) {
      closeEditPhaseModal(true);
    }
  });

  elements.editPhaseCancelBtn.addEventListener("click", () => {
    closeEditPhaseModal(true);
  });

  elements.addNoteModal.addEventListener("click", (event) => {
    if (event.target === elements.addNoteModal) {
      closeAddNoteModal(true);
    }
  });

  elements.addNoteCancelBtn.addEventListener("click", () => {
    closeAddNoteModal(true);
  });

  elements.closeDetailDrawerBtn.addEventListener("click", () => {
    closeDetailDrawer();
  });

  elements.detailDrawerBackdrop.addEventListener("click", () => {
    closeDetailDrawer();
  });

  elements.knowledgeToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const sectionKey = button.dataset.previewSection;
      if (!sectionKey) {
        return;
      }
      toggleKnowledgePreview(sectionKey);
    });
  });

  elements.addPhaseForm.addEventListener("submit", handleAddPhaseSubmit);
  elements.addPhaseName.addEventListener("input", () => {
    validateAddPhaseForm();
  });
  elements.addPhaseStatus.addEventListener("change", () => {
    applySelectTone(elements.addPhaseStatus, "status");
  });
  elements.editPhaseForm.addEventListener("submit", handleEditPhaseSubmit);
  elements.editPhaseName.addEventListener("input", () => {
    validateEditPhaseForm();
  });
  elements.editPhaseStatus.addEventListener("change", () => {
    applySelectTone(elements.editPhaseStatus, "status");
  });
  elements.addNoteForm.addEventListener("submit", handleAddNoteSubmit);
  elements.addNoteContent.addEventListener("input", validateAddNoteForm);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (isVisible(elements.confirmModal)) {
      resolveConfirm(false);
      return;
    }

    if (isVisible(elements.addPhaseModal)) {
      closeAddPhaseModal(true);
      return;
    }

    if (isVisible(elements.editPhaseModal)) {
      closeEditPhaseModal(true);
      return;
    }

    if (isVisible(elements.addNoteModal)) {
      closeAddNoteModal(true);
      return;
    }

    if (isVisible(elements.taskModal)) {
      closeTaskModal(true);
      return;
    }

    if (isDetailDrawerVisible()) {
      closeDetailDrawer();
    }
  });

  elements.taskForm.addEventListener("submit", handleSubmit);
  elements.resetBtn.addEventListener("click", resetForm);

  elements.addPhaseBtn.addEventListener("click", () => {
    currentPhases = collectPhasesFromDom();
    currentPhases.push(createPhaseTemplate(currentPhases.length + 1));
    renderPhaseInputs();
  });

  elements.phaseList.addEventListener("click", (event) => {
    const removeBtn = event.target.closest("button[data-remove-index]");
    if (!removeBtn) {
      return;
    }

    const removeIndex = Number(removeBtn.dataset.removeIndex);
    if (Number.isNaN(removeIndex)) {
      return;
    }

    if (removeIndex < 3) {
      showToast("The first three default phases cannot be removed", true);
      return;
    }

    currentPhases = collectPhasesFromDom();
    currentPhases.splice(removeIndex, 1);
    renderPhaseInputs();
  });

  elements.phaseList.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    if (target.classList.contains("phase-status")) {
      applySelectTone(target, "status");
    }
  });

  elements.searchBtn.addEventListener("click", async () => {
    await triggerSearch();
  });

  elements.keywordInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await triggerSearch();
    }
  });

  elements.sortBySelect.addEventListener("change", () => {
    state.sortBy = elements.sortBySelect.value;
  });

  elements.orderSelect.addEventListener("change", () => {
    state.order = elements.orderSelect.value;
  });

  elements.applySortBtn.addEventListener("click", async () => {
    state.sortBy = elements.sortBySelect.value;
    state.order = elements.orderSelect.value;
    await loadTasks();
  });

  elements.taskPriority.addEventListener("change", () => {
    applySelectTone(elements.taskPriority, "priority");
  });

  elements.taskTableBody.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("button[data-action]");
    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.action;
    const taskId = Number(actionButton.dataset.id);
    if (!action || !taskId) {
      return;
    }

    if (action === "edit") {
      startEditing(taskId);
      return;
    }

    if (action === "details") {
      openDetailDrawer(taskId);
      return;
    }

    if (action === "add-phase") {
      openAddPhaseModal(taskId);
      return;
    }

    if (action === "add-note") {
      openAddNoteModal(taskId);
      return;
    }

    if (action === "edit-phase") {
      const phaseIndex = Number(actionButton.dataset.phaseIndex);
      openEditPhaseModal(taskId, phaseIndex);
      return;
    }

    if (action === "delete") {
      await removeTask(taskId);
    }
  });
}

function openTaskModal() {
  openModal(elements.taskModal, elements.taskTitle);
}

function closeTaskModal(shouldResetForm) {
  closeModal(elements.taskModal);
  if (shouldResetForm) {
    resetForm();
  }
}

function openModal(modalElement, focusTarget) {
  if (!lastFocusedElement && document.activeElement instanceof HTMLElement) {
    lastFocusedElement = document.activeElement;
  }

  modalElement.classList.remove("hidden");
  modalElement.setAttribute("aria-hidden", "false");
  updateBodyModalState();

  if (focusTarget) {
    window.setTimeout(() => focusTarget.focus(), 0);
  }
}

function closeModal(modalElement) {
  modalElement.classList.add("hidden");
  modalElement.setAttribute("aria-hidden", "true");
  updateBodyModalState();

  if (
    !isVisible(elements.taskModal) &&
    !isVisible(elements.confirmModal) &&
    !isVisible(elements.addPhaseModal) &&
    !isVisible(elements.editPhaseModal) &&
    !isVisible(elements.addNoteModal) &&
    !isDetailDrawerVisible() &&
    lastFocusedElement
  ) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

function updateBodyModalState() {
  if (
    isVisible(elements.taskModal) ||
    isVisible(elements.confirmModal) ||
    isVisible(elements.addPhaseModal) ||
    isVisible(elements.editPhaseModal) ||
    isVisible(elements.addNoteModal) ||
    isDetailDrawerVisible()
  ) {
    document.body.classList.add("modal-open");
  } else {
    document.body.classList.remove("modal-open");
  }
}

function openAddPhaseModal(taskId) {
  if (addingPhaseTaskId !== null || deletingTaskId !== null) {
    return;
  }

  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    showToast("Project not found", true);
    return;
  }

  const phases = ensureTaskPhases(task);
  pendingAddPhaseTaskId = taskId;
  elements.addPhaseModalTitle.textContent = `Add phase for project "${task.taskTitle}"`;
  elements.addPhaseName.value = `Phase ${phases.length + 1}`;
  elements.addPhaseStatus.value = "TODO";
  elements.addPhaseDescription.value = "";
  applySelectTone(elements.addPhaseStatus, "status");
  validateAddPhaseForm();
  openModal(elements.addPhaseModal, elements.addPhaseName);
}

function closeAddPhaseModal(shouldReset) {
  closeModal(elements.addPhaseModal);
  if (shouldReset) {
    resetAddPhaseForm();
  }
}

function resetAddPhaseForm() {
  pendingAddPhaseTaskId = null;
  elements.addPhaseModalTitle.textContent = "Add Phase";
  elements.addPhaseForm.reset();
  elements.addPhaseStatus.value = "TODO";
  elements.addPhaseDescription.value = "";
  applySelectTone(elements.addPhaseStatus, "status");
  setAddPhaseValidation("", true);
}

function openEditPhaseModal(taskId, phaseIndex) {
  if (addingPhaseTaskId !== null || deletingTaskId !== null || editingPhaseTaskId !== null) {
    return;
  }

  if (Number.isNaN(phaseIndex)) {
    return;
  }

  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    showToast("Project not found", true);
    return;
  }

  const phases = ensureTaskPhases(task);
  if (phaseIndex < 0 || phaseIndex >= phases.length) {
    showToast("Phase not found", true);
    return;
  }

  const phase = phases[phaseIndex];
  pendingEditPhaseTaskId = taskId;
  pendingEditPhaseIndex = phaseIndex;
  elements.editPhaseModalTitle.textContent = `Edit phase for project "${task.taskTitle}"`;
  elements.editPhaseName.value = phase.phaseName;
  elements.editPhaseStatus.value = phase.phaseStatus;
  elements.editPhaseDescription.value = phase.phaseDescription || "";
  applySelectTone(elements.editPhaseStatus, "status");
  validateEditPhaseForm();
  openModal(elements.editPhaseModal, elements.editPhaseName);
}

function closeEditPhaseModal(shouldReset) {
  closeModal(elements.editPhaseModal);
  if (shouldReset) {
    resetEditPhaseForm();
  }
}

function resetEditPhaseForm() {
  pendingEditPhaseTaskId = null;
  pendingEditPhaseIndex = null;
  elements.editPhaseModalTitle.textContent = "Edit Phase";
  elements.editPhaseForm.reset();
  elements.editPhaseStatus.value = "TODO";
  elements.editPhaseDescription.value = "";
  applySelectTone(elements.editPhaseStatus, "status");
  setEditPhaseValidation("", true);
}

function openAddNoteModal(taskId) {
  if (deletingTaskId !== null || addingNoteTaskId !== null) {
    return;
  }

  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    showToast("Project not found", true);
    return;
  }

  pendingAddNoteTaskId = taskId;
  elements.addNoteModalTitle.textContent = `Add note for project "${task.taskTitle}"`;
  elements.addNoteType.value = "RECENT_DECISIONS";
  elements.addNoteContent.value = "";
  setAddNoteValidation("", true);
  openModal(elements.addNoteModal, elements.addNoteContent);
}

function closeAddNoteModal(shouldReset) {
  closeModal(elements.addNoteModal);
  if (shouldReset) {
    resetAddNoteForm();
  }
}

function resetAddNoteForm() {
  pendingAddNoteTaskId = null;
  elements.addNoteModalTitle.textContent = "Add Note";
  elements.addNoteForm.reset();
  elements.addNoteType.value = "RECENT_DECISIONS";
  elements.addNoteContent.value = "";
  setAddNoteValidation("", true);
}

function isVisible(element) {
  return !element.classList.contains("hidden");
}

async function openConfirmModal(message) {
  elements.confirmMessage.textContent = message;
  openModal(elements.confirmModal, elements.confirmCancelBtn);

  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function resolveConfirm(result) {
  if (confirmResolver) {
    confirmResolver(result);
    confirmResolver = null;
  }
  closeModal(elements.confirmModal);
}

async function triggerSearch() {
  if (searchLoading) {
    return;
  }

  state.keyword = elements.keywordInput.value.trim();
  setSearchLoading(true);
  await loadTasks();
  setSearchLoading(false);
}

function setSearchLoading(isLoading) {
  searchLoading = isLoading;
  elements.searchBtn.disabled = isLoading;
  elements.searchBtn.textContent = isLoading ? "Searching..." : "Search";
}

async function loadTasks() {
  try {
    const params = new URLSearchParams();
    if (state.keyword) {
      params.set("keyword", state.keyword);
    }
    params.set("sortBy", state.sortBy);
    params.set("order", state.order);

    const response = await request(`${TASKS_API_URL}?${params.toString()}`);
    tasks = response.data || [];

    renderTable();
    renderStats();
    renderDashboards();
    refreshDetailDrawerIfNeeded();
  } catch (error) {
    showToast(error.message, true);
  }
}

function renderTable() {
  if (!tasks.length) {
    elements.taskTableBody.innerHTML = "";
    elements.emptyState.classList.remove("hidden");
    return;
  }

  elements.emptyState.classList.add("hidden");

  const rowsHtml = tasks
    .map((task) => {
      const phases = ensureTaskPhases(task);

      return `
        <tr>
          <td data-label="Project">
            <div class="project-title">
              ${isStuckProject(task) ? `<span class="stuck-indicator" title="This project has not been updated for over 30 days" aria-label="Stalled project">⚠</span>` : ""}
              ${escapeHtml(task.taskTitle || "Untitled Project")}
            </div>
            <div class="project-meta">
              <span class="priority-badge priority-${resolvePriority(task.priority).toLowerCase()}">${formatPriorityLabel(task.priority)}</span>
            </div>
            <div class="project-desc">${escapeHtml(task.taskDescription || "(No description)")}</div>
            ${renderTaskNotes(task.notes)}
          </td>
          <td data-label="Phases">${renderPhaseChips(task.id, phases)}</td>
          <td data-label="Progress">${renderProgressBar(task.overallProgress)}</td>
          <td data-label="Created Date">${formatDate(task.createdAt)}</td>
          <td data-label="Updated Date">${formatDate(task.updatedAt)}</td>
          <td data-label="Actions">
            <div class="table-actions">
              <button class="btn btn-secondary" data-action="edit" data-id="${task.id}">Edit</button>
              <button class="btn btn-secondary" data-action="details" data-id="${task.id}">Details</button>
              <button class="btn btn-secondary" data-action="add-phase" data-id="${task.id}" ${addingPhaseTaskId === task.id ? "disabled" : ""}>
                ${addingPhaseTaskId === task.id ? "Adding..." : "Add Phase"}
              </button>
              <button class="btn btn-secondary" data-action="add-note" data-id="${task.id}" ${addingNoteTaskId === task.id ? "disabled" : ""}>
                ${addingNoteTaskId === task.id ? "Adding..." : "Add Note"}
              </button>
              <button
                class="btn btn-danger ${deletingTaskId === task.id ? "delete-loading" : ""}"
                data-action="delete"
                data-id="${task.id}"
                ${deletingTaskId === task.id ? "disabled" : ""}
              >
                ${deletingTaskId === task.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  elements.taskTableBody.innerHTML = rowsHtml;
}

function renderStats() {
  const doing = tasks.filter((task) => Number(task.overallProgress) > 0 && Number(task.overallProgress) < 100).length;
  const done = tasks.filter((task) => Number(task.overallProgress) === 100).length;

  elements.doingCount.textContent = String(doing);
  elements.doneCount.textContent = String(done);
}

function renderDashboards() {
  renderProgressRanking();
  renderRecentUpdatedProjects();
}

function renderProgressRanking() {
  const topProjects = [...tasks]
    .sort((a, b) => (Number(b.overallProgress) || 0) - (Number(a.overallProgress) || 0))
    .slice(0, 5);

  if (!topProjects.length) {
    elements.progressRankingList.innerHTML = `<li class="dashboard-empty">No projects yet</li>`;
    return;
  }

  elements.progressRankingList.innerHTML = topProjects
    .map((task, index) => `
      <li class="dashboard-item">
        <span class="dashboard-rank">#${index + 1}</span>
        <span class="dashboard-name">${escapeHtml(task.taskTitle || "Untitled Project")}</span>
        <span class="dashboard-progress">${renderProgressBar(task.overallProgress, "progress-track-compact")}</span>
      </li>
    `)
    .join("");
}

function renderRecentUpdatedProjects() {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = tasks
    .filter((task) => {
      const updatedAt = parseDate(task.updatedAt);
      return updatedAt !== null && updatedAt.getTime() >= oneWeekAgo;
    })
    .sort((a, b) => {
      const timeA = parseDate(a.updatedAt)?.getTime() || 0;
      const timeB = parseDate(b.updatedAt)?.getTime() || 0;
      return timeB - timeA;
    })
    .slice(0, 6);

  if (!recent.length) {
    elements.recentUpdatedList.innerHTML = `<li class="dashboard-empty">No updates in the last 7 days</li>`;
    return;
  }

  elements.recentUpdatedList.innerHTML = recent
    .map((task) => `
      <li class="dashboard-item dashboard-item-simple">
        <span class="dashboard-name">${escapeHtml(task.taskTitle || "Untitled Project")}</span>
        <span class="dashboard-value">${formatDate(task.updatedAt)}</span>
      </li>
    `)
    .join("");
}

function startEditing(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    showToast("Project not found", true);
    return;
  }

  editingTaskId = task.id;
  elements.formTitle.textContent = `Edit Project: ${task.taskTitle}`;
  elements.submitBtn.textContent = "Update Project";

  elements.taskTitle.value = task.taskTitle || "";
  elements.taskDescription.value = task.taskDescription || "";
  elements.recentDecisions.value = task.recentDecisions || "";
  elements.recentExperiments.value = task.recentExperiments || "";
  elements.knowledgeHighlights.value = task.knowledgeHighlights || "";
  elements.taskPriority.value = resolvePriority(task.priority);
  applySelectTone(elements.taskPriority, "priority");

  currentPhases = clonePhases(ensureTaskPhases(task));
  renderPhaseInputs();

  openTaskModal();
}

function resetForm() {
  editingTaskId = null;
  elements.formTitle.textContent = "Create Project";
  elements.submitBtn.textContent = "Save Project";
  elements.taskForm.reset();
  elements.taskPriority.value = "MEDIUM";
  applySelectTone(elements.taskPriority, "priority");

  currentPhases = buildDefaultPhases();
  renderPhaseInputs();
}

function renderPhaseInputs() {
  const html = currentPhases
    .map((phase, index) => {
      const showRemove = index >= 3;
      return `
        <div class="phase-item" data-index="${index}">
          <div class="phase-item-top">
            <input class="phase-name" type="text" maxlength="100" value="${escapeHtml(phase.phaseName)}" placeholder="Phase Name" />
            <select class="phase-status status-select ${getStatusSelectClass(phase.phaseStatus)}">
              <option value="TODO" ${phase.phaseStatus === "TODO" ? "selected" : ""}>TODO</option>
              <option value="DOING" ${phase.phaseStatus === "DOING" ? "selected" : ""}>DOING</option>
              <option value="DONE" ${phase.phaseStatus === "DONE" ? "selected" : ""}>DONE</option>
            </select>
            ${showRemove
              ? `<button type="button" class="btn btn-danger" data-remove-index="${index}">Remove</button>`
              : `<span class="phase-default-tag">Default Phase</span>`}
          </div>
          <textarea class="phase-description" maxlength="2000" placeholder="Phase Description (optional)">${escapeHtml(phase.phaseDescription || "")}</textarea>
        </div>
      `;
    })
    .join("");

  elements.phaseList.innerHTML = html;
  refreshPhaseStatusSelectTones();
}

function collectPhasesFromDom() {
  const phaseItems = elements.phaseList.querySelectorAll(".phase-item");
  const phases = Array.from(phaseItems).map((item, index) => {
    const nameInput = item.querySelector(".phase-name");
    const statusSelect = item.querySelector(".phase-status");
    const descriptionInput = item.querySelector(".phase-description");

    return {
      phaseName: (nameInput?.value || "").trim() || `Phase ${index + 1}`,
      phaseDescription: (descriptionInput?.value || "").trim(),
      phaseStatus: statusSelect?.value || "TODO"
    };
  });

  return normalizePhaseList(phases);
}

function normalizePhaseList(phases) {
  const normalized = (phases || []).map((phase, index) => {
    const status = ["TODO", "DOING", "DONE"].includes(phase.phaseStatus) ? phase.phaseStatus : "TODO";
    return {
      phaseName: (phase.phaseName || "").trim() || `Phase ${index + 1}`,
      phaseDescription: (phase.phaseDescription || "").trim(),
      phaseStatus: status,
      sortOrder: index + 1
    };
  });

  while (normalized.length < 3) {
    normalized.push(createPhaseTemplate(normalized.length + 1));
  }

  return normalized.map((phase, index) => ({
    ...phase,
    sortOrder: index + 1
  }));
}

function buildDefaultPhases() {
  return [
    createPhaseTemplate(1),
    createPhaseTemplate(2),
    createPhaseTemplate(3)
  ];
}

function createPhaseTemplate(index) {
  return {
    phaseName: `Phase ${index}`,
    phaseDescription: "",
    phaseStatus: "TODO",
    sortOrder: index
  };
}

function clonePhases(phases) {
  return phases.map((phase, index) => ({
    phaseName: phase.phaseName,
    phaseDescription: phase.phaseDescription || "",
    phaseStatus: phase.phaseStatus,
    sortOrder: index + 1
  }));
}

async function handleSubmit(event) {
  event.preventDefault();

  const payload = {
    taskTitle: elements.taskTitle.value.trim(),
    taskDescription: elements.taskDescription.value.trim(),
    recentDecisions: elements.recentDecisions.value.trim(),
    recentExperiments: elements.recentExperiments.value.trim(),
    knowledgeHighlights: elements.knowledgeHighlights.value.trim(),
    priority: resolvePriority(elements.taskPriority.value),
    phases: collectPhasesFromDom()
  };

  if (!payload.taskTitle) {
    showToast("Project title cannot be empty", true);
    elements.taskTitle.focus();
    return;
  }

  try {
    if (editingTaskId) {
      await request(`${TASKS_API_URL}/${editingTaskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      showToast("Project updated successfully");
    } else {
      await request(TASKS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      showToast("Project created successfully");
    }

    closeTaskModal(true);
    await loadTasks();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleAddPhaseSubmit(event) {
  event.preventDefault();

  if (pendingAddPhaseTaskId === null || addingPhaseTaskId !== null || deletingTaskId !== null) {
    return;
  }

  const taskId = pendingAddPhaseTaskId;
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    showToast("Project not found", true);
    return;
  }

  if (!validateAddPhaseForm()) {
    elements.addPhaseName.focus();
    return;
  }

  const phaseName = elements.addPhaseName.value.trim();
  const phaseStatus = elements.addPhaseStatus.value;
  const phaseDescription = elements.addPhaseDescription.value.trim();
  const phases = clonePhases(ensureTaskPhases(task));
  phases.push({
    phaseName,
    phaseDescription,
    phaseStatus,
    sortOrder: phases.length + 1
  });

  const payload = {
    taskTitle: task.taskTitle,
    taskDescription: task.taskDescription || "",
    recentDecisions: task.recentDecisions || "",
    recentExperiments: task.recentExperiments || "",
    knowledgeHighlights: task.knowledgeHighlights || "",
    priority: resolvePriority(task.priority),
    phases
  };

  try {
    addingPhaseTaskId = taskId;
    closeAddPhaseModal(false);
    renderTable();

    await request(`${TASKS_API_URL}/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    showToast("Phase added successfully");
    await loadTasks();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    addingPhaseTaskId = null;
    resetAddPhaseForm();
    renderTable();
  }
}

async function handleEditPhaseSubmit(event) {
  event.preventDefault();

  if (
    pendingEditPhaseTaskId === null ||
    pendingEditPhaseIndex === null ||
    editingPhaseTaskId !== null ||
    addingPhaseTaskId !== null ||
    deletingTaskId !== null
  ) {
    return;
  }

  const taskId = pendingEditPhaseTaskId;
  const phaseIndex = pendingEditPhaseIndex;
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    showToast("Project not found", true);
    return;
  }

  if (!validateEditPhaseForm()) {
    elements.editPhaseName.focus();
    return;
  }

  const phases = clonePhases(ensureTaskPhases(task));
  if (phaseIndex < 0 || phaseIndex >= phases.length) {
    showToast("Phase not found", true);
    return;
  }

  phases[phaseIndex] = {
    ...phases[phaseIndex],
    phaseName: elements.editPhaseName.value.trim(),
    phaseDescription: elements.editPhaseDescription.value.trim(),
    phaseStatus: elements.editPhaseStatus.value,
    sortOrder: phaseIndex + 1
  };

  const payload = {
    taskTitle: task.taskTitle,
    taskDescription: task.taskDescription || "",
    recentDecisions: task.recentDecisions || "",
    recentExperiments: task.recentExperiments || "",
    knowledgeHighlights: task.knowledgeHighlights || "",
    priority: resolvePriority(task.priority),
    phases
  };

  try {
    editingPhaseTaskId = taskId;
    closeEditPhaseModal(false);
    renderTable();

    await request(`${TASKS_API_URL}/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    showToast("Phase updated successfully");
    await loadTasks();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    editingPhaseTaskId = null;
    resetEditPhaseForm();
    renderTable();
  }
}

async function handleAddNoteSubmit(event) {
  event.preventDefault();

  if (pendingAddNoteTaskId === null || addingNoteTaskId !== null || deletingTaskId !== null) {
    return;
  }

  if (!validateAddNoteForm()) {
    elements.addNoteContent.focus();
    return;
  }

  const taskId = pendingAddNoteTaskId;
  const noteType = elements.addNoteType.value;
  const noteContent = elements.addNoteContent.value.trim();

  try {
    addingNoteTaskId = taskId;
    elements.addNoteConfirmBtn.disabled = true;

    await request(`${TASKS_API_URL}/${taskId}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        noteType,
        noteContent
      })
    });

    closeAddNoteModal(true);
    showToast("Note added successfully");
    await loadTasks();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    addingNoteTaskId = null;
    elements.addNoteConfirmBtn.disabled = false;
  }
}

function validateAddPhaseForm() {
  const phaseName = elements.addPhaseName.value.trim();
  if (!phaseName) {
    setAddPhaseValidation("Phase name is required", false);
    return false;
  }

  if (pendingAddPhaseTaskId !== null) {
    const task = tasks.find((item) => item.id === pendingAddPhaseTaskId);
    if (task) {
      const normalizedInput = normalizePhaseName(phaseName);
      const duplicated = ensureTaskPhases(task).some((phase) => normalizePhaseName(phase.phaseName) === normalizedInput);
      if (duplicated) {
        setAddPhaseValidation("Phase name already exists. Please choose another name.", false);
        return false;
      }
    }
  }

  setAddPhaseValidation("", true);
  return true;
}

function validateAddNoteForm() {
  const content = elements.addNoteContent.value.trim();
  if (!content) {
    setAddNoteValidation("Note content is required", false);
    return false;
  }
  setAddNoteValidation("", true);
  return true;
}

function setAddNoteValidation(message, isValid) {
  elements.addNoteValidation.textContent = message;
  elements.addNoteValidation.classList.toggle("hidden", isValid);
  elements.addNoteConfirmBtn.disabled = !isValid;
  elements.addNoteContent.classList.toggle("input-invalid", !isValid);
}

function setAddPhaseValidation(message, isValid) {
  elements.addPhaseConfirmBtn.disabled = !isValid;
  elements.addPhaseName.classList.toggle("input-invalid", !isValid);
  elements.addPhaseValidation.textContent = message;
  elements.addPhaseValidation.classList.toggle("hidden", isValid);
}

function validateEditPhaseForm() {
  const phaseName = elements.editPhaseName.value.trim();
  if (!phaseName) {
    setEditPhaseValidation("Phase name is required", false);
    return false;
  }

  if (pendingEditPhaseTaskId !== null && pendingEditPhaseIndex !== null) {
    const task = tasks.find((item) => item.id === pendingEditPhaseTaskId);
    if (task) {
      const normalizedInput = normalizePhaseName(phaseName);
      const duplicated = ensureTaskPhases(task).some((phase, index) => (
        index !== pendingEditPhaseIndex && normalizePhaseName(phase.phaseName) === normalizedInput
      ));
      if (duplicated) {
        setEditPhaseValidation("Phase name already exists. Please choose another name.", false);
        return false;
      }
    }
  }

  setEditPhaseValidation("", true);
  return true;
}

function setEditPhaseValidation(message, isValid) {
  elements.editPhaseConfirmBtn.disabled = !isValid;
  elements.editPhaseName.classList.toggle("input-invalid", !isValid);
  elements.editPhaseValidation.textContent = message;
  elements.editPhaseValidation.classList.toggle("hidden", isValid);
}

function normalizePhaseName(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

async function removeTask(taskId) {
  if (deletingTaskId !== null) {
    return;
  }

  const task = tasks.find((item) => item.id === taskId);
  const projectName = task?.taskTitle || `ID ${taskId}`;
  const confirmed = await openConfirmModal(`Delete project "${projectName}"? This action cannot be undone.`);
  if (!confirmed) {
    return;
  }

  try {
    deletingTaskId = taskId;
    renderTable();

    await request(`${TASKS_API_URL}/${taskId}`, {
      method: "DELETE"
    });

    if (editingTaskId === taskId) {
      closeTaskModal(true);
    }
    if (detailTaskId === taskId) {
      closeDetailDrawer();
    }

    showToast("Project deleted successfully");
    await loadTasks();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    deletingTaskId = null;
    renderTable();
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const isJson = (response.headers.get("content-type") || "").includes("application/json");
  const body = isJson ? await response.json() : null;

  if (!response.ok || !body?.success) {
    const message = body?.message || `Request failed (${response.status})`;
    const detail = body?.errors ? Object.values(body.errors).join("; ") : "";
    const localizedMessage = localizeMessage(message);
    throw new Error(detail ? `${localizedMessage}: ${detail}` : localizedMessage);
  }

  return body;
}

function localizeMessage(message) {
  if (message.startsWith("Task not found with id")) {
    return "Project not found";
  }
  if (message === "Validation failed") {
    return "Validation failed";
  }
  if (message === "Invalid request body") {
    return "Invalid request body";
  }
  if (message === "phase status must be one of TODO, DOING, DONE") {
    return "Phase status must be TODO, DOING, or DONE";
  }
  if (message === "priority must be one of HIGH, MEDIUM, LOW") {
    return "Priority must be HIGH, MEDIUM, or LOW";
  }
  if (message === "Internal server error") {
    return "Internal server error";
  }
  return message;
}

function ensureTaskPhases(task) {
  if (Array.isArray(task.phases) && task.phases.length > 0) {
    return normalizePhaseList(task.phases);
  }

  // Backward compatibility for legacy 3-phase fields
  const fallback = [
    { phaseName: "Phase 1", phaseDescription: "", phaseStatus: task.phase1Status || "TODO" },
    { phaseName: "Phase 2", phaseDescription: "", phaseStatus: task.phase2Status || "TODO" },
    { phaseName: "Phase 3", phaseDescription: "", phaseStatus: task.phase3Status || "TODO" }
  ];
  return normalizePhaseList(fallback);
}

function renderPhaseChips(taskId, phases) {
  const chips = phases
    .map((phase, index) => {
      const doingClass = phase.phaseStatus === "DOING" ? "phase-chip-doing" : "";
      const arrow = index < phases.length - 1 ? `<span class="phase-flow-arrow" aria-hidden="true">↓</span>` : "";
      const disabled = editingPhaseTaskId === taskId ? "disabled" : "";
      const phaseTitle = phase.phaseDescription
        ? `Click to edit phase\n${phase.phaseDescription}`
        : "Click to edit phase";
      return `
        <div class="phase-flow-item">
          <button
            type="button"
            class="phase-chip phase-chip-button ${doingClass}"
            data-action="edit-phase"
            data-id="${taskId}"
            data-phase-index="${index}"
            title="${escapeHtml(phaseTitle)}"
            ${disabled}
          >
            <span class="phase-chip-name">${escapeHtml(phase.phaseName)}</span>
            ${renderStatus(phase.phaseStatus)}
          </button>
          ${phase.phaseDescription ? `<p class="phase-chip-description">${escapeHtml(phase.phaseDescription)}</p>` : ""}
          ${arrow}
        </div>
      `;
    })
    .join("");

  return `<div class="phase-chip-list">${chips}</div>`;
}

function renderStatus(status) {
  const labelMap = {
    TODO: "TODO",
    DOING: "DOING",
    DONE: "DONE"
  };
  const classMap = {
    TODO: "status-todo",
    DOING: "status-doing",
    DONE: "status-done"
  };

  const statusClass = classMap[status] || "status-todo";
  const statusLabel = labelMap[status] || status;
  return `<span class="status-pill ${statusClass}">${statusLabel}</span>`;
}

function renderTaskNotes(notes) {
  if (!Array.isArray(notes) || !notes.length) {
    return "";
  }

  const items = notes
    .map((note) => `
      <div class="project-note-item">
        <div class="project-note-meta">
          <span class="project-note-type">${formatNoteTypeLabel(note.noteType)}</span>
          <span class="project-note-time">${formatDate(note.createdAt)}</span>
        </div>
        <p class="project-note-content">${escapeHtml(note.noteContent || "")}</p>
      </div>
    `)
    .join("");

  return `<div class="project-notes">${items}</div>`;
}

function formatNoteTypeLabel(noteType) {
  const labelMap = {
    RECENT_DECISIONS: "Recent Decisions",
    RECENT_EXPERIMENTS: "Recent Experiments",
    KNOWLEDGE_HIGHLIGHTS: "Knowledge Highlights"
  };
  return labelMap[noteType] || noteType || "Note";
}

function renderProgressBar(progress, extraClass = "") {
  const normalized = Math.max(0, Math.min(100, Number(progress) || 0));
  const label = `${formatProgress(normalized)}%`;
  const className = ["progress-track", extraClass].filter(Boolean).join(" ");

  return `
    <div class="${className}" aria-label="Overall progress">
      <div class="progress-fill" style="width:${normalized}%"></div>
      <span class="progress-label">${label}</span>
    </div>
  `;
}

function refreshPhaseStatusSelectTones() {
  elements.phaseList.querySelectorAll(".phase-status").forEach((selectElement) => {
    applySelectTone(selectElement, "status");
  });
}

function applySelectTone(selectElement, selectType) {
  if (!selectElement) {
    return;
  }

  if (selectType === "status") {
    selectElement.classList.remove("status-select-todo", "status-select-doing", "status-select-done");
    selectElement.classList.add("status-select", getStatusSelectClass(selectElement.value));
    return;
  }

  if (selectType === "priority") {
    selectElement.classList.remove("priority-select-high", "priority-select-medium", "priority-select-low");
    selectElement.classList.add("priority-select", getPrioritySelectClass(selectElement.value));
  }
}

function getStatusSelectClass(value) {
  if (value === "DOING") {
    return "status-select-doing";
  }
  if (value === "DONE") {
    return "status-select-done";
  }
  return "status-select-todo";
}

function getPrioritySelectClass(value) {
  if (value === "HIGH") {
    return "priority-select-high";
  }
  if (value === "LOW") {
    return "priority-select-low";
  }
  return "priority-select-medium";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function formatProgress(value) {
  return Number(value || 0).toFixed(1);
}

function resolvePriority(priority) {
  if (["HIGH", "MEDIUM", "LOW"].includes(priority)) {
    return priority;
  }
  return "MEDIUM";
}

function formatPriorityLabel(priority) {
  const normalized = resolvePriority(priority);
  const labelMap = {
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low"
  };
  return labelMap[normalized];
}

function isDetailDrawerVisible() {
  return !elements.detailDrawer.classList.contains("hidden");
}

function openDetailDrawer(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    showToast("Project not found", true);
    return;
  }

  detailTaskId = taskId;
  detailPreviewState.recentDecisions = false;
  detailPreviewState.recentExperiments = false;
  detailPreviewState.knowledgeHighlights = false;
  renderDetailDrawer(task);

  if (!lastFocusedElement && document.activeElement instanceof HTMLElement) {
    lastFocusedElement = document.activeElement;
  }

  elements.detailDrawerBackdrop.classList.remove("hidden");
  elements.detailDrawer.classList.remove("hidden");
  elements.detailDrawer.setAttribute("aria-hidden", "false");
  updateBodyModalState();
  window.setTimeout(() => elements.closeDetailDrawerBtn.focus(), 0);
}

function closeDetailDrawer() {
  detailTaskId = null;
  elements.detailDrawerBackdrop.classList.add("hidden");
  elements.detailDrawer.classList.add("hidden");
  elements.detailDrawer.setAttribute("aria-hidden", "true");
  updateBodyModalState();

  if (
    !isVisible(elements.taskModal) &&
    !isVisible(elements.confirmModal) &&
    !isVisible(elements.addPhaseModal) &&
    !isVisible(elements.editPhaseModal) &&
    !isVisible(elements.addNoteModal) &&
    lastFocusedElement
  ) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

function refreshDetailDrawerIfNeeded() {
  if (detailTaskId === null || !isDetailDrawerVisible()) {
    return;
  }

  const task = tasks.find((item) => item.id === detailTaskId);
  if (!task) {
    closeDetailDrawer();
    return;
  }

  renderDetailDrawer(task);
}

function renderDetailDrawer(task) {
  const phases = ensureTaskPhases(task);
  elements.detailDrawerTitle.textContent = `Project Details: ${task.taskTitle || "Untitled Project"}`;
  elements.detailMeta.innerHTML = `
    <div class="detail-meta-item"><span>Priority</span><strong>${formatPriorityLabel(task.priority)}</strong></div>
    <div class="detail-meta-item"><span>Created Date</span><strong>${formatDate(task.createdAt)}</strong></div>
    <div class="detail-meta-item"><span>Updated Date</span><strong>${formatDate(task.updatedAt)}</strong></div>
  `;
  elements.detailProgress.innerHTML = `
    <h4>Overall Progress</h4>
    ${renderProgressBar(task.overallProgress)}
  `;
  renderDetailPhases(phases);
  renderKnowledgeSections(task);
}

function renderDetailPhases(phases) {
  if (!phases.length) {
    elements.detailPhases.innerHTML = "<p class=\"knowledge-empty\">No phases</p>";
    return;
  }

  const phaseItems = phases
    .map((phase) => `
      <div class="detail-phase-item">
        <div class="detail-phase-main">
          <span class="detail-phase-name">${escapeHtml(phase.phaseName)}</span>
          ${renderStatus(phase.phaseStatus)}
        </div>
        ${phase.phaseDescription ? `<p class="detail-phase-description">${escapeHtml(phase.phaseDescription)}</p>` : ""}
      </div>
    `)
    .join("");

  elements.detailPhases.innerHTML = `
    <h4>Phase List</h4>
    <div class="detail-phase-list">${phaseItems}</div>
  `;
}

function renderKnowledgeSections(task) {
  renderKnowledgeContent(elements.detailRecentDecisions, task.recentDecisions, detailPreviewState.recentDecisions);
  renderKnowledgeContent(elements.detailRecentExperiments, task.recentExperiments, detailPreviewState.recentExperiments);
  renderKnowledgeContent(elements.detailKnowledgeHighlights, task.knowledgeHighlights, detailPreviewState.knowledgeHighlights);
  refreshKnowledgeToggleButtons();
}

function toggleKnowledgePreview(sectionKey) {
  if (!(sectionKey in detailPreviewState)) {
    return;
  }
  detailPreviewState[sectionKey] = !detailPreviewState[sectionKey];
  refreshDetailDrawerIfNeeded();
}

function refreshKnowledgeToggleButtons() {
  elements.knowledgeToggleButtons.forEach((button) => {
    const sectionKey = button.dataset.previewSection;
    const isPreview = Boolean(sectionKey && detailPreviewState[sectionKey]);
    button.textContent = isPreview ? "Raw" : "Preview";
    button.classList.toggle("preview-active", isPreview);
  });
}

function renderKnowledgeContent(container, text, isPreview) {
  const content = String(text || "").trim();
  if (!content) {
    container.innerHTML = "<p class=\"knowledge-empty\">No content</p>";
    return;
  }

  if (!isPreview) {
    container.innerHTML = `<pre class="knowledge-raw">${escapeHtml(content)}</pre>`;
    return;
  }

  container.innerHTML = `<div class="knowledge-markdown">${markdownToHtml(content)}</div>`;
}

function markdownToHtml(markdownText) {
  const source = escapeHtml(String(markdownText || "").replace(/\r\n?/g, "\n"));
  const lines = source.split("\n");
  const htmlParts = [];
  let inUl = false;
  let inOl = false;

  function closeLists() {
    if (inUl) {
      htmlParts.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      htmlParts.push("</ol>");
      inOl = false;
    }
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      closeLists();
      return;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      closeLists();
      const level = headingMatch[1].length;
      htmlParts.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
      return;
    }

    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (inOl) {
        htmlParts.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        htmlParts.push("<ul>");
        inUl = true;
      }
      htmlParts.push(`<li>${formatInlineMarkdown(ulMatch[1])}</li>`);
      return;
    }

    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inUl) {
        htmlParts.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        htmlParts.push("<ol>");
        inOl = true;
      }
      htmlParts.push(`<li>${formatInlineMarkdown(olMatch[1])}</li>`);
      return;
    }

    closeLists();
    htmlParts.push(`<p>${formatInlineMarkdown(line)}</p>`);
  });

  closeLists();
  return htmlParts.join("");
}

function formatInlineMarkdown(text) {
  return String(text || "")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "<a href=\"$2\" target=\"_blank\" rel=\"noopener noreferrer\">$1</a>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function isStuckProject(task) {
  const updatedAt = parseDate(task.updatedAt);
  if (!updatedAt) {
    return false;
  }

  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return updatedAt.getTime() < oneMonthAgo;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden", "error");

  if (isError) {
    elements.toast.classList.add("error");
  }

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.add("hidden");
  }, 2200);
}
