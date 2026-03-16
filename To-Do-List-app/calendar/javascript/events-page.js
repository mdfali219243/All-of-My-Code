document.addEventListener('DOMContentLoaded', () => {
    // State
    let allEvents = [];
    let currentFilter = 'upcoming'; // 'upcoming', 'past', 'all'
    let searchQuery = '';

    // DOM Elements
    const eventsListContainer = document.getElementById('eventsListContainer');
    const searchInput = document.getElementById('eventSearch');
    const filterBtns = document.querySelectorAll('.filter-btn');

    const totalEventsCountEl = document.getElementById('totalEventsCount');
    const upcomingEventsCountEl = document.getElementById('upcomingEventsCount');
    const nextEventNameEl = document.getElementById('nextEventName');
    const nextEventTimeEl = document.getElementById('nextEventTime');

    // Initialize
    loadEvents();
    setupEventListeners();

    function loadEvents() {
        try {
            const stored = localStorage.getItem('calendarEvents');
            if (stored) {
                allEvents = JSON.parse(stored);
                // Ensure dates are parsed for sorting
                allEvents = allEvents.map(ev => ({
                    ...ev,
                    dateObj: new Date(ev.date + 'T' + (ev.startTime || '00:00'))
                }));
            }
        } catch (e) {
            console.error("Failed to load events", e);
            allEvents = [];
        }

        updateStats();
        renderEvents();
    }

    function setupEventListeners() {
        // Search
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderEvents();
        });

        // Filters
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update UI
                filterBtns.forEach(b => {
                    b.classList.remove('active-filter', 'bg-white', 'dark:bg-gray-600', 'shadow-sm', 'text-blue-600', 'dark:text-blue-300');
                    b.classList.add('text-gray-600', 'dark:text-gray-400');
                });
                btn.classList.add('active-filter', 'bg-white', 'dark:bg-gray-600', 'shadow-sm', 'text-blue-600', 'dark:text-blue-300');
                btn.classList.remove('text-gray-600', 'dark:text-gray-400');

                // Update State
                currentFilter = btn.dataset.filter;
                renderEvents();
            });
        });
    }

    function updateStats() {
        const now = new Date();

        // Total
        totalEventsCountEl.textContent = allEvents.length;

        // Upcoming (next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        const upcomingCount = allEvents.filter(e => e.dateObj >= now && e.dateObj <= nextWeek).length;
        upcomingEventsCountEl.textContent = upcomingCount;

        // Next Event
        const futureEvents = allEvents.filter(e => e.dateObj >= now).sort((a, b) => a.dateObj - b.dateObj);
        if (futureEvents.length > 0) {
            const next = futureEvents[0];
            nextEventNameEl.textContent = next.title;
            nextEventNameEl.title = next.title;
            const timeStr = next.allDay ? 'All Day' : (next.startTime || '');
            const dateStr = next.dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            nextEventTimeEl.textContent = `${dateStr} • ${timeStr}`;
        } else {
            nextEventNameEl.textContent = "No upcoming events";
            nextEventTimeEl.textContent = "--";
        }
    }

    function renderEvents() {
        eventsListContainer.innerHTML = '';
        const now = new Date();
        now.setHours(0, 0, 0, 0); // reset time for cleaner date comparison

        // 1. Filter
        let filtered = allEvents.filter(ev => {
            // Search
            const matchesSearch = ev.title.toLowerCase().includes(searchQuery) ||
                (ev.description || '').toLowerCase().includes(searchQuery);
            if (!matchesSearch) return false;

            // Tab Filter
            if (currentFilter === 'upcoming') {
                return ev.dateObj >= now;
            } else if (currentFilter === 'past') {
                return ev.dateObj < now;
            }
            return true; // 'all'
        });

        // 2. Sort
        filtered.sort((a, b) => {
            if (currentFilter === 'past') {
                return b.dateObj - a.dateObj; // Newest past events first
            }
            return a.dateObj - b.dateObj; // Soonest upcoming events first
        });

        // 3. Render
        if (filtered.length === 0) {
            eventsListContainer.innerHTML = `
                <div class="text-center py-16">
                    <div class="bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <i class="far fa-calendar-times text-3xl text-gray-400"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-gray-200">No events found</h3>
                    <p class="text-gray-500 dark:text-gray-400">Try adjusting your filters or search query.</p>
                </div>
            `;
            return;
        }

        // Group by Month? Or just flat list?
        // Let's do a grouped list by Month for better UX
        const grouped = groupByMonth(filtered);

        Object.keys(grouped).forEach(monthLabel => {
            // Month Header
            const monthHeader = document.createElement('h3');
            monthHeader.className = 'text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-8 mb-3 px-1';
            monthHeader.textContent = monthLabel;
            eventsListContainer.appendChild(monthHeader);

            // Cards Grid (1 col mobile, 2 col tablet?)
            // Just a stacked list for now, maybe grid later if requested. Stacked is better for reading details.
            grouped[monthLabel].forEach(ev => {
                const card = createEventCard(ev);
                eventsListContainer.appendChild(card);
            });
        });
    }

    function groupByMonth(events) {
        const groups = {};
        events.forEach(ev => {
            const date = new Date(ev.date + 'T12:00:00'); // Use noon to avoid timezone shifting to prev month
            const year = date.getFullYear();
            const month = date.toLocaleDateString('en-US', { month: 'long' });
            const key = `${month} ${year}`;

            if (!groups[key]) groups[key] = [];
            groups[key].push(ev);
        });
        return groups;
    }

    function createEventCard(ev) {
        const el = document.createElement('div');
        el.className = 'bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition cursor-pointer flex gap-4 items-start event-card';

        // Date Box
        const dateObj = new Date(ev.date + 'T12:00:00');
        const day = dateObj.getDate();
        const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

        // Color indicator
        const color = ev.color || '#4285F4';

        el.innerHTML = `
            <div class="flex-shrink-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg w-16 h-16 border border-gray-100 dark:border-gray-700">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">${weekday}</span>
                <span class="text-2xl font-bold text-gray-800 dark:text-gray-200">${day}</span>
            </div>
            
            <div class="flex-1 min-w-0">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">${ev.title}</h4>
                <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <div class="flex items-center gap-1.5">
                        <i class="far fa-clock"></i>
                        <span>${ev.allDay ? 'All Day' : `${ev.startTime} - ${ev.endTime}`}</span>
                    </div>
                </div>
                ${ev.description ? `<p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">${ev.description}</p>` : ''}
                
                <div class="mt-3 flex items-center gap-2">
                    ${ev.recurrence && ev.recurrence !== 'none' ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"><i class="fas fa-redo-alt text-[10px]"></i> ${ev.recurrence}</span>` : ''}
                    ${ev.alarm && ev.alarm !== 'none' ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"><i class="far fa-bell text-[10px]"></i> Alarm</span>` : ''}
                </div>
            </div>

            <div class="flex-shrink-0 self-center">
                 <div class="w-3 h-3 rounded-full" style="background-color: ${color};"></div>
            </div>
        `;

        // TODO: Wire up click to open modal
        // We need to import the modal logic or rewrite a simple one here. 
        // Since we are on a separate page, we can't easily access index.js functions unless they are global.
        // For now, let's just make it visually react. access logic or simple alert.
        // Better: Duplicate modal logic briefly or make it show alert.
        el.addEventListener('click', () => {
            // We reused the modal HTML in events.html.
            // We can write a simple handler here to pop it up.
            openViewEventModal(ev);
        });

        return el;
    }

    // Modal Logic (Simplified version of index.js)
    const viewEventModal = new bootstrap.Modal(document.getElementById('viewEventModal'));

    function openViewEventModal(ev) {
        document.getElementById('viewEventTitle').textContent = ev.title;
        document.getElementById('viewEventDate').textContent = ev.date;
        document.getElementById('viewEventTime').textContent = ev.allDay ? 'All Day' : `${ev.startTime} - ${ev.endTime}`;
        document.getElementById('viewEventDescription').textContent = ev.description || 'No description';

        const colorSpan = document.getElementById('viewEventColor');
        colorSpan.textContent = '';
        const dot = document.createElement('span');
        dot.style.display = 'inline-block';
        dot.style.width = '12px';
        dot.style.height = '12px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = ev.color || '#4285F4';
        dot.style.marginRight = '8px';
        colorSpan.appendChild(dot);
        colorSpan.append("Color");

        // We can't easily edit/delete without syncing back to the main logic which might be complex to replicate fully here
        // For now, just View.
        // Hide edit/delete or wire them up simply?
        // Wire up delete for "premium" feel functionality
        const deleteBtn = document.getElementById('deleteEventBtn');
        deleteBtn.onclick = () => {
            if (confirm("Delete this event?")) {
                allEvents = allEvents.filter(e => e.id !== ev.id);
                localStorage.setItem('calendarEvents', JSON.stringify(allEvents));
                viewEventModal.hide();
                loadEvents(); // Reload UI
            }
        };

        // Wire up Edit? Maybe too complex for this task iteration (requires form handling)
        // Let's just disable Edit button for now or redirect to Calendar?
        const editBtn = document.getElementById('editEventBtn');
        editBtn.style.display = 'none'; // Simplify

        viewEventModal.show();
    }
});
