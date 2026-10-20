// 每一天的清单都保存在浏览器的 localStorage 中，不需要数据库或账号。
const STORAGE_KEY = "daily-todo-items";

const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const dateInput = document.querySelector("#date-input");
const dateLabel = document.querySelector("#date-label");
const summary = document.querySelector("#summary");
const emptyState = document.querySelector("#empty-state");
const clearCompletedButton = document.querySelector("#clear-completed");
const itemTemplate = document.querySelector("#todo-item-template");

// 用本地日期生成 YYYY-MM-DD，避免 UTC 时区导致日期偏移。
function getTodayKey() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now - timezoneOffset).toISOString().slice(0, 10);
}

function readTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveTodos(todosByDate) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todosByDate));
}

function getSelectedTodos() {
  const todosByDate = readTodos();
  return todosByDate[dateInput.value] || [];
}

function formatDate(dateKey) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${dateKey}T00:00:00`));
}

function updateSummary(todos) {
  const completedCount = todos.filter((todo) => todo.completed).length;
  const remainingCount = todos.length - completedCount;

  if (todos.length === 0) {
    summary.textContent = "还没有代办事项";
  } else if (remainingCount === 0) {
    summary.textContent = `已完成全部 ${todos.length} 项，做得好！`;
  } else {
    summary.textContent = `还有 ${remainingCount} 项待完成（共 ${todos.length} 项）`;
  }
}

function renderTodos() {
  const todos = getSelectedTodos();
  todoList.replaceChildren();

  todos.forEach((todo) => {
    const item = itemTemplate.content.firstElementChild.cloneNode(true);
    const checkbox = item.querySelector(".todo-checkbox");
    const text = item.querySelector(".todo-text");
    const deleteButton = item.querySelector(".delete-button");

    checkbox.checked = todo.completed;
    text.textContent = todo.text;
    item.classList.toggle("is-completed", todo.completed);

    checkbox.addEventListener("change", () => updateTodo(todo.id, { completed: checkbox.checked }));
    deleteButton.addEventListener("click", () => deleteTodo(todo.id));
    todoList.append(item);
  });

  dateLabel.textContent = formatDate(dateInput.value);
  emptyState.hidden = todos.length > 0;
  clearCompletedButton.hidden = !todos.some((todo) => todo.completed);
  updateSummary(todos);
}

function addTodo(text) {
  const todosByDate = readTodos();
  const currentTodos = todosByDate[dateInput.value] || [];
  const newTodo = {
    id: crypto.randomUUID(),
    text,
    completed: false,
  };

  todosByDate[dateInput.value] = [...currentTodos, newTodo];
  saveTodos(todosByDate);
  renderTodos();
}

function updateTodo(id, changes) {
  const todosByDate = readTodos();
  const currentTodos = todosByDate[dateInput.value] || [];

  todosByDate[dateInput.value] = currentTodos.map((todo) =>
    todo.id === id ? { ...todo, ...changes } : todo,
  );
  saveTodos(todosByDate);
  renderTodos();
}

function deleteTodo(id) {
  const todosByDate = readTodos();
  const currentTodos = todosByDate[dateInput.value] || [];

  todosByDate[dateInput.value] = currentTodos.filter((todo) => todo.id !== id);
  saveTodos(todosByDate);
  renderTodos();
}

function clearCompletedTodos() {
  const todosByDate = readTodos();
  const currentTodos = todosByDate[dateInput.value] || [];

  todosByDate[dateInput.value] = currentTodos.filter((todo) => !todo.completed);
  saveTodos(todosByDate);
  renderTodos();
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();

  if (!text) return;

  addTodo(text);
  todoInput.value = "";
  todoInput.focus();
});

dateInput.addEventListener("change", renderTodos);
clearCompletedButton.addEventListener("click", clearCompletedTodos);

dateInput.value = getTodayKey();
renderTodos();
