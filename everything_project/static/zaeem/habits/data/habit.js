

import { folders, loadFoldersFromLocalStorage } from "./folder.js";
import { editHabit } from "../scripts/stats.js";
import { resetStatsPanel } from "../scripts/stats.js";

document.addEventListener("DOMContentLoaded", () => {
    loadFoldersFromLocalStorage();
    loadHabitsFromLocalStorage();
    InputNewHabit();
    renderHabits();
    habitDateFilter();
    console.log(habits);

    document.querySelector(".add-habits-container").addEventListener("click", () => {
        defaultAddHabitParams();
    })
    document.querySelector("#habit-add-button").addEventListener("click", () => {

        if (document.querySelector("#new-habit-name").value === "") {
            alert("Please enter a habit name");
            return;
        }
        addHabit();
        hideAllEmptyGroups();
        closeAddHabitModal();
        clearAddHabitInputs();

        const activeFolder = document.querySelector(".folder-div.current-filter");
        if (activeFolder) {
            activeFolder.click();
        }
    });    

    document.addEventListener("click", (event) => {
        const allMenus = document.querySelectorAll(".habit-more-menu-container");
        
        // Check if the click was on a habit-more-icon
        const isMoreIcon = event.target.classList.contains("habit-more-icon");
    
        allMenus.forEach(menu => {
            // If this is the clicked one, toggle it
            if (isMoreIcon && menu === event.target.closest(".habits-more-container")?.querySelector(".habit-more-menu-container")) {
                const isCurrentlyVisible = menu.style.display === "block";
                menu.style.display = isCurrentlyVisible ? "none" : "block";
            } else {
                // Close all others
                menu.style.display = "none";
            }
        });
    });
});

// Delegated handler for clicks on any habit-more-menu item (works for all instances)
document.addEventListener("click", (e) => {
    const item = e.target.closest(".habit-more-menu-item-container");
    if (!item) return;

    const menu = item.closest(".habit-more-menu-container");
    if (!menu) return; // Not in a menu

    const habitId = Number(menu.dataset.id);
    const op = item.dataset.operation;

    switch (op) {
        case "check-in":
            habitCheckInHandler(habitId);
            break;
        case "skip":
            habitSkipHandler(habitId);
            break;
        case "fail":
            habitFailHandler(habitId);
            break;
        case "edit":
            habitEditHandler(habitId);
            break;
        case "delete":
            habitDeleteHandler(habitId);
            break;
    }
}); 



export let habits = [];

function addHabit() {
    const addHabitModal = document.querySelector(".habit-add-modal");

    const habitGoal = getHabitGoal();
    const habitRepeat = getHabitRepeat();

    const newHabit = {
        habitId: Date.now(),
        habitName: addHabitModal.querySelector("#new-habit-name").value,
        habitIcon: addHabitModal.querySelector(".new-habit-icon").textContent,
        habitGoal, // ⬅️ Use structured goal
        habitRepeat, // ⬅️ Use structured repeat
        habitTimeOfDay: addHabitModal.querySelector(".habit-time-text").textContent.trim().toLowerCase(),
        habitFolderId: addHabitModal.querySelector(".habit-folder-text").dataset.folderId,
        habitStartDate: addHabitModal.querySelector("#habit-date").value,
        habitDescription: addHabitModal.querySelector("#new-habit-description").value,
        habitCompleted: 0,
        habitFailed: 0,
        habitSkipped: 0,
        habitStreak: 0,
        habitFinish: false
    };

    habits.push(newHabit);
    renderHabits();
    saveHabitsToLocalStorage();
}


