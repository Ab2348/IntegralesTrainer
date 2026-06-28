(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../parametros.js");
  }

  const ParameterPolicy = root.TrigParameterPolicy || {};

  const RANGE_LIMITS = ParameterPolicy.RANGE_LIMITS || {
    min: -20,
    max: 20,
  };

  const COEFFICIENT_TYPES = ParameterPolicy.COEFFICIENT_TYPES || [
    "integer",
    "rational",
    "irrational-simple",
    "symbolic",
    "pi-multiple",
    "sqrt",
  ];

  const TRIG_LINEAR_DIFFICULTY_PROFILE = {
    id: "trig-linear-direct",
    name: "Dificultad para integrales directas con argumento lineal",
    levels: [
      {
        id: "1",
        name: "Base",
        description: "A vale -1 o 1, k = 1 y b = 0.",
        parameterRules: { A: "unit", k: "one", b: "zero" },
      },
      {
        id: "2",
        name: "Cadena simple",
        description: "A vale -1 o 1, k es no cero y b = 0.",
        parameterRules: { A: "unit", k: "non-zero", b: "zero" },
      },
      {
        id: "3",
        name: "Coeficiente",
        description: "A y k son no cero, b = 0.",
        parameterRules: { A: "non-zero", k: "non-zero", b: "zero" },
      },
      {
        id: "4",
        name: "Desplazamiento",
        description: "A, k y b varian; A y k no pueden ser cero.",
        parameterRules: { A: "non-zero", k: "non-zero", b: "integer" },
      },
      {
        id: "5",
        name: "Fraccionario",
        description: "Busca coeficiente final fraccionario y b no cero.",
        parameterRules: {
          A: "non-zero",
          k: "non-zero",
          b: "non-zero",
          result: "fractional-coefficient",
        },
      },
    ],
  };

  root.TrigLinearParameters = {
    RANGE_LIMITS,
    COEFFICIENT_TYPES,
    TRIG_LINEAR_DIFFICULTY_PROFILE,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearParameters;
  }
})(typeof window !== "undefined" ? window : globalThis);
