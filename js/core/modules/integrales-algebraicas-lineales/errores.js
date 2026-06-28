(function (root) {
  "use strict";

  const ERROR_TAGS = [
    "correct",
    "forgot-chain-factor",
    "wrong-power-exponent",
    "used-power-rule-for-log",
    "copied-integrand",
    "lost-argument-shift",
    "lost-external-sign",
    "sign-error",
    "generic-coefficient-error",
  ];

  const ERROR_LABELS = {
    correct: "Correcto",
    "forgot-chain-factor": "Falta dividir entre k",
    "wrong-power-exponent": "Exponente de potencia incorrecto",
    "used-power-rule-for-log": "Caso logaritmico no reconocido",
    "copied-integrand": "Integrando copiado",
    "lost-argument-shift": "Desplazamiento del argumento perdido",
    "lost-external-sign": "Signo externo perdido",
    "sign-error": "Signo incorrecto",
    "generic-coefficient-error": "Coeficiente incorrecto",
  };

  const ERROR_TYPES = ERROR_TAGS.map((id) => ({
    id,
    name: ERROR_LABELS[id] || id,
    enabled: true,
  }));

  const ERROR_TYPE_MAP = ERROR_TYPES.reduce((map, item) => {
    map[item.id] = item;
    return map;
  }, {});

  const DISTRACTOR_STRATEGIES = ERROR_TAGS.filter((tag) => tag !== "correct").map(
    (tag) => ({
      id: tag,
      errorType: tag,
      errorTag: tag,
      sourceStrategy: tag,
    }),
  );

  root.TrigAlgebraicLinearErrors = {
    ERROR_TAGS,
    ERROR_LABELS,
    ERROR_TYPES,
    ERROR_TYPE_MAP,
    DISTRACTOR_STRATEGIES,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearErrors;
  }
})(typeof window !== "undefined" ? window : globalThis);
