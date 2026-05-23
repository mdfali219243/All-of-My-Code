import { hideEmptyTaskGroups, tasks, updateTaskGroupCount} from "../data/tasks.js";
import { clearStatsPanel } from "./stats.js";

// Track the current filter state
let currentDateFilter = "all";
let currentFolderFilter = null;

setupDateFilterClicks();
setupFolderDivClicks();



// Handle date-based filtering (all, today, tomorrow, week, overdue)
// Handle date-based filtering (all, today, tomorrow, week, overdue)
function handleDateFilterClick(selectedDate) {
    const taskGroups = document.querySelectorAll(".task-group");
    const allTaskContainers = document.querySelectorAll(".task-more-container");
    let groupHasVisibleTasks = {};

    // Show/hide tasks based on date or folder
    allTaskContainers.forEach(container => {
        const task = container.querySelector('.task');
        if (!task) {
            container.style.display = "none";
            return;
        }

        const taskDate = container.getAttribute("data-date") || task.getAttribute("data-date");
        const folderId = container.getAttribute("data-folder-id");
        const isCompleted = container.classList.contains("completed-task");
        const group = container.closest(".task-group");

        // For completed tasks, show them in the completed group if they match the selected date
        if (isCompleted) {
            if (selectedDate === "all" || taskDate === selectedDate) {
                container.style.display = "flex";
                if (group) {
                    groupHasVisibleTasks[group.dataset.date] = true;
                }
            } else {
                container.style.display = "none";
            }
        } else {
            // For non-completed tasks, show based on date filter
            if (selectedDate === "all") {
                container.style.display = "flex";
            } else if (selectedDate === "task-queue") {
                container.style.display = folderId === "1" || folderId === "none" ? "flex" : "none";
            } else {
                container.style.display = (taskDate === selectedDate) ? "flex" : "none";
            }
            if (container.style.display === "flex" && group) {
                groupHasVisibleTasks[group.dataset.date] = true;
            }
        }
    });

    // Show/hide task groups based on filter
    taskGroups.forEach(group => {
        updateTaskGroupCount(group);
        const hasTasks = groupHasVisibleTasks[group.dataset.date];
        group.style.display = hasTasks ? "flex" : "none";
        
    });
}

// Handle folder-based filtering
function handleFolderClick(folderId) {
    const taskGroups = document.querySelectorAll(".task-group");
    const allTasks = document.querySelectorAll(".task-more-container");
    let groupHasVisibleTasks = {};

    allTasks.forEach(task => {
        const taskFolderId = task.getAttribute("data-folder-id");
        if (String(taskFolderId) === String(folderId)) {
            task.style.display = "flex";
            const group = task.closest(".task-group");
            if (group) {
                groupHasVisibleTasks[group.dataset.date] = true;
            }
        } else {
            task.style.display = "none";
        }
    });

    // Show/hide task groups based on whether they contain matching tasks
    taskGroups.forEach(group => {
        updateTaskGroupCount(group);
        const hasTasks = groupHasVisibleTasks[group.dataset.date];
        group.style.display = hasTasks ? "flex" : "none";
    });
}

// Reapply the current active filter (used after adding new task)
export function reapplyCurrentFilter() {
    if (currentFolderFilter !== null) {
        handleFolderClick(currentFolderFilter);
    } else {
        handleDateFilterClick(currentDateFilter || "all");
    }
}

// Assign "current-date" or "current-folder" style class
function assignCurrentFilter(filterList, activeFilter) {
    filterList.forEach(filter => filter.classList.remove("current-date"));
    activeFilter.classList.add("current-date");
}

// Update title for date filters
function updatePageTitleDate(filter) {
    const pageTitleElement = document.querySelector(".page-title");

    const titleMap = {
        all: "All",
        today: "Today",
        tomorrow: "Tomorrow",
        week: "This Week",
        overdue: "Overdue",
        "task-queue": "Task Queue"
    };

    pageTitleElement.textContent = titleMap[filter] || filter;
}

// Update title for folder filters
export function updatePageTitleFolder(folderName) {
    const pageTitleElement = document.querySelector(".page-title");
    pageTitleElement.textContent = folderName;
}

// Optional: Setup function for dynamically added folder divs
export function setupFolderDivClicks() {
    const folderList = document.querySelector(".folder-list");
    if (!folderList) return;

    folderList.onclick = (event) => {
        const folderDiv = event.target.closest(".folder-div");
        if (!folderDiv) return;

        const folderId = folderDiv.dataset.id;
        const folderName = folderDiv.dataset.folder;

        currentFolderFilter = folderId;
        currentDateFilter = null;

        updatePageTitleFolder(folderName);

        document.querySelectorAll(".folder-div, .todo-date-container").forEach(el => el.classList.remove("current-date"));
        folderDiv.classList.add("current-date");

        clearStatsPanel();
        closePopUpMenuWhenClickedFilter();
        handleFolderClick(folderId);
    };
}

export function setupDateFilterClicks() {
    const dateFilterList = document.querySelectorAll(".todo-date-container");
    if (!dateFilterList.length) return;

    dateFilterList.forEach(dateFilter => {
        dateFilter.onclick = () => {
            const selectedDate = dateFilter.dataset.date;

            currentDateFilter = selectedDate;
            currentFolderFilter = null;

            updatePageTitleDate(selectedDate);

            document.querySelectorAll(".folder-div, .todo-date-container").forEach(el => el.classList.remove("current-date"));
            dateFilter.classList.add("current-date");

            handleDateFilterClick(selectedDate);
            clearStatsPanel();
            closePopUpMenuWhenClickedFilter();
        };
    });
}


export function getCurrentDateFilter() {
    return currentDateFilter;
}


export function popUpMenuInSmallScreen() {
    const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
    const menu = document.querySelector("#todolist-menu");
    const statsPanel = document.querySelector("#todo-stats");

    if (isSmallScreen) {
        statsPanel.classList.remove("pop-up-stats-panel");
        menu.classList.add("pop-up-menu");
    } else {
        menu.classList.remove("pop-up-menu");
    }
}

function closePopUpMenuWhenClickedFilter() {
    const menu = document.querySelector("#todolist-menu");

    if (menu.classList.contains("pop-up-menu")) {
        menu.classList.remove("pop-up-menu");
    }
}
    