(function (root) {
  "use strict";

  const TRIG_LINEAR_RENDERER_ID = "trig-linear-renderer";

  const BASE_VARIANT = {
    id: "lineal",
    name: "Argumento lineal",
    description: "Integral directa con argumento kx + b.",
    appliesToTemplate: "*",
    status: "active",
    difficultyMin: 1,
    difficultyMax: 5,
    difficultyModifier: 0,
    parameterOverrides: {},
    renderHints: { rendererId: TRIG_LINEAR_RENDERER_ID },
    tags: ["directa", "argumento-lineal"],
    fallback: true,
  };

  const TRIG_LINEAR_VARIANTS = [
    BASE_VARIANT,
    {
      id: "directa-unitaria",
      name: "Directa unitaria",
      description: "A vale -1 o 1, k = 1 y b = 0.",
      appliesToTemplate: "*",
      status: "active",
      difficultyMin: 1,
      difficultyMax: 1,
      difficultyModifier: 0,
      parameterOverrides: { profileLevel: 1 },
      renderHints: { rendererId: TRIG_LINEAR_RENDERER_ID },
      tags: ["directa", "unitaria"],
    },
    {
      id: "cadena-simple",
      name: "Cadena simple",
      description: "A vale -1 o 1, k es no cero y b = 0.",
      appliesToTemplate: "*",
      status: "active",
      difficultyMin: 2,
      difficultyMax: 2,
      difficultyModifier: 0,
      parameterOverrides: { profileLevel: 2 },
      renderHints: { rendererId: TRIG_LINEAR_RENDERER_ID },
      tags: ["cadena", "sin-desplazamiento"],
    },
    {
      id: "coeficiente-externo",
      name: "Coeficiente externo",
      description: "A y k son no cero, b = 0.",
      appliesToTemplate: "*",
      status: "active",
      difficultyMin: 3,
      difficultyMax: 3,
      difficultyModifier: 0,
      parameterOverrides: { profileLevel: 3 },
      renderHints: { rendererId: TRIG_LINEAR_RENDERER_ID },
      tags: ["coeficiente", "sin-desplazamiento"],
    },
    {
      id: "desplazada",
      name: "Desplazada",
      description: "A, k y b varian; A y k no pueden ser cero.",
      appliesToTemplate: "*",
      status: "active",
      difficultyMin: 4,
      difficultyMax: 4,
      difficultyModifier: 0,
      parameterOverrides: { profileLevel: 4 },
      renderHints: { rendererId: TRIG_LINEAR_RENDERER_ID },
      tags: ["desplazamiento"],
    },
    {
      id: "coeficiente-fraccionario",
      name: "Coeficiente fraccionario",
      description: "Busca coeficiente final fraccionario y b no cero.",
      appliesToTemplate: "*",
      status: "active",
      difficultyMin: 5,
      difficultyMax: 5,
      difficultyModifier: 0,
      parameterOverrides: { profileLevel: 5 },
      renderHints: { rendererId: TRIG_LINEAR_RENDERER_ID },
      tags: ["fraccion", "desplazamiento"],
    },
  ];

  root.TrigLinearVariants = {
    TRIG_LINEAR_RENDERER_ID,
    BASE_VARIANT,
    TRIG_LINEAR_VARIANTS,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearVariants;
  }
})(typeof window !== "undefined" ? window : globalThis);
