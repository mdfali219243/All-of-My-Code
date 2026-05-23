import { folders, loadFoldersFromLocalStorage } from "./folder.js";
import { reapplyCurrentFilter, getCurrentDateFilter } from "../scripts/menu.js";
import { addSubtask, statsTaskDueDateFormatter, updateStatsFolderDisplay, clearStatsPanel } from "../scripts/stats.js";

document.addEventListener("DOMContentLoaded", () => {
    loadFoldersFromLocalStorage();
    loadTasksFromLocalStorage(); // Restore saved tasks
    reapplyCurrentFilter();
    // clearTasksOnce();

});

export let tasks = [];

const addTaskButton = document.querySelector(".todo-input-icon-container"); 
const deleteTaskButtons = document.querySelectorAll(".task-delete-icon-container");
const taskMoreIconDueDates = document.querySelectorAll(".task-more-date-icon");


addTaskButton.addEventListener("click", () => {
    addTask();
    clearTaskInput();
    clearTaskInputFolder();
})

deleteTaskButtons.forEach(deleteButton => {
    deleteButton.addEventListener("click", () => {
        const taskId = deleteButton.getAttribute("data-id");
        deleteTask(taskId);
        saveTasksToLocalStorage();
    });
});   

document.addEventListener("click", function(event) {
    // Handle clicks on folder options inside task-more-folder-menu
    const folderItem = event.target.closest(".folder-menu-container");
    if (folderItem && folderItem.closest(".task-more-folder-menu")) {
        const folderId = folderItem.getAttribute("data-id");
        const folderColor = folderItem.getAttribute("data-color");
        const folderName = folderItem.querySelector(".folder-menu-name").textContent;
        const menu = folderItem.closest(".task-more-folder-menu");
        const taskId = menu.getAttribute("data-id");
        updateTaskFolder(folderId, folderColor, folderName, taskId);
    }
});

document.addEventListener("click", function(e) {
    if (e.target.matches(".task-more-date-icon")) {
        const icon = e.target;
        const taskMoreIconDueDatesContainer = icon.closest(".task-more-date-icons");
        const taskId = taskMoreIconDueDatesContainer.getAttribute("data-id");
        const dueDate = icon.getAttribute("data-date");
        updateTaskDueDate(taskId, dueDate);
    } else if (e.target.matches(".task-more-priority-icon")) {
        const icon = e.target;
        const taskMoreIconPriorityContainer = icon.closest(".task-more-priority-icons");
        const taskId = taskMoreIconPriorityContainer.getAttribute("data-id");
        const priority = icon.getAttribute("data-priority");
        updateTaskPriority(taskId, priority);
    }
});



const todoDateIcon = document.getElementById("todo-date-icon");
const todoDateInput = document.getElementById("todo-date-input");
const todoDateChosen = document.querySelector(".todo-date-chosen");

document.getElementById("todo-date-input").addEventListener("change", (e) => {
    handleDateChange(e.target.value);
});

const inputPriorityIcon = document.querySelector(".todo-input-priority-icon-js");
const inputPriorityIconMenu = document.querySelector(".todo-priority-menu");
const inputPriorityMenuOptions = document.querySelectorAll(".todo-priority-container");

inputPriorityMenuOptions.forEach(option => {
    option.addEventListener("click", () => {
        // Remove 'current-priority' from all
        inputPriorityMenuOptions.forEach(opt => opt.classList.remove("current-priority"));
        option.classList.add("current-priority");

        // Get the priority text inside the clicked option
        const priorityText = option.querySelector(".priority-text").textContent.trim();

        const priorityIcons = {
            High: "images/todo-container/priorities-icon/red_flag.png",
            Medium: "images/todo-container/priorities-icon/yellow_flag.png",
            Low: "images/todo-container/priorities-icon/blue_flag.png",
            None: "images/todo-container/priorities-icon/grey_flag.png"
        };

        const priorityIds = {
            High: "high",
            Medium: "medium",
            Low: "low",
            None: "none"
        };

        // Set icon
        inputPriorityIcon.src = priorityIcons[priorityText] || priorityIcons["None"];

        // Set data-id on the icon element
        inputPriorityIcon.setAttribute("data-id", priorityIds[priorityText] || "none");

        // Hide the menu
        inputPriorityIconMenu.classList.add("hidden-element");
    });
});




