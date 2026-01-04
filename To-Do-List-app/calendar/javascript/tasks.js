document.addEventListener('DOMContentLoaded', () => {
    const boardContainer = document.querySelector('.board-container');
    const addListBtn = document.getElementById('addListBtn');

    // State for Columns and Tasks
    let columnsState = [];
    let allTasks = [];

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

    // --- View Management ---
    const boardViewBtn = document.getElementById('boardViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const listViewContainer = document.getElementById('listViewContainer');
    const listViewContent = document.getElementById('listViewContent');
    const addListTaskBtn = document.getElementById('addListTaskBtn');

    const weekViewBtn = document.getElementById('weekViewBtn');
    const weekViewContainer = document.getElementById('weekViewContainer');
    const taskWeekGrid = document.getElementById('taskWeekGrid');

    // --- Advanced Task Form Modal Elements ---
    const addTaskModal = document.getElementById('addTaskModal');
    const addTaskForm = document.getElementById('addTaskForm');
    const taskFormId = document.getElementById('taskFormId');
    const taskFormColumn = document.getElementById('taskFormColumn');
    const taskFormTitle = document.getElementById('taskFormTitle');
    const taskFormDate = document.getElementById('taskFormDate');
    const taskFormTime = document.getElementById('taskFormTime');
    const taskFormDuration = document.getElementById('taskFormDuration');
    const taskFormDue = document.getElementById('taskFormDue');
    const subtaskInputsContainer = document.getElementById('subtaskInputsContainer');
    const addSubtaskBtn = document.getElementById('addSubtaskBtn');
    const saveTaskBtn = document.getElementById('saveTaskBtn');
    const cancelAddTaskBtn = document.getElementById('cancelAddTaskBtn');
    const closeAddTaskModalBtn = document.getElementById('closeAddTaskModalBtn');
    const addTaskModalTitle = document.getElementById('addTaskModalTitle');

    if (boardViewBtn) {
        boardViewBtn.addEventListener('click', () => {
            console.log('Board view clicked');
            currentTaskView = 'board';
            updateView();
        });
    }

    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => {
            console.log('List view clicked');
            currentTaskView = 'list';
            updateView();
        });
    }

    if (weekViewBtn) {
        weekViewBtn.addEventListener('click', () => {
            console.log('Week view clicked');
            currentTaskView = 'week';
            updateView();
        });
    }

    // Default View
    let currentTaskView = localStorage.getItem('task-view') || 'board';
    updateView();

    function updateView() {
        if (boardContainer) boardContainer.style.display = currentTaskView === 'board' ? 'flex' : 'none';
        if (listViewContainer) listViewContainer.classList.toggle('hidden', currentTaskView !== 'list');
        if (weekViewContainer) weekViewContainer.classList.toggle('hidden', currentTaskView !== 'week');

        // Update Button Styles
        const btns = [
            { id: 'boardViewBtn', view: 'board' },
            { id: 'listViewBtn', view: 'list' },
            { id: 'weekViewBtn', view: 'week' }
        ];

        btns.forEach(b => {
            const btn = document.getElementById(b.id);
            if (btn) {
                if (currentTaskView === b.view) {
                    btn.classList.add('bg-white', 'dark:bg-gray-600', 'shadow-sm');
                    btn.classList.remove('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-300', 'dark:hover:bg-gray-600');
                } else {
                    btn.classList.remove('bg-white', 'dark:bg-gray-600', 'shadow-sm');
                    btn.classList.add('text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-300', 'dark:hover:bg-gray-600');
                }
            }
        });

        // Save preference
        localStorage.setItem('task-view', currentTaskView);

        // Fetch tasks if needed for specific view
        if (currentTaskView === 'list') renderListView();
        if (currentTaskView === 'week') renderTaskWeekView();
    }

    function collectAllTasks() {
        allTasks = [];
        columnsState.forEach(col => {
            const list = document.getElementById(col.id);
            if (list) {
                list.querySelectorAll('.task-card').forEach(card => {
                    if (card._taskData) {
                        const taskData = { ...card._taskData };
                        taskData.status = col.title;
                        taskData.element = card;
                        allTasks.push(taskData);
                    }
                });
            }
        });
    }

    // Modal Control Functions
    function openAddTaskModal(columnId, taskToEdit = null) {
        if (!addTaskModal) return;

        // Reset Form
        addTaskForm.reset();
        subtaskInputsContainer.innerHTML = '';
        taskFormColumn.value = columnId;
        taskFormId.value = taskToEdit ? taskToEdit.id : '';
        addTaskModalTitle.textContent = taskToEdit ? 'Edit Task' : 'Add New Task';

        if (taskToEdit) {
            taskFormTitle.value = taskToEdit.text;
            taskFormDate.value = taskToEdit.scheduledDate || '';
            taskFormTime.value = taskToEdit.scheduledTime || '';
            taskFormDuration.value = taskToEdit.duration || '';
            taskFormDue.value = taskToEdit.dueDate || '';

            if (taskToEdit.subtasks && taskToEdit.subtasks.length > 0) {
                taskToEdit.subtasks.forEach(st => addSubtaskInput(st.text, st.completed));
            }
        }

        addTaskModal.classList.remove('hidden');
        taskFormTitle.focus();
    }

    function closeAddTaskModal() {
        addTaskModal.classList.add('hidden');
        addTaskForm.reset();
        subtaskInputsContainer.innerHTML = '';
    }

    function addSubtaskInput(text = '', completed = false) {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2 group';
        div.innerHTML = `
            <input type="checkbox" ${completed ? 'checked' : ''} class="subtask-complete-check w-4 h-4 rounded border-gray-300">
            <input type="text" class="subtask-text-input flex-1 p-1 bg-transparent border-b border-gray-200 dark:border-gray-600 outline-none focus:border-blue-500 text-sm" placeholder="Sub-task name" value="${text}">
            <button type="button" class="remove-subtask-btn text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="fas fa-times"></i>
            </button>
        `;

        const removeBtn = div.querySelector('.remove-subtask-btn');
        removeBtn.onclick = () => div.remove();

        subtaskInputsContainer.appendChild(div);
        const input = div.querySelector('.subtask-text-input');
        if (!text) input.focus();
    }

    // Event Listeners for Add Modal
    if (addSubtaskBtn) addSubtaskBtn.onclick = () => addSubtaskInput();
    if (closeAddTaskModalBtn) closeAddTaskModalBtn.onclick = closeAddTaskModal;
    if (cancelAddTaskBtn) cancelAddTaskBtn.onclick = closeAddTaskModal;
    if (addTaskModal) {
        addTaskModal.onclick = (e) => {
            if (e.target === addTaskModal) closeAddTaskModal();
        };
    }

    if (saveTaskBtn) {
        saveTaskBtn.onclick = (e) => {
            e.preventDefault();
            const title = taskFormTitle.value.trim();
            if (!title) {
                alert("Please enter a task title.");
                return;
            }

            const subtasks = [];
            subtaskInputsContainer.querySelectorAll('.flex.items-center').forEach(div => {
                const txt = div.querySelector('.subtask-text-input').value.trim();
                const completed = div.querySelector('.subtask-complete-check').checked;
                if (txt) subtasks.push({ text: txt, completed: completed });
            });

            const taskData = {
                id: taskFormId.value || Date.now(),
                text: title,
                scheduledDate: taskFormDate.value,
                scheduledTime: taskFormTime.value,
                duration: taskFormDuration.value,
                dueDate: taskFormDue.value,
                subtasks: subtasks,
                completed: false
            };

            const columnId = taskFormColumn.value;

            if (taskFormId.value) {
                const existingCard = document.querySelector(`.task-card[data-id="${taskFormId.value}"]`);
                if (existingCard) existingCard.remove();
            }

            createTaskElement(taskData, columnId);
            saveTasks();
            updateTaskCounts();
            closeAddTaskModal();
            if (currentTaskView === 'list') renderListView();
            if (currentTaskView === 'week') renderTaskWeekView();
        };
    }


    if (addListTaskBtn) {
        addListTaskBtn.addEventListener('click', () => {
            openAddTaskModal('todo-list');
        });
    }

    function renderListView() {
        if (!listViewContent) return;
        listViewContent.innerHTML = '';

        if (allTasks.length === 0) {
            listViewContent.innerHTML = '<div class="p-8 text-center text-gray-500">No tasks found.</div>';
            return;
        }

        allTasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition flex-wrap gap-2 border-b border-gray-100 dark:border-gray-700 last:border-0';

            const videoUrl = extractVideoUrl(task.text);
            const videoIcon = videoUrl ? '<i class="fas fa-play-circle text-red-500 ml-2" title="Has Video"></i>' : '';

            let subProgress = '';
            if (task.subtasks && task.subtasks.length > 0) {
                const completed = task.subtasks.filter(s => s.completed).length;
                subProgress = `<span class="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded ml-2 font-bold text-gray-500">${completed}/${task.subtasks.length} subtasks</span>`;
            }

            item.innerHTML = `
                <div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer task-item-text">
                    <button class="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 dark:border-gray-500 ${task.completed ? 'bg-blue-500 border-blue-500 text-white' : ''} toggle-complete-btn">
                        ${task.completed ? '<i class="fas fa-check text-xs"></i>' : ''}
                    </button>
                    <span class="${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'} truncate font-medium">
                        ${task.text} ${videoIcon} ${subProgress}
                    </span>
                </div>
                <div class="flex items-center gap-2">
                    ${task.scheduledDate ? `<span class="text-[10px] text-blue-500 font-bold mr-2"><i class="far fa-calendar-alt"></i> ${task.scheduledDate}</span>` : ''}
                    <span class="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        ${task.status}
                    </span>
                    <button class="text-gray-400 hover:text-red-500 p-1 delete-list-item-btn" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="text-gray-400 hover:text-blue-500 p-1 open-details-btn" title="Details">
                        <i class="fas fa-expand-alt"></i>
                    </button>
                </div>
            `;

            item.querySelector('.toggle-complete-btn').onclick = (e) => {
                e.stopPropagation();
                const checkBtn = task.element.querySelector('.check-btn');
                if (checkBtn) checkBtn.click();
                setTimeout(renderListView, 100);
            };

            item.querySelector('.delete-list-item-btn').onclick = (e) => {
                e.stopPropagation();
                const deleteBtn = task.element.querySelector('.delete-btn');
                if (deleteBtn) deleteBtn.click();
                setTimeout(renderListView, 350);
            };

            item.querySelector('.open-details-btn').onclick = (e) => {
                e.stopPropagation();
                openTaskModal(task, task.element);
            };

            item.querySelector('.task-item-text').onclick = () => openTaskModal(task, task.element);

            listViewContent.appendChild(item);
        });
    }

    const taskModal = document.getElementById('taskModal');
    const taskModalTitle = document.getElementById('taskModalTitle');
    const taskModalStatus = document.getElementById('taskModalStatus');
    const taskModalSchedule = document.getElementById('taskModalSchedule');
    const taskModalDuration = document.getElementById('taskModalDuration');
    const taskModalDue = document.getElementById('taskModalDue');
    const taskModalVideo = document.getElementById('taskModalVideo');
    const subtasksViewContainer = document.getElementById('subtasksViewContainer');
    const subtasksList = document.getElementById('subtasksList');
    const editTaskDetailsBtn = document.getElementById('editTaskDetailsBtn');

    const closeTaskModalBtn = document.getElementById('closeTaskModalBtn');
    const closeTaskModalFooter = document.getElementById('closeTaskModalFooter');
    const deleteTaskModalBtn = document.getElementById('deleteTaskModalBtn');
    let currentModalTask = null;
    let currentModalElement = null;

    function openTaskModal(task, element) {
        if (!taskModal) return;
        currentModalTask = task;
        currentModalElement = element;

        taskModalTitle.textContent = task.text;

        let status = 'To Do';
        if (element && element.parentElement) {
            const colId = element.parentElement.id;
            const col = columnsState.find(c => c.id === colId);
            if (col) status = col.title;
        }
        taskModalStatus.textContent = status;

        taskModalSchedule.textContent = (task.scheduledDate || '') + (task.scheduledTime ? ' at ' + task.scheduledTime : '') || 'Not scheduled';
        taskModalDuration.textContent = task.duration ? task.duration + ' mins' : '-- mins';
        taskModalDue.textContent = task.dueDate || 'No due date';

        const videoData = extractVideoUrl(task.text);
        if (videoData) {
            const embedUrl = getEmbedUrl(videoData);
            taskModalVideo.innerHTML = `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
            taskModalVideo.classList.remove('hidden');
        } else {
            taskModalVideo.classList.add('hidden');
            taskModalVideo.innerHTML = '';
        }

        if (task.subtasks && task.subtasks.length > 0) {
            subtasksViewContainer.classList.remove('hidden');
            subtasksList.innerHTML = '';
            task.subtasks.forEach((st, idx) => {
                const div = document.createElement('div');
                div.className = 'flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition';
                div.innerHTML = `
                    <input type="checkbox" ${st.completed ? 'checked' : ''} class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer">
                    <span class="text-sm font-medium ${st.completed ? 'line-through text-gray-500' : ''}">${st.text}</span>
                `;
                const check = div.querySelector('input');
                check.onchange = () => {
                    task.subtasks[idx].completed = check.checked;
                    div.querySelector('span').classList.toggle('line-through', check.checked);
                    div.querySelector('span').classList.toggle('text-gray-500', check.checked);

                    if (element) {
                        element._taskData = task;
                        const colId = element.parentElement.id;
                        const newCard = createTaskElement(task, colId);
                        element.replaceWith(newCard);
                        currentModalElement = newCard;
                    }
                    saveTasks();
                };
                subtasksList.appendChild(div);
            });
        } else {
            subtasksViewContainer.classList.add('hidden');
        }

        taskModal.classList.remove('hidden');
    }

    function closeTaskModal() {
        taskModal.classList.add('hidden');
        taskModalVideo.innerHTML = '';
        currentModalTask = null;
        currentModalElement = null;
    }

    if (closeTaskModalBtn) closeTaskModalBtn.onclick = closeTaskModal;
    if (closeTaskModalFooter) closeTaskModalFooter.onclick = closeTaskModal;
    if (taskModal) {
        taskModal.onclick = (e) => {
            if (e.target === taskModal) closeTaskModal();
        };
    }

    if (editTaskDetailsBtn) {
        editTaskDetailsBtn.onclick = () => {
            if (currentModalTask) {
                const taskToEdit = currentModalTask;
                const colId = currentModalElement ? currentModalElement.parentElement.id : 'todo-list';
                closeTaskModal();
                openAddTaskModal(colId, taskToEdit);
            }
        };
    }

    if (deleteTaskModalBtn) {
        deleteTaskModalBtn.onclick = () => {
            if (currentModalElement) {
                const deleteBtn = currentModalElement.querySelector('.delete-btn');
                if (deleteBtn) deleteBtn.click();
                closeTaskModal();
                if (currentTaskView === 'list') renderListView();
            }
        };
    }

    function extractVideoUrl(text) {
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g;
        const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/g;

        const ytMatch = text.match(youtubeRegex);
        if (ytMatch) return { type: 'youtube', url: ytMatch[0] };

        const vimeoMatch = text.match(vimeoRegex);
        if (vimeoMatch) return { type: 'vimeo', url: vimeoMatch[0] };

        return null;
    }

    function getEmbedUrl(videoObj) {
        if (!videoObj) return null;
        if (videoObj.type === 'youtube') {
            let videoId = videoObj.url.split('v=')[1];
            const ampersandPosition = videoId ? videoId.indexOf('&') : -1;
            if (ampersandPosition !== -1) {
                videoId = videoId.substring(0, ampersandPosition);
            }
            if (!videoId && videoObj.url.indexOf('youtu.be/') !== -1) {
                videoId = videoObj.url.split('youtu.be/')[1];
            }
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (videoObj.type === 'vimeo') {
            const match = videoObj.url.match(/vimeo\.com\/(\d+)/);
            const videoId = match ? match[1] : null;
            return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
        }
        return null;
    }

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

        if (addListBtn && addListBtn.parentNode === boardContainer) {
            boardContainer.insertBefore(columnDiv, addListBtn);
        } else {
            boardContainer.appendChild(columnDiv);
        }

        const taskList = columnDiv.querySelector('.task-list');
        const addTaskBtn = columnDiv.querySelector('.add-task-btn');

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
        addTaskBtn.addEventListener('click', () => {
            openAddTaskModal(id);
        });
    }

    function renderTaskWeekView() {
        if (!taskWeekGrid) return;
        taskWeekGrid.innerHTML = '';

        const today = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const currentDayIndex = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDayIndex);

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const dateStr = dayDate.toISOString().split('T')[0];
            const isToday = dayDate.toDateString() === today.toDateString();

            const col = document.createElement('div');
            col.className = 'bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex flex-col h-full border border-gray-200 dark:border-gray-700';
            col.innerHTML = `
                <div class="text-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-600 ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-300'}">
                    <div class="text-sm uppercase tracking-wider">${days[i]}</div>
                    <div class="text-2xl">${dayDate.getDate()}</div>
                </div>
                <div class="flex-1 space-y-2 task-week-list min-h-[100px]" data-date="${dateStr}">
                </div>
            `;

            const listContainer = col.querySelector('.task-week-list');
            listContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                listContainer.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
            });
            listContainer.addEventListener('dragleave', (e) => {
                listContainer.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
            });
            listContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                listContainer.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
                const draggedCard = document.querySelector('.dragging');
                if (draggedCard) {
                    listContainer.appendChild(draggedCard);
                }
            });

            taskWeekGrid.appendChild(col);
        }

        const simplifiedRendered = new Set();
        allTasks.forEach(task => {
            if (task.completed) return;
            const dateKey = task.scheduledDate || today.toISOString().split('T')[0];
            const targetList = taskWeekGrid.querySelector(`.task-week-list[data-date="${dateKey}"]`);
            if (targetList) {
                const miniCard = document.createElement('div');
                miniCard.className = 'bg-white dark:bg-gray-800 p-2 rounded shadow text-xs border-l-4 border-blue-500 cursor-move hover:shadow-md transition';
                miniCard.textContent = task.text;
                miniCard.draggable = true;
                miniCard.onclick = () => openTaskModal(task, task.element);
                addDragListeners(miniCard);
                targetList.appendChild(miniCard);
            }
        });
    }

    if (addListBtn) {
        addListBtn.addEventListener('click', () => {
            const title = prompt("Enter list title:");
            if (title && title.trim()) {
                const newId = 'list-' + Date.now();
                const newTitle = title.trim();
                columnsState.push({ id: newId, title: newTitle });
                saveColumns();
                renderColumn(newId, newTitle);
            }
        });
    }

    let draggedItem = null;

    function addDragListeners(item) {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            // Required for some browsers like Firefox to allow dragging
            if (e.dataTransfer) {
                e.dataTransfer.setData('text/plain', '');
                e.dataTransfer.effectAllowed = 'move';
            }
            setTimeout(() => item.classList.add('dragging'), 0);
        });

        item.addEventListener('dragend', () => {
            setTimeout(() => {
                item.classList.remove('dragging');
                draggedItem = null;
                saveTasks();
                updateTaskCounts();
                collectAllTasks();
                if (currentTaskView === 'list') renderListView();
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

    function updateTaskCounts() {
        columnsState.forEach(col => {
            const list = document.getElementById(col.id);
            if (list) {
                const count = list.children.length;
                const columnDiv = list.closest('.column');
                const badge = columnDiv && columnDiv.querySelector('.count-badge');
                if (badge) {
                    badge.textContent = count;
                }
            }
        });
    }

    function createTaskElement(taskData, columnId) {
        let task = (typeof taskData === 'string') ? {
            id: 'task-' + Date.now() + Math.random(),
            text: taskData,
            completed: false,
            subtasks: []
        } : taskData;

        const card = document.createElement('div');
        card.classList.add('task-card');
        card.dataset.id = task.id;
        card._taskData = task;
        task.element = card;

        if (task.completed) {
            card.classList.add('completed');
        }
        card.setAttribute('draggable', 'true');

        const taskContent = document.createElement('div');
        taskContent.className = 'task-content flex-col items-start gap-2';

        const topRow = document.createElement('div');
        topRow.className = 'flex items-center gap-3 w-full';

        const checkBtn = document.createElement('button');
        checkBtn.className = 'check-btn' + (task.completed ? ' checked' : '');
        checkBtn.innerHTML = '<i class="fas fa-check"></i>';
        checkBtn.title = task.completed ? 'Mark as incomplete' : 'Mark as complete';

        checkBtn.onclick = (e) => {
            e.stopPropagation();
            const wasCompleted = card.classList.contains('completed');
            task.completed = !wasCompleted;
            card._taskData = task;

            if (!wasCompleted) {
                const rect = checkBtn.getBoundingClientRect();
                createConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
                showCelebration(task.text);
                card.classList.add('completing');
                checkBtn.classList.add('checked');

                setTimeout(() => {
                    card.classList.remove('completing');
                    card.classList.add('completed');
                    const doneColumn = document.getElementById('done-list');
                    if (doneColumn && card.parentElement.id !== 'done-list') {
                        doneColumn.insertBefore(card, doneColumn.firstChild);
                    }
                    saveTasks();
                    updateTaskCounts();
                }, 600);
            } else {
                card.classList.remove('completed');
                checkBtn.classList.remove('checked');
                const todoColumn = document.getElementById('todo-list');
                if (todoColumn && card.parentElement.id !== 'todo-list') {
                    todoColumn.appendChild(card);
                }
                saveTasks();
                updateTaskCounts();
            }
        };

        const taskTextSpan = document.createElement('span');
        taskTextSpan.className = 'task-text font-medium';
        taskTextSpan.textContent = task.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn ml-auto';
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

        topRow.appendChild(checkBtn);
        topRow.appendChild(taskTextSpan);

        const metaRow = document.createElement('div');
        metaRow.className = 'flex flex-wrap gap-2 w-full mt-1';

        if (task.subtasks && task.subtasks.length > 0) {
            const completedCount = task.subtasks.filter(s => s.completed).length;
            const subBadge = document.createElement('div');
            subBadge.className = 'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ' +
                (completedCount === task.subtasks.length ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300');
            subBadge.innerHTML = `<i class="fas fa-list-ul"></i> ${completedCount}/${task.subtasks.length}`;
            metaRow.appendChild(subBadge);
        }

        if (task.scheduledDate || task.dueDate) {
            const dateBadge = document.createElement('div');
            dateBadge.className = 'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300';
            const displayDate = task.scheduledDate || task.dueDate;
            dateBadge.innerHTML = `<i class="far fa-calendar-alt"></i> ${displayDate}`;
            metaRow.appendChild(dateBadge);
        }

        if (task.duration) {
            const durBadge = document.createElement('div');
            durBadge.className = 'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300';
            durBadge.innerHTML = `<i class="far fa-clock"></i> ${task.duration}m`;
            metaRow.appendChild(durBadge);
        }

        const videoData = extractVideoUrl(task.text);
        if (videoData) {
            const videoBtn = document.createElement('button');
            videoBtn.className = 'video-btn ml-1 text-red-500 hover:text-red-600 transition text-sm';
            videoBtn.innerHTML = '<i class="fas fa-play-circle"></i>';
            videoBtn.onclick = (e) => {
                e.stopPropagation();
                openTaskModal(task, card);
            };
            topRow.appendChild(videoBtn);
        }

        topRow.appendChild(deleteBtn);
        taskContent.appendChild(topRow);
        if (metaRow.children.length > 0) taskContent.appendChild(metaRow);

        card.appendChild(taskContent);
        taskTextSpan.style.cursor = 'pointer';
        taskTextSpan.onclick = (e) => {
            e.stopPropagation();
            openTaskModal(task, card);
        };

        addDragListeners(card);

        const column = document.getElementById(columnId);
        if (column) {
            column.appendChild(card);
        } else {
            const firstCol = document.querySelector('.task-list');
            if (firstCol) firstCol.appendChild(card);
        }
        return card;
    }

    function saveTasks() {
        const boardState = {};
        columnsState.forEach(col => {
            const list = document.getElementById(col.id);
            if (list) {
                const tasks = [];
                list.querySelectorAll('.task-card').forEach(card => {
                    if (card._taskData) {
                        // Create a clone but remove the circular reference to the DOM element
                        const taskToSave = { ...card._taskData };
                        delete taskToSave.element;
                        tasks.push(taskToSave);
                    }
                });
                boardState[col.id] = tasks;
            }
        });
        try {
            localStorage.setItem('kanban-board', JSON.stringify(boardState));
            collectAllTasks();
        } catch (e) {
            console.error('Failed to save tasks:', e);
        }
    }

    function loadTasks() {
        const savedStateString = localStorage.getItem('kanban-board');
        const savedState = savedStateString ? JSON.parse(savedStateString) : null;

        if (savedState && Object.keys(savedState).length > 0) {
            for (const [colId, tasks] of Object.entries(savedState)) {
                const columnEl = document.getElementById(colId);
                if (columnEl && Array.isArray(tasks)) {
                    tasks.forEach(task => {
                        createTaskElement(task, colId);
                    });
                }
            }
            collectAllTasks();
        } else {
            console.log('No saved tasks, creating demo tasks');
            createTaskElement({ text: "Design new dashboard", completed: false, subtasks: [] }, "todo-list");
            createTaskElement({ text: "Fix login bug", completed: false, subtasks: [] }, "inprogress-list");
            createTaskElement({ text: "Deploy to production", completed: true, subtasks: [] }, "done-list");
            saveTasks();
        }
    }

    function saveColumns() {
        localStorage.setItem('kanban-columns', JSON.stringify(columnsState));
    }

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

    const calendarChatInput = document.getElementById('calendarChatInput');
    const calendarChatSendBtn = document.getElementById('calendarChatSendBtn');
    const floatingChatContainer = document.getElementById('floatingChatContainer');
    const chatOverlay = document.getElementById('chatOverlay');
    const closeChatBtn = document.getElementById('closeChatBtn');

    if (calendarChatInput) {
        calendarChatInput.addEventListener('focus', () => {
            if (boardContainer) boardContainer.classList.add('blur-content');
            if (chatOverlay) chatOverlay.classList.add('active');
            if (closeChatBtn) closeChatBtn.style.display = 'flex';
        });

        const closeChatFocus = (endChat = false) => {
            if (boardContainer) boardContainer.classList.remove('blur-content');
            if (chatOverlay) chatOverlay.classList.remove('active');
            if (closeChatBtn) closeChatBtn.style.display = 'none';
            calendarChatInput.blur();
        };

        if (chatOverlay) {
            chatOverlay.addEventListener('click', () => closeChatFocus(false));
        }

        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', () => closeChatFocus(true));
        }
    }
});
