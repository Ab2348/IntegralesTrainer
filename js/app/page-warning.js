(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  const PAGE_WARNING_CONFIG = {
    enabled: false,
    message:
      "Si estás leyendo esto, es porque la versión móvil está rota y aunque funciona, no se ve nada bien. Dame chance de arreglarlo, me muero de sueño, intenta usar la versión de escritorio. Xdona las molestias.",
  };

  App.pageWarningConfig = PAGE_WARNING_CONFIG;

  App.createPageWarning = function createPageWarning(
    config = PAGE_WARNING_CONFIG,
  ) {
    let overlay = null;
    let previousFocus = null;

    function close() {
      if (!overlay) {
        return;
      }
      overlay.remove();
      overlay = null;
      document.removeEventListener("keydown", handleKeydown);
      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    }

    function handleKeydown(event) {
      if (event.key === "Escape") {
        close();
      }
    }

    function show() {
      if (!config.enabled || overlay) {
        return;
      }

      previousFocus = document.activeElement;
      overlay = document.createElement("div");
      overlay.className = "page-warning-overlay";
      overlay.setAttribute("role", "presentation");

      const dialog = document.createElement("section");
      dialog.className = "page-warning-dialog";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", "pageWarningMessage");

      const message = document.createElement("p");
      message.id = "pageWarningMessage";
      message.className = "page-warning-message";
      message.textContent = config.message;

      const closeButton = document.createElement("button");
      closeButton.className = "page-warning-close";
      closeButton.type = "button";
      closeButton.textContent = "Cerrar";
      closeButton.addEventListener("click", close);

      dialog.append(message, closeButton);
      overlay.append(dialog);
      document.body.append(overlay);
      document.addEventListener("keydown", handleKeydown);
      closeButton.focus();
    }

    return {
      show,
      close,
    };
  };
})(window);
