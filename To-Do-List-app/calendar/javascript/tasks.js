document.addEventListener('DOMContentLoaded', () => {
    const columns = document.querySelectorAll('.task-list');
    const addTaskBtns = document.querySelectorAll('.add-task-btn');

    // Load tasks from local storage
    loadTasks();

    // Drag and Drop Functionality
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
            }, 0);
        });
    }

    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(column, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                column.appendChild(draggable);
            } else {
                column.insertBefore(draggable, afterElement);
            }
        });
    });

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

    // Add Task Functionality
    addTaskBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const columnId = btn.getAttribute('data-column');
            const taskText = prompt("Enter task description:");
            if (taskText) {
                createTaskElement(taskText, columnId);
                saveTasks();
            }
        });
    });

    // Confetti celebration animation
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

    // Show celebration message
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
                const taskTextContent = taskText.textContent;
                showCelebration(taskTextContent);

                // Add completion animations
                card.classList.add('completing');
                checkBtn.classList.add('checked');

                setTimeout(() => {
                    card.classList.remove('completing');
                    card.classList.add('completed');

                    // Move to Done column
                    const doneColumn = document.getElementById('done-list');
                    if (doneColumn && card.parentElement.id !== 'done-list') {
                        doneColumn.insertBefore(card, doneColumn.firstChild);
                    }
                    saveTasks();
                }, 600);
            } else {
                // Uncompleting the task
                card.classList.remove('completed');
                checkBtn.classList.remove('checked');

                // Move back to To Do column
                const todoColumn = document.getElementById('todo-list');
                if (todoColumn && card.parentElement.id !== 'todo-list') {
                    todoColumn.appendChild(card);
                }
                saveTasks();
            }
        };

        // Task text
        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = text;

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
                }, 300);
            }
        };

        taskContent.appendChild(checkBtn);
        taskContent.appendChild(taskText);
        taskContent.appendChild(deleteBtn);
        card.appendChild(taskContent);

        addDragListeners(card);

        const column = document.getElementById(columnId);
        column.appendChild(card);
    }

    // Local Storage
    function saveTasks() {
        const boardState = {};
        columns.forEach(col => {
            const colId = col.id;
            const tasks = [];
            col.querySelectorAll('.task-card').forEach(card => {
                // Get text content from the task-text element
                const taskTextEl = card.querySelector('.task-text');
                const isCompleted = card.classList.contains('completed');
                if (taskTextEl) {
                    tasks.push({
                        text: taskTextEl.textContent.trim(),
                        completed: isCompleted
                    });
                }
            });
            boardState[colId] = tasks;
        });
        localStorage.setItem('kanban-board', JSON.stringify(boardState));
    }

    function loadTasks() {
        const savedState = JSON.parse(localStorage.getItem('kanban-board'));
        if (savedState) {
            for (const [colId, tasks] of Object.entries(savedState)) {
                tasks.forEach(task => {
                    // Handle both old format (string) and new format (object)
                    if (typeof task === 'string') {
                        const isCompleted = colId === 'done-list';
                        createTaskElement(task, colId, isCompleted);
                    } else {
                        createTaskElement(task.text, colId, task.completed);
                    }
                });
            }
        } else {
            // Default tasks for demo
            createTaskElement("Design new dashboard", "todo-list", false);
            createTaskElement("Fix login bug", "inprogress-list", false);
            createTaskElement("Deploy to production", "done-list", true);
        }
    }
    // Floating Chat Focus Effects (Replicated from index.js)
    const chatInput = document.getElementById('calendarChatInput');
    const chatSendBtn = document.getElementById('calendarChatSendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const boardContainer = document.querySelector('.board-container'); // Main view for tasks
    const header = document.querySelector('.header');
    const chatOverlay = document.getElementById('chatOverlay');
    const closeChatBtn = document.getElementById('closeChatBtn');

    if (chatInput) {
        // When chat is focused, blur background and show overlay
        chatInput.addEventListener('focus', () => {
            if (boardContainer) boardContainer.classList.add('blur-content');
            if (header) header.classList.add('blur-content');
            if (chatOverlay) chatOverlay.classList.add('active');
            if (closeChatBtn) closeChatBtn.style.display = 'flex';
        });

        // Function to close chat focus
        // param endChat: boolean, if true, clears the chat session (for close button)
        const closeChatFocus = (endChat = false) => {
            if (boardContainer) boardContainer.classList.remove('blur-content');
            if (header) header.classList.remove('blur-content');
            if (chatOverlay) chatOverlay.classList.remove('active');
            if (closeChatBtn) closeChatBtn.style.display = 'none';
            chatInput.blur(); // Remove focus from input

            // Clear chat session ONLY if requested (Close button)
            if (endChat) {
                if (chatMessages) chatMessages.innerHTML = '';
                chatInput.value = '';

                // Tell server to reset conversation history
                fetch('http://127.0.0.1:5001/api/reset', {
                    method: 'POST'
                }).catch(err => console.error("Failed to reset chat:", err));
            }
        };

        // Clicking the overlay closes the chat session (removes blur) - PRESERVE HISTORY
        if (chatOverlay) {
            chatOverlay.addEventListener('click', () => closeChatFocus(false));
        }

        // Clicking the close button also closes the chat session - CLEAR HISTORY
        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', () => closeChatFocus(true));
        }

        // Chat Logic
        const handleChatSubmit = () => {
            const text = chatInput.value.trim();
            if (!text) return;

            // 1. Add User Message
            addMessage(text, 'user');
            chatInput.value = '';

            // 2. Call AI Backend
            const loadingBubble = document.createElement('div');
            loadingBubble.classList.add('message-bubble', 'ai', 'loading');
            loadingBubble.textContent = '...';
            chatMessages.appendChild(loadingBubble);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            fetch('http://127.0.0.1:5001/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            })
                .then(response => response.json())
                .then(data => {
                    loadingBubble.remove();
                    const reply = data.reply || "I'm having trouble connecting to my brain right now.";
                    addMessage(reply, 'ai');

                    // Process any actions from the AI
                    if (data.actions && data.actions.length > 0) {
                        data.actions.forEach(action => {
                            if (action.type === 'ADD_TASK' && action.data) {
                                // Add task directly to the page
                                createTaskElement(action.data.title, 'todo-list');
                                saveTasks();
                            }
                            if (action.type === 'ADD_EVENT' && action.data) {
                                // Save event to localStorage (events are on calendar page)
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
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };

        if (chatSendBtn) {
            chatSendBtn.addEventListener('click', handleChatSubmit);
        }

        // Use keydown for better compatibility
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleChatSubmit();
            }
        });
    }
});
