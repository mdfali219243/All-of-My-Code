// Get references to HTML elements by their IDs
const flashcardFields = document.getElementById('flashcard-fields');
const addFlashcardBtn = document.getElementById('add-flashcard');
const flashcardForm = document.getElementById('flashcard-form');
const setTitleInput = document.getElementById('set-title');
const recentFlashcards = document.getElementById('recent-flashcards');

// Function to make a new flashcard input row
function createFlashcardRow(question = '', answer = '') {
    const row = document.createElement('div'); // Make a new div for the row
    row.className = 'row g-2 mb-2 flashcard-row'; // Add CSS classes
    // Add HTML for question, answer, and remove button
    row.innerHTML = `
        <div class="col-12 col-md-5">
            <input type="text" class="form-control question-input" placeholder="Question" required maxlength="100" value="${question}">
        </div>
        <div class="col-12 col-md-5">
            <input type="text" class="form-control answer-input" placeholder="Answer" required maxlength="100" value="${answer}">
        </div>
        <div class="col-12 col-md-2 d-grid">
            <button type="button" class="btn btn-danger remove-flashcard" title="Remove">&times;</button>
        </div>
    `;
    // When remove button is clicked, remove this row (if more than one row left)
    row.querySelector('.remove-flashcard').onclick = () => {
        if (flashcardFields.children.length > 1) row.remove();
        updateRecentFlashcards(); // Update the recent flashcards list
    };
    // If user presses Enter in answer input, add a new flashcard row
    row.querySelector('.answer-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addFlashcardBtn.click();
        }
    });
    // Update recent flashcards when typing in question or answer
    row.querySelector('.question-input').addEventListener('input', updateRecentFlashcards);
    row.querySelector('.answer-input').addEventListener('input', updateRecentFlashcards);
    return row; // Return the new row
}

// When add button is clicked, add a new flashcard row
if (flashcardForm && flashcardFields && addFlashcardBtn && setTitleInput && recentFlashcards) {
addFlashcardBtn.onclick = () => {
    const lastRow = flashcardFields.lastElementChild; // Get the last row
    const q = lastRow.querySelector('.question-input').value.trim(); // Get question text
    const a = lastRow.querySelector('.answer-input').value.trim(); // Get answer text
    // If question or answer is empty, focus on question input and stop
    if (!q || !a) {
        lastRow.querySelector('.question-input').focus();
        return;
    }
    // Add a new empty flashcard row
    flashcardFields.appendChild(createFlashcardRow());
    // Focus on the new question input after a short delay
    setTimeout(() => {
        flashcardFields.lastElementChild.querySelector('.question-input').focus();
    }, 10);
    updateRecentFlashcards(); // Update the recent flashcards list
};

// When the form is submitted (user clicks save)
flashcardForm.onsubmit = function (e) {
    e.preventDefault(); // Stop the page from reloading
    const setTitle = setTitleInput.value.trim(); // Get the set title
    // If title is empty, focus on title input and stop
    if (!setTitle) {
        setTitleInput.focus();
        return;
    }
    const cards = []; // Make an array for the cards
    // For each flashcard row, get question and answer
    flashcardFields.querySelectorAll('.flashcard-row').forEach(row => {
        const q = row.querySelector('.question-input').value.trim();
        const a = row.querySelector('.answer-input').value.trim();
        if (q && a) cards.push({ question: q, answer: a }); // Add to cards if both filled
    });
    if (!cards.length) return; // If no cards, stop

    // Send the new set data to library.html via localStorage event
    localStorage.setItem('newFlashcardSet', JSON.stringify({ title: setTitle, cards }));

    // Optionally, you can redirect to library.html or trigger a custom event here
    // window.location.href = 'library.html';
    // Get existing sets from localStorage (or empty array)
    const sets = JSON.parse(localStorage.getItem('flashcardSets') || '[]');
    // Add the new set with an ID, title and cards
    const newId = 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    sets.push({ id: newId, title: setTitle, cards });
    // Save back to localStorage
    localStorage.setItem('flashcardSets', JSON.stringify(sets));

    // To show all the set titles in library.html, add this script to library.html:
    // (Rendering now handled by renderLibrary() in this file on Library page)
    setTitleInput.value = '';
    flashcardFields.innerHTML = '';
    flashcardFields.appendChild(createFlashcardRow());
    updateRecentFlashcards(); // Update the recent flashcards list
};

// Show the list of recently added flashcards below the form
function updateRecentFlashcards() {
    const cards = []; // Array for current cards
    // For each flashcard row, get question and answer
    flashcardFields.querySelectorAll('.flashcard-row').forEach(row => {
        const q = row.querySelector('.question-input').value.trim();
        const a = row.querySelector('.answer-input').value.trim();
        if (q && a) cards.push({ question: q, answer: a }); // Add if both filled
    });
    // If no cards, clear the recent flashcards area
    if (cards.length === 0) {
        recentFlashcards.innerHTML = '';
        return;
    }
    // Build HTML for the recent flashcards list
    let html = '<div class="card"><div class="card-body p-2"><strong>Recently Added Flashcards:</strong><ul class="list-group list-group-flush">';
    cards.forEach((card, idx) => {
        html += `<li class="list-group-item d-flex justify-content-between align-items-center">
            <span><b>Q:</b> ${card.question} <b>A:</b> ${card.answer}</span>
            <button type="button" class="btn btn-sm btn-outline-danger remove-recent" data-idx="${idx}">&times;</button>
        </li>`;
    });
    html += '</ul></div></div>';
    recentFlashcards.innerHTML = html; // Show the list

    // Add remove button logic for each recent card
    recentFlashcards.querySelectorAll('.remove-recent').forEach(btn => {
        btn.onclick = function () {
            const idx = parseInt(this.getAttribute('data-idx')); // Get index of card
            // Remove the matching flashcard row
            const rows = flashcardFields.querySelectorAll('.flashcard-row');
            if (rows[idx]) rows[idx].remove();
            updateRecentFlashcards(); // Update the list again
        };
    });
}

// moved below to be globally defined

// If there are no flashcard rows, add one empty row at the start
if (!flashcardFields.querySelector('.flashcard-row')) {
    flashcardFields.appendChild(createFlashcardRow());
}
updateRecentFlashcards(); // Show the recent flashcards at the start
}

