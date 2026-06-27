(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../math-renderer.js");
    require("./datos.js");
    require("./formato.js");
    require("./feedback.js");
    require("./derivacion.js");
  }

  const MathRenderer = root.TrigMathRenderer || {};
  const Data = root.TrigLinearData || {};
  const Format = root.TrigLinearFormat || {};
  const Feedback = root.TrigLinearFeedback || {};
  const Derivation = root.TrigLinearDerivation || {};
  const { TRIG_LINEAR_RENDERER_ID } = Data;
  const {
    integralPlain,
    integralLatex,
    expressionPlain,
    expressionLatex,
    familyLabelExpression,
    formulaCatalog,
    errorExampleMath,
  } = Format;
  const { feedbackContent } = Feedback;
  const { derivationContent } = Derivation;

  function registerLinearRenderer() {
    if (!MathRenderer.registerRenderer) {
      return;
    }
    MathRenderer.registerRenderer({
      id: TRIG_LINEAR_RENDERER_ID,
      serializeIntegral(exercise) {
        return {
          plain: integralPlain(exercise),
          latex: integralLatex(exercise),
        };
      },
      serializeOption(option) {
        return {
          plain: option.displayPlain || expressionPlain(option),
          latex: option.displayLatex || expressionLatex(option),
        };
      },
      renderFeedbackContent(exercise, chosen) {
        return feedbackContent(exercise, chosen);
      },
      renderDerivationContent(exercise) {
        return derivationContent(exercise);
      },
      renderFamilyLabel(family) {
        return familyLabelExpression(family);
      },
      renderFormulaCatalog() {
        return formulaCatalog();
      },
      renderErrorExampleMath(example) {
        return errorExampleMath(example);
      },
    });
  }

  root.TrigLinearRenderer = { registerLinearRenderer };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearRenderer;
  }
})(typeof window !== "undefined" ? window : globalThis);
