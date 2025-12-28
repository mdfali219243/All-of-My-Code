document.addEventListener('DOMContentLoaded', () => {
    const boardContainer = document.querySelector('.board-container');
    const addListBtn = document.getElementById('addListBtn');

    // State for Columns
    let columnsState = [];

    // Initialize the board
    initializeBoard();

    function initializeBoard() {
        // 1. Load Column State
        const savedColumns = localStorage.getItem('kanban-columns');
        if (savedColumns) {
            columnsState = JSON.parse(savedColumns);
        } else {
            // Default Columns
            columnsState = [
                { id: 'todo-list', title: 'To Do' },
                { id: 'inprogress-list', title: 'In Progress' },
                { id: 'done-list', title: 'Done' }
            ];
            saveColumns();
        }

        // 2. Clear existing hardcoded columns (if any) to avoid duplication
        // We only want to keep the addListBtn
        const existingColumns = document.querySelectorAll('.column');
        existingColumns.forEach(col => col.remove());

        // 3. Render Columns
        columnsState.forEach(col => {
            renderColumn(col.id, col.title);
        });

        // 4. Load Tasks into the rendered columns
        loadTasks();

        // 5. Update counts initially
        updateTaskCounts();
    }

    // --- Column Management ---

    function renderColumn(id, title) {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'column';
        columnDiv.innerHTML = `
            <div class="column-header">
                <span>${title}</span>
                <span class="text-sm text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full count-badge">0</span>
            </div>
            <div class="task-list" id="${id}">
                <!-- Tasks injected here -->
            </div>
            <button class="add-task-btn" data-column="${id}">
                <i class="fas fa-plus"></i> Add Card
            </button>
        `;

        // Insert before the Add List button
        boardContainer.insertBefore(columnDiv, addListBtn);

        // Attach Event Listeners for this column
        const taskList = columnDiv.querySelector('.task-list');
        const addTaskBtn = columnDiv.querySelector('.add-task-btn');

        // Drag Over
        taskList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(taskList, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (draggable) {
                if (afterElement == null) {
                    taskList.appendChild(draggable);
                } else {
                    taskList.insertBefore(draggable, afterElement);
                }
            }
        });

        // Add Task Button
        addTaskBtn.addEventListener('click', () => {
            showInlineInput(id, addTaskBtn);
        });
    }

    function showInlineInput(columnId, addBtn) {
        // Hide the add button
        addBtn.style.display = 'none';

        // Create the form container
        const formContainer = document.createElement('div');
        formContainer.className = 'input-card-container';
        formContainer.innerHTML = `
            <textarea class="task-input-card" placeholder="Enter a title for this card..." rows="3"></textarea>
            <div class="input-controls">
                <button class="confirm-add-btn">Add Card</button>
                <button class="cancel-add-btn"><i class="fas fa-times"></i></button>
            </div>
        `;

        // Insert after the button (which is hidden)
        addBtn.parentElement.insertBefore(formContainer, addBtn.nextSibling);

        const textarea = formContainer.querySelector('textarea');
        const confirmBtn = formContainer.querySelector('.confirm-add-btn');
        const cancelBtn = formContainer.querySelector('.cancel-add-btn');

        // Auto-focus
        textarea.focus();

        // Submit Handler
        const submit = () => {
            const text = textarea.value.trim();
            if (text) {
                createTaskElement(text, columnId);
                saveTasks();
                updateTaskCounts();
                textarea.value = ''; // Clear for next input
                textarea.focus();

                // Scroll to bottom of list to see new task
                const taskList = document.getElementById(columnId);
                if (taskList) taskList.scrollTop = taskList.scrollHeight;
            } else {
                textarea.focus();
            }
        };

        // Cancel Handler
        const close = () => {
            formContainer.remove();
            addBtn.style.display = 'flex';
        };

        confirmBtn.addEventListener('click', submit);
        cancelBtn.addEventListener('click', close);

        // Keydown Handler (Enter to submit, Esc to cancel)
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
            }
            if (e.key === 'Escape') {
                close();
            }
        });
    }

    function saveColumns() {
        localStorage.setItem('kanban-columns', JSON.stringify(columnsState));
    }

    // "Add List" Button Logic
    if (addListBtn) {
        addListBtn.addEventListener('click', () => {
            const title = prompt("Enter list title:");
            if (title && title.trim()) {
                const newId = 'list-' + Date.now();
                const newTitle = title.trim();

                // Update State
                columnsState.push({ id: newId, title: newTitle });
                saveColumns();

                // Render
                renderColumn(newId, newTitle);
            }
        });
    }

    // --- Task Management & Drag/Drop ---

    // Drag and Drop Helper
    let draggedItem = null;

    function addDragListeners(item) {
        item.addEventListener('dragstart', () => {
            draggedItem = item;
            setTimeout(() => item.classList.add('dragging'), 0);
        });

        item.addEventListener('dragend', () => {
            setTimeout(() => {
                item.classList.remove('dragging');
                draggedItem = null;
                saveTasks(); // Save state after move
                updateTaskCounts(); // Update counts after move
            }, 0);
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Update Counts
    function updateTaskCounts() {
        columnsState.forEach(col => {
            const list = document.getElementById(col.id);
            if (list) {
                const count = list.children.length;
                const columnDiv = list.closest('.column');
                const badge = columnDiv.querySelector('.count-badge');
                if (badge) {
                    badge.textContent = count;
                }
            }
        });
    }

    // Create Task Element
    function createTaskElement(text, columnId, isCompleted = false) {
        const card = document.createElement('div');
        card.classList.add('task-card');
        if (isCompleted) {
            card.classList.add('completed');
        }
        card.setAttribute('draggable', 'true');

        // Create task content wrapper
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';

        // Add circle check button
        const checkBtn = document.createElement('button');
        checkBtn.className = 'check-btn' + (isCompleted ? ' checked' : '');
        checkBtn.innerHTML = '<i class="fas fa-check"></i>';
        checkBtn.title = isCompleted ? 'Mark as incomplete' : 'Mark as complete';

        checkBtn.onclick = (e) => {
            e.stopPropagation();
            const wasCompleted = card.classList.contains('completed');

            if (!wasCompleted) {
                // Completing the task - celebrate!
                const rect = checkBtn.getBoundingClientRect();
                createConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);

                // Get task text for celebration message
                const taskTextContent = taskTextSpan.textContent;
                showCelebration(taskTextContent);

                // Add completion animations
                card.classList.add('completing');
                checkBtn.classList.add('checked');

                setTimeout(() => {
                    card.classList.remove('completing');
                    card.classList.add('completed');

                    // Move to Done column if it exists
                    const doneColumn = document.getElementById('done-list');
                    if (doneColumn && card.parentElement.id !== 'done-list') {
                        doneColumn.insertBefore(card, doneColumn.firstChild);
                    }
                    saveTasks();
                    updateTaskCounts();
                }, 600);
            } else {
                // Uncompleting the task
                card.classList.remove('completed');
                checkBtn.classList.remove('checked');

                // Move back to To Do column if it exists
                const todoColumn = document.getElementById('todo-list');
                if (todoColumn && card.parentElement.id !== 'todo-list') {
                    todoColumn.appendChild(card);
                }
                saveTasks();
                updateTaskCounts();
            }
        };

        // Task text
        const taskTextSpan = document.createElement('span');
        taskTextSpan.className = 'task-text';
        taskTextSpan.textContent = text;

        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.title = 'Delete task';

        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('Delete this task?')) {
                card.classList.add('deleting');
                setTimeout(() => {
                    card.remove();
                    saveTasks();
                    updateTaskCounts();
                }, 300);
            }
        };

        taskContent.appendChild(checkBtn);
        taskContent.appendChild(taskTextSpan);
        taskContent.appendChild(deleteBtn);
        card.appendChild(taskContent);

        addDragListeners(card);

        const column = document.getElementById(columnId);
        if (column) {
            column.appendChild(card);
        } else {
            console.warn(`Column ${columnId} not found for task: ${text}`);
            // Fallback: Add to first available column or Todo
            const firstCol = document.querySelector('.task-list');
            if (firstCol) firstCol.appendChild(card);
        }
    }

    // --- Persistence ---

    function saveTasks() {
        const boardState = {};
        // Iterate over current columns state to ensure we save all keys
        columnsState.forEach(col => {
            const list = document.getElementById(col.id);
            if (list) {
                const tasks = [];
                list.querySelectorAll('.task-card').forEach(card => {
                    const taskTextEl = card.querySelector('.task-text');
                    const isCompleted = card.classList.contains('completed');
                    if (taskTextEl) {
                        tasks.push({
                            text: taskTextEl.textContent.trim(),
                            completed: isCompleted
                        });
                    }
                });
                boardState[col.id] = tasks;
            }
        });
        localStorage.setItem('kanban-board', JSON.stringify(boardState));
    }

    function loadTasks() {
        const savedState = JSON.parse(localStorage.getItem('kanban-board'));
        if (savedState) {
            for (const [colId, tasks] of Object.entries(savedState)) {
                // Check if column exists in our current rendered columns
                // If the column ID from saved tasks isn't in columnsState, 
                // those tasks will be invisible or lost unless we handle them.
                // For now, valid columns are defined by 'kanban-columns'.

                const columnEl = document.getElementById(colId);
                if (columnEl && Array.isArray(tasks)) {
                    tasks.forEach(task => {
                        if (typeof task === 'string') {
                            const isCompleted = colId === 'done-list';
                            createTaskElement(task, colId, isCompleted);
                        } else {
                            createTaskElement(task.text, colId, task.completed);
                        }
                    });
                }
            }
        } else {
            // Default tasks for demo (only if no data exists)
            createTaskElement("Design new dashboard", "todo-list", false);
            createTaskElement("Fix login bug", "inprogress-list", false);
            createTaskElement("Deploy to production", "done-list", true);
            saveTasks();
        }
    }

    // --- Visual Effects (Confetti) ---
    function createConfetti(x, y) {
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#a8e6cf', '#dfe6e9', '#fd79a8', '#6c5ce7'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = x + 'px';
            confetti.style.top = y + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.setProperty('--tx', (Math.random() - 0.5) * 300 + 'px');
            confetti.style.setProperty('--ty', (Math.random() - 0.5) * 300 + 'px');
            confetti.style.setProperty('--r', Math.random() * 720 - 360 + 'deg');
            confetti.style.animationDelay = Math.random() * 0.3 + 's';
            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 1500);
        }
    }

    function showCelebration(taskText) {
        const celebration = document.createElement('div');
        celebration.className = 'celebration-message';
        celebration.innerHTML = `
            <div class="celebration-icon">🎉</div>
            <div class="celebration-text">Task Completed!</div>
            <div class="celebration-task">${taskText}</div>
        `;
        document.body.appendChild(celebration);

        setTimeout(() => {
            celebration.classList.add('fade-out');
            setTimeout(() => celebration.remove(), 500);
        }, 2000);
    }

    // --- Chat Focus Effects (Keep existing logic) ---
    const chatInput = document.getElementById('calendarChatInput');
    const chatSendBtn = document.getElementById('calendarChatSendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const header = document.querySelector('.header');
    const chatOverlay = document.getElementById('chatOverlay');
    const closeChatBtn = document.getElementById('closeChatBtn');

    if (chatInput) {
        chatInput.addEventListener('focus', () => {
            if (boardContainer) boardContainer.classList.add('blur-content');
            if (header) header.classList.add('blur-content');
            if (chatOverlay) chatOverlay.classList.add('active');
            if (closeChatBtn) closeChatBtn.style.display = 'flex';
        });

        const closeChatFocus = (endChat = false) => {
            if (boardContainer) boardContainer.classList.remove('blur-content');
            if (header) header.classList.remove('blur-content');
            if (chatOverlay) chatOverlay.classList.remove('active');
            if (closeChatBtn) closeChatBtn.style.display = 'none';
            chatInput.blur();

            if (endChat) {
                if (chatMessages) chatMessages.innerHTML = '';
                chatInput.value = '';
                fetch('http://127.0.0.1:5001/api/reset', { method: 'POST' })
                    .catch(err => console.error("Failed to reset chat:", err));
            }
        };

        if (chatOverlay) {
            chatOverlay.addEventListener('click', () => closeChatFocus(false));
        }

        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', () => closeChatFocus(true));
        }

        // Chat Logic
        const handleChatSubmit = () => {
            const text = chatInput.value.trim();
            if (!text) return;

            addMessage(text, 'user');
            chatInput.value = '';

            const loadingBubble = document.createElement('div');
            loadingBubble.classList.add('message-bubble', 'ai', 'loading');
            loadingBubble.textContent = '...';
            chatMessages.appendChild(loadingBubble);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            fetch('http://127.0.0.1:5001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            })
                .then(response => response.json())
                .then(data => {
                    loadingBubble.remove();
                    const reply = data.reply || "I'm having trouble connecting to my brain right now.";
                    addMessage(reply, 'ai');

                    if (data.actions && data.actions.length > 0) {
                        data.actions.forEach(action => {
                            if (action.type === 'ADD_TASK' && action.data) {
                                createTaskElement(action.data.title, 'todo-list');
                                saveTasks();
                                updateTaskCounts();
                            }
                            // ADD_EVENT logic for Tasks page (saving to localStorage)
                            if (action.type === 'ADD_EVENT' && action.data) {
                                const events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
                                events.push({
                                    id: `event-${Date.now()}`,
                                    title: action.data.title,
                                    date: action.data.date,
                                    allDay: false,
                                    startTime: action.data.time || '09:00',
                                    endTime: action.data.time ? `${parseInt(action.data.time.split(':')[0]) + 1}:00` : '10:00',
                                    description: '',
                                    color: '#4285F4'
                                });
                                localStorage.setItem('calendarEvents', JSON.stringify(events));
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    loadingBubble.remove();
                    addMessage("Sorry, I can't connect to the server. Is it running?", 'ai');
                });
        };

        const addMessage = (text, sender) => {
            if (!chatMessages) return;
            const bubble = document.createElement('div');
            bubble.classList.add('message-bubble', sender);
            bubble.textContent = text;
            chatMessages.appendChild(bubble);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };

        if (chatSendBtn) {
            chatSendBtn.addEventListener('click', handleChatSubmit);
        }

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleChatSubmit();
            }
        });
    }
});
