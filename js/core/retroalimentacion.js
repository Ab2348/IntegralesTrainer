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

  function interpolate(value, variables) {
    const source = String(value || "");
    const data = variables || {};
    return source.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) =>
      Object.prototype.hasOwnProperty.call(data, key) ? data[key] : match,
    );
  }

  function findFeedbackRule(rules, validation) {
    const source = Array.isArray(rules) ? rules : [];
    const errorType =
      (validation && validation.errorType) ||
      (validation && validation.errorTag) ||
      "unknown";
    return (
      source.find((rule) => rule.errorType === errorType) ||
      source.find((rule) => rule.errorTag === errorType) ||
      source.find((rule) => validation && validation.isCorrect && rule.errorType === "correct") ||
      null
    );
  }

  function renderRuleHtml(rule, context) {
    if (!rule) {
      return "";
    }
    const variables = context.variables || {};
    const title =
      interpolate(rule.titleHtml || rule.title, variables) ||
      (context.validation && context.validation.isCorrect
        ? "Correcto"
        : "Incorrecto");
    const message = interpolate(rule.messageHtml || rule.message, variables);
    const hint = interpolate(rule.hintHtml || rule.hint, variables);
    const details =
      typeof rule.detailsHtml === "function"
        ? rule.detailsHtml(context)
        : interpolate(rule.detailsHtml || "", variables);

    return [
      `<div class="feedback-title">${title}</div>`,
      message ? `<p>${message}</p>` : "",
      hint ? `<p>${hint}</p>` : "",
      details || "",
    ].join("");
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
      variables: hooks.variables || {},
      rules: hooks.rules || (exercise && exercise.feedbackRules) || [],
    };
    const rule = findFeedbackRule(context.rules, validation);

    if (rule) {
      return renderRuleHtml(rule, context);
    }

    if (validation.isCorrect) {
      return (hooks.correct || defaultCorrectRenderer)(context);
    }
    return (hooks.incorrect || defaultIncorrectRenderer)(context);
  }

  root.TrigFeedbackEngine = {
    buildFeedbackHtml,
    findFeedbackRule,
    renderRuleHtml,
    interpolate,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigFeedbackEngine;
  }
})(typeof window !== "undefined" ? window : globalThis);
