(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../taxonomia.js");
    require("../../parametros.js");
    require("../../firmas.js");
    require("../../modelo-ejercicio.js");
    require("../../opciones.js");
    require("../../generador.js");
    require("./datos.js");
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
  const Data = root.TrigLinearData || {};
  const Format = root.TrigLinearFormat || {};
  const Distractors = root.TrigLinearDistractors || {};
  const Feedback = root.TrigLinearFeedback || {};
  const {
    FAMILY_MAP,
    MODE_FAMILIES,
    DEFAULT_MATH_FAMILY_ID,
    DEFAULT_METHOD_ID,
    DEFAULT_SUBMETHOD_ID,
    BASE_VARIANT,
    TRIG_LINEAR_VARIANTS,
    RANGE_LIMITS,
    TRIG_LINEAR_RENDERER_ID,
  } = Data;
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

  function exerciseSignature(params) {
    if (SignatureEngine.buildSignature) {
      return SignatureEngine.buildSignature([
        params.templateId || `trig-linear-${params.familyId}`,
        params.variantId || "",
        params.A,
        params.familyId,
        params.k,
        params.b,
      ]);
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
    if (level === 1) {
      return { A: choose([-1, 1], rng), k: 1, b: 0, familyId };
    }
    if (level === 2) {
      return {
        A: choose([-1, 1], rng),
        k: randomNonZero(range.min, range.max, rng),
        b: 0,
        familyId,
      };
    }
    if (level === 3) {
      return {
        A: randomNonZero(range.min, range.max, rng),
        k: randomNonZero(range.min, range.max, rng),
        b: 0,
        familyId,
      };
    }
    if (level === 4) {
      return {
        A: randomNonZero(range.min, range.max, rng),
        k: randomNonZero(range.min, range.max, rng),
        b: randomInt(range.min, range.max, rng),
        familyId,
      };
    }

    const family = FAMILY_MAP[familyId];
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const A = randomNonZero(range.min, range.max, rng);
      const k = randomNonZero(range.min, range.max, rng);
      const b = randomNonZero(range.min, range.max, rng);
      const coefficient = correctCoefficient(
        rational(A, 1),
        family,
        rational(k, 1),
      );
      if (coefficient.d !== 1) {
        return { A, k, b, familyId };
      }
    }

    return {
      A: randomNonZero(range.min, range.max, rng),
      k: randomNonZero(range.min, range.max, rng),
      b: randomNonZero(range.min, range.max, rng),
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
    const optionCount = OptionEngine.optionCountForDifficulty
      ? OptionEngine.optionCountForDifficulty(settings && settings.difficulty)
      : Math.max(
          4,
          Math.min(6, Number.parseInt(settings.optionCount, 10) || 4),
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
