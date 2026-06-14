(function (root) {
  "use strict";

  const Taxonomy = root.TrigExerciseTaxonomy || {};
  const MathRenderer = root.TrigMathRenderer || {};

  function cloneArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function normalizeOption(option) {
    const source = option || {};
    const displayPlain =
      source.displayPlain || source.displayExpression || source.value || "";
    const displayLatex = source.displayLatex || source.latex || displayPlain;
    const displayHtml = source.displayHtml || source.html || displayLatex;
    return {
      ...source,
      id: source.id || `opt-${Math.random().toString(36).slice(2)}`,
      value: source.value || displayPlain,
      isCorrect: Boolean(source.isCorrect),
      errorTag: source.errorTag || (source.isCorrect ? "correct" : "unknown"),
      errorType:
        source.errorType || source.errorTag || (source.isCorrect ? "correct" : "unknown"),
      displayPlain,
      displayLatex,
      displayHtml,
      displayExpression: source.displayExpression || displayPlain,
      display: {
        plain: displayPlain,
        latex: displayLatex,
        html: displayHtml,
      },
      sourceStrategy: source.sourceStrategy || source.errorType || source.errorTag || "",
      explanation: source.explanation || "",
      metadata: source.metadata || source.debugData || {},
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
    const methodId = source.methodId || "directa";
    const mathFamilyId = source.mathFamilyId || "trigonometrica-directa";
    const difficulty = String(source.difficulty || "1");
    const templateId = source.templateId || source.familyId || "";
    const integralShown = MathRenderer.integralForExercise
      ? MathRenderer.integralForExercise(source)
      : source.integralShown || {
          plain: source.integrandExpression || "",
          html: source.integrandHtml || "",
          latex: source.integrandLatex || source.integrandExpression || "",
        };

    return {
      ...source,
      modelVersion: "1.3",
      id: source.id || `ex-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      familyId: source.familyId || "",
      mathFamilyId,
      methodId,
      submethodId: source.submethodId || "",
      templateId,
      variantId: source.variantId || "",
      difficulty,
      mathFamily:
        source.mathFamily ||
        (Taxonomy.getMathFamily ? Taxonomy.getMathFamily(mathFamilyId) : null),
      method:
        source.method ||
        (Taxonomy.getMethod ? Taxonomy.getMethod(methodId) : null),
      integralShown,
      correctAnswer,
      options,
      distractors,
      explanation: source.explanation || "",
      generation: {
        engineVersion: source.engineVersion || "1.3",
        generatorId: source.generatorId || "",
        templateId,
        seed: source.seed || null,
        params: source.generationParams || {},
        variantId: source.variantId || "",
        ...(source.generation || {}),
      },
      answer: source.answer || {
        expression: correctAnswer
          ? {
              plain: correctAnswer.displayPlain,
              latex: correctAnswer.displayLatex,
              html: correctAnswer.displayHtml,
            }
          : { plain: "", latex: "", html: "" },
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
        integralHtml: integralShown.html || source.integrandHtml || "",
        correctAnswerPlain: correctAnswer ? correctAnswer.displayPlain : "",
        correctAnswerLatex: correctAnswer ? correctAnswer.displayLatex : "",
        correctAnswerHtml: correctAnswer ? correctAnswer.displayHtml : "",
        ...(source.render || {}),
      },
      statsInfo: {
        familyId: source.familyId || "",
        mathFamilyId,
        methodId,
        submethodId: source.submethodId || "",
        difficulty,
        templateId,
        ...(source.statsInfo || {}),
      },
      metadata: source.metadata || {},
    };
  }

  root.TrigExerciseModel = {
    createUniversalExercise,
    normalizeOption,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigExerciseModel;
  }
})(typeof window !== "undefined" ? window : globalThis);
