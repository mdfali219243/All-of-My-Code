let calendarEvents = [];
document.addEventListener('DOMContentLoaded', function () {
    // Feature Menu Dropdown function
    var btn = document.getElementById('featureMenuBtn');
    var dropdown = document.getElementById('featureDropdown');
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', function () {
        dropdown.style.display = 'none';
    });


    // all the variables
    monthView = document.getElementById('monthView');
    weekView = document.getElementById('weekView');
    dayView = document.getElementById('dayView');
    yearView = document.getElementById('yearView');
    currentDisplay = document.getElementById('currentDisplay');
    todayButton = document.getElementById('todayButton');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');

    // all the grids
    monthGrid = document.getElementById('monthGrid');
    weekGrid = document.getElementById('weekGrid');
    dayGrid = document.getElementById('dayGrid');
    yearGrid = document.getElementById('yearGrid');

    // all the buttons
    monthViewBtn = document.querySelector('.monthViewBtn');
    weekViewBtn = document.querySelector('.weekViewBtn');
    dayViewBtn = document.querySelector('.dayViewBtn');
    yearViewBtn = document.querySelector('.yearViewBtn');

    let currentDate = new Date();

    if (weekViewBtn) {
        weekViewBtn.addEventListener('click', function () {
            renderWeekView(currentDate);
        });
    }

    if (monthViewBtn) {
        monthViewBtn.addEventListener('click', function () {
            renderMonthView(currentDate);
        });
    }

    // Re-attach Day view button handler
    if (dayViewBtn) {
        dayViewBtn.addEventListener('click', function () {
            renderDayView(currentDate);
        });
    }

    // month view function
    if (window.currentUserId) {
        renderMonthView(currentDate);
    }

    function openAddEventModal(date) {
        console.log(`TODO: Implement openAddEventModal for ${date}`);
    }

    function openEditEventModal(eventId) {
        console.log(`TODO: Implement openEditEventModal for ${eventId}`);
    }

    function enableDragSelection(element, view) {
        console.log(`TODO: Implement enableDragSelection for ${view} view`);
    }

    function formatDateToISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }



    //Month view function    
    function renderMonthView(date) {
        // Show month view, hide week view
        if (monthView && weekView) {
            monthView.style.display = 'block';
            weekView.style.display = 'none';
            yearGrid.style.display = 'none';
        }

        // clear month grid
        if (monthGrid) {
            monthGrid.innerHTML = '';
        }

        // get month and year
        let month = date.getMonth();
        let year = date.getFullYear();

        // Set header to 'Month Year', e.g., 'August 2025'
        if (currentDisplay) {
            currentDisplay.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
        }

        // get the first day and last day of the month
        let firstDayOfMonth = new Date(year, month, 1);
        let lastDayOfMonth = new Date(year, month + 1, 0);
        const startDayIndex = firstDayOfMonth.getDay();
        const daysInMonth = lastDayOfMonth.getDate();
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        // create prev month days
        for (let i = startDayIndex; i > 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day', 'text-gray-400', 'py-2');
            dayDiv.textContent = prevMonthLastDay - i;
            dayDiv.classList.add('non-current-month');
            if (monthGrid) {
                monthGrid.appendChild(dayDiv);
            }
        }

        // create current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day', 'month-cell', 'py-2', 'relative');
            dayDiv.textContent = i;
            const fullDate = new Date(year, month, i);
            dayDiv.dataset.date = formatDateToISO(fullDate);


            //highlight today day
            const today = new Date();
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayDiv.innerHTML = `<span class="today-highlight_for_month_week">${i}</span>`;
                dayDiv.classList.add('today-container');
            } else {
                dayDiv.classList.add('text-gray-800');
            }

            // render event for month view
            const cellDateStr = formatDateToISO(fullDate);
            const eventsForDay = calendarEvents.filter(event => event.date === cellDateStr);
            if (eventsForDay.length > 0) {
                const eventsList = document.createElement('div');
                eventsList.className = 'month-events-list';
                eventsForDay.forEach(ev => {
                    const evDiv = document.createElement('div');
                    evDiv.className = 'month-event px-1 py-0.5 rounded mb-1 text-xs truncate';
                    evDiv.style.cursor = 'pointer';
                    evDiv.style.backgroundColor = ev.color ? `${ev.color}20` : '#e3f2fd';
                    evDiv.style.color = ev.color || '#0d47a1';
                    evDiv.addEventListener('click', function (e) {
                        e.stopPropagation();
                        openEditEventModal(ev.id);
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
            if (monthGrid) {
                monthGrid.appendChild(dayDiv);
            }

        }

        // creating remaining days of the month
        const totalDaysDisplayed = startDayIndex + daysInMonth;
        const remainingDays = 42 - totalDaysDisplayed;
        for (let i = 1; i <= remainingDays; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day', 'text-gray-400', 'py-2');
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


    //week view function
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
                    const evDiv = document.createElement('div');
                    evDiv.className = 'all-day-event event-cell';

                    // Set background with opacity and solid border
                    const bgColor = ev.color ? `${ev.color}30` : '#e3f2fd';
                    const borderColor = ev.color || '#4285F4';

                    evDiv.style.setProperty('--event-color', bgColor);
                    evDiv.style.setProperty('--event-border-color', borderColor);
                    evDiv.style.backgroundColor = bgColor;
                    evDiv.style.borderLeft = `3px solid ${borderColor}`;
                    evDiv.style.color = '#1a202c';
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
                headerDiv.innerHTML = `<div>${weekdayNames[d]}</div><div class="text-sm text-gray-500${isToday ? ' today-highlight_for_month_week' : ''}">${dayDate.getDate()}</div>`;
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

        // Define time slots (e.g., 1:00 to 24:00)
        const startHour = 1;
        const endHour = 24;
        const hours = [];
        for (let h = startHour; h <= endHour; h++) {
            hours.push(h);
        }

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
            timeCell.classList.add('time-label', 'border', 'border-gray-200', 'text-xs', 'text-right', 'pr-2', 'py-1', 'bg-gray-50');
            const hourStr = rowHour < 12 ? `${rowHour} AM` : rowHour === 12 ? '12 PM' : rowHour === 24 ? '12 AM' : rowHour === 25 ? '1 AM' : `${rowHour - 12} PM`;
            timeCell.textContent = hourStr;
            weekTimeGrid.appendChild(timeCell);

            // 7 day cells
            for (let d = 0; d < 7; d++) {
                const dayCell = document.createElement('div');
                dayCell.classList.add('week-cell', 'day-cell', 'border', 'border-gray-200', 'relative', 'hover:bg-blue-50', 'h-12');


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

    //day view function
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
        enableDragSelection(dayTimeGrid, 'day');
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
        timedEventsContainer.style.left = '64px'; // Width of the time label (matches CSS grid first column)
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



    //year view function

});
