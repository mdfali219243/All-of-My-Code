# Personal Calendar Application

A full-featured calendar web application built with Django, JavaScript, and CSS, inspired by Google Calendar with a modern, responsive design and dark mode support.

## Distinctiveness and Complexity

This project goes beyond the basic requirements by implementing several advanced features:

1. **Full Calendar Functionality**: Complete calendar views including month, week, and day views with drag-and-drop event management.
2. **User Authentication**: Secure user registration, login, and session management.
3. **Dark Mode**: Comprehensive dark mode support across all UI elements.
4. **Responsive Design**: Works seamlessly on desktop and mobile devices.
5. **Task Management**: Integrated task management alongside calendar events.
6. **RESTful API**: Backend API endpoints for CRUD operations on events and tasks.
7. **Real-time Updates**: Dynamic UI updates without page reloads using JavaScript.

## Project Structure

### Backend (Django)
- `Calendar/models.py`: Defines the data models (Event, Task, etc.)
- `Calendar/views.py`: Handles HTTP requests and responses
- `Calendar/urls.py`: URL routing configuration
- `Calendar/forms.py`: Form definitions for data validation
- `Calendar/admin.py`: Admin interface configuration
- `migrations/`: Database migration files

### Frontend
- `templates/Calendar/`: HTML templates
  - `index.html`: Main calendar interface
  - `layout.html`: Base template with common elements
  - `login.html`, `register.html`: Authentication pages
  - `events.html`, `tasks.html`: Dedicated views
  - `settings.html`: User settings
  - `menu.html`: Navigation menu

- `static/Calendar/`:
  - `index.js`: Main JavaScript for calendar functionality
  - `style.css`: Main stylesheet
  - `theme.js`: Theme management (light/dark mode)
  - `menu.js`: Navigation menu functionality
  - `sidebar.js`: Sidebar interactions
  - `openAddEventModal.global.js`: Global event modal handling

## Installation and Setup

1. **Clone the repository**
   ```bash
   git clone [your-repository-url]
   cd Final_Project
   ```

2. **Set up a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```
   
   If requirements.txt doesn't exist, install these packages:
   ```bash
   pip install django djangorestframework
   ```

4. **Set up the database**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create a superuser (optional, for admin access)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server**
   ```bash
   python manage.py runserver
   ```

7. **Access the application**
   Open your browser and go to `http://127.0.0.1:8000/`

## Features

- **Multiple Views**: Switch between month, week, and day views
- **Event Management**: Create, read, update, and delete events
- **Task Tracking**: Manage tasks with due dates and priorities
- **User Accounts**: Secure registration and login
- **Responsive Design**: Works on all device sizes
- **Dark Mode**: Easy on the eyes in low-light conditions
- **Drag and Drop**: Intuitive event rescheduling

## API Endpoints

- `GET /api/events/`: List all events
- `POST /api/events/`: Create a new event
- `GET /api/events/<id>/`: Get a specific event
- `PUT /api/events/<id>/`: Update an event
- `DELETE /api/events/<id>/`: Delete an event

## Additional Information

- The application uses Django's built-in authentication system
- All JavaScript is vanilla JS with no external dependencies
- The UI is built with custom CSS for maximum performance
- Dark mode preferences are saved in localStorage
- The application is designed to be easily extended with additional features

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)


