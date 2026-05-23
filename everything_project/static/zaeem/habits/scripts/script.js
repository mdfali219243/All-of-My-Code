
import { addHabitRefreshParams } from "../data/habit.js";

document.addEventListener("DOMContentLoaded", () => {
    const addHabitMenusParents = document.querySelectorAll(".add-habit-input");
    addHabitMenusParents.forEach(parent => {
        parent.addEventListener("click", () => {
            toggleAddHabitMenus(parent);
        });
    });

    const addHabitDateInput = document.querySelector("#habit-date");
    const addHabitDateText = document.querySelector(".habit-date-text");
    addHabitDateText.addEventListener("click", () => {
        addHabitDateInput.showPicker();
    });

    bindRepeatMenuItemHover();
});

document.querySelectorAll('.habits-group-header').forEach(header => {
    header.addEventListener('click', () => {
        const habitsGroup = header.closest('.habits-group');
        const habits = habitsGroup.querySelector('.habits');
        header.classList.toggle('open');
        habits.classList.toggle('hidden');
    });
});

document.querySelector(".add-habits-container").addEventListener("click", () => {
    addHabitRefreshParams();
    const modalOverlay = document.getElementById("modal-overlay");
    const habitModal = document.querySelector(".habit-add-modal");
    modalOverlay.classList.remove("hidden");
    habitModal.classList.remove("hidden");

    const closeModalIconContainer = document.querySelector(".close-modal-icon-container");
    closeModalIconContainer.addEventListener("click", () => {
        modalOverlay.classList.add("hidden");
        habitModal.classList.add("hidden");
    });
});

document.querySelector(".add-folder-icon").addEventListener("click", () => {
    const modalOverlay = document.getElementById("modal-overlay");
    const folderModal = document.querySelector(".folder-add-modal");
    modalOverlay.classList.remove("hidden");
    folderModal.classList.remove("hidden");

    const closeModalIcon = folderModal.querySelector(".close-modal-icon-container");
    closeModalIcon.addEventListener("click", () => {
        modalOverlay.classList.add("hidden");
        folderModal.classList.add("hidden");
    });
});

const sidebarIcon = document.querySelector(".collapse-sidebar-icon"); // initial class
const habitsMenu = document.getElementById("habits-menu");
const habitsContainer = document.getElementById("habits-container");

sidebarIcon.addEventListener("click", () => {
  const isSmallScreen = window.matchMedia("(max-width: 790px)").matches;

  if (isSmallScreen) {
    // Just show the menu, do not toggle icon
    habitsMenu.classList.add("pop-up-menu");
    const statsPanel = document.querySelector("#habits-stats-container");

    // ✅ If on small screen and stats panel is active, remove it
    if (window.innerWidth < 790 && statsPanel.classList.contains("pop-up-stats-panel")) {
      statsPanel.classList.remove("pop-up-stats-panel");
    }

    // Hide on outside click
    document.addEventListener("click", function handleOutsideClick(e) {
      if (!habitsMenu.contains(e.target) && !sidebarIcon.contains(e.target)) {
        habitsMenu.classList.remove("pop-up-menu");
        document.removeEventListener("click", handleOutsideClick);
      }
    });
  } else {
    // Toggle expand/collapse logic
    const isCollapsed = sidebarIcon.classList.contains("collapse-sidebar-icon");

    if (isCollapsed) {
      // Collapse
      habitsMenu.classList.add("hidden-menu");
      habitsContainer.style.width = "67%";
      sidebarIcon.src = "images/habits-container-icons/expand.png";
      sidebarIcon.classList.remove("collapse-sidebar-icon");
      sidebarIcon.classList.add("expand-sidebar-icon");
    } else {
      // Expand
      habitsMenu.classList.remove("hidden-menu");
      habitsContainer.style.width = "50%";
      sidebarIcon.src = "images/habits-container-icons/collapse.png";
      sidebarIcon.classList.remove("expand-sidebar-icon");
      sidebarIcon.classList.add("collapse-sidebar-icon");
    }
  }
});



