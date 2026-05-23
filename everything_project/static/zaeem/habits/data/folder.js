document.addEventListener("DOMContentLoaded", () => {
    loadFoldersFromLocalStorage();
    renderFolders();
    renderFolderPickerMenus();
    document.getElementById("addFolderButton").addEventListener("click", () => {
        if (editingFolderId !== null) {
            saveEditedFolder();
        } else {
            addFolder();
        }
        closeAddFolderModal();
        clearAddFolderInputs();
    });

    document.getElementById("folderColorPicker").addEventListener("input", changeFolderColorIndicator);

    
});

export let folders = [
    {
        folderId: 1,
        folderName: "Habit Queue",
        folderIcon: "📥",
        folderColor: "transparent",
    }
];
let editingFolderId = null;


function addFolder() {
    const addFolderModal = document.querySelector(".folder-add-modal");
    const addFolderInputs = {
        folderId: Date.now(),
        folderName: addFolderModal.querySelector(".folder-name-input").value,
        folderIcon: addFolderModal.querySelector("#folderIcon").textContent,
        folderColor: addFolderModal.querySelector("#folderColorPicker").value,
    }
    folders.push(addFolderInputs);
    renderFolders();
    renderFolderPickerMenus();
    saveFoldersToLocalStorage();
}

function renderFolders() {
    const MenuFolderList = document.querySelector(".habits-folder-list");
    MenuFolderList.innerHTML = "";

    for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];
        const folderDiv = document.createElement("div");
        folderDiv.setAttribute("data-id", folder.folderId);
        folderDiv.setAttribute("data-folder", folder.folderName);
        folderDiv.setAttribute("data-color", folder.folderColor);
        folderDiv.setAttribute("data-icon", folder.folderIcon);
        folderDiv.classList.add("folder-div");
        folderDiv.innerHTML = `
        <div class="folder-div-left">
            <div class="folder-div-icon">${folder.folderIcon}</div>
            <div class="folder">${folder.folderName}</div>
        </div>
        <div class="folder-div-right">
            <div class="folder-color-circle" style="background-color: ${folder.folderColor};"></div>
            <div class="folder-more-icon-container">
                <img class="folder-more-icon" src="images/habits-folder-icons/icons8-more-30.png">
                <div class="folder-more-icon-menu-container hidden-element">
                    <div class="folder-more-icon-menu edit-folder" data-operation="edit">
                        <img src="images/habits-folder-icons/icons8-edit-16.png">
                        <div>Edit</div>
                    </div>
                    <div class="folder-more-icon-menu delete-folder" data-operation="delete">
                        <img src="images/habits-folder-icons/icons8-trash-can-50.png" class="delete-folder-icon">
                        <div>Delete</div>
                    </div>
                </div>
            </div>
        </div>
            
        `;
        MenuFolderList.appendChild(folderDiv);
        
        folderDiv.querySelector(".folder-more-icon").addEventListener("click", () => {
            setupFolderMoreIconMenuClicks(folderDiv);
        });
    }
    
    
    
}

function saveFoldersToLocalStorage() {
    localStorage.setItem("folders", JSON.stringify(folders));
}

export function loadFoldersFromLocalStorage() {
    const storedFolders = localStorage.getItem("folders");
    if (storedFolders) {
        const parsedFolders = JSON.parse(storedFolders);

        // ✅ Safety check
        if (Array.isArray(parsedFolders)) {
            folders.length = 0;
            folders.push(...parsedFolders);
        } else {
            console.warn("Folders data in localStorage is not an array:", parsedFolders);
            // Optional: reset it
            localStorage.removeItem("folders");
        }
    }
    renderFolders();
}





function closeAddFolderModal() {
    const modalOverlay = document.getElementById("modal-overlay");
    const addFolderModal = document.querySelector(".folder-add-modal");
    modalOverlay.classList.add("hidden");
    addFolderModal.classList.add("hidden");
}

function openModal() {
    const modalOverlay = document.getElementById("modal-overlay");
    const addFolderModal = document.querySelector(".folder-add-modal");
    modalOverlay.classList.remove("hidden");
    addFolderModal.classList.remove("hidden");
}
    
    

function clearAddFolderInputs() {
    const addFolderModal = document.querySelector(".folder-add-modal");
    addFolderModal.querySelector(".folder-name-input").value = "";
    addFolderModal.querySelector("#folderIcon").textContent = "📁";
    addFolderModal.querySelector("#folderColorPicker").value = "#ffffff";
    editingFolderId = null;
}

