(function (root) {
  "use strict";

  const Identity = root.TrigOptionIdentity || {};
  const VALIDATION_MODES = new Set([
    "multiple-choice",
    "symbolic",
    "numeric",
    "hybrid",
  ]);

  function cloneArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function safeIdPart(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120);
  }

  function deterministicExerciseId(source) {
    if (source.id) {
      return source.id;
    }
    const generation = source.generation || {};
    const parts = [
      source.templateId || source.familyId || "exercise",
      source.variantId || generation.variantId || "base",
      source.signature || "instance",
      source.seed || generation.seed || "seedless",
      source.attempt === 0 || source.attempt
        ? String(source.attempt)
        : generation.attempt === 0 || generation.attempt
          ? String(generation.attempt)
          : "attempt",
    ];
    return `ex-${parts.map(safeIdPart).filter(Boolean).join("-")}`;
  }

  function normalizeExpression(source, fallbackPlain, fallbackLatex) {
    const value = source && typeof source === "object" ? source : {};
    const plain =
      value.plain ||
      value.displayPlain ||
      value.displayExpression ||
      value.value ||
      fallbackPlain ||
      "";
    const latex =
      value.latex ||
      value.displayLatex ||
      value.promptLatex ||
      fallbackLatex ||
      plain;
    return { plain, latex };
  }

  function normalizeValidationMode(value) {
    return VALIDATION_MODES.has(value) ? value : "multiple-choice";
  }

  function hasExplicitValidationMode(source) {
    return (
      Object.prototype.hasOwnProperty.call(source, "validationMode") &&
      source.validationMode !== null &&
      source.validationMode !== undefined &&
      source.validationMode !== ""
    );
  }

  function normalizeOption(option) {
    const source = option || {};
    const displayPlain =
      source.displayPlain || source.displayExpression || source.value || "";
    const displayLatex = source.displayLatex || source.latex || displayPlain;
    const display = normalizeExpression(source.display, displayPlain, displayLatex);
    const hadInputId = Boolean(source.id);
    const fallbackId = Identity.deterministicOptionId([
      source.errorTag || source.errorType || (source.isCorrect ? "correct" : "option"),
      source.key || source.equivalenceKey || displayPlain || displayLatex,
    ]);

    return {
      ...source,
      id: source.id || fallbackId,
      value: source.value || displayPlain,
      isCorrect: Boolean(source.isCorrect),
      errorTag:
        source.errorTag ||
        source.errorType ||
        (source.isCorrect ? "correct" : "unknown"),
      errorType:
        source.errorType || source.errorTag || (source.isCorrect ? "correct" : "unknown"),
      displayPlain,
      displayLatex,
      displayExpression: source.displayExpression || displayPlain,
      display,
      sourceStrategy: source.sourceStrategy || source.errorType || source.errorTag || "",
      explanation: source.explanation || "",
      metadata: {
        ...(source.metadata || source.debugData || {}),
        generatedFallbackId: !hadInputId,
      },
    };
  }

  function createUniversalExercise(input) {
    const source = input || {};
    const optionInputs = cloneArray(source.options);
    if (
      source.correctAnswer &&
      !optionInputs.some((option) => option && option.isCorrect)
    ) {
      optionInputs.push({ ...source.correctAnswer, isCorrect: true });
    }
    const options = optionInputs.map(normalizeOption);
    const correctAnswer = options.find((option) => option.isCorrect) || null;
    const distractors = options.filter((option) => !option.isCorrect);
    const methodId = source.methodId || "";
    const mathFamilyId = source.mathFamilyId || "";
    const difficulty = String(source.difficulty || "1");
    const templateId = source.templateId || source.familyId || "";
    const explicitValidationMode = hasExplicitValidationMode(source);
    const validationMode = normalizeValidationMode(source.validationMode);
    const integralShown = normalizeExpression(
      source.integralShown,
      source.integrandExpression || "",
      source.integrandLatex || source.integrandExpression || "",
    );

    return {
      ...source,
      modelVersion: "1.5",
      id: deterministicExerciseId(source),
      familyId: source.familyId || "",
      mathFamilyId,
      methodId,
      submethodId: source.submethodId || "",
      templateId,
      variantId: source.variantId || "",
      difficulty,
      validationMode,
      mathFamily: source.mathFamily || null,
      method: source.method || null,
      integralShown,
      promptLatex: source.promptLatex || integralShown.latex || "",
      optionsLatex: options.map((option) => option.displayLatex || ""),
      correctAnswerLatex: correctAnswer ? correctAnswer.displayLatex : "",
      feedbackLatex: source.feedbackLatex || "",
      formulaRefs: cloneArray(source.formulaRefs),
      distractorErrorTypes: distractors.map(
        (option) => option.errorType || option.errorTag || "",
      ),
      correctAnswer,
      options,
      distractors,
      explanation: source.explanation || "",
      generation: {
        ...(source.generation || {}),
        engineVersion: source.engineVersion || "1.5",
        generatorId: source.generatorId || "",
        templateId,
        seed: source.seed || null,
        params: source.generationParams || {},
        variantId: source.variantId || "",
      },
      answer: source.answer || {
        expression: correctAnswer
          ? {
              plain: correctAnswer.displayPlain,
              latex: correctAnswer.displayLatex,
            }
          : { plain: "", latex: "" },
        equivalenceKey:
          (correctAnswer && (correctAnswer.equivalenceKey || correctAnswer.key)) ||
          "",
        includesConstant: correctAnswer
          ? /\+\s*C\b/.test(correctAnswer.displayPlain || "")
          : false,
      },
      render: {
        integralPlain: integralShown.plain || source.integrandExpression || "",
        integralLatex: integralShown.latex || source.integrandLatex || "",
        correctAnswerPlain: correctAnswer ? correctAnswer.displayPlain : "",
        correctAnswerLatex: correctAnswer ? correctAnswer.displayLatex : "",
        ...(source.render || {}),
      },
      statsInfo: {
        familyId: source.familyId || "",
        mathFamilyId,
        methodId,
        submethodId: source.submethodId || "",
        difficulty,
        templateId,
        variantId: source.variantId || "",
        ...(source.statsInfo || {}),
      },
      metadata: {
        ...(source.metadata || {}),
        explicitValidationMode,
      },
    };
  }

  root.TrigExerciseModel = {
    createUniversalExercise,
    normalizeOption,
    normalizeValidationMode,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigExerciseModel;
  }
})(typeof window !== "undefined" ? window : globalThis);
