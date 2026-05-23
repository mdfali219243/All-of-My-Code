import { setupFolderDivClicks, updatePageTitleFolder, reapplyCurrentFilter } from "../scripts/menu.js";
import { deleteAllTasksInFolder } from "./tasks.js";
import { setupFolderMenuListeners } from "../scripts/stats.js";

// Folders object to hold all folders
export let folders = {
    1: {
        folderId: 1,
        folderName: "Task Queue",
        folderColor: "transparent",
        folderIcon: "📥"
    }
};



// DOMContentLoaded: setup everything
document.addEventListener("DOMContentLoaded", () => {
    loadFoldersFromLocalStorage();
    renderFolderPickerMenu();
    setupAddEditFolderButton("add");

    // Icon selector menu
    const inputFolderIconContainer = document.querySelector(".todo-input-folder-icon-container");
    const inputFolderIcon = document.querySelector(".todo-input-folder-icon-js");
    const inputFolderIconMenu = document.querySelector(".todo-folder-menu");

    inputFolderIconContainer.addEventListener("click", () => {
        if (!inputFolderIconContainer.classList.contains("hidden")) {
            inputFolderIconMenu.classList.remove("hidden-element");
        }
    });

    document.addEventListener("click", (e) => {
        if (
            inputFolderIconMenu &&
            !inputFolderIcon.contains(e.target) &&
            !inputFolderIconMenu.contains(e.target)
        ) {
            inputFolderIconMenu.classList.add("hidden-element");
        }
    });

    // Folder icon menu selection
    inputFolderIconMenu.addEventListener("click", (event) => {
        const option = event.target.closest(".folder-menu-container");
        if (!option) return;

        // Get icon + name from clicked option
        const folderName = option.querySelector(".folder-menu-name").textContent.trim();
        const folderIcon = option.querySelector(".folder-icon").textContent.trim();

        // Replace selected folder display
        inputFolderIconContainer.innerHTML = `${folderIcon} ${folderName}`;
        inputFolderIconContainer.setAttribute("data-id", option.getAttribute("data-id"));

        // Highlight selected in menu
        document.querySelectorAll(".folder-menu-container").forEach(opt =>
            opt.classList.remove("current-folder")
        );
        option.classList.add("current-folder");
        inputFolderIconContainer.classList.add("current-folder");

        // Hide menu
        inputFolderIconMenu.classList.add("hidden-element");
    });

    document.getElementById("folderColorPicker").addEventListener("input", changeFolderColorIndicator);

    // Modal open/close
    const addFolderIcon = document.querySelector(".add-folder-icon");
    const addFolderIconModalOverlay = document.getElementById("modal-overlay");
    const addFolderIconModalCloseIcon = document.querySelector(".close-modal-icon-container");

    addFolderIcon.addEventListener("click", () => {
        openModal();
        clearFolderInput();
        setupAddEditFolderButton("add");
    });

    addFolderIconModalCloseIcon.addEventListener("click", () => {
        closeModal();
    });

    // Hide all folder menus on click outside
    document.addEventListener("click", () => {
        document.querySelectorAll(".folder-more-icon-menu-container").forEach(menu => {
            menu.classList.add("hidden-element");
        });
    });
});

// Add a new folder
function addFolder() {
    const folderId = Date.now(); // Unique folder ID
    const folderName = document.querySelector(".folder-name-input").value;
    const folderColor = document.getElementById("folderColorPicker").value;
    const folderIcon = document.getElementById("folderIcon").textContent;

    const newFolder = {
        folderId,
        folderName,
        folderColor,
        folderIcon
    };

    folders[folderId] = newFolder;
    saveFoldersToLocalStorage();
    renderFolderPickerMenu();
    renderAllFolders();
}