function setupFolderMoreIconMenuClicks(folderDiv) {
    const folderMoreIconMenuContainer = folderDiv.querySelector(".folder-more-icon-menu-container");
    if (folderMoreIconMenuContainer.classList.contains("hidden-element")) {
        folderMoreIconMenuContainer.classList.remove("hidden-element");
    } else {
        folderMoreIconMenuContainer.classList.add("hidden-element");
    }

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        if (!folderDiv.contains(e.target)) {
            folderMoreIconMenuContainer.classList.add("hidden-element");
        }
    })

    // Close other open menus when other menu is opened
    document.querySelectorAll(".folder-more-icon-menu-container").forEach(menu => {
        if (menu !== folderMoreIconMenuContainer) {
            menu.classList.add("hidden-element");
        }
    })

    // Close the menu when clicking a child item of it.
    const folderMoreIconMenuItems = folderDiv.querySelectorAll(".folder-more-icon-menu");
    folderMoreIconMenuItems.forEach(item => {
        item.addEventListener("click", () => {
            folderMoreIconMenuContainer.classList.add("hidden-element");
        });
    });

    folderMoreIconMenuItems.forEach(item => {
        item.addEventListener("click", () => {
            folderMoreIconMenuClicks(item.getAttribute("data-operation"), folderDiv);
        });
    });
}


function folderMoreIconMenuClicks(operation, folderDiv) {
    const folderId = folderDiv.getAttribute("data-id");
    if (operation === "edit") {
        editFolder(folderId); // just call this directly
    } else if (operation === "delete") {
        deleteFolder(folderId);
    }
}

function deleteFolder(folderId) {
    const index = folders.findIndex(folder => folder.folderId == folderId);
    folders.splice(index, 1);
    renderFolders();
    saveFoldersToLocalStorage();
}

function editFolder(folderId) {
    const folder = folders.find(folder => folder.folderId == folderId);
    if (!folder) return;

    editingFolderId = folderId;
    openModal();

    const addFolderModal = document.querySelector(".folder-add-modal");
    addFolderModal.querySelector(".folder-name-input").value = folder.folderName;
    addFolderModal.querySelector("#folderIcon").textContent = folder.folderIcon;
    addFolderModal.querySelector("#folderColorPicker").value = folder.folderColor;

    const addFolderButton = document.getElementById("addFolderButton");
    addFolderButton.textContent = "Save Changes";
    addFolderButton.classList.add("edit-mode");

    // Update the color indicator safely
    const colorIndicator = document.querySelector(".color-indicator-circle");
    if (colorIndicator) {
        colorIndicator.style.backgroundColor = folder.folderColor;
    } else {
        // If it doesn't exist, create it
        changeFolderColorIndicator();
    }

    renderFolderPickerMenus();
}


function saveEditedFolder() {
    const addFolderModal = document.querySelector(".folder-add-modal");
    const folder = folders.find(folder => folder.folderId == editingFolderId);
    if (!folder) return;

    folder.folderName = addFolderModal.querySelector(".folder-name-input").value;
    folder.folderIcon = addFolderModal.querySelector("#folderIcon").textContent;
    folder.folderColor = addFolderModal.querySelector("#folderColorPicker").value;

    saveFoldersToLocalStorage();
    renderFolders();

    editingFolderId = null;

    const addFolderButton = document.getElementById("addFolderButton");
    addFolderButton.textContent = "Add Folder";
    addFolderButton.classList.remove("edit-mode");
}

function renderFolderPickerMenus() {
    const folderPickerMenus = document.querySelectorAll(".habit-folder-menu-container");
    folderPickerMenus.forEach(menu => {
        menu.innerHTML = "";

        folders.forEach(folder => {
            const folderMenuItem = document.createElement("div");
            folderMenuItem.classList.add("habit-folder-item-container");
            const folderMenuItemHTML = `
                <div class="habit-folder-item-container">
                    <div class="habit-folder-item-icon">${folder.folderIcon}</div>
                    <div class="habit-folder-item-text-container">${folder.folderName}</div>
                </div>
                <div class="folder-color-circle" style="background-color: ${folder.folderColor};"></div>
            `
            folderMenuItem.dataset.id = folder.folderId;
            folderMenuItem.innerHTML = folderMenuItemHTML;
            menu.appendChild(folderMenuItem);
        });
    });
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