export function renderHabits() {
    document.querySelectorAll(".habits-group .habits").forEach(group => {
        group.innerHTML = "";
    });

    habits.forEach(habit => {
        let folder = folders.find(folder => String(folder.folderId) === String(habit.habitFolderId));
        console.log(folder);
        if (!folder) {
            console.error(`No matching folder found for habit: ${habit.habitName} (ID: ${habit.habitId}, FolderID: ${habit.habitFolderId})`);
            return;
        }

        let color = "";
        if (folder.folderId == "1") {
            color = "black";
        }
    

        const habitHTML = `
            <div class="habits-more-container" data-id="${habit.habitId}" data-folder-id="${habit.habitFolderId}">
                <div class="habit">
                    <div class="habit-icon-container">
                        <div>${habit.habitIcon}</div>
                    </div>
                    <div class="habit-content-container">
                        <div class="left-side-habit">
                            <div class="habit-text">${habit.habitName}</div>
                            <div class="habit-times-number">${formatGoalText(habit.habitCompleted, habit.habitGoal)}</div>
                            <div class="habit-repeat-info">${formatRepeatText(habit.habitRepeat)}</div>
                        </div>
                        <div class="right-side-habit">
                            <div class="habit-folder-container habit-editor" style="background-color: ${folder.folderColor}; color: ${color};">${folder.folderIcon} ${" "} ${folder.folderName}</div>
                            <div class="habit-done-container habit-editor">
                                <div class="habit-done-icon-container">
                                    <img src="images/habits-container-icons/icons8-done-30.png" class="habit-done-icon" alt="done">
                                </div>
                                <div class="habit-done-text">Done</div>
                            </div>
                            <div class="habit-more-container habit-editor">
                                <img src="images/habits-container-icons/icons8-more-50.png" class="habit-more-icon" alt="more">
                                <div class="habit-more-menu-container" style="display: none;" data-id="${habit.habitId}">
                                    <div class="habit-more-menu-item-container" data-operation="check-in">
                                        <img src="images/habits-container-icons/icons8-checkmark-16.png" class="habit-more-menu-item-icon">
                                        <div class="habit-more-menu-item">Check In</div>
                                    </div>
                                    <div class="habit-more-menu-item-container" data-operation="skip">
                                        <img src="images/habits-container-icons/icons8-right-arrow-16.png" class="habit-more-menu-item-icon">
                                        <div class="habit-more-menu-item">Skip</div>
                                    </div>
                                    <div class="habit-more-menu-item-container" data-operation="fail">
                                        <img src="images/habits-container-icons/icons8-wrong-16.png" class="habit-more-menu-item-icon">
                                        <div class="habit-more-menu-item">Fail</div>
                                    </div>
                                    <div class="habit-more-menu-item-container" data-operation="edit">
                                        <img src="images/habits-container-icons/icons8-edit-30.png" class="habit-more-menu-item-icon">
                                        <div class="habit-more-menu-item">Edit</div>
                                    </div>
                                    <div class="habit-more-menu-item-container" data-operation="delete">
                                        <img src="images/habits-container-icons/icons8-trash-can-50.png" class="habit-more-menu-item-icon habit-more-delete-icon">
                                        <div class="habit-more-menu-item">Delete</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        addHabitToCorrectGroup(habit, habitHTML);
    });

    
    hideAllEmptyGroups();
}


export function saveHabitsToLocalStorage() {
    localStorage.setItem("habits", JSON.stringify(habits));
}

export function loadHabitsFromLocalStorage() {
    const savedHabits = localStorage.getItem("habits");
    if (savedHabits) {
        habits = JSON.parse(savedHabits);
    }
}

export function closeAddHabitModal() {
    const modalOverlay = document.getElementById("modal-overlay");
    const habitModal = document.querySelector(".habit-add-modal");
    modalOverlay.classList.add("hidden");
    habitModal.classList.add("hidden");
}

export function clearAddHabitInputs() {
    const addHabitModal = document.querySelector(".habit-add-modal");
    addHabitModal.querySelector("#new-habit-name").value = "";
    addHabitModal.querySelector(".new-habit-icon").textContent = "";
    addHabitModal.querySelector("#habit-goal").value = "";
    addHabitModal.querySelector("#habit-date").value = "";
    addHabitModal.querySelector("#new-habit-description").value = "";
}

function InputNewHabit() {
    const addHabitModal = document.querySelector(".habit-add-modal");

    const habitGoalUnitMenu = addHabitModal.querySelector(".times-menu-container");
    const habitGoalUnitMenuItems = habitGoalUnitMenu.querySelectorAll(".times-menu-item");
    const habitGoalUnitMenuText = addHabitModal.querySelector(".times");

    habitGoalUnitMenuItems.forEach((item) => {
        item.addEventListener("click", () => {
            habitGoalUnitMenuText.textContent = item.textContent;
        });
    });


    const habitPerUnitMenu = addHabitModal.querySelector(".per-menu-container");
    const habitPerUnitMenuItems = habitPerUnitMenu.querySelectorAll(".per-menu-item");
    const habitPerUnitMenuText = addHabitModal.querySelector(".per");

    habitPerUnitMenuItems.forEach((item) => {
        item.addEventListener("click", () => {
            habitPerUnitMenuText.textContent = item.textContent;
        });
    });

    const habitTimeOfDayMenu = addHabitModal.querySelector(".habit-time-menu-container");
    const habitTimeOfDayMenuItems = habitTimeOfDayMenu.querySelectorAll(".habit-time-item-container");
    const habitTimeOfDayMenuText = addHabitModal.querySelector(".habit-time-text");

    habitTimeOfDayMenuItems.forEach((item) => {
        item.addEventListener("click", () => {
            // Remove checkmarks from all items
            habitTimeOfDayMenuItems.forEach((otherItem) => {
                const check = otherItem.querySelector(".habit-time-item-check-container");
                check.classList.add("hidden");
            });

            // Add checkmark to the clicked one
            const timeCheckMarkContainer = item.querySelector(".habit-time-item-check-container");
            timeCheckMarkContainer.classList.remove("hidden");

            // Update text to the clicked one’s label
            const selectedText = item.querySelector(".habit-time-item-text-container").textContent.trim();
            habitTimeOfDayMenuText.textContent = selectedText;
        });
    });



    const habitFolderMenu = addHabitModal.querySelector(".habit-folder-menu-container");
    const habitFolderMenuItems = habitFolderMenu.querySelectorAll(".habit-folder-item-container");
    const habitFolderMenuText = addHabitModal.querySelector(".habit-folder-text");

    habitFolderMenuItems.forEach((item) => {
        item.addEventListener("click", () => {
            habitFolderMenuText.textContent = item.querySelector(".habit-folder-item-text-container").textContent;
            habitFolderMenuText.dataset.folderId = item.dataset.id;
            
        });
    });

    const habitDateInput = addHabitModal.querySelector("#habit-date");
    const habitDateDisplayText = addHabitModal.querySelector(".habit-date-text");
    habitDateInput.addEventListener("change", () => {
        habitDateDisplayText.textContent = habitStartDateLabelFormatter(habitDateInput.value);
    });

    const habitIntervalMenuText = addHabitModal.querySelector(".habit-repeat-text");

    const nameOfDaysContainers = addHabitModal.querySelectorAll(".habit-repeat-daily-item-container");
    nameOfDaysContainers.forEach((container) => {
        container.addEventListener("click", () => {
            const checkMarkContainer = container.querySelector(".habit-repeat-daily-item-check-container");

            // Toggle the checkmark
            const willHide = !checkMarkContainer.classList.contains("hidden");
            checkMarkContainer.classList.toggle("hidden");

            // Gather selected items
            let selectedItems = [];
            nameOfDaysContainers.forEach((item) => {
                const check = item.querySelector(".habit-repeat-daily-item-check-container");
                if (!check.classList.contains("hidden")) {
                    selectedItems.push(item);
                }
            });

            // 🛑 Rule 1: Don't allow all to be unchecked
            if (selectedItems.length === 0) {
                checkMarkContainer.classList.remove("hidden"); // Re-check the one just clicked
                selectedItems.push(container);
            }

            // 🧠 Get selected day names
            const selectedDayNames = selectedItems.map(item =>
                item.querySelector(".habit-repeat-daily-item-text-container").textContent.trim()
            );

            const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
            const weekends = ["Saturday", "Sunday"];

            const allSelected = selectedDayNames.length === nameOfDaysContainers.length;
            const weekdaysSelected = weekdays.every(day => selectedDayNames.includes(day)) && selectedDayNames.length === 5;
            const weekendsSelected = weekends.every(day => selectedDayNames.includes(day)) && selectedDayNames.length === 2;

            if (allSelected) {
                habitIntervalMenuText.textContent = "Daily";
            } else if (weekdaysSelected) {
                habitIntervalMenuText.textContent = "Weekdays";
            } else if (weekendsSelected) {
                habitIntervalMenuText.textContent = "Weekend";
            } else {
                // Show first 3 letters of selected days
                const shortNames = selectedDayNames.map(day => day.slice(0, 3));
                habitIntervalMenuText.textContent = shortNames.join(", ");
            }
        });
    });

    const numberOfDaysInMonth = addHabitModal.querySelectorAll(".habit-repeat-monthly-item-calendar-row-item");
    numberOfDaysInMonth.forEach((item) => {
        item.addEventListener("click", () => {
            item.classList.toggle("selected");

            // Convert NodeList to array
            const selectedItems = Array.from(numberOfDaysInMonth).filter(item =>
                item.classList.contains("selected")
            );

            const selectedDays = selectedItems
                .map(item => formatOrdinal(parseInt(item.textContent.trim())))
                .sort((a, b) => parseInt(a) - parseInt(b)); // Optional: sort numerically

            if (selectedDays.length > 0) {
                habitIntervalMenuText.textContent = `Every month on ${selectedDays.join(", ")}`;
            } else {
                habitIntervalMenuText.textContent = "Monthly";
            }
        });
    });

    const habitRepeatIntervalMenuItems = addHabitModal.querySelectorAll(".habit-repeat-interval-item-container");
    const checkMarkContainer = addHabitModal.querySelectorAll(".habit-repeat-interval-item-check-container");
    habitRepeatIntervalMenuItems.forEach((item) => {
        item.addEventListener("click", () => {
            checkMarkContainer.forEach((checkMark) => {
                checkMark.classList.add("hidden");
            });
            item.querySelector(".habit-repeat-interval-item-check-container").classList.remove("hidden");
            habitIntervalMenuText.textContent = item.querySelector(".habit-repeat-interval-item-text-container").textContent;
        });
    });
    
} 

export function addHabitRefreshParams() {
    const addHabitModal = document.querySelector(".habit-add-modal");
    const modalOverlay = document.getElementById("modal-overlay");
    const habitAddButton = addHabitModal.querySelector(".habit-add-button");
    const habitCancelButton = addHabitModal.querySelector(".habit-cancel-button");
    const addHabitModalTitle = addHabitModal.querySelector(".habit-add-modal-title");
    const addHabitModalCloseIconContainer = addHabitModal.querySelector(".close-modal-icon-container");

    habitAddButton.textContent = "Save Habit";
    habitAddButton.id = "";

    habitCancelButton.classList.add("hidden");
    habitCancelButton.id = "";

    addHabitModalTitle.textContent = "ADD A HABIT";

    addHabitModalCloseIconContainer.addEventListener("click", () => {
        addHabitModal.classList.add("hidden");
        modalOverlay.classList.add("hidden");
    });

    clearAddHabitInputs();
}

// Helper function to format numbers as 1st, 2nd, 3rd, etc.
function formatOrdinal(n) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
    return `${n}${suffix}`;
}

function addHabitToCorrectGroup(habit, habitHTML) {
    let habitTimeOfDay = habit.habitTimeOfDay;

    let timeOfDayArray = [];
    if (typeof habitTimeOfDay === "string") {
        timeOfDayArray = habitTimeOfDay
            .split(",")
            .map(t => t.trim().toLowerCase())
            .filter(t => t.length > 0);
    }

    const allHabitGroups = document.querySelectorAll(".habits-group");

    allHabitGroups.forEach((group) => {
        const groupTime = group.dataset.time.toLowerCase();

        const isAnytime = timeOfDayArray.length === 1 && timeOfDayArray.includes("anytime");
        const matchesSpecific = timeOfDayArray.includes(groupTime);

        // 🟢 Add to group if:
        // - it specifically matches, OR
        // - it is only set to "anytime" and group is "anytime"
        if (matchesSpecific || (isAnytime && groupTime === "anytime")) {
            const groupList = group.querySelector(".habits");
            groupList.insertAdjacentHTML("beforeend", habitHTML);
            updateHabitGroupCount(group);
        }
    });
}


function hideAllEmptyGroups() {
    const allHabitGroups = document.querySelectorAll(".habits-group");
    allHabitGroups.forEach((group) => {
        const groupList = group.querySelector(".habits");
        const habitCount = groupList.querySelectorAll(".habit").length;
        if (habitCount === 0) {
            group.classList.add("hidden");
        } else {
            group.classList.remove("hidden");
            updateHabitGroupCount(group);
        }
    });
}


function updateHabitGroupCount(group) {
    const groupList = group.querySelector(".habits");
    const habitCount = groupList.querySelectorAll(".habit").length;
    group.querySelector(".number-of-habits").textContent = habitCount;
}

function habitStartDateLabelFormatter(inputDateValue) {
    // Parse input as local date (not UTC)
    const [year, month, day] = inputDateValue.split("-").map(Number);
    const inputDate = new Date(year, month - 1, day); // This avoids UTC issues

    const today = new Date();
    const yesterday = new Date();
    const tomorrow = new Date();

    // Normalize all to local midnight
    [today, yesterday, tomorrow].forEach(date => date.setHours(0, 0, 0, 0));
    inputDate.setHours(0, 0, 0, 0);

    yesterday.setDate(today.getDate() - 1);
    tomorrow.setDate(today.getDate() + 1);

    if (inputDate.getTime() === today.getTime()) {
        return "Today";
    } else if (inputDate.getTime() === yesterday.getTime()) {
        return "Yesterday";
    } else if (inputDate.getTime() === tomorrow.getTime()) {
        return "Tomorrow";
    } else {
        const options = { year: "numeric", month: "short", day: "numeric" };
        return inputDate.toLocaleDateString("en-US", options); // e.g., "Aug 2, 2025"
    }
}

export function getHabitGoal() {
    const goalInput = document.querySelector("#habit-goal");
    const timesUnit = document.querySelector(".times").textContent.trim();
    const perUnit = document.querySelector(".per").textContent.trim();

    return {
        amount: Number(goalInput.value),
        unit: timesUnit,        // "Times" or "Mins"
        frequency: perUnit      // "Per Day", "Per Week", etc.
    };
}


export function getHabitRepeat() {
    const repeatText = document.querySelector(".habit-repeat-text").textContent.trim();

    // Match for Daily
    if (repeatText === "Daily" || repeatText === "Weekdays" || repeatText === "Weekend" || repeatText.includes(",")) {
        const selectedDays = [...document.querySelectorAll(".habit-repeat-daily-item-container")]
            .filter(dayEl => !dayEl.querySelector(".habit-repeat-daily-item-check-container").classList.contains("hidden"))
            .map(dayEl => dayEl.querySelector(".habit-repeat-daily-item-text-container").textContent.trim());

        return {
            type: "Daily",
            days: selectedDays.length ? selectedDays : ["Every Day"]
        };
    }

    // Match for Monthly
    if (repeatText.startsWith("Every month on") || repeatText === "Monthly") {
        const selectedDates = [...document.querySelectorAll(".habit-repeat-monthly-item-calendar-row-item.selected")]
            .map(el => parseInt(el.textContent.trim()));

        return {
            type: "Monthly",
            dates: selectedDates
        };
    }

    // Match for Interval
    if (repeatText.startsWith("Repeat every")) {
        const match = repeatText.match(/Repeat every (\d+)/);
        return {
            type: "Interval",
            intervalDays: match ? Number(match[1]) : null
        };
    }

    return {
        type: "Unknown"
    };
}


function formatRepeatText(repeat) {
    if (!repeat || !repeat.type) return "";
    // Days of week for easy comparison
    const weekOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const weekends = ["Saturday", "Sunday"];
    if (repeat.type === "Daily") {
        if (weekOrder.every(day => repeat.days.includes(day)) && repeat.days.length === 7) return "Every Day";
        if (weekdays.every(day => repeat.days.includes(day)) && repeat.days.length === 5) return "Weekdays";
        if (weekends.every(day => repeat.days.includes(day)) && repeat.days.length === 2) return "Weekend";
        // Custom days: show short names in week order
        const shortNames = weekOrder.filter(day => repeat.days.includes(day)).map(day => day.slice(0, 3));
        return shortNames.join(", ");
    }
    if (repeat.type === "Monthly") {
        if (!repeat.dates || repeat.dates.length === 0) return "Monthly";
        // Show just numbers, not ordinals
        const formatted = repeat.dates.map(d => d.toString());
        return `Monthly on ${formatted.join(", ")}`;
    }
    if (repeat.type === "Interval") {
        return repeat.intervalDays
            ? `Repeat every ${repeat.intervalDays}`
            : "Interval";
    }
    return "Custom";
}

function formatGoalText(completed, goal) {
    if (!goal) return "";
    let freq = goal.frequency ? goal.frequency.replace(/Per /i, "").toLowerCase() : "";
    let freqText = freq ? `per ${freq}` : "";
    return `${completed} / ${goal.amount || 0} ${goal.unit || ""} ${freqText}`.trim();
}

function habitDateFilter() {
    const habitDateInput = document.querySelector(".habits-date-picker");
    const habitDateDisplayText = document.querySelector(".habits-date-text");
    const habitsDateFilterContainer = document.querySelector(".habits-date-filter-container");

    habitsDateFilterContainer.addEventListener("click", () => {
        habitDateInput.showPicker();
    })

    habitDateInput.addEventListener("change", () => {
        habitDateDisplayText.textContent = habitStartDateLabelFormatter(habitDateInput.value);
        filterHabitsByDate(habitDateInput.value);
    })
}

function filterHabitsByDate(date) {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const filteredHabits = habits.filter(habit => {
        const habitStart = new Date(habit.habitStartDate);
        habitStart.setHours(0, 0, 0, 0);

        const repeat = habit.habitRepeat;

        // Exclude habits that haven't started yet
        if (selectedDate < habitStart) return false;

        // DAILY TYPE
        if (repeat.type === "Daily") {
            const selectedDayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
            return repeat.days.includes(selectedDayName);
        }

        // MONTHLY TYPE
        if (repeat.type === "Monthly") {
            const selectedDay = selectedDate.getDate(); // 1 to 31
            return repeat.dates.includes(selectedDay);
        }

        // INTERVAL TYPE
        if (repeat.type === "Interval") {
            const diffInDays = Math.floor((selectedDate - habitStart) / (1000 * 60 * 60 * 24));
            return diffInDays % repeat.intervalDays === 0;
        }

        // Unknown or unsupported
        return false;
    });

    // Now render filteredHabits only
    document.querySelectorAll(".habits-group .habits").forEach(group => group.innerHTML = ""); // clear
    console.log(filteredHabits);

    filteredHabits.forEach(habit => {
        const folder = folders.find(folder => String(folder.folderId) === String(habit.habitFolderId));
        if (!folder) return;

        let color = "";
        if (folder.folderId == "1") {
            color = "black";
        }

        const habitHTML = `
            <div class="habits-more-container" data-id="${habit.habitId}" data-folder-id="${habit.habitFolderId}">
                <div class="habit">
                    <div class="habit-icon-container"><div>${habit.habitIcon}</div></div>
                    <div class="habit-content-container">
                        <div class="left-side-habit">
                            <div class="habit-text">${habit.habitName}</div>
                            <div class="habit-times-number">${formatGoalText(habit.habitCompleted, habit.habitGoal)}</div>
                            <div class="habit-repeat-info">${formatRepeatText(habit.habitRepeat)}</div>
                        </div>
                        <div class="right-side-habit">
                            <div class="habit-folder-container habit-editor" style="background-color: ${folder.folderColor}; color: ${color};">
                                ${folder.folderIcon} ${folder.folderName}
                            </div>
                            <div class="habit-done-container habit-editor">
                                <div class="habit-done-icon-container">
                                    <img src="images/habits-container-icons/icons8-done-30.png" class="habit-done-icon" alt="done">
                                </div>
                                <div class="habit-done-text">Done</div>
                            </div>
                            <div class="habit-more-container habit-editor">
                                <img src="images/habits-container-icons/icons8-more-50.png" class="habit-more-icon" alt="more">
                                <div class="habit-more-menu-container" style="display: none;" data-id="${habit.habitId}">
                                    <div class="habit-more-menu-item-container" data-operation="check-in">
                                        <img src="images/habits-container-icons/icons8-checkmark-16.png" class="habit-more-menu-item-icon">
                                        <div class="habit-more-menu-item">Check In</div>
                                    </div>
                                    <div class="habit-more-menu-item-container" data-operation="skip">
                                        <img src="images/habits-container-icons/icons8-right-arrow-16.png" class="habit-more-menu-item-icon">
                                        <div class="habit-more-menu-item">Skip</div>
                                    </div>
                                    <div class="habit-more-menu-item-container" data-operation="fail">
                                        <img src="images/habits-container-icons/icons8-wrong-16.png" class="habit-more-menu-item-icon">
                                        <div class="habit-more-menu-item">Fail</div>
                                    </div>
                                        <div class="habit-more-menu-item-container" data-operation="edit">
                                        <img src="images/habits-container-icons/icons8-edit-30.png" class="habit-more-menu-item-icon">
                                        <div class="habit-more-menu-item">Edit</div>
                                    </div>
                                    <div class="habit-more-menu-item-container" data-operation="delete">
                                        <img src="images/habits-container-icons/icons8-trash-can-50.png" class="habit-more-menu-item-icon habit-more-delete-icon">
                                        <div class="habit-more-menu-item">Delete</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        addHabitToCorrectGroup(habit, habitHTML);
    });

    hideAllEmptyGroups();
}


