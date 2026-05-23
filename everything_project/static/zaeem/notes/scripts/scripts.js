document.addEventListener("DOMContentLoaded", () => {
    pageToggles();
    sidebarIconMenuToggle();
    pageHeaderClickPagesToggle();
});




document.addEventListener("click", (e) => {
    const targetElement = e.target;

    // If clicked the button
    if (targetElement.classList.contains("page-more-icon")) {
        const menu = targetElement.nextElementSibling; // assume menu is the sibling div
        togglePageMoreIconMenu(menu);
    } 
    // If clicked outside the menu
    else if (!targetElement.closest(".page-more-icon-menu") &&
             !targetElement.closest(".page-more-icon")) {
        document.querySelectorAll(".page-more-icon-menu").forEach(menu => {
            menu.classList.add("hidden");
        });
    }
});

document.addEventListener("click", (e) => {
    const button = e.target.closest(".page-container-more-icon");
    const menu = e.target.closest(".page-container-more-icon-menu");

    // If clicked on a button
    if (button) {
        const menuEl = button.nextElementSibling;

        // Close all menus first
        document.querySelectorAll(".page-container-more-icon-menu").forEach(m => {
            if (m !== menuEl) m.classList.add("hidden");
        });

        // Toggle this one
        menuEl.classList.toggle("hidden");
        return; // stop here so it doesn’t close immediately
    }

    // If clicked inside a menu, do nothing (let menu item handlers work)
    if (menu) {
        return;
    }

    // Otherwise (clicked outside) → close all
    document.querySelectorAll(".page-container-more-icon-menu").forEach(m => {
        m.classList.add("hidden");
    });
});

document.addEventListener("click", (e) => {
    const targetElement = e.target;
    if (targetElement.classList.contains("page-icon")) {
        const parentElement = targetElement.parentElement;
        parentElement.className = "page-container flex items-center h-auto relative gap-2 page-hover-zone";
        targetElement.className = "page-icon folder-icon cursor-pointer rounded p-[2px] py-[2px] text-[5rem]";

        // delete the text inside the page title "add icon"
        targetElement.textContent = "😀";
    }
})



document.addEventListener("click", (e) => {
    const targetElement = e.target;
    if (targetElement.classList.contains("line-block-menu-icon")) {
        const menu = targetElement.nextElementSibling;
        menu.classList.toggle("hidden");
    } 

    // If not clicked on the menu
    else if (!targetElement.closest(".line-block-menu")) {
        document.querySelectorAll(".line-block-menu").forEach(menu => {
            menu.classList.add("hidden");
        });
    }
}); 



export function pageToggles() {
    const pageContainers = document.querySelectorAll(".page-container");
    const expandedState = new WeakMap();

    pageContainers.forEach(container => {
        const arrowImg = container.querySelector("img[alt='page icon']");
        const containerPadding = parseFloat(getComputedStyle(container).paddingLeft);

        if (arrowImg) {
            arrowImg.style.cursor = "pointer";
            arrowImg.addEventListener("click", () => togglePage(container, arrowImg, containerPadding, expandedState));

            container.addEventListener("mouseenter", () => showPageIcons(container, expandedState));
            container.addEventListener("mouseleave", () => hidePageIcons(container));
        } else {
            container.addEventListener("mouseenter", () => showPageIcons(container, expandedState));
            container.addEventListener("mouseleave", () => hidePageIcons(container));
        }
    });
}

function togglePage(container, arrowImg, containerPadding, expandedState) {
    const isExpanded = expandedState.get(container);
    const shouldExpand = !isExpanded;
    expandedState.set(container, shouldExpand);

    arrowImg.classList.toggle("rotate-90", shouldExpand);

    let sibling = container.nextElementSibling;
    while (sibling) {
        const siblingPadding = parseFloat(getComputedStyle(sibling).paddingLeft);
        if (siblingPadding <= containerPadding) break;

        if (shouldExpand && Math.abs(siblingPadding - (containerPadding + 16)) < 2) {
            sibling.classList.remove("hidden");
        } else if (!shouldExpand) {
            sibling.classList.add("hidden");

            const nestedArrow = sibling.querySelector("img[alt='page icon']");
            if (nestedArrow) {
                nestedArrow.classList.remove("rotate-90");
                expandedState.set(sibling, false);
            }
        }
        sibling = sibling.nextElementSibling;
    }
}

function showPageIcons(container, expandedState) {
    container.querySelectorAll("img[alt='more icon'], img[alt='add icon']")
        .forEach(icon => icon.parentElement.classList.remove("hidden"));

    const arrowImg = container.querySelector("img[alt='page icon']");
    if (arrowImg) {
        arrowImg.src = "images/menu/icons8-forward-16 (1).png";
        if (expandedState.get(container)) arrowImg.classList.add("rotate-90");
    }
}

function hidePageIcons(container) {
    container.querySelectorAll("img[alt='more icon'], img[alt='add icon']")
        .forEach(icon => icon.parentElement.classList.add("hidden"));

    const arrowImg = container.querySelector("img[alt='page icon']");
    if (arrowImg) {
        arrowImg.src = "images/menu/icons8-page-16.png";
        arrowImg.classList.remove("rotate-90");
    }
}





function togglePageMoreIconMenu(menu) {
    menu.classList.toggle("hidden");
}

function sidebarIconMenuToggle() {
    const sidebarIcon = document.querySelector("img[alt='sidebar icon']");
    const notesMenu = document.querySelector("#notes-menu");
    
    sidebarIcon.addEventListener("click", () => {
        if (sidebarIcon.classList.contains("collapse-icon")) {
            sidebarIcon.classList.remove("collapse-icon");
            sidebarIcon.classList.add("expand-icon");
            sidebarIcon.src = "images/container-header/expand.png";

            notesMenu.classList.add("hidden");

        } else {
            sidebarIcon.classList.remove("expand-icon");
            sidebarIcon.classList.add("collapse-icon");
            sidebarIcon.src = "images/container-header/collapse.png";

            notesMenu.classList.remove("hidden");
        }
    })
}


function pageHeaderClickPagesToggle() {
    const pageHeader = document.querySelector(".page-header");
    const pages = document.querySelector(".pages-container");
    
    pageHeader.addEventListener("click", () => {
        pages.classList.toggle("hidden");
    })
}





