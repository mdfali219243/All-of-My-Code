import { renderFolderPickerMenu, folders } from "../data/folder.js"
import { tasks, updateTaskGroupCount, hideEmptyTaskGroups, assignTaskDataDate, handleDateChange } from "../data/tasks.js";
import { reapplyCurrentFilter } from "./menu.js";




document.addEventListener("DOMContentLoaded", () => {
    renderFolderPickerMenu();
    applyPlaceholder();
    reapplyCurrentFilter();
    setupTaskClickListeners();
});

const taskStatsSection = document.querySelector("#todo-stats");
const statsTaskFolderContainer = document.querySelector(".task-folder-container-stats");
const statsTodoFolderMenu = document.getElementById("stats-todo-folder-menu");
const addSubTaskIconContainer = taskStatsSection.querySelector(".add-sub-task-icon-container");
const statsTaskMoreIcon = taskStatsSection.querySelector("#stats-task-more-icon");
const statsTaskMoreIconMenu = document.querySelector("#stats-task-more-icon-menu");
const statsTaskMoreIconContainer = document.querySelector(".task-edit-container-right");
const editable = document.getElementById('editable-description-stats');
const placeholderText = "Write description for the task...";


window.addEventListener("resize", () => {
    if (window.innerWidth > 1094) {
        taskStatsSection.classList.remove("pop-up-stats-panel");
        const statsPanelCloseButton = taskStatsSection.querySelector(".close-stats-panel-icon");
        if (statsPanelCloseButton) {
            statsPanelCloseButton.remove();
        }
    }
});

const addSubtaskStatsMoreIconAction = taskStatsSection.querySelector(".add-subtask-container-stats");
addSubtaskStatsMoreIconAction.addEventListener("click", () => {
    const taskId = taskStatsSection.getAttribute("data-id");
    addSubtask(taskId);
});


// ...after rendering the stats panel for a task...
const statsTaskDeleteIcon = document.querySelector("#stats-task-more-icon-menu .task-delete-icon-container");
if (statsTaskDeleteIcon) {
    statsTaskDeleteIcon.onclick = () => {
        const taskId = taskStatsSection.getAttribute("data-id");
        const task = tasks.find(t => t.taskId === Number(taskId));
        if (task) {
            deleteTaskFromStats(taskId);
        }
    };
}

// Attach the event listener to the date input in the stats panel
const statsDateInput = taskStatsSection.querySelector(".todo-date-input-stats");
if (statsDateInput) {
    statsDateInput.addEventListener("change", () => {
        const taskId = taskStatsSection.getAttribute("data-id");
        const task = tasks.find(t => t.taskId === Number(taskId));
        if (task) {
            updateTaskDueDateOnStatsDatePicker(task);
            
            const statsTaskDueDateDisplay = document.querySelector(".task-due-date-stats");
            if (statsTaskDueDateDisplay) {
                statsTaskDueDateDisplay.innerHTML = statsTaskDueDateFormatter(task.dueDate);
                console.log(task.dueDate)
            } else {
                console.error("Element with class 'task-due-date-stats' not found.");
            }
        }
    });
}

