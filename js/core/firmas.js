(function (root) {
  "use strict";

  function normalizePart(value) {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  }

  function buildSignature(parts) {
    if (Array.isArray(parts)) {
      return parts.map(normalizePart).join("|");
    }
    const source = parts && typeof parts === "object" ? parts : {};
    return [
      source.templateId,
      source.variantId,
      source.familyId,
      source.methodId,
      source.submethodId,
      source.params,
    ]
      .map(normalizePart)
      .join("|");
  }

  function buildTemplateSignature(template, params, context) {
    const source = context && typeof context === "object" ? context : {};
    if (template && typeof template.buildSignature === "function") {
      return normalizePart(template.buildSignature(params || {}, source));
    }
    if (Array.isArray(source.parts)) {
      return buildSignature(source.parts);
    }
    return buildSignature(params || source);
  }

  root.TrigSignatureEngine = {
    buildSignature,
    buildTemplateSignature,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigSignatureEngine;
  }
})(typeof window !== "undefined" ? window : globalThis);
