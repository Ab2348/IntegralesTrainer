(function (root) {
  "use strict";

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

  const MODE_DEFINITIONS = [
    { id: "basic", name: "Básico" },
    { id: "intermediate", name: "Intermedio" },
    { id: "products", name: "Productos" },
    { id: "logarithmic", name: "Logarítmico" },
    { id: "inverse", name: "Inversas" },
    { id: "mixed", name: "Mixto" },
    { id: "custom", name: "Personalizado" },
  ];

  const DEFAULT_MODE_ID = "basic";
  const CUSTOM_MODE_ID = "custom";

  const FAMILY_GROUPS = [
    {
      id: "basic-trig",
      label: "Trigonométricas básicas",
      families: ["sin", "cos"],
    },
    {
      id: "quotient-reciprocal",
      label: "Cocientes y recíprocas",
      families: ["tan", "cot", "sec", "csc"],
    },
    {
      id: "trig-derivatives",
      label: "Derivadas trigonométricas",
      families: ["sec2", "csc2", "secTan", "cscCot"],
    },
    {
      id: "inverse-trig",
      label: "Inversas trigonométricas",
      families: ["arctan", "arcsin", "arccos"],
    },
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

  const DEFAULT_MATH_FAMILY_ID = "trigonometrica-directa";
  const DEFAULT_METHOD_ID = "directa";
  const DEFAULT_SUBMETHOD_ID = "argumento-lineal";

  const MATH_FAMILIES = [
    {
      id: DEFAULT_MATH_FAMILY_ID,
      name: "Trigonométrica directa",
      enabled: true,
    },
  ];

  const METHODS = [
    {
      id: DEFAULT_METHOD_ID,
      name: "Directa",
      enabled: true,
    },
  ];

  function indexById(items) {
    return items.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});
  }

  const MATH_FAMILY_MAP = indexById(MATH_FAMILIES);
  const METHOD_MAP = indexById(METHODS);
  const MODE_MAP = indexById(MODE_DEFINITIONS);

  root.TrigLinearFamilies = {
    FAMILY_DEFINITIONS,
    FAMILY_MAP,
    MODE_FAMILIES,
    MODES: MODE_DEFINITIONS,
    MODE_MAP,
    defaultModeId: DEFAULT_MODE_ID,
    customModeId: CUSTOM_MODE_ID,
    FAMILY_GROUPS,
    familyGroups: FAMILY_GROUPS,
    ANSWER_CORES,
    NEGATIVE_CORES,
    DEFAULT_MATH_FAMILY_ID,
    DEFAULT_METHOD_ID,
    DEFAULT_SUBMETHOD_ID,
    MATH_FAMILIES,
    MATH_FAMILY_MAP,
    METHODS,
    METHOD_MAP,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearFamilies;
  }
})(typeof window !== "undefined" ? window : globalThis);
