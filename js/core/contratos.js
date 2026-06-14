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
    difficultyModifier: 0,
    parameterOverrides: {},
    renderHints: {},
  };

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

  function normalizeVariant(value, templateId) {
    const source = value && typeof value === "object" ? value : {};
    return {
      ...DEFAULT_VARIANT,
      ...source,
      id: source.id || DEFAULT_VARIANT.id,
      name: source.name || source.id || DEFAULT_VARIANT.name,
      appliesToTemplate:
        source.appliesToTemplate || templateId || DEFAULT_VARIANT.appliesToTemplate,
      difficultyModifier: Number.isFinite(Number(source.difficultyModifier))
        ? Number(source.difficultyModifier)
        : 0,
      parameterOverrides: cloneObject(source.parameterOverrides),
      renderHints: cloneObject(source.renderHints),
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

    return {
      difficultyMin: 1,
      difficultyMax: 5,
      enabled: true,
      pending: false,
      parameters: [],
      restrictions: [],
      commonErrors: [],
      distractorStrategies: [],
      ...template,
      variants: variants.map((variant) => normalizeVariant(variant, template.id)),
      commonErrors: uniqueStrings(template.commonErrors),
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
    normalizeVariant,
    normalizeDifficultyProfile,
    normalizeFeedbackRule,
    normalizeDistractorStrategy,
    normalizeTemplate,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigContractModels;
  }
})(typeof window !== "undefined" ? window : globalThis);
