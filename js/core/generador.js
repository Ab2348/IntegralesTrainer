(function (root) {
  "use strict";

  const Contracts = root.TrigContractModels || {};
  const Diagnostics = root.TrigContractDiagnostics || {};
  const OptionEngine = root.TrigOptionEngine || {};
  const Identity = root.TrigOptionIdentity || {};
  const templates = {};
  const ENGINE_VERSION = "1.4";
  const DEFAULT_MAX_ATTEMPTS = 300;

  function normalizeSeed(value) {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    return String(value);
  }

  function createSeedFromEntropy(rng) {
    const random = typeof rng === "function" ? rng : Math.random;
    return `seed-${Date.now()}-${Math.floor(random() * 0xffffffff).toString(36)}`;
  }

  function hashSeed(seed) {
    let hash = 2166136261;
    const text = normalizeSeed(seed) || "seed";
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createSeededRng(seed) {
    let state = hashSeed(seed) || 1;
    return function seededRng() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function registerTemplate(template) {
    const normalized = Contracts.normalizeTemplate
      ? Contracts.normalizeTemplate(template)
      : {
          difficultyMin: 1,
          difficultyMax: 5,
          enabled: true,
          pending: false,
          ...template,
        };
    const contract = Contracts.validateTemplateContract
      ? Contracts.validateTemplateContract(normalized)
      : { valid: true, warnings: [] };
    normalized.contractWarnings = contract.warnings || [];
    normalized.contractDiagnostics =
      contract.diagnostics ||
      (Diagnostics.fromWarningCodes
        ? Diagnostics.fromWarningCodes(normalized.contractWarnings, normalized)
        : []);
    normalized.isContractComplete = Boolean(contract.valid);
    normalized.hasBlockingContractErrors = normalized.contractDiagnostics.some(
      (diagnostic) => diagnostic && diagnostic.blocking,
    );
    if (
      normalized.contractWarnings.length &&
      typeof console !== "undefined" &&
      typeof console.warn === "function"
    ) {
      console.warn(
        `Plantilla ${normalized.id} incompleta: ${normalized.contractWarnings.join(", ")}`,
      );
    }
    templates[normalized.id] = normalized;
    return templates[normalized.id];
  }

  function listTemplates() {
    return Object.keys(templates).map((id) => templates[id]);
  }

  function templateSupportsDifficulty(template, difficulty) {
    const level = Number.parseInt(difficulty, 10) || 1;
    return (
      level >= Number(template.difficultyMin || 1) &&
      level <= Number(template.difficultyMax || 5)
    );
  }

  function findTemplates(filters) {
    const source = filters || {};
    const familyIds = Array.isArray(source.familyIds)
      ? new Set(source.familyIds)
      : null;
    const methodIds = Array.isArray(source.methodIds)
      ? new Set(source.methodIds)
      : null;
    const mathFamilyIds = Array.isArray(source.mathFamilyIds)
      ? new Set(source.mathFamilyIds)
      : null;
    const includePending = Boolean(source.includePending);
    const includeExperimental = source.includeExperimental !== false;
    const registeredTemplateIds = new Set(
      listTemplates().map((template) => template.id),
    );
    const excludedTemplateIds = Array.isArray(source.excludedTemplateIds)
      ? new Set(
          source.excludedTemplateIds.filter(
            (id, index) =>
              typeof id === "string" &&
              registeredTemplateIds.has(id) &&
              source.excludedTemplateIds.indexOf(id) === index,
          ),
        )
      : null;

    return listTemplates().filter((template) => {
      if (excludedTemplateIds && excludedTemplateIds.has(template.id)) {
        return false;
      }
      if (!template.enabled || template.status === "disabled") {
        return false;
      }
      if (
        template.status === "active" &&
        template.hasBlockingContractErrors
      ) {
        return false;
      }
      if (template.pending && !includePending) {
        return false;
      }
      if (template.status === "experimental" && !includeExperimental) {
        return false;
      }
      if (familyIds && !familyIds.has(template.familyId)) {
        return false;
      }
      if (mathFamilyIds && !mathFamilyIds.has(template.mathFamilyId)) {
        return false;
      }
      if (methodIds && !methodIds.has(template.methodId)) {
        return false;
      }
      return templateSupportsDifficulty(template, source.difficulty);
    });
  }

  function choose(items, rng) {
    const random = rng || Math.random;
    return items[Math.floor(random() * items.length)];
  }

  function chooseVariant(template, difficulty, rng) {
    const variants = Array.isArray(template.variants) ? template.variants : [];
    const level = Number.parseInt(difficulty, 10) || 1;
    const activeVariants = variants.filter((variant) => {
      if (!variant || variant.status === "disabled") {
        return false;
      }
      if (variant.difficultyMin !== null && level < variant.difficultyMin) {
        return false;
      }
      if (variant.difficultyMax !== null && level > variant.difficultyMax) {
        return false;
      }
      const effectiveDifficulty = level + Number(variant.difficultyModifier || 0);
      return (
        effectiveDifficulty >= Number(template.difficultyMin || 1) &&
        effectiveDifficulty <= Number(template.difficultyMax || 5)
      );
    });
    const specificVariants = activeVariants.filter((variant) => !variant.fallback);
    return (
      choose(
        specificVariants.length ? specificVariants : activeVariants.length ? activeVariants : variants,
        rng,
      ) || null
    );
  }

  function optionIdentity(option) {
    if (Identity.optionIdentity) {
      return Identity.optionIdentity(option);
    }
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

  function validateGeneratedExercise(exercise, context) {
    const errors = [];
    const warnings = [];
    const template = context && context.template ? context.template : null;
    const options = Array.isArray(exercise && exercise.options)
      ? exercise.options
      : [];
    const correctOptions = options.filter((option) => option && option.isCorrect);
    const optionKeys = new Set();
    const feedbackErrorTypes = new Set(
      template && Array.isArray(template.feedbackRules)
        ? template.feedbackRules.map((rule) => rule.errorType)
        : [],
    );
    const difficulty = String(
      (exercise && exercise.difficulty) ||
        (context && context.settings && context.settings.difficulty) ||
        "",
    );

    if (!exercise) {
      errors.push("missing-exercise");
    }
    if (exercise && !exercise.integralShown && !exercise.integrandExpression) {
      errors.push("missing-integral");
    }
    if (exercise && !exercise.correctAnswer) {
      errors.push("missing-correct-answer");
    }
    if (!options.length) {
      errors.push("missing-options");
    }
    if (correctOptions.length !== 1) {
      errors.push("invalid-correct-option-count");
    }

    options.forEach((option) => {
      const key = optionIdentity(option);
      if (!key) {
        errors.push("option-without-identity");
        return;
      }
      if (option.metadata && option.metadata.generatedFallbackId) {
        warnings.push("option-with-generated-fallback-id");
      }
      if (optionKeys.has(key)) {
        errors.push("duplicate-option");
      }
      optionKeys.add(key);
      if (!option.isCorrect && !(option.errorType || option.errorTag)) {
        errors.push("distractor-without-error-type");
      } else if (
        !option.isCorrect &&
        (!option.errorType || option.errorType === "unknown")
      ) {
        errors.push("distractor-with-unknown-error-type");
      } else if (
        !option.isCorrect &&
        feedbackErrorTypes.size &&
        !feedbackErrorTypes.has(option.errorType || option.errorTag)
      ) {
        errors.push(`distractor-without-feedback-rule:${option.errorType || option.errorTag}`);
      }
    });

    if (template) {
      if (Array.isArray(template.contractWarnings) && template.contractWarnings.length) {
        warnings.push(`template-contract-incomplete:${template.contractWarnings.join("|")}`);
      }
      if (template.hasBlockingContractErrors) {
        errors.push("template-contract-blocking-errors");
      }
      if (!templateSupportsDifficulty(template, difficulty)) {
        errors.push("difficulty-out-of-template-range");
      }
      if (
        typeof template.validateInstance === "function" &&
        !template.validateInstance(exercise, context)
      ) {
        errors.push("template-validation-failed");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  function hasExplicitValidationMode(exercise) {
    if (!exercise) {
      return false;
    }
    if (
      exercise.metadata &&
      Object.prototype.hasOwnProperty.call(
        exercise.metadata,
        "explicitValidationMode",
      )
    ) {
      return Boolean(exercise.metadata.explicitValidationMode);
    }
    return (
      Object.prototype.hasOwnProperty.call(exercise, "validationMode") &&
      exercise.validationMode !== null &&
      exercise.validationMode !== undefined &&
      exercise.validationMode !== ""
    );
  }

  function resolveValidationMode(exercise, template) {
    if (hasExplicitValidationMode(exercise)) {
      return exercise.validationMode;
    }
    if (
      template &&
      template.validationMode !== null &&
      template.validationMode !== undefined &&
      template.validationMode !== ""
    ) {
      return template.validationMode;
    }
    return "multiple-choice";
  }

  function annotateExercise(exercise, context) {
    if (!exercise) {
      return exercise;
    }
    const template = context.template || {};
    const variant = context.variant || {};
    const generationParams =
      exercise.generationParams ||
      (exercise.generation && exercise.generation.params) ||
      {};

    exercise.templateId = exercise.templateId || template.id || "";
    exercise.variantId = exercise.variantId || variant.id || "";
    exercise.validationMode = resolveValidationMode(exercise, template);
    exercise.seed = exercise.seed || context.seed || null;
    exercise.generation = {
      engineVersion: ENGINE_VERSION,
      generatorId: exercise.generatorId || template.generatorId || "",
      templateId: exercise.templateId,
      variantId: exercise.variantId,
      seed: exercise.seed,
      attempt: context.attempt,
      params: generationParams,
      ...(exercise.generation || {}),
    };
    exercise.metadata = {
      ...(exercise.metadata || {}),
      templateStatus: template.status || "active",
      variantStatus: variant.status || "active",
      contractWarnings: template.contractWarnings || [],
    };
    if (!exercise.feedbackRules && Array.isArray(template.feedbackRules)) {
      exercise.feedbackRules = template.feedbackRules;
    }
    return exercise;
  }

  function generateExercise(config) {
    const source = config || {};
    const entropyRng = source.rng || Math.random;
    const seed = normalizeSeed(source.seed) || createSeedFromEntropy(entropyRng);
    const random = createSeededRng(seed);
    const maxAttempts =
      Math.max(1, Number.parseInt(source.maxAttempts, 10) || DEFAULT_MAX_ATTEMPTS);
    const recent = new Set(
      Array.isArray(source.recentSignatures) ? source.recentSignatures : [],
    );
    const candidates = findTemplates({
      familyIds:
        source.familyIds ||
        (source.settings && source.settings.activeFamilyIds),
      mathFamilyIds:
        source.mathFamilyIds ||
        (source.settings && source.settings.activeMathFamilyIds),
      methodIds:
        source.methodIds ||
        (source.settings && source.settings.activeMethodIds),
      difficulty: source.settings && source.settings.difficulty,
      includePending:
        source.settings && source.settings.includePendingMethods,
      includeExperimental:
        !source.settings || source.settings.includeExperimentalMethods !== false,
      excludedTemplateIds:
        source.settings && source.settings.disabledTemplateIds,
    });

    if (!candidates.length) {
      return source.fallback ? source.fallback({ seed, rng: random }) : null;
    }

    let lastValidation = null;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const template = choose(candidates, random);
      const variant = chooseVariant(
        template,
        source.settings && source.settings.difficulty,
        random,
      );
      const exercise = template.generate({
        settings: source.settings || {},
        range: source.range,
        optionCount: OptionEngine.optionCountForDifficulty
          ? OptionEngine.optionCountForDifficulty(
              source.settings && source.settings.difficulty,
            )
          : source.optionCount,
        rng: random,
        seed,
        attempt,
        template,
        variant,
        engineVersion: ENGINE_VERSION,
      });
      const annotated = annotateExercise(exercise, {
        seed,
        attempt,
        template,
        variant,
        settings: source.settings || {},
      });
      const validation = validateGeneratedExercise(annotated, {
        template,
        variant,
        settings: source.settings || {},
      });
      if (!validation.valid) {
        lastValidation = validation;
        continue;
      }
      if (recent.has(annotated.signature) && attempt < maxAttempts - 50) {
        continue;
      }
      return annotated;
    }

    throw new Error(
      lastValidation && lastValidation.errors.length
        ? `No se pudo generar un ejercicio valido: ${lastValidation.errors.join(", ")}.`
        : "No se pudo generar un ejercicio unico con la configuracion actual.",
    );
  }

  function testTemplates(config) {
    const source = config || {};
    const iterations = Math.max(1, Number.parseInt(source.iterations, 10) || 20);
    const selectedTemplates =
      source.templates ||
      (source.filters
        ? findTemplates(source.filters)
        : listTemplates().filter(
            (template) => template.enabled && template.status !== "disabled",
          ));
    const results = [];

    selectedTemplates.forEach((template) => {
      const errors = [];
      const instanceWarnings = [];
      for (let index = 0; index < iterations; index += 1) {
        const seed = normalizeSeed(source.seed)
          ? `${source.seed}:${template.id}:${index}`
          : `template-test:${template.id}:${index}`;
        const rng = createSeededRng(seed);
        const difficulty =
          String(
            source.difficulty ||
              Math.min(
                Number(template.difficultyMax || 5),
                Math.max(Number(template.difficultyMin || 1), (index % 5) + 1),
              ),
          );
        const variant = chooseVariant(template, difficulty, rng);
        try {
          const exercise = template.generate({
            settings: {
              difficulty,
              activeFamilyIds: [template.familyId],
              activeMathFamilyIds: [template.mathFamilyId],
              activeMethodIds: [template.methodId],
              rangeMin: -20,
              rangeMax: 20,
              optionCount: OptionEngine.optionCountForDifficulty
                ? OptionEngine.optionCountForDifficulty(difficulty)
                : source.optionCount || 4,
            },
            optionCount: OptionEngine.optionCountForDifficulty
              ? OptionEngine.optionCountForDifficulty(difficulty)
              : source.optionCount || 4,
            rng,
            seed,
            attempt: index,
            template,
            variant,
            engineVersion: ENGINE_VERSION,
          });
          const annotated = annotateExercise(exercise, {
            seed,
            attempt: index,
            template,
            variant,
            settings: { difficulty },
          });
          const validation = validateGeneratedExercise(annotated, {
            template,
            variant,
            settings: { difficulty },
          });
          if (validation.warnings.length) {
            instanceWarnings.push({
              index,
              seed,
              warnings: validation.warnings,
            });
          }
          if (!validation.valid) {
            errors.push({
              index,
              seed,
              errors: validation.errors,
            });
          }
        } catch (error) {
          errors.push({
            index,
            seed,
            errors: [error && error.message ? error.message : String(error)],
          });
        }
      }
      results.push({
        templateId: template.id,
        passed: errors.length === 0,
        iterations,
        contractDiagnostics: template.contractDiagnostics || [],
        warnings: (template.contractDiagnostics || []).filter(
          (diagnostic) => diagnostic && diagnostic.severity === "warning",
        ),
        instanceWarnings,
        errors,
      });
    });

    return {
      engineVersion: ENGINE_VERSION,
      passed: results.every((result) => result.passed),
      templateCount: results.length,
      iterations,
      results,
    };
  }

  root.TrigExerciseGenerator = {
    ENGINE_VERSION,
    DEFAULT_MAX_ATTEMPTS,
    registerTemplate,
    listTemplates,
    findTemplates,
    generateExercise,
    normalizeSeed,
    createSeededRng,
    validateGeneratedExercise,
    testTemplates,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigExerciseGenerator;
  }
})(typeof window !== "undefined" ? window : globalThis);
