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

  const PARAMETER_RULE_KINDS = [
    "fixed",
    "oneOf",
    "nonzero",
    "free",
    "nonzeroFractionResult",
  ];

  const RULE_ALIASES = {
    zero: { kind: "fixed", value: 0 },
    one: { kind: "fixed", value: 1 },
    unit: { kind: "oneOf", values: [-1, 1] },
    "non-zero": { kind: "nonzero" },
    nonzero: { kind: "nonzero" },
    integer: { kind: "free" },
    free: { kind: "free" },
    "fractional-coefficient": { kind: "nonzeroFractionResult" },
    nonzeroFractionResult: { kind: "nonzeroFractionResult" },
  };

  function randomInt(min, max, rng) {
    const random = typeof rng === "function" ? rng : Math.random;
    return Math.floor(random() * (max - min + 1)) + min;
  }

  function choose(items, rng) {
    const source = Array.isArray(items) ? items : [];
    if (!source.length) {
      return undefined;
    }
    const random = typeof rng === "function" ? rng : Math.random;
    return source[Math.floor(random() * source.length)];
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

  function cloneRule(rule) {
    return {
      ...rule,
      values: Array.isArray(rule.values) ? rule.values.slice() : rule.values,
    };
  }

  function normalizeParameterRule(rule) {
    if (typeof rule === "string") {
      return cloneRule(RULE_ALIASES[rule] || { kind: "free" });
    }
    const source = rule && typeof rule === "object" ? rule : {};
    const kind = source.kind || source.rule || source.type || "free";
    const normalizedKind = PARAMETER_RULE_KINDS.includes(kind) ? kind : "free";
    return {
      kind: normalizedKind,
      value: source.value,
      values: Array.isArray(source.values) ? source.values.slice() : [],
      range:
        source.range && typeof source.range === "object"
          ? sanitizeRange(source.range.min, source.range.max)
          : null,
      metadata:
        source.metadata && typeof source.metadata === "object"
          ? { ...source.metadata }
          : {},
    };
  }

  function normalizeParameterRules(rules) {
    const source = rules && typeof rules === "object" ? rules : {};
    return Object.keys(source).reduce((result, key) => {
      result[key] = normalizeParameterRule(source[key]);
      return result;
    }, {});
  }

  function rangeForRule(rule, fallbackRange) {
    return sanitizeRange(
      rule && rule.range && rule.range.min,
      rule && rule.range && rule.range.max,
      fallbackRange || RANGE_LIMITS,
    );
  }

  function integerForRule(rule, range, rng) {
    const normalized = normalizeParameterRule(rule);
    const effectiveRange = rangeForRule(normalized, range);
    if (normalized.kind === "fixed") {
      return normalized.value;
    }
    if (normalized.kind === "oneOf") {
      return choose(normalized.values, rng);
    }
    if (normalized.kind === "nonzero") {
      return randomNonZero(effectiveRange.min, effectiveRange.max, rng);
    }
    return randomInt(effectiveRange.min, effectiveRange.max, rng);
  }

  function isNonzeroFractionResult(value) {
    if (!value) {
      return false;
    }
    if (typeof value === "object" && Number.isFinite(Number(value.d))) {
      return Number(value.n) !== 0 && Number(value.d) !== 1;
    }
    const numerator = Number(value.numerator);
    const denominator = Number(value.denominator);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
      return false;
    }
    return numerator !== 0 && denominator !== 0 && numerator % denominator !== 0;
  }

  function satisfiesParameterRule(rule, context) {
    const normalized = normalizeParameterRule(rule);
    const source = context && typeof context === "object" ? context : {};
    if (normalized.kind === "nonzeroFractionResult") {
      return isNonzeroFractionResult(source.result || source);
    }
    return true;
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
    PARAMETER_RULE_KINDS,
    randomInt,
    choose,
    randomNonZero,
    sanitizeRange,
    normalizeCoefficientType,
    normalizeParameterRule,
    normalizeParameterRules,
    integerForRule,
    satisfiesParameterRule,
    isNonzeroFractionResult,
    coefficientRule,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigParameterPolicy;
  }
})(typeof window !== "undefined" ? window : globalThis);
