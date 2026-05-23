document.addEventListener("DOMContentLoaded", () => {
    contentEditor();
    lineHoverBehavior();
    PlaceholderHandlers();
    enableClickToAddNewLine();
    handleContentMenu(); // safe now, works for all current + future lines
});

let suppressPlaceholder = false;


document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const active = document.activeElement;

        // If cursor is inside page title
        if (active.classList.contains("page-title")) {
            e.preventDefault(); // stop new line in title

            // Grab the first .content inside .line
            const target = document.querySelector(".first-line .content");
            if (!target) {
                // make a new line 
                const newLine = insertNewLineAfter(document.querySelector(".first-line"));
                const newContent = newLine.querySelector(".content");
                updatePlaceholder(newContent);
                newContent.focus();
            };

            target.focus();

            // Place cursor at start
            const range = document.createRange();
            const sel = window.getSelection();
            range.setStart(target, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);

            updatePlaceholder(target);

        }
    }
});

// add-icon click handler — stop propagation so global click handlers don't race
document.addEventListener("click", (e) => {
    const targetElement = e.target;
    if (targetElement && targetElement.alt === "add block icon") {
        // prevent default click behavior and stop other click handlers from interfering
        e.preventDefault();
        e.stopPropagation();

        const currentLine = targetElement.closest(".line");
        if (currentLine) addIconInsertBlockNextLine(currentLine);
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;

    const content = document.activeElement;
    const line = content?.closest(".line");
    if (!line || !line.dataset.listType) return;

    // only allow indenting/unindenting on empty or placeholder lines
    if (!isOnlyPlaceholder(content) && content.textContent.trim() !== "") return;

    e.preventDefault();

    const currentIndent = getIndent(line);

    if (e.shiftKey) {
        // ⬅️ SHIFT + TAB → unindent
        if (currentIndent > 0) {
            setIndent(line, currentIndent - 1);
            rerenderFollowingList(line);
        }
    } else {
        // ➡️ TAB → indent (STRICT RULES)
        const isEmpty = isOnlyPlaceholder(content) || content.textContent.trim() === "";

        // ❌ Block repeated indenting on empty items
        if (isEmpty) {
            // Allow indent ONLY if there is a filled sibling before it
            if (!hasPreviousFilledSibling(line)) return;

            // Allow only ONE level deeper from current
            setIndent(line, currentIndent + 1);
            rerenderFollowingList(line);
            return;
        }

        // ❌ Non-empty items cannot be indented
        return;
    }

});


document.addEventListener("focusin", (e) => {
  const content = e.target;
  if (!content.classList.contains("content")) return;

  if (isOnlyPlaceholder(content)) {
    content.textContent = "";
    content.classList.remove("text-gray-400", "italic");
    delete content.dataset.placeholder;
  }
});




function contentEditor() {
    const container = document.querySelector(".content-container");
    if (!container) return;

    container.addEventListener("keydown", (e) => {
        const content = document.activeElement;
        const line = content.closest(".line");

        const isHeading = content.classList.contains("text-xl") ||
                         content.classList.contains("text-2xl") ||
                         content.classList.contains("text-3xl");

        // Enhancement: Remove placeholder text for headers when typing begins
        if (
            !e.ctrlKey &&
            !e.metaKey &&
            e.key.length === 1 &&
            content.dataset.placeholder
        ) {
            const placeholder = content.dataset.placeholder;

            if (content.textContent.trim() === placeholder) {
                e.preventDefault(); // 🔴 CRITICAL
                clearPlaceholder(content);

                // insert the typed character manually
                document.execCommand("insertText", false, e.key);
            }
        }

        if (e.key === "Enter" && line.dataset.listType) {
            const content = line.querySelector(".content");
            const isEmpty =
                isOnlyPlaceholder(content) || content.textContent.trim() === "";

            // 🟢 ENTER on empty / placeholder list item
            if (isEmpty) {
                e.preventDefault();

                const indent = getIndent(line);

                // 🔹 CASE 1: CHILD LIST ITEM → behave like Shift + Tab
                if (indent > 0) {
                    setIndent(line, indent - 1);
                    rerenderFollowingList(line);
                    content.focus();
                    return;
                }

                // 🔹 CASE 2: PARENT LIST ITEM → convert to text block
                convertListLineToText(line);
                updatePlaceholder(content);
                content.focus();
                return;
            }


            // 🟢 ENTER on non-empty list item → new sibling
            e.preventDefault();

            const newLine = insertNewLineAfter(line);
            newLine.dataset.listType = line.dataset.listType;
            newLine.dataset.indent = line.dataset.indent;

            renderListMarker(newLine);
            rerenderFollowingList(newLine);

            newLine.querySelector(".content").focus();
            return;
        }


        if (e.key === "Backspace" && line.dataset.listType) {
            const content = line.querySelector(".content");

            if (isOnlyPlaceholder(content) || content.textContent.trim() === "") {
                e.preventDefault();

                fullyExitList(line);

                updatePlaceholder(content);
                content.focus();

                // 🔴 VERY IMPORTANT: stop here
                return;
            }
        }






        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();

            if (isHeading && content.textContent.trim() === "") {
                // 🧠 If user just presses Enter on an empty heading, create new line instead of deleting
                const newLine = insertNewLineAfter(line);
                const newContent = newLine.querySelector(".content");
                updatePlaceholder(newContent);
                
                return; // ✅ don’t delete the heading
            }


            // Save the current content
            const currentText = content.textContent.trim();

            // Create new line with placeholder
            const newLine = insertNewLineAfter(line);
            const newContent = newLine.querySelector(".content");

            // Update the current line's content (remove any placeholder)
            if (currentText === "" ||
                currentText === "Type here..." ||
                currentText === "Heading 1" ||
                currentText === "Heading 2" ||
                currentText === "Heading 3") {
                content.textContent = "";
            }

            

            // Focus the new line
            newContent.focus();
        }

        if (e.key === "Backspace") {
            const text = content.textContent.trim();
            const isPlaceholder = isOnlyPlaceholder(content);

            if (text === "" || isPlaceholder) {
                e.preventDefault();

                const prevLine = line.previousElementSibling;
                if (!prevLine) return;

                const currentContent = line.querySelector(".content");
                const prevContent = prevLine.querySelector(".content");

                // Remove current line
                line.remove();

                // Focus previous line
                prevContent.focus();

                // If previous line is empty, restore correct placeholder
                if (prevContent.textContent.trim() === "") {
                    updatePlaceholder(prevContent);
                } else {
                    clearPlaceholder(prevContent);
                }

                // Place the cursor correctly in the previous line
                const range = document.createRange();
                const sel = window.getSelection();

                const text = prevContent.textContent.trim();
                const isPlaceholderText =
                    text === "" ||
                    text === "Type here..." ||
                    text === "Heading 1" ||
                    text === "Heading 2" ||
                    text === "Heading 3";

                range.selectNodeContents(prevContent);

                // Start for empty / placeholder lines, end otherwise
                range.collapse(isPlaceholderText);

                sel.removeAllRanges();
                sel.addRange(range);

                prevContent.focus();

            }
        }

        enforceHeadingPlaceholders()

    });
}