function addTask() {
    const taskInput = document.getElementById("todo-input");
    const taskText = taskInput.value.trim();
    if (taskText == "") {
        alert("Task name is required.");
        return;
    }

    const taskId = Date.now();
    const dueDate = document.getElementById("todo-date-input").value;
    const formattedDueDate = dueDate ? handleDateChange(dueDate) : "";

    const folderIconContainer = document.querySelector(".todo-input-folder-icon-container");
    let folderId = folderIconContainer?.getAttribute("data-id");
    if (folderId === null) {
        folderId = 1;
    }

    const priorityIcon = document.querySelector(".todo-input-priority-icon-js");
    const priorityId = priorityIcon?.getAttribute("data-id") || "none";

    const newTask = {
        taskId,
        taskName: taskText,
        completed: false,
        wontDo: false,
        dueDate,
        formattedDueDate,
        folderId: folderId || null,
        priority: priorityId,
        description: null,
    };

    tasks.push(newTask);
    renderTasks(newTask);
    saveTasksToLocalStorage();
    reapplyCurrentFilter(); // Reapply current filter after adding a task

    console.log(tasks);
}



function renderTasks(task) {
    const folder = folders[task.folderId];

    const folderBarColor = folder ? folder.folderColor : "transparent";
    const folderCircle = folder
        ? `<div class="folder-color-code-circle" style="background-color: ${folder.folderColor};"></div>`
        : "<div class='folder-color-code-circle'></div>";
    const folderName = folder
        ? `<div class="task-folder">${folder.folderName}</div>`
        : "<div class='task-folder'></div>";
    let dueDate;
    // Assign the data-date values of "overdue", "today", "tomorrow", "week", "later", or "none" based on the task's due date to .task element.
    const taskDate = assignTaskDataDate(task);
    if (taskDate === "overdue") {
        dueDate = `<div class="due-date-overdue task-due-date">${task.formattedDueDate}</div>`;
    } else if (taskDate === "none") {
        dueDate = `<div class='due-date task-due-date'></div>`;
    } else {
        dueDate = `<div class="due-date-future task-due-date">${task.formattedDueDate}</div>`;
    }
    
    

    

    const taskHTML = `
        <div class="task-more-container" data-date="${taskDate}" data-due-date="${task.dueDate}" data-folder-id="${task.folderId}" data-id="${task.taskId}">
            <div class="task">
                <div class="left-side-task">
                    <div class="folder-color-code-bar" style="background-color: ${folderBarColor};"></div>
                    <input type="checkbox" class="task-checkbox priority-${task.priority}-checkbox" data-id="${task.taskId}" ${task.completed ? "checked" : ""}>
                    <div class="task-text">${task.taskName}</div>
                </div>
                <div class="right-side-task">
                    ${folderCircle}
                    ${folderName}
                    ${dueDate}
                </div>
            </div>
            <div class="task-more-icon-container" data-id="${task.taskId}">
                <img src="images/todo-container/more.png" class="task-more-icon" alt="more">
                <div class="task-more-icon-menu-container hidden-element">
                    <section class="task-more-date-section">
                        <div class="menu-header">Date</div>
                        <div class="task-more-date-icons" data-id="${task.taskId}">
                            <img src="images/todo-dates-icons/today_icon.png" alt="today" class="task-more-date-icon" data-date="today">
                            <img src="images/todo-dates-icons/tomorrow_icon.png"  alt="tomorrow" class="task-more-date-icon" data-date="tomorrow">
                            <img src="images/todo-dates-icons/week_icon.png" alt="week" class="task-more-date-icon" data-date="week">
                            <img src="images/todo-container/icons8-day-off-24.png" alt="clear date" class="task-more-date-icon" data-date="none">
                        </div>
                    </section>
                    <section class="task-more-priority-section">
                        <div class="task-more-priority menu-header">Priority</div>
                        <div class="task-more-priority-icons" data-id="${task.taskId}">
                            <img src="images/todo-container/priorities-icon/red_flag.png" alt="priority" class="task-more-priority-icon" data-priority="high">
                            <img src="images/todo-container/priorities-icon/yellow_flag.png" alt="priority" class="task-more-priority-icon" data-priority="medium">
                            <img src="images/todo-container/priorities-icon/blue_flag.png" alt="priority" class="task-more-priority-icon" data-priority="low">
                            <img src="images/todo-container/priorities-icon/grey_flag.png" alt="priority" class="task-more-priority-icon" data-priority="none">
                        </div>
                    </section>
                    <section class="task-more-section task-subtask-icon-container" data-id="${task.taskId}">
                        <div class="task-more-icon-section-container">
                            <img src="images/todo-container/Subtask.png" alt="subtask" class="task-more-section-icon">
                            <div class="task-more-action-name">Add Subtask</div>
                        </div>
                        <div class="task-more-icon-section-container task-move-folder-icon-container" data-id="${task.taskId}">
                            <img src="images/todo-container/move_folder.png" alt="move" class="task-more-section-icon">
                            <div class="task-more-action-name">Move To</div>
                            <div class="task-more-folder-icon-container">
                                <img src="images/todo-container/icons8-forward-16.png" class="task-more-folder-icon">
                            </div>
                            <div class="task-more-folder-menu hidden-element" data-id="${task.taskId}">
                                <div class="search-folder-container">
                                    <img src="images/todo-container/icons8-search-16.png" alt="search icon" class="search-folder-icon">
                                    <input type="text" placeholder="Search folders..." class="search-folder-input">
                                </div>
                                <div class="folder-menu-list-container">
                                    <div class="folder-menu-dynamic task-more-folder-menu-dynamic"></div>
                                </div> 
                            </div>
                        </div>
                    </section>
                    <section class="task-more-section">
                        <div class="task-more-icon-section-container task-wont-do-icon-container" data-id="${task.taskId}">
                            <img src="images/todo-container/icons8-remove-50.png" alt="edit" class="task-more-section-icon">
                            <div class="task-more-action-name">Won't Do</div>
                        </div>
                        <div class="task-more-icon-section-container task-delete-icon-container" data-id="${task.taskId}">
                            <img src="images/todo-container/icons8-trash-can-50.png" alt="delete" class="task-more-section-icon">
                            <div class="task-more-action-name">Delete</div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    `;

    // Always render in the completed group if task is completed
    const targetGroup = task.completed ? 
        document.querySelector('.task-group[data-date="completed"]') : 
        document.querySelector(`.task-group[data-date="${taskDate}"]`);

        if (targetGroup) {
            const taskContainer = targetGroup.querySelector(".tasks");
            if (taskContainer) {
                taskContainer.insertAdjacentHTML("beforeend", taskHTML);
    
                const insertedTask = taskContainer.querySelector(`.task-more-container[data-id="${task.taskId}"]`);
    
                if (insertedTask) {
                    if (task.completed) {
                        insertedTask.classList.add("completed-task");
                    }
    
                    const moveFolderButtonMoreMenu = insertedTask.querySelector(`.task-move-folder-icon-container[data-id="${task.taskId}"]`);
                    const moveFolderMoreMenu = insertedTask.querySelector(`.task-more-folder-menu[data-id="${task.taskId}"]`);
    
                    if (moveFolderButtonMoreMenu && moveFolderMoreMenu) {
                        moveFolderButtonMoreMenu.addEventListener("mouseenter", () => {
                            moveFolderMoreMenu.classList.remove("hidden-element");
                        });
    
                        moveFolderButtonMoreMenu.addEventListener("mouseleave", () => {
                            moveFolderMoreMenu.classList.add("hidden-element");
                        });
    
                        // Also add mouseleave on the actual menu to allow for hover-inside behavior
                        moveFolderMoreMenu.addEventListener("mouseleave", () => {
                            moveFolderMoreMenu.classList.add("hidden-element");
                        });
    
                        moveFolderMoreMenu.addEventListener("mouseenter", () => {
                            moveFolderMoreMenu.classList.remove("hidden-element");
                        });
                    }
                }
    
                incrementTaskGroupCount(targetGroup);
                targetGroup.style.display = "flex";
            }
        }


    console.log(task);
    deleteTaskFromThePage(task);
    populateTaskFolderMenu(task.taskId);
    attachTaskCheckboxListeners(task.taskId);
    showTaskMoreMenus();
    return document.querySelector(`.task-more-container[data-id="${task.taskId}"]`);
}