// Sidebar: New Folder creation (Quizlet-like, persisted)
document.addEventListener('click', function (e) {
  const newFolderBtn = e.target.closest('.menu-btn');
  const isCreateClick = (newFolderBtn && newFolderBtn.querySelector('.js-createFolder')) || e.target.closest('.js-createFolder');
  if (!isCreateClick) return;
  e.preventDefault();
  const name = prompt('New folder name');
  if (!name) return;
  const folders = loadFolders();
  const id = 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  folders.push({ id, name: name.trim(), setIds: [] });
  saveFolders(folders);
  renderFoldersSidebar();
});

// Assign set to folder via dropdown in Library
document.addEventListener('change', function(e) {
  const select = e.target.closest('.js-add-to-folder');
  if (!select) return;
  const setId = select.getAttribute('data-setid');
  const folderId = select.value;
  if (!folderId) return;
  assignSetToFolder(setId, folderId);
  // Hide the select again and reset UI
  const actions = select.parentElement;
  const btn = actions ? actions.querySelector('.js-reveal-folderselect') : null;
  select.classList.add('d-none');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  select.value = '';
});

// Data helpers
function loadSets() {
  const sets = JSON.parse(localStorage.getItem('flashcardSets') || '[]');
  return Array.isArray(sets) ? sets : [];
}
function saveSets(sets) {
  localStorage.setItem('flashcardSets', JSON.stringify(sets));
}
function loadFolders() {
  const folders = JSON.parse(localStorage.getItem('flashcardFoldersV2') || '[]');
  return Array.isArray(folders) ? folders : [];
}
function saveFolders(folders) {
  localStorage.setItem('flashcardFoldersV2', JSON.stringify(folders));
}
function seedFoldersFromDOMIfEmpty() {
  let folders = loadFolders();
  if (folders.length) return folders;
  const list = document.querySelector('.folder-list');
  if (!list) return folders;
  const names = Array.from(list.querySelectorAll('.folder-div .folder-icon'))
    .map(span => (span.textContent || '').replace('📁', '').trim())
    .filter(Boolean);
  if (!names.length) return folders;
  folders = names.map(name => ({ id: 'f_' + Math.random().toString(36).slice(2,8), name, setIds: [] }));
  saveFolders(folders);
  return folders;
}
function ensureSetIds() {
  const sets = loadSets();
  let changed = false;
  sets.forEach(s => {
    if (!s.id) {
      s.id = 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
      changed = true;
    }
  });
  if (changed) saveSets(sets);
}
function assignSetToFolder(setId, folderId) {
  const folders = loadFolders();
  const target = folders.find(f => f.id === folderId);
  if (!target) return;
  // Enforce exclusivity: remove set from all folders first
  folders.forEach(f => {
    const idx = f.setIds.indexOf(setId);
    if (idx !== -1) f.setIds.splice(idx, 1);
  });
  // Add to selected folder
  if (!target.setIds.includes(setId)) target.setIds.push(setId);
  saveFolders(folders);
  renderFoldersSidebar();
  renderLibrary();
  renderFolderPage();
}

