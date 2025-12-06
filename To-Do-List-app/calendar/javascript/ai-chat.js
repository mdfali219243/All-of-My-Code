// AI Chat Sidebar JavaScript for Calendar

// DOM Elements
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const newChatBtn = document.getElementById('newChatBtn');
const aiSidebar = document.getElementById('aiSidebar');
const aiMainContent = document.getElementById('aiMainContent');
const aiSidebarToggle = document.getElementById('aiSidebarToggle');
const aiCloseBtn = document.getElementById('aiCloseBtn');
const aiChatToggleBtn = document.getElementById('aiChatToggleBtn');
const themeToggle = document.getElementById('themeToggle');

// State
let isDarkTheme = true;
let currentChatId = Date.now();
let chatHistory = [];
let isSidebarOpen = false;
let isMainContentOpen = false;

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('chatgpt-theme');
    if (savedTheme === 'light') {
        toggleTheme();
    }

    // Event listeners
    if (chatInput) {
        chatInput.addEventListener('input', handleInputChange);
        chatInput.addEventListener('keydown', handleKeyDown);
        chatInput.addEventListener('input', autoResizeTextarea);
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (newChatBtn) newChatBtn.addEventListener('click', startNewChat);
    if (aiSidebarToggle) aiSidebarToggle.addEventListener('click', toggleAISidebar);
    if (aiCloseBtn) aiCloseBtn.addEventListener('click', closeAIMainContent);
    if (aiChatToggleBtn) aiChatToggleBtn.addEventListener('click', openAIMainContent);
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // Load chat history
    loadChatHistory();
}

// Toggle AI Sidebar
function toggleAISidebar() {
    isSidebarOpen = !isSidebarOpen;
    if (isSidebarOpen) {
        aiSidebar.classList.add('open');
    } else {
        aiSidebar.classList.remove('open');
    }
}

// Open AI Main Content
function openAIMainContent() {
    isMainContentOpen = true;
    aiMainContent.classList.add('open');
    if (isSidebarOpen) {
        aiSidebar.classList.remove('open');
        isSidebarOpen = false;
    }
}

// Close AI Main Content
function closeAIMainContent() {
    isMainContentOpen = false;
    aiMainContent.classList.remove('open');
}

// Input handling
function handleInputChange() {
    const hasText = chatInput.value.trim().length > 0;
    sendBtn.disabled = !hasText;
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Auto-resize textarea
function autoResizeTextarea() {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
}

// Send message
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');

    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Ask Python backend for AI response
    setTimeout(() => {
        generateAIResponse(message)
            .then(data => {
                // Always display the textual reply
                const replyText = data.reply || "I couldn't find an answer in the backend, but I'm here to help.";
                addMessage(replyText, 'assistant');

                // If backend requested an action (e.g., create_event), handle it
                if (data.action === 'create_event' && data.event) {
                    if (typeof window.createEventFromAI === 'function') {
                        window.createEventFromAI(data.event);
                    } else {
                        console.warn('createEventFromAI is not available on window.');
                    }
                }
            })
            .catch(error => {
                console.error('Error from AI backend:', error);
                addMessage("Sorry, I had a problem talking to the AI backend.", 'assistant');
            });
    }, 500);
}

// Save message to history
function saveMessageToHistory(content, sender) {
    const message = {
        content: content,
        sender: sender,
        timestamp: new Date().toISOString()
    };
    chatHistory.push(message);

    // Save to localStorage
    const allChats = JSON.parse(localStorage.getItem('ai-chat-history') || '[]');
    let currentChat = allChats.find(chat => chat.id === currentChatId);

    if (!currentChat) {
        currentChat = {
            id: currentChatId,
            messages: [],
            createdAt: new Date().toISOString()
        };
        allChats.push(currentChat);
    }

    currentChat.messages.push(message);
    localStorage.setItem('ai-chat-history', JSON.stringify(allChats));
}

// Add message to chat
function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = `message-avatar ${sender}`;
    avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `<p>${content}</p>`;

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);

    // Remove welcome message if it exists
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Save to history
    saveMessageToHistory(content, sender);
}

// Generate AI response via Python backend
function generateAIResponse(message) {
    return fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Return full payload so caller can inspect action/event
            return data;
        });
}

// New Chat
function startNewChat() {
    // Clear current chat
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">
                <i class="fas fa-robot"></i>
            </div>
            <h2>How can I help you today?</h2>
        </div>
    `;

    // Reset chat history
    chatHistory = [];
    currentChatId = Date.now();

    // Add to sidebar functionality is handled by the static HTML
    // addChatToSidebar('New conversation');

    // Close AI sidebar on mobile
    if (window.innerWidth <= 768) {
        aiSidebar.classList.remove('open');
        isSidebarOpen = false;
    }
}

// Theme toggle
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('light-theme', !isDarkTheme);

    const themeIcon = themeToggle.querySelector('i');
    themeIcon.className = isDarkTheme ? 'fas fa-moon' : 'fas fa-sun';

    // Save theme preference
    localStorage.setItem('chatgpt-theme', isDarkTheme ? 'dark' : 'light');
}

// Local Storage
function saveChatHistory() {
    const chatData = {
        id: currentChatId,
        messages: chatHistory,
        timestamp: Date.now()
    };

    const savedChats = JSON.parse(localStorage.getItem('chatgpt-chats') || '[]');
    const existingChatIndex = savedChats.findIndex(chat => chat.id === currentChatId);

    if (existingChatIndex >= 0) {
        savedChats[existingChatIndex] = chatData;
    } else {
        savedChats.push(chatData);
    }

    localStorage.setItem('chatgpt-chats', JSON.stringify(savedChats));
}

function loadChatHistory() {
    const savedChats = JSON.parse(localStorage.getItem('chatgpt-chats') || '[]');

    if (savedChats.length > 0) {
        // Load the most recent chat
        const mostRecentChat = savedChats[savedChats.length - 1];
        currentChatId = mostRecentChat.id;
        chatHistory = mostRecentChat.messages || [];

        // Display messages
        if (chatHistory.length > 0) {
            chatMessages.innerHTML = '';
            chatHistory.forEach(msg => {
                addMessage(msg.content, msg.sender);
            });
        }

        // Sidebar functionality is handled by static HTML
        // savedChats.forEach(chat => {
        //     const title = chat.messages.length > 0 ?
        //         chat.messages[0].content.substring(0, 30) + '...' :
        //         'New conversation';
        //     addChatToSidebar(title);
        // });
    }
}

// Mobile responsiveness
window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        aiSidebar.classList.remove('open');
        isSidebarOpen = false;
    }
});

// Click outside to close AI sidebar on mobile
document.addEventListener('click', function (e) {
    if (window.innerWidth <= 768 &&
        !aiSidebar.contains(e.target) &&
        !aiSidebarToggle.contains(e.target)) {
        aiSidebar.classList.remove('open');
        isSidebarOpen = false;
    }
});

// Prevent form submission

