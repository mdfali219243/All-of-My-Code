/**
 * Voice Input Module
 * Implements speech-to-text using Web Speech API
 */

class VoiceInput {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.onResult = null;
        this.onError = null;

        this.init();
    }

    init() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            this.isSupported = false;
            return;
        }

        this.isSupported = true;
        this.recognition = new SpeechRecognition();

        // Configuration
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        // Event handlers
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (this.onResult) {
                this.onResult(finalTranscript + interimTranscript, event.results[event.results.length - 1]?.isFinal);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.updateUI(false);

            if (this.onError) {
                this.onError(event.error);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateUI(false);
        };

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateUI(true);
        };
    }

    start() {
        if (!this.isSupported) {
            alert('Voice input is not supported in your browser. Please use Chrome for best results.');
            return;
        }

        if (this.isListening) {
            this.stop();
            return;
        }

        try {
            this.recognition.start();
        } catch (e) {
            console.error('Error starting speech recognition:', e);
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    updateUI(isRecording) {
        // Update all mic buttons on the page
        const micBtns = document.querySelectorAll('.voice-input-btn');
        micBtns.forEach(btn => {
            if (isRecording) {
                btn.classList.add('recording');
                btn.innerHTML = '<i class="fas fa-stop"></i>';
                btn.title = 'Stop recording';
            } else {
                btn.classList.remove('recording');
                btn.innerHTML = '<i class="fas fa-microphone"></i>';
                btn.title = 'Voice input';
            }
        });
    }
}

// Initialize voice input and attach to chat inputs
document.addEventListener('DOMContentLoaded', () => {
    const voiceInput = new VoiceInput();

    // Find all chat input containers and add mic buttons
    const chatInputContainers = document.querySelectorAll('.chat-input-box');

    chatInputContainers.forEach(container => {
        const input = container.querySelector('input[type="text"], textarea');
        if (!input) return;

        // Create mic button
        const micBtn = document.createElement('button');
        micBtn.className = 'voice-input-btn';
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        micBtn.title = 'Voice input';
        micBtn.type = 'button';

        // Insert before send button
        const sendBtn = container.querySelector('button:last-child');
        if (sendBtn) {
            container.insertBefore(micBtn, sendBtn);
        } else {
            container.appendChild(micBtn);
        }

        // Handle click
        micBtn.addEventListener('click', (e) => {
            e.preventDefault();
            voiceInput.start();
        });

        // Handle results
        voiceInput.onResult = (text, isFinal) => {
            input.value = text;
            input.dispatchEvent(new Event('input', { bubbles: true }));

            // Auto-focus the input
            input.focus();
        };

        voiceInput.onError = (error) => {
            if (error === 'not-allowed') {
                alert('Microphone access denied. Please allow microphone access to use voice input.');
            }
        };
    });

    // Also support standalone voice buttons with data-target attribute
    document.querySelectorAll('.voice-input-btn[data-target]').forEach(btn => {
        const targetId = btn.getAttribute('data-target');
        const targetInput = document.getElementById(targetId);

        if (!targetInput) return;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            voiceInput.start();
        });

        voiceInput.onResult = (text, isFinal) => {
            targetInput.value = text;
            targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            targetInput.focus();
        };
    });
});

// Export for use in other modules
window.VoiceInput = VoiceInput;