function insertNewLineAfter(currentLine) {
    const newLine = line();
    const currentContent = currentLine.querySelector(".content");

    // Remove placeholder from current line if it's empty
    if (["Type here...", "Heading 1", "Heading 2", "Heading 3"].includes(currentContent.textContent.trim())) {
        currentContent.textContent = "";
    }


    // Copy heading class if current line is a heading
    const newContent = newLine.querySelector(".content");



    // Hide all other icons
    document.querySelectorAll(".line .icons img").forEach(img => img.classList.add("hidden"));

    // Insert and show icons on new line
    currentLine.insertAdjacentElement("afterend", newLine);
    

    // Focus new line
    newContent.focus();
    // Always update placeholder for new line (for headings, show correct heading placeholder)
    updatePlaceholder(newContent);
    return newLine;
}

// 🔹 Turn current line into a text block
function transformToTextBlock(currentLine) {
    const content = currentLine.querySelector(".content");
    if (!content) return;

    // Remove heading styles if present
    content.classList.remove("text-3xl", "text-2xl", "text-xl", "font-bold");

    // Reset to normal text
    content.classList.add("w-full", "outline-none");

    // Reset placeholder to default text
    updatePlaceholder(content);

    // Focus back
    content.focus();

    return currentLine; // ✅ no new element added
}


