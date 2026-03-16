// DOM Elements
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const newChatBtn = document.getElementById('newChatBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const themeToggle = document.getElementById('themeToggle');

// State
let isDarkTheme = true;
let currentChatId = Date.now();
let chatHistory = [];

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
    chatInput.addEventListener('input', handleInputChange);
    chatInput.addEventListener('keydown', handleKeyDown);
    sendBtn.addEventListener('click', sendMessage);
    newChatBtn.addEventListener('click', startNewChat);
    sidebarToggle.addEventListener('click', toggleSidebar);
    themeToggle.addEventListener('click', toggleTheme);

    // Auto-resize textarea
    chatInput.addEventListener('input', autoResizeTextarea);

    // Load chat history
    loadChatHistory();
}

// Input handling
function handleInputChange() {
    const hasText = chatInput.value.trim().length > 0;
    sendBtn.disabled = !hasText;
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            sendMessage();
        }
    }
}

function autoResizeTextarea() {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
}

// Message handling
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage('user', message);

    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Show typing indicator
    showTypingIndicator();

    // Simulate AI response
    setTimeout(() => {
        hideTypingIndicator();
        const response = generateAIResponse(message);
        addMessage('assistant', response);
    }, 1000 + Math.random() * 2000);
}

function addMessage(sender, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${sender}`;
    avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = formatMessage(content);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    // Remove welcome message if it exists
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Save to chat history
    chatHistory.push({ sender, content, timestamp: Date.now() });
    saveChatHistory();
}

function formatMessage(content) {
    // Basic markdown-like formatting
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar assistant';
    avatar.innerHTML = '<i class="fas fa-robot"></i>';

    const dots = document.createElement('div');
    dots.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(dots);

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// AI Response Generation
function generateAIResponse(userMessage) {
    const responses = [
        "I understand you're asking about that. Let me help you with that topic.",
        "That's an interesting question! Here's what I think about it...",
        "I'd be happy to help you with that. Let me provide some insights.",
        "Great question! Here's my perspective on that matter.",
        "I can definitely help you with that. Let me break it down for you.",
        "That's a common question, and I'm here to help you understand it better.",
        "I appreciate you asking about that. Here's what I can tell you...",
        "Let me help you explore that topic in more detail.",
        "That's something I can definitely assist you with. Here's my take on it.",
        "I'm glad you brought that up. Let me share some thoughts on that subject."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Add some context based on keywords
    const lowerMessage = userMessage.toLowerCase();
    let contextualResponse = randomResponse;

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        contextualResponse = "Hello! I'm ChatGPT, an AI assistant. How can I help you today?";
    } else if (lowerMessage.includes('help')) {
        contextualResponse = "I'm here to help! What specific topic or question would you like assistance with?";
    } else if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
        contextualResponse = "I'd be happy to help you with programming! What language or concept are you working with?";
    } else if (lowerMessage.includes('explain')) {
        contextualResponse = "I'd be glad to explain that for you. Could you provide a bit more context about what specifically you'd like me to explain?";
    }

    return contextualResponse;
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

    // Add to sidebar
    addChatToSidebar('New conversation');

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
}

function addChatToSidebar(title) {
    const chatHistory = document.querySelector('.chat-history');
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.innerHTML = `
        <i class="fas fa-message"></i>
        <span>${title}</span>
        <i class="fas fa-ellipsis-vertical"></i>
    `;

    // Remove active class from other items
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });

    chatItem.classList.add('active');
    chatHistory.insertBefore(chatItem, chatHistory.firstChild);
}

// Sidebar toggle
function toggleSidebar() {
    sidebar.classList.toggle('open');
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
                addMessage(msg.sender, msg.content);
            });
        }

        // Add to sidebar
        savedChats.forEach(chat => {
            const title = chat.messages.length > 0 ?
                chat.messages[0].content.substring(0, 30) + '...' :
                'New conversation';
            addChatToSidebar(title);
        });
    }
}

// Mobile responsiveness
window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('open');
    }
});

// Click outside to close sidebar on mobile
document.addEventListener('click', function (e) {
    if (window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// Prevent form submission
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
});
