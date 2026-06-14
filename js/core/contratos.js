(function (root) {
  "use strict";

  const DIFFICULTY_LEVELS = [
    { id: "1", name: "Nivel 1", weight: 1 },
    { id: "2", name: "Nivel 2", weight: 2 },
    { id: "3", name: "Nivel 3", weight: 3 },
    { id: "4", name: "Nivel 4", weight: 4 },
    { id: "5", name: "Nivel 5", weight: 5 },
  ];

  const DEFAULT_VARIANT = {
    id: "base",
    name: "Base",
    description: "Presentacion base de la plantilla.",
    appliesToTemplate: "*",
    status: "active",
    difficultyMin: null,
    difficultyMax: null,
    difficultyModifier: 0,
    parameterOverrides: {},
    renderHints: {},
    tags: [],
  };

  const TEMPLATE_STATUSES = ["active", "experimental", "disabled", "pending"];

  function cloneObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? { ...value }
      : {};
  }

  function uniqueStrings(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter(
      (item, index) =>
        typeof item === "string" && item && value.indexOf(item) === index,
      );
  }

  function normalizeStatus(source) {
    if (source && TEMPLATE_STATUSES.includes(source.status)) {
      return source.status;
    }
    if (source && source.pending) {
      return "pending";
    }
    if (source && source.enabled === false) {
      return "disabled";
    }
    return "active";
  }

  function normalizeParameter(value) {
    if (typeof value === "string") {
      return {
        id: value,
        name: value,
        type: "any",
        values: [],
        range: null,
        prohibited: [],
        restrictions: [],
        required: true,
      };
    }
    const source = value && typeof value === "object" ? value : {};
    const id = source.id || source.name || "parameter";
    return {
      id,
      name: source.name || id,
      type: source.type || "any",
      values: Array.isArray(source.values) ? source.values.slice() : [],
      range: source.range && typeof source.range === "object"
        ? { ...source.range }
        : null,
      prohibited: Array.isArray(source.prohibited)
        ? source.prohibited.slice()
        : [],
      restrictions: uniqueStrings(source.restrictions),
      required: source.required !== false,
      metadata: cloneObject(source.metadata),
    };
  }

  function normalizeRestriction(value) {
    if (typeof value === "string") {
      return {
        id: value,
        description: value,
        severity: "error",
      };
    }
    const source = value && typeof value === "object" ? value : {};
    const id = source.id || source.description || "restriction";
    return {
      id,
      description: source.description || id,
      severity: source.severity || "error",
      metadata: cloneObject(source.metadata),
    };
  }

  function normalizeVariant(value, templateId) {
    const source = value && typeof value === "object" ? value : {};
    return {
      ...DEFAULT_VARIANT,
      ...source,
      id: source.id || DEFAULT_VARIANT.id,
      name: source.name || source.id || DEFAULT_VARIANT.name,
      appliesToTemplate:
        source.appliesToTemplate || templateId || DEFAULT_VARIANT.appliesToTemplate,
      status: normalizeStatus(source),
      difficultyMin: Number.isFinite(Number(source.difficultyMin))
        ? Number(source.difficultyMin)
        : null,
      difficultyMax: Number.isFinite(Number(source.difficultyMax))
        ? Number(source.difficultyMax)
        : null,
      difficultyModifier: Number.isFinite(Number(source.difficultyModifier))
        ? Number(source.difficultyModifier)
        : 0,
      parameterOverrides: cloneObject(source.parameterOverrides),
      renderHints: cloneObject(source.renderHints),
      tags: uniqueStrings(source.tags),
    };
  }

  function normalizeDifficultyProfile(value) {
    const source = value && typeof value === "object" ? value : {};
    const levels = Array.isArray(source.levels)
      ? source.levels
      : DIFFICULTY_LEVELS;
    return {
      id: source.id || "default",
      name: source.name || "Dificultad base",
      levels: levels.map((level) => ({
        id: String(level.id),
        name: level.name || `Nivel ${level.id}`,
        weight: Number.isFinite(Number(level.weight))
          ? Number(level.weight)
          : Number(level.id) || 1,
        description: level.description || "",
        parameterRules: cloneObject(level.parameterRules),
      })),
    };
  }

  function normalizeFeedbackRule(value) {
    const source = value && typeof value === "object" ? value : {};
    return {
      errorType: source.errorType || source.errorTag || "unknown",
      errorTag: source.errorTag || source.errorType || "unknown",
      methodId: source.methodId || "",
      familyId: source.familyId || "",
      message: source.message || "",
      hint: source.hint || "",
      severity: source.severity || "basic",
    };
  }

  function normalizeDistractorStrategy(value) {
    if (typeof value === "string") {
      return {
        id: value,
        errorType: value,
        errorTag: value,
        sourceStrategy: value,
        explanation: "",
        metadata: {},
      };
    }
    const source = value && typeof value === "object" ? value : {};
    const id = source.id || source.errorType || source.errorTag || "unknown";
    return {
      id,
      errorType: source.errorType || source.errorTag || id,
      errorTag: source.errorTag || source.errorType || id,
      sourceStrategy: source.sourceStrategy || id,
      explanation: source.explanation || "",
      metadata: cloneObject(source.metadata),
    };
  }

  function normalizeTemplate(template) {
    if (!template || typeof template.id !== "string" || !template.id) {
      throw new Error("La plantilla debe exponer un id.");
    }
    if (typeof template.generate !== "function") {
      throw new Error(`La plantilla ${template.id} debe exponer generate().`);
    }

    const variants = Array.isArray(template.variants) && template.variants.length
      ? template.variants
      : [DEFAULT_VARIANT];
    const status = normalizeStatus(template);

    return {
      difficultyMin: 1,
      difficultyMax: 5,
      parameters: [],
      restrictions: [],
      commonErrors: [],
      distractorStrategies: [],
      tags: [],
      ...template,
      status,
      enabled: status !== "disabled",
      pending: status === "pending",
      variants: variants.map((variant) => normalizeVariant(variant, template.id)),
      commonErrors: uniqueStrings(template.commonErrors),
      parameters: (Array.isArray(template.parameters)
        ? template.parameters
        : []
      ).map(normalizeParameter),
      restrictions: (Array.isArray(template.restrictions)
        ? template.restrictions
        : []
      ).map(normalizeRestriction),
      tags: uniqueStrings(template.tags),
      distractorStrategies: (Array.isArray(template.distractorStrategies)
        ? template.distractorStrategies
        : []
      ).map(normalizeDistractorStrategy),
      difficultyProfile: normalizeDifficultyProfile(template.difficultyProfile),
    };
  }

  root.TrigContractModels = {
    DIFFICULTY_LEVELS,
    DEFAULT_VARIANT,
    TEMPLATE_STATUSES,
    normalizeVariant,
    normalizeDifficultyProfile,
    normalizeFeedbackRule,
    normalizeDistractorStrategy,
    normalizeParameter,
    normalizeRestriction,
    normalizeTemplate,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigContractModels;
  }
})(typeof window !== "undefined" ? window : globalThis);
