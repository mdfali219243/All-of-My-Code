const ALARM_RINGTONES = [
    { id: 'beep_short', name: 'Beep Short', url: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
    { id: 'digital_watch', name: 'Digital Watch', url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg' },
    { id: 'alarm_clock', name: 'Alarm Clock', url: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
    { id: 'bugle_tune', name: 'Bugle Tune', url: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg' },
    { id: 'spaceship_alarm', name: 'Spaceship Alarm', url: 'https://actions.google.com/sounds/v1/alarms/spaceship_alarm.ogg' }
];

function getDefaultRingtone() {
    return localStorage.getItem('defaultRingtone') || 'beep_short';
}

function setDefaultRingtone(ringtoneId) {
    localStorage.setItem('defaultRingtone', ringtoneId);
}

function getRingtoneUrl(ringtoneId) {
    const ringtone = ALARM_RINGTONES.find(r => r.id === ringtoneId) || ALARM_RINGTONES[0];
    return ringtone.url;
}

function populateRingtoneSelect(selectElement, includeDefaultOption = false) {
    if (!selectElement) return;

    // Save current selection if any
    const currentValue = selectElement.value;

    selectElement.innerHTML = '';

    if (includeDefaultOption) {
        const defaultOption = document.createElement('option');
        defaultOption.value = 'default';
        defaultOption.textContent = 'Default Ringtone';
        selectElement.appendChild(defaultOption);
    }

    ALARM_RINGTONES.forEach(ringtone => {
        const option = document.createElement('option');
        option.value = ringtone.id;
        option.textContent = ringtone.name;
        selectElement.appendChild(option);
    });

    // Restore selection if it still exists
    if (currentValue && Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
        selectElement.value = currentValue;
    }
}

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ALARM_RINGTONES, getDefaultRingtone, setDefaultRingtone, getRingtoneUrl, populateRingtoneSelect };
}
