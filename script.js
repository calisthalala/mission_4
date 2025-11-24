// ====== Elements ======
const priorityOptions = document.querySelectorAll('.priority-option');
const modeToggle = document.getElementById('mode-toggle');
const prioritySelector = document.getElementById('priority-selector');
const prioritySlider = document.getElementById('priority-slider');
const taskDateInput = document.getElementById('task-date');
const taskTimeInput = document.getElementById('task-time');

const addBtn = document.getElementById('add-btn');
const taskInput = document.getElementById('task-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const themeButtons = document.querySelectorAll('.theme-btn');
const taskList = document.getElementById('task-list');
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');

// ====== State ======
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentPriority = 'medium';
let currentTheme = 'purple-blue';
let darkMode = localStorage.getItem('darkMode') !== 'false'; // default true unless explicitly 'false'

// set default rgb variables (as fallback)
document.documentElement.style.setProperty('--primary-rgb', '138, 43, 226');
document.documentElement.style.setProperty('--secondary-rgb', '0, 198, 251');
document.documentElement.style.setProperty('--success-rgb', '0, 230, 118');
document.documentElement.style.setProperty('--danger-rgb', '255, 77, 77');

// ====== Helpers ======
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function hexToRgb(hex) {
    // expects format "#rrggbb"
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

// ====== Priority slider update ======
function updatePrioritySlider() {
    const selectedOption = document.querySelector('.priority-option.selected');
    if (!selectedOption || !prioritySelector || !prioritySlider) return;

    const optionRect = selectedOption.getBoundingClientRect();
    const containerRect = prioritySelector.getBoundingClientRect();

    const left = optionRect.left - containerRect.left - 3; // tweak offset if needed
    prioritySlider.style.transform = `translateX(${left}px)`;

    let colorVar;
    switch (currentPriority) {
        case 'high':
            colorVar = 'var(--high-priority)';
            break;
        case 'medium':
            colorVar = 'var(--medium-priority)';
            break;
        case 'low':
        default:
            colorVar = 'var(--low-priority)';
            break;
    }
    // boxShadow with computed style color
    const computed = getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#8a2be2';
    prioritySlider.style.boxShadow = `0 0 10px ${colorVar}`;
}

// ====== Theme functions ======
function applyColorTheme(theme) {
    let primary, primaryDark, secondary;

    switch (theme) {
        case 'purple-blue':
            primary = '#8a2be2';
            primaryDark = '#5f1d9e';
            secondary = '#00c6fb';
            break;
        case 'red-yellow':
            primary = '#ff4d4d';
            primaryDark = '#d63031';
            secondary = '#fdcb6e';
            break;
        case 'purple-pink':
            primary = '#6c5ce7';
            primaryDark = '#5649d2';
            secondary = '#ff6fbf';
            break;
        case 'orange-yellow':
            primary = '#e17055';
            primaryDark = '#d63031';
            secondary = '#fdcb6e';
            break;
        default:
            primary = '#8a2be2';
            primaryDark = '#5f1d9e';
            secondary = '#00c6fb';
    }

    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--primary-dark', primaryDark);
    document.documentElement.style.setProperty('--secondary', secondary);

    const primaryRgb = hexToRgb(primary).join(', ');
    const secondaryRgb = hexToRgb(secondary).join(', ');
    document.documentElement.style.setProperty('--primary-rgb', primaryRgb);
    document.documentElement.style.setProperty('--secondary-rgb', secondaryRgb);

    // update slider colors if needed
    updatePrioritySlider();
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (modeToggle) {
        modeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        modeToggle.setAttribute('title', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }
}

// ====== Task operations ======
function formatDueDate(dateStr, timeStr) {
    if (!dateStr && !timeStr) return '';
    if (!dateStr) return timeStr ? `Due at ${timeStr}` : '';

    const dateObj = new Date(dateStr);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    let formatted = dateObj.toLocaleDateString('en-US', options);

    if (timeStr) {
        formatted += ` at ${timeStr}`;
    }
    return formatted;
}

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') {
        animateInputError();
        return;
    }

    const date = taskDateInput.value;
    const time = taskTimeInput.value;
    const formattedDate = formatDueDate(date, time);

    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        priority: currentPriority,
        createdAt: new Date().toISOString(),
        dueDate: date || null,
        dueTime: time || null,
        formattedDate
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();

    taskInput.value = '';
    taskInput.focus();

    // small add button animation
    if (addBtn) {
        addBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            addBtn.style.transform = 'scale(1)';
        }, 150);
    }
}

function animateInputError() {
    if (!taskInput) return;
    taskInput.style.borderColor = 'var(--danger)';

    const animation = taskInput.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(0)' }
    ], {
        duration: 100,
        iterations: 3
    });

    setTimeout(() => {
        taskInput.style.borderColor = '';
    }, 1000);
}