function setupTaskClickListeners() {
    document.addEventListener("click", (e) => {
        const taskElement = e.target.closest(".task-more-container");
        if (!taskElement) return;

        // Get task ID and find task
        const taskId = taskElement.getAttribute("data-id");
        const foundTask = tasks.find(t => t.taskId === Number(taskId));
        console.log("Task ID:", taskId, "Found Task:", foundTask);
        
        if (!foundTask) {
            console.error("Task not found in tasks array:", taskId);
            return;
        }

        taskStatsSection.setAttribute("data-id", taskId);

        // Get folder info safely
        const folderId = foundTask.folderId;
        const folder = folders[folderId];
        
        if (!folder) {
            console.error("Folder not found for task:", foundTask);
            // Use a default folder name or handle the case where folder is missing
            updateStatsFolderDisplay("No Folder");
        } else {
            console.log("Folder:", folder);
            updateStatsFolderDisplay(folder.folderName);
        }

        updateEditableTaskName(taskElement);

        const statsTaskDueDateDisplay = document.querySelector(".task-due-date-stats");
        if (!statsTaskDueDateDisplay) {
            console.error("Element with class 'task-due-date-stats' not found.");
            return;
        }
        statsTaskDueDateDisplay.textContent = statsTaskDueDateFormatter(foundTask.dueDate);
        updateStatsTaskDueDateDisplayColor(foundTask);
        const priority = foundTask.priority;
        updateStatsPriorityIcon(priority);
        updateStatsPriorityIconColor(priority);
        

        displayTaskDescription(taskId);
        setupTaskDescriptionInput(taskId);
        renderUpdatedTaskPriority(taskId);

        updateCheckBoxColor(priority);

        renderSubtasksForTask(foundTask); // Show only this task's subtasks

        inputTaskDateOnStatsDatePicker(foundTask.dueDate);

        // Update task name in stats panel in real time using the contenteditable functionality
        const taskTitle = taskStatsSection.querySelector(".task-title");
        taskTitle.addEventListener("input", () => {
            const taskId = taskStatsSection.getAttribute("data-id");
            const task = tasks.find(t => t.taskId === Number(taskId));
            const taskOnThePage = document.querySelector(`.task-more-container[data-id="${taskId}"]`)
            const nameEl = taskOnThePage.querySelector(".task-text");
            if (task) {
                task.taskName = taskTitle.textContent.trim();
                nameEl.textContent = taskTitle.textContent.trim();
                localStorage.setItem("tasks", JSON.stringify(tasks));
            }
        });

        const checkbox = taskElement.querySelector(".task-checkbox");
        const statsCheckbox = taskStatsSection.querySelector(".task-checkbox-stats");
        statsCheckbox.name = checkbox.name;
        
    });
}

document.addEventListener("click", function(event) {
    // Handle clicks on folder options inside task-more-folder-menu
    const folderItem = event.target.closest(".folder-menu-container");
    if (folderItem) {
        const folderId = folderItem.getAttribute("data-id");
        const folderColor = folderItem.getAttribute("data-color");
        const folderName = folderItem.querySelector(".folder-menu-name").textContent;
        const taskId = taskStatsSection.getAttribute("data-id");
        updatePageForNewSelectedFolder(taskId, folderName, folderColor, folderId);
    }
});

// --- Folder menu toggle ---
document.addEventListener("click", (e) => {
    if (!statsTaskFolderContainer.contains(e.target) && !statsTodoFolderMenu.contains(e.target)) {
        statsTodoFolderMenu.classList.add("hidden-element");
    } else if (
        statsTaskFolderContainer.contains(e.target) && !statsTodoFolderMenu.contains(e.target) ||
        statsTodoFolderMenu.contains(e.target)
    ) {
        statsTodoFolderMenu.classList.toggle("hidden-element");
    }
});

// --- Task more menu toggle ---
statsTaskMoreIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    statsTaskMoreIconMenu.classList.toggle("hidden-element");
});
document.addEventListener("click", (e) => {
    if (!statsTaskMoreIconContainer.contains(e.target)) {
        statsTaskMoreIconMenu.classList.add("hidden-element");
    }
});

// --- Add subtask ---
addSubTaskIconContainer.addEventListener("click", () => {
    const taskId = taskStatsSection.getAttribute("data-id");
    if (!taskId) {
        console.warn("No task ID found in stats section.");
        return;
    }
    addSubtask(taskId);
});

document.querySelector(".folder-menu-dynamic").addEventListener("click", (e) => {
    const folderMenuItem = e.target.closest(".folder-menu-container");
    if (!folderMenuItem) return;

    const taskId = taskStatsSection.getAttribute("data-id");
    const folderName = folderMenuItem.querySelector(".folder-menu-name").textContent;
    const folderId = folderMenuItem.dataset.id; 
    const folderColor = folderMenuItem.dataset.color;

    updatePageForNewSelectedFolder(taskId, folderName, folderColor, folderId);
});


