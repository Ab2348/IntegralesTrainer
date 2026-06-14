(function (root) {
  "use strict";

  function validateMultipleChoice(exercise, optionId) {
    const options = Array.isArray(exercise && exercise.options)
      ? exercise.options
      : [];
    const selectedOption = options.find((option) => option.id === optionId) || null;
    const statsInfo = exercise && exercise.statsInfo ? exercise.statsInfo : {};

    if (!exercise || !selectedOption) {
      return {
        isValid: false,
        isCorrect: false,
        selectedOption: null,
        selectedDistractor: null,
        distractor: null,
        errorTag: "invalid-option",
        errorType: "invalid-option",
        familyId: statsInfo.familyId || (exercise && exercise.familyId) || "",
        mathFamilyId:
          statsInfo.mathFamilyId || (exercise && exercise.mathFamilyId) || "",
        methodId: statsInfo.methodId || (exercise && exercise.methodId) || "",
        submethodId:
          statsInfo.submethodId || (exercise && exercise.submethodId) || "",
        templateId: statsInfo.templateId || (exercise && exercise.templateId) || "",
        variantId: statsInfo.variantId || (exercise && exercise.variantId) || "",
        difficulty: statsInfo.difficulty || (exercise && exercise.difficulty) || "",
        stats: { ...statsInfo },
      };
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

  root.TrigValidation = {
    validateMultipleChoice,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigValidation;
  }
})(typeof window !== "undefined" ? window : globalThis);