// Rendering
function renderFoldersSidebar() {
  const list = document.querySelector('.folder-list');
  const details = document.querySelector('.folder-container');
  if (!list || !details) return;
  ensureSetIds();
  const sets = loadSets();
  let folders = seedFoldersFromDOMIfEmpty();
  if (!folders.length) folders = loadFolders();
  list.innerHTML = '';
  folders.forEach(folder => {
    const div = document.createElement('div');
    div.className = 'folder-div';
    const link = document.createElement('a');
    const count = folder.setIds.filter(id => sets.find(s => s.id === id)).length;
    link.className = 'folder-icon';
    link.href = `folder.html?folder=${encodeURIComponent(folder.id)}`;
    link.textContent = `📁 ${folder.name} (${count})`;
    div.appendChild(link);
    // nested sets list
    if (count > 0) {
      const ul = document.createElement('ul');
      ul.style.margin = '6px 0 8px 24px';
      ul.style.padding = '0';
      folder.setIds.forEach(id => {
        const set = sets.find(s => s.id === id);
        if (!set) return;
        const li = document.createElement('li');
        li.style.listStyle = 'disc';
        li.style.marginLeft = '12px';
        const a = document.createElement('a');
        a.href = `flashcard-view.html?set=${encodeURIComponent(set.title)}`;
        a.textContent = set.title;
        li.appendChild(a);
        ul.appendChild(li);
      });
      div.appendChild(ul);
    }
    list.appendChild(div);
  });
  details.setAttribute('open', 'open');
}

function renderLibrary() {
  const ul = document.querySelector('.js-flashcard-library');
  if (!ul) return;
  ensureSetIds();
  const sets = loadSets();
  const folders = loadFolders();
  ul.innerHTML = '';
  sets.forEach(set => {
    const li = document.createElement('li');
    li.className = 'library-card';

    // Header
    const header = document.createElement('div');
    header.className = 'library-card-header';
    const titleLink = document.createElement('a');
    titleLink.className = 'library-card-title';
    titleLink.href = `flashcard-view.html?set=${encodeURIComponent(set.title)}`;
    titleLink.textContent = set.title;
    const meta = document.createElement('span');
    meta.className = 'library-card-meta';
    const currentFolder = folders.find(f => f.setIds.includes(set.id));
    meta.textContent = `${set.cards.length} cards • ${currentFolder ? currentFolder.name : 'No folder'}`;
    header.appendChild(titleLink);
    header.appendChild(meta);
    li.appendChild(header);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'library-card-actions';

    const openBtn = document.createElement('a');
    openBtn.className = 'btn btn-sm btn-primary';
    openBtn.href = `flashcard-view.html?set=${encodeURIComponent(set.title)}`;
    openBtn.textContent = 'Open';
    actions.appendChild(openBtn);

    const moveBtn = document.createElement('button');
    moveBtn.type = 'button';
    moveBtn.className = 'btn btn-sm btn-outline-secondary js-reveal-folderselect';
    moveBtn.setAttribute('aria-expanded', 'false');
    moveBtn.textContent = 'Move to folder';
    actions.appendChild(moveBtn);

    const select = document.createElement('select');
    select.className = 'form-select form-select-sm js-add-to-folder d-none';
    select.setAttribute('data-setid', set.id);
    const def = document.createElement('option');
    def.value = '';
    def.textContent = 'Choose a folder…';
    select.appendChild(def);
    folders.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      select.appendChild(opt);
    });
    actions.appendChild(select);

    li.appendChild(actions);
    ul.appendChild(li);
  });
}

