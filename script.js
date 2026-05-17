const STORAGE_KEY = "kanban-pro-tasks";

const taskForm = document.getElementById("taskForm");
const titleInput = document.getElementById("titleInput");
const statusInput = document.getElementById("statusInput");
const priorityInput = document.getElementById("priorityInput");
const dateInput = document.getElementById("dateInput");
const searchInput = document.getElementById("searchInput");
const priorityFilter = document.getElementById("priorityFilter");
const clearAllBtn = document.getElementById("clearAllBtn");

const lists = {
  todo: document.getElementById("todoList"),
  doing: document.getElementById("doingList"),
  done: document.getElementById("doneList"),
};

const stats = {
  total: document.getElementById("totalStat"),
  todo: document.getElementById("todoStat"),
  doing: document.getElementById("doingStat"),
  done: document.getElementById("doneStat"),
};

let tasks = loadTasks();

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function addTask({ title, status, priority, dueDate }) {
  tasks.push({
    id: crypto.randomUUID(),
    title,
    status,
    priority,
    dueDate,
    createdAt: new Date().toISOString(),
  });

  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

function moveTask(id, status) {
  tasks = tasks.map((task) => task.id === id ? { ...task, status } : task);
  saveTasks();
  render();
}

function duplicateTask(id) {
  const original = tasks.find((task) => task.id === id);
  if (!original) return;

  tasks.push({
    ...original,
    id: crypto.randomUUID(),
    title: `${original.title} (Copy)`,
    createdAt: new Date().toISOString(),
  });

  saveTasks();
  render();
}

function filteredTasks(status) {
  const search = searchInput.value.trim().toLowerCase();
  const priority = priorityFilter.value;

  return tasks
    .filter((task) => task.status === status)
    .filter((task) => task.title.toLowerCase().includes(search))
    .filter((task) => priority === "all" || task.priority === priority)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function createTaskElement(task) {
  const article = document.createElement("article");
  article.className = "task";

  article.innerHTML = `
    <h3>${escapeHtml(task.title)}</h3>
    <div class="meta">
      <span class="badge ${task.priority}">${task.priority.toUpperCase()}</span>
      <span>Due: ${task.dueDate}</span>
    </div>
    <div class="actions">
      <button data-action="todo">To Do</button>
      <button data-action="doing">Doing</button>
      <button data-action="done">Done</button>
      <button data-action="duplicate">Duplicate</button>
      <button data-action="delete" class="danger">Delete</button>
    </div>
  `;

  article.querySelector(".actions").addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    if (!action) return;

    if (action === "delete") {
      deleteTask(task.id);
    } else if (action === "duplicate") {
      duplicateTask(task.id);
    } else {
      moveTask(task.id, action);
    }
  });

  return article;
}

function renderColumn(status) {
  const list = lists[status];
  const items = filteredTasks(status);

  list.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No tasks here.";
    list.appendChild(empty);
    return;
  }

  items.forEach((task) => {
    list.appendChild(createTaskElement(task));
  });
}

function updateStats() {
  stats.total.textContent = tasks.length;
  stats.todo.textContent = tasks.filter((task) => task.status === "todo").length;
  stats.doing.textContent = tasks.filter((task) => task.status === "doing").length;
  stats.done.textContent = tasks.filter((task) => task.status === "done").length;
}

function render() {
  renderColumn("todo");
  renderColumn("doing");
  renderColumn("done");
  updateStats();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  addTask({
    title: titleInput.value.trim(),
    status: statusInput.value,
    priority: priorityInput.value,
    dueDate: dateInput.value,
  });

  taskForm.reset();
  priorityInput.value = "medium";
  statusInput.value = "todo";
});

searchInput.addEventListener("input", render);
priorityFilter.addEventListener("change", render);

clearAllBtn.addEventListener("click", () => {
  if (confirm("Delete all tasks?")) {
    tasks = [];
    saveTasks();
    render();
  }
});

render();