function habitCheckInHandler(habitId) {
    const habit = habits.find(habit => habit.habitId === habitId);
    habit.habitCompleted += 1;
    saveHabitsToLocalStorage();
    renderHabits();
    habitContainerIsClicked(habitId);
}

function habitSkipHandler(habitId) {
    const habit = habits.find(habit => habit.habitId === habitId);
    habit.habitSkipped += 1;
    saveHabitsToLocalStorage();
    renderHabits();
    habitContainerIsClicked(habitId);
}

function habitFailHandler(habitId) {
    const habit = habits.find(habit => habit.habitId === habitId);
    habit.habitFailed += 1;
    saveHabitsToLocalStorage();
    renderHabits();
    habitContainerIsClicked(habitId);
}
    
function habitEditHandler(habitId) {
    const habitDiv = document.querySelector(`.habits-more-container[data-id="${habitId}"]`);
    habitDiv.click();

    setTimeout(() => {
        const statsEditIcon = document.querySelector(".habits-stats-edit-icon-container");
        if (statsEditIcon) {
            statsEditIcon.click();
        }
    }, 10);
}

function habitDeleteHandler(habitId) {
    const habit = habits.find(habit => habit.habitId === habitId);
    habits.splice(habits.indexOf(habit), 1);
    saveHabitsToLocalStorage();
    renderHabits();

    resetStatsPanel();
}