function toggleTaskComplete(taskId) {
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;

    tasks[idx].completed = !tasks[idx].completed;
    saveTasks();
    renderTasks();
    updateStats();
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
    updateStats();
}

// ====== Render ======
function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = '';

    let filtered = tasks;
    if (currentFilter === 'active') filtered = tasks.filter(t => !t.completed);
    else if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);

    if (filtered.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-state';

        if (currentFilter === 'all') {
            emptyMessage.innerHTML = '<i class="fas fa-tasks"></i> <h3>No tasks yet!</h3> <p>Add your first task to get started</p>';
        } else if (currentFilter === 'active') {
            emptyMessage.innerHTML = '<i class="fas fa-clock"></i> <h3>No Active Tasks</h3> <p>You\'re all caught up</p>';
        } else {
            emptyMessage.innerHTML = '<i class="fas fa-check-circle"></i> <h3>No Completed Tasks</h3> <p>Complete some tasks to see them here</p>';
        }

        taskList.appendChild(emptyMessage);
        return;
    }

    filtered.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task ${task.completed ? 'completed' : ''}`;
        taskElement.dataset.id = task.id;

        const priorityClass = `priority-${task.priority}`;
        const priorityIndicator = `<div class="priority-indicator ${priorityClass}"></div>`;

        const dateDisplay = task.formattedDate ? `
            <div class="task-meta">
                <div class="task-date">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${task.formattedDate}</span>
                </div>
            </div>` : '';

        // checkbox checked attribute
        const checkedAttr = task.completed ? 'checked' : '';

        taskElement.innerHTML = `
            ${priorityIndicator}
            <label class="checkbox-container">
                <input type="checkbox" ${checkedAttr}>
                <span class="checkmark"></span>
            </label>

            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                ${dateDisplay}
            </div>

            <div class="task-actions">
                <button class="task-btn complete-btn" title="${task.completed ? 'Mark as incomplete' : 'Mark as completed'}">
                    <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                </button>

                <button class="task-btn delete-btn" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        taskList.appendChild(taskElement);

        // wire events
        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        const completeBtn = taskElement.querySelector('.complete-btn');
        const deleteBtn = taskElement.querySelector('.delete-btn');

        if (checkbox) checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
        if (completeBtn) completeBtn.addEventListener('click', () => toggleTaskComplete(task.id));
        if (deleteBtn) deleteBtn.addEventListener('click', () => deleteTask(task.id));
    });
}

// simple escape for task text to prevent accidental HTML injection
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====== Stats ======
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;

    if (totalTasksEl) totalTasksEl.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;
    if (completedTasksEl) completedTasksEl.textContent = `${completed} completed`;
}

// ====== Event listeners setup ======
function setupEventListeners() {
    if (addBtn) {
        addBtn.addEventListener('click', addTask);
    }
    if (taskInput) {
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter || 'all';
            renderTasks();
        });
    });

    themeButtons.forEach(button => {
        button.addEventListener('click', function() {
            themeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentTheme = this.dataset.theme || 'purple-blue';
            applyColorTheme(currentTheme);
        });
    });

    priorityOptions.forEach(option => {
        option.addEventListener('click', function() {
            priorityOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            currentPriority = (this.dataset.priority || 'medium').toLowerCase();
            updatePrioritySlider();

            // small press animation
            this.style.transform = 'scale(1.1)';
            setTimeout(() => {
                this.style.transform = 'scale(1.05)';
            }, 200);
        });
    });

    if (modeToggle) {
        modeToggle.addEventListener('click', toggleDarkMode);
    }

    window.addEventListener('resize', updatePrioritySlider);
}

// ====== Dark mode toggle ======
function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    setTheme(darkMode ? 'dark' : 'light');

    if (modeToggle) {
        modeToggle.style.transform = 'scale(1.2) rotate(180deg)';
        setTimeout(() => {
            modeToggle.style.transform = 'scale(1) rotate(0)';
        }, 300);
    }
}

// ====== Init ======
function init() {
    // set theme from darkMode state
    setTheme(darkMode ? 'dark' : 'light');

    // set default date/time to now
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const time = now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0');

    if (taskDateInput) taskDateInput.value = today;
    if (taskTimeInput) taskTimeInput.value = time;

    // mark priority option according to currentPriority
    const sel = document.querySelector(`.priority-option[data-priority="${currentPriority}"]`);
    if (sel) {
        priorityOptions.forEach(opt => opt.classList.remove('selected'));
        sel.classList.add('selected');
    }

    applyColorTheme(currentTheme);
    renderTasks();
    updateStats();
    setupEventListeners();
    updatePrioritySlider();

    // small entrance animation for selector
    if (prioritySelector) {
        setTimeout(() => {
            prioritySelector.style.transform = 'scale(1.05)';
            setTimeout(() => {
                prioritySelector.style.transform = 'scale(1)';
            }, 300);
        }, 500);
    }
}

// run init
init();
