(function (root) {
  "use strict";

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

  const DISTRACTOR_STRATEGIES = ERROR_TAGS.slice();

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

  root.TrigLinearErrors = {
    ERROR_TAGS,
    ERROR_LABELS,
    DISTRACTOR_STRATEGIES,
    WRONG_CORE_MAP,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearErrors;
  }
})(typeof window !== "undefined" ? window : globalThis);
