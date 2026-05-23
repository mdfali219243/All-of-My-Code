import { folders } from "../data/folder.js";
import { renderHabits } from "../data/habit.js";


document.addEventListener("DOMContentLoaded", () => {
    setupTimeFilterClicks();
    setupFolderClicks();
});


function handleTimeFilterClick(selectedTime) {
    const allHabitGroups = document.querySelectorAll(".habits-group");

    allHabitGroups.forEach(group => {
        const groupDataTime = group.getAttribute("data-time");

        if (selectedTime === "all" || groupDataTime === selectedTime) {
            group.style.display = "flex";
            renderHabits();
        } else {
            group.style.display = "none";
        }
    });

    updatePageTitleTime(selectedTime);
    
}

function handleFolderClick(folderId, folderName) {
    const allHabitGroups = document.querySelectorAll(".habits-group");

    allHabitGroups.forEach(group => {
        const groupHabits = group.querySelectorAll(".habits-more-container");
        let matchCount = 0;

        groupHabits.forEach(habit => {
            const habitFolderId = habit.getAttribute("data-folder-id");

            if (habitFolderId === folderId) {
                habit.style.display = "flex";
                matchCount++;
            } else {
                habit.style.display = "none";
            }
        });

        // Show the group only if it has matching habits
        group.style.display = matchCount > 0 ? "flex" : "none";

        // Update the habit count
        const countSpan = group.querySelector(".number-of-habits");
        if (countSpan) countSpan.textContent = matchCount;
    });

    updatePageTitleFolder(folderName);
}
  

function setupTimeFilterClicks() {
    const timeFilterList = document.querySelectorAll(".habits-time-container");

    timeFilterList.forEach(timeFilter => {
        timeFilter.onclick = () => {
            const selectedTime = timeFilter.querySelector(".habits-time").textContent.toLowerCase();
            handleTimeFilterClick(selectedTime);
            closePopUpMenuWhenClickedFilter();
            assignCurrentFilterClass(timeFilter, null);
        };
    });
}

function setupFolderClicks() {
    const folderFilterList = document.querySelectorAll(".folder-div");

    folderFilterList.forEach(folderFilter => {
        folderFilter.onclick = () => {
            const folderId = folderFilter.getAttribute("data-id");
            const folderName = folderFilter.getAttribute("data-folder");
            handleFolderClick(folderId, folderName);
            closePopUpMenuWhenClickedFilter();
            assignCurrentFilterClass(null, folderFilter);
        };
    });
}

function updatePageTitleTime(selectedTime) {
    const pageTitleElement = document.querySelector(".habits-time-title");
    pageTitleElement.textContent = selectedTime.charAt(0).toUpperCase() + selectedTime.slice(1);
}

function updatePageTitleFolder(folderName) {
    const pageTitleElement = document.querySelector(".habits-time-title");
    pageTitleElement.textContent = folderName.charAt(0).toUpperCase() + folderName.slice(1);
}

function assignCurrentFilterClass(selectedTimeFilter, selectedFolderFilter) {
    const timeFilterList = document.querySelectorAll(".habits-time-container");
    const folderFilterList = document.querySelectorAll(".folder-div");

    timeFilterList.forEach(filter => filter.classList.remove("current-filter"));
    folderFilterList.forEach(filter => filter.classList.remove("current-filter"));
    const matchTimeWithIcon = {
        "all": "all-icon",
        "anytime": "hours",
        "morning": "morning",
        "afternoon": "sun",
        "evening": "moon",
        "night": "night"
    }

    if (selectedTimeFilter) {
        console.log(selectedTimeFilter);


        selectedTimeFilter.classList.add("current-filter");


        for (let i = 0; i < timeFilterList.length; i++) {
            const element = timeFilterList[i];
            element.querySelector(".habits-time-icon").src = `images/habits_menu_icons/${matchTimeWithIcon[element.querySelector(".habits-time").textContent.toLowerCase()]}.png`;
        }

        selectedTimeFilter.querySelector(".habits-time-icon").src = `images/habits_menu_icons/${matchTimeWithIcon[selectedTimeFilter.querySelector(".habits-time").textContent.toLowerCase()]}-white.png`;

        

       
    }

    
    
    if (selectedFolderFilter) {
        selectedFolderFilter.classList.add("current-filter");

        for (let i = 0; i < timeFilterList.length; i++) {
            const element = timeFilterList[i];
            element.querySelector(".habits-time-icon").src = `images/habits_menu_icons/${matchTimeWithIcon[element.querySelector(".habits-time").textContent.toLowerCase()]}.png`;
        }
    }
}

export function popUpMenuInSmallScreen() {
    const isSmallScreen = window.matchMedia("(max-width: 790px)").matches;
    const menu = document.querySelector("#habits-menu");
    const statsPanel = document.querySelector("#habits-stats-container");

    if (isSmallScreen) {
        statsPanel.classList.remove("pop-up-stats-panel");
        menu.classList.add("pop-up-menu");
    } else {
        menu.classList.remove("pop-up-menu");
    }
}


function closePopUpMenuWhenClickedFilter() {
    const menu = document.querySelector("#habits-menu");

    if (menu.classList.contains("pop-up-menu")) {
        menu.classList.remove("pop-up-menu");
    }
}
