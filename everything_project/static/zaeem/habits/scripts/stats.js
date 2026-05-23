import { habits, closeAddHabitModal, saveHabitsToLocalStorage, renderHabits, getHabitGoal, getHabitRepeat, clearAddHabitInputs } from "../data/habit.js";
import { folders } from "../data/folder.js";

document.addEventListener("DOMContentLoaded", () => {
    popUpStatsPanelInSmallScreen();
});



const statsPanel = document.querySelector("#habits-stats-container");

window.addEventListener("click", (e) => {
    const habitElement = e.target.closest(".habits-more-container");
    
    if (habitElement) {
        popUpStatsPanelInSmallScreen();
    }
    
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 1122) {
        statsPanel.classList.remove("pop-up-stats-panel");
        const statsPanelCloseButton = statsPanel.querySelector(".close-stats-panel-icon");
        if (statsPanelCloseButton) {
            statsPanelCloseButton.remove();
        }
    }
});




document.addEventListener("click", (e) => {
    let habitElement = null;
    // If the clicked element *is* .habits-more-container
    if (e.target.classList.contains("habits-more-container")) {
        habitElement = e.target;
    } else if (e.target.closest(".habits-more-container")) {
        // If it has a .habits-more-container ancestor
        habitElement = e.target.closest(".habits-more-container");
    } else {
        console.log("No habit element found");
        return;
    }
    
    const habitId = habitElement.getAttribute("data-id");
    const habitFolderId = habitElement.getAttribute("data-folder-id");

    const habit = habits.find(h => h.habitId === Number(habitId));
    const folder = folders.find(f => f.folderId === Number(habitFolderId));
    const habitFolderTextColor = habitElement.querySelector(".habit-folder-container").style.color;
    renderStatsPanel(habit, folder, habitFolderTextColor);

})

function renderStatsPanel(habit, folder, habitFolderTextColor) {
    statsPanel.setAttribute("data-id", habit.habitId);


    statsPanel.innerHTML = `
            <div class="habits-stats-header">
                <div class="habits-stats-header-left">
                    <div class="habits-stats-title">${habit.habitIcon} ${" "}${habit.habitName}</div>
                </div>
                <div class="habits-stats-header-right">
                    <div class="habits-stats-folder" style="background-color: ${folder.folderColor}; color: ${habitFolderTextColor}">${folder.folderIcon} ${" "}${folder.folderName}</div>
                    <div class="habits-stats-edit-icon-container">
                        <img src="images/habits-container-icons/icons8-edit-50.png" class="habit-edit-icon" alt="edit">
                    </div>
                </div>
            </div>
            <div class="habits-stats">
                <div class="habit-current-streaks-stats-container stats-container">
                    <div class="streak-icon-container">
                        <img src="images/habits-container-icons/icons8-fire-48.png" class="streak-icon" alt="streak">
                    </div>
                    <div class="streak-stats-container">
                        <div class="current-streak-title">Current Streak</div>
                        <div class="current-streak">${habit.habitStreak} days</div>
                    </div>
                </div>
                
                <div class="habit-completed-times-stats-container">
                    <div class="completed-icon-container">
                        <img src="images/habits-container-icons/icons8-check-mark-48.png" class="streak-icon" alt="streak">
                    </div>
                    <div class="completed-stats-container">
                        <div class="current-completed-title">Completed Times</div>
                        <div class="current-completed">${habit.habitCompleted} times</div>
                    </div>
                </div>
                <div class="habit-failed-times-stats-container">
                    <div class="failed-icon-container">
                        <img src="images/habits-container-icons/icons8-cancel-48.png" class="streak-icon" alt="streak">
                    </div>
                    <div class="failed-stats-container">
                        <div class="current-failed-title">Failed Times</div>
                        <div class="current-failed">${habit.habitFailed} times</div>
                    </div>
                </div>
                
                
                <div class="habit-skipped-times-stats-container">
                    <div class="skipped-icon-container">
                        <img src="images/habits-container-icons/icons8-skip-48.png" class="streak-icon" alt="streak">
                    </div>
                    <div class="skipped-stats-container">
                        <div class="current-skipped-title">Skipped Times</div>
                        <div class="current-skipped">${habit.habitSkipped} times</div>
                    </div>
                </div>
            </div>
    `

    const habitEditIcon = document.querySelector(".habits-stats-edit-icon-container");
    editHabit(habit.habitId, habitEditIcon);

}

