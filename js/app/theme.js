// theme.js - Tema claro/oscuro de carga temprana.
(function () {
  "use strict";

  const THEME_KEY = "theme-preference";
  const THEME_ATTR = "data-theme";
  const ROOT = document.documentElement;
  const DARK_QUERY = "(prefers-color-scheme: dark)";

  function readStoredTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      return stored === "dark" || stored === "light" ? stored : null;
    } catch (_error) {
      return null;
    }
  }

  function writeStoredTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_error) {
      // localStorage puede estar bloqueado; el tema aplicado sigue funcionando.
    }
  }

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia(DARK_QUERY).matches
      ? "dark"
      : "light";
  }

  function getInitialTheme() {
    return readStoredTheme() || getSystemTheme();
  }

  function updateThemeToggleButton(theme) {
    const button = document.getElementById("themeToggle");
    if (!button) {
      return;
    }

    const isDark = theme === "dark";
    button.setAttribute(
      "aria-label",
      isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
    );
    button.setAttribute("aria-pressed", String(isDark));
    button.textContent = isDark ? "☾" : "☀";
  }

  function applyTheme(theme, options = {}) {
    const shouldPersist = options.persist === true;
    ROOT.setAttribute(THEME_ATTR, theme);
    ROOT.style.colorScheme = theme;

    if (shouldPersist) {
      writeStoredTheme(theme);
    }

    updateThemeToggleButton(theme);
  }

  function toggleTheme() {
    const current = ROOT.getAttribute(THEME_ATTR) || getInitialTheme();
    applyTheme(current === "dark" ? "light" : "dark", { persist: true });
  }

  function bindThemeToggle() {
    const button = document.getElementById("themeToggle");
    if (!button || button.dataset.themeToggleBound === "true") {
      return;
    }

    button.dataset.themeToggleBound = "true";
    button.addEventListener("click", toggleTheme);
    updateThemeToggleButton(ROOT.getAttribute(THEME_ATTR) || getInitialTheme());
  }

  function watchSystemTheme() {
    if (!window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(DARK_QUERY);
    mediaQuery.addEventListener("change", (event) => {
      if (!readStoredTheme()) {
        applyTheme(event.matches ? "dark" : "light");
      }
    });
  }

  applyTheme(getInitialTheme());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindThemeToggle);
  } else {
    bindThemeToggle();
  }

  watchSystemTheme();

  window.ThemeController = {
    applyTheme: (theme) => applyTheme(theme, { persist: true }),
    toggleTheme,
    getInitialTheme,
  };
})();