function showTaskMoreMenus() {
    const taskMoreIcons = document.querySelectorAll(".task-more-icon");

    let currentlyOpenMenu = null;

    taskMoreIcons.forEach(icon => {
        icon.addEventListener("click", (e) => {
            e.stopPropagation();

            const taskElement = icon.parentElement;
            const menu = taskElement.querySelector(".task-more-icon-menu-container");

            // Scroll task into view with some margin
            taskElement.scrollIntoView({ behavior: "smooth", block: "nearest" });

            // Close old menu if open
            if (menu === currentlyOpenMenu) {
                menu.classList.add("hidden-element");
                currentlyOpenMenu = null;
            } else {
                if (currentlyOpenMenu) {
                    currentlyOpenMenu.classList.add("hidden-element");
                }

                menu.classList.remove("hidden-element");
                currentlyOpenMenu = menu;
            }
        });
    });

    // Close any open menu when clicking outside
    document.addEventListener("click", () => {
        if (currentlyOpenMenu) {
            currentlyOpenMenu.classList.add("hidden-element");
            currentlyOpenMenu = null;
        }
    });
}


export function displayTaskInCorrectGroup(task) {
    let taskContainer = "";
    const taskDate = assignTaskDataDate(task);
    const taskGroup = document.querySelector(`.task-group[data-date="${taskDate}"]`);
    incrementTaskGroupCount(taskGroup); // Increment task count in the group

    if (taskGroup) {
        taskContainer = taskGroup.querySelector(".tasks");
    } 


    return taskContainer
}

