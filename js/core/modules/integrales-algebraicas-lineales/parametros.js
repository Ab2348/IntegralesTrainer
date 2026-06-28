(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../parametros.js");
  }

  const ParameterPolicy = root.TrigParameterPolicy || {};

  const RANGE_LIMITS = { min: -12, max: 12 };
  const K_RANGE_LIMITS = { min: -8, max: 8 };
  const POSITIVE_N_RANGE = { min: 1, max: 5 };
  const NEGATIVE_N_RANGE = { min: -4, max: -2 };
  const COEFFICIENT_TYPES = ["integer"];

  const ALGEBRAIC_LINEAR_DIFFICULTY_PROFILE = {
    id: "algebraic-linear-direct",
    name: "Dificultad para integrales algebraicas con argumento lineal",
    levels: [
      {
        id: "1",
        name: "Base",
        description: "A vale -1 o 1, k = 1 y b = 0.",
        parameterRules: {
          A: "unit",
          k: "one",
          b: "zero",
          nPositive: { kind: "oneOf", values: [1, 2, 3] },
        },
      },
      {
        id: "2",
        name: "Argumento escalado",
        description: "A vale -1 o 1, k es no cero y b = 0.",
        parameterRules: { A: "unit", k: "non-zero", b: "zero" },
      },
      {
        id: "3",
        name: "Coeficiente externo",
        description: "A y k son no cero, b = 0.",
        parameterRules: { A: "non-zero", k: "non-zero", b: "zero" },
      },
      {
        id: "4",
        name: "Argumento desplazado",
        description: "A, k y b varian; A y k no pueden ser cero.",
        parameterRules: { A: "non-zero", k: "non-zero", b: "non-zero" },
      },
      {
        id: "5",
        name: "Mezcla avanzada",
        description: "Permite exponentes positivos, negativos y caso reciproco.",
        parameterRules: { A: "non-zero", k: "non-zero", b: "integer" },
      },
    ],
  };

  function parameterDescriptors() {
    return [
      {
        id: "A",
        name: "Coeficiente externo",
        type: "integer",
        range: RANGE_LIMITS,
        prohibited: [0],
        restrictions: ["A != 0"],
      },
      {
        id: "k",
        name: "Coeficiente interno",
        type: "integer",
        range: K_RANGE_LIMITS,
        prohibited: [0],
        restrictions: ["k != 0"],
      },
      {
        id: "b",
        name: "Termino independiente",
        type: "integer",
        range: RANGE_LIMITS,
        prohibited: [],
        restrictions: [],
      },
      {
        id: "n",
        name: "Exponente",
        type: "integer",
        values: [-4, -3, -2, -1, 1, 2, 3, 4, 5],
        prohibited: [],
        restrictions: [
          "n != -1 para familias de potencia",
          "n = -1 para reciproca-lineal",
        ],
      },
    ];
  }

  root.TrigAlgebraicLinearParameters = {
    RANGE_LIMITS,
    K_RANGE_LIMITS,
    POSITIVE_N_RANGE,
    NEGATIVE_N_RANGE,
    COEFFICIENT_TYPES,
    ALGEBRAIC_LINEAR_DIFFICULTY_PROFILE,
    parameterDescriptors,
    normalizeParameterRules: ParameterPolicy.normalizeParameterRules,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearParameters;
  }
})(typeof window !== "undefined" ? window : globalThis);
