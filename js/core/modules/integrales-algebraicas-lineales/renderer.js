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
  const Variants = root.TrigAlgebraicLinearVariants || {};
  const Format = root.TrigAlgebraicLinearFormat || {};
  const Formulas = root.TrigAlgebraicLinearFormulas || {};
  const Snapshots = root.TrigAlgebraicLinearSnapshots || {};
  const Feedback = root.TrigAlgebraicLinearFeedback || {};
  const Derivation = root.TrigAlgebraicLinearDerivation || {};
  const { ALGEBRAIC_LINEAR_RENDERER_ID } = Variants;

  function registerAlgebraicLinearRenderer() {
    if (!MathRenderer.registerRenderer) {
      return;
    }
    MathRenderer.registerRenderer({
      id: ALGEBRAIC_LINEAR_RENDERER_ID,
      serializeIntegral(exercise) {
        return {
          plain: Format.integralPlain(exercise),
          latex: Format.integralLatex(exercise),
        };
      },
      serializeOption(option) {
        return {
          plain: option.displayPlain || Format.expressionPlain(option),
          latex: option.displayLatex || Format.expressionLatex(option),
        };
      },
      renderFeedbackContent(exercise, chosen) {
        return Feedback.feedbackContent(exercise, chosen);
      },
      renderDerivationContent(exercise) {
        return Derivation.derivationContent(exercise);
      },
      renderFamilyLabel(family) {
        return Formulas.familyLabelExpression(family);
      },
      renderFormulaCatalog() {
        return Formulas.formulaCatalog();
      },
      renderErrorExampleMath(example) {
        return Snapshots.errorExampleMath(example);
      },
    });
  }

  root.TrigAlgebraicLinearRenderer = { registerAlgebraicLinearRenderer };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearRenderer;
  }
})(typeof window !== "undefined" ? window : globalThis);