export function assignTaskDataDate(task) {

    let taskDate = "none";

    if (task.dueDate) {
        const [year, month, day] = task.dueDate.split("-");
        const taskDueDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        taskDueDate.setHours(0, 0, 0, 0);

        const diffInDays = Math.round((taskDueDate - today) / (1000 * 60 * 60 * 24));

        if (diffInDays < 0) {
            taskDate = "overdue";
        } else if (diffInDays === 0) {
            taskDate = "today";
        } else if (diffInDays === 1) {
            taskDate = "tomorrow";
        } else if (diffInDays <= 7) {
            taskDate = "week";
        } else {
            taskDate = "later";
        }
    }

    return taskDate;
}



export function handleDateChange(dateValue) {
    if (!dateValue) return;

    const [year, month, day] = dateValue.split("-");
    const selectedDate = new Date(year, month - 1, day); // local time
    const today = new Date();

    // Strip time from both
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const dateDisplay = document.querySelector(".todo-date-chosen");
    if (!dateDisplay) return;

    // Clear previous classes
    dateDisplay.classList.remove("previous-date", "future-date");

    // Calculate difference in full days
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffInDays = Math.round((selectedDate - today) / msPerDay);

    // Add class
    if (diffInDays < 0) {
        dateDisplay.classList.add("previous-date");
    } else {
        dateDisplay.classList.add("future-date");
    }

    // Display logic
    let formatted;
    if (diffInDays === 0) {
        formatted = "Today";
    } else if (diffInDays === -1) {
        formatted = "Yesterday";
    } else if (diffInDays === 1) {
        formatted = "Tomorrow";
    } else if (diffInDays > 1 && diffInDays <= 7) {
        formatted = selectedDate.toLocaleDateString("en-US", { weekday: "short" }); // e.g. "Fri"
    } else {
        const currentYear = today.getFullYear();
        const selectedYear = selectedDate.getFullYear();

        if (selectedYear === currentYear) {
            formatted = selectedDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
            });
        } else {
            formatted = `${selectedYear}/${String(selectedDate.getMonth() + 1).padStart(2, "0")}/${String(selectedDate.getDate()).padStart(2, "0")}`;
        }
    }

    dateDisplay.textContent = formatted;
    return formatted;
}

