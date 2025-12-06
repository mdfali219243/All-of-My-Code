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

    function createTaskElement(text, columnId) {
        const card = document.createElement('div');
        card.classList.add('task-card');
        card.setAttribute('draggable', 'true');
        card.textContent = text;

        // Add delete button (optional, simple implementation)
        const deleteBtn = document.createElement('span');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.style.float = 'right';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.color = '#9ca3af';
        deleteBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent drag start
            if (confirm('Delete this task?')) {
                card.remove();
                saveTasks();
            }
        };
        card.appendChild(deleteBtn);

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
                // Get text content excluding the delete button
                const clone = card.cloneNode(true);
                const delBtn = clone.querySelector('span');
                if (delBtn) delBtn.remove();
                tasks.push(clone.textContent.trim());
            });
            boardState[colId] = tasks;
        });
        localStorage.setItem('kanban-board', JSON.stringify(boardState));
    }

    function loadTasks() {
        const savedState = JSON.parse(localStorage.getItem('kanban-board'));
        if (savedState) {
            for (const [colId, tasks] of Object.entries(savedState)) {
                tasks.forEach(taskText => {
                    createTaskElement(taskText, colId);
                });
            }
        } else {
            // Default tasks for demo
            createTaskElement("Design new dashboard", "todo-list");
            createTaskElement("Fix login bug", "inprogress-list");
            createTaskElement("Deploy to production", "done-list");
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

            fetch('http://127.0.0.1:5000/api/chat', {
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
