(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../validacion.js");
    require("../../retroalimentacion.js");
    require("./formato.js");
    require("./formulas.js");
  }

  const FeedbackEngine = root.TrigFeedbackEngine || {};
  const Validation = root.TrigValidation || {};
  const Format = root.TrigAlgebraicLinearFormat || {};
  const Formulas = root.TrigAlgebraicLinearFormulas || {};
  const {
    rationalPlain,
    rationalLatex,
    mathInline,
    mathBlock,
    contentNode,
    expressionLatex,
    integralLatex,
  } = Format;
  const { errorLabelContent, generalRuleLatex, logarithmicRuleLatex } = Formulas;

  function feedbackVariables(exercise, chosen) {
    const selected = chosen || {};
    const correctExpressionLatex =
      exercise.correctAnswer.displayLatex || expressionLatex(exercise.correctAnswer);
    const chosenExpressionLatex = selected.displayLatex
      ? selected.displayLatex
      : selected.coefficient
        ? expressionLatex(selected)
        : "";
    const ruleLatex =
      exercise.answerKind === "log" ? logarithmicRuleLatex() : generalRuleLatex();
    return {
      A: rationalPlain(exercise.A),
      ALatex: rationalLatex(exercise.A),
      AMath: mathInline(rationalLatex(exercise.A), rationalPlain(exercise.A)),
      k: rationalPlain(exercise.k),
      kLatex: rationalLatex(exercise.k),
      kMath: mathInline(rationalLatex(exercise.k), rationalPlain(exercise.k)),
      b: rationalPlain(exercise.b),
      bLatex: rationalLatex(exercise.b),
      bMath: mathInline(rationalLatex(exercise.b), rationalPlain(exercise.b)),
      n: String(exercise.n),
      nMath: mathInline(String(exercise.n)),
      u: exercise.argument.display,
      uLatex: exercise.argument.displayLatex,
      uMath: mathInline(exercise.argument.displayLatex, exercise.argument.display),
      currentIntegral: exercise.integrandExpression,
      currentIntegralLatex: exercise.integrandLatex,
      currentIntegralMath: mathInline(exercise.integrandLatex, exercise.integrandExpression),
      ruleMath: mathBlock(ruleLatex),
      correctCoefficient: rationalPlain(exercise.correctCoefficient),
      correctCoefficientLatex: rationalLatex(exercise.correctCoefficient),
      correctCoefficientMath: mathInline(
        rationalLatex(exercise.correctCoefficient),
        rationalPlain(exercise.correctCoefficient),
      ),
      correctExpression: exercise.correctAnswer.displayExpression,
      correctExpressionLatex,
      correctExpressionMath: mathInline(
        correctExpressionLatex,
        exercise.correctAnswer.displayExpression,
      ),
      chosenExpression: selected.displayExpression || "",
      chosenExpressionLatex,
      chosenExpressionMath: chosenExpressionLatex
        ? mathInline(chosenExpressionLatex, selected.displayExpression || "")
        : "",
    };
  }

  function valueLine(label, value) {
    return contentNode("div", "", [
      contentNode("strong", "", [label]),
      contentNode("span", "", [value]),
    ]);
  }

  function reconstructionContent(exercise, vars) {
    return contentNode("div", "reconstruction", [
      contentNode("span", "section-label", ["Para este ejercicio"]),
      contentNode("div", "feedback-values", [
        valueLine("A", vars.AMath),
        valueLine("k", vars.kMath),
        valueLine("b", vars.bMath),
        valueLine("n", vars.nMath),
        valueLine("u", vars.uMath),
      ]),
      contentNode("div", "rule-box", [
        contentNode("p", "", ["Regla aplicable:"]),
        contentNode("div", "centered-formula", [vars.ruleMath]),
        contentNode("p", "", ["Resultado correcto:"]),
        contentNode("div", "centered-formula", [vars.correctExpressionMath]),
      ]),
    ]);
  }

  function incorrectDetailsContent(context) {
    return [
      contentNode("div", "divider", []),
      reconstructionContent(context.exercise, context.variables || {}),
    ];
  }

  function buildAlgebraicFeedbackRules() {
    return [
      {
        id: "algebraic-linear-correct",
        errorType: "correct",
        errorTag: "correct",
        title: "Correcto",
        message: [
          "Aplicaste la regla de argumento lineal con u = ",
          { var: "uMath" },
          " y compensaste u' = ",
          { var: "kMath" },
          ".",
        ],
        hint: [contentNode("strong", "math-inline", [{ var: "correctExpressionMath" }])],
      },
      {
        id: "algebraic-linear-forgot-chain-factor",
        errorType: "forgot-chain-factor",
        errorTag: "forgot-chain-factor",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "La potencia o el logaritmo base esta bien encaminado, pero falta compensar la derivada del argumento. Como u' = ",
          { var: "kMath" },
          ", el coeficiente debe dividirse entre k.",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "algebraic-linear-wrong-power-exponent",
        errorType: "wrong-power-exponent",
        errorTag: "wrong-power-exponent",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "En la regla de potencia el exponente aumenta en 1. Para n = ",
          { var: "nMath" },
          ", la respuesta usa n + 1.",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "algebraic-linear-used-power-rule-for-log",
        errorType: "used-power-rule-for-log",
        errorTag: "used-power-rule-for-log",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "Cuando n = -1 no se usa la formula de potencia. El caso correcto es logaritmico: ln del valor absoluto del argumento.",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "algebraic-linear-copied-integrand",
        errorType: "copied-integrand",
        errorTag: "copied-integrand",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "La respuesta conserva la forma del integrando. Integrar requiere una antiderivada cuya derivada regrese a ",
          { var: "currentIntegralMath" },
          ".",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "algebraic-linear-lost-argument-shift",
        errorType: "lost-argument-shift",
        errorTag: "lost-argument-shift",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "El argumento debe conservarse completo. Aqui u = ",
          { var: "uMath" },
          ", incluyendo el termino independiente.",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "algebraic-linear-lost-external-sign",
        errorType: "lost-external-sign",
        errorTag: "lost-external-sign",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "El signo de A tambien forma parte del coeficiente final. En este ejercicio A = ",
          { var: "AMath" },
          ".",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "algebraic-linear-sign-error",
        errorType: "sign-error",
        errorTag: "sign-error",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "El signo final no coincide. Revisa el signo de A, de k y de n + 1 si estas usando regla de potencia.",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "algebraic-linear-generic-coefficient-error",
        errorType: "generic-coefficient-error",
        errorTag: "generic-coefficient-error",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "La forma general es correcta, pero el coeficiente debe ser ",
          { var: "correctCoefficientMath" },
          ".",
        ],
        details: incorrectDetailsContent,
      },
    ];
  }

  function defaultFallbackFeedbackContent(exercise, chosen) {
    const vars = feedbackVariables(exercise, chosen);
    if (!chosen || chosen.isCorrect) {
      return [
        contentNode("div", "feedback-title", ["Correcto"]),
        contentNode("p", "", ["Resultado: ", vars.correctExpressionMath]),
      ];
    }
    return [
      contentNode("div", "feedback-title", [
        "Incorrecto: ",
        ...errorLabelContent(chosen.errorTag),
      ]),
      ...incorrectDetailsContent({ exercise, variables: vars }),
    ];
  }

  function validateAnswer(exercise, optionId) {
    if (Validation.validateAnswer) {
      return Validation.validateAnswer(exercise, optionId);
    }
    if (Validation.validateMultipleChoice) {
      return Validation.validateMultipleChoice(exercise, optionId);
    }
    const chosen = exercise.options.find((option) => option.id === optionId);
    return {
      isValid: Boolean(chosen),
      isCorrect: Boolean(chosen && chosen.isCorrect),
      selectedOption: chosen || null,
      errorTag: chosen ? chosen.errorTag : "invalid-option",
      errorType: chosen ? chosen.errorType || chosen.errorTag : "invalid-option",
      stats: exercise.statsInfo || {},
    };
  }

  function feedbackContent(exercise, chosen) {
    if (FeedbackEngine.buildFeedbackContent) {
      const validation = chosen ? validateAnswer(exercise, chosen.id) : null;
      const variables = feedbackVariables(
        exercise,
        validation && validation.selectedOption
          ? validation.selectedOption
          : chosen,
      );
      const errorTag =
        (validation && validation.errorTag) ||
        (chosen && chosen.errorTag) ||
        "generic-coefficient-error";
      variables.errorLabelContent = errorLabelContent(errorTag);
      return FeedbackEngine.buildFeedbackContent(exercise, chosen, {
        validation,
        variables,
        rules: exercise.feedbackRules || buildAlgebraicFeedbackRules(),
      });
    }
    return defaultFallbackFeedbackContent(exercise, chosen);
  }

  root.TrigAlgebraicLinearFeedback = {
    feedbackVariables,
    valueLine,
    reconstructionContent,
    incorrectDetailsContent,
    buildAlgebraicFeedbackRules,
    defaultFallbackFeedbackContent,
    feedbackContent,
    validateAnswer,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearFeedback;
  }
})(typeof window !== "undefined" ? window : globalThis);