// 🔹 Turn current line into a heading block
function transformToHeadingBlock(currentLine, headingSize) {
    const content = currentLine.querySelector(".content");
    if (!content) return;

    // Remove existing heading styles
    content.classList.remove("text-3xl", "text-2xl", "text-xl", "font-bold");

    // Apply new heading size
    if (headingSize === 1) {
        content.classList.add("text-3xl", "font-bold");
    } else if (headingSize === 2) {
        content.classList.add("text-2xl", "font-bold");
    } else if (headingSize === 3) {
        content.classList.add("text-xl", "font-bold");
    }

    // Clear current text if it's a placeholder
    if (["Type here...", "Heading 1", "Heading 2", "Heading 3"].includes(content.textContent.trim())) {
        content.textContent = "";
    }

    // Update placeholder to new heading type
    updatePlaceholder(content);

    // Focus back on current line
    content.focus();

    return currentLine; // ✅ no new element added
}

function deleteCurrentLine(currentLine) {
    const prevLine = currentLine.previousElementSibling;
    currentLine.remove();

    // Hide all icons globally
    document.querySelectorAll(".line .icons img").forEach(img => img.classList.add("hidden"));

    if (!prevLine) return;

    const prevContent = prevLine.querySelector(".content");

    setTimeout(() => {
        // Update placeholder if needed
        if (prevContent.textContent.trim() === "" || isOnlyPlaceholder(prevContent)) {
            updatePlaceholder(prevContent);
        }

        // Show icons for this line
        prevLine.querySelectorAll(".icons img").forEach(icon => icon.classList.remove("hidden"));

        // Focus and move cursor to END of text
        prevContent.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(prevContent);
        range.collapse(false); // false = end
        sel.removeAllRanges();
        sel.addRange(range);
    }, 0);
}





function lineHoverBehavior() {
    const contentContainer = document.querySelector(".content-container");
    if (!contentContainer) return;

    contentContainer.addEventListener("mouseover", (e) => {
        const line = e.target.closest(".line");
        const content = e.target.closest(".content");
        if (content && !line.classList.contains("prevent-hover-icons")) {
            line.querySelectorAll("img[alt='move block icon'], img[alt='add block icon']")
                .forEach(icon => icon.classList.remove("hidden"));
        }
    });

    contentContainer.addEventListener("mouseout", (e) => {
        const line = e.target.closest(".line");
        const content = e.target.closest(".content");
        if (content && !line.contains(e.relatedTarget)) {
            line.querySelectorAll("img[alt='move block icon'], img[alt='add block icon']")
                .forEach(icon => icon.classList.add("hidden"));
        }
    });
}


function PlaceholderHandlers() {
    // Handle input event - when user types in a field
    document.addEventListener("input", (e) => {
        const content = e.target;
        if (!content.classList.contains("content")) return;

        const isHeading =
            content.classList.contains("text-3xl") ||
            content.classList.contains("text-2xl") ||
            content.classList.contains("text-xl");

        const text = content.textContent.trim();

        // If heading becomes empty → restore heading placeholder
        if (isHeading && text === "") {
            updatePlaceholder(content);
            return;
        }

        // If user typed real content → remove placeholder
        if (content.dataset.placeholder && text !== content.dataset.placeholder) {
            content.classList.remove("text-gray-400", "italic");
            delete content.dataset.placeholder;
        }

        enforceHeadingPlaceholders();
    });


    document.addEventListener("focusin", (e) => {
        const content = e.target;
        if (!content.classList.contains("content")) return;

        const text = content.textContent.trim();
        const isHeading =
            content.classList.contains("text-3xl") ||
            content.classList.contains("text-2xl") ||
            content.classList.contains("text-xl");

        const placeholderText = content.dataset.placeholder;

        // 🧠 For normal text blocks, remove placeholder immediately when focused
        if (!isHeading) {
            if (["Type here..."].includes(text)) {
                content.textContent = "";
                content.classList.remove("text-gray-400", "italic");
                delete content.dataset.placeholder;
            }
            return;
        }

        // 🧩 For headings: keep placeholder visible until user types something
        if (isHeading && (text === "" || text === placeholderText)) {
            content.textContent = placeholderText;
            content.classList.add("text-gray-400", "italic");
            content.dataset.placeholder = placeholderText;
        }
    });


    document.addEventListener("focusout", (e) => {
        if (suppressPlaceholder) return;

        const content = e.target;
        if (!content.classList.contains("content")) return;

        const isHeading =
            content.classList.contains("text-3xl") ||
            content.classList.contains("text-2xl") ||
            content.classList.contains("text-xl");

        const text = content.textContent.trim();

        // 🧩 If empty heading, always keep its placeholder visible
        if (isHeading && text === "") {
            updatePlaceholder(content);
            return;
        }

        // 🧩 For normal text lines: handle normally
        if (text === "") {
            updatePlaceholder(content);
        } else {
            clearPlaceholder(content);
        }

        enforceHeadingPlaceholders()
    });


}