// Render a folder item to the page
function addFolderToThePage(folderIcon, folderName, folderColor, folderId) {
    const folderContainer = document.querySelector(".folder-list");
    const folderDiv = document.createElement("div");
    folderDiv.classList.add("folder-div");
    folderDiv.setAttribute("data-id", folderId);
    folderDiv.setAttribute("data-folder", folderName);

    folderDiv.innerHTML = `
        <div class="folder-div-left">
            <div class="folder-div-icon">${folderIcon}</div>
            <div class="folder">${folderName}</div>
        </div>
        <div class="folder-div-right">
            <div class="folder-color-circle" style="background-color: ${folderColor};"></div>
            <div class="folder-more-icon-container">
                <img class="folder-more-icon" src="images/todo-container/icons8-more-30.png">
                <div class="folder-more-icon-menu-container hidden-element">
                    <div class="folder-more-icon-menu edit-folder">
                        <img src="images/todo-folders-icons/icons8-edit-16.png">
                        <div>Edit</div>
                    </div>
                    <div class="folder-more-icon-menu delete-folder">
                        <img src="images/todo-container/icons8-trash-can-50.png" class="delete-folder-icon">
                        <div>Delete</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Toggle the right menu
    const moreIcon = folderDiv.querySelector(".folder-more-icon");
    const menuContainer = folderDiv.querySelector(".folder-more-icon-menu-container");

    moreIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        menuContainer.classList.toggle("hidden-element");
    });

    // Delete handler
    folderDiv.querySelector(".delete-folder").addEventListener("click", () => {
        deleteFolder(folderId);
    });

    // Edit handler
    folderDiv.querySelector(".edit-folder").addEventListener("click", () => {
        openModal();
        editFolder(folderId);
        setupAddEditFolderButton("edit", folderId);
    });

    menuContainer.addEventListener("click", e => e.stopPropagation());

    folderContainer.appendChild(folderDiv);
}

// Save folders to localStorage
function saveFoldersToLocalStorage() {
    localStorage.setItem("folders", JSON.stringify(folders));
}

// Load folders from localStorage
export function loadFoldersFromLocalStorage() {
    const storedFolders = localStorage.getItem("folders");
    if (storedFolders) {
        const parsedFolders = JSON.parse(storedFolders);
        Object.assign(folders, parsedFolders);
        renderAllFolders();
    }
}

// Delete a folder
function deleteFolder(folderId) {
    delete folders[folderId];
    deleteAllTasksInFolder(folderId);
    saveFoldersToLocalStorage();
    renderAllFolders();
    renderFolderPickerMenu();
}

// Render all folders
function renderAllFolders() {
    const folderContainer = document.querySelector(".folder-list");
    folderContainer.innerHTML = "";
    Object.values(folders).forEach(folder => {
        addFolderToThePage(folder.folderIcon, folder.folderName, folder.folderColor, folder.folderId);
    });
    setupFolderDivClicks();
}

// Render folder picker menu
export function renderFolderPickerMenu() {
    const dynamicMenus = document.querySelectorAll(".folder-menu-dynamic");
    dynamicMenus.forEach(menu => {
        menu.innerHTML = "";
        Object.values(folders).forEach(folder => {
            const folderPicker = document.createElement("div");
            folderPicker.classList.add("folder-menu-container");
            folderPicker.setAttribute("data-id", folder.folderId);
            folderPicker.setAttribute("data-folder", folder.folderName);
            folderPicker.setAttribute("data-color", folder.folderColor);

            folderPicker.innerHTML = `
                <div class="folder-menu-icon-container">
                    <div class="folder-icon">${folder.folderIcon}</div>
                </div>
                <div class="folder-menu-name">${folder.folderName}</div>
            `;
            menu.appendChild(folderPicker);
        });
    });
}

// Modal handling
function openModal() {
    document.getElementById("modal-overlay").classList.remove("hidden-element");
}
function closeModal() {
    document.getElementById("modal-overlay").classList.add("hidden-element");
}

// Clear folder input fields and color indicator
function clearFolderInput() {
    document.querySelector(".folder-name-input").value = "";
    document.getElementById("folderColorPicker").value = "#000000";
    document.getElementById("folderIcon").textContent = "📁";
    const colorIndicator = document.querySelector(".color-indicator-circle");
    if (colorIndicator) {
        colorIndicator.style.backgroundColor = "#000000";
    }
}

// Change folder color indicator in modal
function changeFolderColorIndicator() {
    const selectedColor = document.getElementById("folderColorPicker").value;
    const container = document.querySelector(".folder-color-picker-container");
    
    container.querySelectorAll(".color-indicator-circle").forEach(el => el.remove());
    const newColorPickerCircle = document.createElement("div");
    newColorPickerCircle.classList.add("color-indicator-circle");
    newColorPickerCircle.style.backgroundColor = selectedColor;
    const colorPickerIcon = container.querySelector(".color-picker-icon");
    if (colorPickerIcon && colorPickerIcon.nextSibling) {
        container.insertBefore(newColorPickerCircle, colorPickerIcon.nextSibling);
    } else {
        container.appendChild(newColorPickerCircle);
    }
}

// Fill modal with folder data for editing
function editFolder(folderId) {
    const addFolderButton = document.querySelector(".add-folder-button, .edit-folder-button");
    addFolderButton.classList.add("edit-folder-button");
    addFolderButton.classList.remove("add-folder-button");
    addFolderButton.textContent = "Edit Folder";

    const folder = folders[folderId];
    document.querySelector(".folder-name-input").value = folder.folderName;
    document.getElementById("folderColorPicker").value = folder.folderColor;
    document.getElementById("folderIcon").textContent = folder.folderIcon;

    // Update the color indicator safely
    const colorIndicator = document.querySelector(".color-indicator-circle");
    if (colorIndicator) {
        colorIndicator.style.backgroundColor = folder.folderColor;
    } else {
        // If it doesn't exist, create it
        changeFolderColorIndicator();
    }

    renderFolderPickerMenu();


}

// Update folder data after editing
function editedFolderAddition(folderId) {
    const folder = folders[folderId];
    folder.folderName = document.querySelector(".folder-name-input").value;
    folder.folderColor = document.getElementById("folderColorPicker").value;
    folder.folderIcon = document.getElementById("folderIcon").textContent;
    folders[folderId] = folder;
    saveFoldersToLocalStorage();
    updatePageTitleFolder(folder.folderName)
    renderAllFolders();
    closeModal();
    clearFolderInput();
    setupAddEditFolderButton("add"); // Reset button to add mode
    
}

// Setup add/edit button event handler
function setupAddEditFolderButton(mode, folderId = null) {
    const button = document.querySelector(".add-folder-button, .edit-folder-button");
    const newButton = button.cloneNode(true); // Remove all old listeners
    button.parentNode.replaceChild(newButton, button);

    if (mode === "add") {
        newButton.classList.remove("edit-folder-button");
        newButton.classList.add("add-folder-button");
        newButton.textContent = "Add Folder";
        newButton.onclick = () => {
            addFolder();
            closeModal();
            setTimeout(clearFolderInput, 200);
        };
    } else if (mode === "edit") {
        newButton.classList.remove("add-folder-button");
        newButton.classList.add("edit-folder-button");
        newButton.textContent = "Edit Folder";
        newButton.onclick = () => {
            editedFolderAddition(folderId);
            renderFolderPickerMenu();
        };
    }
}

// Add this to tasks.js
let hasClearedTasks = false;

export function clearTasksOnce() {
    if (hasClearedTasks) return;
    tasks.length = 0;
    saveTasksToLocalStorage();
    hasClearedTasks = true;
}

