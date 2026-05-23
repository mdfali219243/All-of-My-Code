import { pageToggles } from "../scripts/scripts.js";

document.addEventListener("DOMContentLoaded", () => {
    
});

document.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".universal-add-icon-container");

    if (!addBtn) return;

    addPage();
});




// SECTION: Variables
let pages = [];
let currentPageId = null;

// SECTION: Default Notes Page Content
const defaultNotesPageContent = `
    <div class="w-full h-[45px] flex items-center p-1">
        <div class="flex items-center gap-2 w-[50%] h-full">
            <div>
                <img src="images/container-header/collapse.png" alt="sidebar icon" class="collapse-icon w-[1.5rem] h-[1.5rem] rounded p-[2px] hover:bg-gray-200 cursor-pointer">
            </div>
            <div class="flex items-center">
                <span class="hover:bg-gray-200 cursor-pointer rounded px-2">Page 1</span>
                <span class="text-gray-500">/</span>
                <span class="hover:bg-gray-200 cursor-pointer rounded px-2">Page 2</span>
                <span class="text-gray-500">/</span>
                <span class="hover:bg-gray-200 cursor-pointer rounded px-2">Page 3</span>
            </div>
        </div>
        <div class="flex items-center gap-2 w-[50%] h-full justify-end">
            <div class="more-icon-container relative">
                <img src="images/container-header/icons8-more-16.png" alt="more icon" class="page-more-icon w-[1.5rem] h-[1.5rem] rounded p-[2px] hover:bg-gray-200 cursor-pointer">
                <div class="page-more-icon-menu flex flex-col border-black-[1px] rounded-[4px] absolute right-0 min-w-[10rem] bg-white border border-black box-shadow-normal p-2 hidden">
                    <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-200 h-[2rem] rounded-sm p-2">
                        <img src="images/container-header/icons8-arrow-16.png" class="w-[1.2rem] h-[1.2rem]">
                        <div>Move To</div>
                    </div>
                    <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-200 h-[2rem] rounded-sm p-2">
                        <img src="images/container-header/icons8-trash-can-50.png" class="w-[1.2rem] h-[1.2rem]">
                        <div>Delete</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="w-full h-[calc(100%-45px)] p-6 overflow-y-auto">
        <div>
            <div class="flex items-center gap-2">
                <div class="page-icon folder-icon hover:bg-gray-200 cursor-pointer rounded px-2">😀 Add Icon</div>
            </div>
            <div  class="page-title font-bold text-5xl bg-blue-500 px-2 outline-none" contenteditable="true">Page 3</div>
        </div>
        <div class="content-container h-[calc(100%-60px)] outline-none bg-blue-300 p-4">
            <div class=" space-y-2 p-2 bg-white">
                <div class="line first-line flex items-start h-auto relative gap-2 line-hover-zone">
                    <div class="icons flex gap-1 pt-1 absolute left-[-3rem] absolute">
                        <img src="images/main/icons8-add-16.png" class="w-[1.2rem] h-[1.2rem] rounded-sm p-[2px] cursor-pointer hover:bg-gray-200 hidden " alt="add block icon"/>
                        <div class="w-[10rem] rounded cursor-pointer absolute top-full left-0 bg-white z-[100] h-auto p-2 border border-black box-shadow-normal hidden">
                            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                                <img src="images/main/icons8-text-16.png" class="w-[1.2rem] h-[1.2rem]">
                                <div class="block-type">Text</div>
                            </div>
                            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                                <img src="images/main/icons8-1-16.png" class="w-[1.2rem] h-[1.2rem]">
                                <div class="block-type">Heading 1</div>
                            </div>
                            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                                <img src="images/main/icons8-2-16.png" class="w-[1.2rem] h-[1.2rem]">
                                <div class="block-type">Heading 2</div>
                            </div>
                            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                                <img src="images/main/icons8-3-16.png" class="w-[1.2rem] h-[1.2rem]">
                                <div class="block-type">Heading 3</div>
                            </div>
                        </div>
                        <img src="images/main/icons8-menu-16 (1).png" class="line-block-menu-icon w-[1.2rem] h-[1.2rem] rounded-sm p-[2px] cursor-pointer hover:bg-gray-200 hidden " alt="move block icon"/>
                        <div class="line-block-menu hidden w-[10rem] rounded absolute top-full left-0 bg-white z-[100] h-auto p-2 border border-black box-shadow-normal">
                            <div class="flex w-full  cursor-pointer  rounded-sm p-1 flex-col">
                                <div class="text-xs font-bold text-gray-500 rounded-sm p-1">Text</div>
                                <div class="flex items-center gap-1 hover:bg-gray-200 cursor-pointer rounded-sm p-1">
                                    <img src="images/main/turn-into.png" class="w-[1.2rem] h-[1.2rem]">
                                    <div>Turn into</div>
                                </div>
                                <div class="flex items-center gap-1 hover:bg-gray-200 cursor-pointer rounded-sm p-1">
                                    <img src="images/main/paint-roller.png" class="w-[1.2rem] h-[1.2rem]">
                                    <div>Color</div>
                                </div>
                                <hr class="w-full my-2">
                                <div class="flex items-center gap-1 hover:bg-gray-200 cursor-pointer rounded-sm p-1">
                                    <img src="images/container-header/icons8-arrow-16.png" class="w-[1.2rem] h-[1.2rem]">
                                    <div>Move to</div>
                                </div>
                                <div class="flex items-center gap-1 hover:bg-gray-200 cursor-pointer rounded-sm p-1">
                                    <img src="images/container-header/icons8-trash-can-50.png" class="w-[1.2rem] h-[1.2rem]">
                                    <div>Delete</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="content w-full outline-none" contenteditable="true"></div>
                    <div class="content-menu top-full w-[10rem] outline-none flex flex-col items-center p-2 absolute bg-white z-[100] hidden border border-black box-shadow-normal rounded">
                        <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                            <img src="images/main/icons8-text-16.png" class="w-[1.2rem] h-[1.2rem]">
                            <div class="block-type">Text</div>
                        </div>
                        <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                            <img src="images/main/icons8-1-16.png" class="w-[1.2rem] h-[1.2rem]">
                            <div class="block-type">Heading 1</div>
                        </div>
                        <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                            <img src="images/main/icons8-2-16.png" class="w-[1.2rem] h-[1.2rem]">
                            <div class="block-type">Heading 2</div>
                        </div>
                        <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                            <img src="images/main/icons8-3-16.png" class="w-[1.2rem] h-[1.2rem]">
                            <div class="block-type">Heading 3</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`