function updatePlaceholder(content) {
  const text = content.textContent.trim();
  const line = content.closest(".line");

  const isHeading =
    content.classList.contains("text-3xl") ||
    content.classList.contains("text-2xl") ||
    content.classList.contains("text-xl");

  let placeholderText = "Type here...";
  if (content.classList.contains("text-3xl")) placeholderText = "Heading 1";
  if (content.classList.contains("text-2xl")) placeholderText = "Heading 2";
  if (content.classList.contains("text-xl")) placeholderText = "Heading 3";

  // ✅ LIST ITEMS: behave exactly like text blocks
  if (line?.dataset.listType && text !== "") {
    clearPlaceholder(content);
    return;
  }

  if (text !== "" && !isOnlyPlaceholder(content)) {
    clearPlaceholder(content);
    return;
  }

  content.textContent = placeholderText;
  content.dataset.placeholder = placeholderText;
  content.classList.add("text-gray-400", "italic");
}


function clearAllPlaceholders() {
    const lines = document.querySelectorAll(".line");
    lines.forEach(line => {
        const content = line.querySelector(".content");
        clearPlaceholder(content);
    });
}

function enableClickToAddNewLine() {
    const container = document.querySelector(".content-container");
    if (!container) return;

    container.addEventListener("click", (e) => {
        const clickedLine = e.target.closest(".line");
        if (!clickedLine) return;

        const clickedContent = clickedLine.querySelector(".content");
        if (!clickedContent) return;

        const isClickedEmpty =
            clickedContent.textContent.trim() === "" ||
            ["Type here...", "Heading 1", "Heading 2", "Heading 3"].includes(clickedContent.textContent.trim());

        if (isClickedEmpty) {
            // Remove placeholder from all other empty lines
            document.querySelectorAll(".line .content").forEach((content) => {
                if (content !== clickedContent) {
                    const isEmpty =
                        content.textContent.trim() === "" ||
                        ["Type here...", "Heading 1", "Heading 2", "Heading 3"].includes(content.textContent.trim());
                    if (isEmpty) {
                        const isHeading =
                            content.classList.contains("text-3xl") ||
                            content.classList.contains("text-2xl") ||
                            content.classList.contains("text-xl");

                        if (!isHeading) {
                            clearPlaceholder(content);
                        }
                    }
                }
            });

            // Ensure clicked line has the correct placeholder
            updatePlaceholder(clickedContent);

            // Focus the clicked content
            clickedContent.focus();
        }
    });
}


function isOnlyPlaceholder(content) {
    return (
        content.dataset.placeholder &&
        content.textContent.trim() === content.dataset.placeholder
    );
}

