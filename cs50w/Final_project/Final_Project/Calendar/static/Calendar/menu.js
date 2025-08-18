document.addEventListener('DOMContentLoaded', function() {
    const featureMenuBtn = document.getElementById('featureMenuBtn');
    const featureDropdown = document.getElementById('featureDropdown');

    if (featureMenuBtn && featureDropdown) {
        featureMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const isHidden = featureDropdown.style.display === 'none' || !featureDropdown.style.display;
            featureDropdown.style.display = isHidden ? 'block' : 'none';
        });

        // Close dropdown if clicking outside
        window.addEventListener('click', (event) => {
            if (featureDropdown.style.display === 'block' && !featureMenuBtn.contains(event.target) && !featureDropdown.contains(event.target)) {
                featureDropdown.style.display = 'none';
            }
        });
    }
});