export function editHabit(habitId, habitEditIcon) {
    const habit = habits.find(h => h.habitId === Number(habitId));
    const folder = folders.find(f => f.folderId === Number(habit.habitFolderId));
    const modalOverlay = document.querySelector("#modal-overlay");
    const habitAddModal = document.querySelector(".habit-add-modal");

    // Remove previous click handler if it exists
    if (habitEditIcon._editClickHandler) {
        habitEditIcon.removeEventListener("click", habitEditIcon._editClickHandler);
    }

    // Define the handler as a named function
    function editClickHandler(event) {
        event.stopPropagation();
        habitAddModal.classList.remove("hidden");
        modalOverlay.classList.remove("hidden");
        inputCurrentHabitValues(habit, folder);
        habitAddModal.dataset.habitId = habit.habitId; // Ensure correct id is set for edit
        addHabitModalEditModeButtonsHandler();
    }

    habitEditIcon.addEventListener("click", editClickHandler);
    habitEditIcon._editClickHandler = editClickHandler;

    
    
}

function inputCurrentHabitValues(habit, folder) {
    document.querySelector("#new-habit-name").value = habit.habitName;
    document.querySelector(".new-habit-icon").textContent = habit.habitIcon;
    document.querySelector("#habit-goal").value = habit.habitGoal.amount;
    document.querySelector(".times").textContent = habit.habitGoal.unit;
    document.querySelector(".per").textContent = habit.habitGoal.frequency;
    console.log(habit.habitRepeat);
    document.querySelector(".habit-repeat-text").textContent = habit.habitRepeat.type;
    document.querySelector(".habit-time-text").textContent = habit.habitTimeOfDay;
    document.querySelector(".habit-folder-text").textContent = folder.folderName;
    document.querySelector("#habit-date").value = habit.habitStartDate;
    document.querySelector("#new-habit-description").value = habit.habitDescription;

}

function addHabitModalEditModeButtonsHandler() {
    const habitAddButton = document.querySelector(".habit-add-button");
    const habitCancelButton = document.querySelector(".habit-cancel-button");
    const habitAddModal = document.querySelector(".habit-add-modal");
    const addHabitModalTitle = document.querySelector(".habit-add-modal-title");
    const closeModalIconContainer = document.querySelector(".close-modal-icon-container");

    closeModalIconContainer.addEventListener("click", () => {
        closeAddHabitModal();
    });

    habitAddButton.textContent = "Save Habit";
    habitAddButton.id = "habit-edit-button";

    habitCancelButton.classList.remove("hidden");
    habitCancelButton.id = "habit-edit-cancel-button";

    addHabitModalTitle.textContent = "EDIT HABIT";

    // Remove previous click listeners to avoid stacking
    const newHabitAddButton = habitAddButton;
    const clonedButton = newHabitAddButton.cloneNode(true);
    newHabitAddButton.parentNode.replaceChild(clonedButton, newHabitAddButton);

    clonedButton.addEventListener("click", () => {
        const habitId = Number(habitAddModal.dataset.habitId);
        if (!habitId) return;
    
        const habitIndex = habits.findIndex(h => h.habitId === habitId);
        if (habitIndex === -1) return;
        
        // Get the folder ID from the UI
        const folderId = habitAddModal.querySelector(".habit-folder-text").dataset.folderId;
        
        // Preserve the existing habit's statistics
        const existingHabit = habits[habitIndex];
        
        // Update the habit with new values while preserving stats
        habits[habitIndex] = {
            ...existingHabit, // Keep all existing properties
            habitName: habitAddModal.querySelector("#new-habit-name").value,
            habitIcon: habitAddModal.querySelector(".new-habit-icon").textContent,
            habitGoal: getHabitGoal(),
            habitRepeat: getHabitRepeat(),
            habitTimeOfDay: habitAddModal.querySelector(".habit-time-text").textContent.trim().toLowerCase(),
            habitFolderId: folderId,
            habitStartDate: habitAddModal.querySelector("#habit-date").value,
            habitDescription: habitAddModal.querySelector("#new-habit-description").value,
            // Explicitly preserve these stats
            habitCompleted: existingHabit.habitCompleted || 0,
            habitFailed: existingHabit.habitFailed || 0,
            habitSkipped: existingHabit.habitSkipped || 0,
            habitStreak: existingHabit.habitStreak || 0,
            habitFinish: existingHabit.habitFinish || false
        };
    
        saveHabitsToLocalStorage();
        renderHabits();
        closeAddHabitModal();
        clearAddHabitInputs();
    
        const folder = folders.find(f => String(f.folderId) === String(folderId));
        if (folder) {
            renderStatsPanel(habits[habitIndex], folder, folder.folderColor || "black");
        }
    });
    


    closeModalIconContainer.addEventListener("click", () => {
        closeAddHabitModal();
    });

    habitAddButton.textContent = "Save Habit";
    habitAddButton.id = "habit-edit-button";

    habitCancelButton.classList.remove("hidden");
    habitCancelButton.id = "habit-edit-cancel-button";

    addHabitModalTitle.textContent = "EDIT HABIT";
}