function updateExpandSideBarIconSrc(e) {
  if (e.matches) {
    sidebarIcon.src = "images/habits-container-icons/expand.png";
    sidebarIcon.classList.remove("collapse-sidebar-icon");
    sidebarIcon.classList.add("expand-sidebar-icon");
  }
}

function updateCollapseSideBarIconSrc(e) {
  if (e.matches) {
    // Clean mobile classes
    habitsMenu.classList.remove("pop-up-menu");

    if (habitsMenu.classList.contains("hidden-menu")) {
      // ✅ Sidebar is collapsed — update icon to expand
      sidebarIcon.src = "images/habits-container-icons/expand.png";
      sidebarIcon.classList.remove("collapse-sidebar-icon");
      sidebarIcon.classList.add("expand-sidebar-icon");
    } else {
      // Sidebar is expanded — show collapse icon
      sidebarIcon.src = "images/habits-container-icons/collapse.png";
      sidebarIcon.classList.remove("expand-sidebar-icon");
      sidebarIcon.classList.add("collapse-sidebar-icon");
    }
  }
}

// Create a media query list
const mq = window.matchMedia('(max-width: 790px)');
const mq2 = window.matchMedia('(min-width: 791px)');

// Initial check
updateExpandSideBarIconSrc(mq);
updateCollapseSideBarIconSrc(mq2);

// Listen for viewport changes
mq.addEventListener('change', updateExpandSideBarIconSrc);
mq2.addEventListener('change', updateCollapseSideBarIconSrc);


function toggleAddHabitMenus(parent) {
    let clickedMenu = parent.querySelector(".add-habit-menu-container");

    if (!clickedMenu) return;

    if (!clickedMenu.classList.contains("hidden")) {
        const stickyClasses = [
            "habit-time-menu-container",
            "habit-repeat-menu-container",
            "habit-repeat-menu-item-container"
        ];

        if (stickyClasses.some(cls => clickedMenu.classList.contains(cls))) {
            return;
        } else {
            clickedMenu.classList.add("hidden");
            return;
        }
    }

    const allMenus = document.querySelectorAll(".add-habit-menu-container");
    allMenus.forEach(menu => menu.classList.add("hidden"));

    clickedMenu.classList.remove("hidden");

    const handleClickOutside = (e) => {
        const stickyClasses = [
            "habit-time-menu-container",
            "habit-repeat-menu-container",
            "habit-repeat-menu-item-container"
        ];

        if (
            stickyClasses.some(cls => e.target.closest(`.${cls}`)) ||
            parent.contains(e.target)
        ) {
            return;
        }

        clickedMenu.classList.add("hidden");
        document.removeEventListener("click", handleClickOutside, true);
    };

    document.addEventListener("click", handleClickOutside, true);
}

function bindRepeatMenuItemHover() {
    const repeatItemsContainer = document.querySelectorAll(".habit-repeat-menu-item-container");

    repeatItemsContainer.forEach(container => {
        const repeatItemMenu = container.querySelector(".habit-repeat-item-menu-container");
        let hideTimeout;

        container.addEventListener("mouseenter", () => {
            repeatItemsContainer.forEach(otherContainer => {
                const otherMenu = otherContainer.querySelector(".habit-repeat-item-menu-container");
                if (otherMenu !== repeatItemMenu) {
                    otherMenu.classList.add("hidden");
                }
            });

            clearTimeout(hideTimeout);
            repeatItemMenu.classList.remove("hidden");
        });

        container.addEventListener("mouseleave", () => {
            hideTimeout = setTimeout(() => {
                if (!repeatItemMenu.matches(":hover")) {
                    repeatItemMenu.classList.add("hidden");
                }
            }, 500);
        });

        repeatItemMenu.addEventListener("mouseenter", () => {
            clearTimeout(hideTimeout);
        });

        repeatItemMenu.addEventListener("mouseleave", () => {
            hideTimeout = setTimeout(() => {
                if (!container.matches(":hover")) {
                    repeatItemMenu.classList.add("hidden");
                }
            }, 500);
        });
    });
}