export function saveTasksToLocalStorage() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// load tasks from local storage including completed tasks
export function loadTasksFromLocalStorage() {
    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
        tasks.splice(0, tasks.length, ...JSON.parse(storedTasks));

        // CLEAR all existing task containers before rendering again
        const allTaskContainers = document.querySelectorAll(".tasks");
        allTaskContainers.forEach(container => container.innerHTML = "");

        // RESET all number-of-tasks counts to 0
        const allGroupCounters = document.querySelectorAll(".task-group .number-of-tasks");
        allGroupCounters.forEach(counter => counter.textContent = "0");

        tasks.forEach(task => {
            // Render the task first
            const taskElement = renderTasks(task);
            
            // Attach checkbox listeners
            attachTaskCheckboxListeners(task.taskId);
            
            // If task is completed, move it to completed group
            if (task.completed) {
                const completedGroup = document.querySelector('.task-group[data-date="completed"]');
                if (completedGroup) {
                    completedGroup.style.display = ""; // Make sure the group is visible
                    taskElement.classList.add("completed-task");
                    const completedTasksContainer = completedGroup.querySelector('.tasks');
                    completedTasksContainer.appendChild(taskElement);
                    incrementTaskGroupCount(completedGroup);
                }
            }
        });
        
        showTaskMoreMenus(); // Re-attach listeners
        hideEmptyTaskGroups(); // Hide empty groups after rendering
    }
}



function clearTaskInput() {
  const taskInput = document.getElementById("todo-input");
  const taskDueDate = document.getElementById("todo-date-input");
  const taskPriority = document.querySelector(".todo-input-priority-icon-js");

  taskInput.value = "";
  taskDueDate.value = "";

  if (taskPriority) {
    taskPriority.src = "images/todo-container/priorities-icon/grey_flag.png";
    taskPriority.setAttribute("data-id", "none");
  } else {
    console.warn("Priority icon not found");
  }

  const dateDisplay = document.querySelector(".todo-date-chosen");
  if (dateDisplay) {
    dateDisplay.textContent = "";
    dateDisplay.classList.remove("previous-date", "future-date");
  }
}

function clearTaskInputFolder() {
    const taskFolderIconContainer = document.querySelector(".todo-input-folder-icon-container");

    if (!taskFolderIconContainer) {
        console.warn("Folder icon container not found.");
        return;
    }

    // Clear the container
    taskFolderIconContainer.innerHTML = "";

    // Create a new image element
    const img = document.createElement("img");
    img.src = "images/todo-container/move_folder.png";
    img.classList.add("todo-input-folder-icon-js");
    img.classList.add("todo-input-modifier-icons");
    img.alt = "folder icon";

    // Reset container
    taskFolderIconContainer.setAttribute("data-id", "none");
    taskFolderIconContainer.classList.remove("current-folder");
    taskFolderIconContainer.appendChild(img);

    // Remove current-folder from selected menu option (if any)
    const currentSelectedFolder = document.querySelector(".folder-menu-container.current-folder");
    if (currentSelectedFolder) {
        currentSelectedFolder.classList.remove("current-folder");
    }
}




