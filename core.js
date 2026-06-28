(function (root) {
  "use strict";

  function loadDefaultModule() {
    const registry = root.TrigCoreRegistry;
    const existing = registry && registry.getActive ? registry.getActive() : null;
    if (existing) {
      return existing;
    }

    if (typeof require === "function") {
      require("./js/core/diagnostico-contratos.js");
      require("./js/core/contratos.js");
      require("./js/core/racionales.js");
      require("./js/core/parametros.js");
      require("./js/core/identidad-opciones.js");
      require("./js/core/firmas.js");
      require("./js/core/math-renderer.js");
      require("./js/core/math-content.js");
      require("./js/core/modelo-ejercicio.js");
      require("./js/core/opciones.js");
      require("./js/core/validacion.js");
      require("./js/core/retroalimentacion.js");
      require("./js/core/generador.js");
      require("./js/core/registro.js");
      require("./js/core/modules/index.js");
      const loaded =
        root.TrigCoreRegistry && root.TrigCoreRegistry.getActive
          ? root.TrigCoreRegistry.getActive()
          : null;
      if (loaded) {
        return loaded;
      }
    }

    throw new Error(
      "No se cargo ningun modulo matematico activo antes de core.js.",
    );
  }

  const api = loadDefaultModule();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.TrigCore = api;
})(typeof window !== "undefined" ? window : globalThis);
