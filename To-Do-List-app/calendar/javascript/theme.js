
(function () {
  const THEME_KEY = 'theme';
  const LIGHT = 'light';
  const DARK = 'dark';

  function applyTheme(theme) {
    const enableDark = theme === DARK;
    const root = document.documentElement;
    const body = document.body;

    if (enableDark) {
      root.classList.add(DARK);
      if (body) body.classList.add(DARK);
    } else {
      root.classList.remove(DARK);
      if (body) body.classList.remove(DARK);
    }
  }

  function saveTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  }

  function currentTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (_) { return null; }
  }

  function loadTheme() {
    const saved = currentTheme();
    applyTheme(saved === DARK ? DARK : LIGHT);

    // Sync radios on settings page if present
    const lightRadio = document.getElementById('theme-light');
    const darkRadio = document.getElementById('theme-dark');
    if (lightRadio && darkRadio) {
      if (saved === DARK) {
        darkRadio.checked = true;
      } else {
        lightRadio.checked = true;
      }
    }
  }

  function wireControls() {
    const lightRadio = document.getElementById('theme-light');
    const darkRadio = document.getElementById('theme-dark');

    if (lightRadio) {
      lightRadio.addEventListener('change', () => {
        applyTheme(LIGHT);
        saveTheme(LIGHT);
      });
    }

    if (darkRadio) {
      darkRadio.addEventListener('change', () => {
        applyTheme(DARK);
        saveTheme(DARK);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadTheme();
    wireControls();
  });
})();
