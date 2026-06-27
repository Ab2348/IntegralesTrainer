(function (root) {
  "use strict";

  const BLOCKING_CODES = new Set([
    "missing-id",
    "missing-familyId",
    "missing-mathFamilyId",
    "missing-methodId",
    "missing-submethodId",
    "missing-generate",
    "missing-difficultyMin",
    "missing-difficultyMax",
  ]);

  function severityForCode(code, template) {
    if (template && template.status === "pending") {
      return "pending";
    }
    return BLOCKING_CODES.has(code) ? "error" : "warning";
  }

  function diagnostic(code, template, field) {
    const severity = severityForCode(code, template);
    return {
      code,
      severity,
      message: code,
      field: field || "",
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
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigContractDiagnostics;
  }
})(typeof window !== "undefined" ? window : globalThis);
