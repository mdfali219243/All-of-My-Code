document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('location-form');
    form.addEventListener('submit', event => {
        event.preventDefault();
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&state=${state}&country=US&method=2`)
            .then(response => response.json())
            .then(data => {
                const times = data.data.timings;
                document.getElementById('fajr').textContent = convertTo12HourFormat(times.Fajr);
                document.getElementById('zuhr').textContent = convertTo12HourFormat(times.Dhuhr);
                document.getElementById('asr').textContent = convertTo12HourFormat(times.Asr);
                document.getElementById('maghrib').textContent = convertTo12HourFormat(times.Maghrib);
                document.getElementById('isha').textContent = convertTo12HourFormat(times.Isha);
            })
            .catch(error => {
                console.error('Error fetching prayer times:', error);
                alert('Unable to retrieve prayer times. Please check your input and try again.');
            });
    });

    function convertTo12HourFormat(time) {
        const [hours, minutes] = time.split(':');
        const period = hours >= 12 ? 'PM' : 'AM';
        const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${adjustedHours}:${minutes} ${period}`;
    }

    // Display current time
    let time = document.getElementById("current-time");
    setInterval(() => {
        let d = new Date();
        time.innerHTML = d.toLocaleTimeString();
    }, 1000);
    let d = new Date();
    time.innerHTML = d.toLocaleTimeString();
});
