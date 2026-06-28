(function (root) {
  "use strict";

  const FAMILY_DEFINITIONS = [
    {
      id: "potencia-lineal-positiva",
      name: "Potencia lineal positiva",
      group: "potencias-algebraicas",
      kind: "power",
      nMin: 1,
      nMax: 5,
      submethodId: "potencia-lineal",
    },
    {
      id: "potencia-lineal-negativa",
      name: "Potencia lineal negativa",
      group: "potencias-algebraicas",
      kind: "power",
      nMin: -4,
      nMax: -2,
      submethodId: "potencia-lineal",
    },
    {
      id: "reciproca-lineal",
      name: "Recíproca lineal",
      group: "caso-logaritmico",
      kind: "log",
      nMin: -1,
      nMax: -1,
      submethodId: "reciproca-lineal",
    },
  ];

  function indexById(items) {
    return items.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});
  }

  const FAMILY_MAP = indexById(FAMILY_DEFINITIONS);

  const MODE_FAMILIES = {
    basic: ["potencia-lineal-positiva"],
    negative: ["potencia-lineal-negativa"],
    logarithmic: ["reciproca-lineal"],
    mixed: FAMILY_DEFINITIONS.map((family) => family.id),
    custom: ["potencia-lineal-positiva"],
  };

  const MODE_DEFINITIONS = [
    { id: "basic", name: "Básico" },
    { id: "negative", name: "Exponentes negativos" },
    { id: "logarithmic", name: "Recíprocas" },
    { id: "mixed", name: "Mixto" },
    { id: "custom", name: "Personalizado" },
  ];

  const DEFAULT_MODE_ID = "basic";
  const CUSTOM_MODE_ID = "custom";

  const FAMILY_GROUPS = [
    {
      id: "potencias-algebraicas",
      label: "Potencias algebraicas",
      families: ["potencia-lineal-positiva", "potencia-lineal-negativa"],
    },
    {
      id: "caso-logaritmico",
      label: "Caso logarítmico",
      families: ["reciproca-lineal"],
    },
  ];

  const DEFAULT_MATH_FAMILY_ID = "algebraica-inmediata";
  const DEFAULT_METHOD_ID = "sustitucion-lineal-directa";

  const MATH_FAMILIES = [
    {
      id: DEFAULT_MATH_FAMILY_ID,
      name: "Algebraica inmediata",
      enabled: true,
    },
  ];

  const METHODS = [
    {
      id: DEFAULT_METHOD_ID,
      name: "Sustitución lineal directa",
      enabled: true,
    },
  ];

  root.TrigAlgebraicLinearFamilies = {
    FAMILY_DEFINITIONS,
    FAMILY_MAP,
    MODE_FAMILIES,
    MODES: MODE_DEFINITIONS,
    MODE_MAP: indexById(MODE_DEFINITIONS),
    defaultModeId: DEFAULT_MODE_ID,
    customModeId: CUSTOM_MODE_ID,
    FAMILY_GROUPS,
    familyGroups: FAMILY_GROUPS,
    MATH_FAMILIES,
    MATH_FAMILY_MAP: indexById(MATH_FAMILIES),
    METHODS,
    METHOD_MAP: indexById(METHODS),
    DEFAULT_MATH_FAMILY_ID,
    DEFAULT_METHOD_ID,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearFamilies;
  }
})(typeof window !== "undefined" ? window : globalThis);
