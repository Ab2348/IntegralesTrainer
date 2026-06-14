(function (root) {
  "use strict";

  const MATH_FAMILIES = [
    {
      id: "trigonometrica-directa",
      name: "Trigonometrica directa",
      enabled: true,
    },
    {
      id: "inmediata-general",
      name: "Inmediata general",
      enabled: false,
    },
    {
      id: "cambio-variable",
      name: "Cambio de variable",
      enabled: false,
    },
    {
      id: "partes",
      name: "Integracion por partes",
      enabled: false,
    },
    {
      id: "potencias-trigonometricas",
      name: "Potencias trigonometricas",
      enabled: false,
    },
    {
      id: "identidades-trigonometricas",
      name: "Identidades trigonometricas",
      enabled: false,
    },
    {
      id: "racional-algebraica",
      name: "Racional algebraica",
      enabled: false,
    },
    {
      id: "fracciones-parciales",
      name: "Fracciones parciales",
      enabled: false,
    },
    {
      id: "integral-definida",
      name: "Integral definida",
      enabled: false,
    },
    {
      id: "metodo-compuesto",
      name: "Metodo compuesto",
      enabled: false,
    },
    {
      id: "mixto",
      name: "Modo mixto",
      enabled: false,
    },
  ];

  const METHODS = [
    { id: "directa", name: "Directa", enabled: true },
    { id: "sustitucion", name: "Sustitucion", enabled: false },
    { id: "partes", name: "Integracion por partes", enabled: false },
    {
      id: "identidad-trigonometrica",
      name: "Identidad trigonometrica",
      enabled: false,
    },
    {
      id: "potencia-trigonometrica",
      name: "Potencia trigonometrica",
      enabled: false,
    },
    {
      id: "division-algebraica-previa",
      name: "Division algebraica previa",
      enabled: false,
    },
    {
      id: "fracciones-parciales",
      name: "Fracciones parciales",
      enabled: false,
    },
    {
      id: "cambio-variable-trigonometrico-simple",
      name: "Cambio de variable trigonometrico simple",
      enabled: false,
    },
    {
      id: "definida-tfc",
      name: "Integral definida por TFC",
      enabled: false,
    },
    {
      id: "definida-sustitucion",
      name: "Integral definida con sustitucion",
      enabled: false,
    },
    { id: "compuesto", name: "Metodo compuesto", enabled: false },
    {
      id: "reconocimiento-mixto",
      name: "Reconocimiento mixto",
      enabled: false,
    },
  ];

  const ERROR_TYPES = [
    { id: "wrong-family", name: "Familia incorrecta" },
    { id: "wrong-base-sign", name: "Signo base incorrecto" },
    { id: "forgot-chain-factor", name: "Factor de cadena olvidado" },
    { id: "ignored-negative-k", name: "Signo de k ignorado" },
    { id: "lost-external-sign", name: "Signo externo perdido" },
    { id: "copied-integrand", name: "Forma del integrando copiada" },
    { id: "lost-argument-shift", name: "Desplazamiento perdido" },
    { id: "generic-coefficient-error", name: "Coeficiente incorrecto" },
    { id: "constant-omitted", name: "Constante omitida" },
    { id: "wrong-method", name: "Metodo incorrecto" },
    { id: "simplification-error", name: "Simplificacion incorrecta" },
    { id: "correct", name: "Correcto" },
  ];

  function indexById(items) {
    return items.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});
  }

  const MATH_FAMILY_MAP = indexById(MATH_FAMILIES);
  const METHOD_MAP = indexById(METHODS);
  const ERROR_TYPE_MAP = indexById(ERROR_TYPES);

  function getMathFamily(id) {
    return MATH_FAMILY_MAP[id] || null;
  }

  function getMethod(id) {
    return METHOD_MAP[id] || null;
  }

  function getErrorType(id) {
    return ERROR_TYPE_MAP[id] || null;
  }

  function enabledIds(items) {
    return items.filter((item) => item.enabled).map((item) => item.id);
  }

  root.TrigExerciseTaxonomy = {
    MATH_FAMILIES,
    MATH_FAMILY_MAP,
    METHODS,
    METHOD_MAP,
    ERROR_TYPES,
    ERROR_TYPE_MAP,
    getMathFamily,
    getMethod,
    getErrorType,
    enabledMathFamilyIds: () => enabledIds(MATH_FAMILIES),
    enabledMethodIds: () => enabledIds(METHODS),
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigExerciseTaxonomy;
  }
})(typeof window !== "undefined" ? window : globalThis);
