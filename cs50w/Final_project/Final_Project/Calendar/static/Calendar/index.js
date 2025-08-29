
let currentDate = new Date();
let currentView = 'month';
let calendarEvents = [];

// --- API helpers ---
const API_EVENTS_URL = '/api/events';
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}
function apiFetch(url, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const csrftoken = getCookie('csrftoken');
    if (csrftoken) headers['X-CSRFToken'] = csrftoken;
    return fetch(url, { credentials: 'same-origin', ...options, headers });
}
// Simple ISO formatter (local to this module)
function toISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
async function loadEventsForCurrentViewAndRender() {
    try {
        let startISO, endISO;
        const d = new Date(currentDate);
        if (currentView === 'month') {
            const first = new Date(d.getFullYear(), d.getMonth(), 1);
            const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            startISO = toISO(first);
            endISO = toISO(last);
        } else if (currentView === 'week') {
            const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            startISO = toISO(start);
            endISO = toISO(end);
        } else if (currentView === 'day') {
            startISO = toISO(d);
            endISO = toISO(d);
        }
        if (startISO && endISO) {
            const resp = await apiFetch(`${API_EVENTS_URL}?start=${startISO}&end=${endISO}`);
            if (!resp.ok) throw new Error('Failed to load events');
            calendarEvents = await resp.json();
        }
        if (currentView === 'month') renderMonthView(currentDate);
        else if (currentView === 'week') renderWeekView(currentDate);
        else if (currentView === 'day') renderDayView(currentDate);
        else if (currentView === 'year') renderYearView(currentDate);
        updateDropdownText();
    } catch (e) {
        console.error('Error loading events:', e);
    }
}

// DOM elements will be initialized after DOM is loaded
let monthView, weekView, dayView, yearView, monthGrid, weekTimeGrid, dayTimeGrid, yearGrid, currentDisplay, todayBtn;
let weekViewBtn, dayViewBtn, monthViewBtn, yearViewBtn;

// --- Drag-select globals ---
let isDragging = false;
let dragStartDate = null;
let dragStartHour = null;
let currentHighlighted = [];

// ---- Enhanced Drag-select helper functions (global) ----
function clearDragHighlight() {
    currentHighlighted.forEach(cell => cell.classList.remove('selecting'));
    currentHighlighted = [];
    // Remove dragging class from grids
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
}

// Robust dark mode detection
function isDarkModeEnabled() {
    return (
        document.documentElement.classList.contains('dark') ||
        (document.body && document.body.classList.contains('dark'))
    );
}

function highlightRange(gridEl, date, startH, endH) {
    clearDragHighlight();
    const [minH, maxH] = startH < endH ? [startH, endH] : [endH, startH];
    const selector = `.day-cell[data-date="${date}"]`;
    const cells = Array.from(gridEl.querySelectorAll(selector));
    cells.forEach(cell => {
        const h = Number(cell.dataset.hour);
        if (h >= minH && h <= maxH) {
            cell.classList.add('selecting');
            currentHighlighted.push(cell);
        }
    });
}

// Enhanced function to support month view drag selection
function highlightMonthRange(startDate, endDate) {
    clearDragHighlight();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const [minDate, maxDate] = start <= end ? [start, end] : [end, start];

    const cells = Array.from(document.querySelectorAll('.month-cell'));
    cells.forEach(cell => {
        if (cell.dataset.date) {
            const cellDate = new Date(cell.dataset.date);
            if (cellDate >= minDate && cellDate <= maxDate) {
                cell.classList.add('selecting');
                currentHighlighted.push(cell);
            }
        }
    });
}

