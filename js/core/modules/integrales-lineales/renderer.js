(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../math-renderer.js");
    require("./variantes.js");
    require("./formato.js");
    require("./formulas.js");
    require("./snapshots.js");
    require("./feedback.js");
    require("./derivacion.js");
  }

  const MathRenderer = root.TrigMathRenderer || {};
  const Variants = root.TrigLinearVariants || {};
  const Format = root.TrigLinearFormat || {};
  const Formulas = root.TrigLinearFormulas || {};
  const Snapshots = root.TrigLinearSnapshots || {};
  const Feedback = root.TrigLinearFeedback || {};
  const Derivation = root.TrigLinearDerivation || {};
  const { TRIG_LINEAR_RENDERER_ID } = Variants;
  const {
    integralPlain,
    integralLatex,
    expressionPlain,
    expressionLatex,
  } = Format;
  const {
    familyLabelExpression,
    formulaCatalog,
  } = Formulas;
  const {
    errorExampleMath,
  } = Snapshots;
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
