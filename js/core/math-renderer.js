(function (root) {
  "use strict";

  const renderers = {};
  let defaultRendererId = "";

  function standardExpression(value) {
    if (typeof value === "string") {
      return { plain: value, latex: value, html: value };
    }
    const source = value && typeof value === "object" ? value : {};
    const plain = source.plain || source.displayPlain || source.value || "";
    const latex = source.latex || source.displayLatex || plain;
    const html = source.html || source.displayHtml || latex || plain;
    return { plain, latex, html };
  }

  function registerRenderer(renderer) {
    if (!renderer || typeof renderer.id !== "string" || !renderer.id) {
      throw new Error("El renderizador matematico debe exponer un id.");
    }
    renderers[renderer.id] = renderer;
    if (!defaultRendererId) {
      defaultRendererId = renderer.id;
    }
    return renderer;
  }

  function getRenderer(id) {
    return renderers[id || defaultRendererId] || null;
  }

  function callRenderer(id, hook, fallbackValue, ...args) {
    const renderer = getRenderer(id);
    if (renderer && typeof renderer[hook] === "function") {
      return renderer[hook](...args);
    }
    return fallbackValue;
  }

  function expressionForOption(option, rendererId) {
    const fallback = standardExpression({
      plain: option.displayPlain || option.displayExpression || option.value || "",
      latex: option.displayLatex || option.displayPlain || option.value || "",
      html: option.displayHtml || option.displayLatex || option.displayPlain || "",
    });
    return standardExpression(
      callRenderer(rendererId || option.rendererId, "renderOption", fallback, option),
    );
  }

  function integralForExercise(exercise, rendererId) {
    const fallback = standardExpression(
      exercise.integralShown || {
        plain: exercise.integrandExpression || "",
        latex: exercise.integrandLatex || exercise.integrandExpression || "",
        html: exercise.integrandHtml || "",
      },
    );
    return standardExpression(
      callRenderer(
        rendererId || exercise.rendererId,
        "renderIntegral",
        fallback,
        exercise,
      ),
    );
  }

  function feedbackHtml(exercise, chosen, context) {
    return callRenderer(
      exercise && exercise.rendererId,
      "renderFeedbackHtml",
      "",
      exercise,
      chosen,
      context || {},
    );
  }

  function derivationHtml(exercise) {
    return callRenderer(
      exercise && exercise.rendererId,
      "renderDerivationHtml",
      "",
      exercise,
    );
  }

  function familyLabelHtml(family, rendererId) {
    return callRenderer(rendererId, "renderFamilyLabelHtml", "", family);
  }

  function formulaCatalog(rendererId, context) {
    return callRenderer(rendererId, "renderFormulaCatalog", [], context || {});
  }

  function errorExampleMathHtml(rendererId, example) {
    return callRenderer(rendererId, "renderErrorExampleMathHtml", null, example);
  }

  root.TrigMathRenderer = {
    standardExpression,
    registerRenderer,
    getRenderer,
    expressionForOption,
    integralForExercise,
    feedbackHtml,
    derivationHtml,
    familyLabelHtml,
    formulaCatalog,
    errorExampleMathHtml,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigMathRenderer;
  }
})(typeof window !== "undefined" ? window : globalThis);
