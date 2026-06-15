(function () {
  const path = window.location.pathname.toLowerCase();

  const pageMap = [
    { key: 'home', match: (p) => p === '/' || p.endsWith('/homepage/index.html') },
    { key: 'todolist', match: (p) => p.includes('todolist') },
    { key: 'notes', match: (p) => p.includes('/notes/') },
    { key: 'habits', match: (p) => p.includes('habits') },
    { key: 'flashcards', match: (p) => p.includes('flashcard') },
    { key: 'calendar', match: (p) => p.includes('calendar') },
    { key: 'clock', match: (p) => p.includes('clock') || p.includes('promodro') },
    { key: 'grades', match: (p) => p.includes('grades') },
  ];

  const active = pageMap.find((entry) => entry.match(path));
  if (!active) return;

  document.querySelectorAll('.sf-sidebar-link[data-page="' + active.key + '"]').forEach((link) => {
    link.classList.add('active');
  });
})();
