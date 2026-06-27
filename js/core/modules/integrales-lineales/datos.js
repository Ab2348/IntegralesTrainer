(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../parametros.js");
  }

  const ParameterPolicy = root.TrigParameterPolicy || {};

  const TRIG_LINEAR_RENDERER_ID = "trig-linear-renderer";

  const ERROR_TAGS = [
    "wrong-family",
    "wrong-base-sign",
    "forgot-chain-factor",
    "ignored-negative-k",
    "lost-external-sign",
    "copied-integrand",
    "lost-argument-shift",
    "generic-coefficient-error",
  ];

  const ERROR_LABELS = {
    "wrong-family": "Familia incorrecta",
    "wrong-base-sign": "Signo base incorrecto",
    "forgot-chain-factor": "Factor de cadena olvidado",
    "ignored-negative-k": "Signo de k ignorado",
    "lost-external-sign": "Signo externo perdido",
    "copied-integrand": "Forma del integrando copiada",
    "lost-argument-shift": "Desplazamiento perdido",
    "generic-coefficient-error": "Coeficiente incorrecto",
    correct: "Correcto",
  };

  const FAMILY_DEFINITIONS = [
    {
      id: "sin",
      name: "sin",
      group: "basica",
      fDisplay: "sin(u)",
      FDisplay: "-cos(u)",
      baseSign: -1,
      baseCore: "cos",
      integrandCore: "sin",
      derivativeCore: "-sin(u)",
    },
    {
      id: "cos",
      name: "cos",
      group: "basica",
      fDisplay: "cos(u)",
      FDisplay: "sin(u)",
      baseSign: 1,
      baseCore: "sin",
      integrandCore: "cos",
      derivativeCore: "cos(u)",
    },
    {
      id: "tan",
      name: "tan",
      group: "logaritmica",
      fDisplay: "tan(u)",
      FDisplay: "-ln |cos(u)|",
      baseSign: -1,
      baseCore: "lnAbsCos",
      integrandCore: "tan",
      derivativeCore: "-tan(u)",
    },
    {
      id: "cot",
      name: "cot",
      group: "logaritmica",
      fDisplay: "cot(u)",
      FDisplay: "ln |sin(u)|",
      baseSign: 1,
      baseCore: "lnAbsSin",
      integrandCore: "cot",
      derivativeCore: "cot(u)",
    },
    {
      id: "sec2",
      name: "sec^2",
      group: "intermedia",
      fDisplay: "sec^2(u)",
      FDisplay: "tan(u)",
      baseSign: 1,
      baseCore: "tan",
      integrandCore: "sec2",
      derivativeCore: "sec^2(u)",
    },
    {
      id: "csc2",
      name: "csc^2",
      group: "intermedia",
      fDisplay: "csc^2(u)",
      FDisplay: "-cot(u)",
      baseSign: -1,
      baseCore: "cot",
      integrandCore: "csc2",
      derivativeCore: "-csc^2(u)",
    },
    {
      id: "secTan",
      name: "sec tan",
      group: "producto",
      fDisplay: "sec(u) tan(u)",
      FDisplay: "sec(u)",
      baseSign: 1,
      baseCore: "sec",
      integrandCore: "secTan",
      derivativeCore: "sec(u) tan(u)",
    },
    {
      id: "cscCot",
      name: "csc cot",
      group: "producto",
      fDisplay: "csc(u) cot(u)",
      FDisplay: "-csc(u)",
      baseSign: -1,
      baseCore: "csc",
      integrandCore: "cscCot",
      derivativeCore: "-csc(u) cot(u)",
    },
    {
      id: "sec",
      name: "sec",
      group: "logaritmica",
      fDisplay: "sec(u)",
      FDisplay: "ln |sec(u) + tan(u)|",
      baseSign: 1,
      baseCore: "lnAbsSecPlusTan",
      integrandCore: "sec",
      derivativeCore: "sec(u)",
    },
    {
      id: "csc",
      name: "csc",
      group: "logaritmica",
      fDisplay: "csc(u)",
      FDisplay: "ln |csc(u) - cot(u)|",
      baseSign: 1,
      baseCore: "lnAbsCscMinusCot",
      integrandCore: "csc",
      derivativeCore: "csc(u)",
    },
    {
      id: "arctan",
      name: "arctan",
      group: "inversa",
      fDisplay: "1 / (1 + u^2)",
      FDisplay: "arctan(u)",
      baseSign: 1,
      baseCore: "arctan",
      integrandCore: "atanDerivative",
      derivativeCore: "1 / (1 + u^2)",
    },
    {
      id: "arcsin",
      name: "arcsin",
      group: "inversa",
      fDisplay: "1 / sqrt(1 - u^2)",
      FDisplay: "arcsin(u)",
      baseSign: 1,
      baseCore: "arcsin",
      integrandCore: "asinDerivative",
      derivativeCore: "1 / sqrt(1 - u^2)",
    },
    {
      id: "arccos",
      name: "arccos",
      group: "inversa",
      fDisplay: "-1 / sqrt(1 - u^2)",
      FDisplay: "arccos(u)",
      baseSign: 1,
      baseCore: "arccos",
      integrandCore: "acosDerivative",
      derivativeCore: "-1 / sqrt(1 - u^2)",
    },
  ];

  const FAMILY_MAP = FAMILY_DEFINITIONS.reduce((map, family) => {
    map[family.id] = family;
    return map;
  }, {});

  const MODE_FAMILIES = {
    basic: ["sin", "cos"],
    intermediate: ["sin", "cos", "sec2", "csc2"],
    products: ["secTan", "cscCot"],
    logarithmic: ["tan", "cot", "sec", "csc"],
    inverse: ["arctan", "arcsin", "arccos"],
    mixed: FAMILY_DEFINITIONS.map((family) => family.id),
    custom: ["sin", "cos"],
  };

  const DEFAULT_MATH_FAMILY_ID = "trigonometrica-directa";
  const DEFAULT_METHOD_ID = "directa";
  const DEFAULT_SUBMETHOD_ID = "argumento-lineal";
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
  const DISTRACTOR_STRATEGIES = [
    "wrong-family",
    "wrong-base-sign",
    "forgot-chain-factor",
    "ignored-negative-k",
    "lost-external-sign",
    "copied-integrand",
    "lost-argument-shift",
    "generic-coefficient-error",
  ];

  const ANSWER_CORES = [
    "sin",
    "cos",
    "tan",
    "cot",
    "sec",
    "csc",
    "lnAbsCos",
    "lnAbsSin",
    "lnAbsSecPlusTan",
    "lnAbsCscMinusCot",
    "arctan",
    "arcsin",
    "arccos",
  ];

  const NEGATIVE_CORES = new Set(["acosDerivative"]);
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

  const WRONG_CORE_MAP = {
    sin: ["cos", "tan", "arcsin"],
    cos: ["sin", "cot", "arccos"],
    tan: ["cot", "sec", "sin"],
    cot: ["tan", "csc", "cos"],
    sec: ["tan", "lnAbsSecPlusTan", "sin"],
    csc: ["cot", "lnAbsCscMinusCot", "cos"],
    lnAbsCos: ["sin", "cos", "lnAbsSin"],
    lnAbsSin: ["cos", "sin", "lnAbsCos"],
    lnAbsSecPlusTan: ["sec", "tan", "lnAbsCos"],
    lnAbsCscMinusCot: ["csc", "cot", "lnAbsSin"],
    arctan: ["arcsin", "arccos", "tan"],
    arcsin: ["arctan", "arccos", "sin"],
    arccos: ["arcsin", "arctan", "cos"],
  };

  root.TrigLinearData = {
    TRIG_LINEAR_RENDERER_ID,
    ERROR_TAGS,
    ERROR_LABELS,
    FAMILY_DEFINITIONS,
    FAMILY_MAP,
    MODE_FAMILIES,
    DEFAULT_MATH_FAMILY_ID,
    DEFAULT_METHOD_ID,
    DEFAULT_SUBMETHOD_ID,
    BASE_VARIANT,
    TRIG_LINEAR_VARIANTS,
    TRIG_LINEAR_DIFFICULTY_PROFILE,
    DISTRACTOR_STRATEGIES,
    ANSWER_CORES,
    NEGATIVE_CORES,
    RANGE_LIMITS,
    COEFFICIENT_TYPES,
    WRONG_CORE_MAP,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearData;
  }
})(typeof window !== "undefined" ? window : globalThis);
