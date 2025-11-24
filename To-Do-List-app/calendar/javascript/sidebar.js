document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const sidebar = document.getElementById('calendarSidebar');
    const mobileToggleBtn = document.getElementById('mobileToggleSidebar');
    const closeSidebarBtn = document.getElementById('toggleSidebar');
    const addAppBtn = document.getElementById('addAppBtn');
    const connectedApps = document.getElementById('connectedApps');
    
    // Ensure sidebar is always visible
    if (sidebar) {
        sidebar.style.display = 'block';
        sidebar.style.visibility = 'visible';
        sidebar.style.opacity = '1';
        sidebar.style.transform = 'none';
    }
    
    // Toggle sidebar on mobile
    function toggleSidebar() {
        document.body.classList.toggle('sidebar-open');
        sidebar.classList.toggle('show');
        
        // Toggle aria-expanded for accessibility
        const isExpanded = sidebar.classList.contains('show');
        mobileToggleBtn.setAttribute('aria-expanded', isExpanded);
        
        // Add/remove event listener for clicking outside
        if (isExpanded) {
            document.addEventListener('click', handleClickOutside);
        } else {
            document.removeEventListener('click', handleClickOutside);
        }
    }
    
    // Close sidebar when clicking outside
    function handleClickOutside(event) {
        if (!sidebar.contains(event.target) && !mobileToggleBtn.contains(event.target)) {
            toggleSidebar();
        }
    }
    
    // Close sidebar when clicking the close button
    function closeSidebar() {
        document.body.classList.remove('sidebar-open');
        sidebar.classList.remove('show');
        mobileToggleBtn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', handleClickOutside);
    }
    
    // Add a new app (demo function)
    function addNewApp() {
        const appNames = ['Slack', 'Trello', 'Asana', 'GitHub', 'Jira', 'Notion'];
        const appIcons = ['S', 'T', 'A', 'G', 'J', 'N'];
        const colors = ['bg-red-100', 'bg-yellow-100', 'bg-green-100', 'bg-blue-100', 'bg-indigo-100', 'bg-purple-100', 'bg-pink-100'];
        const textColors = ['text-red-600', 'text-yellow-600', 'text-green-600', 'text-blue-600', 'text-indigo-600', 'text-purple-600', 'text-pink-600'];
        
        const randomIndex = Math.floor(Math.random() * appNames.length);
        const colorIndex = Math.floor(Math.random() * colors.length);
        
        const appItem = document.createElement('div');
        appItem.className = 'sidebar-item';
        appItem.innerHTML = `
            <div class="flex items-center p-2 rounded hover:bg-gray-100">
                <div class="w-8 h-8 ${colors[colorIndex]} rounded-full flex items-center justify-center mr-2">
                    <span class="${textColors[colorIndex]}">${appIcons[randomIndex]}</span>
                </div>
                <span>${appNames[randomIndex]}</span>
            </div>
        `;
        
        // Add animation class
        appItem.style.opacity = '0';
        appItem.style.animation = 'fadeIn 0.2s ease-out forwards';
        
        connectedApps.prepend(appItem);
        
        // Show a toast notification
        showToast(`Connected to ${appNames[randomIndex]}`);
    }
    
    // Show toast notification
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg transform translate-y-10 opacity-0 transition-all duration-300';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Trigger reflow
        void toast.offsetWidth;
        
        // Show toast
        toast.classList.add('translate-y-0', 'opacity-100');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // Event Listeners
    if (mobileToggleBtn) {
        mobileToggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleSidebar();
        });
    }
    
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', closeSidebar);
    }
    
    if (addAppBtn) {
        addAppBtn.addEventListener('click', addNewApp);
    }
    
    // Close sidebar when clicking on a sidebar item
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 1024) {
                closeSidebar();
            }
        });
    });
    
    // Close sidebar when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('show')) {
            closeSidebar();
        }
    });
});