// --- Editable task name ---
function updateEditableTaskName(taskElement) {
    const taskTitle = taskStatsSection.querySelector(".task-title");
    taskTitle.classList.remove("placeholder");
    const taskDescription = taskStatsSection.querySelector(".description");
    taskTitle.contentEditable = "true";
    taskDescription.contentEditable = "true";
    const nameEl = taskElement.querySelector(".task-text");
    if (taskTitle) {
        taskTitle.textContent = nameEl ? nameEl.textContent : "";
    }
    
}

// --- Due date formatting ---
export function statsTaskDueDateFormatter(inputDateStr) {
    if (!inputDateStr) return "";
    const [year, month, day] = inputDateStr.split("-").map(Number);
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    inputDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;
    const msPerMonth = msPerDay * 30.4375;
    const msPerYear = msPerDay * 365.25;
    const diffInMs = inputDate - today;
    const diffInDays = Math.round(diffInMs / msPerDay);
    const diffInMonths = Math.floor(Math.abs(diffInMs) / msPerMonth);
    const diffInYears = Math.floor(Math.abs(diffInMs) / msPerYear);
    const monthName = inputDate.toLocaleString("en-US", { month: "short" });
    const dayOfMonth = inputDate.getDate();
    const fullDate = `${String(inputDate.getMonth() + 1).padStart(2, "0")}/${String(dayOfMonth).padStart(2, "0")}/${inputDate.getFullYear()}`;
    if (diffInDays === 0) return `Today, ${monthName} ${dayOfMonth}`;
    if (diffInDays === -1) return `Yesterday, ${monthName} ${dayOfMonth}`;
    if (diffInDays === 1) return `Tomorrow, ${monthName} ${dayOfMonth}`;
    if (diffInDays < -1 && diffInDays >= -30) return `${Math.abs(diffInDays)} days ago, ${monthName} ${dayOfMonth}`;
    if (diffInDays > 1 && diffInDays <= 30) return `${diffInDays} days later, ${monthName} ${dayOfMonth}`;
    if (diffInDays < -30 && diffInDays >= -365) return `${diffInMonths} months ago, ${monthName} ${dayOfMonth}`;
    if (diffInDays > 30 && diffInDays <= 365) return `${diffInMonths} months later, ${monthName} ${dayOfMonth}`;
    if (diffInDays < -365) return `${diffInYears} years ago, ${fullDate}`;
    if (diffInDays > 365) return `${diffInYears} years later, ${fullDate}`;
    return `${monthName} ${dayOfMonth}`;
}

function inputTaskDateOnStatsDatePicker(dateValue) {
    const statsDateInput = taskStatsSection.querySelector(".todo-date-input-stats");
    statsDateInput.value = dateValue;
}


function updateTaskDueDateOnStatsDatePicker(task) {
    const statsDateInput = taskStatsSection.querySelector(".todo-date-input-stats");

    // Update the task's dueDate and formattedDueDate
    task.dueDate = statsDateInput.value;
    task.formattedDueDate = handleDateChange(statsDateInput.value);

    // Update the task's dueDate and formattedDueDate in the DOM
    

    

    // Move the task DOM element to the correct group
    const taskElement = document.querySelector(`.task-more-container[data-id="${task.taskId}"]`);
    const taskDate = assignTaskDataDate(task);
    console.log(taskDate);
    const taskDateDisplay = taskElement.querySelector(".task-due-date");
    updateStatsTaskDueDateDisplayColor(task);
    if (taskElement) {
        if (taskDate === "overdue") {
            taskDateDisplay.classList.add("due-date-overdue-stats");
            taskDateDisplay.classList.remove("due-date-future-stats");
        } else if (taskDate === "none") {
            taskDateDisplay.classList.remove("due-date-overdue-stats");
            taskDateDisplay.classList.remove("due-date-future-stats");
        } else {
            taskDateDisplay.classList.remove("due-date-overdue-stats");
            taskDateDisplay.classList.add("due-date-future-stats");
        }
        taskDateDisplay.textContent = task.formattedDueDate;
        // Update the data-date attribute to match the new due date
        const newTaskDate = assignTaskDataDate(task);
        taskElement.setAttribute("data-date", newTaskDate); // <-- ADD THIS LINE

        // Remove from old group
        const oldGroup = taskElement.closest('.task-group');
        if (oldGroup) {
            oldGroup.querySelector('.tasks').removeChild(taskElement);
            updateTaskGroupCount(oldGroup);
        }

        // Find the new group and add the task there
        const newGroup = document.querySelector(`.task-group[data-date="${newTaskDate}"]`);
        if (newGroup) {
            newGroup.querySelector('.tasks').appendChild(taskElement);
            updateTaskGroupCount(newGroup);
        }
    }

    // Save changes
    localStorage.setItem("tasks", JSON.stringify(tasks));

    // Reapply current filter and hide empty groups
    reapplyCurrentFilter();
    hideEmptyTaskGroups();
}


