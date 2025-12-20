/**
 * Firebase Cloud Sync Module
 * Syncs tasks and events with Firebase Realtime Database
 */

// Firebase Configuration
// REPLACE THESE VALUES with your Firebase project config from:
// Firebase Console > Project Settings > General > Your apps > SDK snippet > Config
const FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

class CloudSync {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
        this.syncStatus = 'offline';
        this.listeners = [];
        this.userId = this.getOrCreateUserId();

        // Track online/offline status
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));

        this.init();
    }

    getOrCreateUserId() {
        let userId = localStorage.getItem('cloud-sync-user-id');
        if (!userId) {
            userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('cloud-sync-user-id', userId);
        }
        return userId;
    }

    async init() {
        // Check if Firebase is configured
        if (FIREBASE_CONFIG.apiKey === "YOUR_API_KEY") {
            console.warn('Firebase not configured. Cloud sync disabled.');
            this.updateSyncStatus('offline');
            return;
        }

        try {
            // Dynamically load Firebase if not already loaded
            if (typeof firebase === 'undefined') {
                await this.loadFirebaseSDK();
            }

            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }

            this.db = firebase.database();
            this.isInitialized = true;
            this.updateSyncStatus('synced');

            // Set up real-time listeners
            this.setupListeners();

            console.log('Cloud sync initialized successfully');
        } catch (error) {
            console.error('Failed to initialize cloud sync:', error);
            this.updateSyncStatus('error');
        }
    }

    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            const scripts = [
                'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js'
            ];

            let loaded = 0;
            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loaded++;
                    if (loaded === scripts.length) resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        });
    }

    handleOnlineStatus(isOnline) {
        this.isOnline = isOnline;
        if (isOnline && this.isInitialized) {
            this.updateSyncStatus('syncing');
            // Re-sync when coming back online
            this.syncAll();
        } else if (!isOnline) {
            this.updateSyncStatus('offline');
        }
    }

    updateSyncStatus(status) {
        this.syncStatus = status;

        // Update UI
        const statusElements = document.querySelectorAll('.sync-status');
        statusElements.forEach(el => {
            el.className = 'sync-status ' + status;

            let icon, text;
            switch (status) {
                case 'synced':
                    icon = 'fa-cloud-check';
                    text = 'Synced';
                    break;
                case 'syncing':
                    icon = 'fa-sync';
                    text = 'Syncing...';
                    break;
                case 'offline':
                    icon = 'fa-cloud-slash';
                    text = 'Offline';
                    break;
                case 'error':
                    icon = 'fa-exclamation-triangle';
                    text = 'Sync Error';
                    break;
                default:
                    icon = 'fa-cloud';
                    text = status;
            }

            el.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
        });
    }

    setupListeners() {
        if (!this.db) return;

        // Listen for task changes
        this.db.ref(`users/${this.userId}/tasks`).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.handleRemoteTasksUpdate(data);
            }
        });

        // Listen for event changes
        this.db.ref(`users/${this.userId}/events`).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.handleRemoteEventsUpdate(data);
            }
        });
    }

    handleRemoteTasksUpdate(data) {
        // Update localStorage with remote data
        const existingData = JSON.parse(localStorage.getItem('kanban-board') || '{}');
        const remoteTimestamp = data._timestamp || 0;
        const localTimestamp = parseInt(localStorage.getItem('tasks-last-sync') || '0');

        // Only update if remote is newer
        if (remoteTimestamp > localTimestamp) {
            delete data._timestamp;
            localStorage.setItem('kanban-board', JSON.stringify(data));
            localStorage.setItem('tasks-last-sync', remoteTimestamp.toString());

            // Dispatch event for UI to update
            window.dispatchEvent(new CustomEvent('tasksUpdated', { detail: data }));
        }
    }

    handleRemoteEventsUpdate(data) {
        // Update localStorage with remote data
        const remoteTimestamp = data._timestamp || 0;
        const localTimestamp = parseInt(localStorage.getItem('events-last-sync') || '0');

        // Only update if remote is newer
        if (remoteTimestamp > localTimestamp) {
            const events = data.items || [];
            localStorage.setItem('calendarEvents', JSON.stringify(events));
            localStorage.setItem('events-last-sync', remoteTimestamp.toString());

            // Dispatch event for UI to update
            window.dispatchEvent(new CustomEvent('eventsUpdated', { detail: events }));
        }
    }

    // ============ PUBLIC API ============

    async syncTasks(tasksData) {
        if (!this.isInitialized || !this.isOnline) {
            console.log('Sync skipped: not initialized or offline');
            return;
        }

        this.updateSyncStatus('syncing');

        try {
            const timestamp = Date.now();
            await this.db.ref(`users/${this.userId}/tasks`).set({
                ...tasksData,
                _timestamp: timestamp
            });

            localStorage.setItem('tasks-last-sync', timestamp.toString());
            this.updateSyncStatus('synced');
        } catch (error) {
            console.error('Failed to sync tasks:', error);
            this.updateSyncStatus('error');
        }
    }

    async syncEvents(eventsData) {
        if (!this.isInitialized || !this.isOnline) {
            console.log('Sync skipped: not initialized or offline');
            return;
        }

        this.updateSyncStatus('syncing');

        try {
            const timestamp = Date.now();
            await this.db.ref(`users/${this.userId}/events`).set({
                items: eventsData,
                _timestamp: timestamp
            });

            localStorage.setItem('events-last-sync', timestamp.toString());
            this.updateSyncStatus('synced');
        } catch (error) {
            console.error('Failed to sync events:', error);
            this.updateSyncStatus('error');
        }
    }

    async syncAll() {
        const tasks = JSON.parse(localStorage.getItem('kanban-board') || '{}');
        const events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');

        await Promise.all([
            this.syncTasks(tasks),
            this.syncEvents(events)
        ]);
    }

    // Disconnect listeners
    disconnect() {
        if (this.db) {
            this.db.ref(`users/${this.userId}/tasks`).off();
            this.db.ref(`users/${this.userId}/events`).off();
        }
    }
}

// Initialize cloud sync
let cloudSync = null;

document.addEventListener('DOMContentLoaded', () => {
    cloudSync = new CloudSync();

    // Expose globally for other modules to use
    window.cloudSync = cloudSync;

    // Add sync status indicator to header if it exists
    const header = document.querySelector('.header .right-section');
    if (header) {
        const syncIndicator = document.createElement('div');
        syncIndicator.className = 'sync-status offline';
        syncIndicator.innerHTML = '<i class="fas fa-cloud-slash"></i><span>Offline</span>';
        header.insertBefore(syncIndicator, header.firstChild);
    }
});

// Export for use in other modules
window.CloudSync = CloudSync;