function handleContentMenu() {
    // Single document-level delegation

    // 1️⃣ Detect "/" key to show menu
    document.addEventListener("keydown", (e) => {
        if (e.key !== "/") return;

        const line = e.target.closest(".line");
        if (!line) return;

        const content = line.querySelector(".content");
        const menu = line.querySelector(".content-menu");
        if (!menu) return;

        if (!canOpenSlashMenu(content)) return;

        showContentMenu(menu);
    });

    document.addEventListener("keydown", (e) => {
        if (e.key !== "Backspace") return;

        const content = document.activeElement;
        if (!content?.classList.contains("content")) return;

        const line = content.closest(".line");
        if (!line) return;

        const menu = line.querySelector(".content-menu");
        if (!menu || menu.classList.contains("hidden")) return;

        // If user deletes "/" before selecting anything → close menu
        const text = content.textContent;
        if (!text.includes("/")) {
            hideContentMenu(menu);
        }
    });

    document.addEventListener("input", (e) => {
        const content = e.target;
        if (!content?.classList.contains("content")) return;

        const line = content.closest(".line");
        if (!line) return;

        const menu = line.querySelector(".content-menu");
        if (!menu || menu.classList.contains("hidden")) return;

        // If slash no longer exists and nothing selected → close menu
        if (!content.textContent.includes("/")) {
            hideContentMenu(menu);
        }
    });





    // 2️⃣ Handle clicks on menu items
    document.addEventListener("click", (e) => {
        const menuItem = e.target.closest(".content-menu div");
        if (!menuItem) return;

        e.stopPropagation();

        const menu = menuItem.closest(".content-menu");
        const blockType = menuItem.textContent.trim();
        const currentLine = menu.closest(".line");

        delete currentLine.dataset.openedByAdd;

        hideContentMenu(menu);

        // 🔴 KEY LOGIC: if current line is a list → insert below
        let targetLine = currentLine;

        // always remove "/" from the current line
        const currentContent = currentLine.querySelector(".content");
        if (currentContent) {
            currentContent.textContent = "";
        }

        if (currentLine.dataset.listType) {
            targetLine = insertNewLineAfter(currentLine);
        }


        // 🟢 Apply transformation to the TARGET line
        if (blockType === "Text") {
            transformToTextBlock(targetLine);
        } else if (blockType === "Heading 1") {
            transformToHeadingBlock(targetLine, 1);
        } else if (blockType === "Heading 2") {
            transformToHeadingBlock(targetLine, 2);
        } else if (blockType === "Heading 3") {
            transformToHeadingBlock(targetLine, 3);
        } else if (blockType === "Bulleted List") {
            makeListLine(targetLine, "bullet");
        } else if (blockType === "Numbered List") {
            makeListLine(targetLine, "number");
        }

        // focus the new / transformed block
        targetLine.querySelector(".content").focus();
    });

    // 3️⃣ Hide menus when clicking outside
    document.addEventListener("click", (e) => {
        document.querySelectorAll(".content-menu").forEach(menu => {
            if (!menu.contains(e.target)) hideContentMenu(menu);
        });
    });
}


function showContentMenu(menu) {
    menu.classList.remove("hidden");
}

function hideContentMenu(menu) {
    menu.classList.add("hidden");
}

function line() {
    const newLine = document.createElement("div");
    newLine.className = "line flex items-start h-auto relative gap-2 line-hover-zone";
    newLine.innerHTML = `
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
        <div class="content-menu top-full w-[15rem] outline-none flex flex-col items-center p-2 absolute bg-white z-[100] hidden border border-black box-shadow-normal rounded">
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
            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                <img src="images/main/icons8-list-16.png" class="w-[1.2rem] h-[1.2rem]">
                <div class="block-type">Bulleted List</div>
            </div>
            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-l p-1 ">
                <img src="images/main/icons8-numbered-list-16.png" class="w-[1.2rem] h-[1.2rem]">
                <div class="block-type">Numbered List</div>
            </div>

        </div>
    `;

    return newLine;
}