export function resetStatsPanel() {
    const statsPanel = document.querySelector("#habits-stats-container");
    
    const statsPanelHTML = `
    <div class="habits-stats-header">
        <div class="habits-stats-header-left">
            <div class="habits-stats-title"></div>
        </div>
        <div class="habits-stats-header-right">
            <div class="habits-stats-folder hidden"></div>
            <div class="habits-stats-edit-icon-container">
                <img src="images/habits-container-icons/icons8-edit-50.png" class="habit-edit-icon" alt="edit">
            </div>
        </div>
    </div>
    <div class="habits-stats">
        <div class="habit-current-streaks-stats-container stats-container">
            <div class="streak-icon-container">
                <img src="images/habits-container-icons/icons8-fire-48.png" class="streak-icon" alt="streak">
            </div>
            <div class="streak-stats-container">
                <div class="current-streak-title">Current Streak</div>
                <div class="current-streak">0 days</div>
            </div>
        </div>
        
        <div class="habit-completed-times-stats-container">
            <div class="completed-icon-container">
                <img src="images/habits-container-icons/icons8-check-mark-48.png" class="streak-icon" alt="streak">
            </div>
            <div class="completed-stats-container">
                <div class="current-completed-title">Completed Times</div>
                <div class="current-completed">0 times</div>
            </div>
        </div>
        <div class="habit-failed-times-stats-container">
            <div class="failed-icon-container">
                <img src="images/habits-container-icons/icons8-cancel-48.png" class="streak-icon" alt="streak">
            </div>
            <div class="failed-stats-container">
                <div class="current-failed-title">Failed Times</div>
                <div class="current-failed">0 times</div>
            </div>
        </div>
        
        
        <div class="habit-skipped-times-stats-container">
            <div class="skipped-icon-container">
                <img src="images/habits-container-icons/icons8-skip-48.png" class="streak-icon" alt="streak">
            </div>
            <div class="skipped-stats-container">
                <div class="current-skipped-title">Skipped Times</div>
                <div class="current-skipped">0 times</div>
            </div>
        </div>
    </div>
    `

    statsPanel.innerHTML = statsPanelHTML;
    statsPanel.removeAttribute("data-id");
}

function popUpStatsPanelInSmallScreen() {
    const statsPanel = document.querySelector("#habits-stats-container");
    const isSmallScreen = window.matchMedia("(max-width: 1122px)").matches;
    const menu = document.querySelector("#habits-menu");

    if (isSmallScreen) {
        statsPanel.classList.add("pop-up-stats-panel");
        addCloseStatsPanelButtonInSmallScreen();
        menu.classList.remove("pop-up-menu");
    } else {
        statsPanel.classList.remove("pop-up-stats-panel");
    }
}

function addCloseStatsPanelButtonInSmallScreen() {
    const statsPanel = document.querySelector("#habits-stats-container");
    const statsHeaderLeft = document.querySelector(".habits-stats-header-left");

    const closeStatsPanelButton = statsHeaderLeft.querySelector(".close-stats-panel-icon");
    if (closeStatsPanelButton) {
        closeStatsPanelButton.remove();
    }

    const closeButton = document.createElement("img");
    closeButton.src = "images/habits-container-icons/icons8-close-16.png";
    closeButton.classList.add("close-stats-panel-icon");
    statsHeaderLeft.prepend(closeButton);

    closeButton.addEventListener("click", () => {
        statsPanel.classList.remove("pop-up-stats-panel");
        console.log("Stats panel closed in small screen");
    });
}





    