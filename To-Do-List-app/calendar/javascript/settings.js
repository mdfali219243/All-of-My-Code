document.addEventListener('DOMContentLoaded', () => {
    // Sound Settings Logic
    const defaultRingtoneSelect = document.getElementById('defaultRingtone');
    const previewRingtoneBtn = document.getElementById('previewRingtoneBtn');
    const previewAudio = document.getElementById('previewAudio');

    if (defaultRingtoneSelect) {
        // Populate ringtones
        populateRingtoneSelect(defaultRingtoneSelect);

        // Load saved default
        defaultRingtoneSelect.value = getDefaultRingtone();

        // Save on change
        defaultRingtoneSelect.addEventListener('change', () => {
            setDefaultRingtone(defaultRingtoneSelect.value);
            // Stop preview if playing
            previewAudio.pause();
            previewAudio.currentTime = 0;
            previewRingtoneBtn.innerHTML = '<i class="fas fa-play"></i> Preview';
        });
    }

    if (previewRingtoneBtn && defaultRingtoneSelect && previewAudio) {
        previewRingtoneBtn.addEventListener('click', () => {
            if (previewAudio.paused) {
                const ringtoneId = defaultRingtoneSelect.value;
                const url = getRingtoneUrl(ringtoneId);
                previewAudio.src = url;
                previewAudio.play()
                    .then(() => {
                        previewRingtoneBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
                    })
                    .catch(err => {
                        console.error("Preview failed:", err);
                        alert("Could not play preview. Please interact with the page first.");
                    });
            } else {
                previewAudio.pause();
                previewAudio.currentTime = 0;
                previewRingtoneBtn.innerHTML = '<i class="fas fa-play"></i> Preview';
            }
        });

        previewAudio.onended = () => {
            previewRingtoneBtn.innerHTML = '<i class="fas fa-play"></i> Preview';
        };
    }
});
