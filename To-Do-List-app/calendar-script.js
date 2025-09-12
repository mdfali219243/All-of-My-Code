// Calendar Application
class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';
        this.events = this.loadEvents();
        this.selectedDate = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.renderCalendar();
        this.updateCurrentDateDisplay();
    }

    bindEvents() {
        // Navigation buttons
        document.getElementById('prevBtn').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextBtn').addEventListener('click', () => this.navigateMonth(1));

        // View buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeView(e.target.dataset.view));
        });

        // Create button
        document.querySelector('.create-btn').addEventListener('click', () => this.openEventModal());

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => this.closeEventModal());
        document.getElementById('cancelEvent').addEventListener('click', () => this.closeEventModal());
        document.getElementById('saveEvent').addEventListener('click', () => this.saveEvent());

        // Click outside modal to close
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') {
                this.closeEventModal();
            }
        });

        // Menu button for mobile
        document.querySelector('.menu-btn').addEventListener('click', () => this.toggleSidebar());
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
        this.updateCurrentDateDisplay();
    }

    changeView(view) {
        this.currentView = view;

        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        this.renderCalendar();
    }

    updateCurrentDateDisplay() {
        const options = { year: 'numeric', month: 'long' };
        const dateString = this.currentDate.toLocaleDateString('en-US', options);
        document.getElementById('currentDate').textContent = dateString;
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Clear existing days (keep day headers)
        const dayHeaders = calendarGrid.querySelectorAll('.day-header');
        calendarGrid.innerHTML = '';
        dayHeaders.forEach(header => calendarGrid.appendChild(header));

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Add previous month's trailing days
        const prevMonth = new Date(year, month - 1, 0);
        const daysInPrevMonth = prevMonth.getDate();

        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayElement = this.createDayElement(day, month - 1, year, true);
            calendarGrid.appendChild(dayElement);
        }

        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this.createDayElement(day, month, year, false);
            calendarGrid.appendChild(dayElement);
        }

        // Add next month's leading days
        const totalCells = calendarGrid.children.length - 7; // Subtract day headers
        const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42 cells

        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createDayElement(day, month + 1, year, true);
            calendarGrid.appendChild(dayElement);
        }
    }

    createDayElement(day, month, year, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        // Check if it's today
        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayElement.classList.add('today');
        }

        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        // Events for this day
        const dayEvents = document.createElement('div');
        dayEvents.className = 'day-events';

        const dayDate = new Date(year, month, day);
        const dayEventsList = this.getEventsForDate(dayDate);

        dayEventsList.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `event ${event.type}`;
            eventElement.textContent = event.title;
            eventElement.title = `${event.title} - ${event.time}`;
            eventElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editEvent(event);
            });
            dayEvents.appendChild(eventElement);
        });

        dayElement.appendChild(dayEvents);

        // Click handler for day
        dayElement.addEventListener('click', () => {
            this.selectDate(dayDate);
            this.openEventModal(dayDate);
        });

        return dayElement;
    }

    getEventsForDate(date) {
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === date.toDateString();
        });
    }

    selectDate(date) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });

        // Add selection to clicked day
        const dayElements = document.querySelectorAll('.calendar-day');
        dayElements.forEach(dayElement => {
            const dayNumber = parseInt(dayElement.querySelector('.day-number').textContent);
            const dayDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), dayNumber);

            if (dayDate.toDateString() === date.toDateString()) {
                dayElement.classList.add('selected');
            }
        });

        this.selectedDate = date;
    }

    openEventModal(date = null) {
        const modal = document.getElementById('eventModal');
        const eventTitle = document.getElementById('eventTitle');
        const eventDate = document.getElementById('eventDate');
        const eventTime = document.getElementById('eventTime');
        const eventDescription = document.getElementById('eventDescription');

        // Clear form
        eventTitle.value = '';
        eventTime.value = '';
        eventDescription.value = '';

        // Set date
        if (date) {
            eventDate.value = this.formatDateForInput(date);
        } else {
            eventDate.value = this.formatDateForInput(new Date());
        }

        modal.classList.add('show');
        eventTitle.focus();
    }

    closeEventModal() {
        const modal = document.getElementById('eventModal');
        modal.classList.remove('show');
    }

    saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const description = document.getElementById('eventDescription').value.trim();

        if (!title) {
            alert('Please enter an event title');
            return;
        }

        const event = {
            id: Date.now(),
            title,
            date: date + (time ? 'T' + time : ''),
            time: time || 'All day',
            description,
            type: this.getEventType(title)
        };

        this.events.push(event);
        this.saveEvents();
        this.renderCalendar();
        this.closeEventModal();
    }

    editEvent(event) {
        // For now, just open the modal with the event details
        this.openEventModal(new Date(event.date));

        // Pre-fill the form
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventTime').value = event.time !== 'All day' ? event.time : '';
        document.getElementById('eventDescription').value = event.description;
    }

    getEventType(title) {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('work') || lowerTitle.includes('meeting')) return 'work';
        if (lowerTitle.includes('birthday')) return 'birthday';
        return 'personal';
    }

    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('open');
    }

    loadEvents() {
        const saved = localStorage.getItem('calendar-events');
        return saved ? JSON.parse(saved) : this.getDefaultEvents();
    }

    saveEvents() {
        localStorage.setItem('calendar-events', JSON.stringify(this.events));
    }

    getDefaultEvents() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        return [
            {
                id: 1,
                title: 'Team Meeting',
                date: today.toISOString().split('T')[0] + 'T10:00',
                time: '10:00',
                description: 'Weekly team standup meeting',
                type: 'work'
            },
            {
                id: 2,
                title: 'Doctor Appointment',
                date: tomorrow.toISOString().split('T')[0] + 'T14:30',
                time: '14:30',
                description: 'Annual checkup',
                type: 'personal'
            },
            {
                id: 3,
                title: 'John\'s Birthday',
                date: nextWeek.toISOString().split('T')[0],
                time: 'All day',
                description: 'Birthday party at 7 PM',
                type: 'birthday'
            }
        ];
    }
}

// Initialize the calendar when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CalendarApp();
});

// Handle window resize for mobile sidebar
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        document.querySelector('.sidebar').classList.remove('open');
    }
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        const menuBtn = document.querySelector('.menu-btn');

        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});
