
let currentDate = new Date();
let currentView = 'month';
let calendarEvents = [];

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

// Initialize the calendar when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize DOM elements
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

    // View buttons
    weekViewBtn = document.querySelector('.weekViewBtn');
    dayViewBtn = document.querySelector('.dayViewBtn');
    monthViewBtn = document.querySelector('.monthViewBtn');
    yearViewBtn = document.querySelector('.yearViewBtn');

    // Calendar navigation
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Event listeners for view switching
    const viewButtons = [
        { btn: monthViewBtn, view: 'month', render: renderMonthView },
        { btn: weekViewBtn, view: 'week', render: renderWeekView },
        { btn: dayViewBtn, view: 'day', render: renderDayView },
        { btn: yearViewBtn, view: 'year', render: renderYearView },
    ];

    viewButtons.forEach(({ btn, view, render }) => {
        if (btn) {
            btn.addEventListener('click', () => {
                currentView = view;
                render(currentDate);
                updateDropdownText();
            });
        }
    });

    // Event listeners for navigation
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() - 1);
            else if (currentView === 'week') currentDate.setDate(currentDate.getDate() - 7);
            else if (currentView === 'day') currentDate.setDate(currentDate.getDate() - 1);
            else if (currentView === 'year') currentDate.setFullYear(currentDate.getFullYear() - 1);
            viewButtons.find(v => v.view === currentView)?.render(currentDate);
            updateDropdownText();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() + 1);
            else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + 7);
            else if (currentView === 'day') currentDate.setDate(currentDate.getDate() + 1);
            else if (currentView === 'year') currentDate.setFullYear(currentDate.getFullYear() + 1);
            viewButtons.find(v => v.view === currentView)?.render(currentDate);
            updateDropdownText();
        });
    }

    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            currentDate = new Date();
            viewButtons.find(v => v.view === currentView)?.render(currentDate);
            updateDropdownText();
        });
    }

    // Initialize color pickers and modals
    setupColorPickers();

    // Initial render
    viewButtons.find(v => v.view === currentView)?.render(currentDate);
    updateDropdownText();
});