function heading(size) {
    let headingTextXl = "";
    if (size === 1) {
        headingTextXl = "text-3xl"
    } else if (size === 2) {
        headingTextXl = "text-2xl"
    } else if (size === 3) {
        headingTextXl = "text-xl"
    }
    const newHeadingLine = document.createElement("div");
    newHeadingLine.className = "line line-hover-zone h-auto relative gap-2 line-hover-zone";
    newHeadingLine.innerHTML = `
        <div class="icons flex gap-1 pt-1 absolute left-[-3rem]">
            <img src="images/main/icons8-add-16.png" class="w-[1.2rem] h-[1.2rem] rounded-sm p-[2px] cursor-pointer hover:bg-gray-200 hidden " alt="add block icon"/>
            <img src="images/main/icons8-menu-16 (1).png" class="w-[1.2rem] h-[1.2rem] rounded-sm p-[2px] cursor-pointer hover:bg-gray-200 hidden " alt="move block icon"/>
        </div>
        <div class="content w-full ${headingTextXl} font-bold outline-none" contenteditable="true"></div>
        <div class="content-menu top-full w-[10rem] outline-none flex flex-col items-center p-2 absolute bg-white z-[100] hidden border border-black box-shadow-normal rounded" contenteditable="true">
            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-sm p-1 ">
                <img src="images/main/icons8-text-16.png" class="w-[1.2rem] h-[1.2rem]">
                <div>Text</div>
            </div>
            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-sm p-1 ">
                <img src="images/main/icons8-1-16.png" class="w-[1.2rem] h-[1.2rem]">
                <div>Heading 1</div>
            </div>
            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-sm p-1 ">
                <img src="images/main/icons8-2-16.png" class="w-[1.2rem] h-[1.2rem]">
                <div>Heading 2</div>
            </div>
            <div class="flex w-full gap-2 items-center cursor-pointer hover:bg-gray-200 rounded-sm p-1 ">
                <img src="images/main/icons8-3-16.png" class="w-[1.2rem] h-[1.2rem]">
                <div>Heading 3</div>
            </div>
        </div>
    `;
    return newHeadingLine;
}