const pageContainer1HTML = `
    <div class="page-container flex items-center gap-2 justify-between w-full h-[2rem] rounded hover:bg-gray-200 pr-2">
         <div class="flex items-center gap-1">
            <div class="w-[1.2rem] h-[1.2rem] rounded-sm p-[2px]">
                <img src="images/menu/icons8-page-16.png" class="w-full h-full object-contain" alt="page icon">
            </div>
            <div>Page 1</div>
        </div>
        <div class="flex items-center gap-1">
            <div class="w-[1.2rem] h-[1.2rem] hover:bg-gray-300 rounded-sm p-[2px] cursor-pointer hidden"> 
                <img src="images/menu/icons8-more-16.png" class="page-container-more-icon w-full h-full object-contain" alt="more icon">
                <div class="page-container-more-icon-menu  hidden relative right-[100%] top-[0%] h-auto p-2 w-[10rem] rounded bg-white border border-black box-shadow-normal ">
                    <div class="flex items-start gap-1 hover:bg-gray-200 rounded-sm p-1">
                        <img src="images/menu/rename.png" class="w-[1.2rem] h-[1.2rem]">
                        <div>Rename</div>
                    </div>
                    <div class="flex items-start gap-1 hover:bg-gray-200 rounded-sm p-1">
                        <img src="images/menu/icons8-trash-can-50.png" class="w-[1.2rem] h-[1.2rem]">
                        <div>Delete</div>
                    </div>
                    <div class="flex items-start gap-1 hover:bg-gray-200 rounded-sm p-1">
                        <img src="images/container-header/icons8-arrow-16.png" class="w-[1.2rem] h-[1.2rem]">
                        <div>Move To</div>
                    </div>
                    
                </div>
            </div>
            <div class="w-[1.2rem] h-[1.2rem] hover:bg-gray-300 rounded-sm p-[2px] cursor-pointer hidden">
                <img src="images/menu/icons8-add-16.png" class="w-full h-full object-contain" alt="add icon">
            </div>
        </div>
    </div>
`
const pageContainer2HTML = ` 
    <div class="page-container w-full h-[2rem] flex flex-col pl-[1rem] hover:bg-gray-200 rounded pr-2 hidden">
        <div class="flex items-center gap-1 h-[2rem] justify-between">
            <div class="flex items-center gap-1">
                <div class="w-[1.2rem] h-[1.2rem] rounded-sm p-[2px]">
                    <img src="images/menu/icons8-page-16.png" class="w-full h-full object-contain" alt="page icon">
                </div>
                <div>Page 2</div>
            </div>
            <div class="flex items-center gap-1">
                <div class="w-[1.2rem] h-[1.2rem] hover:bg-gray-300 rounded-sm p-[2px] cursor-pointer hidden"> 
                    <img src="images/menu/icons8-more-16.png" class="page-container-more-icon w-full h-full object-contain" alt="more icon">
                    <div class="page-container-more-icon-menu  hidden relative right-[100%] top-[0%] h-auto p-2 w-[10rem] rounded bg-white border border-black box-shadow-normal ">
                        <div class="flex items-start gap-1 hover:bg-gray-200 rounded-sm p-1">
                            <img src="images/menu/rename.png" class="w-[1.2rem] h-[1.2rem]">
                            <div>Rename</div>
                        </div>
                        <div class="flex items-start gap-1 hover:bg-gray-200 rounded-sm p-1">
                            <img src="images/menu/icons8-trash-can-50.png" class="w-[1.2rem] h-[1.2rem]">
                            <div>Delete</div>
                        </div>
                        <div class="flex items-start gap-1 hover:bg-gray-200 rounded-sm p-1">
                            <img src="images/container-header/icons8-arrow-16.png" class="w-[1.2rem] h-[1.2rem]">
                            <div>Move To</div>
                        </div>
                        
                    </div>
                </div>
                <div class="w-[1.2rem] h-[1.2rem] hover:bg-gray-300 rounded-sm p-[2px] cursor-pointer hidden">
                    <img src="images/menu/icons8-add-16.png" class="w-full h-full object-contain" alt="add icon">
                </div>
            </div>
        </div>
    </div>
`
const pageContainer3HTML = ` 
    <div class="page-container w-full h-[2rem] flex flex-col pl-[2rem] hover:bg-gray-200 rounded pr-2 hidden">
        <div class="flex items-center gap-1 h-[2rem] justify-between">
            <div class="flex items-center gap-1">
                <div class="w-[1.2rem] h-[1.2rem] rounded-sm p-[2px]">
                    <img src="images/menu/icons8-page-16.png" class="w-full h-full object-contain" alt="page icon">
                </div>
                <div>Page 3</div>
            </div>
            <div class="flex items-center gap-1">
                <div class="w-[1.2rem] h-[1.2rem] hover:bg-gray-300 rounded-sm p-[2px] cursor-pointer hidden"> 
                    <img src="images/menu/icons8-more-16.png" class="page-container-more-icon w-full h-full object-contain" alt="more icon">
                    <div class="page-container-more-icon-menu  hidden relative right-[100%] top-[0%] h-auto p-2 w-[10rem] rounded bg-white border border-black box-shadow-normal ">
                        <div class="flex items-start gap-1 hover:bg-gray-200 rounded-sm p-1">
                            <img src="images/menu/rename.png" class="w-[1.2rem] h-[1.2rem]">
                            <div>Rename</div>
                        </div>
                        <div class="flex items-start gap-1 hover:bg-gray-200 rounded-sm p-1">
                            <img src="images/menu/icons8-trash-can-50.png" class="w-[1.2rem] h-[1.2rem]">
                            <div>Delete</div>
                        </div>
                        <div class="flex items-start gap-1 hover:bg-gray-200 rounded-sm p-1">
                            <img src="images/container-header/icons8-arrow-16.png" class="w-[1.2rem] h-[1.2rem]">
                            <div>Move To</div>
                        </div>
                    </div>
                </div>
                <div class="w-[1.2rem] h-[1.2rem] hover:bg-gray-300 rounded-sm p-[2px] cursor-pointer hidden">
                    <img src="images/menu/icons8-add-16.png" class="w-full h-full object-contain" alt="add icon">
                </div>
            </div>
        </div>
    </div>
`



