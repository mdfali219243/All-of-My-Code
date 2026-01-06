document.addEventListener('DOMContentLoaded', function () {
    const openMenuBtn = document.getElementById('openMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const featureMenu = document.getElementById('featureMenu');
    const overlay = document.getElementById('overlay');
    const settingsBtn = document.getElementById('settingsBtn');

    function openMenu() {
        if (featureMenu) {
            featureMenu.classList.remove('-translate-x-full');
            featureMenu.classList.add('translate-x-0');
            featureMenu.classList.add('show');
        }
        if (overlay) overlay.classList.remove('hidden');
    }

    function closeMenu() {
        if (featureMenu) {
            featureMenu.classList.remove('translate-x-0');
            featureMenu.classList.add('-translate-x-full');
            featureMenu.classList.remove('show');
        }
        if (overlay) overlay.classList.add('hidden');
    }

    if (openMenuBtn) {
        openMenuBtn.addEventListener('click', openMenu);
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }
});