// --- Priority icon ---
function updateStatsPriorityIcon(priority) {
    const statsPriorityIcon = taskStatsSection.querySelector(".task-priority-icon");
    statsPriorityIcon.setAttribute("data-priority", priority)
}
function updateStatsPriorityIconColor(priority) {
    const statsPriorityIcon = taskStatsSection.querySelector(".task-priority-icon");
    if (!statsPriorityIcon) {
        console.warn("Priority icon not found!");
        return;
    }
    const iconMap = {
        low: "blue_flag.png",
        medium: "yellow_flag.png",
        high: "red_flag.png",
        none: "grey_flag.png"
    };
    const fileName = iconMap[priority] || iconMap.none;
    statsPriorityIcon.src = `images/todo-container/priorities-icon/${fileName}`; 
}

// --- Checkbox color ---
function updateCheckBoxColor(priority) {
    const checkBox = taskStatsSection.querySelector(".task-checkbox-stats");
    if (checkBox) {
        checkBox.classList.remove("priority-low-checkbox", "priority-medium-checkbox", "priority-high-checkbox", "priority-none-checkbox");
        checkBox.classList.add(`priority-${priority}-checkbox`);  
    } else {
        console.warn("Checkbox not found in stats section!");
    }
}

// --- Description ---
function displayTaskDescription(taskId) {
    const taskDescriptionElement = taskStatsSection.querySelector(".description");
    const task = tasks.find(t => t.taskId === Number(taskId));
    if (task) {
        taskDescriptionElement.textContent = task.description || "";
    } else {
        taskDescriptionElement.textContent = "";
    }
}
function setupTaskDescriptionInput(taskId) {
    const taskDescriptionElement = taskStatsSection.querySelector(".description");
    // Remove previous event listeners by cloning the node
    const newDescriptionElement = taskDescriptionElement.cloneNode(true);
    taskDescriptionElement.parentNode.replaceChild(newDescriptionElement, taskDescriptionElement);
    newDescriptionElement.addEventListener("input", () => {
        const task = tasks.find(t => t.taskId === Number(taskId));
        if (task) {
            task.description = newDescriptionElement.textContent;
            localStorage.setItem("tasks", JSON.stringify(tasks));
        }
    });
}

// --- Subtasks ---

