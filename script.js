// DOM Elements
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task');
const todosList = document.getElementById('todos-list');
const itemsLeft = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');
const emptyState = document.getElementById('empty-state');
const dateElement = document.getElementById('date');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalTasksElement = document.getElementById('total-tasks');
const completedTasksElement = document.getElementById('completed-tasks');

// App State
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';
let editingTodoId = null;

// Initialize App
function init() {
  setDate();
  renderTodos();
  updateStats();
  attachEventListeners();
}

// Event Listeners
function attachEventListeners() {
  addTaskBtn.addEventListener('click', addTodo);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
  });
  
  clearCompletedBtn.addEventListener('click', clearCompleted);
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setFilter(btn.dataset.filter);
    });
  });
}

// Add Todo
function addTodo() {
  const text = taskInput.value.trim();
  
  if (!text) {
    showNotification('Please enter a task!', 'warning');
    return;
  }
  
  if (editingTodoId) {
    // Update existing todo
    todos = todos.map(todo => 
      todo.id === editingTodoId 
        ? { ...todo, text, updatedAt: new Date().toISOString() }
        : todo
    );
    editingTodoId = null;
    addTaskBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    showNotification('Task updated!', 'success');
  } else {
    // Add new todo
    const todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    todos.unshift(todo);
    showNotification('Task added!', 'success');
  }
  
  taskInput.value = '';
  saveTodos();
  renderTodos();
}

// Set Filter
function setFilter(filter) {
  currentFilter = filter;
  
  filterBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  
  renderTodos();
}

// Render Todos
function renderTodos() {
  const filteredTodos = getFilteredTodos();
  
  if (filteredTodos.length === 0) {
    emptyState.style.display = 'flex';
    todosList.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    todosList.style.display = 'block';
  }
  
  todosList.innerHTML = '';
  
  filteredTodos.forEach(todo => {
    const todoElement = createTodoElement(todo);
    todosList.appendChild(todoElement);
  });
}

// Create Todo Element
function createTodoElement(todo) {
  const li = document.createElement('li');
  li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
  li.setAttribute('data-id', todo.id);
  
  li.innerHTML = `
    <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
         onclick="toggleTodo(${todo.id})"></div>
    <span class="todo-text">${escapeHtml(todo.text)}</span>
    <div class="todo-actions">
      <button class="action-btn edit-btn" onclick="editTodo(${todo.id})">
        <i class="fas fa-edit"></i>
      </button>
      <button class="action-btn delete-btn" onclick="deleteTodo(${todo.id})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  
  return li;
}

// Toggle Todo Completion
function toggleTodo(id) {
  todos = todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  
  saveTodos();
  renderTodos();
  updateStats();
}

// Edit Todo
function editTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    taskInput.value = todo.text;
    taskInput.focus();
    editingTodoId = id;
    addTaskBtn.innerHTML = '<i class="fas fa-save"></i>';
  }
}

// Delete Todo
function deleteTodo(id) {
  if (confirm('Are you sure you want to delete this task?')) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
    updateStats();
    showNotification('Task deleted!', 'info');
  }
}

// Clear Completed
function clearCompleted() {
  const completedCount = todos.filter(todo => todo.completed).length;
  
  if (completedCount === 0) {
    showNotification('No completed tasks to clear!', 'info');
    return;
  }
  
  if (confirm(`Clear ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();
    updateStats();
    showNotification('Completed tasks cleared!', 'success');
  }
}

// Get Filtered Todos
function getFilteredTodos() {
  switch (currentFilter) {
    case 'active':
      return todos.filter(todo => !todo.completed);
    case 'completed':
      return todos.filter(todo => todo.completed);
    default:
      return todos;
  }
}

// Update Statistics
function updateStats() {
  const total = todos.length;
  const completed = todos.filter(todo => todo.completed).length;
  const active = total - completed;
  
  totalTasksElement.textContent = total;
  completedTasksElement.textContent = completed;
  itemsLeft.textContent = `${active} item${active !== 1 ? 's' : ''} left`;
}

// Save to Local Storage
function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
  updateStats();
}

// Set Current Date
function setDate() {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const today = new Date();
  dateElement.textContent = today.toLocaleDateString('en-US', options);
}

// Show Notification
function showNotification(message, type = 'info') {
  // Remove existing notification
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${getNotificationIcon(type)}"></i>
    <span>${message}</span>
  `;
  
  // Add styles for notification
  if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px 20px;
        border-radius: 12px;
        box-shadow: var(--shadow-hover);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        border-left: 4px solid;
      }
      
      .notification-success {
        border-left-color: var(--accent);
        color: #065f46;
      }
      
      .notification-warning {
        border-left-color: var(--warning);
        color: #92400e;
      }
      
      .notification-info {
        border-left-color: var(--primary);
        color: var(--text);
      }
      
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getNotificationIcon(type) {
  const icons = {
    success: 'check-circle',
    warning: 'exclamation-triangle',
    info: 'info-circle'
  };
  return icons[type] || 'info-circle';
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);