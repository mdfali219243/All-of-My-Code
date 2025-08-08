document.addEventListener('DOMContentLoaded', function () {
    // Feature Menu Dropdown function
    var btn = document.getElementById('featureMenuBtn');
    var dropdown = document.getElementById('featureDropdown');
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', function () {
        dropdown.style.display = 'none';
    });
});