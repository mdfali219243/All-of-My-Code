
let currentDate = new Date();
let currentView = 'month';
let calendarEvents = [];

// Allow AI chat to create events programmatically
function createEventFromAI(event) {
    if (!event || !event.date || !event.title) {
        console.warn('createEventFromAI called with incomplete event:', event);
        return;
    }

    // Support both old format (time) and new format (startTime/endTime)
    let startTime = event.startTime || event.time || '09:00';
    let endTime = event.endTime;

    // If no end time, calculate it (start + 1 hour)
    if (!endTime) {
        const timeParts = startTime.split(':').map(Number);
        const hour = Number.isFinite(timeParts[0]) ? timeParts[0] : 9;
        const minute = Number.isFinite(timeParts[1]) ? timeParts[1] : 0;
        const endHour = (hour + 1) % 24;
        endTime = `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    const newEvent = {
        id: Date.now(),
        title: event.title,
        date: event.date,
        startTime: startTime,
        endTime: endTime,
        allDay: false,
        color: null,
    };

    calendarEvents.push(newEvent);

    if (window.localStorage) {
        try {
            localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
        } catch (e) {
            console.warn('Failed to persist AI-created event to localStorage:', e);
        }
    }

    // Re-render current view so the new event appears
    const viewMap = {
        month: renderMonthView,
        week: renderWeekView,
        day: renderDayView,
        year: renderYearView,
    };

    if (viewMap[currentView]) {
        viewMap[currentView](currentDate);
    }
}

// Expose to global scope so ai-chat.js can call it
// Duplicate updateTimeIndicator removed

// --- Alarm Feature Logic ---
function checkAlarms() {
    const now = new Date();
    const currentISO = formatDateToISO(now);
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    calendarEvents.forEach(event => {
        if (!event.alarm || event.alarm === 'none' || event.allDay) return;

        // Parse event time
        if (!event.startTime) return;
        const [eventH, eventM] = event.startTime.split(':').map(Number);

        // Parse date precisely as local date (YYYY-MM-DD)
        const [y, m, d] = event.date.split('-').map(Number);
        const eventDateTime = new Date(y, m - 1, d, eventH, eventM);

        // Calculate alarm time
        let alarmTime = new Date(eventDateTime);
        switch (event.alarm) {
            case 'at_time':
                // alarmTime is eventDateTime
                break;
            case '5_min_before':
                alarmTime.setMinutes(alarmTime.getMinutes() - 5);
                break;
            case '10_min_before':
                alarmTime.setMinutes(alarmTime.getMinutes() - 10);
                break;
            case '1_hour_before':
                alarmTime.setHours(alarmTime.getHours() - 1);
                break;
            case '1_day_before':
                alarmTime.setDate(alarmTime.getDate() - 1);
                break;
        }

        // Check if current time matches alarm time (precise to minute)
        const isAlarmTime = alarmTime.getFullYear() === now.getFullYear() &&
            alarmTime.getMonth() === now.getMonth() &&
            alarmTime.getDate() === now.getDate() &&
            alarmTime.getHours() === now.getHours() &&
            alarmTime.getMinutes() === now.getMinutes();

        const isSnoozeTime = event.snoozeTime &&
            event.snoozeTime.getFullYear() === now.getFullYear() &&
            event.snoozeTime.getMonth() === now.getMonth() &&
            event.snoozeTime.getDate() === now.getDate() &&
            event.snoozeTime.getHours() === now.getHours() &&
            event.snoozeTime.getMinutes() === now.getMinutes();

        if (isAlarmTime || isSnoozeTime) {

            if (!event.alarmTriggered) {
                // If it was a snooze, clear the snooze time
                if (isSnoozeTime) delete event.snoozeTime;

                triggerAlarm(event);
                event.alarmTriggered = true;
            }
        }
    });
}

function triggerAlarm(event) {
    const alarmSound = document.getElementById('alarmSound');
    if (alarmSound) {
        // Use event ringtone if set, otherwise global default
        const ringtoneId = (event.ringtone && event.ringtone !== 'default')
            ? event.ringtone
            : getDefaultRingtone();
        alarmSound.src = getRingtoneUrl(ringtoneId);
        alarmSound.loop = true; // Ensure continuous sound
        alarmSound.play().catch(e => console.warn("Audio play failed (user interaction needed first):", e));
    }

    // Show Alert / Notification
    if (Notification.permission === 'granted') {
        new Notification(`Alarm: ${event.title}`, {
            body: `Event starting at ${event.startTime}`,
            icon: '/image/icon.png' // Optional
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // Use a custom modal or simple alert
    // Simple alert for now as requested
    // alert(`ALARM! ${event.title} is coming up!`); 
    // Alert blocks code, let's use a nice toast or modal if possible, but for MVP standard alert is reliable.
    // Better: Create a temporary visual element.
    const alertDiv = document.createElement('div');
    alertDiv.id = 'fullScreenAlarm';
    alertDiv.className = 'fixed inset-0 bg-black/95 backdrop-blur-2xl z-[10000] flex flex-col items-center justify-between py-20 text-white animate-in-ios';
    alertDiv.innerHTML = `
        <div class="flex flex-col items-center gap-10 mt-16 text-center px-6">
            <div class="text-[120px] filter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] animate-pulse-ios">🔔</div>
            <div>
                <div class="text-xl opacity-60 font-semibold tracking-[0.2em] uppercase mb-4">Alarm</div>
                <h1 class="text-7xl font-black tracking-tight leading-tight drop-shadow-2xl">${event.title}</h1>
            </div>
        </div>
        
        <div class="flex flex-col gap-6 w-full max-w-md px-10 mb-12">
            <button id="snoozeBtn" class="w-full bg-white/10 hover:bg-white/20 active:scale-95 text-white py-8 rounded-[40px] text-3xl font-bold transition-all border-2 border-white/10 backdrop-blur-xl">Snooze (10m)</button>
            <button id="stopBtn" class="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white py-10 rounded-[40px] text-5xl font-black transition-all shadow-[0_20px_60px_-15px_rgba(220,38,38,0.6)]">STOP</button>
        </div>

        <style>
            @keyframes iphone-vibrate {
                0% { transform: scale(1); }
                10%, 30%, 50%, 70%, 90% { transform: scale(1.02) rotate(0.5deg); }
                20%, 40%, 60%, 80% { transform: scale(0.98) rotate(-0.5deg); }
                100% { transform: scale(1); }
            }
            @keyframes pulse-ios {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }
            .animate-in-ios {
                animation: fade-in-ios 0.5s ease-out, zoom-in-ios 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .animate-pulse-ios {
                animation: pulse-ios 2s ease-in-out infinite;
            }
            #fullScreenAlarm h1 {
                animation: iphone-vibrate 0.4s ease-in-out infinite;
            }
            @keyframes fade-in-ios { from { opacity: 0; } to { opacity: 1; } }
            @keyframes zoom-in-ios { from { transform: scale(0.9); } to { transform: scale(1); } }
            .fade-out-ios {
                opacity: 0;
                transform: scale(1.1);
                transition: opacity 0.4s ease-in, transform 0.4s ease-in;
            }
        </style>
    `;
    document.body.appendChild(alertDiv);

    alertDiv.querySelector('#stopBtn').addEventListener('click', () => {
        alertDiv.classList.add('fade-out-ios');
        setTimeout(() => alertDiv.remove(), 400);
        if (alarmSound) {
            alarmSound.pause();
            alarmSound.currentTime = 0;
            alarmSound.loop = false;
        }
    });

    alertDiv.querySelector('#snoozeBtn').addEventListener('click', () => {
        alertDiv.classList.add('fade-out-ios');
        setTimeout(() => alertDiv.remove(), 400);
        if (alarmSound) {
            alarmSound.pause();
            alarmSound.currentTime = 0;
            alarmSound.loop = false;
        }

        // Snooze logic: set a new alarm time 10 minutes from now
        const snoozeDate = new Date();
        snoozeDate.setMinutes(snoozeDate.getMinutes() + 10);

        // We create a temporary event for snooze or just update the current event's time for the alarm logic
        // For simplicity, let's mark the original as NOT triggered and store a "snoozeTime"
        event.alarmTriggered = false;
        event.snoozeTime = snoozeDate;

        console.log(`Alarm snoozed until: ${snoozeDate.toLocaleTimeString()}`);
    });

    // Auto dismiss after 1 minute? No, alarm should stick.
}



// Global update interval
setInterval(updateTimeIndicator, 60000); // Update time indicator every minute
setInterval(checkAlarms, 30000); // Check alarms every 30 seconds
// Also call on render

// DOM elements will be initialized after DOM is loaded
let monthView, weekView, dayView, yearView, monthGrid, weekTimeGrid, dayTimeGrid, yearGrid, currentDisplay, todayBtn;
let weekViewBtn, dayViewBtn, monthViewBtn, yearViewBtn;

// --- Drag-select globals ---
let isDragging = false;
let dragStartDate = null;
let dragStartHour = null;
let dragStartMinute = 0;
let currentHighlighted = [];

// ---- Enhanced Drag-select helper functions (global) ----
function clearDragHighlight() {
    currentHighlighted.forEach(cell => cell.classList.remove('selecting'));
    currentHighlighted = [];
    const ghost = document.getElementById('drag-ghost-event');
    if (ghost) ghost.remove();
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

// Helper to manage the ghost event element
function updateGhostEvent(gridEl, startH, startM, endH, endM, baseCell) {
    let ghost = document.getElementById('drag-ghost-event');
    if (!ghost) {
        ghost = document.createElement('div');
        ghost.id = 'drag-ghost-event';
        ghost.className = 'drag-ghost-event';
        // When creating, append to the same container as the day cell to ensure correct positioning relative to the column
        baseCell.parentNode.appendChild(ghost); // baseCell is a day-cell, we want to be in the same column/day container if possible, or usually just absolute over the cell
        // Actually, for Week View, baseCell is inside weekTimeGrid. day-cell has relative position.
        // It's better to append to the day-cell's COLUMN. 
        // In week view: weekTimeGrid contains day cells. Day cells are absolute or relative? 
        // Let's verify structure: weekTimeGrid -> day-cell. 
        // If we append to baseCell, position:absolute is relative to baseCell.
        // But we draw across multiple cells? No, dragging is usually vertical within the same day for time selection.
        // If dragging across days, that's complex. Let's assume day-constrained vertical drag for now as per previous logic.

        // REVISION: The current logic finds day-cell by hour. 
        // To draw a continuous block across multiple hour-cells, we need a common parent.
        // For WeekView, `weekTimeGrid` contains all DayCells but they are children? No, 7 day cells are COLUMNS? 
        // Let's look at renderWeekView: 
        // It creates 24 rows? NO, it creates 24 rows in my original code, or 7 columns?
        // Wait, renderWeekView structure in current code (reverted to 24 rows):
        // weekTimeGrid -> TimeLabel + 7 DayCells (for that hour).
        // This means DayCells are rows segments. 
        // To draw a vertical block across segments, we must append to `weekTimeGrid` and use absolute positioning calculated from the top.
        // But `weekTimeGrid` has `position: relative`.

        // Correct approach: Append ghost to `weekTimeGrid` (or `dayTimeGrid`).
        // Calculate Top/Height based on time.
        // Left/Width based on the column index of the baseCell.

        // Find which day column index we are in.
        // This is tricky because the DOM structure is Row-based (TR-like), not Column-based.
        // weekTimeGrid children: [Label, Day0_H0, Day1_H0...], [Label, Day0_H1...]
        // So DayCells for the same day are NOT in a common container.
        // Positioning a single div across multiple rows is hard if appended to grid.
        // UNLESS we use absolute positioning relative to the Grid.

        gridEl.appendChild(ghost);
    }

    // Ensure ghost is in the grid
    if (ghost.parentNode !== gridEl) gridEl.appendChild(ghost);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const [minTotal, maxTotal] = startTotal <= endTotal ? [startTotal, endTotal] : [endTotal, startTotal];
    const duration = maxTotal - minTotal;

    // Calculate vertical position (Top % and Height %)
    // Grid spans 24 hours.
    const topPercent = (minTotal / (24 * 60)) * 100;
    const heightPercent = (duration / (24 * 60)) * 100;

    ghost.style.top = `${topPercent}%`;
    ghost.style.height = `${heightPercent}%`;

    // Calculate horizontal position
    // We need to match the `baseCell`'s left/width. 
    // Since baseCell is a child of the grid, we can use its offsetLeft/offsetWidth? 
    // NO, baseCell is inside a flex/grid row? 
    // Actually the revert code: weekTimeGrid has `display: grid key`. 
    // `grid-template-columns: 4rem repeat(7, minmax(0, 1fr))`.
    // So distinct columns exist.
    // If we append ghost to gridEl, we can just assign it to the correct grid column!
    // But exact grid column index is needed.
    // We can find the index of the day in the row.

    // Attempt to use `baseCell.offsetLeft` and `width`.
    const cellRect = baseCell.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();

    const relativeLeft = cellRect.left - gridRect.left;
    const relativeWidth = cellRect.width;

    ghost.style.left = `${relativeLeft}px`;
    ghost.style.width = `${relativeWidth}px`;

    // Text Content
    const startH_disp = Math.floor(minTotal / 60);
    const startM_disp = minTotal % 60;
    const endH_disp = Math.floor(maxTotal / 60);
    const endM_disp = maxTotal % 60;

    const formatTime = (h, m) => {
        const ampm = h < 12 ? 'AM' : 'PM';
        const h12 = h % 12 || 12;
        const mStr = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
        return `${h12}${mStr} ${ampm}`;
    };

    const timeStr = `${formatTime(startH_disp, startM_disp)} - ${formatTime(endH_disp, endM_disp)}`;

    // Format duration
    let durStr = '';
    const hDur = Math.floor(duration / 60);
    const mDur = duration % 60;
    if (hDur > 0) durStr += `${hDur}h `;
    if (mDur > 0) durStr += `${mDur}m`;

    ghost.innerHTML = `
        <div class="ghost-time-label">${timeStr}</div>
        ${duration >= 30 ? `<div class="ghost-duration-label">(${durStr.trim()})</div>` : ''}
    `;

    return ghost;
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
            const rect = targetCell.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const quarter = Math.floor((clickY / rect.height) * 4);
            dragStartMinute = quarter * 15;
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
            const rect = overCell.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const quarter = Math.floor((clickY / rect.height) * 4);
            const currentMinute = quarter * 15;

            // Calculate end time (snapped to 15 mins)
            // If dragging, we want to visually show the selected range using the ghost event
            // We use dragStartCell as the horizontal anchor (assuming vertical drag logic for now)

            // Determine the "Edge" time. 
            // If dragging down, edge is current time + 15m.
            // If dragging up, edge is current time (start of the block).
            // Actually, simplest visual logic: 
            // Start Point: dragStartHour:dragStartMinute
            // End Point: currentHour:currentMinute + 15 (if we treat the mouse as selecting a block)
            // But for precision dragging, usually the mouse point IS the end time.
            // Let's create a range from Start to Current + 15?
            // Wait, Notion style: 
            // Click at 9:15 -> Start 9:15.
            // Drag to 10:00 -> End 10:00.
            // Range: 9:15 - 10:00.

            let targetH = currentHour;
            let targetM = currentMinute + 15;
            if (targetM >= 60) { targetH++; targetM = 0; }

            updateGhostEvent(gridEl, dragStartHour, dragStartMinute, targetH, targetM, dragStartCell);
        }
    };

    const handleMouseUp = (e) => {
        if (!isDragging) return;

        const endCell = viewType === 'month' ? e.target.closest('.month-cell') : e.target.closest('.day-cell');

        if (dragStartCell && endCell) {
            if (viewType === 'month') {
                if (dragStartCell !== endCell) {
                    openAddEventModal(dragStartDate, null, true, null, endCell.dataset.date);
                }
            } else {
                const endH = Number(endCell.dataset.hour);
                const rect = endCell.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const quarter = Math.floor((clickY / rect.height) * 4);
                const endM = quarter * 15;

                // If dragging downwards, the end time should be 15 mins after the end cell start position
                let finalEndH = endH;
                let finalEndM = endM + 15;
                if (finalEndM >= 60) {
                    finalEndH++;
                    finalEndM = 0;
                }

                const startT = dragStartHour * 60 + dragStartMinute;
                const endT = endH * 60 + endM;

                if (startT <= endT) {
                    openAddEventModal(dragStartDate, dragStartHour, false, finalEndH, null, dragStartMinute, finalEndM);
                } else {
                    // Dragged upwards
                    let actualStartH = endH;
                    let actualStartM = endM;
                    let actualEndH = dragStartHour;
                    let actualEndM = dragStartMinute + 15;
                    if (actualEndM >= 60) { actualEndH++; actualEndM = 0; }
                    openAddEventModal(dragStartDate, actualStartH, false, actualEndH, null, actualStartM, actualEndM);
                }
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
            if (currentView === 'month') {
                currentDate.setDate(1);
                currentDate.setMonth(currentDate.getMonth() - 1);
            }
            else if (currentView === 'week') currentDate.setDate(currentDate.getDate() - 7);
            else if (currentView === 'day') currentDate.setDate(currentDate.getDate() - 1);
            else if (currentView === 'year') currentDate.setFullYear(currentDate.getFullYear() - 1);
            viewButtons.find(v => v.view === currentView)?.render(currentDate);
            updateDropdownText();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentView === 'month') {
                currentDate.setDate(1);
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
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

/**
 * Generates all occurrences of events (including recurring ones) within a date range.
 */
function getEventsForRange(startDate, endDate) {
    const results = [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    calendarEvents.forEach(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);

        if (event.recurrence === 'none' || !event.recurrence) {
            if (eventDate >= start && eventDate <= end) {
                results.push(event);
            }
        } else {
            // Recurring event
            let current = new Date(eventDate);

            // Limit generation to avoid infinite loops or excessive memory
            const limit = new Date(start);
            limit.setFullYear(limit.getFullYear() + 2); // 2 years max projection

            while (current <= end && current <= limit) {
                if (current >= start) {
                    results.push({
                        ...event,
                        date: formatDateToISO(current),
                        originalId: event.id,
                        id: `${event.id}-${formatDateToISO(current)}` // Unique ID for the instance
                    });
                }

                // Increment based on recurrence rule
                switch (event.recurrence) {
                    case 'daily':
                        current.setDate(current.getDate() + 1);
                        break;
                    case 'weekly':
                        current.setDate(current.getDate() + 7);
                        break;
                    case 'monthly':
                        current.setMonth(current.setMonth() + 1);
                        break;
                    case 'yearly':
                        current.setFullYear(current.getFullYear() + 1);
                        break;
                    default:
                        current = new Date(end.getTime() + 1); // Break
                }
            }
        }
    });
    return results;
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
    const startDayIndex = firstDayOfMonth.getDay(); // 0 for Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    // Calculate the start date for the grid (including previous month's days)
    const startDate = new Date(year, month, 1 - startDayIndex);

    // Iterate 6 rows * 7 columns = 42 cells
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const currentDayDate = new Date(startDate);
            currentDayDate.setDate(startDate.getDate() + (row * 7) + col);

            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day', 'month-cell', 'py-2', 'relative');

            // Determine if it's current month
            const isCurrentMonth = currentDayDate.getMonth() === month;
            if (!isCurrentMonth) {
                dayDiv.classList.add('non-current-month', 'text-gray-400');
            }

            dayDiv.textContent = currentDayDate.getDate();
            dayDiv.dataset.date = formatDateToISO(currentDayDate);

            // highlighting the today's date
            const today = new Date();
            if (currentDayDate.getDate() === today.getDate() &&
                currentDayDate.getMonth() === today.getMonth() &&
                currentDayDate.getFullYear() === today.getFullYear()) {
                dayDiv.innerHTML = `<span class="today-highlight_for_month_week">${currentDayDate.getDate()}</span>`;
                dayDiv.classList.add('today-container');
            }

            // Render events for this date
            const cellDateStr = formatDateToISO(currentDayDate);
            const eventsForDay = getEventsForRange(currentDayDate, currentDayDate);
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
    }

    // adding the click event to the days of the month
    if (monthGrid) {
        monthGrid.querySelectorAll('.calendar-day.month-cell').forEach(dayDiv => {
            dayDiv.addEventListener('click', (e) => {
                // Only open add modal if not clicking on an event
                if (e.target.closest('.month-event')) return;
                openAddEventModal(dayDiv.dataset.date);
            });
        });

        // Enable drag selection for month view
        enableDragSelection(monthGrid, 'month');
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

    // Clear all-day events container if needed (though we populate it below)
    const weekAllDayEvents = document.getElementById('weekAllDayEvents');
    const weekGridContent = document.getElementById('weekGridContent');
    if (weekGridContent) {
        weekGridContent.innerHTML = '';
        // The time grid is actually rendered in the loop below creating rows
    }
    if (weekAllDayEvents) {
        weekAllDayEvents.innerHTML = '';

        // Create a cell for each day of the week
        for (let d = 0; d < 7; d++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell p-1 min-h-[2rem]';
            dayCell.dataset.date = formatDateToISO(new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + d));

            // Find all-day events for this day
            const startOfThisDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + d);
            const allDayEvents = getEventsForRange(startOfThisDay, startOfThisDay).filter(ev => ev.allDay);

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
    for (let h = 0; h < 24; h++) {
        const rowHour = h;

        // Time label cell
        const timeCell = document.createElement('div');
        timeCell.classList.add('time-label', 'text-xs', 'text-right', 'pr-2', 'py-1');
        const displayHour = rowHour === 0 ? 12 : rowHour > 12 ? rowHour - 12 : rowHour;
        const ampm = rowHour < 12 ? 'AM' : 'PM';
        timeCell.textContent = `${displayHour} ${ampm}`;
        weekTimeGrid.appendChild(timeCell);

        // 7 day cells
        for (let d = 0; d < 7; d++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day-cell', 'relative', 'h-12'); // Fixed height of 48px (h-12)
            // For future event placement, store date and hour
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + d);
            const cellDateStr = formatDateToISO(currentDay);
            dayCell.dataset.date = cellDateStr;
            dayCell.dataset.hour = rowHour;

            dayCell.addEventListener('click', function (e) {
                if (isDragging || weekTimeGrid.classList.contains('dragging') || e.target.closest('.time-event')) return;
                const rect = dayCell.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const quarter = Math.floor((clickY / rect.height) * 4);
                const minute = quarter * 15;
                openAddEventModal(cellDateStr, rowHour, false, null, null, minute);
            });

            weekTimeGrid.appendChild(dayCell);
        }
    }

    // --- Create Absolute Events Layer for Week View ---
    const eventsOverlay = document.createElement('div');
    eventsOverlay.className = 'week-events-overlay';
    eventsOverlay.style.position = 'absolute';
    eventsOverlay.style.top = '0';
    eventsOverlay.style.left = '0';
    eventsOverlay.style.width = '100%';
    eventsOverlay.style.height = '100%';
    eventsOverlay.style.display = 'grid';
    // Match the 4rem + 7 cols structure
    eventsOverlay.style.gridTemplateColumns = '4rem repeat(7, minmax(0, 1fr))';
    eventsOverlay.style.pointerEvents = 'none'; // Clicks pass through to grid

    // Append spacer
    eventsOverlay.appendChild(document.createElement('div'));

    // Create 7 column containers for events
    for (let d = 0; d < 7; d++) {
        const colContainer = document.createElement('div');
        colContainer.style.position = 'relative';
        colContainer.style.height = '100%';
        colContainer.style.pointerEvents = 'none';

        const currentDay = new Date(startOfWeek);
        currentDay.setDate(startOfWeek.getDate() + d);

        // Filter events for this day
        // We use getOverlappingEvents helper for correct layout
        const startOfDay = new Date(currentDay); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDay); endOfDay.setHours(23, 59, 59, 999);
        const dayEvents = getEventsForRange(startOfDay, endOfDay).filter(ev => !ev.allDay);

        // Simple overlap logic similar to Day View
        // Or simpler: just absolute positioning for now. 
        // If we want Notion-style overlapping (side-by-side), we need logic.
        // For now, let's just render them absolute to confirm "continuous block" look.

        dayEvents.forEach(ev => {
            const [startH, startM] = ev.startTime ? ev.startTime.split(':').map(Number) : [0, 0];
            const [endH, endM] = ev.endTime ? ev.endTime.split(':').map(Number) : [startH, 30]; // Default 30 min?

            const startTotal = startH * 60 + startM;
            const endTotal = endH * 60 + endM;
            const duration = endTotal - startTotal;

            const evDiv = document.createElement('div');
            evDiv.className = 'time-event';
            evDiv.textContent = ev.title;
            // Styling
            const bgColor = ev.color ? `${ev.color}E6` : '#4285F4E6'; // Slightly higher opacity
            const borderColor = ev.color || '#4285F4';
            evDiv.style.backgroundColor = bgColor;
            evDiv.style.borderLeft = `3px solid ${borderColor}`;
            evDiv.style.color = '#fff';
            evDiv.style.borderRadius = '4px';
            evDiv.style.padding = '2px 4px';
            evDiv.style.fontSize = '12px';
            evDiv.style.overflow = 'hidden';
            evDiv.style.boxSizing = 'border-box';

            // Positioning (Full height 24h = 100%)
            evDiv.style.position = 'absolute';
            evDiv.style.top = `${(startTotal / 1440) * 100}%`;
            evDiv.style.height = `${(duration / 1440) * 100}%`;
            // Temporary: full width until overlap logic is refined
            evDiv.style.left = '2px';
            evDiv.style.right = '2px';
            evDiv.style.pointerEvents = 'auto'; // allow clicking events
            evDiv.style.cursor = 'pointer';

            // Details
            // Title (already set textContent, but structured is better)
            evDiv.innerHTML = `
                <div class="font-semibold truncate" style="font-size:11px;">${ev.title}</div>
                <div class="text-xxs opacity-90" style="font-size:10px;">${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')} - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}</div>
              `;

            evDiv.addEventListener('click', function (e) {
                e.stopPropagation();
                openViewEventModal(ev.id);
            });

            colContainer.appendChild(evDiv);
        });

        eventsOverlay.appendChild(colContainer);
    }

    // Append overlay to grid. Note: Grid MUST be relative for this to work relative to it
    // weekTimeGrid has style.position = 'relative' set above.
    weekTimeGrid.appendChild(eventsOverlay);
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
        const allDayEvents = getEventsForRange(date, date).filter(ev => ev.allDay);

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
    const timedEvents = getEventsForRange(date, date).filter(ev => !ev.allDay);

    // Create one row per hour; draw half-hour guideline via CSS
    // Create one row per hour (24 rows total)
    for (let h = 0; h < 24; h++) {
        const row = document.createElement('div');
        row.className = 'day-time-row';

        // Time label cell
        const timeLabelCell = document.createElement('div');
        timeLabelCell.className = 'time-label-cell';
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';

        const displayHour = h % 12 || 12;
        const ampm = h < 12 ? 'AM' : 'PM';
        timeLabel.textContent = `${displayHour} ${ampm}`;

        timeLabelCell.appendChild(timeLabel);
        row.appendChild(timeLabelCell);

        // Day cell for the hour
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        dayCell.style.height = '48px';

        dayCell.dataset.date = formatDateToISO(date);
        dayCell.dataset.hour = h;

        dayCell.addEventListener('click', (e) => {
            if (isDragging || dayTimeGrid.classList.contains('dragging') || e.target.closest('.time-event')) return;
            const rect = dayCell.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const quarter = Math.floor((clickY / rect.height) * 4);
            const minute = quarter * 15;
            openAddEventModal(formatDateToISO(date), h, false, null, null, minute);
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
        const today = new Date();
        const isCurrentYear = year === today.getFullYear();
        const isCurrentMonth = m === today.getMonth();

        for (let d = 1; d <= daysInMonth; d++) {
            const dayCell = document.createElement('div');
            dayCell.textContent = d;
            dayCell.className = 'text-center text-xs p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full';

            if (isCurrentYear && isCurrentMonth && d === today.getDate()) {
                // Highlight today with RED background and WHITE text
                dayCell.setAttribute('style', 'background-color: #ef4444 !important; color: #ffffff !important; font-weight: 700 !important; border-radius: 50%;');
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

function openAddEventModal(date, hour, isAllDay = false, endHour = null, endDate = null, minute = 0, endMinute = null) {
    const eventDateInput = document.getElementById('eventDate');
    const eventStartTime = document.getElementById('eventStartTime');
    const eventEndTime = document.getElementById('eventEndTime');
    const eventAllDay = document.getElementById('eventAllDay');
    const timeFields = document.getElementById('eventTimeFields');
    const eventTitle = document.getElementById('eventTitle');

    // Clear previous values
    if (eventTitle) eventTitle.value = '';
    const eventRingtone = document.getElementById('eventRingtone');
    if (eventRingtone) eventRingtone.value = 'default';

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
            let startH = hour;
            let startM = minute || 0;
            let endH, endM;

            if (endHour !== null) {
                endH = endHour;
                endM = endMinute !== null ? endMinute : 0;
            } else {
                // Default duration 1 hour
                endH = startH + 1;
                endM = startM;
                if (endH >= 24) {
                    endH = 23;
                    endM = 59;
                }
            }

            const startVal = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
            const endVal = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
            if (eventStartTime) eventStartTime.value = startVal;
            if (eventEndTime) eventEndTime.value = endVal;
        }
    }

    const modal = new bootstrap.Modal(document.getElementById('addEventModal'));
    modal.show();
    // Initial call to set position
    updateTimeIndicator();
}

// Update current time indicator position
function updateTimeIndicator() {
    const today = new Date();
    const currentHour = today.getHours();
    const minutes = today.getMinutes();
    const topPercent = (minutes / 60) * 100;

    // Helper to create the indicator element
    const createIndicator = () => {
        const el = document.createElement('div');
        el.className = 'current-time-indicator-line';
        el.style.position = 'absolute';
        el.style.left = '0';
        el.style.right = '0';
        el.style.height = '2px';
        el.style.backgroundColor = '#ea4335';
        el.style.zIndex = '50';
        el.style.pointerEvents = 'none';

        const knob = document.createElement('div');
        knob.style.position = 'absolute';
        knob.style.width = '12px';
        knob.style.height = '12px';
        knob.style.backgroundColor = '#ea4335';
        knob.style.borderRadius = '50%';
        knob.style.top = '-5px';
        knob.style.left = '-6px';
        el.appendChild(knob);
        return el;
    };

    // Remove existing indicators
    document.querySelectorAll('.current-time-indicator-line').forEach(el => el.remove());

    const todayISO = formatDateToISO(today);

    let activeViews = [];
    if (currentView === 'week' && weekTimeGrid) {
        activeViews.push(weekTimeGrid);
    } else if (currentView === 'day') {
        const dayGrid = document.getElementById('dayTimeGrid');
        if (dayGrid) activeViews.push(dayGrid);
    }

    activeViews.forEach(viewContainer => {
        // Selector needs to handle the structure: .day-cell[data-date="YYYY-MM-DD"][data-hour="H"]
        const selector = `.day-cell[data-date="${todayISO}"][data-hour="${currentHour}"]`;
        const cell = viewContainer.querySelector(selector);

        if (cell) {
            const indicator = createIndicator();
            indicator.style.top = `${topPercent}%`;
            cell.appendChild(indicator);
            // Allow knob to be visible outside the cell
            cell.style.overflow = 'visible';
        }
    });

    // Special handling for Day View if it uses a different structure or simply didn't catch above
    // (e.g. if dayTimeGrid is rebuilt dynamically differently)
    if (currentView === 'day') {
        // Double check specific id container if generic dayTimeGrid query failed or if structure is nested
        const dayContainer = document.querySelector('.day-time-grid-container');
        if (dayContainer) {
            const selector = `.day-cell[data-date="${todayISO}"][data-hour="${currentHour}"]`;
            const cell = dayContainer.querySelector(selector);
            // Avoid adding duplicate if we already added it via dayTimeGrid
            if (cell && !cell.querySelector('.current-time-indicator-line')) {
                const indicator = createIndicator();
                indicator.style.top = `${topPercent}%`;
                cell.appendChild(indicator);
                cell.style.overflow = 'visible';
            }
        }
    }
}
function formatTime12Hour(timeString) {
    if (!timeString) return '';
    const [hour, minute] = timeString.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

function openViewEventModal(eventId) {
    let event = calendarEvents.find(e => e.id === eventId);
    if (!event) {
        // Check if it's an instance ID
        const masterId = eventId.split('-').slice(0, 2).join('-'); // Reconstruct event-Date.now()
        event = calendarEvents.find(e => e.id === masterId);
    }
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
        openEditEventModal(event.id);
    };

    document.getElementById('deleteEventBtn').onclick = () => {
        if (confirm('Are you sure you want to delete this event?')) {
            calendarEvents = calendarEvents.filter(e => e.id !== event.id);
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
    let event = calendarEvents.find(ev => ev.id === eventId);
    if (!event) {
        // Check if it's an instance ID
        const masterId = eventId.split('-').slice(0, 2).join('-');
        event = calendarEvents.find(e => e.id === masterId);
    }
    if (!event) return;

    editEventId.value = event.id;
    editEventTitle.value = event.title;
    editEventDate.value = event.date;
    editEventAllDay.checked = event.allDay || false;
    editEventStartTime.value = event.startTime || '';
    editEventEndTime.value = event.endTime || '';
    editEventDescription.value = event.description || '';
    editEventColor.value = event.color || '#4285F4';
    const ringtoneSelect = document.getElementById('editEventRingtone');
    if (ringtoneSelect) ringtoneSelect.value = event.ringtone || 'default';
    const recurrenceSelect = document.getElementById('editEventRecurrence');
    if (recurrenceSelect) recurrenceSelect.value = event.recurrence || 'none';
    document.getElementById('editEventAlarm').value = event.alarm || 'none';

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

    // Populate ringtone dropdowns
    const eventRingtone = document.getElementById('eventRingtone');
    const editEventRingtone = document.getElementById('editEventRingtone');
    if (eventRingtone) populateRingtoneSelect(eventRingtone, true);
    if (editEventRingtone) populateRingtoneSelect(editEventRingtone, true);

    // View switch event listeners
    // View switch event listeners for the new select element
    const viewSelect = document.getElementById('viewSelect');
    if (viewSelect) {
        viewSelect.addEventListener('change', (e) => {
            currentView = e.target.value;
            switch (currentView) {
                case 'month': renderMonthView(currentDate); break;
                case 'week': renderWeekView(currentDate); updateTimeIndicator(); break;
                case 'day': renderDayView(currentDate); updateTimeIndicator(); break;
                case 'year': renderYearView(currentDate); break;
            }
        });
    }

    // Navigation buttons are already handled in the earlier initialization block

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
        updateTimeIndicator();
    } else if (currentView === 'day') {
        renderDayView(currentDate);
        updateTimeIndicator();
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

            // Find event by ID (handle both string and number IDs)
            const idx = calendarEvents.findIndex(ev => String(ev.id) === String(id));
            if (idx !== -1) {
                calendarEvents[idx].title = editEventTitle.value;
                calendarEvents[idx].date = editEventDate.value;
                calendarEvents[idx].allDay = editEventAllDay.checked;
                calendarEvents[idx].startTime = (!editEventAllDay.checked && editEventStartTime) ? editEventStartTime.value : null;
                calendarEvents[idx].endTime = (!editEventAllDay.checked && editEventEndTime) ? editEventEndTime.value : null;
                calendarEvents[idx].description = editEventDescription.value;
                calendarEvents[idx].color = editEventColor.value || '#4285F4';
                const ringtoneSelect = document.getElementById('editEventRingtone');
                calendarEvents[idx].ringtone = ringtoneSelect ? ringtoneSelect.value : 'default';
                calendarEvents[idx].alarm = document.getElementById('editEventAlarm').value;
                const recurrenceSelect = document.getElementById('editEventRecurrence');
                calendarEvents[idx].recurrence = recurrenceSelect ? recurrenceSelect.value : 'none';
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
            const ringtoneSelect = document.getElementById('eventRingtone');
            const ringtone = ringtoneSelect ? ringtoneSelect.value : 'default';
            const alarm = document.getElementById('eventAlarm').value;

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
                color: color || '#4285F4',
                alarm: alarm || 'none',
                ringtone: ringtone || 'default',
                recurrence: document.getElementById('eventRecurrence').value || 'none'
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

            // If this event was created from a task, mark the task as scheduled
            const taskId = document.getElementById('eventTaskId').value;
            if (taskId) {
                syncScheduledTask(taskId);
                document.getElementById('eventTaskId').value = '';
            }
        });
    }

    function syncScheduledTask(taskId) {
        const savedState = JSON.parse(localStorage.getItem('kanban-board') || '{}');
        let taskFound = false;
        Object.keys(savedState).forEach(colId => {
            if (Array.isArray(savedState[colId])) {
                savedState[colId] = savedState[colId].map(task => {
                    if (String(task.id) === String(taskId)) {
                        taskFound = true;
                        return { ...task, scheduled: true };
                    }
                    return task;
                });
            }
        });

        if (taskFound) {
            localStorage.setItem('kanban-board', JSON.stringify(savedState));
            loadTasksToSidebar();
            // Also notify the tasks page if it's open (via storage event)
            window.dispatchEvent(new Event('storage'));
        }
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

    // Update view select value based on current view
    function updateDropdownText() {
        const viewSelect = document.getElementById('viewSelect');
        if (viewSelect) {
            viewSelect.value = currentView;
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

    // Floating Chat Focus Effects
    const chatInput = document.getElementById('calendarChatInput');
    const aiChatToggleBtn = document.getElementById('aiChatToggleBtn');

    if (aiChatToggleBtn && chatInput) {
        aiChatToggleBtn.addEventListener('click', () => {
            chatInput.focus();
        });
    }

    const chatSendBtn = document.getElementById('calendarChatSendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const mainView = document.getElementById('main_view');
    const header = document.querySelector('.header');
    const chatOverlay = document.getElementById('chatOverlay');
    const closeChatBtn = document.getElementById('closeChatBtn');

    if (chatInput) {
        // When chat is focused, blur background and show overlay
        chatInput.addEventListener('focus', () => {
            if (mainView) mainView.classList.add('blur-content');
            if (header) header.classList.add('blur-content');
            if (chatOverlay) chatOverlay.classList.add('active');
            if (closeChatBtn) closeChatBtn.style.display = 'flex';
        });

        // Function to close chat focus
        // param endChat: boolean, if true, clears the chat session (for close button)
        const closeChatFocus = (endChat = false) => {
            console.log('closeChatFocus called', { endChat });
            if (mainView) mainView.classList.remove('blur-content');
            if (header) header.classList.remove('blur-content');
            if (chatOverlay) chatOverlay.classList.remove('active');
            if (closeChatBtn) closeChatBtn.style.display = 'none';
            chatInput.blur(); // Remove focus from input

            // Clear chat session ONLY if requested (Close button)
            if (endChat) {
                console.log('Clearing chat history due to endChat=true');
                if (chatMessages) chatMessages.innerHTML = '';
                chatInput.value = '';

                // Tell server to reset conversation history
                fetch('http://127.0.0.1:5001/api/reset', {
                    method: 'POST'
                }).catch(err => console.error("Failed to reset chat:", err));
            }
        };

        // Clicking the overlay closes the chat session (removes blur) - PRESERVE HISTORY
        if (chatOverlay) {
            chatOverlay.addEventListener('click', () => closeChatFocus(false));
        }

        // Clicking the close button also closes the chat session - CLEAR HISTORY
        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', () => closeChatFocus(true));
        }

        // Debug: Check for page unload
        window.addEventListener('beforeunload', (e) => {
            console.log('Page is unloading/reloading!');
            // Uncomment next line to pause on reload for debugging
            // e.preventDefault(); e.returnValue = ''; 
        });

        // Chat Logic
        const handleChatSubmit = () => {
            console.log('handleChatSubmit called');
            const text = chatInput.value.trim();
            if (!text) return;

            // 1. Add User Message
            addMessage(text, 'user');
            chatInput.value = '';

            // 2. Call AI Backend
            const loadingBubble = document.createElement('div');
            loadingBubble.classList.add('message-bubble', 'ai', 'loading');
            loadingBubble.textContent = '...';
            chatMessages.appendChild(loadingBubble);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            console.log('Sending fetch request to backend...');
            fetch('http://127.0.0.1:5001/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            })
                .then(response => {
                    console.log('Fetch response received:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Data received from backend:', data);
                    loadingBubble.remove();
                    const reply = data.reply || "I'm having trouble connecting to my brain right now.";
                    addMessage(reply, 'ai');

                    // Process any actions from the AI
                    if (data.actions && data.actions.length > 0) {
                        console.log('Processing actions:', data.actions);
                        data.actions.forEach(action => {
                            if (action.type === 'ADD_EVENT' && action.data) {
                                // Use existing createEventFromAI function
                                console.log('Creating event from AI');
                                createEventFromAI({
                                    title: action.data.title,
                                    date: action.data.date,
                                    startTime: action.data.startTime || action.data.time,
                                    endTime: action.data.endTime
                                });
                            }
                            if (action.type === 'ADD_TASK' && action.data) {
                                // Save task to localStorage (tasks are on separate page)
                                console.log('Creating task from AI');
                                const savedState = JSON.parse(localStorage.getItem('kanban-board') || '{}');
                                if (!savedState['todo-list']) savedState['todo-list'] = [];
                                savedState['todo-list'].push(action.data.title);
                                localStorage.setItem('kanban-board', JSON.stringify(savedState));
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error('Fetch Error:', error);
                    loadingBubble.remove();
                    addMessage("Sorry, I can't connect to the server. Is it running?", 'ai');
                });
        };

        const addMessage = (text, sender) => {
            console.log('addMessage called', { text, sender });
            if (!chatMessages) {
                console.error('chatMessages container missing!');
                return;
            }
            const bubble = document.createElement('div');
            bubble.classList.add('message-bubble', sender);
            bubble.textContent = text;
            chatMessages.appendChild(bubble);
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };

        if (chatSendBtn) {
            chatSendBtn.addEventListener('click', handleChatSubmit);
        }

        // Use global keydown to ensure we catch it
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.activeElement === chatInput) {
                console.log('Global Enter detected on chat input');
                e.preventDefault();
                e.stopPropagation(); // Stop other listeners
                handleChatSubmit();
            }
        });
    }

    // --- Task Time Blocking Logic ---
    const tasksSidebar = document.getElementById('tasksSidebar');
    const tasksToggleBtn = document.getElementById('tasksToggleBtn');
    const closeTasksSidebarBtn = document.getElementById('closeTasksSidebarBtn');
    const tasksSidebarContent = document.getElementById('tasksSidebarContent');

    if (tasksToggleBtn && tasksSidebar) {
        tasksToggleBtn.addEventListener('click', () => {
            tasksSidebar.classList.toggle('collapsed');
            tasksToggleBtn.classList.toggle('active');
            if (!tasksSidebar.classList.contains('collapsed')) {
                loadTasksToSidebar();
            }
        });
    }

    if (closeTasksSidebarBtn && tasksSidebar) {
        closeTasksSidebarBtn.addEventListener('click', () => {
            tasksSidebar.classList.add('collapsed');
            tasksToggleBtn.classList.remove('active');
        });
    }

    function loadTasksToSidebar() {
        if (!tasksSidebarContent) return;

        const savedState = JSON.parse(localStorage.getItem('kanban-board') || '{}');
        const allTasks = [];

        // Flatten tasks from all columns
        Object.keys(savedState).forEach(colId => {
            if (Array.isArray(savedState[colId])) {
                savedState[colId].forEach(task => {
                    // Only show tasks that are NOT completed and NOT already scheduled
                    if (!task.completed && !task.scheduled) {
                        allTasks.push(task);
                    }
                });
            }
        });

        renderTasksToSidebar(allTasks);
    }

    function renderTasksToSidebar(tasks) {
        if (!tasksSidebarContent) return;
        tasksSidebarContent.innerHTML = '';

        if (tasks.length === 0) {
            tasksSidebarContent.innerHTML = '<div class="text-center text-gray-500 py-8">No active tasks found.</div>';
            return;
        }

        tasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'sidebar-task-card drag-item';
            taskEl.draggable = true;
            taskEl.dataset.taskId = task.id;
            taskEl.dataset.taskTitle = task.text;
            taskEl.dataset.taskDuration = task.duration || '60';

            taskEl.innerHTML = `
                <div class="task-title">${task.text}</div>
                <div class="task-meta">
                    ${task.duration ? `<span><i class="far fa-clock"></i> ${task.duration}m</span>` : ''}
                    ${task.dueDate ? `<span><i class="far fa-calendar-alt"></i> ${task.dueDate}</span>` : ''}
                </div>
            `;

            taskEl.addEventListener('dragstart', (e) => {
                taskEl.classList.add('dragging');
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    id: task.id,
                    title: task.text,
                    duration: task.duration || '60'
                }));
            });

            taskEl.addEventListener('dragend', () => {
                taskEl.classList.remove('dragging');
            });

            tasksSidebarContent.appendChild(taskEl);
        });
    }

    // Initialize Drop Targets for all day cells
    function setupCalendarDropTargets() {
        document.querySelectorAll('.day-cell').forEach(cell => {
            if (cell.dataset.dropSetup) return;
            cell.dataset.dropSetup = 'true';

            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                cell.classList.add('drag-over');
            });

            cell.addEventListener('dragleave', () => {
                cell.classList.remove('drag-over');
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                cell.classList.remove('drag-over');

                try {
                    const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const date = cell.dataset.date;
                    const hour = parseInt(cell.dataset.hour);
                    const minute = parseInt(cell.dataset.minute || 0);

                    if (date && !isNaN(hour)) {
                        const duration = parseInt(taskData.duration) || 60;
                        const startH = hour;
                        const rect = cell.getBoundingClientRect();
                        const dropY = e.clientY - rect.top;
                        const quarter = Math.floor((dropY / rect.height) * 4);
                        const startM = quarter * 15;

                        const totalStartMinutes = startH * 60 + startM;
                        const totalEndMinutes = totalStartMinutes + duration;

                        const endM = totalEndMinutes % 60;
                        const endH = Math.min(23, Math.floor(totalEndMinutes / 60));
                        const finalEndM = totalEndMinutes >= 24 * 60 ? 59 : endM;

                        const startTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
                        const endTime = `${String(endH).padStart(2, '0')}:${String(finalEndM).padStart(2, '0')}`;

                        // Open modal with prefilled data
                        const eventTitle = document.getElementById('eventTitle');
                        const eventDate = document.getElementById('eventDate');
                        const eventStartTime = document.getElementById('eventStartTime');
                        const eventEndTime = document.getElementById('eventEndTime');
                        const eventDescription = document.getElementById('eventDescription');

                        if (eventTitle) eventTitle.value = taskData.title;
                        if (eventDate) eventDate.value = date;
                        if (eventStartTime) eventStartTime.value = startTime;
                        if (eventEndTime) eventEndTime.value = endTime;
                        if (eventDescription) eventDescription.value = `Scheduled from task: ${taskData.title}`;
                        const eventTaskId = document.getElementById('eventTaskId');
                        if (eventTaskId) eventTaskId.value = taskData.id;

                        const modal = new bootstrap.Modal(document.getElementById('addEventModal'));
                        modal.show();
                    }
                } catch (err) {
                    console.error('Drop error:', err);
                }
            });
        });
    }

    // Hook into render functions to re-setup drop targets
    const originalRenderWeekView = renderWeekView;
    renderWeekView = function (date) {
        originalRenderWeekView(date);
        setupCalendarDropTargets();
    };

    const originalRenderDayView = renderDayView;
    renderDayView = function (date) {
        originalRenderDayView(date);
        setupCalendarDropTargets();
    };

    const originalRenderMonthView = renderMonthView;
    renderMonthView = function (date) {
        originalRenderMonthView(date);
        // For month view, we might want different drop logic or just basic day selection
        setupCalendarDropTargetsForMonth();
    };

    function setupCalendarDropTargetsForMonth() {
        document.querySelectorAll('.month-day').forEach(cell => {
            if (cell.dataset.dropSetup) return;
            cell.dataset.dropSetup = 'true';

            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                cell.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
            });

            cell.addEventListener('dragleave', () => {
                cell.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                cell.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');

                try {
                    const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const date = cell.dataset.date;

                    if (date) {
                        openAddEventModal(date, 9, false, 10); // Default to 9 AM - 10 AM on that day
                        const eventTitle = document.getElementById('eventTitle');
                        const eventTaskId = document.getElementById('eventTaskId');
                        if (eventTitle) eventTitle.value = taskData.title;
                        if (eventTaskId) eventTaskId.value = taskData.id;
                    }
                } catch (err) {
                    console.error('Drop error:', err);
                }
            });
        });
    }

    // Initial load
    if (tasksSidebar && !tasksSidebar.classList.contains('collapsed')) {
        loadTasksToSidebar();
    }
    setupCalendarDropTargets();
    setupCalendarDropTargetsForMonth();

});