// Universal drag selection enabler for all views
function enableDragSelection(gridEl, viewType = 'time') {
    if (!gridEl || gridEl.dataset.dragSetup) return;
    gridEl.dataset.dragSetup = 'true';

    let dragStartCell = null;

    const handleMouseDown = (e) => {
        const targetCell = viewType === 'month' ? e.target.closest('.month-cell') : e.target.closest('.day-cell');
        if (!targetCell || e.target.closest('.week-event, .month-event, .time-event')) return;

        isDragging = true;
        dragStartCell = targetCell;
        dragStartDate = targetCell.dataset.date;
        if (viewType !== 'month') {
            dragStartHour = Number(targetCell.dataset.hour);
        }

        gridEl.classList.add('dragging');
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const overCell = viewType === 'month' ? e.target.closest('.month-cell') : e.target.closest('.day-cell');
        if (!overCell) return;

        if (viewType === 'month') {
            highlightMonthRange(dragStartDate, overCell.dataset.date);
        } else {
            const currentHour = Number(overCell.dataset.hour);
            highlightRange(gridEl, dragStartDate, dragStartHour, currentHour);
        }
    };

    const handleMouseUp = (e) => {
        if (!isDragging) return;

        const endCell = viewType === 'month' ? e.target.closest('.month-cell') : e.target.closest('.day-cell');

        if (dragStartCell && endCell && dragStartCell !== endCell) {
            if (viewType === 'month') {
                openAddEventModal(dragStartDate, null, true, null, endCell.dataset.date);
            } else {
                const endHour = Number(endCell.dataset.hour) + 1;
                openAddEventModal(dragStartDate, dragStartHour, false, endHour);
            }
        }

        isDragging = false;
        dragStartCell = null;
        gridEl.classList.remove('dragging');
        clearDragHighlight();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    gridEl.addEventListener('mousedown', handleMouseDown);
}

// --- Utility: update dropdown toggle text based on current view (global) ---
function updateDropdownText() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    if (dropdownToggle) {
        const textMap = {
            'month': 'Month',
            'week': 'Week',
            'day': 'Day',
            'year': 'Year'
        };
        dropdownToggle.textContent = textMap[currentView] || 'Month';
    }
}

// --- Utility: setup color pickers ---
function setupColorPickers() {
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
            // Deselect others
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            const color = opt.getAttribute('data-color');
            const eventColorInput = document.getElementById('eventColor');
            if (eventColorInput) eventColorInput.value = color;
            const editEventColorInput = document.getElementById('editEventColor');
            if (editEventColorInput) editEventColorInput.value = color;
        });
    });
}


// Events now load from server via loadEventsForCurrentViewAndRender()

// --- View Management ---
function showView(viewToShow) {
    const allViews = [monthView, weekView, dayView, yearView];
    allViews.forEach(view => {
        if (view) {
            view.style.display = 'none';
        }
    });

    if (viewToShow) {
        // dayView uses flex, others use block
        viewToShow.style.display = (viewToShow === dayView) ? 'flex' : 'block';
    }
}

// for compare
function formatDateToISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// for the month view function
function renderMonthView(date) {
    showView(monthView);

    // Clear the month grid
    if (monthGrid) {
        monthGrid.innerHTML = '';
    }


    const year = date.getFullYear();
    const month = date.getMonth();

    // Set header to 'Month Year', e.g., 'July 2025'
    if (currentDisplay) {
        currentDisplay.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
    }

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayIndex = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day', 'py-2');
        dayDiv.textContent = prevMonthLastDay - i;
        dayDiv.classList.add('non-current-month');
        if (monthGrid) monthGrid.appendChild(dayDiv);
    }

    // creating the days of the month

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day', 'month-cell', 'py-2', 'relative');
        dayDiv.textContent = i;
        const fullDate = new Date(year, month, i);
        dayDiv.dataset.date = formatDateToISO(fullDate);

        // highlighting the today's date
        const today = new Date();
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayDiv.innerHTML = `<span class="today-highlight_for_month_week">${i}</span>`;
            dayDiv.classList.add('today-container');
        }

        // Render events for this date
        const cellDateStr = formatDateToISO(fullDate);
        const eventsForDay = calendarEvents.filter(ev => ev.date === cellDateStr);
        if (eventsForDay.length > 0) {
            const eventsList = document.createElement('div');
            eventsList.className = 'month-events-list';
            eventsForDay.forEach(ev => {
                const isDarkMode = isDarkModeEnabled();
                const evDiv = document.createElement('div');
                evDiv.className = 'month-event px-1 py-0.5 rounded mb-1 text-xs truncate';
                evDiv.style.cursor = 'pointer';

                // Only set inline colors for custom-colored events; otherwise rely on CSS with 'event-default'
                if (ev.color) {
                    if (isDarkMode) {
                        evDiv.style.backgroundColor = `${ev.color}80`;
                        evDiv.style.color = '#e8eaed';
                        evDiv.style.borderLeft = `3px solid ${ev.color}`;
                    } else {
                        evDiv.style.backgroundColor = `${ev.color}20`;
                        evDiv.style.color = ev.color;
                        evDiv.style.borderLeft = `3px solid ${ev.color}`;
                    }
                } else {
                    evDiv.classList.add('event-default');
                }

                evDiv.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openViewEventModal(ev.id);
                });
                if (ev.allDay) {
                    evDiv.textContent = `• ${ev.title} (All Day)`;
                } else if (ev.startTime && ev.endTime) {
                    evDiv.textContent = `• ${ev.title} (${ev.startTime} - ${ev.endTime})`;
                } else if (ev.startTime) {
                    evDiv.textContent = `• ${ev.title} (${ev.startTime})`;
                } else {
                    evDiv.textContent = `• ${ev.title}`;
                }
                eventsList.appendChild(evDiv);
            });
            dayDiv.appendChild(eventsList);
        }

        if (monthGrid) monthGrid.appendChild(dayDiv);
    }

    // creating the remaining days of the month
    const totalDaysDisplayed = startDayIndex + daysInMonth;
    const remainingCells = 42 - totalDaysDisplayed;
    for (let i = 1; i <= remainingCells; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day', 'py-2');
        dayDiv.textContent = i;
        dayDiv.classList.add('non-current-month');
        if (monthGrid) monthGrid.appendChild(dayDiv);
    }

    // adding the click event to the days of the month
    if (monthGrid) {
        monthGrid.querySelectorAll('.calendar-day:not(.non-current-month)').forEach(dayDiv => {
            dayDiv.addEventListener('click', (e) => {
                // Only open add modal if not clicking on an event
                if (e.target.closest('.month-event')) return;
                openAddEventModal(dayDiv.dataset.date);
            });
        });

        // Enable drag selection for month view
        enableDragSelection(monthGrid, 'month');
    }
}

