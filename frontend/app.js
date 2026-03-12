const API_BASE_URL = window.TASK_API_BASE_URL || "http://localhost:8080/api";
const TASKS_API_URL = `${API_BASE_URL}/tasks`;

const state = {
  keyword: "",
  sortBy: "updatedAt",
  order: "desc"
};

let tasks = [];
let editingTaskId = null;

const elements = {
  apiBaseText: document.getElementById("apiBaseText"),
  taskModal: document.getElementById("taskModal"),
  openTaskModalBtn: document.getElementById("openTaskModalBtn"),
  closeTaskModalBtn: document.getElementById("closeTaskModalBtn"),
  taskForm: document.getElementById("taskForm"),
  formTitle: document.getElementById("formTitle"),
  submitBtn: document.getElementById("submitBtn"),
  resetBtn: document.getElementById("resetBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  keywordInput: document.getElementById("keywordInput"),
  sortBySelect: document.getElementById("sortBySelect"),
  orderSelect: document.getElementById("orderSelect"),
  taskTableBody: document.getElementById("taskTableBody"),
  emptyState: document.getElementById("emptyState"),
  toast: document.getElementById("toast"),
  totalCount: document.getElementById("totalCount"),
  avgProgress: document.getElementById("avgProgress"),
  doingCount: document.getElementById("doingCount"),
  doneCount: document.getElementById("doneCount"),
  taskTitle: document.getElementById("taskTitle"),
  taskDescription: document.getElementById("taskDescription"),
  phase1Status: document.getElementById("phase1Status"),
  phase2Status: document.getElementById("phase2Status"),
  phase3Status: document.getElementById("phase3Status")
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  elements.apiBaseText.textContent = API_BASE_URL;
  bindEvents();
  loadTasks();
}

function bindEvents() {
  elements.openTaskModalBtn.addEventListener("click", () => {
    resetForm();
    openTaskModal();
  });
  elements.closeTaskModalBtn.addEventListener("click", closeTaskModal);
  elements.taskModal.addEventListener("click", (event) => {
    if (event.target === elements.taskModal) {
      closeTaskModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.taskModal.classList.contains("hidden")) {
      closeTaskModal();
    }
  });

  elements.taskForm.addEventListener("submit", handleSubmit);
  elements.resetBtn.addEventListener("click", resetForm);
  elements.refreshBtn.addEventListener("click", loadTasks);

  let keywordDebounceTimer = null;
  elements.keywordInput.addEventListener("input", () => {
    clearTimeout(keywordDebounceTimer);
    keywordDebounceTimer = setTimeout(() => {
      state.keyword = elements.keywordInput.value.trim();
      loadTasks();
    }, 250);
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
    const action = event.target.dataset.action;
    const taskId = Number(event.target.dataset.id);

    if (!action || !taskId) {
      return;
    }

    if (action === "edit") {
      startEditing(taskId);
      return;
    }

    if (action === "delete") {
      await removeTask(taskId);
    }
  });
}

function openTaskModal() {
  elements.taskModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  elements.taskTitle.focus();
}

function closeTaskModal() {
  elements.taskModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  resetForm();
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
      return `
        <tr>
          <td>${task.id}</td>
          <td title="${escapeHtml(task.taskDescription || "")}">${escapeHtml(task.taskTitle)}</td>
          <td>${renderStatus(task.phase1Status)}</td>
          <td>${renderStatus(task.phase2Status)}</td>
          <td>${renderStatus(task.phase3Status)}</td>
          <td><span class="progress-text">${formatProgress(task.overallProgress)}%</span></td>
          <td>${formatDateTime(task.updatedAt)}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-secondary" data-action="edit" data-id="${task.id}">编辑</button>
              <button class="btn btn-danger" data-action="delete" data-id="${task.id}">删除</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  elements.taskTableBody.innerHTML = rowsHtml;
}

function renderStats() {
  const total = tasks.length;
  const avg =
    total === 0
      ? 0
      : tasks.reduce((sum, task) => sum + Number(task.overallProgress || 0), 0) / total;
  const doing = tasks.filter((task) => task.overallProgress > 0 && task.overallProgress < 100).length;
  const done = tasks.filter((task) => Number(task.overallProgress) === 100).length;

  elements.totalCount.textContent = String(total);
  elements.avgProgress.textContent = `${formatProgress(avg)}%`;
  elements.doingCount.textContent = String(doing);
  elements.doneCount.textContent = String(done);
}

function startEditing(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    showToast("Task not found", true);
    return;
  }

  editingTaskId = task.id;
  elements.formTitle.textContent = `编辑任务 #${task.id}`;
  elements.submitBtn.textContent = "更新任务";

  elements.taskTitle.value = task.taskTitle || "";
  elements.taskDescription.value = task.taskDescription || "";
  elements.phase1Status.value = task.phase1Status;
  elements.phase2Status.value = task.phase2Status;
  elements.phase3Status.value = task.phase3Status;

  openTaskModal();
}

function resetForm() {
  editingTaskId = null;
  elements.formTitle.textContent = "新建任务";
  elements.submitBtn.textContent = "保存任务";
  elements.taskForm.reset();

  elements.phase1Status.value = "TODO";
  elements.phase2Status.value = "TODO";
  elements.phase3Status.value = "TODO";
}

async function handleSubmit(event) {
  event.preventDefault();

  const payload = {
    taskTitle: elements.taskTitle.value.trim(),
    taskDescription: elements.taskDescription.value.trim(),
    phase1Status: elements.phase1Status.value,
    phase2Status: elements.phase2Status.value,
    phase3Status: elements.phase3Status.value
  };

  if (!payload.taskTitle) {
    showToast("Task Title 不能为空", true);
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
      showToast("任务更新成功");
    } else {
      await request(TASKS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      showToast("任务创建成功");
    }

    closeTaskModal();
    await loadTasks();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function removeTask(taskId) {
  const confirmed = window.confirm(`确认删除任务 #${taskId} 吗？`);
  if (!confirmed) {
    return;
  }

  try {
    await request(`${TASKS_API_URL}/${taskId}`, {
      method: "DELETE"
    });

    if (editingTaskId === taskId) {
      closeTaskModal();
    }

    showToast("任务删除成功");
    await loadTasks();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const isJson = (response.headers.get("content-type") || "").includes("application/json");
  const body = isJson ? await response.json() : null;

  if (!response.ok || !body?.success) {
    const message = body?.message || `Request failed (${response.status})`;
    const detail = body?.errors ? Object.values(body.errors).join("; ") : "";
    throw new Error(detail ? `${message}: ${detail}` : message);
  }

  return body;
}

function renderStatus(status) {
  const classMap = {
    TODO: "status-todo",
    DOING: "status-doing",
    DONE: "status-done"
  };
  const statusClass = classMap[status] || "status-todo";
  return `<span class="status-pill ${statusClass}">${status}</span>`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatProgress(value) {
  return Number(value || 0).toFixed(1);
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
