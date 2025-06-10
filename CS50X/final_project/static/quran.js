document.addEventListener('DOMContentLoaded', () => {
    fetch('https://api.alquran.cloud/v1/surah')
        .then(response => {
            console.log('Fetch response status:', response.status);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Surah data received:', data);
            if (!data || !data.data || !Array.isArray(data.data)) {
                throw new Error('Unexpected response format');
            }
            const surahList = document.getElementById('surah-list');
            surahList.innerHTML = '';  // Clear any existing content
            data.data.forEach(surah => {
                console.log('Processing Surah:', surah);
                const surahItem = document.createElement('div');
                surahItem.className = 'surah-item';
                surahItem.innerHTML = `
                    <h3>${surah.number}. ${surah.englishName} (${surah.englishNameTranslation})</h3>
                    <p>${surah.revelationType} - ${surah.numberOfAyahs} Ayahs</p>
                    <button class="btn btn-primary" onclick="showSurah(${surah.number})">Read Surah</button>
                `;
                surahList.appendChild(surahItem);
            });
        })
        .catch(error => {
            console.error('Error fetching Surahs:', error);
            alert(`Unable to retrieve Surahs. Please try again later.\nError: ${error.message}`);
        });
});

function showSurah(surahNumber) {
    fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.asad`)
        .then(response => {
            console.log('Fetch surah details response status:', response.status);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Surah details received:', data);
            if (!data || !data.data || !Array.isArray(data.data)) {
                throw new Error('Unexpected response format');
            }
            const surah = data.data[0];  // Assuming the first edition is the Arabic text
            const translation = data.data[1];  // Assuming the second edition is the translation
            const surahList = document.getElementById('surah-list');
            surahList.innerHTML = `
                <h2>${surah.englishName} (${surah.englishNameTranslation})</h2>
                <p>${surah.revelationType} - ${surah.ayahs.length} Ayahs</p>
                <div>${surah.ayahs.map((ayah, index) => `
                    <p>${ayah.numberInSurah}. ${ayah.text} - ${translation.ayahs[index].text}</p>
                `).join('')}</div>
                <button class="btn btn-secondary" onclick="loadSurahList()">Back to Surah List</button>
            `;
        })
        .catch(error => {
            console.error('Error fetching Surah details:', error);
            alert(`Unable to retrieve Surah details. Please try again later.\nError: ${error.message}`);
        });
}

function loadSurahList() {
    document.getElementById('surah-list').innerHTML = '';
    document.dispatchEvent(new Event('DOMContentLoaded'));
}