function habitContainerIsClicked(habitId) {
    const habitDiv = document.querySelector(`.habits-more-container[data-id="${habitId}"]`);
    habitDiv.click();
}

function defaultAddHabitParams() {
    const addHabitModal = document.querySelector(".habit-add-modal");
    const today = new Date();
    const todayFormatted = today.toISOString().split("T")[0];

    addHabitModal.querySelector("#new-habit-name").value = "";
    addHabitModal.querySelector(".new-habit-icon").textContent = "❓";
    addHabitModal.querySelector("#habit-goal").value = "1";
    addHabitModal.querySelector(".times").textContent = "Times";
    addHabitModal.querySelector(".per").textContent = "Per Day";
    addHabitModal.querySelector(".habit-repeat-text").textContent = "Daily";
    addHabitModal.querySelector(".habit-time-text").textContent = "Anytime";
    addHabitModal.querySelector(".habit-folder-text").textContent = "Habit Queue";
    addHabitModal.querySelector(".habit-folder-text").dataset.folderId = "1";
    addHabitModal.querySelector("#habit-date").value = todayFormatted;
    addHabitModal.querySelector(".habit-date-text").textContent = "Today";
    addHabitModal.querySelector("#new-habit-description").value = "";

    addHabitModal.querySelectorAll(".habit-time-item-check-container").forEach(checkContainer => {
        checkContainer.classList.add("hidden");
    });

    addHabitModal.querySelector(".habit-time-item-check-container-anytime").classList.remove("hidden");
}
