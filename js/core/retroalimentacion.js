(function (root) {
  "use strict";

  const Validation = root.TrigValidation || {};

  function defaultCorrectRenderer() {
    return '<div class="feedback-title">Correcto</div>';
  }

  function defaultIncorrectRenderer(context) {
    const tag = context && context.validation ? context.validation.errorTag : "";
    return `<div class="feedback-title">Incorrecto</div><p>${tag}</p>`;
  }

  function buildFeedbackHtml(exercise, chosen, renderers) {
    const hooks = renderers || {};
    const validation = hooks.validation
      ? hooks.validation
      : Validation.validateMultipleChoice && chosen
        ? Validation.validateMultipleChoice(exercise, chosen.id)
        : {
            isCorrect: Boolean(chosen && chosen.isCorrect),
            selectedOption: chosen || null,
            errorTag: chosen ? chosen.errorTag : "",
          };
    const context = {
      exercise,
      chosen: validation.selectedOption || chosen,
      validation,
    };

    if (validation.isCorrect) {
      return (hooks.correct || defaultCorrectRenderer)(context);
    }
    return (hooks.incorrect || defaultIncorrectRenderer)(context);
  }

  root.TrigFeedbackEngine = {
    buildFeedbackHtml,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigFeedbackEngine;
  }
})(typeof window !== "undefined" ? window : globalThis);
