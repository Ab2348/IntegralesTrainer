(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("./familias.js");
    require("./errores.js");
    require("./variantes.js");
    require("./parametros.js");
  }

  const Families = root.TrigLinearFamilies || {};
  const Errors = root.TrigLinearErrors || {};
  const Variants = root.TrigLinearVariants || {};
  const Parameters = root.TrigLinearParameters || {};

  // Agregador temporal de compatibilidad interna; los datos nuevos deben vivir
  // en archivos especializados del modulo, no agregarse aqui.
  root.TrigLinearData = {
    ...Variants,
    ...Errors,
    ...Families,
    ...Parameters,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearData;
  }
})(typeof window !== "undefined" ? window : globalThis);
