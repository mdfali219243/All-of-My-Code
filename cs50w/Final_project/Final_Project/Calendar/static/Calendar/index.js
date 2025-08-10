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
    document.addEventListener('DOMContentLoaded', function () {
        if (window.currentUserId) {
            renderMonthView(new Date());
        }
    })

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
            dayDiv.classList.add('calendar-day', 'text-gray-700', 'py-2');
            dayDiv.textContent = prevMonthLastDay - i;
            dayDiv.classList.add('non-current-month');
            if (monthGrid) {
                monthGrid.appendChild(dayDiv);
            }
        }

    }
});