(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../racionales.js");
    require("../../identidad-opciones.js");
    require("../../opciones.js");
    require("./familias.js");
    require("./errores.js");
    require("./variantes.js");
    require("./formato.js");
  }

  const Families = root.TrigLinearFamilies || {};
  const Errors = root.TrigLinearErrors || {};
  const Variants = root.TrigLinearVariants || {};
  const Format = root.TrigLinearFormat || {};
  const Rational = root.TrigRationalUtils || {};
  const OptionEngine = root.TrigOptionEngine || {};
  const OptionIdentity = root.TrigOptionIdentity || {};
  const { TRIG_LINEAR_RENDERER_ID } = Variants;
  const { ANSWER_CORES } = Families;
  const { WRONG_CORE_MAP } = Errors;
  const { rational, multiplyInt, divide, negate, absRational, equals } = Rational;
  const { createArgument, expressionPlain, expressionLatex, rationalKey, correctCoefficient } = Format;

  function safeIdPart(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
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

  function optionContext(exercise) {
    const generation = exercise && exercise.generation ? exercise.generation : {};
    const attempt =
      exercise && (exercise.attempt === 0 || exercise.attempt)
        ? exercise.attempt
        : generation.attempt;
    return {
      templateId: (exercise && exercise.templateId) || generation.templateId || "",
      variantId: (exercise && exercise.variantId) || generation.variantId || "",
      seed: (exercise && exercise.seed) || generation.seed || "",
      attempt: attempt === 0 || attempt ? String(attempt) : "",
    };
  }

  function optionKey(coefficient, core, argument) {
    return `${rationalKey(coefficient)}|${core}|${argument.key}`;
  }

  function createOption(params) {
    const displayPlain = expressionPlain(params);
    const displayLatex = expressionLatex(params);
    const key = optionKey(params.coefficient, params.core, params.argument);
    const deterministicId = OptionIdentity.deterministicOptionId
      ? OptionIdentity.deterministicOptionId([
          params.templateId || "trig-linear",
          params.variantId || "",
          params.seed || "",
          params.attempt === 0 || params.attempt ? String(params.attempt) : "",
          params.errorTag || params.errorType || "option",
          key,
        ])
      : `opt-${safeIdPart(`${params.errorTag || "option"}-${key}`)}`;
    const option = {
      id: params.id || deterministicId,
      value: displayPlain,
      isCorrect: Boolean(params.isCorrect),
      errorTag: params.errorTag,
      errorType: params.errorType || params.errorTag,
      sourceStrategy: params.sourceStrategy || params.errorType || params.errorTag,
      explanation: params.explanation || "",
      coefficient: params.coefficient,
      core: params.core,
      argument: params.argument,
      rendererId: TRIG_LINEAR_RENDERER_ID,
      displayPlain,
      displayLatex,
      displayExpression: displayPlain,
      display: {
        plain: displayPlain,
        latex: displayLatex,
      },
      debugData: params.debugData || {},
      metadata: params.metadata || {},
    };
    option.key = key;
    return option;
  }

  function distractorOption(params) {
    return createOption({
      ...params,
      isCorrect: false,
      sourceStrategy: params.sourceStrategy || params.errorTag,
      metadata: {
        ...(params.metadata || {}),
        sourceStrategy: params.sourceStrategy || params.errorTag,
      },
    });
  }

  function buildCorrectOption(exercise) {
    return createOption({
      ...optionContext(exercise),
      isCorrect: true,
      errorTag: "correct",
      coefficient: exercise.correctCoefficient,
      core: exercise.family.baseCore,
      argument: exercise.argument,
    });
  }

  function addUniqueOption(target, seen, option, correctKey) {
    if (!option || option.key === correctKey || seen.has(option.key)) {
      return false;
    }
    seen.add(option.key);
    target.push(option);
    return true;
  }

  function wrongFamilyCandidates(exercise) {
    const configured = WRONG_CORE_MAP[exercise.family.baseCore] || [];
    const fallback = ANSWER_CORES.filter(
      (core) => core !== exercise.family.baseCore,
    );
    const cores = configured.concat(
      fallback.filter((core) => !configured.includes(core)),
    );
    return cores.map((core) =>
      distractorOption({
        ...optionContext(exercise),
        errorTag: "wrong-family",
        coefficient: exercise.correctCoefficient,
        core,
        argument: exercise.argument,
      }),
    );
  }

  function genericCoefficientVariants(coefficient) {
    const variants = [];
    if (coefficient.d !== 1 && Math.abs(coefficient.n) !== 1) {
      const sign = coefficient.n < 0 ? -1 : 1;
      variants.push(rational(sign * coefficient.d, Math.abs(coefficient.n)));
    }
    variants.push(
      rational(coefficient.n + (coefficient.n >= 0 ? 1 : -1), coefficient.d),
    );
    variants.push(rational(coefficient.n, coefficient.d + 1));
    variants.push(rational(coefficient.n * 2, coefficient.d));
    return variants.filter(
      (value) => value.n !== 0 && !equals(value, coefficient),
    );
  }

  function buildDistractorCandidates(exercise, rng) {
    const candidates = [];
    const A = exercise.A;
    const k = exercise.k;
    const family = exercise.family;
    const argument = exercise.argument;

    candidates.push(...wrongFamilyCandidates(exercise));

    candidates.push(
      distractorOption({
        ...optionContext(exercise),
        errorTag: "wrong-base-sign",
        coefficient: negate(exercise.correctCoefficient),
        core: family.baseCore,
        argument,
      }),
    );

    candidates.push(
      distractorOption({
        ...optionContext(exercise),
        errorTag: "forgot-chain-factor",
        coefficient: multiplyInt(A, family.baseSign),
        core: family.baseCore,
        argument,
      }),
    );

    if (k.n < 0) {
      candidates.push(
        distractorOption({
          ...optionContext(exercise),
          errorTag: "ignored-negative-k",
          coefficient: divide(multiplyInt(A, family.baseSign), absRational(k)),
          core: family.baseCore,
          argument,
        }),
      );
    }

    candidates.push(
      distractorOption({
        ...optionContext(exercise),
        errorTag: "lost-external-sign",
        coefficient: divide(multiplyInt(negate(A), family.baseSign), k),
        core: family.baseCore,
        argument,
      }),
    );

    candidates.push(
      distractorOption({
        ...optionContext(exercise),
        errorTag: "copied-integrand",
        coefficient: exercise.correctCoefficient,
        core: family.integrandCore,
        argument,
      }),
    );

    if (exercise.b.n !== 0) {
      candidates.push(
        distractorOption({
          ...optionContext(exercise),
          errorTag: "lost-argument-shift",
          coefficient: exercise.correctCoefficient,
          core: family.baseCore,
          argument: createArgument(k, rational(0, 1)),
        }),
      );
    }

    const primary = shuffle(candidates, rng);
    const generic = genericCoefficientVariants(exercise.correctCoefficient).map(
      (coefficient) =>
        distractorOption({
          ...optionContext(exercise),
          errorTag: "generic-coefficient-error",
          coefficient,
          core: family.baseCore,
          argument,
        }),
    );

    return primary.concat(generic);
  }

  function buildOptions(exercise, optionCount, rng) {
    const correct = buildCorrectOption(exercise);
    const candidates = buildDistractorCandidates(exercise, rng);
    if (OptionEngine.buildOptionSet) {
      return OptionEngine.buildOptionSet({
        correctOption: correct,
        candidates,
        correctKey: correct.key,
        optionCount,
        rng,
        shuffle,
      });
    }

    const distractors = [];
    const seen = new Set();
    for (const candidate of candidates) {
      addUniqueOption(distractors, seen, candidate, correct.key);
      if (distractors.length >= optionCount - 1) {
        break;
      }
    }
    if (distractors.length < optionCount - 1) {
      return null;
    }
    return {
      correctOption: correct,
      distractors,
      options: shuffle([correct].concat(distractors), rng),
    };
  }

  root.TrigLinearDistractors = {
    safeIdPart,
    optionKey,
    createOption,
    distractorOption,
    buildCorrectOption,
    addUniqueOption,
    wrongFamilyCandidates,
    genericCoefficientVariants,
    buildDistractorCandidates,
    buildOptions,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearDistractors;
  }
})(typeof window !== "undefined" ? window : globalThis);