function renderSubtasksForTask(task) {
    const subTaskList = taskStatsSection.querySelector(".sub-task-list");
    subTaskList.innerHTML = ""; // Clear previous subtasks

    if (!Array.isArray(task.subtasks)) return;

    task.subtasks.forEach((subtask, idx) => {
        const newSubtask = document.createElement("div");
        newSubtask.classList.add("sub-task-container");
        newSubtask.setAttribute("data-task-id", task.taskId);
        newSubtask.setAttribute("data-subtask-idx", idx);

        newSubtask.innerHTML = `
            <div class="sub-task">
                <input type="checkbox" class="task-checkbox priority-none-checkbox" ${subtask.completed ? "checked" : ""}>
                <div class="task-text" contenteditable="true">${subtask.text}</div>
            </div>
            <div class="sub-task-more-container task-more-container">
                <img src="images/todo-container/more.png" class="sub-task-more-icon" alt="more">
                <div class="sub-task-more-menu hidden-element">
                    <section class="sub-task-actions-section">
                        <div class="sub-task-action-container add-subtask-container">
                            <img src="images/todo-container/Subtask.png" alt="subtask" class="task-more-section-icon">
                            <div class="sub-task-action add-subtask">Add Subtask</div>
                        </div>
                    </section>
                    <section class="sub-task-complete-section">
                        <div class="sub-task-wont-do-container">
                            <img src="images/todo-container/icons8-remove-50.png" alt="wont do" class="task-more-section-icon">
                            <div class="sub-task-action wont-do">Won't Do</div>
                        </div>
                        <div class="sub-task-delete-container">
                            <img src="images/todo-container/icons8-trash-can-50.png" alt="complete" class="task-more-section-icon">
                            <div class="sub-task-action complete">Delete</div>
                        </div>
                    </section>
                </div>
            </div>
        `;
        subTaskList.appendChild(newSubtask);

        // Add subtask event handlers
        newSubtask.querySelector(".add-subtask").addEventListener("click", (e) => {
            e.stopPropagation();
            addSubtask(task.taskId);
        });

        // Checkbox handler
        newSubtask.querySelector(".task-checkbox").addEventListener("change", (e) => {
            subtask.completed = e.target.checked;
            localStorage.setItem("tasks", JSON.stringify(tasks));
        });

        // Text edit handler
        newSubtask.querySelector(".task-text").addEventListener("input", (e) => {
            subtask.text = e.target.textContent;
            localStorage.setItem("tasks", JSON.stringify(tasks));
        });

        // Delete handler
        newSubtask.querySelector(".sub-task-delete-container").addEventListener("click", (e) => {
            e.stopPropagation();
            task.subtasks.splice(idx, 1);
            localStorage.setItem("tasks", JSON.stringify(tasks));
            renderSubtasksForTask(task);
        });

        // Menu toggle logic (as before)
        const moreIcon = newSubtask.querySelector('.sub-task-more-icon');
        const moreMenu = newSubtask.querySelector('.sub-task-more-menu');
        moreIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.sub-task-more-menu').forEach(menu => {
                if (menu !== moreMenu) menu.classList.add('hidden-element');
            });
            moreMenu.classList.toggle('hidden-element');
        });
    });
}
// Hide all subtask menus when clicking outside
document.addEventListener('click', (e) => {
    // Only close menus if the click is outside any .sub-task-more-menu
    if (!e.target.closest('.sub-task-more-menu')) {
        document.querySelectorAll('.sub-task-more-menu').forEach(menu => {
            if (!menu.classList.contains('hidden-element')) {
                menu.classList.add('hidden-element');
            }
        });
    }
});

// Add a subtask to the currently selected task in stats panel
export function addSubtask(taskId) {
    const task = tasks.find(t => t.taskId === Number(taskId));
    if (!task) return;
    if (!Array.isArray(task.subtasks)) task.subtasks = [];
    task.subtasks.push({ text: "", completed: false });
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderSubtasksForTask(task);
}

// --- Description placeholder logic ---
function isEmpty(el) {
    return (
        el.innerHTML.trim() === "" ||
        el.innerHTML.trim() === "<br>" ||
        el.textContent.trim() === ""
    );
}
function applyPlaceholder() {
    if (isEmpty(editable)) {
        editable.classList.add("placeholder");
        editable.innerText = placeholderText;
    }
}
function removePlaceholder() {
    if (editable.classList.contains("placeholder")) {
        editable.innerText = "";
        editable.classList.remove("placeholder");
    }
}
function handleInput() {
    if (isEmpty(editable)) {
        applyPlaceholder();
    } else if (editable.classList.contains("placeholder")) {
        editable.classList.remove("placeholder");
    }
}
editable.addEventListener("focus", removePlaceholder);
editable.addEventListener("blur", applyPlaceholder);
editable.addEventListener("input", handleInput);

