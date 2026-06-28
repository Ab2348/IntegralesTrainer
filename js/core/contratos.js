(function (root) {
  "use strict";

  const Diagnostics = root.TrigContractDiagnostics || {};
  const ParameterPolicy = root.TrigParameterPolicy || {};

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
    fallback: false,
  };

  const TEMPLATE_STATUSES = ["active", "experimental", "disabled", "pending"];
  const VALIDATION_MODES = [
    "multiple-choice",
    "symbolic",
    "numeric",
    "hybrid",
  ];

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

  function normalizeValidationMode(value) {
    return VALIDATION_MODES.includes(value) ? value : "multiple-choice";
  }

  function hasOwn(object, field) {
    return Object.prototype.hasOwnProperty.call(object, field);
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
        ? ParameterPolicy.sanitizeRange
          ? ParameterPolicy.sanitizeRange(source.range.min, source.range.max)
          : { ...source.range }
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
      fallback: Boolean(source.fallback),
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
    const id = source.id || source.errorType || source.errorTag || "unknown";
    return {
      id,
      errorType: source.errorType || source.errorTag || "unknown",
      errorTag: source.errorTag || source.errorType || "unknown",
      methodId: source.methodId || "",
      familyId: source.familyId || "",
      templateId: source.templateId || "",
      variantId: source.variantId || "",
      title: source.title || source.titleContent || "",
      message: source.message || source.messageContent || "",
      hint: source.hint || source.hintContent || "",
      severity: source.severity || "basic",
      details:
        typeof source.details === "function"
          ? source.details
          : typeof source.detailsContent === "function"
            ? source.detailsContent
            : null,
      metadata: cloneObject(source.metadata),
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

    const normalized = {
      difficultyMin: 1,
      difficultyMax: 5,
      validationMode: "multiple-choice",
      rendererId: "",
      parameters: [],
      restrictions: [],
      commonErrors: [],
      distractorStrategies: [],
      feedbackRules: [],
      tags: [],
      ...template,
      status,
      enabled: status !== "disabled",
      pending: status === "pending",
      validationMode: normalizeValidationMode(template.validationMode),
      rendererId:
        template.rendererId ||
        (template.renderHints && template.renderHints.rendererId) ||
        "",
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
      feedbackRules: (Array.isArray(template.feedbackRules)
        ? template.feedbackRules
        : []
      ).map(normalizeFeedbackRule),
      difficultyProfile: normalizeDifficultyProfile(template.difficultyProfile),
    };
    Object.defineProperties(normalized, {
      __sourceValidationMode: {
        value: template.validationMode,
        enumerable: false,
      },
      __hasSourceValidationMode: {
        value: hasOwn(template, "validationMode"),
        enumerable: false,
      },
    });
    return normalized;
  }

  function validateTemplateContract(template) {
    const warnings = [];
    const source = template || {};
    const requiredStringFields = [
      "id",
      "familyId",
      "mathFamilyId",
      "methodId",
      "submethodId",
    ];
    requiredStringFields.forEach((field) => {
      if (typeof source[field] !== "string" || !source[field]) {
        warnings.push(`missing-${field}`);
      }
    });
    if (!Number.isFinite(Number(source.difficultyMin))) {
      warnings.push("missing-difficultyMin");
    }
    if (!Number.isFinite(Number(source.difficultyMax))) {
      warnings.push("missing-difficultyMax");
    }
    const hasSourceValidationMode = hasOwn(source, "__hasSourceValidationMode")
      ? source.__hasSourceValidationMode
      : hasOwn(source, "validationMode");
    const sourceValidationMode = hasOwn(source, "__sourceValidationMode")
      ? source.__sourceValidationMode
      : source.validationMode;
    if (
      !hasSourceValidationMode ||
      sourceValidationMode === null ||
      sourceValidationMode === undefined ||
      sourceValidationMode === ""
    ) {
      warnings.push("missing-validationMode");
    } else if (
      typeof sourceValidationMode !== "string" ||
      !VALIDATION_MODES.includes(sourceValidationMode)
    ) {
      warnings.push("invalid-validationMode");
    }
    if (typeof source.rendererId !== "string" || !source.rendererId) {
      warnings.push("missing-rendererId");
    }
    if (!Array.isArray(source.variants) || !source.variants.length) {
      warnings.push("missing-variants");
    }
    if (!Array.isArray(source.parameters) || !source.parameters.length) {
      warnings.push("missing-parameters");
    }
    if (!Array.isArray(source.restrictions) || !source.restrictions.length) {
      warnings.push("missing-restrictions");
    }
    if (typeof source.buildCorrectAnswer !== "function") {
      warnings.push("missing-buildCorrectAnswer");
    }
    if (typeof source.buildDistractors !== "function") {
      warnings.push("missing-buildDistractors");
    }
    if (!Array.isArray(source.commonErrors) || !source.commonErrors.length) {
      warnings.push("missing-commonErrors");
    }
    if (
      !Array.isArray(source.distractorStrategies) ||
      !source.distractorStrategies.length
    ) {
      warnings.push("missing-distractorStrategies");
    }
    if (!Array.isArray(source.feedbackRules) || !source.feedbackRules.length) {
      warnings.push("missing-feedbackRules");
    }

    const feedbackErrorTypes = new Set(
      (source.feedbackRules || []).map((rule) => rule.errorType),
    );
    (source.distractorStrategies || []).forEach((strategy) => {
      const errorType =
        strategy && typeof strategy === "object"
          ? strategy.errorType || strategy.errorTag || strategy.id
          : strategy;
      if (errorType && !feedbackErrorTypes.has(errorType)) {
        warnings.push(`missing-feedbackRule:${errorType}`);
      }
    });

    const diagnostics = Diagnostics.fromWarningCodes
      ? Diagnostics.fromWarningCodes(warnings, source)
      : warnings.map((warning) => ({
          code: warning,
          severity: "warning",
          message: warning,
          field: "",
          blocking: false,
        }));

    return {
      valid: warnings.length === 0,
      warnings,
      diagnostics,
    };
  }

  root.TrigContractModels = {
    DIFFICULTY_LEVELS,
    DEFAULT_VARIANT,
    TEMPLATE_STATUSES,
    VALIDATION_MODES,
    normalizeValidationMode,
    normalizeVariant,
    normalizeDifficultyProfile,
    normalizeFeedbackRule,
    normalizeDistractorStrategy,
    normalizeParameter,
    normalizeRestriction,
    normalizeTemplate,
    validateTemplateContract,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigContractModels;
  }
})(typeof window !== "undefined" ? window : globalThis);
