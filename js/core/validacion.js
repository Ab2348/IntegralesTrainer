(function (root) {
  "use strict";

  const VALIDATION_MODES = new Set([
    "multiple-choice",
    "symbolic",
    "numeric",
    "hybrid",
  ]);

  function normalizeValidationMode(value) {
    return VALIDATION_MODES.has(value) ? value : "multiple-choice";
  }

  function correctOptionFor(exercise, options) {
    if (!exercise) {
      return null;
    }
    return (
      (options || []).find((option) => option && option.isCorrect) ||
      exercise.correctAnswer ||
      null
    );
  }

  function statsFor(exercise, statsInfo, errorTag, errorType) {
    const source = statsInfo || {};
    return {
      familyId: source.familyId || (exercise && exercise.familyId) || "",
      mathFamilyId:
        source.mathFamilyId || (exercise && exercise.mathFamilyId) || "",
      methodId: source.methodId || (exercise && exercise.methodId) || "",
      submethodId:
        source.submethodId || (exercise && exercise.submethodId) || "",
      difficulty: source.difficulty || (exercise && exercise.difficulty) || "",
      templateId: source.templateId || (exercise && exercise.templateId) || "",
      variantId: source.variantId || (exercise && exercise.variantId) || "",
      errorTag,
      errorType,
    };
  }

  function invalidResult(exercise, options, errorTag, errorType) {
    const statsInfo = exercise && exercise.statsInfo ? exercise.statsInfo : {};
    const tag = errorTag || "invalid-option";
    const type = errorType || tag;
    const stats = statsFor(exercise, statsInfo, tag, type);
    return {
      isValid: false,
      isCorrect: false,
      selectedOption: null,
      selectedDistractor: null,
      distractor: null,
      correctOption: correctOptionFor(exercise, options),
      errorTag: tag,
      errorType: type,
      familyId: stats.familyId,
      mathFamilyId: stats.mathFamilyId,
      methodId: stats.methodId,
      submethodId: stats.submethodId,
      templateId: stats.templateId,
      variantId: stats.variantId,
      difficulty: stats.difficulty,
      stats,
    };
  }

  function validateMultipleChoice(exercise, optionId) {
    const options = Array.isArray(exercise && exercise.options)
      ? exercise.options
      : [];
    const selectedOption = options.find((option) => option.id === optionId) || null;
    const statsInfo = exercise && exercise.statsInfo ? exercise.statsInfo : {};

    if (!exercise || !selectedOption) {
      return invalidResult(
        exercise,
        options,
        "invalid-option",
        "invalid-option",
      );
    }

    const errorTag =
      selectedOption.errorTag ||
      selectedOption.errorType ||
      (selectedOption.isCorrect ? "correct" : "unknown");

    return {
      isValid: true,
      isCorrect: Boolean(selectedOption.isCorrect),
      selectedOption,
      selectedDistractor: selectedOption.isCorrect ? null : selectedOption,
      distractor: selectedOption.isCorrect ? null : selectedOption,
      correctOption:
        options.find((option) => option.isCorrect) ||
        exercise.correctAnswer ||
        null,
      errorTag,
      errorType: selectedOption.errorType || errorTag,
      familyId: statsInfo.familyId || exercise.familyId || "",
      mathFamilyId: statsInfo.mathFamilyId || exercise.mathFamilyId || "",
      methodId: statsInfo.methodId || exercise.methodId || "",
      submethodId: statsInfo.submethodId || exercise.submethodId || "",
      difficulty: statsInfo.difficulty || exercise.difficulty || "",
      templateId: statsInfo.templateId || exercise.templateId || "",
      variantId: statsInfo.variantId || exercise.variantId || "",
      stats: {
        familyId: statsInfo.familyId || exercise.familyId || "",
        mathFamilyId: statsInfo.mathFamilyId || exercise.mathFamilyId || "",
        methodId: statsInfo.methodId || exercise.methodId || "",
        submethodId: statsInfo.submethodId || exercise.submethodId || "",
        difficulty: statsInfo.difficulty || exercise.difficulty || "",
        templateId: statsInfo.templateId || exercise.templateId || "",
        variantId: statsInfo.variantId || exercise.variantId || "",
        errorTag,
        errorType: selectedOption.errorType || errorTag,
      },
    };
  }

  function validateAnswer(exercise, answer) {
    const validationMode = normalizeValidationMode(
      exercise && exercise.validationMode,
    );
    if (validationMode === "multiple-choice") {
      return validateMultipleChoice(exercise, answer);
    }
    return invalidResult(
      exercise,
      Array.isArray(exercise && exercise.options) ? exercise.options : [],
      "unsupported-validation-mode",
      "unsupported-validation-mode",
    );
  }

  root.TrigValidation = {
    VALIDATION_MODES: Array.from(VALIDATION_MODES),
    normalizeValidationMode,
    validateAnswer,
    validateMultipleChoice,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigValidation;
  }
})(typeof window !== "undefined" ? window : globalThis);
