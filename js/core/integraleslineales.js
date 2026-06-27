(function (root) {
  "use strict";

  function loadLinearModule() {
    if (root.TrigCoreModules && root.TrigCoreModules.integralesLineales) {
      return root.TrigCoreModules.integralesLineales;
    }

    if (typeof require === "function") {
      require("./taxonomia.js");
      require("./diagnostico-contratos.js");
      require("./contratos.js");
      require("./racionales.js");
      require("./parametros.js");
      require("./identidad-opciones.js");
      require("./firmas.js");
      require("./math-renderer.js");
      require("./math-content.js");
      require("./modelo-ejercicio.js");
      require("./opciones.js");
      require("./validacion.js");
      require("./retroalimentacion.js");
      require("./generador.js");
      require("./registro.js");
      return require("./modules/integrales-lineales/index.js");
    }

    throw new Error(
      "No se cargo js/core/modules/integrales-lineales/index.js antes de integraleslineales.js.",
    );
  }

  const api = loadLinearModule();

  root.TrigCoreModules = root.TrigCoreModules || {};
  root.TrigCoreModules.integralesLineales = api;
  if (root.TrigCoreRegistry && !root.TrigCoreRegistry.get(api.moduleId)) {
    root.TrigCoreRegistry.register(api);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