// Folder page renderer
function renderFolderPage() {
  const container = document.querySelector('.js-folder-sets');
  const nameEl = document.querySelector('.js-folder-name');
  if (!container && !nameEl) return; // not on folder page
  const params = new URLSearchParams(window.location.search);
  const folderId = params.get('folder');
  if (!folderId) return;
  ensureSetIds();
  const sets = loadSets();
  const folders = loadFolders();
  const folder = folders.find(f => f.id === folderId);
  if (nameEl) nameEl.textContent = folder ? folder.name : 'Folder';
  if (!container) return;
  container.innerHTML = '';
  if (!folder) {
    container.innerHTML = '<li class="list-group-item">Folder not found.</li>';
    return;
  }
  const inFolder = folder.setIds.map(id => sets.find(s => s.id === id)).filter(Boolean);
  if (!inFolder.length) {
    container.innerHTML = '<li class="library-card">No sets in this folder yet.</li>';
    return;
  }
  inFolder.forEach(set => {
    const li = document.createElement('li');
    li.className = 'library-card';

    // Header
    const header = document.createElement('div');
    header.className = 'library-card-header';
    const titleLink = document.createElement('a');
    titleLink.className = 'library-card-title';
    titleLink.href = `flashcard-view.html?set=${encodeURIComponent(set.title)}`;
    titleLink.textContent = set.title;
    const meta = document.createElement('span');
    meta.className = 'library-card-meta';
    meta.textContent = `${set.cards.length} cards`;
    header.appendChild(titleLink);
    header.appendChild(meta);
    li.appendChild(header);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'library-card-actions';

    const openBtn = document.createElement('a');
    openBtn.className = 'btn btn-sm btn-primary';
    openBtn.href = `flashcard-view.html?set=${encodeURIComponent(set.title)}`;
    openBtn.textContent = 'Open';
    actions.appendChild(openBtn);

    const moveBtn = document.createElement('button');
    moveBtn.type = 'button';
    moveBtn.className = 'btn btn-sm btn-outline-secondary js-reveal-folderselect';
    moveBtn.setAttribute('aria-expanded', 'false');
    moveBtn.textContent = 'Move to folder';
    actions.appendChild(moveBtn);

    const select = document.createElement('select');
    select.className = 'form-select form-select-sm js-add-to-folder d-none';
    select.setAttribute('data-setid', set.id);
    const def = document.createElement('option');
    def.value = '';
    def.textContent = 'Choose a folder…';
    select.appendChild(def);
    folders.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      select.appendChild(opt);
    });
    actions.appendChild(select);

    li.appendChild(actions);
    container.appendChild(li);
  });
}

// Auto-render on pages that have the library or folders
document.addEventListener('DOMContentLoaded', function() {
  renderFoldersSidebar();
  renderLibrary();
  renderFolderPage();
});

// Toggle show/hide of the folder select when clicking Move button
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.js-reveal-folderselect');
  if (!btn) return;
  const actions = btn.parentElement;
  const select = actions ? actions.querySelector('.js-add-to-folder') : null;
  if (!select) return;
  const hidden = select.classList.contains('d-none');
  if (hidden) {
    select.classList.remove('d-none');
    btn.setAttribute('aria-expanded', 'true');
    // Focus the select after a tick
    setTimeout(() => select.focus(), 0);
  } else {
    select.classList.add('d-none');
    btn.setAttribute('aria-expanded', 'false');
  }
});