function renderWeekView(date) {
    showView(weekView);

    // --- All-Day Events Row --- //
    const weekAllDayEvents = document.getElementById('weekAllDayEvents');
    if (weekAllDayEvents) {
        weekAllDayEvents.innerHTML = '';
        for (let d = 0; d < 7; d++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell p-1 min-h-[2rem]';
            const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + d);
            dayCell.dataset.date = formatDateToISO(dayDate);
            const allDayEvents = calendarEvents.filter(ev => ev.date === dayCell.dataset.date && ev.allDay);
            allDayEvents.forEach(ev => {
                const evDiv = document.createElement('div');
                evDiv.className = 'all-day-event event-cell';
                if (ev.color) {
                    evDiv.style.backgroundColor = isDarkModeEnabled() ? `${ev.color}80` : `${ev.color}30`;
                    evDiv.style.color = isDarkModeEnabled() ? '#e8eaed' : '#1a202c';
                    evDiv.style.borderLeft = `3px solid ${ev.color}`;
                } else {
                    evDiv.classList.add('event-default');
                }
                evDiv.style.cursor = 'pointer';
                evDiv.textContent = ev.title;
                evDiv.addEventListener('click', (e) => { e.stopPropagation(); openViewEventModal(ev.id); });
                dayCell.appendChild(evDiv);
            });
            dayCell.addEventListener('click', () => openAddEventModal(dayCell.dataset.date, 0, true));
            weekAllDayEvents.appendChild(dayCell);
        }
    }

    // --- Week Header --- //
    if (currentDisplay) {
        const startOfWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
        currentDisplay.textContent = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
    }
    const weekDaysHeader = document.getElementById('weekDaysHeader');
    if (weekDaysHeader) {
        weekDaysHeader.innerHTML = '<div></div>'; // Empty div for time column
        const startOfWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
        const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let d = 0; d < 7; d++) {
            const dayDate = new Date(startOfWeek); dayDate.setDate(startOfWeek.getDate() + d);
            const headerDiv = document.createElement('div');
            headerDiv.className = 'week-header-day';
            const isToday = formatDateToISO(dayDate) === formatDateToISO(new Date());
            headerDiv.innerHTML = `<div>${weekdayNames[d]}</div><div class="text-sm${isToday ? ' today-highlight_for_month_week' : ''}">${dayDate.getDate()}</div>`;
            weekDaysHeader.appendChild(headerDiv);
        }
    }

    // --- Timed Events Grid --- //
    if (weekTimeGrid) {
        weekTimeGrid.innerHTML = '';
        weekTimeGrid.style.position = 'relative';
        enableDragSelection(weekTimeGrid);

        // Create the grid structure (time labels and day cells)
        for (let h = 0; h < 24; h++) {
            const timeCell = document.createElement('div');
            timeCell.className = 'time-label';
            const hour = h % 12 || 12; const ampm = h < 12 ? 'AM' : 'PM';
            timeCell.textContent = h === 0 ? '12 AM' : `${hour} ${ampm}`;
            weekTimeGrid.appendChild(timeCell);
            for (let d = 0; d < 7; d++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'week-cell day-cell border';
                const cellDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + d);
                dayCell.dataset.date = formatDateToISO(cellDate);
                dayCell.dataset.hour = h;
                weekTimeGrid.appendChild(dayCell);
            }
        }

        // Create a single container for all timed events, placed over the grid
        const timedEventsContainer = document.createElement('div');
        timedEventsContainer.className = 'timed-events-container';
        weekTimeGrid.appendChild(timedEventsContainer);

        // Render events day by day into the container
        for (let d = 0; d < 7; d++) {
            const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + d);
            const dateStr = formatDateToISO(dayDate);
            const eventsForDay = calendarEvents.filter(ev => ev.date === dateStr && !ev.allDay);
            renderEventsInTimeGrid(timedEventsContainer, eventsForDay, 'week', d);
        }
    }
}