// Hide any group that has 0 tasks.
// Hide any group that has 0 visible tasks.
export function hideEmptyTaskGroups() {
    const taskGroups = document.querySelectorAll(".task-group");
    taskGroups.forEach(taskGroup => {
        const tasksContainer = taskGroup.querySelector('.tasks');
        if (!tasksContainer) {
            taskGroup.style.display = "none";
            return;
        }
        const allTaskContainers = tasksContainer.querySelectorAll('.task-more-container');
        const visibleTaskContainers = Array.from(allTaskContainers)
            .filter(container => getComputedStyle(container).display !== "none");
        if (allTaskContainers.length === 0 || visibleTaskContainers.length === 0) {
            taskGroup.style.display = "none";
        } else {
            taskGroup.style.display = "flex";
        }
    });
}
// Increment task-groups ".number-of-tasks" when a task is added.
function incrementTaskGroupCount(taskGroup) {
    const taskCountElement = taskGroup.querySelector(".number-of-tasks");
    let currentCount = parseInt(taskCountElement.textContent, 10);
    taskCountElement.textContent = currentCount + 1;
}

function decrementTaskGroupCount(taskGroup) {
    const countElement = taskGroup.querySelector(".number-of-tasks");
    let count = parseInt(countElement.textContent, 10);

    if (count > 0) {
        countElement.textContent = count - 1;
    }

    // If count now 0 and we're in "all", hide the group
    if (count - 1 === 0 && getCurrentDateFilter() === "all") {
        taskGroup.style.display = "none";
    }
}

export function updateTaskGroupCount(taskGroup) {
    const taskCountElement = taskGroup.querySelector(".number-of-tasks");
    if (!taskCountElement) return;

    const tasksContainer = taskGroup.querySelector('.tasks');
    if (!tasksContainer) {
        taskCountElement.textContent = "0";
        return;
    }

    const allTasks = tasksContainer.querySelectorAll(".task-more-container");
    let visibleCount = 0;
    allTasks.forEach(task => {
        if (getComputedStyle(task).display !== "none") {
            visibleCount++;
        }
    });

    taskCountElement.textContent = visibleCount;
}

export function deleteTaskFromThePage(task) {
    const taskContainer = displayTaskInCorrectGroup(task);
    if (!taskContainer) {
        console.error("Task container not found for task:", task);
        return;
    }
    
    const taskElement = document.querySelector(`.task-more-container[data-id="${task.taskId}"]`);
    if (!taskElement) {
        console.error("Task element not found for ID:", task.taskId);
        return;
    }

    const deleteButton = taskElement.querySelector(".task-delete-icon-container");
    if (deleteButton) {
        // Remove any existing click listeners to prevent duplicates
        const newDeleteButton = deleteButton.cloneNode(true);
        deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);
        
        newDeleteButton.addEventListener("click", (e) => {
            e.stopPropagation();
            const taskId = newDeleteButton.getAttribute("data-id");
            const taskToRemove = document.querySelector(`.task-more-container[data-id="${taskId}"]`);
            const taskGroup = taskToRemove?.closest(".task-group");
            
            if (taskToRemove) {
                taskToRemove.remove();
                if (taskGroup) {
                   decrementTaskGroupCount(taskGroup); // Update the task count after removal
                }
                deleteTask(Number(taskId));
            }
        });
    }
}

export function deleteAllTasksInFolder(targetFolderId) {
    // Mutate tasks array in place
    const filtered = tasks.filter(task => String(task.folderId) !== String(targetFolderId));
    tasks.splice(0, tasks.length, ...filtered);

    // Remove matching DOM elements
    const taskElements = document.querySelectorAll(`[data-folder-id="${targetFolderId}"]`);
    taskElements.forEach(el => el.remove());

    hideEmptyTaskGroups();
    reapplyCurrentFilter();
    saveTasksToLocalStorage();
}

