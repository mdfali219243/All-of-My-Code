// Utility: open Add Event modal with date/time prefilled
function openAddEventModal(date, hour) {
    const eventDateInput = document.getElementById('eventDate');
    const eventStartTime = document.getElementById('eventStartTime');
    const eventEndTime = document.getElementById('eventEndTime');
    const eventAllDay = document.getElementById('eventAllDay');
    if (eventDateInput && date) eventDateInput.value = date;
    if (eventStartTime && hour) eventStartTime.value = String(hour).padStart(2, '0') + ':00';
    if (eventEndTime && hour) eventEndTime.value = '';
    if (eventAllDay) eventAllDay.checked = false;
    if (eventAllDay) eventAllDay.dispatchEvent(new Event('change'));
    const modal = new bootstrap.Modal(addEventModal);
    modal.show();
}
window.openAddEventModal = openAddEventModal;