function renderEventsInTimeGrid(container, events, viewType, dayIndex = 0) {
    const getOverlappingColumns = (events) => {
        const sortedEvents = [...events].sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
        const columns = []; // Array of columns, each column is an array of events

        for (const event of sortedEvents) {
            let placed = false;
            const eventStart = new Date(`${event.date}T${event.startTime || '00:00:00'}`);
            
            for (const column of columns) {
                const lastEventInColumn = column[column.length - 1];
                const lastEventEnd = new Date(`${lastEventInColumn.date}T${lastEventInColumn.endTime || '23:59:59'}`);
                
                if (eventStart >= lastEventEnd) {
                    column.push(event);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                columns.push([event]); // Start a new column
            }
        }
        return columns;
    };

    const eventColumns = getOverlappingColumns(events);
    const totalColumns = eventColumns.length;

    eventColumns.forEach((column, colIndex) => {
        column.forEach(ev => {
            const [startH, startM] = ev.startTime ? ev.startTime.split(':').map(Number) : [0, 0];
            const [endH, endM] = ev.endTime ? ev.endTime.split(':').map(Number) : [startH, 30];
            const totalStartMinutes = startH * 60 + startM;
            const totalEndMinutes = endH * 60 + endM;
            const durationMinutes = Math.max(15, totalEndMinutes - totalStartMinutes); // Min height of 15 mins

            const evDiv = document.createElement('div');
            evDiv.className = 'time-event';
            evDiv.innerHTML = `<div class="font-semibold truncate">${ev.title}</div>`;

            if (ev.color) {
                evDiv.style.backgroundColor = isDarkModeEnabled() ? `${ev.color}80` : ev.color;
                evDiv.style.color = isDarkModeEnabled() ? '#e8eaed' : 'white';
                evDiv.style.borderLeft = `3px solid ${darkenColor(ev.color, 20)}`;
            } else { evDiv.classList.add('event-default'); }

            evDiv.style.position = 'absolute';
            evDiv.style.top = `${(totalStartMinutes / (24 * 60)) * 100}%`;
            evDiv.style.height = `${(durationMinutes / (24 * 60)) * 100}%`;
            evDiv.style.boxSizing = 'border-box';

            if (viewType === 'week') {
                const dayWidthPercent = 100 / 7;
                const eventWidthPercent = dayWidthPercent / totalColumns;
                evDiv.style.left = `calc(${(dayIndex * dayWidthPercent)}% + ${(colIndex * eventWidthPercent)}%)`;
                evDiv.style.width = `calc(${eventWidthPercent}% - 2px)`; // -2px for margin
            } else { // Day View
                const eventWidthPercent = 100 / totalColumns;
                evDiv.style.left = `${colIndex * eventWidthPercent}%`;
                evDiv.style.width = `calc(${eventWidthPercent}% - 2px)`; // -2px for margin
            }
            
            evDiv.addEventListener('click', (e) => { e.stopPropagation(); openViewEventModal(ev.id); });
            container.appendChild(evDiv);
        });
    });
}

function darkenColor(color, percent) {
    let f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = (f >> 8) & 0x00FF, B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

function renderDayView(date) {
    showView(dayView);

    // --- Header --- //
    if (currentDisplay) {
        currentDisplay.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
        
        // Highlight today's date in blue if viewing today, otherwise remove highlight
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && 
                       date.getMonth() === today.getMonth() && 
                       date.getFullYear() === today.getFullYear();
        
        if (isToday) {
            currentDisplay.classList.add('day-header-today');
        } else {
            currentDisplay.classList.remove('day-header-today');
        }
    }

    // --- All-Day Events --- //
    const dayAllDayEvents = document.getElementById('dayAllDayEvents');
    if (dayAllDayEvents) {
        dayAllDayEvents.innerHTML = '';
        const allDayEvents = calendarEvents.filter(ev => ev.date === formatDateToISO(date) && ev.allDay);
        allDayEvents.forEach(ev => {
            const evDiv = document.createElement('div');
            evDiv.className = 'all-day-event event-cell';
            if (ev.color) {
                evDiv.style.backgroundColor = isDarkModeEnabled() ? `${ev.color}80` : `${ev.color}30`;
                evDiv.style.color = isDarkModeEnabled() ? '#e8eaed' : '#1a202c';
                evDiv.style.borderLeft = `3px solid ${ev.color}`;
            } else { evDiv.classList.add('event-default'); }
            evDiv.textContent = ev.title;
            evDiv.addEventListener('click', (e) => { e.stopPropagation(); openViewEventModal(ev.id); });
            dayAllDayEvents.appendChild(evDiv);
        });
        dayAllDayEvents.addEventListener('click', () => openAddEventModal(formatDateToISO(date), 0, true));
    }

    // --- Timed Events Grid --- //
    if (dayTimeGrid) {
        dayTimeGrid.innerHTML = '';
        dayTimeGrid.style.position = 'relative';
        enableDragSelection(dayTimeGrid);

        // Create grid structure
        for (let h = 0; h < 24; h++) {
            const row = document.createElement('div');
            row.className = 'day-time-row';
            const timeLabelCell = document.createElement('div');
            timeLabelCell.className = 'time-label-cell';
            const hour = h % 12 || 12; const ampm = h < 12 ? 'AM' : 'PM';
            timeLabelCell.textContent = h === 0 ? '12 AM' : `${hour} ${ampm}`;
            row.appendChild(timeLabelCell);
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell hour-start';
            dayCell.dataset.date = formatDateToISO(date);
            dayCell.dataset.hour = h;
            row.appendChild(dayCell);
            dayTimeGrid.appendChild(row);
        }

        // Create a single container for all timed events
        const timedEventsContainer = document.createElement('div');
        timedEventsContainer.className = 'timed-events-container';
        dayTimeGrid.appendChild(timedEventsContainer);

        // Filter and render timed events
        const timedEvents = calendarEvents.filter(ev => ev.date === formatDateToISO(date) && !ev.allDay);
        renderEventsInTimeGrid(timedEventsContainer, timedEvents, 'day');
    }
}

// Year view
function renderYearView(date) {
    showView(yearView);

    // Clear the year grid and set layout
    if (yearGrid) {
        yearGrid.innerHTML = '';
        yearGrid.style.display = 'grid';
        yearGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        yearGrid.style.gap = '8px';
    }

    const year = date.getFullYear();
    if (currentDisplay) currentDisplay.textContent = `${year}`;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    for (let m = 0; m < 12; m++) {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'year-month border rounded-lg p-2';

        // Month header
        const monthHeader = document.createElement('div');
        monthHeader.className = 'p-2 border-r text-center';
        monthHeader.textContent = monthNames[m];
        monthContainer.appendChild(monthHeader);

        // Mini month grid
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const firstDay = new Date(year, m, 1).getDay();

        const miniGrid = document.createElement('div');
        miniGrid.style.display = 'grid';
        miniGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        miniGrid.style.gap = '1px';

        // Leading blanks for first week alignment
        for (let i = 0; i < firstDay; i++) {
            miniGrid.appendChild(document.createElement('div'));
        }
        // Day numbers
        for (let d = 1; d <= daysInMonth; d++) {
            const dayCell = document.createElement('div');
            dayCell.textContent = d;
            dayCell.className = 'mini-day text-center';
            
            // Check if this day is today and add the 'today' class if so
            const today = new Date();
            if (d === today.getDate() && m === today.getMonth() && year === today.getFullYear()) {
                dayCell.classList.add('today');
            }
            
            miniGrid.appendChild(dayCell);
        }

        monthContainer.appendChild(miniGrid);

        // Clicking a month switches to month view of that month
        monthContainer.addEventListener('click', () => {
            currentDate = new Date(year, m, 1);
            currentView = 'month';
            renderMonthView(currentDate);
            updateDropdownText();
        });

        if (yearGrid) yearGrid.appendChild(monthContainer);
    }
}

// Utility: open Add Event modal with date/time prefilled
// Enhanced to support multi-day events with endDate parameter

function openAddEventModal(date, hour, isAllDay = false, endHour = null, endDate = null) {
    const eventDateInput = document.getElementById('eventDate');
    const eventStartTime = document.getElementById('eventStartTime');
    const eventEndTime = document.getElementById('eventEndTime');
    const eventAllDay = document.getElementById('eventAllDay');
    const timeFields = document.getElementById('eventTimeFields');
    const eventTitle = document.getElementById('eventTitle');

    // Clear previous values
    if (eventTitle) eventTitle.value = '';

    if (eventDateInput && date) eventDateInput.value = date;

    // For multi-day events, we'll need to enhance the form to support end date
    // For now, we'll set the title to indicate the date range
    if (endDate && endDate !== date) {
        const startD = new Date(date);
        const endD = new Date(endDate);
        const options = { month: 'short', day: 'numeric' };
        const rangeText = `${startD.toLocaleDateString('en-US', options)} - ${endD.toLocaleDateString('en-US', options)}`;
        if (eventTitle) {
            eventTitle.placeholder = `Event (${rangeText})`;
        }
    }

    if (isAllDay) {
        if (eventAllDay) eventAllDay.checked = true;
        if (timeFields) timeFields.style.display = 'none';
        if (eventStartTime) eventStartTime.value = '00:00';
        if (eventEndTime) eventEndTime.value = '23:59';
    } else {
        if (eventAllDay) eventAllDay.checked = false;
        if (timeFields) timeFields.style.display = 'block';
        if (hour !== undefined && hour !== null) {
            const computedEnd = endHour !== null ? endHour : (hour + 1);
            const startVal = `${String(hour).padStart(2, '0')}:00`;
            const endVal = `${String(computedEnd).padStart(2, '0')}:00`;
            if (eventStartTime) eventStartTime.value = startVal;
            if (eventEndTime) eventEndTime.value = endVal;
        }
    }

    const modal = new bootstrap.Modal(document.getElementById('addEventModal'));
    modal.show();
}

// Utility to format time to 12-hour AM/PM format
function formatTime12Hour(timeString) {
    if (!timeString) return '';
    const [hour, minute] = timeString.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

function openViewEventModal(eventId) {
    const event = calendarEvents.find(e => e.id === eventId);
    if (!event) return;

    document.getElementById('viewEventTitle').textContent = event.title;
    document.getElementById('viewEventDate').textContent = new Date(event.date).toLocaleDateString();
    document.getElementById('viewEventTime').textContent = event.allDay ? 'All Day' : `${formatTime12Hour(event.startTime)} - ${formatTime12Hour(event.endTime)}`;
    document.getElementById('viewEventDescription').textContent = event.description || 'No description provided.';

    const colorSpan = document.getElementById('viewEventColor');
    colorSpan.textContent = event.color;
    colorSpan.style.color = event.color;

    const viewEventModalEl = document.getElementById('viewEventModal');
    let viewModal = bootstrap.Modal.getInstance(viewEventModalEl);
    if (!viewModal) {
        viewModal = new bootstrap.Modal(viewEventModalEl);
    }
    viewModal.show();

    document.getElementById('editEventBtn').onclick = () => {
        viewModal.hide();
        openEditEventModal(eventId);
    };

    document.getElementById('deleteEventBtn').onclick = () => {
        if (confirm('Are you sure you want to delete this event?')) {
            apiFetch(`${API_EVENTS_URL}/${eventId}`, { method: 'DELETE' })
                .then(() => {
                    viewModal.hide();
                    loadEventsForCurrentViewAndRender();
                })
                .catch(err => {
                    console.error('Failed to delete event', err);
                    alert('Failed to delete event');
                });
        }
    };
}

function openEditEventModal(eventId) {
    const event = calendarEvents.find(ev => ev.id === eventId);
    if (!event) return;

    editEventId.value = event.id;
    editEventTitle.value = event.title;
    editEventDate.value = event.date;
    editEventAllDay.checked = event.allDay || false;
    editEventStartTime.value = event.startTime || '';
    editEventEndTime.value = event.endTime || '';
    editEventDescription.value = event.description || '';
    editEventColor.value = event.color || '#4285F4';

    // Set the color picker
    const color = event.color || '#4285F4';
    document.querySelectorAll('#editEventModal .color-option').forEach(option => {
        option.classList.remove('selected');
        if (option.getAttribute('data-color') === color) {
            option.classList.add('selected');
        }
    });
    if (editEventAllDay) editEventAllDay.dispatchEvent(new Event('change'));
    const modal = new bootstrap.Modal(editEventModal);
    modal.show();
}

document.addEventListener('DOMContentLoaded', function () {
    // --- Initialize DOM elements ---
    monthView = document.getElementById('monthView');
    weekView = document.getElementById('weekView');
    dayView = document.getElementById('dayView');
    yearView = document.getElementById('yearView');
    monthGrid = document.getElementById('monthGrid');
    weekTimeGrid = document.getElementById('weekTimeGrid');
    dayTimeGrid = document.getElementById('dayTimeGrid');
    yearGrid = document.getElementById('yearGrid');
    currentDisplay = document.getElementById('currentDisplay');
    todayBtn = document.querySelector('.today-button');

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const addEventBtn = document.getElementById('addEventBtn');

    // View buttons
    weekViewBtn = document.querySelector('.weekViewBtn');
    dayViewBtn = document.querySelector('.dayViewBtn');
    monthViewBtn = document.querySelector('.monthViewBtn');
    yearViewBtn = document.querySelector('.yearViewBtn');

    // --- Modals and Forms ---
    const addEventModal = document.getElementById('addEventModal');
    const addEventForm = document.getElementById('addEventForm');
    const eventAllDay = document.getElementById('eventAllDay');
    const eventTimeFields = document.getElementById('eventTimeFields');
    const eventStartTime = document.getElementById('eventStartTime');
    const eventEndTime = document.getElementById('eventEndTime');

    const editEventModal = document.getElementById('editEventModal');
    const editEventForm = document.getElementById('editEventForm');
    const editEventId = document.getElementById('editEventId');
    const editEventTitle = document.getElementById('editEventTitle');
    const editEventDate = document.getElementById('editEventDate');
    const editEventAllDay = document.getElementById('editEventAllDay');
    const editEventTimeFields = document.getElementById('editEventTimeFields');
    const editEventStartTime = document.getElementById('editEventStartTime');
    const editEventEndTime = document.getElementById('editEventEndTime');
    const editEventDescription = document.getElementById('editEventDescription');
    const editEventColor = document.getElementById('editEventColor');

    // Feature menu
    const openMenuBtn = document.getElementById('openMenuBtn');
    const featureMenu = document.getElementById('featureMenu');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const overlay = document.getElementById('overlay');

    // --- Event Listeners ---

    // View switching
    const viewButtons = [
        { btn: monthViewBtn, view: 'month' },
        { btn: weekViewBtn, view: 'week' },
        { btn: dayViewBtn, view: 'day' },
        { btn: yearViewBtn, view: 'year' },
    ];
    viewButtons.forEach(({ btn, view }) => {
        if (btn) {
            btn.addEventListener('click', () => {
                currentView = view;
                loadEventsForCurrentViewAndRender();
            });
        }
    });

    // Navigation
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() - 1);
            else if (currentView === 'week') currentDate.setDate(currentDate.getDate() - 7);
            else if (currentView === 'day') currentDate.setDate(currentDate.getDate() - 1);
            else if (currentView === 'year') currentDate.setFullYear(currentDate.getFullYear() - 1);
            loadEventsForCurrentViewAndRender();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() + 1);
            else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + 7);
            else if (currentView === 'day') currentDate.setDate(currentDate.getDate() + 1);
            else if (currentView === 'year') currentDate.setFullYear(currentDate.getFullYear() + 1);
            loadEventsForCurrentViewAndRender();
        });
    }

    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            currentDate = new Date();
            loadEventsForCurrentViewAndRender();
        });
    }

    // Add Event Button
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            const today = new Date();
            const todayStr = toISO(today);
            openAddEventModal(todayStr);
        });
    }

    // Add Event Form
    if (addEventForm) {
        addEventForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const title = document.getElementById('eventTitle').value;
            const date = document.getElementById('eventDate').value;
            const allDay = document.getElementById('eventAllDay').checked;
            const startTime = document.getElementById('eventStartTime').value;
            const endTime = document.getElementById('eventEndTime').value;
            const description = document.getElementById('eventDescription').value;
            const color = document.getElementById('eventColor').value;

            if (!allDay && (!startTime || !endTime)) {
                alert('Start time and end time are required for non-all-day events.');
                return;
            }
            if (!title || !date) {
                alert('Title and date are required.');
                return;
            }

            const payload = {
                title, date, allDay,
                startTime: allDay ? null : startTime,
                endTime: allDay ? null : endTime,
                description,
                color: color || '#4285F4',
            };

            apiFetch(`${API_EVENTS_URL}`, { method: 'POST', body: JSON.stringify(payload) })
                .then(resp => {
                    if (!resp.ok) throw new Error('Failed to create event');
                    const modal = bootstrap.Modal.getInstance(addEventModal);
                    if (modal) modal.hide();
                    return loadEventsForCurrentViewAndRender();
                })
                .catch(err => {
                    console.error(err);
                    alert('Failed to create event');
                });

            addEventForm.reset();
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            const defaultColor = document.querySelector('.color-option[data-color="#4285F4"]');
            if (defaultColor) defaultColor.classList.add('selected');
            const eventColorInput = document.getElementById('eventColor');
            if (eventColorInput) eventColorInput.value = '#4285F4';
            if (eventAllDay) eventAllDay.dispatchEvent(new Event('change'));
        });
    }

    // Edit Event Form
    if (editEventForm) {
        editEventForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const id = editEventId.value;
            const allDay = editEventAllDay.checked;
            const startTime = editEventStartTime.value;
            const endTime = editEventEndTime.value;

            if (!allDay && (!startTime || !endTime)) {
                alert('Start time and end time are required for non-all-day events.');
                return;
            }
            const payload = {
                title: editEventTitle.value,
                date: editEventDate.value,
                allDay: allDay,
                startTime: allDay ? null : startTime,
                endTime: allDay ? null : endTime,
                description: editEventDescription.value,
                color: editEventColor.value || '#4285F4',
            };
            apiFetch(`${API_EVENTS_URL}/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
                .then(resp => {
                    if (!resp.ok) throw new Error('Failed to update event');
                    const modal = bootstrap.Modal.getInstance(editEventModal);
                    if (modal) modal.hide();
                    return loadEventsForCurrentViewAndRender();
                })
                .catch(err => {
                    console.error(err);
                    alert('Failed to update event');
                });
        });
    }

    // All-Day Toggles
    if (eventAllDay && eventTimeFields) {
        eventAllDay.addEventListener('change', function () {
            const isChecked = eventAllDay.checked;
            eventStartTime.value = '';
            eventEndTime.value = '';
            eventStartTime.disabled = isChecked;
            eventEndTime.disabled = isChecked;
            eventTimeFields.classList.toggle('d-none', isChecked);
        });
        eventAllDay.dispatchEvent(new Event('change'));
    }
    if (editEventAllDay && editEventTimeFields) {
        editEventAllDay.addEventListener('change', function () {
            const isChecked = editEventAllDay.checked;
            editEventStartTime.value = '';
            editEventEndTime.value = '';
            editEventStartTime.disabled = isChecked;
            editEventEndTime.disabled = isChecked;
            editEventTimeFields.classList.toggle('d-none', isChecked);
        });
    }

    // Feature Menu (Sidebar)
    if (openMenuBtn && featureMenu) {
        openMenuBtn.addEventListener('click', () => {
            featureMenu.classList.remove('-translate-x-full');
            featureMenu.classList.add('translate-x-0');
            if (overlay) overlay.classList.remove('hidden');
        });
    }
    const closeSideMenu = () => {
        if (featureMenu) {
            featureMenu.classList.remove('translate-x-0');
            featureMenu.classList.add('-translate-x-full');
        }
        if (overlay) overlay.classList.add('hidden');
    };
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeSideMenu);
    if (overlay) overlay.addEventListener('click', closeSideMenu);

    // --- Initializations ---
    setupColorPickers();
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(el => new bootstrap.Dropdown(el));
    loadEventsForCurrentViewAndRender();
});
