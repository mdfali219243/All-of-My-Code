// lets load the website
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const setName = params.get('set'); // Get the specific set title from the URL
    const defaultTitle = 'Flashcard Set';
    document.querySelector('.js-header_name').textContent = setName || defaultTitle; // Set header based on URL or default


    // variable
    const questionButton = document.getElementById('js-question');
    const answerButton = document.getElementById('js-answer');
    const prevButton = document.getElementById('js-prev'); 
    const nextButton = document.getElementById('js-next'); 
    const flashcardDisplay = document.querySelector('.js-show'); // this is where we will shows the flashcard
    const allFlashcardsList = document.getElementById('all-flashcards-list');
    // Toolbar buttons
    const shuffleButton = document.getElementById('js-shuffle');
    const toggleListButton = document.getElementById('js-toggle-list');
    const backButton = document.getElementById('js-back');
    const allSection = document.querySelector('.All-js');

    let allFlashcardSets = [];
    let currentFlashcardSet = null;
    let currentCardIndex = 0; // The index of the card being displayed

    // Function to load all flashcard sets from localStorage
    function loadAllFlashcardSets() {
        const storedDataString = localStorage.getItem('flashcardSets'); // let get my flashcard from the Local storage
        if (storedDataString) { 
            try {
                allFlashcardSets = JSON.parse(storedDataString);
                console.log("All flashcard sets loaded:", allFlashcardSets);
            } catch (e) {
                console.error("Error parsing flashcardSets from localStorage:", e);
                allFlashcardSets = [];
                alert("Error loading flashcard sets. Data might be corrupted.");
            }
        } else {
            console.log("No flashcard sets found in localStorage.");
            allFlashcardSets = [];
        }
    }

    // Function to find and set the current flashcard set
    function findAndSetCurrentFlashcardSet() {
        if (setName && allFlashcardSets.length > 0) { //
            currentFlashcardSet = allFlashcardSets.find(set => set.title === setName);
        }


        // error checking
        if (!currentFlashcardSet) {
            console.warn(`Flashcard set with title "${setName}" not found or no sets available.`);
            flashcardDisplay.textContent = `Flashcard set "${setName || 'N/A'}" not found.`;
            // Disable all buttons if no set is found
            questionButton.disabled = true;
            answerButton.disabled = true;
            prevButton.disabled = true;
            nextButton.disabled = true;
        }
    }

    // Function to display the current flashcard (question by default)
    function displayCurrentFlashcard() {
        if (currentFlashcardSet && currentFlashcardSet.cards && currentFlashcardSet.cards.length > 0) {
            flashcardDisplay.textContent = currentFlashcardSet.cards[currentCardIndex].question;
        } else {
            flashcardDisplay.textContent = "No flashcards in this set.";
        }
    }

    // Function to populate the "All Flashcards" section for the current set
    function populateAllFlashcardsInSet() {
        allFlashcardsList.innerHTML = '';
        if (currentFlashcardSet && currentFlashcardSet.cards && currentFlashcardSet.cards.length > 0) {
            currentFlashcardSet.cards.forEach((card, index) => {
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
                listItem.innerHTML = `
                    <div class="text-start">
                        <div><strong>Q:</strong> ${card.question}</div>
                        <div><strong>A:</strong> <span class="answer masked">${card.answer}</span></div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-secondary reveal-answer" type="button">Reveal</button>
                        <button class="btn btn-sm btn-info" data-index="${index}" type="button">View</button>
                    </div>
                `;
                allFlashcardsList.appendChild(listItem);

                // Bind the "View" button specifically
                const viewBtn = listItem.querySelector('button[data-index]');
                viewBtn.addEventListener('click', (event) => {
                    const indexToView = Number(event.currentTarget.dataset.index);
                    if (!Number.isNaN(indexToView)) {
                        currentCardIndex = indexToView; // Update the current index
                        displayCurrentFlashcard(); // Display the question of the selected card
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });

                // Handle reveal/hide per-item
                const revealBtn = listItem.querySelector('.reveal-answer');
                const answerSpan = listItem.querySelector('.answer');
                revealBtn.addEventListener('click', () => {
                    answerSpan.classList.toggle('masked');
                    revealBtn.textContent = answerSpan.classList.contains('masked') ? 'Reveal' : 'Hide';
                });
            });
        } else {
            allFlashcardsList.innerHTML = '<li class="list-group-item">No flashcards in this set to display.</li>';
        }
    }

    // Lets load all the :
    loadAllFlashcardSets();
    findAndSetCurrentFlashcardSet();
    // run the function
    if (currentFlashcardSet) {
        displayCurrentFlashcard();
        populateAllFlashcardsInSet();
    }


    // it will show you the question of the flashcard--
    questionButton.addEventListener('click', () => {
        if (currentFlashcardSet && currentFlashcardSet.cards && currentFlashcardSet.cards.length > 0) {
            flashcardDisplay.textContent = currentFlashcardSet.cards[currentCardIndex].question;
        } else {
            flashcardDisplay.textContent = "No question available in this set.";
        }
    });

    // it will show you the answer of the flashcard
    answerButton.addEventListener('click', () => {
        if (currentFlashcardSet && currentFlashcardSet.cards && currentFlashcardSet.cards.length > 0) {
            flashcardDisplay.textContent = currentFlashcardSet.cards[currentCardIndex].answer;
        } else {
            flashcardDisplay.textContent = "No answer available in this set.";
        }
    });

    // it will show the previous card
    prevButton.addEventListener('click', () => {
        if (currentFlashcardSet && currentFlashcardSet.cards && currentFlashcardSet.cards.length > 0) {
            currentCardIndex = (currentCardIndex - 1 + currentFlashcardSet.cards.length) % currentFlashcardSet.cards.length;
            displayCurrentFlashcard(); 
        }
    });

    // it will show the next card
    nextButton.addEventListener('click', () => {
        if (currentFlashcardSet && currentFlashcardSet.cards && currentFlashcardSet.cards.length > 0) {
            currentCardIndex = (currentCardIndex + 1) % currentFlashcardSet.cards.length;
            displayCurrentFlashcard(); 
        }
    });

    // Toolbar actions
    backButton.addEventListener('click', () => {
        history.back();
    });

    shuffleButton.addEventListener('click', () => {
        if (currentFlashcardSet && Array.isArray(currentFlashcardSet.cards) && currentFlashcardSet.cards.length > 1) {
            for (let i = currentFlashcardSet.cards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentFlashcardSet.cards[i], currentFlashcardSet.cards[j]] = [currentFlashcardSet.cards[j], currentFlashcardSet.cards[i]];
            }
            currentCardIndex = 0;
            displayCurrentFlashcard();
            populateAllFlashcardsInSet();
        }
    });

    toggleListButton.addEventListener('click', () => {
        if (!allSection) return;
        allSection.classList.toggle('hidden');
        toggleListButton.textContent = allSection.classList.contains('hidden') ? 'Show List' : 'Hide List';
    });
}); // End DOMContentLoaded
