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
        errorTag: "invalid-option",
        errorType: "invalid-option",
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
      correctOption:
        exercise.correctAnswer ||
        options.find((option) => option.isCorrect) ||
        null,
      errorTag,
      errorType: selectedOption.errorType || errorTag,
      familyId: statsInfo.familyId || exercise.familyId || "",
      mathFamilyId: statsInfo.mathFamilyId || exercise.mathFamilyId || "",
      methodId: statsInfo.methodId || exercise.methodId || "",
      submethodId: statsInfo.submethodId || exercise.submethodId || "",
      difficulty: statsInfo.difficulty || exercise.difficulty || "",
      templateId: statsInfo.templateId || exercise.templateId || "",
      stats: {
        familyId: statsInfo.familyId || exercise.familyId || "",
        mathFamilyId: statsInfo.mathFamilyId || exercise.mathFamilyId || "",
        methodId: statsInfo.methodId || exercise.methodId || "",
        submethodId: statsInfo.submethodId || exercise.submethodId || "",
        difficulty: statsInfo.difficulty || exercise.difficulty || "",
        templateId: statsInfo.templateId || exercise.templateId || "",
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
