(function (root) {
  "use strict";

  const Taxonomy = root.TrigExerciseTaxonomy || {};

  function cloneArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function normalizeOption(option) {
    const source = option || {};
    return {
      ...source,
      id: source.id || `opt-${Math.random().toString(36).slice(2)}`,
      isCorrect: Boolean(source.isCorrect),
      errorTag: source.errorTag || (source.isCorrect ? "correct" : "unknown"),
      errorType:
        source.errorType || source.errorTag || (source.isCorrect ? "correct" : "unknown"),
      displayExpression: source.displayExpression || "",
      displayHtml: source.displayHtml || "",
      metadata: source.metadata || source.debugData || {},
    };
  }

  function createUniversalExercise(input) {
    const source = input || {};
    const options = cloneArray(source.options).map(normalizeOption);
    const correctAnswer = source.correctAnswer
      ? normalizeOption(source.correctAnswer)
      : options.find((option) => option.isCorrect) || null;
    const distractors = options.filter((option) => !option.isCorrect);
    const methodId = source.methodId || "directa";
    const mathFamilyId = source.mathFamilyId || "trigonometrica-directa";
    const difficulty = String(source.difficulty || "1");
    const templateId = source.templateId || source.familyId || "";

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
      integralShown: source.integralShown || {
        plain: source.integrandExpression || "",
        html: source.integrandHtml || "",
        latex: source.integrandLatex || "",
      },
      correctAnswer,
      options,
      distractors,
      explanation: source.explanation || "",
      generation: {
        generatorId: source.generatorId || "",
        templateId,
        seed: source.seed || null,
        params: source.generationParams || {},
        ...(source.generation || {}),
      },
      render: {
        integralPlain: source.integrandExpression || "",
        integralHtml: source.integrandHtml || "",
        correctAnswerPlain: correctAnswer ? correctAnswer.displayExpression : "",
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
