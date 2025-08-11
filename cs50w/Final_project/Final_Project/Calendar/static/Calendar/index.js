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
    monthViewBtn = document.getElementById('monthViewBtn');
    weekViewBtn = document.getElementById('weekViewBtn');
    dayViewBtn = document.getElementById('dayViewBtn');
    yearViewBtn = document.getElementById('yearViewBtn');




    // month view function
    if (window.currentUserId) {
        renderMonthView(new Date());
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
});