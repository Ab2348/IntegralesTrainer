(function (root) {
  "use strict";

  const RANGE_LIMITS = {
    min: -20,
    max: 20,
  };

  const COEFFICIENT_TYPES = [
    "integer",
    "rational",
    "irrational-simple",
    "symbolic",
    "pi-multiple",
    "sqrt",
  ];

  function randomInt(min, max, rng) {
    const random = typeof rng === "function" ? rng : Math.random;
    return Math.floor(random() * (max - min + 1)) + min;
  }

  function randomNonZero(min, max, rng) {
    const zeroCount = min <= 0 && max >= 0 ? 1 : 0;
    const valueCount = max - min + 1 - zeroCount;
    if (valueCount <= 0) {
      throw new Error("Range must include at least one non-zero value.");
    }
    const offset = randomInt(0, valueCount - 1, rng);
    const candidate = min + offset;
    return candidate >= 0 && min <= 0 ? candidate + 1 : candidate;
  }

  function sanitizeRange(minValue, maxValue, limits) {
    const bounds = limits || RANGE_LIMITS;
    let min = Number.parseInt(minValue, 10);
    let max = Number.parseInt(maxValue, 10);
    if (!Number.isFinite(min)) {
      min = bounds.min;
    }
    if (!Number.isFinite(max)) {
      max = bounds.max;
    }
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    min = Math.max(bounds.min, Math.min(bounds.max, min));
    max = Math.max(bounds.min, Math.min(bounds.max, max));
    if (min === 0 && max === 0) {
      min = bounds.min;
      max = bounds.max;
    }
    return { min, max };
  }

  function normalizeCoefficientType(type) {
    return COEFFICIENT_TYPES.includes(type) ? type : "integer";
  }

  function coefficientRule(config) {
    const source = config && typeof config === "object" ? config : {};
    return {
      type: normalizeCoefficientType(source.type),
      range: sanitizeRange(
        source.range && source.range.min,
        source.range && source.range.max,
      ),
      prohibited: Array.isArray(source.prohibited)
        ? source.prohibited.slice()
        : [],
      required: source.required !== false,
      metadata: source.metadata && typeof source.metadata === "object"
        ? { ...source.metadata }
        : {},
    };
  }

  root.TrigParameterPolicy = {
    RANGE_LIMITS,
    COEFFICIENT_TYPES,
    randomInt,
    randomNonZero,
    sanitizeRange,
    normalizeCoefficientType,
    coefficientRule,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigParameterPolicy;
  }
})(typeof window !== "undefined" ? window : globalThis);