// SECTION: Page
function addPage(parentPageId = null) {
    console.log(1);
    savePage();

    let location = "";
    let title = "New Page";

    // CASE 1: Adding a root-level page
    if (!parentPageId) {
        location = title + "/";
    } 
    // CASE 2: Adding a child page
    else {
        const parentPage = pages.find(p => p.pageId === parentPageId);
        if (!parentPage) return;

        location = parentPage.location + title + "/";
    }

    const newPage = {
        pageId: crypto.randomUUID(),
        icon: "",
        title,
        location,
        content: defaultNotesPageContent
    };

    pages.push(newPage);
    currentPageId = newPage.pageId;

    savePagesToLocalStorage();
    renderPagesSidebar(newPage.pageId);
    pageToggles();
    renderPage(newPage.pageId);
}



function renderPage(pageId) {
    const page = pages.find(p => p.pageId === pageId);
    if (!page) return;

    currentPageId = pageId;

    const notesContainer = document.querySelector("#notes-container");

    // Clear container safely
    notesContainer.replaceChildren();

    // Page shell (layout only)
    const pageShellHTML = `
        <div class="w-full h-[45px] flex items-center p-1">
            <div class="flex items-center gap-2 w-[50%] h-full">
                <div>
                    <img src="images/container-header/collapse.png" alt="sidebar icon" class="collapse-icon w-[1.5rem] h-[1.5rem] rounded p-[2px] hover:bg-gray-200 cursor-pointer">
                </div>
                <div class="flex items-center">
                    <span class="hover:bg-gray-200 cursor-pointer rounded px-2">Page 1</span>
                    <span class="text-gray-500">/</span>
                    <span class="hover:bg-gray-200 cursor-pointer rounded px-2">Page 2</span>
                    <span class="text-gray-500">/</span>
                    <span class="hover:bg-gray-200 cursor-pointer rounded px-2">Page 3</span>
                </div>
            </div>
            <div class="flex items-center gap-2 w-[50%] h-full justify-end">
                <div class="more-icon-container relative">
                    <img src="images/container-header/icons8-more-16.png" alt="more icon" class="page-more-icon w-[1.5rem] h-[1.5rem] rounded p-[2px] hover:bg-gray-200 cursor-pointer">
                    <div class="page-more-icon-menu flex flex-col border-black-[1px] rounded-[4px] absolute right-0 min-w-[10rem] bg-white border border-black box-shadow-normal p-2 hidden">
                        <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-200 h-[2rem] rounded-sm p-2">
                            <img src="images/container-header/icons8-arrow-16.png" class="w-[1.2rem] h-[1.2rem]">
                            <div>Move To</div>
                        </div>
                        <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-200 h-[2rem] rounded-sm p-2">
                            <img src="images/container-header/icons8-trash-can-50.png" class="w-[1.2rem] h-[1.2rem]">
                            <div>Delete</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="w-full h-[calc(100%-45px)] p-6 overflow-y-auto">
            <div>
                <div class="flex items-center gap-2">
                    <div class="page-icon folder-icon hover:bg-gray-200 cursor-pointer rounded px-2">😀 Add Icon</div>
                </div>
                <div  class="page-title font-bold text-5xl bg-blue-500 px-2 outline-none" contenteditable="true">Page 3</div>
            </div>
            <div class="content-container h-[calc(100%-60px)] outline-none bg-blue-300 p-4">
                <div class=" space-y-2 p-2 bg-white">
                    <div class="line first-line flex items-start h-auto relative gap-2 line-hover-zone">
                        <div class="icons flex gap-1 pt-1 absolute left-[-3rem] absolute">
                            <img src="images/main/icons8-add-16.png" class="w-[1.2rem] h-[1.2rem] rounded-sm p-[2px] cursor-pointer hover:bg-gray-200 hidden " alt="add block icon"/>
                            <div class="w-[10rem] rounded cursor-pointer absolute top-full left-0 bg-white z-[100] h-auto p-2 border border-black box-shadow-normal hidden">
                                <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                                    <img src="images/main/icons8-text-16.png" class="w-[1.2rem] h-[1.2rem]">
                                    <div class="block-type">Text</div>
                                </div>
                                <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                                    <img src="images/main/icons8-1-16.png" class="w-[1.2rem] h-[1.2rem]">
                                    <div class="block-type">Heading 1</div>
                                </div>
                                <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                                    <img src="images/main/icons8-2-16.png" class="w-[1.2rem] h-[1.2rem]">
                                    <div class="block-type">Heading 2</div>
                                </div>
                                <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                                    <img src="images/main/icons8-3-16.png" class="w-[1.2rem] h-[1.2rem]">
                                    <div class="block-type">Heading 3</div>
                                </div>
                            </div>
                            <img src="images/main/icons8-menu-16 (1).png" class="line-block-menu-icon w-[1.2rem] h-[1.2rem] rounded-sm p-[2px] cursor-pointer hover:bg-gray-200 hidden " alt="move block icon"/>
                            <div class="line-block-menu hidden w-[10rem] rounded absolute top-full left-0 bg-white z-[100] h-auto p-2 border border-black box-shadow-normal">
                                <div class="flex w-full  cursor-pointer  rounded-sm p-1 flex-col">
                                    <div class="text-xs font-bold text-gray-500 rounded-sm p-1">Text</div>
                                    <div class="flex items-center gap-1 hover:bg-gray-200 cursor-pointer rounded-sm p-1">
                                        <img src="images/main/turn-into.png" class="w-[1.2rem] h-[1.2rem]">
                                        <div>Turn into</div>
                                    </div>
                                    <div class="flex items-center gap-1 hover:bg-gray-200 cursor-pointer rounded-sm p-1">
                                        <img src="images/main/paint-roller.png" class="w-[1.2rem] h-[1.2rem]">
                                        <div>Color</div>
                                    </div>
                                    <hr class="w-full my-2">
                                    <div class="flex items-center gap-1 hover:bg-gray-200 cursor-pointer rounded-sm p-1">
                                        <img src="images/container-header/icons8-arrow-16.png" class="w-[1.2rem] h-[1.2rem]">
                                        <div>Move to</div>
                                    </div>
                                    <div class="flex items-center gap-1 hover:bg-gray-200 cursor-pointer rounded-sm p-1">
                                        <img src="images/container-header/icons8-trash-can-50.png" class="w-[1.2rem] h-[1.2rem]">
                                        <div>Delete</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="content w-full outline-none" contenteditable="true"></div>
                        <div class="content-menu top-full w-[10rem] outline-none flex flex-col items-center p-2 absolute bg-white z-[100] hidden border border-black box-shadow-normal rounded">
                            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                                <img src="images/main/icons8-text-16.png" class="w-[1.2rem] h-[1.2rem]">
                                <div class="block-type">Text</div>
                            </div>
                            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                                <img src="images/main/icons8-1-16.png" class="w-[1.2rem] h-[1.2rem]">
                                <div class="block-type">Heading 1</div>
                            </div>
                            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                                <img src="images/main/icons8-2-16.png" class="w-[1.2rem] h-[1.2rem]">
                                <div class="block-type">Heading 2</div>
                            </div>
                            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                                <img src="images/main/icons8-3-16.png" class="w-[1.2rem] h-[1.2rem]">
                                <div class="block-type">Heading 3</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    notesContainer.insertAdjacentHTML("beforeend", pageShellHTML);

    // Re-bind listeners AFTER DOM insertion
    listenToTitleChanges();
    listenToContentChanges();
    listenToIconChanges();
}

function renderPagesSidebar(pageId) {
    const pagesContainer = document.querySelector(".pages-container");
    const page = pages.find(p => p.pageId === pageId);
    if (!page) return;

    const locationNumber = countTitles(page.location);
    const leftPadding = locationNumberToPadding(locationNumber);

    const isRoot = countTitles(page.location) === 1;
    const hiddenClass = isRoot ? "" : "hidden";
    
    
    const pageContainerHTML = `
        <div class="page-container w-full h-[2rem] flex flex-col pl-[${leftPadding}px] hover:bg-gray-200 rounded pr-2 ${hiddenClass}" data-page-id="${page.pageId}">
            <div class="flex items-center gap-1 h-[2rem] justify-between">
                <div class="flex items-center gap-1">
                    <div class="w-[1.2rem] h-[1.2rem] rounded-sm p-[2px]">
                        <div class="w-full h-full object-contain">${page.icon}</div>
                    </div>
                    <div>${page.title}</div>
                </div>
                <div class="flex items-center gap-1">
                    <div class="w-[1.2rem] h-[1.2rem] hover:bg-gray-300 rounded-sm cursor-pointer p-[2px] hidden"> 
                        <img src="images/menu/icons8-more-16.png" class="page-container-more-icon  w-full h-full object-contain" alt="more icon">
                        <div class="page-container-more-icon-menu  hidden relative right-[100%] top-[0%] h-auto p-2 w-[10rem] rounded bg-white border border-black box-shadow-normal ">
                            <div class="flex items-start gap-1 hover:bg-gray-200 rounded-sm p-1">
                                <img src="images/menu/rename.png" class="w-[1.2rem] h-[1.2rem]">
                                <div>Rename</div>
                            </div>
                            <div class="flex items-start gap-1 hover:bg-gray-200 rounded-sm p-1">
                                <img src="images/menu/icons8-trash-can-50.png" class="w-[1.2rem] h-[1.2rem]">
                                <div>Delete</div>
                            </div>
                            <div class="flex items-start gap-1 hover:bg-gray-200 rounded-sm p-1">
                                <img src="images/container-header/icons8-arrow-16.png" class="w-[1.2rem] h-[1.2rem]">
                                <div>Move To</div>
                            </div>
                            
                        </div>
                    </div>
                    <div class="w-[1.2rem] h-[1.2rem] hover:bg-gray-300 rounded-sm cursor-pointer p-[2px] hidden">
                        <img src="images/menu/icons8-add-16.png" class="w-full h-full object-contain" alt="add icon">
                    </div>
                </div>
            </div>
        </div>
    `

    pagesContainer.innerHTML += pageContainerHTML;
}


function deletePage() {
    
}


function movePage() {}






// SECTION: Listen
function listenToTitleChanges() {
    const pageTitle = document.querySelector(".page-title");
    pageTitle.addEventListener("input", () => {
        savePage();
    });
}

function listenToContentChanges() {
    const contentContainer = document.querySelector(".content-container");
    contentContainer.addEventListener("input", () => {
        savePage();
    });
}

function listenToIconChanges() {
    const pageIcon = document.querySelector(".page-icon");
    pageIcon.addEventListener("input", () => {
        savePage();
    });
}


// SECTION: Save
function savePage() {
    if (!currentPageId) return;

    const page = pages.find(p => p.pageId === currentPageId);
    if (!page) return;

    page.title = document.querySelector(".page-title")?.innerText || "";
    page.content = document.querySelector(".content-container")?.innerHTML || "";
    page.icon = document.querySelector(".page-icon")?.innerText || "";
    

    savePagesToLocalStorage();
}

function savePagesToLocalStorage() {
    localStorage.setItem("pages", JSON.stringify(pages));
}




// SECTION: Formatters
function locationNumberToPadding(level) {
    return (level - 1) * 16;
}


function countTitles(path) {
    return path
        .split("/")
        .filter(title => title.trim() !== "")
        .length;
}

function renderBreadcrumbs(location) {
    const parts = location.split("/").filter(Boolean);

    return parts
        .map(
            (part, i) => `
            <span class="hover:bg-gray-200 cursor-pointer rounded px-2">
                ${part}
            </span>
            ${i < parts.length - 1 ? `<span class="text-gray-500">/</span>` : ""}
        `
        )
        .join("");
}



 









