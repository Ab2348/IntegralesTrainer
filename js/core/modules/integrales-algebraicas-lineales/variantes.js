(function (root) {
  "use strict";

  const ALGEBRAIC_LINEAR_RENDERER_ID = "algebraic-linear-renderer";

  const BASE_VARIANT = {
    id: "base",
    name: "Base",
    description: "A = +/-1, k = 1, b = 0.",
    status: "active",
    difficultyMin: 1,
    difficultyMax: 1,
    difficultyModifier: 0,
    parameterOverrides: { profileLevel: 1 },
    renderHints: {},
    tags: ["base"],
  };

  const ALGEBRAIC_LINEAR_VARIANTS = [
    BASE_VARIANT,
    {
      id: "argumento-escalado",
      name: "Argumento escalado",
      description: "A = +/-1, k distinto de 0 y b = 0.",
      status: "active",
      difficultyMin: 2,
      difficultyMax: 2,
      difficultyModifier: 0,
      parameterOverrides: { profileLevel: 2 },
      renderHints: {},
      tags: ["argumento-lineal"],
    },
    {
      id: "coeficiente-externo",
      name: "Coeficiente externo",
      description: "A y k distintos de 0, b = 0.",
      status: "active",
      difficultyMin: 3,
      difficultyMax: 3,
      difficultyModifier: 0,
      parameterOverrides: { profileLevel: 3 },
      renderHints: {},
      tags: ["coeficiente"],
    },
    {
      id: "argumento-desplazado",
      name: "Argumento desplazado",
      description: "A y k distintos de 0, b puede variar.",
      status: "active",
      difficultyMin: 4,
      difficultyMax: 4,
      difficultyModifier: 0,
      parameterOverrides: { profileLevel: 4 },
      renderHints: {},
      tags: ["desplazamiento"],
    },
    {
      id: "mezcla-avanzada",
      name: "Mezcla avanzada",
      description: "Incluye potencias positivas, negativas y reciprocas.",
      status: "active",
      difficultyMin: 5,
      difficultyMax: 5,
      difficultyModifier: 0,
      parameterOverrides: { profileLevel: 5 },
      renderHints: {},
      tags: ["mixto"],
    },
    {
      id: "fallback",
      name: "Fallback",
      description: "Variante de respaldo.",
      status: "active",
      difficultyMin: null,
      difficultyMax: null,
      difficultyModifier: 0,
      parameterOverrides: {},
      renderHints: {},
      tags: [],
      fallback: true,
    },
  ];

  root.TrigAlgebraicLinearVariants = {
    ALGEBRAIC_LINEAR_RENDERER_ID,
    BASE_VARIANT,
    ALGEBRAIC_LINEAR_VARIANTS,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearVariants;
  }
})(typeof window !== "undefined" ? window : globalThis);
