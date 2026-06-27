(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});
  const MOBILE_MAX = 980;
  const DESKTOP_MIN = MOBILE_MAX + 1;
  const queries = {
    mobile: `(max-width: ${MOBILE_MAX}px)`,
    desktop: `(min-width: ${DESKTOP_MIN}px)`,
  };
  const listeners = new Set();
  const mediaQuery =
    root.matchMedia && root.matchMedia(queries.mobile);

  function isMobile() {
    return Boolean(mediaQuery && mediaQuery.matches);
  }

  function isDesktop() {
    return !isMobile();
  }

  function currentMode() {
    return isMobile() ? "mobile" : "desktop";
  }

  function notify() {
    const mode = currentMode();
    listeners.forEach((listener) => listener(mode));
  }

  function onChange(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }
    listeners.add(listener);
    if (mediaQuery) {
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", notify);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(notify);
      }
    }
    return () => {
      listeners.delete(listener);
      if (!listeners.size && mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", notify);
        } else if (mediaQuery.removeListener) {
          mediaQuery.removeListener(notify);
        }
      }
    };
  }

  App.LayoutMode = {
    MOBILE_MAX,
    DESKTOP_MIN,
    currentMode,
    isDesktop,
    isMobile,
    onChange,
    queries,
  };
})(typeof window !== "undefined" ? window : globalThis);
