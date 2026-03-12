const API_BASE_URL = window.TASK_API_BASE_URL || "http://localhost:8080/api";
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
let currentPhases = [];

const elements = {
  apiBaseText: document.getElementById("apiBaseText"),
  taskModal: document.getElementById("taskModal"),
  confirmModal: document.getElementById("confirmModal"),
  addPhaseModal: document.getElementById("addPhaseModal"),
  editPhaseModal: document.getElementById("editPhaseModal"),
  openTaskModalBtn: document.getElementById("openTaskModalBtn"),
  closeTaskModalBtn: document.getElementById("closeTaskModalBtn"),
  confirmMessage: document.getElementById("confirmMessage"),
  confirmOkBtn: document.getElementById("confirmOkBtn"),
  confirmCancelBtn: document.getElementById("confirmCancelBtn"),
  addPhaseForm: document.getElementById("addPhaseForm"),
  addPhaseModalTitle: document.getElementById("addPhaseModalTitle"),
  addPhaseName: document.getElementById("addPhaseName"),
  addPhaseValidation: document.getElementById("addPhaseValidation"),
  addPhaseStatus: document.getElementById("addPhaseStatus"),
  addPhaseCancelBtn: document.getElementById("addPhaseCancelBtn"),
  addPhaseConfirmBtn: document.getElementById("addPhaseConfirmBtn"),
  editPhaseForm: document.getElementById("editPhaseForm"),
  editPhaseModalTitle: document.getElementById("editPhaseModalTitle"),
  editPhaseName: document.getElementById("editPhaseName"),
  editPhaseValidation: document.getElementById("editPhaseValidation"),
  editPhaseStatus: document.getElementById("editPhaseStatus"),
  editPhaseCancelBtn: document.getElementById("editPhaseCancelBtn"),
  editPhaseConfirmBtn: document.getElementById("editPhaseConfirmBtn"),
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
  taskTableBody: document.getElementById("taskTableBody"),
  emptyState: document.getElementById("emptyState"),
  toast: document.getElementById("toast"),
  doingCount: document.getElementById("doingCount"),
  doneCount: document.getElementById("doneCount"),
  taskTitle: document.getElementById("taskTitle"),
  taskDescription: document.getElementById("taskDescription"),
  taskPriority: document.getElementById("taskPriority"),
  progressRankingList: document.getElementById("progressRankingList"),
  recentUpdatedList: document.getElementById("recentUpdatedList")
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  elements.apiBaseText.textContent = API_BASE_URL;
  elements.sortBySelect.value = state.sortBy;
  elements.orderSelect.value = state.order;
  bindEvents();
  resetForm();
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

  elements.addPhaseForm.addEventListener("submit", handleAddPhaseSubmit);
  elements.addPhaseName.addEventListener("input", () => {
    validateAddPhaseForm();
  });
  elements.editPhaseForm.addEventListener("submit", handleEditPhaseSubmit);
  elements.editPhaseName.addEventListener("input", () => {
    validateEditPhaseForm();
  });

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

    if (isVisible(elements.taskModal)) {
      closeTaskModal(true);
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
      showToast("默认前三个阶段不可删除", true);
      return;
    }

    currentPhases = collectPhasesFromDom();
    currentPhases.splice(removeIndex, 1);
    renderPhaseInputs();
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
    loadTasks();
  });

  elements.orderSelect.addEventListener("change", () => {
    state.order = elements.orderSelect.value;
    loadTasks();
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

    if (action === "add-phase") {
      openAddPhaseModal(taskId);
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

  if (!isVisible(elements.taskModal) && !isVisible(elements.confirmModal) && !isVisible(elements.addPhaseModal) && !isVisible(elements.editPhaseModal) && lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

function updateBodyModalState() {
  if (isVisible(elements.taskModal) || isVisible(elements.confirmModal) || isVisible(elements.addPhaseModal) || isVisible(elements.editPhaseModal)) {
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
    showToast("未找到项目", true);
    return;
  }

  const phases = ensureTaskPhases(task);
  pendingAddPhaseTaskId = taskId;
  elements.addPhaseModalTitle.textContent = `为项目「${task.taskTitle}」新增阶段`;
  elements.addPhaseName.value = `阶段${phases.length + 1}`;
  elements.addPhaseStatus.value = "TODO";
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
  elements.addPhaseModalTitle.textContent = "新增阶段";
  elements.addPhaseForm.reset();
  elements.addPhaseStatus.value = "TODO";
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
    showToast("未找到项目", true);
    return;
  }

  const phases = ensureTaskPhases(task);
  if (phaseIndex < 0 || phaseIndex >= phases.length) {
    showToast("未找到阶段", true);
    return;
  }

  const phase = phases[phaseIndex];
  pendingEditPhaseTaskId = taskId;
  pendingEditPhaseIndex = phaseIndex;
  elements.editPhaseModalTitle.textContent = `编辑项目「${task.taskTitle}」阶段`;
  elements.editPhaseName.value = phase.phaseName;
  elements.editPhaseStatus.value = phase.phaseStatus;
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
  elements.editPhaseModalTitle.textContent = "编辑阶段";
  elements.editPhaseForm.reset();
  elements.editPhaseStatus.value = "TODO";
  setEditPhaseValidation("", true);
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
  elements.searchBtn.classList.toggle("search-loading", isLoading);
  elements.searchBtn.textContent = isLoading ? "搜索中..." : "搜索";
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
          <td>
            <div class="project-title">
              ${isStuckProject(task) ? `<span class="stuck-indicator" title="该项目超过30天未更新" aria-label="卡住项目">⚠</span>` : ""}
              ${escapeHtml(task.taskTitle || "未命名项目")}
            </div>
            <div class="project-meta">
              <span class="priority-badge priority-${resolvePriority(task.priority).toLowerCase()}">${formatPriorityLabel(task.priority)}</span>
            </div>
            <div class="project-desc">${escapeHtml(task.taskDescription || "（无项目描述）")}</div>
          </td>
          <td>${renderPhaseChips(task.id, phases)}</td>
          <td>${renderProgressBar(task.overallProgress)}</td>
          <td>${formatDate(task.createdAt)}</td>
          <td>${formatDate(task.updatedAt)}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-secondary" data-action="edit" data-id="${task.id}">编辑</button>
              <button class="btn btn-secondary" data-action="add-phase" data-id="${task.id}" ${addingPhaseTaskId === task.id ? "disabled" : ""}>
                ${addingPhaseTaskId === task.id ? "新增中..." : "新增阶段"}
              </button>
              <button
                class="btn btn-danger ${deletingTaskId === task.id ? "delete-loading" : ""}"
                data-action="delete"
                data-id="${task.id}"
                ${deletingTaskId === task.id ? "disabled" : ""}
              >
                ${deletingTaskId === task.id ? "删除中..." : "删除"}
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
    elements.progressRankingList.innerHTML = `<li class="dashboard-empty">暂无项目数据</li>`;
    return;
  }

  elements.progressRankingList.innerHTML = topProjects
    .map((task, index) => `
      <li class="dashboard-item">
        <span class="dashboard-rank">#${index + 1}</span>
        <span class="dashboard-name">${escapeHtml(task.taskTitle || "未命名项目")}</span>
        <span class="dashboard-value">${formatProgress(task.overallProgress)}%</span>
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
    elements.recentUpdatedList.innerHTML = `<li class="dashboard-empty">近 7 天暂无推进项目</li>`;
    return;
  }

  elements.recentUpdatedList.innerHTML = recent
    .map((task) => `
      <li class="dashboard-item">
        <span class="dashboard-name">${escapeHtml(task.taskTitle || "未命名项目")}</span>
        <span class="dashboard-value">${formatDate(task.updatedAt)}</span>
      </li>
    `)
    .join("");
}

function startEditing(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    showToast("未找到项目", true);
    return;
  }

  editingTaskId = task.id;
  elements.formTitle.textContent = `编辑项目：${task.taskTitle}`;
  elements.submitBtn.textContent = "更新项目";

  elements.taskTitle.value = task.taskTitle || "";
  elements.taskDescription.value = task.taskDescription || "";
  elements.taskPriority.value = resolvePriority(task.priority);

  currentPhases = clonePhases(ensureTaskPhases(task));
  renderPhaseInputs();

  openTaskModal();
}

function resetForm() {
  editingTaskId = null;
  elements.formTitle.textContent = "新建项目";
  elements.submitBtn.textContent = "保存项目";
  elements.taskForm.reset();
  elements.taskPriority.value = "MEDIUM";

  currentPhases = buildDefaultPhases();
  renderPhaseInputs();
}

function renderPhaseInputs() {
  const html = currentPhases
    .map((phase, index) => {
      const showRemove = index >= 3;
      return `
        <div class="phase-item" data-index="${index}">
          <input class="phase-name" type="text" maxlength="100" value="${escapeHtml(phase.phaseName)}" placeholder="阶段名称" />
          <select class="phase-status">
            <option value="TODO" ${phase.phaseStatus === "TODO" ? "selected" : ""}>待开始</option>
            <option value="DOING" ${phase.phaseStatus === "DOING" ? "selected" : ""}>进行中</option>
            <option value="DONE" ${phase.phaseStatus === "DONE" ? "selected" : ""}>已完成</option>
          </select>
          ${showRemove
            ? `<button type="button" class="btn btn-danger" data-remove-index="${index}">移除</button>`
            : `<span class="phase-default-tag">默认阶段</span>`}
        </div>
      `;
    })
    .join("");

  elements.phaseList.innerHTML = html;
}

function collectPhasesFromDom() {
  const phaseItems = elements.phaseList.querySelectorAll(".phase-item");
  const phases = Array.from(phaseItems).map((item, index) => {
    const nameInput = item.querySelector(".phase-name");
    const statusSelect = item.querySelector(".phase-status");

    return {
      phaseName: (nameInput?.value || "").trim() || `阶段${index + 1}`,
      phaseStatus: statusSelect?.value || "TODO"
    };
  });

  return normalizePhaseList(phases);
}

function normalizePhaseList(phases) {
  const normalized = (phases || []).map((phase, index) => {
    const status = ["TODO", "DOING", "DONE"].includes(phase.phaseStatus) ? phase.phaseStatus : "TODO";
    return {
      phaseName: (phase.phaseName || "").trim() || `阶段${index + 1}`,
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
    phaseName: `阶段${index}`,
    phaseStatus: "TODO",
    sortOrder: index
  };
}

function clonePhases(phases) {
  return phases.map((phase, index) => ({
    phaseName: phase.phaseName,
    phaseStatus: phase.phaseStatus,
    sortOrder: index + 1
  }));
}

async function handleSubmit(event) {
  event.preventDefault();

  const payload = {
    taskTitle: elements.taskTitle.value.trim(),
    taskDescription: elements.taskDescription.value.trim(),
    priority: resolvePriority(elements.taskPriority.value),
    phases: collectPhasesFromDom()
  };

  if (!payload.taskTitle) {
    showToast("项目名称不能为空", true);
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
      showToast("项目更新成功");
    } else {
      await request(TASKS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      showToast("项目创建成功");
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
    showToast("未找到项目", true);
    return;
  }

  if (!validateAddPhaseForm()) {
    elements.addPhaseName.focus();
    return;
  }

  const phaseName = elements.addPhaseName.value.trim();
  const phaseStatus = elements.addPhaseStatus.value;
  const phases = clonePhases(ensureTaskPhases(task));
  phases.push({
    phaseName,
    phaseStatus,
    sortOrder: phases.length + 1
  });

  const payload = {
    taskTitle: task.taskTitle,
    taskDescription: task.taskDescription || "",
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

    showToast("新增阶段成功");
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
    showToast("未找到项目", true);
    return;
  }

  if (!validateEditPhaseForm()) {
    elements.editPhaseName.focus();
    return;
  }

  const phases = clonePhases(ensureTaskPhases(task));
  if (phaseIndex < 0 || phaseIndex >= phases.length) {
    showToast("未找到阶段", true);
    return;
  }

  phases[phaseIndex] = {
    ...phases[phaseIndex],
    phaseName: elements.editPhaseName.value.trim(),
    phaseStatus: elements.editPhaseStatus.value,
    sortOrder: phaseIndex + 1
  };

  const payload = {
    taskTitle: task.taskTitle,
    taskDescription: task.taskDescription || "",
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

    showToast("阶段更新成功");
    await loadTasks();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    editingPhaseTaskId = null;
    resetEditPhaseForm();
    renderTable();
  }
}

function validateAddPhaseForm() {
  const phaseName = elements.addPhaseName.value.trim();
  if (!phaseName) {
    setAddPhaseValidation("阶段名称不能为空", false);
    return false;
  }

  if (pendingAddPhaseTaskId !== null) {
    const task = tasks.find((item) => item.id === pendingAddPhaseTaskId);
    if (task) {
      const normalizedInput = normalizePhaseName(phaseName);
      const duplicated = ensureTaskPhases(task).some((phase) => normalizePhaseName(phase.phaseName) === normalizedInput);
      if (duplicated) {
        setAddPhaseValidation("阶段名称已存在，请更换名称", false);
        return false;
      }
    }
  }

  setAddPhaseValidation("", true);
  return true;
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
    setEditPhaseValidation("阶段名称不能为空", false);
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
        setEditPhaseValidation("阶段名称已存在，请更换名称", false);
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
  const projectName = task?.taskTitle || `编号 ${taskId}`;
  const confirmed = await openConfirmModal(`确认删除项目「${projectName}」吗？此操作不可恢复。`);
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

    showToast("项目删除成功");
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
    const message = body?.message || `请求失败（${response.status}）`;
    const detail = body?.errors ? Object.values(body.errors).join("; ") : "";
    const localizedMessage = localizeMessage(message);
    throw new Error(detail ? `${localizedMessage}: ${detail}` : localizedMessage);
  }

  return body;
}

function localizeMessage(message) {
  if (message.startsWith("Task not found with id")) {
    return "未找到对应项目";
  }
  if (message === "Validation failed") {
    return "参数校验失败";
  }
  if (message === "Invalid request body") {
    return "请求参数格式不正确";
  }
  if (message === "phase status must be one of TODO, DOING, DONE") {
    return "阶段状态必须是 TODO、DOING、DONE 之一";
  }
  if (message === "priority must be one of HIGH, MEDIUM, LOW") {
    return "优先度必须是 HIGH、MEDIUM、LOW 之一";
  }
  if (message === "Internal server error") {
    return "服务器内部错误";
  }
  return message;
}

function ensureTaskPhases(task) {
  if (Array.isArray(task.phases) && task.phases.length > 0) {
    return normalizePhaseList(task.phases);
  }

  // 兼容旧接口的固定三阶段字段
  const fallback = [
    { phaseName: "阶段1", phaseStatus: task.phase1Status || "TODO" },
    { phaseName: "阶段2", phaseStatus: task.phase2Status || "TODO" },
    { phaseName: "阶段3", phaseStatus: task.phase3Status || "TODO" }
  ];
  return normalizePhaseList(fallback);
}

function renderPhaseChips(taskId, phases) {
  const chips = phases
    .map((phase, index) => {
      const doingClass = phase.phaseStatus === "DOING" ? "phase-chip-doing" : "";
      const arrow = index < phases.length - 1 ? `<span class="phase-flow-arrow" aria-hidden="true">↓</span>` : "";
      const disabled = editingPhaseTaskId === taskId ? "disabled" : "";
      return `
        <div class="phase-flow-item">
          <button
            type="button"
            class="phase-chip phase-chip-button ${doingClass}"
            data-action="edit-phase"
            data-id="${taskId}"
            data-phase-index="${index}"
            title="点击编辑阶段"
            ${disabled}
          >
            <span class="phase-chip-name">${escapeHtml(phase.phaseName)}</span>
            ${renderStatus(phase.phaseStatus)}
          </button>
          ${arrow}
        </div>
      `;
    })
    .join("");

  return `<div class="phase-chip-list">${chips}</div>`;
}

function renderStatus(status) {
  const labelMap = {
    TODO: "待开始",
    DOING: "进行中",
    DONE: "已完成"
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

function renderProgressBar(progress) {
  const normalized = Math.max(0, Math.min(100, Number(progress) || 0));
  const label = `${formatProgress(normalized)}%`;

  return `
    <div class="progress-track" aria-label="项目总进度">
      <div class="progress-fill" style="width:${normalized}%"></div>
      <span class="progress-label">${label}</span>
    </div>
  `;
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
    HIGH: "高优先级",
    MEDIUM: "中优先级",
    LOW: "低优先级"
  };
  return labelMap[normalized];
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