function addIconInsertBlockNextLine(currentLine) {
    const currentContent = currentLine.querySelector(".content");

    // prevent placeholder from reappearing during this operation
    suppressPlaceholder = true;
    setTimeout(() => suppressPlaceholder = false, 200);

    // if first-line is empty and its add icon is clicked, clear its placeholder
    if (currentLine.classList.contains("first-line")) {
        clearPlaceholder(currentContent);
        currentContent.textContent = "";
    }

    // Clear placeholder for any line
    if (currentContent) {
        clearPlaceholder(currentContent);
        currentContent.textContent = "";
    }

    // Create and insert new line
    const newLine = line();
    console.log(newLine);
    currentLine.parentNode.insertBefore(newLine, currentLine.nextSibling);
    const newContent = newLine.querySelector(".content");
    console.log(newContent);

    // Hide current line’s icons
    const currentAdd = currentLine.querySelector("[alt='add block icon']");
    const currentMove = currentLine.querySelector("[alt='move block icon']");
    if (currentAdd) currentAdd.classList.add("hidden");
    if (currentMove) currentMove.classList.add("hidden");

    

    // Prevent hover re-show
    currentContent.classList.add("prevent-hover-icons");
    setTimeout(() => {
        currentContent.classList.remove("prevent-hover-icons");
    }, 150);

    newLine.dataset.openedByAdd = "true";



    

    setTimeout(() => {
        newContent.focus();

        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(newContent, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        // OPEN MENU FIRST
        showContentMenu(newLine.querySelector(".content-menu"));

        // ONLY apply placeholder visually
        newContent.dataset.placeholder = "Type here...";
        newContent.classList.add("text-gray-400", "italic");
    }, 0);

}



// robust clearPlaceholder: removes placeholder text and dataset unconditionally if they match
function clearPlaceholder(contentEl) {
    if (!contentEl) return;
    const placeholder = contentEl.dataset.placeholder || "";
    if (placeholder && contentEl.textContent.trim() === placeholder) {
        contentEl.textContent = "";
        contentEl.classList.remove('text-gray-400', 'italic');
    }
    // make sure we remove the dataset even if content doesn't currently match exactly
    delete contentEl.dataset.placeholder;
}

function enforceHeadingPlaceholders() {
    document.querySelectorAll(".content").forEach(content => {
        const isHeading =
            content.classList.contains("text-3xl") ||
            content.classList.contains("text-2xl") ||
            content.classList.contains("text-xl");

        if (!isHeading) return;

        const text = content.textContent.trim();
        const placeholder = content.dataset.placeholder;

        // If heading is empty or lost its placeholder → restore it
        if (text === "") {
            updatePlaceholder(content);
        }

    });
}

function getRealText(el) {
    return Array.from(el.childNodes)
        .filter(n => !(n.classList && n.classList.contains("placeholder")))
        .map(n => n.textContent)
        .join("");
}


function canOpenSlashMenu(contentEl) {
  const line = contentEl.closest(".line");

  // ✅ allow menu if line was created by add icon
  if (line?.dataset.openedByAdd) return true;

  const sel = window.getSelection();
  if (!sel.rangeCount) return false;

  const range = sel.getRangeAt(0);
  const offset = range.startOffset;
  const text = getRealText(contentEl);

  const leftChar = text[offset - 2];
  if (leftChar && leftChar.trim() !== "") return false;

  return true;
}

function makeListLine(line, type) {
  line.dataset.listType = type; // "bullet" | "number"
  line.dataset.indent = "0";
  line.classList.add("list-line");
  renderListMarker(line);
}

function getIndent(line) {
  return parseInt(line.dataset.indent || "0", 10);
}

function setIndent(line, indent) {
  line.dataset.indent = Math.max(0, indent).toString();
  renderListMarker(line);
}



function renderListMarker(line) {
  let marker = line.querySelector(".list-marker");
  if (!marker) {
    marker = document.createElement("div");
    marker.className = "list-marker w-6 text-right select-none";
    line.insertBefore(marker, line.querySelector(".content"));
  }

  const indent = getIndent(line);
  const type = line.dataset.listType;

  marker.style.marginLeft = `${indent * 1.5}rem`;

  if (type === "bullet") {
    const bullets = ["●", "○", "■"];
    marker.textContent = bullets[indent % bullets.length];
  }

  if (type === "number") {
    marker.textContent = getNumberMarker(line);
  }
}

function getNumberMarker(line) {
  const indent = getIndent(line);
  let index = 1;

  let prev = line.previousElementSibling;

  while (prev) {
    if (prev.dataset.listType === "number") {
      const prevIndent = getIndent(prev);

      // same level → count
      if (prevIndent === indent) {
        index++;
      }

      // parent reached → stop
      if (prevIndent < indent) {
        break;
      }
    }
    prev = prev.previousElementSibling;
  }

  const cycle = indent % 3;

  // 0 → numeric
  if (cycle === 0) {
    return index + ".";
  }

  // 1 → alphabetic
  if (cycle === 1) {
    return String.fromCharCode(96 + index) + ".";
  }

  // 2 → roman numerals
  if (cycle === 2) {
    return toRoman(index) + ".";
  }
}




function toRoman(num) {
  const map = [
    ["m",1000],["cm",900],["d",500],["cd",400],
    ["c",100],["xc",90],["l",50],["xl",40],
    ["x",10],["ix",9],["v",5],["iv",4],["i",1]
  ];
  let res = "";
  for (const [r,n] of map) {
    while (num >= n) {
      res += r;
      num -= n;
    }
  }
  return res;
}

function rerenderFollowingList(line) {
  let next = line.nextElementSibling;
  while (
    next &&
    next.dataset.listType === line.dataset.listType &&
    getIndent(next) === getIndent(line)
  ) {
    renderListMarker(next);
    next = next.nextElementSibling;
  }
}

function fullyExitList(line) {
    delete line.dataset.listType;
    delete line.dataset.indent;
    line.classList.remove("list-line");

    const marker = line.querySelector(".list-marker");
    if (marker) marker.remove();

    // 🔴 reset any leftover spacing
    line.style.paddingLeft = "";
}

function convertListLineToText(line) {
    delete line.dataset.listType;
    delete line.dataset.indent;

    line.classList.remove("list-line");

    const marker = line.querySelector(".list-marker");
    if (marker) marker.remove();

    // 🔑 this is what actually removes the left space
    line.style.paddingLeft = "";
}

function hasPreviousFilledSibling(line) {
  let prev = line.previousElementSibling;
  const indent = getIndent(line);

  while (prev) {
    if (prev.dataset.listType !== line.dataset.listType) return false;

    if (getIndent(prev) === indent) {
      const content = prev.querySelector(".content");
      return content && content.textContent.trim() !== "";
    }

    if (getIndent(prev) < indent) return false;

    prev = prev.previousElementSibling;
  }

  return false;
}

