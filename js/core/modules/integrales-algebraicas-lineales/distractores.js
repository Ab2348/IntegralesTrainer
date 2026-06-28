(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../racionales.js");
    require("../../identidad-opciones.js");
    require("../../opciones.js");
    require("./variantes.js");
    require("./formato.js");
  }

  const Rational = root.TrigRationalUtils || {};
  const OptionEngine = root.TrigOptionEngine || {};
  const OptionIdentity = root.TrigOptionIdentity || {};
  const Variants = root.TrigAlgebraicLinearVariants || {};
  const Format = root.TrigAlgebraicLinearFormat || {};
  const { ALGEBRAIC_LINEAR_RENDERER_ID } = Variants;
  const { rational, multiplyInt, divide, negate, equals } = Rational;
  const { createArgument, expressionPlain, expressionLatex, rationalKey } = Format;

  function safeIdPart(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
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

  function optionKey(coefficient, answerKind, exponent, argument) {
    return [
      rationalKey(coefficient),
      answerKind,
      exponent === null || exponent === undefined ? "" : String(exponent),
      argument.key,
    ].join("|");
  }

  function createOption(params) {
    const displayPlain = expressionPlain(params);
    const displayLatex = expressionLatex(params);
    const key = optionKey(
      params.coefficient,
      params.answerKind,
      params.exponent,
      params.argument,
    );
    const deterministicId = OptionIdentity.deterministicOptionId
      ? OptionIdentity.deterministicOptionId([
          params.templateId || "algebraic-linear",
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
      answerKind: params.answerKind,
      exponent: params.exponent,
      argument: params.argument,
      rendererId: ALGEBRAIC_LINEAR_RENDERER_ID,
      displayPlain,
      displayLatex,
      displayExpression: displayPlain,
      display: { plain: displayPlain, latex: displayLatex },
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
      answerKind: exercise.answerKind,
      exponent: exercise.correctExponent,
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

  function genericCoefficientVariants(coefficient) {
    const variants = [
      rational(coefficient.n + (coefficient.n >= 0 ? 1 : -1), coefficient.d),
      rational(coefficient.n, coefficient.d + 1),
      rational(coefficient.n * 2, coefficient.d),
      negate(coefficient),
    ];
    if (coefficient.d !== 1 && Math.abs(coefficient.n) !== 1) {
      const sign = coefficient.n < 0 ? -1 : 1;
      variants.push(rational(sign * coefficient.d, Math.abs(coefficient.n)));
    }
    return variants.filter(
      (value, index) =>
        value.n !== 0 &&
        !equals(value, coefficient) &&
        variants.findIndex((item) => equals(item, value)) === index,
    );
  }

  function sameShapeParams(exercise, errorTag, coefficient, argument) {
    return {
      ...optionContext(exercise),
      errorTag,
      coefficient,
      answerKind: exercise.answerKind,
      exponent: exercise.correctExponent,
      argument: argument || exercise.argument,
    };
  }

  function buildDistractorCandidates(exercise, rng) {
    const candidates = [];
    const A = exercise.A;
    const k = exercise.k;
    const argument = exercise.argument;

    if (exercise.answerKind === "power") {
      candidates.push(
        distractorOption({
          ...sameShapeParams(
            exercise,
            "forgot-chain-factor",
            divide(A, rational(exercise.n + 1, 1)),
          ),
        }),
      );
      candidates.push(
        distractorOption({
          ...sameShapeParams(exercise, "wrong-power-exponent", exercise.correctCoefficient),
          exponent: exercise.n,
        }),
      );
    } else {
      candidates.push(
        distractorOption({
          ...sameShapeParams(exercise, "forgot-chain-factor", A),
        }),
      );
      candidates.push(
        distractorOption({
          ...optionContext(exercise),
          errorTag: "used-power-rule-for-log",
          coefficient: divide(A, k),
          answerKind: "power",
          exponent: 0,
          argument,
        }),
      );
    }

    candidates.push(
      distractorOption({
        ...optionContext(exercise),
        errorTag: "copied-integrand",
        coefficient: A,
        answerKind: "power",
        exponent: exercise.n,
        argument,
      }),
    );
    candidates.push(
      distractorOption(
        sameShapeParams(exercise, "sign-error", negate(exercise.correctCoefficient)),
      ),
    );
    candidates.push(
      distractorOption(
        sameShapeParams(exercise, "lost-external-sign", divide(negate(A), k)),
      ),
    );
    if (exercise.b.n !== 0) {
      candidates.push(
        distractorOption(
          sameShapeParams(
            exercise,
            "lost-argument-shift",
            exercise.correctCoefficient,
            createArgument(k, rational(0, 1)),
          ),
        ),
      );
    }

    const generic = genericCoefficientVariants(exercise.correctCoefficient).map(
      (coefficient) =>
        distractorOption(
          sameShapeParams(exercise, "generic-coefficient-error", coefficient),
        ),
    );

    return shuffle(candidates, rng).concat(generic);
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
    candidates.forEach((candidate) => {
      if (distractors.length < optionCount - 1) {
        addUniqueOption(distractors, seen, candidate, correct.key);
      }
    });
    if (distractors.length < optionCount - 1) {
      return null;
    }
    return {
      correctOption: correct,
      distractors,
      options: shuffle([correct].concat(distractors), rng),
    };
  }

  root.TrigAlgebraicLinearDistractors = {
    safeIdPart,
    shuffle,
    optionKey,
    createOption,
    distractorOption,
    buildCorrectOption,
    addUniqueOption,
    genericCoefficientVariants,
    buildDistractorCandidates,
    buildOptions,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearDistractors;
  }
})(typeof window !== "undefined" ? window : globalThis);
