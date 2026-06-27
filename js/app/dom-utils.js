(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  function clearElement(element) {
    if (!element) {
      return;
    }
    if (element.replaceChildren) {
      element.replaceChildren();
    } else {
      element.textContent = "";
    }
  }

  function expressionFallback(expression, fallbackText) {
    if (fallbackText !== undefined) {
      return fallbackText;
    }
    return (expression && (expression.plain || expression.latex)) || "";
  }

  function renderMathInto(Core, element, expression, options, fallbackText) {
    if (!element) {
      return;
    }
    if (Core && Core.renderInto && expression) {
      Core.renderInto(element, expression, options || {});
      return;
    }
    element.textContent = expressionFallback(expression, fallbackText);
  }

  function renderLatexInto(Core, element, latex, options) {
    renderMathInto(Core, element, { latex }, options, latex || "");
  }

  function renderContentInto(Core, element, content, fallbackText) {
    if (!element) {
      return;
    }
    if (Core && Core.renderContentInto && content) {
      Core.renderContentInto(element, content);
      return;
    }
    element.textContent = fallbackText || "";
  }

  App.DomUtils = {
    clearElement,
    renderContentInto,
    renderLatexInto,
    renderMathInto,
  };
})(typeof window !== "undefined" ? window : globalThis);