function deleteTask(taskId) {
    const index = tasks.findIndex(task => task.taskId === Number(taskId));
    if (index !== -1) {
      tasks.splice(index, 1);
      saveTasksToLocalStorage();
      clearStatsPanel();
    }
}

function updateTaskDueDate(taskId, relativeDate) {
    const task = tasks.find(task => task.taskId === Number(taskId));
    if (!task) return;

    const taskElement = document.querySelector(`.task-more-container[data-id="${taskId}"]`);
    if (!taskElement) return;

    const dateMap = {
        today: 0,
        tomorrow: 1,
        week: 7,
        none: null,
    };

    let finalDueDate = "";

    if (relativeDate !== "none") {
        const daysToAdd = dateMap[relativeDate];
        const today = new Date();
        today.setDate(today.getDate() + daysToAdd);
        finalDueDate = today.toISOString().split("T")[0]; // e.g., "2025-07-19"
    }

    // 1. Remove from current group and update its counter
    const oldGroup = taskElement.closest(".task-group");
    taskElement.remove();
    if (oldGroup) {
        updateTaskGroupCount(oldGroup);
    }

    // 2. Update dueDate and formattedDueDate & stats panel (if opening this task)
    task.dueDate = finalDueDate;
    task.formattedDueDate = finalDueDate ? handleDateChange(finalDueDate) : "";
    const statsPanel = document.querySelector(`#todo-stats[data-id="${taskId}"]`);
    if (statsPanel) {
        const statsDueDateFormatter = statsTaskDueDateFormatter(task.dueDate);
        statsPanel.querySelector(".task-due-date-stats").textContent = statsDueDateFormatter;
    }   

    // 3. Save changes
    saveTasksToLocalStorage();

    // 4. Re-render this task in new group
    renderTasks(task);

    // 5. Hide empty groups and reapply any filters
    hideEmptyTaskGroups();
    reapplyCurrentFilter();
}

function updateTaskPriority(taskId, priority) {
    const task = tasks.find(task => task.taskId === Number(taskId));
    if (!task) return;
    task.priority = priority;

    // 1. Update priority in task
    const taskOnThePage = document.querySelector(`.task-more-container[data-id="${taskId}"]`);
    if (taskOnThePage) {
        const priorityCheckbox = taskOnThePage.querySelector(".task-checkbox");
        priorityCheckbox.classList.remove("priority-high-checkbox","priority-medium-checkbox","priority-low-checkbox", "priority-none-checkbox");
        priorityCheckbox.classList.add(`priority-${priority}-checkbox`);
    }

    // 2. Update priority in stats panel
    const statsPanel = document.querySelector(`#todo-stats[data-id="${taskId}"]`);
    if (statsPanel) {
        const statsPriorityCheckbox = statsPanel.querySelector(".task-checkbox-stats");
        statsPriorityCheckbox.classList.remove("priority-high-checkbox", "priority-medium-checkbox", "priority-low-checkbox", "priority-none-checkbox");
        statsPriorityCheckbox.classList.add(`priority-${priority}-checkbox`);

        const statsPriorityIcon = statsPanel.querySelector(".task-priority-icon");

        const priorityImageMatches = {
            high: "red_flag.png",
            medium: "yellow_flag.png",
            low: "blue_flag.png",
            none: "grey_flag.png"
        };
        statsPriorityIcon.src = `images/todo-container/priorities-icon/${priorityImageMatches[priority]}`;
    }   
    saveTasksToLocalStorage();
}

function updateTaskFolder(folderId, folderColor, folderName, taskId) {
    const task = tasks.find(task => task.taskId === Number(taskId));
    if (!task) return;
    task.folderId = folderId;
    updateTaskFolderOnThePage(folderId, folderColor, folderName, taskId);
    saveTasksToLocalStorage();
    reapplyCurrentFilter();
    hideEmptyTaskGroups();
}