function updateTaskPriority(taskId, priority) {
    const task = tasks.find(t => t.taskId === Number(taskId));
    if (!task) {
        console.error(`Task with ID ${taskId} not found.`);
        return;
    };
    task.priority = priority;
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderUpdatedTaskPriority(taskId) {
    const priorityIconOptions = taskStatsSection.querySelectorAll(".todo-priority-container");

    // Remove previous listeners by cloning and replacing each option
    priorityIconOptions.forEach(option => {
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);

        newOption.addEventListener("click", () => {
            const newPriority = newOption.querySelector(".priority-text").textContent.toLowerCase();
            updateTaskPriority(taskId, newPriority);
            updateStatsPriorityIcon(newPriority);
            updateStatsPriorityIconColor(newPriority);
            updateCheckBoxColor(newPriority);
            updateTaskCheckboxColor(taskId, newPriority);
        });
    });
}
function updateTaskCheckboxColor(taskId, priority) {
    const taskOnThePage = document.querySelector(`.task-more-container[data-id="${taskId}"]`);
    if (taskOnThePage) {
        const taskCheckbox = taskOnThePage.querySelector(".task-checkbox");
        taskCheckbox.classList.remove("priority-high-checkbox", "priority-low-checkbox", "priority-medium-checkbox", "priority-none-checkbox");
        taskCheckbox.classList.add(`priority-${priority}-checkbox`);
    } else {
        console.error(`Task with ID ${taskId} not found.`);
    }
}

function updatePageForNewSelectedFolder(taskId, folderName, folderColor, folderId) {
    const task = tasks.find(t => t.taskId === Number(taskId));
    if (!task) {
        console.error(`Task with ID ${taskId} not found.`);
        return;
    };

    if (folderId === "1") {
        folderName = "Task Queue";
    }

    
    const taskOnThePage = document.querySelector(`.task-more-container[data-id="${taskId}"]`);
    if (taskOnThePage) {
        const statsFolderDisplayContainer = taskStatsSection.querySelector(".task-folder-container-stats");
        statsFolderDisplayContainer.textContent = folderName;

        const taskFolderIndicator = taskOnThePage.querySelector(".task-folder");
        taskFolderIndicator.textContent = folderName;

        const taskFolderIndicatorColorCircle = taskOnThePage.querySelector(".folder-color-code-circle");
        const taskFolderIndicatorColorBar = taskOnThePage.querySelector(".folder-color-code-bar");
        taskFolderIndicatorColorCircle.style.backgroundColor = folderColor;
        taskFolderIndicatorColorBar.style.backgroundColor = folderColor;
    } else {
        console.error(`Task with ID ${taskId} not found.`);
    }

    task.folderId = folderId;
    tasks.find(t => t.taskId === Number(taskId)).folderId = folderId;
    taskOnThePage.dataset.folderId = folderId;

    reapplyCurrentFilter(); // <--- Add this line
    localStorage.setItem("tasks", JSON.stringify(tasks));   

    // Update task group counters after filter and visibility change
    document.querySelectorAll(".task-group").forEach(group => {
        hideEmptyTaskGroups()
        updateTaskGroupCount(group);  // or updateTaskGroupCount depending on your function name
    });
}

export function setupFolderMenuListeners() {
    const statsFolderSelectorMenu = document.querySelector(".folder-menu-dynamic");
    const statsFolderSelectorMenuItems = statsFolderSelectorMenu.querySelectorAll(".folder-menu-container");

    statsFolderSelectorMenuItems.forEach(folderMenuItem => {
        folderMenuItem.addEventListener("click", () => {
            const taskId = taskStatsSection.getAttribute("data-id");
            const folderName = folderMenuItem.querySelector(".folder-menu-name").textContent;
            const folderId = folderMenuItem.dataset.id; 
            const folderColor = folderMenuItem.dataset.color;
            console.log("Folder name: " + folderName);
            console.log("Folder ID: " + folderId);
            console.log("Folder color: " + folderColor);
            console.log("folder Id: " + folderId);

            updatePageForNewSelectedFolder(taskId, folderName, folderColor, folderId);
        });
    });
}

export function updateStatsFolderDisplay(folderName) {
    const statsFolderDisplayContainer = taskStatsSection.querySelector(".task-folder-container-stats");

    if (statsFolderDisplayContainer) {
        statsFolderDisplayContainer.textContent = folderName;
    } else {
        console.error("Stats folder display container not found.");
    }
    
}

function deleteTaskFromStats(taskId) {
    const taskElement = document.querySelector(`.task-more-container[data-id="${taskId}"]`);
    if (taskElement) {
        taskElement.remove();
    }

    // Update task group counters after filter and visibility change
    document.querySelectorAll(".task-group").forEach(group => {
        hideEmptyTaskGroups();
        updateTaskGroupCount(group);  // or updateTaskGroupCount depending on your function name
    });

    // Remove task from tasks array
    const taskIndex = tasks.findIndex(t => t.taskId === Number(taskId));
    if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1);
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    clearStatsPanel();
}


