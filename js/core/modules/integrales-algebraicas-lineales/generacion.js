(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../parametros.js");
    require("../../firmas.js");
    require("../../modelo-ejercicio.js");
    require("../../opciones.js");
    require("../../generador.js");
    require("./familias.js");
    require("./variantes.js");
    require("./parametros.js");
    require("./formato.js");
    require("./distractores.js");
    require("./feedback.js");
  }

  const ExerciseModel = root.TrigExerciseModel || {};
  const ExerciseGenerator = root.TrigExerciseGenerator || {};
  const OptionEngine = root.TrigOptionEngine || {};
  const ParameterPolicy = root.TrigParameterPolicy || {};
  const SignatureEngine = root.TrigSignatureEngine || {};
  const Families = root.TrigAlgebraicLinearFamilies || {};
  const Variants = root.TrigAlgebraicLinearVariants || {};
  const Parameters = root.TrigAlgebraicLinearParameters || {};
  const Format = root.TrigAlgebraicLinearFormat || {};
  const Distractors = root.TrigAlgebraicLinearDistractors || {};
  const Feedback = root.TrigAlgebraicLinearFeedback || {};
  const {
    FAMILY_MAP,
    MODE_FAMILIES,
    MATH_FAMILY_MAP,
    METHOD_MAP,
    defaultModeId,
    DEFAULT_MATH_FAMILY_ID,
    DEFAULT_METHOD_ID,
  } = Families;
  const {
    BASE_VARIANT,
    ALGEBRAIC_LINEAR_VARIANTS,
    ALGEBRAIC_LINEAR_RENDERER_ID,
  } = Variants;
  const {
    RANGE_LIMITS,
    K_RANGE_LIMITS,
    POSITIVE_N_RANGE,
    NEGATIVE_N_RANGE,
    ALGEBRAIC_LINEAR_DIFFICULTY_PROFILE,
  } = Parameters;
  const { rational, createArgument, correctAnswerShape, integralPlain, integralLatex } = Format;
  const { buildOptions } = Distractors;

  function randomInt(min, max, rng) {
    if (ParameterPolicy.randomInt) {
      return ParameterPolicy.randomInt(min, max, rng);
    }
    return Math.floor((rng || Math.random)() * (max - min + 1)) + min;
  }

  function choose(items, rng) {
    const source = Array.isArray(items) ? items : [];
    return source[Math.floor((rng || Math.random)() * source.length)];
  }

  function shuffle(items, rng) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor((rng || Math.random)() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function randomNonZero(min, max, rng) {
    if (ParameterPolicy.randomNonZero) {
      return ParameterPolicy.randomNonZero(min, max, rng);
    }
    let value = 0;
    while (value === 0) {
      value = randomInt(min, max, rng);
    }
    return value;
  }

  function sanitizeRange(minValue, maxValue, limits) {
    const bounds = limits || RANGE_LIMITS;
    if (ParameterPolicy.sanitizeRange) {
      return ParameterPolicy.sanitizeRange(minValue, maxValue, bounds);
    }
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
    return {
      min: Math.max(bounds.min, Math.min(bounds.max, min)),
      max: Math.max(bounds.min, Math.min(bounds.max, max)),
    };
  }

  function normalizeParameterRules(rules) {
    return ParameterPolicy.normalizeParameterRules
      ? ParameterPolicy.normalizeParameterRules(rules)
      : rules || {};
  }

  function parameterRulesForLevel(level) {
    const profile = ALGEBRAIC_LINEAR_DIFFICULTY_PROFILE || {};
    const levels = Array.isArray(profile.levels) ? profile.levels : [];
    const entry = levels.find((item) => String(item.id) === String(level));
    return normalizeParameterRules(entry && entry.parameterRules);
  }

  function integerForRule(rule, range, rng) {
    if (ParameterPolicy.integerForRule) {
      return ParameterPolicy.integerForRule(rule, range, rng);
    }
    if (rule === "unit") {
      return choose([-1, 1], rng);
    }
    if (rule === "one") {
      return 1;
    }
    if (rule === "zero") {
      return 0;
    }
    if (rule === "non-zero" || rule === "nonzero") {
      return randomNonZero(range.min, range.max, rng);
    }
    return randomInt(range.min, range.max, rng);
  }

  function exerciseSignature(params, context) {
    const signatureContext = context || {};
    const template = signatureContext.template || params.template || null;
    const parts = [
      params.templateId || `algebraic-linear-${params.familyId}`,
      params.variantId || "",
      params.A,
      params.k,
      params.b,
      params.n,
      params.familyId,
    ];
    if (template && SignatureEngine.buildTemplateSignature) {
      return SignatureEngine.buildTemplateSignature(template, params, {
        ...signatureContext,
        templateId: parts[0],
        variantId: parts[1],
        parts,
      });
    }
    if (SignatureEngine.buildSignature) {
      return SignatureEngine.buildSignature(parts);
    }
    return parts.join("|");
  }

  function safeIdPart(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function variantIdForDifficulty(difficulty) {
    const level = Number.parseInt(difficulty, 10) || 1;
    const variant = ALGEBRAIC_LINEAR_VARIANTS.find(
      (item) =>
        !item.fallback &&
        level >= Number(item.difficultyMin || 1) &&
        level <= Number(item.difficultyMax || 5),
    );
    return variant ? variant.id : BASE_VARIANT.id;
  }

  function nForFamily(family, level, rules, rng) {
    if (family.kind === "log") {
      return -1;
    }
    if (family.id === "potencia-lineal-positiva") {
      if (level === 1 && rules.nPositive) {
        return integerForRule(rules.nPositive, POSITIVE_N_RANGE, rng);
      }
      return randomInt(POSITIVE_N_RANGE.min, POSITIVE_N_RANGE.max, rng);
    }
    return randomInt(NEGATIVE_N_RANGE.min, NEGATIVE_N_RANGE.max, rng);
  }

  function buildExerciseFromParams(params, optionCount, rng, metadata) {
    const family = FAMILY_MAP[params.familyId];
    if (!family) {
      throw new Error(`Unknown family: ${params.familyId}`);
    }

    const A = rational(params.A, 1);
    const k = rational(params.k, 1);
    const b = rational(params.b, 1);
    const n = Number.parseInt(params.n, 10);
    if (A.n === 0 || k.n === 0) {
      throw new Error("A and k must be non-zero.");
    }
    if (family.kind === "log" && n !== -1) {
      throw new Error("La familia reciproca-lineal requiere n = -1.");
    }
    if (family.kind === "power" && n === -1) {
      throw new Error("Las familias de potencia no aceptan n = -1.");
    }

    const argument = createArgument(k, b);
    const shape = correctAnswerShape(A, k, n);
    const meta = metadata || {};
    const templateId = meta.templateId || `algebraic-linear-${family.id}`;
    const difficulty = String(meta.difficulty || params.difficulty || "1");
    const variantId = meta.variantId || variantIdForDifficulty(difficulty);
    const seedPart = safeIdPart(meta.seed);
    const attempt = meta.attempt === 0 || meta.attempt ? meta.attempt : "";
    const signature = exerciseSignature(
      { ...params, templateId, variantId, template: meta.template },
      { template: meta.template, templateId, variantId },
    );
    const idParts = [templateId, variantId, signature];
    if (seedPart) {
      idParts.push(seedPart);
    }
    if (attempt === 0 || attempt) {
      idParts.push(String(attempt));
    }

    const exercise = {
      id: `ex-${safeIdPart(idParts.join("-"))}`,
      A,
      k,
      b,
      n,
      familyId: family.id,
      family,
      mathFamilyId: meta.mathFamilyId || DEFAULT_MATH_FAMILY_ID,
      mathFamily:
        meta.mathFamily ||
        MATH_FAMILY_MAP[meta.mathFamilyId || DEFAULT_MATH_FAMILY_ID] ||
        null,
      methodId: meta.methodId || DEFAULT_METHOD_ID,
      method:
        meta.method ||
        METHOD_MAP[meta.methodId || DEFAULT_METHOD_ID] ||
        null,
      submethodId: meta.submethodId || family.submethodId,
      templateId,
      variantId,
      difficulty,
      validationMode: meta.validationMode,
      generatorId: meta.generatorId || "integrales-algebraicas-lineales",
      rendererId: meta.rendererId || ALGEBRAIC_LINEAR_RENDERER_ID,
      seed: meta.seed || null,
      attempt,
      engineVersion: meta.engineVersion || "",
      feedbackRules: Array.isArray(meta.feedbackRules)
        ? meta.feedbackRules
        : Feedback.buildAlgebraicFeedbackRules(),
      generationParams: {
        A: params.A,
        k: params.k,
        b: params.b,
        n,
        familyId: family.id,
        difficulty,
        variantId,
      },
      argument,
      answerKind: shape.answerKind,
      correctExponent: shape.exponent,
      correctCoefficient: shape.coefficient,
      signature,
    };
    exercise.integrandExpression = integralPlain(exercise);
    exercise.integrandLatex = integralLatex(exercise);
    exercise.integralShown = {
      plain: exercise.integrandExpression,
      latex: exercise.integrandLatex,
    };
    const optionSet = buildOptions(
      exercise,
      optionCount || 4,
      rng || Math.random,
    );
    if (!optionSet) {
      return null;
    }
    exercise.options = optionSet.options;
    exercise.correctAnswer =
      exercise.options.find((option) => option.isCorrect) ||
      optionSet.correctOption;
    exercise.distractors = optionSet.distractors;
    if (ExerciseModel.createUniversalExercise) {
      return ExerciseModel.createUniversalExercise(exercise);
    }
    return exercise;
  }

  function paramsForDifficulty(difficulty, familyIds, range, rng, variant) {
    const selectedVariant = variant || {};
    const profileLevel = Number.parseInt(
      selectedVariant.parameterOverrides &&
        selectedVariant.parameterOverrides.profileLevel,
      10,
    );
    const level =
      Number.isFinite(profileLevel) && profileLevel > 0
        ? profileLevel
        : Number.parseInt(difficulty, 10) || 1;
    const familyId = choose(familyIds, rng);
    const family = FAMILY_MAP[familyId];
    const rules = parameterRulesForLevel(level);
    const aRange = sanitizeRange(range && range.min, range && range.max, RANGE_LIMITS);
    const kRange = sanitizeRange(range && range.min, range && range.max, K_RANGE_LIMITS);
    return {
      A: integerForRule(rules.A || "non-zero", aRange, rng),
      k: integerForRule(rules.k || "non-zero", kRange, rng),
      b: integerForRule(rules.b || "integer", aRange, rng),
      n: nForFamily(family, level, rules, rng),
      familyId,
    };
  }

  function normalizeFamilyIds(ids) {
    const valid = Array.isArray(ids)
      ? ids.filter((id, index) => FAMILY_MAP[id] && ids.indexOf(id) === index)
      : [];
    return valid.length
      ? valid
      : (MODE_FAMILIES[defaultModeId] || Object.keys(FAMILY_MAP)).slice();
  }

  function normalizeMethodIds(ids) {
    const valid = Array.isArray(ids)
      ? ids.filter((id, index) => METHOD_MAP[id] && ids.indexOf(id) === index)
      : [];
    return valid.length ? valid : [DEFAULT_METHOD_ID];
  }

  function normalizeMathFamilyIds(ids) {
    const valid = Array.isArray(ids)
      ? ids.filter(
          (id, index) => MATH_FAMILY_MAP[id] && ids.indexOf(id) === index,
        )
      : [];
    return valid.length ? valid : [DEFAULT_MATH_FAMILY_ID];
  }

  function generateExercise(config) {
    const source = config || {};
    if (!source.settings || typeof source.settings !== "object") {
      throw new Error(
        "TrigAlgebraicLinearGeneration.generateExercise requiere un objeto config con settings.",
      );
    }
    const settings = source.settings || {};
    const random = source.rng || Math.random;
    const optionCount =
      Number.parseInt(source.optionCount, 10) ||
      OptionEngine.optionCountForDifficulty(settings.difficulty);
    const familyIds = normalizeFamilyIds(
      source.familyIds || settings.activeFamilyIds || MODE_FAMILIES[settings.mode],
    );
    const mathFamilyIds = normalizeMathFamilyIds(
      source.mathFamilyIds || settings.activeMathFamilyIds,
    );
    const methodIds = normalizeMethodIds(
      source.methodIds || settings.activeMethodIds,
    );
    const range =
      source.range || sanitizeRange(settings.rangeMin, settings.rangeMax, RANGE_LIMITS);

    if (typeof ExerciseGenerator.generateExercise !== "function") {
      throw new Error("El generador central de ejercicios no esta disponible.");
    }

    const generated = ExerciseGenerator.generateExercise({
      settings,
      recentSignatures: source.recentSignatures,
      rng: random,
      seed: source.seed || settings.seed,
      maxAttempts: source.maxAttempts || settings.maxAttempts,
      moduleId: "integrales-algebraicas-lineales",
      familyIds,
      mathFamilyIds,
      methodIds,
      range,
      optionCount,
    });
    if (generated) {
      return generated;
    }

    throw new Error("No hay plantillas compatibles con la configuracion actual.");
  }

  root.TrigAlgebraicLinearGeneration = {
    randomInt,
    choose,
    shuffle,
    randomNonZero,
    sanitizeRange,
    exerciseSignature,
    parameterRulesForLevel,
    safeIdPart,
    variantIdForDifficulty,
    nForFamily,
    buildExerciseFromParams,
    paramsForDifficulty,
    normalizeFamilyIds,
    normalizeMethodIds,
    normalizeMathFamilyIds,
    generateExercise,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearGeneration;
  }
})(typeof window !== "undefined" ? window : globalThis);
