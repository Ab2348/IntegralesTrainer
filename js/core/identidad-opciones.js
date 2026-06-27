(function (root) {
  "use strict";

  function optionIdentity(option) {
    if (!option) {
      return "";
    }
    return (
      option.key ||
      option.equivalenceKey ||
      option.value ||
      option.displayPlain ||
      option.displayExpression ||
      option.displayLatex ||
      option.id ||
      ""
    );
  }

  function safeIdPart(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120);
  }

  function deterministicOptionId(parts) {
    const source = Array.isArray(parts) ? parts : [parts];
    const id = source.map(safeIdPart).filter(Boolean).join("-");
    return `opt-${id || "option"}`;
  }

  root.TrigOptionIdentity = {
    optionIdentity,
    safeIdPart,
    deterministicOptionId,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigOptionIdentity;
  }
})(typeof window !== "undefined" ? window : globalThis);