// Load events from localStorage if present
if (window.localStorage) {
    try {
        const storedEvents = localStorage.getItem('calendarEvents');
        if (storedEvents) {
            calendarEvents = JSON.parse(storedEvents);
        }
    } catch (e) {
        calendarEvents = [];
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
    // Show month view, hide week view
    if (monthView && weekView && dayView && yearView) {
        monthView.style.display = 'block';
        weekView.style.display = 'none';
        dayView.style.display = 'none';
        yearView.style.display = 'none';
    }

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
    // Set week date range above grid
    // Hide other views, show week view
    if (monthView) monthView.style.display = 'none';
    if (weekView) weekView.style.display = 'block';
    if (yearGrid) yearGrid.style.display = 'none';
    if (dayView) dayView.style.display = 'none';

    // Clear all-day events row
    const weekAllDayEvents = document.getElementById('weekAllDayEvents');
    if (weekAllDayEvents) {
        weekAllDayEvents.innerHTML = '';

        // Create a cell for each day of the week
        for (let d = 0; d < 7; d++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell p-1 min-h-[2rem]';
            dayCell.dataset.date = formatDateToISO(new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + d));

            // Find all-day events for this day
            const allDayEvents = calendarEvents.filter(ev =>
                ev.date === dayCell.dataset.date && ev.allDay
            );

            // Add each all-day event
            allDayEvents.forEach(ev => {
                const isDarkMode = isDarkModeEnabled();
                const evDiv = document.createElement('div');
                evDiv.className = 'all-day-event event-cell';

                // Only apply inline color if event has a custom color; let CSS handle defaults via 'event-default'
                if (ev.color) {
                    if (isDarkMode) {
                        evDiv.style.backgroundColor = `${ev.color}80`;
                        evDiv.style.color = '#e8eaed';
                        evDiv.style.borderLeft = `3px solid ${ev.color}`;
                    } else {
                        evDiv.style.backgroundColor = `${ev.color}30`;
                        evDiv.style.color = '#1a202c';
                        evDiv.style.borderLeft = `3px solid ${ev.color}`;
                    }
                } else {
                    evDiv.classList.add('event-default');
                }

                evDiv.style.cursor = 'pointer';
                evDiv.textContent = ev.title;

                evDiv.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openViewEventModal(ev.id);
                });

                dayCell.appendChild(evDiv);
            });

            // Make empty cells clickable to add new all-day events
            if (allDayEvents.length === 0) {
                dayCell.style.minHeight = '2rem';
                dayCell.style.cursor = 'pointer';
                dayCell.addEventListener('click', function () {
                    openAddEventModal(dayCell.dataset.date, 0, true);
                });
            }

            weekAllDayEvents.appendChild(dayCell);
        }
    }

    // Set header to week range, e.g., 'Jul 20 – Jul 26, 2025'
    if (currentDisplay) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const startOfWeek = new Date(year, month, day - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const options = { month: 'short', day: 'numeric' };
        let rangeStr = '';
        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
            rangeStr = `${startOfWeek.toLocaleDateString('en-US', options)} – ${endOfWeek.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
        } else {
            rangeStr = `${startOfWeek.toLocaleDateString('en-US', options)} – ${endOfWeek.toLocaleDateString('en-US', options)}, ${endOfWeek.getFullYear()}`;
        }
        currentDisplay.textContent = rangeStr;
    }
    // Show week view, hide month view
    if (monthView && weekView && yearGrid) {
        monthView.style.display = 'none';
        weekView.style.display = 'block';
        yearGrid.style.display = 'none';
    }

    // Render week header with day names and dates
    const weekDaysHeader = document.getElementById('weekDaysHeader');
    if (weekDaysHeader) {
        weekDaysHeader.innerHTML = '';
        // First column empty for time labels
        const emptyDiv = document.createElement('div');
        weekDaysHeader.appendChild(emptyDiv);
        // Calculate week days
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const startOfWeek = new Date(year, month, day - date.getDay());
        const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let d = 0; d < 7; d++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + d);
            const headerDiv = document.createElement('div');
            headerDiv.className = 'week-header-day';
            // Highlight today
            const today = new Date();
            const isToday = dayDate.getFullYear() === today.getFullYear() &&
                dayDate.getMonth() === today.getMonth() &&
                dayDate.getDate() === today.getDate();
            headerDiv.innerHTML = `<div>${weekdayNames[d]}</div><div class="text-sm${isToday ? ' today-highlight_for_month_week' : ''}">${dayDate.getDate()}</div>`;
            weekDaysHeader.appendChild(headerDiv);
        }
    }

    // Ensure drag-to-select listeners are attached
    if (weekTimeGrid) {
        enableDragSelection(weekTimeGrid);
    }

    // Clear the week time grid
    if (weekTimeGrid) {
        weekTimeGrid.innerHTML = '';
        weekTimeGrid.classList.add('time-grid');
        weekTimeGrid.style.position = 'relative';
    }

    // Define hours (unused array retained for potential future use)
    const startHour = 0;
    const endHour = 23;
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Get the start of the week (Sunday)
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const startOfWeek = new Date(year, month, day - date.getDay());

    // For each hour, create a row: first column is time label, next 7 columns are days
    for (let i = 0; i < hours.length; i++) {
        const rowHour = hours[i];

        // Time label cell
        const timeCell = document.createElement('div');
        timeCell.classList.add('time-label', 'border', 'text-xs', 'text-right', 'pr-2', 'py-1');
        const hourStr = rowHour < 12 ? `${rowHour} AM` : rowHour === 12 ? '12 PM' : rowHour === 24 ? '12 AM' : rowHour === 25 ? '1 AM' : `${rowHour - 12} PM`;
        timeCell.textContent = hourStr;
        weekTimeGrid.appendChild(timeCell);

        // 7 day cells
        for (let d = 0; d < 7; d++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('week-cell', 'day-cell', 'border', 'relative', 'h-12');

            // For future event placement, store date and hour
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + d);
            const cellDateStr = formatDateToISO(currentDay);
            dayCell.dataset.date = cellDateStr;
            dayCell.dataset.hour = rowHour;

            // Check if any event spans this hour for this day
            const eventsForCell = [];
            calendarEvents.forEach(ev => {
                // Skip all-day events as they are handled separately
                if (ev.allDay) return;
                
                // Parse event date and time
                const eventDate = new Date(ev.date);
                const cellDate = new Date(cellDateStr);
                
                // Only process events for this specific day
                if (eventDate.toDateString() !== cellDate.toDateString()) {
                    return;
                }

                // Parse start and end times
                const [startH, startM] = ev.startTime ? ev.startTime.split(":").map(Number) : [0, 0];
                let [endH, endM] = ev.endTime ? ev.endTime.split(":").map(Number) : [23, 59];
                
                // If end time is on the hour, include the previous hour
                if (endM === 0 && endH > 0) {
                    endH--;
                    endM = 59;
                }

                // Check if current hour is within event's time range
                if (rowHour >= startH && rowHour <= endH) {
                    eventsForCell.push(ev);
                }
            });

            // Process events for this cell
            eventsForCell.forEach(ev => {
                const [startH, startM] = ev.startTime ? ev.startTime.split(":").map(Number) : [0, 0];
                let [endH, endM] = ev.endTime ? ev.endTime.split(":").map(Number) : [23, 59];
                
                // Create event element
                const evDiv = document.createElement('div');
                evDiv.className = 'time-event';
                
                // Set color-related styles
                const bgColor = ev.color ? `${ev.color}CC` : '#4285F4CC';
                const borderColor = ev.color || '#4285F4';
                
                // Apply styles as CSS properties
                evDiv.style.setProperty('--event-bg-color', bgColor);
                evDiv.style.setProperty('--event-border-color', borderColor);
                
                // Reset any problematic styles
                evDiv.style.margin = '0';
                evDiv.style.position = 'absolute';
                evDiv.style.left = '2px';
                evDiv.style.right = '2px';
                evDiv.style.width = 'calc(100% - 4px)';
                evDiv.style.boxSizing = 'border-box';
                
                // Set cursor and z-index
                evDiv.style.cursor = 'pointer';
                evDiv.style.zIndex = '5';

                // Calculate position and height based on time
                const startMinute = rowHour === startH ? startM : 0;
                const endMinute = rowHour === endH ? endM : 60;
                const heightPercent = ((endMinute - startMinute) / 60) * 100;
                const topPercent = (startMinute / 60) * 100;
                
                evDiv.style.top = `${topPercent}%`;
                evDiv.style.height = `calc(${heightPercent}% - 1px)`; // Subtract 1px for border

                // Only show title in the starting hour cell
                if (rowHour === startH) {
                    const titleDiv = document.createElement('div');
                    titleDiv.className = 'font-semibold truncate';
                    titleDiv.textContent = ev.title;
                    titleDiv.style.overflow = 'hidden';
                    titleDiv.style.textOverflow = 'ellipsis';
                    titleDiv.style.whiteSpace = 'nowrap';
                    evDiv.appendChild(titleDiv);
                    
                    const timeDiv = document.createElement('div');
                    timeDiv.className = 'text-xxs opacity-90';
                    timeDiv.textContent = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')} - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                    timeDiv.style.overflow = 'hidden';
                    timeDiv.style.textOverflow = 'ellipsis';
                    timeDiv.style.whiteSpace = 'nowrap';
                    evDiv.appendChild(timeDiv);
                }

                evDiv.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openViewEventModal(ev.id);
                });

                dayCell.style.position = 'relative';
                dayCell.style.overflow = 'visible';
                dayCell.appendChild(evDiv);
            });
            // Add event by clicking empty week cell (only if not dragging)
            dayCell.addEventListener('click', function (e) {
                // Don't open modal if we're dragging or just finished dragging
                if (isDragging || weekTimeGrid.classList.contains('dragging')) {
                    return;
                }
                console.log('Week cell clicked:', { target: e.target, classList: e.target.classList, cellDateStr, rowHour });
                if (!e.target.classList.contains('week-event')) {
                    console.log('Opening Add Event modal for', cellDateStr, rowHour);
                    openAddEventModal(cellDateStr, rowHour);
                } else {
                    console.log('Click was on an event, not opening Add Event modal.');
                }
            });
            // Enable drag selection for the grid
            if (!weekTimeGrid.dataset.dragSetup) {
                enableDragSelection(weekTimeGrid);
            }
            // All-day events are now handled in the dedicated all-day row above
            weekTimeGrid.appendChild(dayCell);
        }
    }
}

// Helper to darken color for border
function darkenColor(color, percent) {
    let f = parseInt(color.slice(1), 16);
    let t = percent < 0 ? 0 : 255;
    let p = percent < 0 ? percent * -1 : percent;
    let R = f >> 16;
    let G = (f >> 8) & 0x00FF;
    let B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

function renderDayView(date) {
    console.log('renderDayView called with date:', date);

    const dayView = document.getElementById('dayView');
    const weekView = document.getElementById('weekView');
    const monthView = document.getElementById('monthView');
    const currentDisplay = document.getElementById('currentDisplay');
    const dayTimeGrid = document.getElementById('dayTimeGrid');

    if (!dayView) {
        console.error('dayView container not found');
        return;
    }
    if (!dayTimeGrid) {
        console.error('dayTimeGrid container not found');
        return;
    }

    // Clear existing grid
    dayTimeGrid.innerHTML = '';

    // Ensure grid has the right classes for selection
    dayTimeGrid.classList.add('time-grid');
    dayTimeGrid.style.position = 'relative';

    // Attach drag-to-select listeners
    enableDragSelection(dayTimeGrid);
    const dayViewContent = dayView.querySelector('.day-view-content');

    if (!dayView) {
        console.error('dayView container not found');
        return;
    }
    if (!dayTimeGrid) {
        console.error('dayTimeGrid container not found');
        return;
    }

    // Hide other views, show day view
    dayView.style.display = 'flex';
    if (weekView) weekView.style.display = 'none';
    if (monthView) monthView.style.display = 'none';
    if (yearGrid) yearGrid.style.display = 'none';

    // Set the main header (if needed)
    if (currentDisplay) {
        currentDisplay.textContent = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    }

    // Update or create day view header
    let dayViewHeader = dayView.querySelector('.day-view-header');
    if (!dayViewHeader) {
        dayViewHeader = document.createElement('div');
        dayViewHeader.classList.add('day-view-header');
        dayView.insertBefore(dayViewHeader, dayViewContent);
    } else {
        dayViewHeader.innerHTML = '';
    }

    // Highlight header if today
    const today = new Date();
    const isToday = date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

    if (isToday) {
        dayViewHeader.classList.add('day-header-today');
    } else {
        dayViewHeader.classList.remove('day-header-today');
    }

    // Set the header content
    dayViewHeader.textContent = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    // Clear the time grid
    dayTimeGrid.innerHTML = '';
    console.log('dayTimeGrid cleared, ready to populate');

    // Create a container for the time grid
    const timeGridContainer = document.createElement('div');
    timeGridContainer.className = 'day-time-grid-container';
    dayTimeGrid.appendChild(timeGridContainer);

    // Clear all-day events row
    const dayAllDayEvents = document.getElementById('dayAllDayEvents');
    if (dayAllDayEvents) {
        dayAllDayEvents.innerHTML = '';

        // Find all-day events for this day
        const allDayEvents = calendarEvents.filter(ev =>
            ev.date === formatDateToISO(date) && ev.allDay
        );

        // Add each all-day event
        allDayEvents.forEach(ev => {
            const isDarkMode = isDarkModeEnabled();
            const evDiv = document.createElement('div');
            evDiv.className = 'all-day-event px-3 py-2 rounded text-sm mb-1 inline-block mr-2';

            // Only set inline colors when event has a custom color.
            // Otherwise, let CSS control light/dark defaults using 'event-default'.
            if (ev.color) {
                if (isDarkMode) {
                    evDiv.style.backgroundColor = `${ev.color}80`;
                    evDiv.style.color = '#e8eaed';
                    evDiv.style.borderLeft = `3px solid ${ev.color}`;
                } else {
                    evDiv.style.backgroundColor = `${ev.color}30`;
                    evDiv.style.color = '#1a202c';
                    evDiv.style.borderLeft = `3px solid ${ev.color}`;
                }
            } else {
                evDiv.classList.add('event-default');
            }

            evDiv.style.cursor = 'pointer';
            evDiv.textContent = ev.title;

            evDiv.addEventListener('click', function (e) {
                e.stopPropagation();
                openViewEventModal(ev.id);
            });

            dayAllDayEvents.appendChild(evDiv);
        });

        // Add "+ Add" button if no all-day events
        if (allDayEvents.length === 0) {
            const addButton = document.createElement('button');
            addButton.className = 'text-xs hover:text-blue-500';
            addButton.innerHTML = '+ Add';
            addButton.addEventListener('click', function () {
                openAddEventModal(formatDateToISO(date), 0, true);
            });
            dayAllDayEvents.appendChild(addButton);
        }
    }

    // Define time slots (e.g., 1:00 to 24:00)
    const startHour = 1;
    const endHour = 24;
    const hours = [];
    for (let h = startHour; h <= endHour; h++) {
        hours.push(h);
    }

    // Filter timed events for the current day once
    const timedEvents = calendarEvents.filter(ev => ev.date === formatDateToISO(date) && !ev.allDay);

    // Create one row per hour; draw half-hour guideline via CSS
    for (let h = 0; h < 24; h++) {
        const row = document.createElement('div');
        row.className = 'day-time-row';

        // Time label cell
        const timeLabelCell = document.createElement('div');
        timeLabelCell.className = 'time-label-cell';
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        let displayHour = h % 12 || 12;
        const ampm = h < 12 ? 'AM' : 'PM';
        if (h === 0) displayHour = 12; // Midnight
        timeLabel.textContent = `${displayHour} ${ampm}`;
        timeLabelCell.appendChild(timeLabel);
        row.appendChild(timeLabelCell);

        // Day cell for the hour
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell hour-start';
        dayCell.dataset.date = formatDateToISO(date);
        dayCell.dataset.hour = h;
        dayCell.dataset.minute = 0;

        dayCell.addEventListener('click', (e) => {
            if (isDragging || dayTimeGrid.classList.contains('dragging') || e.target.closest('.time-event')) return;
            const rect = dayCell.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const minute = clickY < rect.height / 2 ? 0 : 30;
            const time = `${String(h).padStart(2, '0')}:${minute === 0 ? '00' : '30'}`;
            openAddEventModal(formatDateToISO(date), h, false, null, null, time);
        });

        row.appendChild(dayCell);
        timeGridContainer.appendChild(row);
    }

    // Create a separate container for timed events, positioned over the grid
    const timedEventsContainer = document.createElement('div');
    timedEventsContainer.className = 'timed-events-container';
    timedEventsContainer.style.position = 'absolute';
    timedEventsContainer.style.top = '0';
    timedEventsContainer.style.left = '60px'; // Width of the time label
    timedEventsContainer.style.right = '0';
    timedEventsContainer.style.bottom = '0';
    timedEventsContainer.style.pointerEvents = 'none'; // Allow clicks to pass through to the grid
    timeGridContainer.appendChild(timedEventsContainer);

    // Function to find overlapping events
    const getOverlappingEvents = (events) => {
        const sortedEvents = events.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
        const groups = [];
        let lastEventEnd = null;

        sortedEvents.forEach(event => {
            const eventStart = new Date(`${event.date}T${event.startTime || '00:00:00'}`);
            if (lastEventEnd && eventStart < lastEventEnd) {
                groups[groups.length - 1].push(event);
            } else {
                groups.push([event]);
            }
            const eventEnd = new Date(`${event.date}T${event.endTime || '23:59:59'}`);
            if (!lastEventEnd || eventEnd > lastEventEnd) {
                lastEventEnd = eventEnd;
            }
        });
        return groups;
    };

    const eventGroups = getOverlappingEvents(timedEvents);

    // Render timed events in the overlay container
    eventGroups.forEach(group => {
        const groupWidth = 100 / group.length;
        group.forEach((ev, index) => {
        const [startH, startM] = ev.startTime ? ev.startTime.split(':').map(Number) : [0, 0];
        const [endH, endM] = ev.endTime ? ev.endTime.split(':').map(Number) : [startH, 30];

        const totalStartMinutes = startH * 60 + startM;
        const totalEndMinutes = endH * 60 + endM;
        const durationMinutes = totalEndMinutes - totalStartMinutes;

        const evDiv = document.createElement('div');
        const isDarkMode = isDarkModeEnabled();
        evDiv.className = 'time-event';
        evDiv.textContent = ev.title;
        // Only set inline background if event has a custom color; otherwise rely on CSS per theme using 'event-default'
        if (ev.color) {
            evDiv.style.backgroundColor = isDarkMode ? `${ev.color}80` : ev.color;
            evDiv.style.color = isDarkMode ? '#e8eaed' : 'white';
        } else {
            evDiv.classList.add('event-default');
        }
        evDiv.style.position = 'absolute';
        evDiv.style.left = `${index * groupWidth}%`;
        evDiv.style.width = `${groupWidth}%`;
        evDiv.style.top = `${(totalStartMinutes / (24 * 60)) * 100}%`;
        evDiv.style.height = `${(durationMinutes / (24 * 60)) * 100}%`;
        evDiv.style.borderLeft = `3px solid ${ev.color ? darkenColor(ev.color, 20) : '#1a237e'}`;
        evDiv.style.padding = '2px 5px';
        evDiv.style.fontSize = '12px';
        evDiv.style.borderRadius = '4px';
        evDiv.style.pointerEvents = 'auto'; // Make individual events clickable

        evDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            openViewEventModal(ev.id);
        });

        timedEventsContainer.appendChild(evDiv);
        });
    });



    console.log('dayTimeGrid children after render:', dayTimeGrid.children.length);
    console.log('dayTimeGrid:', dayTimeGrid, 'children:', dayTimeGrid.children.length, 'dayView.style.display:', dayView.style.display, 'computed display:', getComputedStyle(dayView).display);
}

// Year view
function renderYearView(date) {
    // Show year view, hide others
    if (yearView) yearView.style.display = 'block';
    if (monthView) monthView.style.display = 'none';
    if (weekView) weekView.style.display = 'none';
    if (dayView) dayView.style.display = 'none';

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
            dayCell.className = 'text-center';
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
            calendarEvents = calendarEvents.filter(e => e.id !== eventId);
            if (window.localStorage) {
                localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
            }
            viewModal.hide();
            // Re-render the current view
            if (currentView === 'month') renderMonthView(currentDate);
            else if (currentView === 'week') renderWeekView(currentDate);
            else if (currentView === 'day') renderDayView(currentDate);
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

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    // Set up event listeners for view buttons
    const weekViewBtn = document.querySelector('.weekViewBtn');
    const dayViewBtn = document.querySelector('.dayViewBtn');
    const monthViewBtn = document.querySelector('.monthViewBtn');
    const yearViewBtn = document.querySelector('.yearViewBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const todayNavBtn2 = document.querySelector('.today-button');
    const addEventBtn = document.getElementById('addEventBtn');

    // View switch event listeners
    if (weekViewBtn) {
        weekViewBtn.addEventListener('click', () => {
            currentView = 'week';
            renderWeekView(currentDate);
            updateDropdownText();
        });
    }

    if (dayViewBtn) {
        dayViewBtn.addEventListener('click', () => {
            currentView = 'day';
            renderDayView(currentDate);
            updateDropdownText();
        });
    }

    if (monthViewBtn) {
        monthViewBtn.addEventListener('click', () => {
            currentView = 'month';
            renderMonthView(currentDate);
            updateDropdownText();
        });
    }

    if (yearViewBtn) {
        yearViewBtn.addEventListener('click', () => {
            currentView = 'year';
            renderYearView(currentDate);
            updateDropdownText();
        });
    }

    // Navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentView === 'month') {
                currentDate.setMonth(currentDate.getMonth() - 1);
                renderMonthView(currentDate);
            } else if (currentView === 'week') {
                currentDate.setDate(currentDate.getDate() - 7);
                renderWeekView(currentDate);
            } else if (currentView === 'day') {
                currentDate.setDate(currentDate.getDate() - 1);
                renderDayView(currentDate);
            } else if (currentView === 'year') {
                currentDate.setFullYear(currentDate.getFullYear() - 1);
                renderYearView(currentDate);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentView === 'month') {
                currentDate.setMonth(currentDate.getMonth() + 1);
                renderMonthView(currentDate);
            } else if (currentView === 'week') {
                currentDate.setDate(currentDate.getDate() + 7);
                renderWeekView(currentDate);
            } else if (currentView === 'day') {
                currentDate.setDate(currentDate.getDate() + 1);
                renderDayView(currentDate);
            } else if (currentView === 'year') {
                currentDate.setFullYear(currentDate.getFullYear() + 1);
                renderYearView(currentDate);
            }
        });
    }

    // Today button
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            currentDate = new Date();
            if (currentView === 'month') {
                renderMonthView(currentDate);
            } else if (currentView === 'week') {
                renderWeekView(currentDate);
            } else if (currentView === 'day') {
                renderDayView(currentDate);
            } else if (currentView === 'year') {
                renderYearView(currentDate);
            }
        });
    }

    // Add event button
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            // Set default date to today
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;
            openAddEventModal(todayStr);
        });
    }

    // All Day toggle logic
    const eventAllDay = document.getElementById('eventAllDay');
    const eventTimeFields = document.getElementById('eventTimeFields');
    const eventStartTime = document.getElementById('eventStartTime');
    const eventEndTime = document.getElementById('eventEndTime');

    // Render initial calendar view on page load
    if (currentView === 'month') {
        renderMonthView(currentDate);
    } else if (currentView === 'week') {
        renderWeekView(currentDate);
    } else if (currentView === 'day') {
        renderDayView(currentDate);
    } else if (currentView === 'year') {
        renderYearView(currentDate);
    }

    if (eventAllDay && eventTimeFields && eventStartTime && eventEndTime) {
        eventAllDay.addEventListener('change', function () {
            if (eventAllDay.checked) {
                eventStartTime.value = '';
                eventEndTime.value = '';
                eventStartTime.disabled = true;
                eventEndTime.disabled = true;
                eventTimeFields.classList.add('d-none');
            } else {
                eventStartTime.disabled = false;
                eventEndTime.disabled = false;
                eventTimeFields.classList.remove('d-none');
            }
        });
        // Initialize state
        eventAllDay.dispatchEvent(new Event('change'));
    }

    // --- Edit & Delete Event Modal Logic ---
    const editEventModal = document.getElementById('editEventModal');
    const editEventForm = document.getElementById('editEventForm');
    const deleteEventBtn = document.getElementById('deleteEventBtn');
    const editEventId = document.getElementById('editEventId');
    const editEventTitle = document.getElementById('editEventTitle');
    const editEventDate = document.getElementById('editEventDate');
    const editEventAllDay = document.getElementById('editEventAllDay');
    const editEventTimeFields = document.getElementById('editEventTimeFields');
    const editEventStartTime = document.getElementById('editEventStartTime');
    const editEventEndTime = document.getElementById('editEventEndTime');
    const editEventDescription = document.getElementById('editEventDescription');
    const editEventColor = document.getElementById('editEventColor');

    // All Day toggle for edit modal
    if (editEventAllDay && editEventTimeFields && editEventStartTime && editEventEndTime) {
        editEventAllDay.addEventListener('change', function () {
            if (editEventAllDay.checked) {
                editEventStartTime.value = '';
                editEventEndTime.value = '';
                editEventStartTime.disabled = true;
                editEventEndTime.disabled = true;
                editEventTimeFields.classList.add('d-none');
            } else {
                editEventStartTime.disabled = false;
                editEventEndTime.disabled = false;
                editEventTimeFields.classList.remove('d-none');
            }
        });
    }

    // Handle save changes
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

            const idx = calendarEvents.findIndex(ev => ev.id === id);
            if (idx !== -1) {
                calendarEvents[idx].title = editEventTitle.value;
                calendarEvents[idx].date = editEventDate.value;
                calendarEvents[idx].allDay = editEventAllDay.checked;
                calendarEvents[idx].startTime = (!editEventAllDay.checked && editEventStartTime) ? editEventStartTime.value : null;
                calendarEvents[idx].endTime = (!editEventAllDay.checked && editEventEndTime) ? editEventEndTime.value : null;
                calendarEvents[idx].description = editEventDescription.value;
                calendarEvents[idx].color = editEventColor.value || '#4285F4';
                // Save to localStorage
                if (window.localStorage) {
                    try { localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents)); } catch (e) { }
                }
                // Close modal and re-render
                const modal = bootstrap.Modal.getInstance(editEventModal);
                if (modal) modal.hide();
                if (currentView === 'month') {
                    renderMonthView(currentDate);
                } else if (currentView === 'week') {
                    renderWeekView(currentDate);
                } else if (currentView === 'day') {
                    renderDayView(currentDate);
                }
            }
        });
    }

    if (addEventForm) {
        console.log('Add event form found, attaching submit listener');
        addEventForm.addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Form submitted!');

            // Collect form data
            const title = document.getElementById('eventTitle').value;
            const date = document.getElementById('eventDate').value;
            const allDay = document.getElementById('eventAllDay').checked;
            const startTime = document.getElementById('eventStartTime').value;
            const endTime = document.getElementById('eventEndTime').value;
            const description = document.getElementById('eventDescription').value;
            const color = document.getElementById('eventColor').value;

            // Basic validation
            if (!allDay && (!startTime || !endTime)) {
                alert('Start time and end time are required for non-all-day events.');
                return;
            }

            if (!title || !date) {
                alert('Title and date are required.');
                return;
            }

            const newEvent = {
                id: `event-${Date.now()}`,
                title: title,
                date: date,
                allDay: allDay,
                startTime: allDay ? null : startTime,
                endTime: allDay ? null : endTime,
                description: description,
                color: color || '#4285F4'
            };

            calendarEvents.push(newEvent);
            console.log('Event added successfully. Total events:', calendarEvents.length);
            // Persist to localStorage
            if (window.localStorage) {
                try {
                    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
                } catch (e) { }
            }
            // Re-render current view
            console.log('Re-rendering current view:', currentView, currentDate);
            switch (currentView) {
                case 'month':
                    renderMonthView(currentDate);
                    break;
                case 'week':
                    renderWeekView(currentDate);
                    break;
                case 'day':
                    renderDayView(currentDate);
                    break;
                case 'year':
                    renderYearView(currentDate);
                    break;
            }
            // Close modal and clear form
            const modal = bootstrap.Modal.getInstance(addEventModal);
            if (modal) modal.hide();
            // Clear form and reset color picker
            addEventForm.reset();
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            const defaultColor = document.querySelector('.color-option[data-color="#4285F4"]');
            if (defaultColor) defaultColor.classList.add('selected');
            // Reset event color input
            const eventColorInput = document.getElementById('eventColor');
            if (eventColorInput) eventColorInput.value = '#4285F4';
            // Reset all day toggle
            if (eventAllDay) eventAllDay.dispatchEvent(new Event('change'));
        });
    }

    // Initialize view buttons in global scope and set up event listeners
    const setupViewButtons = () => {
        if (monthViewBtn) {
            monthViewBtn.addEventListener('click', () => {
                currentView = 'month';
                renderMonthView(currentDate);
                updateDropdownText();
            });
        }
        if (weekViewBtn) {
            weekViewBtn.addEventListener('click', () => {
                currentView = 'week';
                renderWeekView(currentDate);
                updateDropdownText();
            });
        }
        if (dayViewBtn) {
            dayViewBtn.addEventListener('click', () => {
                currentView = 'day';
                renderDayView(currentDate);
                updateDropdownText();
            });
        }
        if (yearViewBtn) {
            yearViewBtn.addEventListener('click', () => {
                currentView = 'year';
                renderYearView(currentDate);
                updateDropdownText();
            });
        }
    };

    setupViewButtons();

    // ---- Drag-select helper functions ----
    function enableDragSelection(gridEl) {
        if (!gridEl || gridEl.dataset.dragSetup) return; // prevent duplicates
        gridEl.dataset.dragSetup = '1';

        gridEl.addEventListener('mousedown', e => {
            const cell = e.target.closest('.day-cell');
            if (!cell) return;
            isDragging = true;
            dragStartDate = cell.dataset.date;
            dragStartHour = Number(cell.dataset.hour);
            highlightRange(gridEl, dragStartDate, dragStartHour, dragStartHour);
            e.preventDefault();
        });

        gridEl.addEventListener('mousemove', e => {
            if (!isDragging) return;
            const cell = e.target.closest('.day-cell');
            if (!cell || cell.dataset.date !== dragStartDate) return;
            const currHour = Number(cell.dataset.hour);
            highlightRange(gridEl, dragStartDate, dragStartHour, currHour);
        });

        document.addEventListener('mouseup', e => {
            if (!isDragging) return;
            isDragging = false;
            const cell = e.target.closest('.day-cell');
            let endHour = dragStartHour;
            if (cell && cell.dataset.date === dragStartDate) {
                endHour = Number(cell.dataset.hour) + 1; // make end exclusive
            } else {
                // if mouseup outside grid keep original hour+1
                endHour = dragStartHour + 1;
            }
            clearDragHighlight();
            openAddEventModal(dragStartDate, Math.min(dragStartHour, endHour - 1), false, endHour);
        });
    }

    // Update dropdown toggle text based on current view
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

    // Initialize the current view
    function initializeView() {
        // Make sure all views are hidden first
        if (monthView) monthView.style.display = 'none';
        if (weekView) weekView.style.display = 'none';
        if (dayView) dayView.style.display = 'none';
        if (yearView) yearView.style.display = 'none';

        // Show the current view
        switch (currentView) {
            case 'month':
                if (monthView) monthView.style.display = 'block';
                renderMonthView(currentDate);
                break;
            case 'week':
                if (weekView) weekView.style.display = 'block';
                renderWeekView(currentDate);
                break;
            case 'day':
                if (dayView) dayView.style.display = 'block';
                renderDayView(currentDate);
                break;
            case 'year':
                if (yearView) yearView.style.display = 'block';
                renderYearView(currentDate);
                break;
            default:
                // Default to month view
                currentView = 'month';
                if (monthView) monthView.style.display = 'block';
                renderMonthView(currentDate);
        }

        updateDropdownText();
    }

    // Initialize the calendar
    initializeView();

    // Feature menu
    const openMenuBtn = document.getElementById('openMenuBtn');
    const featureMenu = document.getElementById('featureMenu');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const overlay = document.getElementById('overlay');

    if (openMenuBtn && featureMenu) {
        openMenuBtn.addEventListener('click', () => {
            featureMenu.classList.remove('-translate-x-full');
            featureMenu.classList.add('translate-x-0');
            if (overlay) overlay.classList.remove('hidden');
        });
    }

    if (closeMenuBtn && featureMenu) {
        closeMenuBtn.addEventListener('click', () => {
            featureMenu.classList.remove('translate-x-0');
            featureMenu.classList.add('-translate-x-full');
            if (overlay) overlay.classList.add('hidden');
        });
    }

    if (overlay && featureMenu) {
        overlay.addEventListener('click', () => {
            featureMenu.classList.remove('translate-x-0');
            featureMenu.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }

    // Initialize dropdowns
    const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
    dropdownElementList.forEach(dropdownToggleEl => {
        new bootstrap.Dropdown(dropdownToggleEl);
    });

    // Initial render
    updateDropdownText();
    initializeView();
});