function updateTaskFolderOnThePage(folderId, folderColor, folderName, taskId) {
    const taskElement = document.querySelector(`.task-more-container[data-id="${taskId}"]`);
    if (taskElement) {
       const folderBarColor = taskElement.querySelector(".folder-color-code-bar");
       const folderCircleColor = taskElement.querySelector(".folder-color-code-circle");
       folderBarColor.style.backgroundColor = folderColor;
       folderCircleColor.style.backgroundColor = folderColor;

       const folderNameDisplay = taskElement.querySelector(".task-folder");
       folderNameDisplay.innerHTML = folderName;

       taskElement.setAttribute("data-folder-id", folderId);
       console.log("folderId: " + folderId);
       const statsPanel = document.querySelector(`#todo-stats[data-id="${taskId}"]`);
       if (statsPanel) {
           updateStatsFolderDisplay(folderName);
       } 
    } else {
        console.error("task not found for task ID: " + taskId);
    }
}

function populateTaskFolderMenu(taskId) {
    const menuDynamic = document.querySelector(`.task-more-folder-menu[data-id="${taskId}"] .task-more-folder-menu-dynamic`);
    if (!menuDynamic) return;
    menuDynamic.innerHTML = ""; // Clear previous

    Object.values(folders).forEach(folder => {
        const div = document.createElement("div");
        div.className = "folder-menu-container";
        div.setAttribute("data-id", folder.folderId);
        div.setAttribute("data-color", folder.folderColor);
        div.innerHTML = `
            <span class="folder-icon">${folder.folderIcon || ""}</span>
            <span class="folder-menu-name">${folder.folderName}</span>
        `;
        menuDynamic.appendChild(div);
    });
}

function attachTaskCheckboxListeners(taskId) {
    console.log("Attaching checkbox listeners for task ID: " + taskId);
    const taskCheckbox = document.querySelector(`.task-checkbox[data-id="${taskId}"]`);
    const taskElement = document.querySelector(`.task-more-container[data-id="${taskId}"]`);

    if (!taskElement || !taskCheckbox) return;

    const oldGroup = taskElement.closest(".task-group");
    const task = tasks.find(t => t.taskId === taskId);

    if (!task) return;

    taskCheckbox.addEventListener("change", () => {
        const isCompleted = taskCheckbox.checked;
        task.completed = isCompleted;
        console.log(`Task ${isCompleted ? "completed" : "uncompleted"}: ${taskId}`);

        // Get the completed group
        const completedGroup = document.querySelector('.task-group[data-date="completed"]');
        if (!completedGroup) return;

        // Get the current group
        const currentGroup = taskElement.closest(".task-group");

        if (isCompleted) {
            // Move to completed group
            completedGroup.style.display = ""; // Make sure the group is visible
            taskElement.classList.add("completed-task");
            const completedTasksContainer = completedGroup.querySelector('.tasks');
            completedTasksContainer.appendChild(taskElement); // Move the DOM element
            incrementTaskGroupCount(completedGroup);
            if (currentGroup) {
                decrementTaskGroupCount(currentGroup);
            }
        } else {
            // Move back to original group
            const originalGroup = document.querySelector(`.task-group[data-date="${assignTaskDataDate(task)}"]`);
            if (originalGroup) {
                originalGroup.style.display = ""; // Make sure the group is visible
                taskElement.classList.remove("completed-task");
                const originalTasksContainer = originalGroup.querySelector('.tasks');
                originalTasksContainer.appendChild(taskElement);
                incrementTaskGroupCount(originalGroup);
                if (currentGroup) {
                    decrementTaskGroupCount(currentGroup);
                }
            }
        }

        saveTasksToLocalStorage();
    });
}

/* let hasClearedTasks = false;

export function clearTasksOnce() {
    if (hasClearedTasks) return;
    tasks.length = 0;
    saveTasksToLocalStorage();
    hasClearedTasks = true;
} */