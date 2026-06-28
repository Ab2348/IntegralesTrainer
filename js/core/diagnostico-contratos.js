(function (root) {
  "use strict";

  const BLOCKING_CODES = new Set([
    "missing-id",
    "missing-moduleId",
    "missing-familyId",
    "missing-mathFamilyId",
    "missing-methodId",
    "missing-submethodId",
    "missing-generate",
    "missing-difficultyMin",
    "missing-difficultyMax",
    "missing-validationMode",
    "missing-rendererId",
    "missing-variants",
    "missing-parameters",
    "missing-restrictions",
    "missing-buildCorrectAnswer",
    "missing-buildDistractors",
    "missing-commonErrors",
    "missing-distractorStrategies",
    "missing-feedbackRules",
    "invalid-validationMode",
  ]);

  const MESSAGES = {
    "missing-id": "La plantilla debe declarar un id estable.",
    "missing-moduleId": "El modulo matematico debe declarar moduleId.",
    "missing-moduleName": "El modulo matematico deberia declarar moduleName.",
    "missing-modelVersion": "El modulo matematico deberia declarar modelVersion.",
    "missing-generatorVersion": "El modulo matematico deberia declarar generatorVersion.",
    "missing-moduleGenerationApi": "El modulo debe exponer generateExercise() o templates registrables.",
    "missing-familyId": "La plantilla debe declarar familyId.",
    "missing-mathFamilyId": "La plantilla debe declarar mathFamilyId.",
    "missing-methodId": "La plantilla debe declarar methodId.",
    "missing-submethodId": "La plantilla debe declarar submethodId.",
    "missing-generate": "La plantilla debe exponer generate(context).",
    "missing-difficultyMin": "La plantilla debe declarar difficultyMin.",
    "missing-difficultyMax": "La plantilla debe declarar difficultyMax.",
    "missing-validationMode": "La plantilla debe declarar validationMode.",
    "missing-rendererId": "La plantilla debe declarar rendererId.",
    "invalid-validationMode": "La plantilla declara un validationMode no soportado.",
    "missing-variants": "La plantilla debe declarar al menos una variante.",
    "missing-parameters": "La plantilla debe declarar parametros.",
    "missing-restrictions": "La plantilla debe declarar restricciones.",
    "missing-buildCorrectAnswer": "La plantilla debe declarar buildCorrectAnswer().",
    "missing-buildDistractors": "La plantilla debe declarar buildDistractors().",
    "missing-commonErrors": "La plantilla debe declarar errores comunes.",
    "missing-distractorStrategies": "La plantilla debe declarar estrategias de distractores.",
    "missing-feedbackRules": "La plantilla debe declarar reglas de feedback.",
  };

  const RECOMMENDATIONS = {
    "missing-moduleId": "Agrega moduleId al objeto exportado por el modulo.",
    "missing-moduleName": "Agrega un nombre legible para diagnostico y documentacion.",
    "missing-modelVersion": "Declara la version del modelo universal que produce el modulo.",
    "missing-generatorVersion": "Declara la version del motor de generacion compatible.",
    "missing-moduleGenerationApi": "Expone generateExercise() o registra templates desde el bootstrap del modulo.",
    "missing-validationMode": "Declara validationMode de forma explicita; no hay modo heredado por compatibilidad.",
    "missing-rendererId": "Declara rendererId para que el core pueda enrutar el render del modulo.",
    "invalid-validationMode": "Usa uno de: multiple-choice, symbolic, numeric, hybrid.",
    "missing-feedbackRules": "Agrega una regla de feedback por cada errorType de distractor.",
  };

  function severityForCode(code, template) {
    if (template && template.status === "pending") {
      return "pending";
    }
    if (String(code).startsWith("info-")) {
      return "info";
    }
    return BLOCKING_CODES.has(String(code).split(":")[0]) ? "error" : "warning";
  }

  function diagnostic(code, template, field) {
    const severity = severityForCode(code, template);
    const baseCode = String(code).split(":")[0];
    return {
      code,
      severity,
      message: MESSAGES[baseCode] || code,
      field: field || "",
      recommendation: RECOMMENDATIONS[baseCode] || "",
      blocking: severity === "error",
    };
  }

  function fromWarningCodes(codes, template) {
    return (Array.isArray(codes) ? codes : []).map((code) => {
      const field = String(code).replace(/^missing-/, "").split(":")[0];
      return diagnostic(code, template, field);
    });
  }

  root.TrigContractDiagnostics = {
    diagnostic,
    fromWarningCodes,
    severityForCode,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigContractDiagnostics;
  }
})(typeof window !== "undefined" ? window : globalThis);
