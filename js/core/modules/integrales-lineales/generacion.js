(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../taxonomia.js");
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

  const Taxonomy = root.TrigExerciseTaxonomy || {};
  const ExerciseModel = root.TrigExerciseModel || {};
  const ExerciseGenerator = root.TrigExerciseGenerator || {};
  const OptionEngine = root.TrigOptionEngine || {};
  const ParameterPolicy = root.TrigParameterPolicy || {};
  const SignatureEngine = root.TrigSignatureEngine || {};
  const Families = root.TrigLinearFamilies || {};
  const Variants = root.TrigLinearVariants || {};
  const Parameters = root.TrigLinearParameters || {};
  const Format = root.TrigLinearFormat || {};
  const Distractors = root.TrigLinearDistractors || {};
  const Feedback = root.TrigLinearFeedback || {};
  const {
    FAMILY_MAP,
    MODE_FAMILIES,
    DEFAULT_MATH_FAMILY_ID,
    DEFAULT_METHOD_ID,
    DEFAULT_SUBMETHOD_ID,
  } = Families;
  const {
    BASE_VARIANT,
    TRIG_LINEAR_VARIANTS,
    RANGE_LIMITS,
    TRIG_LINEAR_RENDERER_ID,
  } = {
    ...Variants,
    ...Parameters,
  };
  const { TRIG_LINEAR_DIFFICULTY_PROFILE } = Parameters;
  const {
    rational,
    createArgument,
    correctCoefficient,
    integralPlain,
    integralLatex,
  } = Format;
  const { buildOptions } = Distractors;

  function randomInt(min, max, rng) {
    if (ParameterPolicy.randomInt) {
      return ParameterPolicy.randomInt(min, max, rng);
    }
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function choose(items, rng) {
    return items[Math.floor(rng() * items.length)];
  }

  function shuffle(items, rng) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
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
    const zeroCount = min <= 0 && max >= 0 ? 1 : 0;
    const valueCount = max - min + 1 - zeroCount;
    if (valueCount <= 0) {
      throw new Error("Range must include at least one non-zero value.");
    }
    const offset = randomInt(0, valueCount - 1, rng);
    const candidate = min + offset;
    return candidate >= 0 && min <= 0 ? candidate + 1 : candidate;
  }

  function sanitizeRange(minValue, maxValue) {
    if (ParameterPolicy.sanitizeRange) {
      return ParameterPolicy.sanitizeRange(minValue, maxValue, RANGE_LIMITS);
    }
    let min = Number.parseInt(minValue, 10);
    let max = Number.parseInt(maxValue, 10);
    if (!Number.isFinite(min)) {
      min = RANGE_LIMITS.min;
    }
    if (!Number.isFinite(max)) {
      max = RANGE_LIMITS.max;
    }
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    min = Math.max(RANGE_LIMITS.min, Math.min(RANGE_LIMITS.max, min));
    max = Math.max(RANGE_LIMITS.min, Math.min(RANGE_LIMITS.max, max));
    if (min === 0 && max === 0) {
      min = RANGE_LIMITS.min;
      max = RANGE_LIMITS.max;
    }
    return { min, max };
  }

  function normalizeParameterRules(rules) {
    return ParameterPolicy.normalizeParameterRules
      ? ParameterPolicy.normalizeParameterRules(rules)
      : rules || {};
  }

  function parameterRulesForLevel(level) {
    const profile = TRIG_LINEAR_DIFFICULTY_PROFILE || {};
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

  function satisfiesRule(rule, context) {
    if (ParameterPolicy.satisfiesParameterRule) {
      return ParameterPolicy.satisfiesParameterRule(rule, context);
    }
    return context && context.result && context.result.d !== 1;
  }

  function exerciseSignature(params, context) {
    const signatureContext = context || {};
    const template = signatureContext.template || params.template || null;
    const parts = [
      params.templateId || `trig-linear-${params.familyId}`,
      params.variantId || "",
      params.A,
      params.familyId,
      params.k,
      params.b,
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
    return `${params.A}|${params.familyId}|${params.k}|${params.b}`;
  }

  function safeIdPart(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function variantIdForDifficulty(difficulty) {
    const level = Number.parseInt(difficulty, 10) || 1;
    const variant = TRIG_LINEAR_VARIANTS.find(
      (item) =>
        !item.fallback &&
        level >= Number(item.difficultyMin || 1) &&
        level <= Number(item.difficultyMax || 5),
    );
    return variant ? variant.id : BASE_VARIANT.id;
  }

  function buildExerciseFromParams(params, optionCount, rng, metadata) {
    const family = FAMILY_MAP[params.familyId];
    if (!family) {
      throw new Error(`Unknown family: ${params.familyId}`);
    }

    const A = rational(params.A, 1);
    const k = rational(params.k, 1);
    const b = rational(params.b, 1);
    if (A.n === 0 || k.n === 0) {
      throw new Error("A and k must be non-zero.");
    }

    const argument = createArgument(k, b);
    const coefficient = correctCoefficient(A, family, k);
    const meta = metadata || {};
    const templateId = meta.templateId || `trig-linear-${family.id}`;
    const difficulty = String(meta.difficulty || params.difficulty || "1");
    const variantId = meta.variantId || variantIdForDifficulty(difficulty);
    const seedPart = safeIdPart(meta.seed);
    const attempt = meta.attempt === 0 || meta.attempt ? meta.attempt : "";
    const signature = exerciseSignature({
      ...params,
      templateId,
      variantId,
      template: meta.template,
    }, {
      template: meta.template,
      templateId,
      variantId,
    });
    const idParts = [templateId, variantId, signature];
    if (seedPart) {
      idParts.push(seedPart);
    }
    if (attempt === 0 || attempt) {
      idParts.push(String(attempt));
    }
    const exerciseId = `ex-${safeIdPart(idParts.join("-"))}`;

    const exercise = {
      id: exerciseId,
      A,
      k,
      b,
      familyId: family.id,
      family,
      mathFamilyId: meta.mathFamilyId || DEFAULT_MATH_FAMILY_ID,
      methodId: meta.methodId || DEFAULT_METHOD_ID,
      submethodId: meta.submethodId || DEFAULT_SUBMETHOD_ID,
      templateId,
      variantId,
      difficulty,
      validationMode: meta.validationMode,
      generatorId: meta.generatorId || "integrales-lineales",
      rendererId: meta.rendererId || TRIG_LINEAR_RENDERER_ID,
      seed: meta.seed || null,
      attempt,
      engineVersion: meta.engineVersion || "",
      feedbackRules: Array.isArray(meta.feedbackRules)
        ? meta.feedbackRules
        : Feedback.buildTrigFeedbackRules(),
      generationParams: {
        A: params.A,
        k: params.k,
        b: params.b,
        familyId: family.id,
        difficulty,
        variantId,
      },
      argument,
      correctCoefficient: coefficient,
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
    const rules = parameterRulesForLevel(level);
    if (level === 1) {
      return {
        A: integerForRule(rules.A || "unit", range, rng),
        k: integerForRule(rules.k || "one", range, rng),
        b: integerForRule(rules.b || "zero", range, rng),
        familyId,
      };
    }
    if (level === 2) {
      return {
        A: integerForRule(rules.A || "unit", range, rng),
        k: integerForRule(rules.k || "non-zero", range, rng),
        b: integerForRule(rules.b || "zero", range, rng),
        familyId,
      };
    }
    if (level === 3) {
      return {
        A: integerForRule(rules.A || "non-zero", range, rng),
        k: integerForRule(rules.k || "non-zero", range, rng),
        b: integerForRule(rules.b || "zero", range, rng),
        familyId,
      };
    }
    if (level === 4) {
      return {
        A: integerForRule(rules.A || "non-zero", range, rng),
        k: integerForRule(rules.k || "non-zero", range, rng),
        b: integerForRule(rules.b || "integer", range, rng),
        familyId,
      };
    }

    const family = FAMILY_MAP[familyId];
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const A = integerForRule(rules.A || "non-zero", range, rng);
      const k = integerForRule(rules.k || "non-zero", range, rng);
      const b = integerForRule(rules.b || "non-zero", range, rng);
      const coefficient = correctCoefficient(
        rational(A, 1),
        family,
        rational(k, 1),
      );
      if (
        satisfiesRule(rules.result || "fractional-coefficient", {
          result: coefficient,
        })
      ) {
        return { A, k, b, familyId };
      }
    }

    for (let A = range.min; A <= range.max; A += 1) {
      if (A === 0) {
        continue;
      }
      for (let k = range.min; k <= range.max; k += 1) {
        if (k === 0) {
          continue;
        }
        const coefficient = correctCoefficient(
          rational(A, 1),
          family,
          rational(k, 1),
        );
        if (
          !satisfiesRule(rules.result || "fractional-coefficient", {
            result: coefficient,
          })
        ) {
          continue;
        }
        const b = range.min !== 0 ? range.min : range.max !== 0 ? range.max : 1;
        return { A, k, b, familyId };
      }
    }

    return {
      A: integerForRule(rules.A || "non-zero", range, rng),
      k: integerForRule(rules.k || "non-zero", range, rng),
      b: integerForRule(rules.b || "non-zero", range, rng),
      familyId,
    };
  }

  function normalizeFamilyIds(ids) {
    const valid = Array.isArray(ids)
      ? ids.filter((id, index) => FAMILY_MAP[id] && ids.indexOf(id) === index)
      : [];
    return valid.length ? valid : MODE_FAMILIES.basic.slice();
  }

  function normalizeMethodIds(ids) {
    const methodMap = Taxonomy.METHOD_MAP || { [DEFAULT_METHOD_ID]: true };
    const valid = Array.isArray(ids)
      ? ids.filter((id, index) => methodMap[id] && ids.indexOf(id) === index)
      : [];
    return valid.length ? valid : [DEFAULT_METHOD_ID];
  }

  function normalizeMathFamilyIds(ids) {
    const mathFamilyMap = Taxonomy.MATH_FAMILY_MAP || {
      [DEFAULT_MATH_FAMILY_ID]: true,
    };
    const valid = Array.isArray(ids)
      ? ids.filter(
          (id, index) => mathFamilyMap[id] && ids.indexOf(id) === index,
        )
      : [];
    return valid.length ? valid : [DEFAULT_MATH_FAMILY_ID];
  }

  function generateExercise(settings, recentSignatures, rng) {
    const random = rng || Math.random;
    const optionCount = OptionEngine.optionCountForDifficulty(
      settings && settings.difficulty,
    );
    const familyIds = normalizeFamilyIds(
      settings.activeFamilyIds || MODE_FAMILIES[settings.mode],
    );
    const mathFamilyIds = normalizeMathFamilyIds(settings.activeMathFamilyIds);
    const methodIds = normalizeMethodIds(settings.activeMethodIds);
    const range = sanitizeRange(settings.rangeMin, settings.rangeMax);

    if (ExerciseGenerator.generateExercise) {
      const generated = ExerciseGenerator.generateExercise({
        settings,
        recentSignatures,
        rng: random,
        seed: settings.seed,
        maxAttempts: settings.maxAttempts,
        familyIds,
        mathFamilyIds,
        methodIds,
        range,
        optionCount,
      });
      if (generated) {
        return generated;
      }
      throw new Error(
        "No hay plantillas compatibles con la configuracion actual.",
      );
    }

    const recent = new Set(
      Array.isArray(recentSignatures) ? recentSignatures : [],
    );

    for (let attempt = 0; attempt < 300; attempt += 1) {
      const params = paramsForDifficulty(
        settings.difficulty,
        familyIds,
        range,
        random,
      );
      if (recent.has(exerciseSignature(params)) && attempt < 250) {
        continue;
      }
      const exercise = buildExerciseFromParams(params, optionCount, random, {
        difficulty: settings.difficulty,
        mathFamilyId: mathFamilyIds[0] || DEFAULT_MATH_FAMILY_ID,
        attempt,
      });
      if (exercise) {
        return exercise;
      }
    }

    throw new Error(
      "No se pudo generar un ejercicio unico con la configuracion actual.",
    );
  }

  root.TrigLinearGeneration = {
    randomInt,
    choose,
    shuffle,
    randomNonZero,
    sanitizeRange,
    exerciseSignature,
    parameterRulesForLevel,
    safeIdPart,
    variantIdForDifficulty,
    buildExerciseFromParams,
    paramsForDifficulty,
    normalizeFamilyIds,
    normalizeMethodIds,
    normalizeMathFamilyIds,
    generateExercise,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearGeneration;
  }
})(typeof window !== "undefined" ? window : globalThis);