function updateStatsTaskDueDateDisplayColor(task) {
    const statsTaskDueDateDisplay = document.querySelector(".task-due-date-stats");
    if (statsTaskDueDateDisplay) {
        statsTaskDueDateDisplay.classList.remove("due-date-overdue-stats");
        statsTaskDueDateDisplay.classList.remove("due-date-future-stats");
    }
    const taskDate = assignTaskDataDate(task);
    if (taskDate === "overdue") {
        statsTaskDueDateDisplay.classList.add("due-date-overdue-stats");
        statsTaskDueDateDisplay.classList.remove("due-date-future-stats");
    } else if (taskDate === "none") {
        statsTaskDueDateDisplay.classList.remove("due-date-overdue-stats");
        statsTaskDueDateDisplay.classList.remove("due-date-future-stats");
    } else {
        statsTaskDueDateDisplay.classList.remove("due-date-overdue-stats");
        statsTaskDueDateDisplay.classList.add("due-date-future-stats");
    }
}

export function clearStatsPanel() {
    const statsPanel = document.querySelector("#todo-stats");
    
    const statsCheckbox = statsPanel.querySelector(".task-checkbox-stats");
    const statsDueDateDisplay = statsPanel.querySelector(".task-due-date-stats");
    const statsPriorityIcon = statsPanel.querySelector(".task-priority-icon");
    const taskTitle = statsPanel.querySelector(".task-title");
    const taskDescription = statsPanel.querySelector(".description");
    const subTaskList = statsPanel.querySelector(".sub-task-list");
    const taskFolderDisplayContainer = statsPanel.querySelector(".task-folder-container-stats");

    statsCheckbox.checked = false;
    statsCheckbox.classList.remove("priority-high-checkbox", "priority-medium-checkbox", "priority-low-checkbox", "priority-none-checkbox");
    statsCheckbox.classList.add("priority-none-checkbox");

    statsDueDateDisplay.textContent = "";
    statsPriorityIcon.src = "images/todo-container/priorities-icon/grey_flag.png";

    taskTitle.innerHTML = "Choose a task to edit";
    taskTitle.classList.add("placeholder");
    taskTitle.contentEditable = "false";
    taskDescription.innerHTML = "Write description for the task...";
    taskDescription.classList.add("placeholder");
    taskDescription.contentEditable = "false";

    subTaskList.innerHTML = "";
    taskFolderDisplayContainer.innerHTML = "(No Folder)";

    statsPanel.removeAttribute("data-id");
    statsPanel.classList.remove("pop-up-stats-panel");
}

function popUpStatsPanelInSmallScreen() {
    const statsPanel = document.querySelector("#todo-stats");
    const isSmallScreen = window.matchMedia("(max-width: 1094px)").matches;
    const menu = document.querySelector("#todolist-menu");

    if (isSmallScreen) {
        statsPanel.classList.add("pop-up-stats-panel");
        addCloseStatsPanelButtonInSmallScreen();
        menu.classList.remove("pop-up-menu");
    } else {
        statsPanel.classList.remove("pop-up-stats-panel");
    }
}

function addCloseStatsPanelButtonInSmallScreen() {
    const statsPanel = document.querySelector("#todo-stats");
    const statsHeaderLeft = document.querySelector(".important-task-info-container-left");

    const closeStatsPanelButton = statsHeaderLeft.querySelector(".close-stats-panel-icon");
    if (closeStatsPanelButton) {
        closeStatsPanelButton.remove();
    }

    const closeButton = document.createElement("img");
    closeButton.src = "images/todo-container/icons8-close-16.png";
    closeButton.classList.add("close-stats-panel-icon");
    statsHeaderLeft.prepend(closeButton);

    closeButton.addEventListener("click", () => {
        statsPanel.classList.remove("pop-up-stats-panel");
        console.log("Stats panel closed in small screen");
    });
}
